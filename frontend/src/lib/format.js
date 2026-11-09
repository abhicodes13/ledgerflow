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

// Suggests the next invoice number from existing ones, e.g. INV-003 -> INV-004.
// (Goes away once the server assigns numbers; see item 4.)
export function nextInvoiceNumber(invoices = []) {
  const groups = new Map();
  for (const inv of invoices) {
    const m = /^(.*?)(\d+)\s*$/.exec(String(inv?.invoice_number ?? "").trim());
    if (!m) continue;
    const key = m[1].toLowerCase();
    const g = groups.get(key) ?? { prefix: m[1], count: 0, max: 0, width: 0 };
    g.count += 1;
    g.max = Math.max(g.max, Number(m[2]));
    g.width = Math.max(g.width, m[2].length);
    groups.set(key, g);
  }
  if (groups.size === 0) return "INV-0001";

  const best = [...groups.values()].reduce((a, b) =>
    b.count > a.count ? b : a,
  );
  const taken = new Set(
    invoices.map((i) => String(i?.invoice_number ?? "").toLowerCase()),
  );

  let n = best.max + 1;
  let candidate;
  do {
    candidate = best.prefix + String(n).padStart(best.width, "0");
    n += 1;
  } while (taken.has(candidate.toLowerCase()));
  return candidate;
}
