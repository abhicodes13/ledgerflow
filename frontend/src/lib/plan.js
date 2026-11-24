// Keep these in sync with the prices in your Stripe dashboard.
export const PLAN = {
  name: "Pro",
  tagline: "Everything you need to invoice and get paid.",
  monthly: 19,
  yearly: 200,
  features: [
    "Unlimited clients and invoices",
    "Itemized invoices, emailed to clients with a PDF attached",
    "Paid, pending, and overdue tracking",
    "Payment reminders you review before they send",
    "AI assistant that asks before it acts (monthly usage included)",
    "Cash flow, aging, and top-client insights",
    "Export invoices and clients to CSV",
    "Online payment links with Stripe (rolling out)",
    "Light and dark themes, installable on your phone",
  ],
};

export const yearlyFull = PLAN.monthly * 12;
export const savings = yearlyFull - PLAN.yearly;
export const savingsPct = Math.round((savings / yearlyFull) * 100);
export const perMonthYearly = (PLAN.yearly / 12).toFixed(2);
