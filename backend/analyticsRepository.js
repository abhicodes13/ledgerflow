const pool = require("./db");

const analyticsRepository = {
  // All figures are scoped to one user. Money is in integer cents.
  // "Overdue" is computed (pending and past the due date), never stored.
  async getOverviewMetrics(activeUserId) {
    if (!activeUserId) throw new Error("userId is required");

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
};

module.exports = analyticsRepository;
