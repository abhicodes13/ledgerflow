const pool = require("./db");
const { AppError } = require("./errors");
const { sendEmail } = require("./emailService");
const { renderReminderEmail } = require("./emailTemplates");

const MAX_PER_ACTION = 50; // invoices per confirmed action
const DAILY_LIMIT = 100; // reminder log rows per user per 24 hours
const MIN_HOURS_BETWEEN = 24; // don't remind about the same invoice more often than this

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

// Works for a "YYYY-MM-DD" string or a JS Date, without time-zone day shifts
function toYmd(value) {
  if (!value) return null;
  if (value instanceof Date) {
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${value.getFullYear()}-${m}-${d}`;
  }
  return String(value).slice(0, 10);
}

// The tone gets firmer the longer an invoice has been overdue.
// It is decided at preview time, stored with the proposal, and logged.
function toneFor(maxDaysOverdue) {
  if (maxDaysOverdue <= 7) return "friendly";
  if (maxDaysOverdue <= 30) return "firm";
  return "final";
}

// One log row per invoice for a single email
function logRows(
  userId,
  invoiceIds,
  recipient,
  tone,
  status,
  messageId,
  error,
) {
  return pool.query(
    `INSERT INTO communication_logs
       (user_id, invoice_id, channel, recipient, tone_tier, status, provider_message_id, error)
     SELECT $1::int, unnest($2::int[]), 'email', $3::text, $4::text, $5::text, $6::text, $7::text`,
    [userId, invoiceIds, recipient, tone, status, messageId, error],
  );
}

// ---------------------------------------------------------------------------
// STEP 1: preview. Decides who would be contacted and stores that decision
// on the server. Nothing is sent. Returns an id the user can confirm.
// ---------------------------------------------------------------------------
async function previewReminders(userId, options = {}) {
  let ids = null;
  if (options.invoiceIds !== undefined && options.invoiceIds !== null) {
    ids = Array.isArray(options.invoiceIds)
      ? options.invoiceIds.map(Number).filter(Number.isInteger)
      : [];
    if (ids.length === 0 || ids.length > 200) {
      throw new AppError("invoice_ids must list 1 to 200 invoice ids", 400);
    }
  }

  const params = [userId];
  let extraFilter = "";
  if (ids) {
    params.push(ids);
    extraFilter = "AND i.id = ANY($2::int[])";
  }

  // Only the user's own unpaid invoices that are past their due date
  const found = await pool.query(
    `SELECT i.id, i.invoice_number, i.due_date, i.last_notified_at,
            c.id AS client_id, c.name AS client_name, c.email AS client_email,
            COALESCE(SUM(ii.quantity * ii.unit_amount_cents), 0)::INT AS total_cents,
            (CURRENT_DATE - i.due_date)::INT AS days_overdue
     FROM invoices i
     JOIN clients c ON c.id = i.client_id AND c.user_id = i.user_id
     LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
     WHERE i.user_id = $1 AND i.status = 'pending' AND i.due_date < CURRENT_DATE ${extraFilter}
     GROUP BY i.id, c.id
     ORDER BY i.due_date ASC
     LIMIT 500`,
    params,
  );

  const sentToday = (
    await pool.query(
      `SELECT COUNT(*)::INT AS n FROM communication_logs
       WHERE user_id = $1 AND status IN ('queued', 'sent', 'delivered')
         AND dispatched_at > now() - interval '24 hours'`,
      [userId],
    )
  ).rows[0].n;
  const remaining = Math.min(MAX_PER_ACTION, DAILY_LIMIT - sentToday);
  if (remaining <= 0) {
    throw new AppError(
      "Daily reminder limit reached. Please try again tomorrow.",
      429,
      "DAILY_LIMIT",
    );
  }

  const skipped = [];
  const eligible = [];
  for (const r of found.rows) {
    const skip = (reason) =>
      skipped.push({
        invoice_number: r.invoice_number,
        client_name: r.client_name,
        reason,
      });
    const recentlyReminded =
      r.last_notified_at &&
      Date.now() - new Date(r.last_notified_at).getTime() <
        MIN_HOURS_BETWEEN * 3600 * 1000;

    if (!r.client_email) skip("client has no email");
    else if (recentlyReminded) skip("reminded in the last 24 hours");
    else if (eligible.length >= remaining) skip("over the sending limit");
    else eligible.push(r);
  }

  // One email per client, listing all of their overdue invoices
  const byClient = new Map();
  for (const r of eligible) {
    if (!byClient.has(r.client_id)) {
      byClient.set(r.client_id, {
        client_id: r.client_id,
        client_name: r.client_name,
        client_email: r.client_email,
        invoices: [],
      });
    }
    byClient.get(r.client_id).invoices.push({
      id: r.id,
      invoice_number: r.invoice_number,
      total_cents: r.total_cents,
      due_date: toYmd(r.due_date),
      days_overdue: Math.max(0, r.days_overdue),
    });
  }
  const recipients = [...byClient.values()].map((c) => ({
    ...c,
    tone: toneFor(Math.max(...c.invoices.map((i) => i.days_overdue))),
  }));

  if (recipients.length === 0) {
    return { pendingActionId: null, recipients: [], skipped, invoice_count: 0 };
  }

  const inserted = await pool.query(
    `INSERT INTO pending_actions (user_id, action_type, payload)
     VALUES ($1, 'send_reminders', $2::jsonb)
     RETURNING id, expires_at`,
    [userId, JSON.stringify({ channel: "email", recipients })],
  );

  return {
    pendingActionId: inserted.rows[0].id,
    expires_at: inserted.rows[0].expires_at,
    recipients,
    skipped,
    invoice_count: eligible.length,
  };
}

// ---------------------------------------------------------------------------
// STEP 2: confirm. Sends exactly what the preview stored, and nothing else.
// ---------------------------------------------------------------------------
async function confirmReminders(userId, pendingActionId) {
  const id = Number(pendingActionId);
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError("A valid action id is required", 400);
  }

  // Atomic claim: only one confirm can ever win, so double-clicks can't double-send
  const claim = await pool.query(
    `UPDATE pending_actions SET status = 'confirmed'
     WHERE id = $1 AND user_id = $2 AND action_type = 'send_reminders'
       AND status = 'pending' AND expires_at > now()
     RETURNING payload`,
    [id, userId],
  );

  if (claim.rowCount === 0) {
    const existing = (
      await pool.query(
        "SELECT status FROM pending_actions WHERE id = $1 AND user_id = $2",
        [id, userId],
      )
    ).rows[0];
    if (!existing) throw new AppError("That action was not found", 404);
    if (existing.status === "pending") {
      throw new AppError(
        "That action expired. Please start again.",
        410,
        "EXPIRED",
      );
    }
    throw new AppError(`That action was already ${existing.status}`, 409);
  }

  const { recipients } = claim.rows[0].payload;
  const owner = (
    await pool.query("SELECT username, email FROM users WHERE id = $1", [
      userId,
    ])
  ).rows[0];
  const senderName = owner?.username || "Your service provider";

  let sent = 0;
  let failed = 0;
  const results = [];

  for (const r of recipients) {
    // Things can change between preview and confirm: skip anything now paid
    const live = await pool.query(
      `SELECT id FROM invoices
       WHERE id = ANY($1::int[]) AND user_id = $2 AND status = 'pending'`,
      [r.invoices.map((i) => i.id), userId],
    );
    const liveIds = new Set(live.rows.map((row) => row.id));
    const invoices = r.invoices.filter((i) => liveIds.has(i.id));

    if (invoices.length === 0) {
      results.push({
        client: r.client_name,
        status: "skipped",
        reason: "no longer unpaid",
      });
      continue;
    }

    const invoiceIds = invoices.map((i) => i.id);

    try {
      // Building the email is inside the try, so a problem with one client's
      // email is logged as a failure and the rest of the batch still goes out.
      const email = renderReminderEmail({
        clientName: r.client_name,
        senderName,
        senderEmail: owner?.email,
        invoices: invoices.map((i) => ({
          invoiceNumber: i.invoice_number,
          amountCents: i.total_cents,
          dueDate: i.due_date,
        })),
        tone: r.tone, // the tone shown in the preview and stored in the log
        // paymentUrl: ...  <- add the invoice's pay link here later for a "Pay now" button
      });

      const { id: messageId, deliveredTo } = await sendEmail({
        to: r.client_email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        replyTo: owner?.email,
      });
      await logRows(
        userId,
        invoiceIds,
        deliveredTo,
        r.tone,
        "sent",
        messageId,
        null,
      );
      await pool.query(
        `UPDATE invoices SET last_notified_at = now(), updated_at = now()
         WHERE id = ANY($1::int[]) AND user_id = $2`,
        [invoiceIds, userId],
      );
      sent += 1;
      results.push({
        client: r.client_name,
        status: "sent",
        invoices: invoiceIds.length,
      });
    } catch (error) {
      console.error("Reminder email failed:", error.message);
      await logRows(
        userId,
        invoiceIds,
        r.client_email,
        r.tone,
        "failed",
        null,
        String(error.message).slice(0, 500),
      ).catch(() => {});
      failed += 1;
      results.push({
        client: r.client_name,
        status: "failed",
        error: "The email could not be sent",
      });
    }
  }

  await pool.query(
    "UPDATE pending_actions SET status = $2, resolved_at = now() WHERE id = $1",
    [id, sent === 0 && failed > 0 ? "failed" : "executed"],
  );

  return { sent, failed, results };
}

module.exports = { previewReminders, confirmReminders };
