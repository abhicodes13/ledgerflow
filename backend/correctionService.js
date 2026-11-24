const pool = require("./db");
const { AppError } = require("./errors");
const { isRealDate } = require("./utils/format");

// Fixes for mistakes. Every query is limited to the signed-in user's own rows.
// Kept in its own file so nothing existing has to change; it can be merged into
// invoiceService / clientService later.

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const E164_RE = /^\+[1-9]\d{7,14}$/;

function parseId(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError(`A valid ${label} is required`, 400);
  }
  return id;
}

// Stores phone numbers as E.164 (+12015551234). A bare 10-digit number is
// treated as a US number. Empty input returns null (clears the phone).
function normalizePhone(raw) {
  if (raw === null || raw === undefined || String(raw).trim() === "")
    return null;
  let compact = String(raw).replace(/[\s().-]/g, "");
  if (/^\d{10}$/.test(compact)) compact = `+1${compact}`;
  if (!E164_RE.test(compact)) {
    throw new AppError("Phone number must look like +12015551234", 400);
  }
  return compact;
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

// Only an unpaid invoice can be voided; a paid one would need a refund instead.
async function voidInvoice(userId, invoiceId) {
  const id = parseId(invoiceId, "invoice");
  const updated = await pool.query(
    `UPDATE invoices SET status = 'void', updated_at = now()
     WHERE id = $1 AND user_id = $2 AND status = 'pending'
     RETURNING id, invoice_number, status`,
    [id, userId],
  );
  if (updated.rows[0]) return updated.rows[0];

  const existing = (
    await pool.query(
      "SELECT invoice_number, status FROM invoices WHERE id = $1 AND user_id = $2",
      [id, userId],
    )
  ).rows[0];
  if (!existing) throw new AppError("Invoice not found", 404);
  if (existing.status === "paid") {
    throw new AppError("A paid invoice can't be voided.", 409);
  }
  throw new AppError(`Invoice is already ${existing.status}`, 409);
}

async function changeDueDate(userId, invoiceId, newDueDate) {
  const id = parseId(invoiceId, "invoice");
  if (!isRealDate(newDueDate)) {
    throw new AppError("Due date must be a real date like 2026-12-31", 400);
  }
  const updated = await pool.query(
    `UPDATE invoices SET due_date = $3, updated_at = now()
     WHERE id = $1 AND user_id = $2 AND status = 'pending'
     RETURNING id, invoice_number, due_date`,
    [id, userId, newDueDate],
  );
  if (updated.rows[0]) return updated.rows[0];

  const existing = (
    await pool.query(
      "SELECT status FROM invoices WHERE id = $1 AND user_id = $2",
      [id, userId],
    )
  ).rows[0];
  if (!existing) throw new AppError("Invoice not found", 404);
  throw new AppError(
    `Only unpaid invoices can change due date (this one is ${existing.status}).`,
    409,
  );
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

// fields: { name?, email?, phone_number? }. A field left undefined is not changed;
// phone_number of "" or null clears it.
async function updateClient(userId, clientId, fields = {}) {
  const id = parseId(clientId, "client");
  const sets = [];
  const params = [userId, id];
  const add = (column, value) => {
    params.push(value);
    sets.push(`${column} = $${params.length}`);
  };

  if (fields.name !== undefined) {
    const name = typeof fields.name === "string" ? fields.name.trim() : "";
    if (!name || name.length > 255) {
      throw new AppError("Client name is required (max 255 characters)", 400);
    }
    add("name", name);
  }
  if (fields.email !== undefined) {
    const email =
      typeof fields.email === "string" ? fields.email.trim().toLowerCase() : "";
    if (!EMAIL_RE.test(email) || email.length > 255) {
      throw new AppError("A valid client email is required", 400);
    }
    add("email", email);
  }
  if (fields.phone_number !== undefined) {
    add("phone_number", normalizePhone(fields.phone_number));
  }
  if (sets.length === 0) throw new AppError("Nothing to update", 400);
  sets.push("updated_at = now()");

  try {
    const result = await pool.query(
      `UPDATE clients SET ${sets.join(", ")}
       WHERE user_id = $1 AND id = $2 AND archived_at IS NULL
       RETURNING id, name, email, phone_number`,
      params,
    );
    if (!result.rows[0]) throw new AppError("Client not found", 404);
    return result.rows[0];
  } catch (error) {
    if (error.code === "23505") {
      throw new AppError(
        "Another client already uses that email.",
        409,
        "DUPLICATE_EMAIL",
      );
    }
    throw error;
  }
}

// Archiving hides a client from lists and reminders but keeps their invoice
// history. It is blocked while they still owe an unpaid invoice.
async function archiveClient(userId, clientId) {
  const id = parseId(clientId, "client");

  const pending = (
    await pool.query(
      `SELECT COUNT(*)::INT AS n FROM invoices
       WHERE client_id = $1 AND user_id = $2 AND status = 'pending'`,
      [id, userId],
    )
  ).rows[0].n;
  if (pending > 0) {
    throw new AppError(
      `This client has ${pending} unpaid invoice(s). Mark them paid or void them first.`,
      409,
      "HAS_UNPAID_INVOICES",
    );
  }

  const result = await pool.query(
    `UPDATE clients SET archived_at = now(), updated_at = now()
     WHERE id = $1 AND user_id = $2 AND archived_at IS NULL
     RETURNING id, name`,
    [id, userId],
  );
  if (!result.rows[0]) {
    throw new AppError("Client not found (or already archived)", 404);
  }
  return result.rows[0];
}

module.exports = { voidInvoice, changeDueDate, updateClient, archiveClient };
