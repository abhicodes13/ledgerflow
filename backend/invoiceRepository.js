const pool = require("./db");

const invoiceRepository = {
  // ⚡ FETCH ONE: Looks up an invoice container to verify multi-tenant ownership boundaries
  async findById(invoiceId) {
    const queryText = "SELECT * FROM invoices WHERE id = $1;";
    try {
      const result = await pool.query(queryText, [invoiceId]);
      const [invoice] = result.rows; // Cleanly pulls the single object row wrapper
      return invoice;
    } catch (error) {
      throw new Error(
        `Failed to perform secure invoice query lookup: ${error.message}`,
      );
    }
  },

  // ⚡ FETCH ALL: Pulls records *only* belonging to the logged-in account manager account
  async findAll(activeUserId) {
    // FENCES ENFORCED: Injected the i.user_id = $1 condition parameter
    const queryText = `
            SELECT i.id, i.invoice_number, i.status, i.due_date, c.name as client_name, 
                   COALESCE(SUM(ui.quantity * ui.unit_amount_cents),0)::INT as total_amount_cents 
            FROM invoices i 
            JOIN clients c ON i.client_id = c.id 
            LEFT JOIN invoice_items ui ON i.id = ui.invoice_id 
            WHERE i.user_id = $1
            GROUP BY i.id, c.name 
            ORDER BY i.id DESC
        `;
    try {
      const result = await pool.query(queryText, [activeUserId]);
      return result.rows;
    } catch (error) {
      throw new Error(
        `Failed to load transaction ledger records: ${error.message}`,
      );
    }
  },

  // UPDATE STATUS: Flips invoice status columns safely
  async updateStatus(invoiceId, status) {
    const queryText = `UPDATE invoices SET status = $2 WHERE id = $1 RETURNING *`;
    try {
      const result = await pool.query(queryText, [invoiceId, status]);
      const [updatedInvoice] = result.rows;
      return updatedInvoice;
    } catch (error) {
      throw new Error(
        `Failed to update financial asset state: ${error.message}`,
      );
    }
  },

  // STANDALONE CREATOR REFERENCE: Upgraded fallback container route to map multi-tenant keys
  async createInvoice(activeUserId, clientId, invoiceNumber, dueDate) {
    const queryText = `
            INSERT INTO invoices (user_id, client_id, invoice_number, due_date, status) 
            VALUES ($1, $2, $3, $4, 'pending') 
            RETURNING * 
        `;
    try {
      const result = await pool.query(queryText, [
        activeUserId,
        clientId,
        invoiceNumber,
        dueDate,
      ]);
      const [newInvoice] = result.rows;
      return newInvoice;
    } catch (error) {
      throw new Error(
        `Failed to insert standalone invoice container: ${error.message}`,
      );
    }
  },

  // STANDALONE CHILD ITEM REFERENCE: Unchanged structure (inherits bounds via parent container)
  async createItem(invoiceId, description, quantity, unitAmountCents) {
    const queryText = `
            INSERT INTO invoice_items (invoice_id, description, quantity, unit_amount_cents) 
            VALUES ($1, $2, $3, $4) 
            RETURNING * 
        `;
    try {
      const result = await pool.query(queryText, [
        invoiceId,
        description,
        quantity,
        unitAmountCents,
      ]);
      const [newItem] = result.rows;
      return newItem;
    } catch (error) {
      throw new Error(`Failed to insert line invoice item: ${error.message}`);
    }
  },
};

module.exports = invoiceRepository;
