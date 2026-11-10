// Keep these in sync with the prices in your Stripe dashboard.
export const PLAN = {
  name: "Pro",
  tagline: "Everything you need to invoice and get paid.",
  monthly: 19,
  yearly: 200,
  features: [
    "Unlimited invoices and clients",
    "Itemized invoices with automatic totals",
    "Paid, pending, and overdue tracking",
    "Dashboard with cash-flow overview",
    "AI assistant with approval before every action",
    "Light and dark themes",
  ],
};

export const yearlyFull = PLAN.monthly * 12;
export const savings = yearlyFull - PLAN.yearly;
export const savingsPct = Math.round((savings / yearlyFull) * 100);
export const perMonthYearly = (PLAN.yearly / 12).toFixed(2);
