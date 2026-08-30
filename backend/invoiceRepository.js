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
};

module.exports = invoiceRepository;
