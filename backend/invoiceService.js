const pool = require("./db"); // Import our raw pool to manage the transaction loop
const invoiceRepository = require("./invoiceRepository");

const invoiceService = {
  // ⚡ UPDATED STAGE 3: Packs parent entries and multi-row items into an atomic multi-tenant transaction
  async createFullInvoice(
    activeUserId,
    clientId,
    invoiceNumber,
    dueDate,
    items,
  ) {
    // 1. Borrow a clean, dedicated network wire from our connection pool
    const client = await pool.connect();

    try {
      // 2. Start the safety blanket: Begin the SQL Transaction
      await client.query("BEGIN");

      // 3. Step 1: Save the invoice container row including the new user_id column lock
      const queryTextInvoice = ` 
                INSERT INTO invoices (user_id, client_id, invoice_number, due_date, status) 
                VALUES ($1, $2, $3, $4, 'pending') 
                RETURNING * 
            `;
      const invoiceResult = await client.query(queryTextInvoice, [
        activeUserId, // ◄── Master Multi-Tenant Lock!
        clientId,
        invoiceNumber,
        dueDate,
      ]);
      const [newInvoice] = invoiceResult.rows;

      // 4. Step 2: Loop through every single line item and save them
      const savedItems = [];
      for (const item of items) {
        const queryTextItem = ` 
                    INSERT INTO invoice_items (invoice_id, description, quantity, unit_amount_cents) 
                    VALUES ($1, $2, $3, $4) 
                    RETURNING * 
                `;
        // Calculate whole integer cents to avoid decimal rounding errors
        const amountInCents = Math.round(item.price * 100);
        const itemResult = await client.query(queryTextItem, [
          newInvoice.id, // Links this item directly to our new invoice container id!
          item.description,
          item.quantity,
          amountInCents,
        ]);
        savedItems.push(itemResult.rows[0]);
      }

      // 5. SUCCESS: If we reached this line without an error, save everything permanently!
      await client.query("COMMIT");

      // Return the stitched-together document data object
      return {
        ...newInvoice,
        items: savedItems,
      };
    } catch (error) {
      // 6. FAILURE: If anything broke, erase all changes made during this block immediately!
      await client.query("ROLLBACK");
      console.error(
        "❌ INVOICE TRANSACTION FAILED - ROLLED BACK:",
        error.message,
      );
      throw error;
    } finally {
      // 7. CRUCIAL: Always hand the network wire back to the pool so other users can use it
      client.release();
    }
  },

  // ⚡ UPDATED STAGE 3: Marks an invoice as PAID only if it belongs to the requesting tenant
  async settleInvoiceBalance(invoiceId, activeUserId) {
    if (!invoiceId || !activeUserId) {
      throw new Error("Missing required transaction processing variables");
    }

    // SECURITY CHECK: Verify that the invoice belongs to this user before updating it
    const existingInvoice = await invoiceRepository.findById(invoiceId);
    if (!existingInvoice) {
      throw new Error(
        "Target transactional record not found inside database pools.",
      );
    }
    if (existingInvoice.user_id !== activeUserId) {
      throw new Error(
        "Access Forbidden: You do not possess structural ownership permissions for this record.",
      );
    }

    const updatedInvoice = await invoiceRepository.updateStatus(
      invoiceId,
      "paid",
    );
    return updatedInvoice;
  },

  // ⚡ UPDATED STAGE 3: Pass activeUserId down to pull only this user's rows
  async getAllInvoices(activeUserId) {
    if (!activeUserId)
      throw new Error("Authentication credential token required.");
    return await invoiceRepository.findAll(activeUserId);
  },
};

module.exports = invoiceService;
