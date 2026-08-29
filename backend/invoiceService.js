const pool = require("./db"); // Import our raw pool to manage the transaction loop

const invoiceService = {
  async createFullInvoice(clientId, invoiceNumber, dueDate, items) {
    // 1. Borrow a clean, dedicated network wire from our connection pool
    const client = await pool.connect();

    try {
      // 2. Start the safety blanket: Begin the SQL Transaction
      await client.query("BEGIN");

      // 3. Step 1: Save the invoice container row using our repository logic
      // Note: We modify our repo slightly next to handle the transaction client wire
      const queryTextInvoice = `
                INSERT INTO invoices (client_id, invoice_number, due_date, status) 
                VALUES ($1, $2, $3, 'pending') 
                RETURNING *
            `;
      const invoiceResult = await client.query(queryTextInvoice, [
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
      throw error; // Pass the error to the controller so it can tell the frontend
    } finally {
      // 7. CRUCIAL: Always hand the network wire back to the pool so other users can use it
      client.release();
    }
  },
};

module.exports = invoiceService;
