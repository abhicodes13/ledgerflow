export function formatCurrency(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((Number(cents) || 0) / 100);
}

/* ───────── Dates ─────────
   Due dates are calendar dates ("2026-12-31"), not moments in time.
   We read the year-month-day directly, so time zones can't shift the day. */

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;

// "2026-12-31" (or "2026-12-31T00:00:00Z") -> that calendar day as a UTC timestamp, or null
function dateOnlyUTC(value) {
  const m = DATE_RE.exec(String(value ?? ""));
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null;
}

// Today's calendar day in the user's own time zone, in the same form
function todayUTC() {
  const n = new Date();
  return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
}

// Negative = overdue, 0 = due today, null = no due date
export function daysUntilDue(value) {
  const due = dateOnlyUTC(value);
  return due === null ? null : Math.round((due - todayUTC()) / 86_400_000);
}

export function formatDate(value) {
  const t = dateOnlyUTC(value);
  if (t === null) return "N/A";
  return new Date(t).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function invoiceAmountCents(inv) {
  return Number(
    inv?.amount_cents || inv?.total_amount_cents || inv?.amount || 0,
  );
}

// Display-only: "paid" | "overdue" | "pending".
// The server decides overdue (is_overdue); dates are only a fallback.
export function invoiceState(inv) {
  if (inv?.status === "paid") return "paid";
  if (typeof inv?.is_overdue === "boolean") {
    return inv.is_overdue ? "overdue" : "pending";
  }
  const d = daysUntilDue(inv?.due_date);
  return d !== null && d < 0 ? "overdue" : "pending";
}

/* ───────── Reminders ───────── */

// "2 days ago" for a real timestamp (not a calendar date)
export function timeAgo(value) {
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return null;
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
  return new Date(t).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// I don't know your exact column name. Add yours to this list if it isn't here.
const REMINDED_KEYS = [
  "last_reminded_at",
  "last_reminder_at",
  "last_reminder_sent_at",
  "reminded_at",
  "last_reminded",
];

// known = the server sends the field at all; at = when (null = never)
export function lastRemindedOf(inv) {
  const key = REMINDED_KEYS.find((k) => inv && k in inv);
  return key ? { known: true, at: inv[key] } : { known: false, at: null };
}

// Uses the invoice's own email if present, else looks the client up
export function invoiceClientEmail(inv, clients = []) {
  if (inv?.client_email) return inv.client_email;
  const c =
    clients.find(
      (c) => inv?.client_id != null && Number(c.id) === Number(inv.client_id),
    ) ?? clients.find((c) => c.name === inv?.client_name);
  return c?.email ?? "";
}
