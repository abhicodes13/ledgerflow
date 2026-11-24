const pool = require("./db");
const { AppError } = require("./errors");
const { sendEmail } = require("./emailService");
const { generateInvoicePdfBuffer } = require("./utils/invoiceGenerator");
const { money, toYmd, formatDate, escapeHtml } = require("./utils/format");

const DAILY_LIMIT = 100; // sends (reminders + invoices) per user per 24 hours
const DUPLICATE_WINDOW_MINUTES = 5; // blocks double-clicks and accidental re-sends

function buildInvoiceEmail({ senderName, clientName, invoice, totalCents }) {
  const due = formatDate(invoice.due_date);
  const overdue = toYmd(invoice.due_date) < toYmd(new Date());
  const intro = `Please find invoice ${invoice.invoice_number} for ${money(totalCents)} attached.`;
  const dueLine = overdue
    ? `It was due on ${due} and is now past due. Please arrange payment as soon as possible.`
    : `It is due on ${due}.`;

  const text = [
    `Hi ${clientName},`,
    "",
    intro,
    dueLine,
    "",
    "Reply to this email with any questions.",
    "",
    "Thank you,",
    senderName,
  ].join("\n");

  const html =
    `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111827;line-height:1.5">` +
    `<p>Hi ${escapeHtml(clientName)},</p>` +
    `<p>Please find invoice <strong>${escapeHtml(invoice.invoice_number)}</strong> for <strong>${money(totalCents)}</strong> attached.</p>` +
    `<p>${escapeHtml(dueLine)}</p>` +
    `<p>Reply to this email with any questions.</p>` +
    `<p>Thank you,<br>${escapeHtml(senderName)}</p></div>`;

  const subject = `Invoice ${invoice.invoice_number} from ${senderName} (${money(totalCents)})`;
  return { subject, text, html };
}

function logSend(userId, invoiceId, recipient, status, messageId, error) {
  // tone_tier = 'invoice' marks this as an invoice email (reminders use friendly/firm/final)
  return pool.query(
    `INSERT INTO communication_logs
       (user_id, invoice_id, channel, recipient, tone_tier, status, provider_message_id, error)
     VALUES ($1, $2, 'email', $3, 'invoice', $4, $5, $6)`,
    [userId, invoiceId, recipient, status, messageId, error],
  );
}

// Emails one of the user's unpaid invoices, with the PDF attached, to its client.
// The recipient always comes from the client's record, never from the request.
async function sendInvoiceEmail(userId, invoiceId) {
  const id = Number(invoiceId);
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError("A valid invoice is required", 400);
  }

  const found = await pool.query(
    `SELECT i.*, c.name AS client_name, c.email AS client_email, c.phone_number AS client_phone
     FROM invoices i
     JOIN clients c ON c.id = i.client_id AND c.user_id = i.user_id
     WHERE i.id = $1 AND i.user_id = $2`,
    [id, userId],
  );
  const invoice = found.rows[0];
  if (!invoice) throw new AppError("Invoice not found", 404);
  if (invoice.status !== "pending") {
    throw new AppError(
      `Only unpaid invoices can be emailed (this one is ${invoice.status}).`,
      409,
    );
  }
  if (!invoice.client_email) {
    throw new AppError("This client has no email address on file.", 400);
  }

  // Guard 1: the same invoice was just sent
  const recent = await pool.query(
    `SELECT 1 FROM communication_logs
     WHERE user_id = $1 AND invoice_id = $2 AND tone_tier = 'invoice'
       AND status = 'sent'
       AND dispatched_at > now() - interval '${DUPLICATE_WINDOW_MINUTES} minutes'
     LIMIT 1`,
    [userId, id],
  );
  if (recent.rowCount > 0) {
    throw new AppError(
      "This invoice was just emailed. Please wait a few minutes before sending it again.",
      409,
      "DUPLICATE_SEND",
    );
  }

  // Guard 2: daily limit across all emails
  const sentToday = (
    await pool.query(
      `SELECT COUNT(*)::INT AS n FROM communication_logs
       WHERE user_id = $1 AND status IN ('queued', 'sent', 'delivered')
         AND dispatched_at > now() - interval '24 hours'`,
      [userId],
    )
  ).rows[0].n;
  if (sentToday >= DAILY_LIMIT) {
    throw new AppError(
      "Daily email limit reached. Please try again tomorrow.",
      429,
      "DAILY_LIMIT",
    );
  }

  const items = (
    await pool.query(
      `SELECT description, quantity, unit_amount_cents
       FROM invoice_items WHERE invoice_id = $1 ORDER BY id`,
      [id],
    )
  ).rows;
  const owner =
    (
      await pool.query("SELECT username, email FROM users WHERE id = $1", [
        userId,
      ])
    ).rows[0] || {};
  const senderName = owner.username || "Your service provider";
  const totalCents = items.reduce(
    (sum, it) => sum + it.quantity * it.unit_amount_cents,
    0,
  );

  const pdf = await generateInvoicePdfBuffer(invoice, items, {
    name: owner.username,
    email: owner.email,
  });
  const email = buildInvoiceEmail({
    senderName,
    clientName: invoice.client_name,
    invoice,
    totalCents,
  });
  const safeNumber = String(invoice.invoice_number).replace(/[^\w.-]/g, "_");

  try {
    const { id: messageId, deliveredTo } = await sendEmail({
      to: invoice.client_email,
      ...email,
      replyTo: owner.email,
      attachments: [{ filename: `Invoice-${safeNumber}.pdf`, content: pdf }],
    });
    await logSend(userId, id, deliveredTo, "sent", messageId, null);
    return {
      invoice_number: invoice.invoice_number,
      client_name: invoice.client_name,
      sent_to: deliveredTo,
    };
  } catch (error) {
    console.error("Invoice email failed:", error.message);
    await logSend(
      userId,
      id,
      invoice.client_email,
      "failed",
      null,
      String(error.message).slice(0, 500),
    ).catch(() => {});
    throw new AppError("The email could not be sent. Please try again.", 502);
  }
}

module.exports = { sendInvoiceEmail };
