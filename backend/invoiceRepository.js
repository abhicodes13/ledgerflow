const pool = require("./db");

function requireUserId(userId) {
  if (!userId) throw new Error("userId is required for this query");
}

const invoiceRepository = {
  // Scoped to the owner: returns undefined if the invoice isn't theirs
  async findById(invoiceId, userId, db = pool) {
    requireUserId(userId);
    const result = await db.query(
      "SELECT * FROM invoices WHERE id = $1 AND user_id = $2",
      [invoiceId, userId],
    );
    return result.rows[0];
  },

  async findAll(userId, filters = {}, db = pool) {
    requireUserId(userId);
    const { status, overdue, clientId, dueBefore } = filters;
    const limit = Math.min(Number(filters.limit) || 200, 500);
    const offset = Number(filters.offset) || 0;

    const params = [userId];
    const where = ["i.user_id = $1"];
    if (status) {
      params.push(status);
      where.push(`i.status = $${params.length}`);
    }
    if (overdue) {
      where.push("(i.status = 'pending' AND i.due_date < CURRENT_DATE)");
    }
    if (clientId) {
      params.push(clientId);
      where.push(`i.client_id = $${params.length}`);
    }
    if (dueBefore) {
      params.push(dueBefore);
      where.push(`i.due_date < $${params.length}`);
    }
    params.push(limit, offset);

    const result = await db.query(
      `SELECT i.id, i.invoice_number, i.status, i.due_date, i.paid_at, i.last_notified_at,
              i.client_id, c.name AS client_name, c.email AS client_email,
              c.phone_number AS client_phone,
              (i.status = 'pending' AND i.due_date < CURRENT_DATE) AS is_overdue,
              COALESCE(SUM(ui.quantity * ui.unit_amount_cents), 0)::INT AS total_amount_cents
       FROM invoices i
       JOIN clients c ON c.id = i.client_id AND c.user_id = i.user_id
       LEFT JOIN invoice_items ui ON ui.invoice_id = i.id
       WHERE ${where.join(" AND ")}
       GROUP BY i.id, c.id
       ORDER BY i.id DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return result.rows;
  },

  async createInvoice(
    activeUserId,
    clientId,
    invoiceNumber,
    dueDate,
    db = pool,
  ) {
    const result = await db.query(
      `INSERT INTO invoices (user_id, client_id, invoice_number, due_date, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [activeUserId, clientId, invoiceNumber, dueDate],
    );
    return result.rows[0];
  },

  async createItem(
    invoiceId,
    description,
    quantity,
    unitAmountCents,
    db = pool,
  ) {
    const result = await db.query(
      `INSERT INTO invoice_items (invoice_id, description, quantity, unit_amount_cents)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [invoiceId, description, quantity, unitAmountCents],
    );
    return result.rows[0];
  },

  // One atomic statement: only the owner's pending invoice can become paid
  async markPaid(invoiceId, userId, db = pool) {
    requireUserId(userId);
    const result = await db.query(
      `UPDATE invoices
       SET status = 'paid', paid_at = now(), updated_at = now()
       WHERE id = $1 AND user_id = $2 AND status = 'pending'
       RETURNING *`,
      [invoiceId, userId],
    );
    return result.rows[0];
  },
};

module.exports = invoiceRepository;
