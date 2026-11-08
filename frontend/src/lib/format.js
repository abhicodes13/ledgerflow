export function formatCurrency(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((Number(cents) || 0) / 100);
}

// Dates from Postgres are date-only; formatting in UTC avoids "off by one day".
export function formatDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Same three-field fallback your pages use today, in one place.
export function invoiceAmountCents(inv) {
  return Number(
    inv?.amount_cents || inv?.total_amount_cents || inv?.amount || 0,
  );
}

// Display-only: "paid" | "overdue" | "pending". Doesn't change any data.
export function invoiceState(inv) {
  if (inv?.status === "paid") return "paid";
  if (
    inv?.due_date &&
    new Date(inv.due_date) < new Date(new Date().toDateString())
  ) {
    return "overdue";
  }
  return "pending";
}

// Suggests the next invoice number from existing ones, e.g. INV-003 -> INV-004.
// Uses the most common prefix (ties go to the newest invoice) and keeps zero padding.
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
