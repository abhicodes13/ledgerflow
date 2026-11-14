const pool = require("./db");

// Every figure here is scoped to one user. Money is in integer cents.
// "Overdue" is computed (pending and past the due date), never stored.
// Void invoices never count toward totals.

function requireUserId(userId) {
  if (!userId) throw new Error("userId is required");
}

// Makes % and _ in user text match literally inside ILIKE
const escapeLike = (s) => String(s).replace(/[\\%_]/g, "\\$&");

const AGING_BUCKETS = [
  { key: "current", label: "Not yet due" },
  { key: "d1_30", label: "1-30 days overdue" },
  { key: "d31_60", label: "31-60 days overdue" },
  { key: "d61_90", label: "61-90 days overdue" },
  { key: "d90_plus", label: "Over 90 days overdue" },
];

// Only these can be used to sort (the value goes into the SQL text, so it
// must come from this list and never from the caller)
const CLIENT_SORTS = {
  outstanding: "outstanding_cents",
  overdue: "overdue_cents",
  paid: "paid_cents",
  invoices: "invoice_count",
};

// Some databases may not have invoices.created_at; look once and remember
let invoicesHaveCreatedAt;
async function hasInvoiceCreatedAt() {
  if (invoicesHaveCreatedAt === undefined) {
    const result = await pool.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = 'invoices' AND column_name = 'created_at'`,
    );
    invoicesHaveCreatedAt = result.rowCount > 0;
  }
  return invoicesHaveCreatedAt;
}

const analyticsRepository = {
  async getOverviewMetrics(activeUserId) {
    requireUserId(activeUserId);

    const result = await pool.query(
      `SELECT
         COALESCE(SUM(ii.quantity * ii.unit_amount_cents)
           FILTER (WHERE i.status = 'pending'), 0)::INT AS total_outstanding_cents,
         COALESCE(SUM(ii.quantity * ii.unit_amount_cents)
           FILTER (WHERE i.status = 'pending' AND i.due_date < CURRENT_DATE), 0)::INT AS total_overdue_cents,
         COALESCE(SUM(ii.quantity * ii.unit_amount_cents)
           FILTER (WHERE i.status = 'paid'), 0)::INT AS total_collected_cents,
         COALESCE(SUM(ii.quantity * ii.unit_amount_cents)
           FILTER (WHERE i.status = 'paid' AND i.paid_at >= date_trunc('month', now())), 0)::INT AS collected_this_month_cents,
         COUNT(DISTINCT i.id)
           FILTER (WHERE i.status = 'pending')::INT AS pending_invoices_count,
         COUNT(DISTINCT i.id)
           FILTER (WHERE i.status = 'pending' AND i.due_date < CURRENT_DATE)::INT AS overdue_invoices_count,
         (SELECT COUNT(*)::INT FROM clients
           WHERE user_id = $1 AND archived_at IS NULL) AS total_clients_count
       FROM invoices i
       LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
       WHERE i.user_id = $1`,
      [activeUserId],
    );
    return result.rows[0];
  },

  // Unpaid invoices grouped by how late they are. Always returns all five
  // buckets (zeros included), oldest last.
  async getAgingReport(activeUserId) {
    requireUserId(activeUserId);

    const result = await pool.query(
      `WITH open_invoices AS (
         SELECT i.id, i.due_date,
                COALESCE(SUM(ii.quantity * ii.unit_amount_cents), 0)::BIGINT AS total_cents
         FROM invoices i
         LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
         WHERE i.user_id = $1 AND i.status = 'pending'
         GROUP BY i.id
       )
       SELECT CASE
                WHEN CURRENT_DATE - due_date <= 0 THEN 'current'
                WHEN CURRENT_DATE - due_date <= 30 THEN 'd1_30'
                WHEN CURRENT_DATE - due_date <= 60 THEN 'd31_60'
                WHEN CURRENT_DATE - due_date <= 90 THEN 'd61_90'
                ELSE 'd90_plus'
              END AS bucket,
              COUNT(*)::INT AS invoice_count,
              SUM(total_cents)::BIGINT AS total_cents
       FROM open_invoices
       GROUP BY 1`,
      [activeUserId],
    );

    const byKey = new Map(result.rows.map((r) => [r.bucket, r]));
    const buckets = AGING_BUCKETS.map((b) => ({
      key: b.key,
      label: b.label,
      invoice_count: Number(byKey.get(b.key)?.invoice_count ?? 0),
      total_cents: Number(byKey.get(b.key)?.total_cents ?? 0),
    }));

    const overdue = buckets.filter((b) => b.key !== "current");
    return {
      buckets,
      open_invoice_count: buckets.reduce((s, b) => s + b.invoice_count, 0),
      total_open_cents: buckets.reduce((s, b) => s + b.total_cents, 0),
      overdue_invoice_count: overdue.reduce((s, b) => s + b.invoice_count, 0),
      overdue_cents: overdue.reduce((s, b) => s + b.total_cents, 0),
    };
  },

  // One row per client: what they owe, what they've paid, and how they pay.
  // avg_days_vs_due is the average of (paid date - due date) over their paid
  // invoices: positive = paid after the due date, negative = paid early,
  // null = no paid invoices yet.
  async getClientSummary(activeUserId, options = {}) {
    requireUserId(activeUserId);

    const sortColumn = CLIENT_SORTS[options.sortBy] || CLIENT_SORTS.outstanding;
    const limit = Math.min(
      Math.max(Math.floor(Number(options.limit)) || 5, 1),
      20,
    );
    const name =
      typeof options.clientName === "string" ? options.clientName.trim() : "";

    const params = [activeUserId];
    let nameFilter = "";
    if (name) {
      params.push(`%${escapeLike(name)}%`);
      nameFilter = `AND c.name ILIKE $${params.length} ESCAPE '\\'`;
    }
    params.push(limit);

    const result = await pool.query(
      `WITH inv AS (
         SELECT i.id, i.client_id, i.status, i.due_date, i.paid_at,
                COALESCE(SUM(ii.quantity * ii.unit_amount_cents), 0)::BIGINT AS total_cents
         FROM invoices i
         LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
         WHERE i.user_id = $1 AND i.status <> 'void'
         GROUP BY i.id
       )
       SELECT c.id, c.name,
              COALESCE(SUM(inv.total_cents) FILTER (WHERE inv.status = 'pending'), 0)::BIGINT AS outstanding_cents,
              COALESCE(SUM(inv.total_cents) FILTER (WHERE inv.status = 'pending' AND inv.due_date < CURRENT_DATE), 0)::BIGINT AS overdue_cents,
              COALESCE(SUM(inv.total_cents) FILTER (WHERE inv.status = 'paid'), 0)::BIGINT AS paid_cents,
              COUNT(inv.id)::INT AS invoice_count,
              COUNT(inv.id) FILTER (WHERE inv.status = 'pending')::INT AS open_count,
              ROUND(AVG(inv.paid_at::date - inv.due_date)
                FILTER (WHERE inv.status = 'paid' AND inv.paid_at IS NOT NULL), 1) AS avg_days_vs_due
       FROM clients c
       LEFT JOIN inv ON inv.client_id = c.id
       WHERE c.user_id = $1 AND c.archived_at IS NULL ${nameFilter}
       GROUP BY c.id, c.name
       ORDER BY ${sortColumn} DESC, c.name
       LIMIT $${params.length}`,
      params,
    );

    let rows = result.rows.map((r) => ({
      client_id: r.id,
      name: r.name,
      outstanding_cents: Number(r.outstanding_cents),
      overdue_cents: Number(r.overdue_cents),
      paid_cents: Number(r.paid_cents),
      invoice_count: Number(r.invoice_count),
      open_count: Number(r.open_count),
      avg_days_vs_due:
        r.avg_days_vs_due === null ? null : Number(r.avg_days_vs_due),
    }));

    // "Who owes me the most?" should not list clients who owe nothing
    if (
      !name &&
      (sortColumn === "outstanding_cents" || sortColumn === "overdue_cents")
    ) {
      rows = rows.filter((r) => r[sortColumn] > 0);
    }
    return rows;
  },

  // Totals per calendar month, oldest first, for the last N months (1 to 24).
  // collected = invoices marked paid that month. invoiced = invoices created
  // that month (null if this database has no invoices.created_at).
  async getRevenueByPeriod(activeUserId, months = 6) {
    requireUserId(activeUserId);

    const count = Math.min(Math.max(Math.floor(Number(months)) || 6, 1), 24);
    const withCreated = await hasInvoiceCreatedAt();

    const result = await pool.query(
      `WITH months AS (
         SELECT date_trunc('month', CURRENT_DATE) - make_interval(months => g) AS m
         FROM generate_series(0, $2::int - 1) AS g
       ),
       inv AS (
         SELECT i.id, i.status, i.paid_at${withCreated ? ", i.created_at" : ""},
                COALESCE(SUM(ii.quantity * ii.unit_amount_cents), 0)::BIGINT AS total_cents
         FROM invoices i
         LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
         WHERE i.user_id = $1 AND i.status <> 'void'
         GROUP BY i.id
       )
       SELECT to_char(months.m, 'YYYY-MM') AS month,
              ${
                withCreated
                  ? "COALESCE(SUM(inv.total_cents) FILTER (WHERE date_trunc('month', inv.created_at) = months.m), 0)::BIGINT"
                  : "NULL::BIGINT"
              } AS invoiced_cents,
              COALESCE(SUM(inv.total_cents) FILTER (
                WHERE inv.status = 'paid' AND date_trunc('month', inv.paid_at) = months.m), 0)::BIGINT AS collected_cents
       FROM months
       LEFT JOIN inv ON true
       GROUP BY months.m
       ORDER BY months.m`,
      [activeUserId, count],
    );

    return result.rows.map((r) => ({
      month: r.month, // "2026-11"
      invoiced_cents:
        r.invoiced_cents === null ? null : Number(r.invoiced_cents),
      collected_cents: Number(r.collected_cents),
    }));
  },
};

module.exports = analyticsRepository;
