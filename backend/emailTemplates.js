// =========================================================================
// EMAIL TEMPLATES
//
// Pure functions: no database, no network. They turn data into
// { subject, html, text } that you pass to sendEmail().
//
// The HTML uses tables and inline styles on purpose: that is what Gmail,
// Outlook, and Apple Mail render reliably. Every piece of dynamic text is
// escaped, so a client name like "<b>Acme</b>" cannot inject markup.
// =========================================================================

const TONES = {
  friendly: { accent: "#2563eb", label: "Friendly reminder" },
  firm: { accent: "#b45309", label: "Payment overdue" },
  final: { accent: "#b91c1c", label: "Final notice" },
};

const MAX_ROWS = 12; // invoices listed in one email before "and N more"
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ESC = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

const money = (cents) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    (Number(cents) || 0) / 100,
  );

// "2026-11-12" -> a UTC date (no timezone shifting)
function parseYmd(ymd) {
  const [y, m, d] = String(ymd).slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

function todayUtc() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

const daysBetween = (from, to) => Math.round((to - from) / 86400000);

const formatDate = (ymd) =>
  parseYmd(ymd).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

// Only real https links become buttons. Anything else is dropped.
function safeUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(String(value));
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// ---------------------------------------------------------------------------
// Payment reminder
//
// renderReminderEmail({
//   clientName,            // who the email is addressed to
//   senderName,            // the business or person who is owed money
//   senderEmail,           // optional, shown so the client knows who to contact
//   invoices: [{ invoiceNumber, amountCents, dueDate: "YYYY-MM-DD" }],
//   paymentUrl,            // optional https link; adds a "Pay now" button
//   tone,                  // optional: "friendly" | "firm" | "final" (auto by default)
//   today,                 // optional "YYYY-MM-DD", for testing
// })
// -> { subject, html, text, tone, daysOverdue, totalCents }
// ---------------------------------------------------------------------------
function renderReminderEmail(opts) {
  const clientName = String(opts.clientName || "there").trim();
  const senderName = String(opts.senderName || "Your service provider").trim();
  const senderEmail = opts.senderEmail ? String(opts.senderEmail).trim() : "";
  const today = opts.today ? parseYmd(opts.today) : todayUtc();
  const paymentUrl = safeUrl(opts.paymentUrl);

  const all = (opts.invoices || [])
    .map((inv) => ({
      number: String(inv.invoiceNumber || "").trim(),
      cents: Number(inv.amountCents) || 0,
      dueDate: String(inv.dueDate).slice(0, 10),
      daysOverdue: Math.max(0, daysBetween(parseYmd(inv.dueDate), today)),
    }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate)); // oldest first

  if (all.length === 0)
    throw new Error("renderReminderEmail needs at least one invoice");

  const totalCents = all.reduce((sum, i) => sum + i.cents, 0);
  const maxDays = Math.max(...all.map((i) => i.daysOverdue));
  const single = all.length === 1;
  const first = all[0];

  const tone = TONES[opts.tone]
    ? opts.tone
    : maxDays > 30
      ? "final"
      : maxDays > 7
        ? "firm"
        : "friendly";
  const { accent, label } = TONES[tone];

  // ---- Wording -----------------------------------------------------------
  const overdueText =
    maxDays === 0 ? "due today" : `${plural(maxDays, "day")} overdue`;
  const what = single ? `Invoice ${first.number}` : `${all.length} invoices`;

  const status = single
    ? `is ${overdueText}`
    : maxDays === 0
      ? "are due today"
      : `are overdue, the oldest by ${plural(maxDays, "day")}`;

  const subject =
    tone === "friendly"
      ? single
        ? `Friendly reminder: Invoice ${first.number} from ${senderName}`
        : `Friendly reminder: ${all.length} open invoices from ${senderName}`
      : tone === "firm"
        ? `${what} (${money(totalCents)}) ${status}`
        : `Final notice: ${what} (${money(totalCents)}) ${status}`;

  const headline =
    tone === "friendly"
      ? single
        ? "A quick reminder about your invoice"
        : "A quick reminder about your invoices"
      : tone === "firm"
        ? single
          ? "Your invoice is overdue"
          : "Your invoices are overdue"
        : "Final notice: payment overdue";

  const body =
    tone === "friendly"
      ? single
        ? `This is a friendly reminder that invoice ${first.number} for ${money(first.cents)} was due on ${formatDate(first.dueDate)}. If you have already sent payment, thank you, and please disregard this message.`
        : `This is a friendly reminder that the invoices below have passed their due dates. If you have already sent payment, thank you, and please disregard this message.`
      : tone === "firm"
        ? single
          ? `Our records show that invoice ${first.number} for ${money(first.cents)} is now ${plural(first.daysOverdue, "day")} past due. Please arrange payment at your earliest convenience, or reply to let us know when we can expect it.`
          : `Our records show that the invoices below are past due, the oldest by ${plural(maxDays, "day")}. Please arrange payment at your earliest convenience, or reply to let us know when we can expect it.`
        : single
          ? `Invoice ${first.number} for ${money(first.cents)} is now ${plural(first.daysOverdue, "day")} overdue and we have not yet received payment. Please make payment promptly. If there is a problem with this invoice, reply right away so we can resolve it.`
          : `The invoices below are overdue, the oldest by ${plural(maxDays, "day")}, and we have not yet received payment. Please make payment promptly. If there is a problem with any of them, reply right away so we can resolve it.`;

  const preheader = single
    ? `${money(totalCents)} for invoice ${first.number} is ${overdueText}.`
    : `${money(totalCents)} across ${all.length} invoices, the oldest ${overdueText}.`;

  const contact = senderEmail
    ? `reply to this email or contact ${senderName} at ${senderEmail}`
    : `simply reply to this email`;
  const payLine = paymentUrl
    ? "You can pay online using the button above."
    : `To arrange payment, ${contact}.`;
  const payLineText = paymentUrl
    ? "You can pay online using the link above."
    : payLine;

  // ---- Invoice rows ------------------------------------------------------
  const shown = all.slice(0, MAX_ROWS);
  const hidden = all.length - shown.length;

  const rowsHtml = shown
    .map(
      (i) => `
        <tr>
          <td class="text" style="padding:12px 0;border-top:1px solid #e5e7eb;font:500 14px ${FONT};color:#111827;">${esc(i.number)}</td>
          <td class="muted" style="padding:12px 0;border-top:1px solid #e5e7eb;font:14px ${FONT};color:#6b7280;">${esc(formatDate(i.dueDate))}${i.daysOverdue > 0 ? `<br><span style="font-size:12px;color:${accent};">${esc(plural(i.daysOverdue, "day"))} overdue</span>` : ""}</td>
          <td class="text" align="right" style="padding:12px 0;border-top:1px solid #e5e7eb;font:600 14px ${FONT};color:#111827;white-space:nowrap;">${esc(money(i.cents))}</td>
        </tr>`,
    )
    .join("");

  const moreHtml =
    hidden > 0
      ? `<tr><td colspan="3" class="muted" style="padding:12px 0;border-top:1px solid #e5e7eb;font:13px ${FONT};color:#6b7280;">and ${hidden} more invoice${hidden === 1 ? "" : "s"}</td></tr>`
      : "";

  const totalHtml = single
    ? ""
    : `<tr>
          <td colspan="2" class="text" style="padding:14px 0 0;border-top:2px solid #111827;font:600 14px ${FONT};color:#111827;">Total due</td>
          <td class="text" align="right" style="padding:14px 0 0;border-top:2px solid #111827;font:700 16px ${FONT};color:#111827;white-space:nowrap;">${esc(money(totalCents))}</td>
        </tr>`;

  // ---- Optional payment button ------------------------------------------
  const buttonHtml = paymentUrl
    ? `<tr><td class="px" style="padding:16px 36px 8px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td align="center" bgcolor="${accent}" style="border-radius:8px;">
              <a href="${esc(paymentUrl)}" target="_blank" style="display:inline-block;padding:14px 28px;font:600 15px ${FONT};color:#ffffff;text-decoration:none;border-radius:8px;">Pay ${esc(money(totalCents))} now</a>
            </td>
          </tr></table>
        </td></tr>`
    : "";

  // ---- HTML --------------------------------------------------------------
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(subject)}</title>
<style>
  body { margin:0; padding:0; }
  @media (max-width:620px) {
    .container { width:100% !important; }
    .px { padding-left:22px !important; padding-right:22px !important; }
    .amount { font-size:30px !important; }
  }
  @media (prefers-color-scheme: dark) {
    body, .bg { background:#0f1115 !important; }
    .card { background:#181b22 !important; border-color:#2a2f3a !important; }
    .panel { background:#1f232c !important; border-color:#2a2f3a !important; }
    .text { color:#e6e8ec !important; }
    .muted { color:#9aa3b2 !important; }
  }
</style>
</head>
<body class="bg" style="margin:0;padding:0;background:#f4f5f7;">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;">${esc(preheader)}${"&nbsp;&zwnj;".repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg" bgcolor="#f4f5f7" style="background:#f4f5f7;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="container" style="width:600px;max-width:600px;">

      <tr><td class="text" style="padding:0 4px 14px;font:600 16px ${FONT};color:#111827;">${esc(senderName)}</td></tr>

      <tr><td class="card" bgcolor="#ffffff" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

          <tr><td style="height:4px;line-height:4px;font-size:0;background:${accent};">&nbsp;</td></tr>

          <tr><td class="px" style="padding:32px 36px 4px;">
            <div style="font:600 12px ${FONT};letter-spacing:0.08em;text-transform:uppercase;color:${accent};">${esc(label)}</div>
            <h1 class="text" style="margin:10px 0 0;font:700 24px/1.3 ${FONT};color:#111827;">${esc(headline)}</h1>
          </td></tr>

          <tr><td class="px" style="padding:16px 36px 8px;">
            <p class="text" style="margin:0 0 12px;font:15px/1.6 ${FONT};color:#111827;">Hello ${esc(clientName)},</p>
            <p class="muted" style="margin:0;font:15px/1.6 ${FONT};color:#4b5563;">${esc(body)}</p>
          </td></tr>

          <tr><td class="px" style="padding:16px 36px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="panel" bgcolor="#f9fafb" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;">
              <tr><td style="padding:20px 22px;">
                <div class="muted" style="font:500 12px ${FONT};letter-spacing:0.06em;text-transform:uppercase;color:#6b7280;">Amount due</div>
                <div class="text amount" style="margin-top:4px;font:700 34px/1.2 ${FONT};color:#111827;">${esc(money(totalCents))}</div>
                <div style="margin-top:8px;font:600 13px ${FONT};color:${accent};">${esc(overdueText.charAt(0).toUpperCase() + overdueText.slice(1))}</div>
              </td></tr>
            </table>
          </td></tr>

          <tr><td class="px" style="padding:12px 36px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="muted" style="padding:0 0 8px;font:600 12px ${FONT};letter-spacing:0.06em;text-transform:uppercase;color:#6b7280;">Invoice</td>
                <td class="muted" style="padding:0 0 8px;font:600 12px ${FONT};letter-spacing:0.06em;text-transform:uppercase;color:#6b7280;">Due date</td>
                <td class="muted" align="right" style="padding:0 0 8px;font:600 12px ${FONT};letter-spacing:0.06em;text-transform:uppercase;color:#6b7280;">Amount</td>
              </tr>${rowsHtml}${moreHtml}${totalHtml}
            </table>
          </td></tr>

          ${buttonHtml}

          <tr><td class="px" style="padding:16px 36px 32px;">
            <p class="muted" style="margin:0 0 16px;font:14px/1.6 ${FONT};color:#4b5563;">${esc(payLine)}</p>
            <p class="text" style="margin:0;font:15px/1.6 ${FONT};color:#111827;">Thank you,<br><strong>${esc(senderName)}</strong></p>
          </td></tr>

        </table>
      </td></tr>

      <tr><td class="muted" style="padding:18px 8px 0;font:12px/1.6 ${FONT};color:#6b7280;text-align:center;">
        Sent on behalf of ${esc(senderName)} using LedgerFlow. Replies go to ${esc(senderName)}.<br>
        If you have already paid, please disregard this message.
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  // ---- Plain text (spam filters and accessibility like having one) -------
  const textLines = [
    `${label.toUpperCase()}`,
    "",
    `Hello ${clientName},`,
    "",
    body,
    "",
    `Amount due: ${money(totalCents)} (${overdueText})`,
    "",
    ...shown.map(
      (i) =>
        `- ${i.number}: ${money(i.cents)}, due ${formatDate(i.dueDate)}${i.daysOverdue > 0 ? ` (${plural(i.daysOverdue, "day")} overdue)` : ""}`,
    ),
    ...(hidden > 0
      ? [`- and ${hidden} more invoice${hidden === 1 ? "" : "s"}`]
      : []),
    ...(single ? [] : ["", `Total due: ${money(totalCents)}`]),
    "",
    ...(paymentUrl ? [`Pay online: ${paymentUrl}`, ""] : []),
    payLineText,
    "",
    "Thank you,",
    senderName,
    "",
    `Sent on behalf of ${senderName} using LedgerFlow. If you have already paid, please disregard this message.`,
  ];

  return {
    subject,
    html,
    text: textLines.join("\n"),
    tone,
    daysOverdue: maxDays,
    totalCents,
  };
}

module.exports = { renderReminderEmail };
