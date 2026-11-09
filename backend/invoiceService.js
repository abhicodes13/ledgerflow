const pool = require("./db");
const invoiceRepository = require("./invoiceRepository");
const { AppError } = require("./errors");

const VALID_STATUSES = ["pending", "paid", "void"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ITEMS = 50;
// Keeps the SQL SUM inside the INT range (50 items * 20,000,000 cents = 1e9)
const MAX_LINE_CENTS = 20_000_000;

function parseItems(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) {
    throw new AppError(`An invoice needs 1 to ${MAX_ITEMS} line items`, 400);
  }
  return items.map((item) => {
    const description =
      typeof item?.description === "string" ? item.description.trim() : "";
    const quantity = Number(item?.quantity);
    const price = Number(item?.price);

    if (!description || description.length > 255) {
      throw new AppError(
        "Each line item needs a description (max 255 characters)",
        400,
      );
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new AppError("Quantity must be a whole number of at least 1", 400);
    }
    if (!Number.isFinite(price) || price < 0) {
      throw new AppError("Price must be a number of 0 or more", 400);
    }
    const cents = Math.round(price * 100);
    if (Math.abs(price * 100 - cents) > 1e-6) {
      throw new AppError("Price can have at most 2 decimal places", 400);
    }
    if (quantity * cents > MAX_LINE_CENTS) {
      throw new AppError("Line item total is too large", 400);
    }
    return { description, quantity, unitAmountCents: cents };
  });
}

// Turns known Postgres error codes into friendly errors
function translateDbError(error) {
  if (error.code === "23505") {
    return new AppError(
      "That invoice number is already in use",
      409,
      "DUPLICATE_INVOICE_NUMBER",
    );
  }
  if (error.code === "23503") {
    return new AppError("Client not found", 404, "CLIENT_NOT_FOUND");
  }
  if (error.code === "23514") {
    return new AppError("Invoice data is invalid", 400);
  }
  if (error.code === "22007" || error.code === "22008") {
    return new AppError("Due date is not a valid date", 400);
  }
  return error;
}

const invoiceService = {
  // invoiceNumber is optional: if empty, the next number for this user is generated.
  async createFullInvoice(
    activeUserId,
    clientId,
    invoiceNumber,
    dueDate,
    items,
  ) {
    const cleanClientId = Number(clientId);
    let cleanNumber =
      typeof invoiceNumber === "string" ? invoiceNumber.trim() : "";

    if (!Number.isInteger(cleanClientId) || cleanClientId < 1) {
      throw new AppError("A valid client is required", 400);
    }
    if (cleanNumber.length > 50) {
      throw new AppError("Invoice number is too long (max 50 characters)", 400);
    }
    if (typeof dueDate !== "string" || !DATE_RE.test(dueDate)) {
      throw new AppError("Due date must look like 2026-12-31", 400);
    }
    const cleanItems = parseItems(items);

    const db = await pool.connect();
    try {
      await db.query("BEGIN");

      // Atomic per-user counter: the UPDATE locks the user's row, so two
      // simultaneous requests can never receive the same number.
      if (!cleanNumber) {
        const seq = await db.query(
          "UPDATE users SET invoice_seq = invoice_seq + 1 WHERE id = $1 RETURNING invoice_seq",
          [activeUserId],
        );
        cleanNumber = `INV-${String(seq.rows[0].invoice_seq).padStart(4, "0")}`;
      }

      const invoice = await invoiceRepository.createInvoice(
        activeUserId,
        cleanClientId,
        cleanNumber,
        dueDate,
        db,
      );
      const savedItems = [];
      for (const item of cleanItems) {
        savedItems.push(
          await invoiceRepository.createItem(
            invoice.id,
            item.description,
            item.quantity,
            item.unitAmountCents,
            db,
          ),
        );
      }
      await db.query("COMMIT");
      return { ...invoice, items: savedItems };
    } catch (error) {
      await db.query("ROLLBACK").catch(() => {});
      throw translateDbError(error);
    } finally {
      db.release();
    }
  },

  async settleInvoiceBalance(invoiceId, activeUserId) {
    const id = Number(invoiceId);
    if (!Number.isInteger(id) || id < 1 || !activeUserId) {
      throw new AppError("A valid invoice is required", 400);
    }
    const paid = await invoiceRepository.markPaid(id, activeUserId);
    if (paid) return paid;

    // Nothing updated: either it isn't theirs / doesn't exist, or it isn't pending
    const existing = await invoiceRepository.findById(id, activeUserId);
    if (!existing) throw new AppError("Invoice not found", 404);
    throw new AppError(`Invoice is already ${existing.status}`, 409);
  },

  async getAllInvoices(activeUserId, filters = {}) {
    if (!activeUserId) throw new AppError("Authentication required", 401);
    if (filters.status && !VALID_STATUSES.includes(filters.status)) {
      throw new AppError("Invalid status filter", 400);
    }
    if (filters.dueBefore && !DATE_RE.test(filters.dueBefore)) {
      throw new AppError("due_before must look like 2026-12-31", 400);
    }
    if (filters.clientId !== undefined && !Number.isInteger(filters.clientId)) {
      throw new AppError("Invalid client_id", 400);
    }
    return invoiceRepository.findAll(activeUserId, filters);
  },
};

module.exports = invoiceService;
