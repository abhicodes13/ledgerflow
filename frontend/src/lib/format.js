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
