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

// Display-only: "paid" | "overdue" | "pending". Doesn't change any data.
export function invoiceState(inv) {
  if (inv?.status === "paid") return "paid";
  const d = daysUntilDue(inv?.due_date);
  return d !== null && d < 0 ? "overdue" : "pending";
}
