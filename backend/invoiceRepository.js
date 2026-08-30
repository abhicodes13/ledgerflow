const pool = require("./db");

const invoiceRepository = {
  // 1. Create a brand new Invoice container row
  async createInvoice(clientId, invoiceNumber, dueDate) {
    const queryText = `
            INSERT INTO invoices (client_id, invoice_number, due_date, status) 
            VALUES ($1, $2, $3, 'pending') 
            RETURNING *
        `;
    const values = [clientId, invoiceNumber, dueDate];
    const result = await pool.query(queryText, values);

    const [newInvoice] = result.rows;
    return newInvoice;
  },

  // 2. Add an individual line charge item inside that invoice container
  async createItem(invoiceId, description, quantity, unitAmountCents) {
    const queryText = `
            INSERT INTO invoice_items (invoice_id, description, quantity, unit_amount_cents) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *
        `;
    const values = [invoiceId, description, quantity, unitAmountCents];
    const result = await pool.query(queryText, values);

    const [newItem] = result.rows;
    return newItem;
  },
  async updateStatus(invoiceId, status) {
    const queryText = `UPDATE invoices
    SET status = $2 WHERE id = $1 RETURNING *`;
    const result = await pool.query(queryText, [invoiceId, status]);
    const [updatedInvoice] = result.rows;
    return updatedInvoice;
  },
  async findAll() {
    const queryText = `SELECT 
    i.id,
    i.invoice_number,
    i.status,
    i.due_date,
    c.name as client_name,
    COALESCE(SUM(ui.quantity * ui.unit_amount_cents),0)::INT as total_amount_cents
    FROM invoices i 
    JOIN clients c ON i.client_id = c.id 
    LEFT JOIN invoice_items ui ON i.id = ui.invoice_id 
    GROUP BY i.id, c.name 
    ORDER BY i.id DESC `;
    const result = await pool.query(queryText);
    return result.rows;
  },
};

module.exports = invoiceRepository;
