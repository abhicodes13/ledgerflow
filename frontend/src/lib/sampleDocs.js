// Sample data for the Estimates and Signatures previews.
// All of it is made up. Nothing is read from or sent to the server.

const HOUR = 3_600_000;

// A real timestamp N days (and hours) in the past
const ago = (days, hours = 0) =>
  new Date(Date.now() - (days * 24 + hours) * HOUR).toISOString();

// A calendar day N days from today ("YYYY-MM-DD", in the user's own time zone)
export function isoDay(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const nowISO = () => new Date().toISOString();

export const itemsTotalCents = (items = []) =>
  items.reduce(
    (sum, i) =>
      sum +
      Math.round((parseFloat(i.price) || 0) * 100) * (Number(i.quantity) || 0),
    0,
  );

// "EST-0014" -> next is "EST-0015"
export function nextNumber(list, prefix) {
  const max = list.reduce((m, x) => {
    const n = parseInt(String(x.number).replace(/\D/g, ""), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}

export const SAMPLE_CLIENTS = [
  { id: 1, name: "Northwind Studio", email: "accounts@northwind.example" },
  { id: 2, name: "Bluebird Co.", email: "hello@bluebird.example" },
  { id: 3, name: "Acme Corp", email: "billing@acme.example" },
];

export const SAMPLE_ESTIMATES = [
  {
    id: 6,
    number: "EST-0014",
    client: "Northwind Studio",
    email: "accounts@northwind.example",
    status: "draft",
    validUntil: isoDay(14),
    converted: false,
    items: [
      { description: "Website refresh", quantity: 1, price: 4200 },
      { description: "Content migration", quantity: 1, price: 800 },
    ],
    events: [{ label: "Created", at: ago(0, 2) }],
  },
  {
    id: 5,
    number: "EST-0013",
    client: "Acme Corp",
    email: "billing@acme.example",
    status: "sent",
    validUntil: isoDay(10),
    converted: false,
    items: [
      { description: "Quarterly bookkeeping cleanup", quantity: 1, price: 950 },
    ],
    events: [
      { label: "Created", at: ago(2) },
      { label: "Sent to billing@acme.example", at: ago(2) },
    ],
  },
  {
    id: 4,
    number: "EST-0012",
    client: "Bluebird Co.",
    email: "hello@bluebird.example",
    status: "viewed",
    validUntil: isoDay(6),
    converted: false,
    items: [
      { description: "Logo refresh", quantity: 2, price: 225 },
      { description: "Brand colors and fonts", quantity: 1, price: 450 },
    ],
    events: [
      { label: "Created", at: ago(4) },
      { label: "Sent to hello@bluebird.example", at: ago(4) },
      { label: "Viewed by client", at: ago(1, 3) },
    ],
  },
  {
    id: 3,
    number: "EST-0011",
    client: "Northwind Studio",
    email: "accounts@northwind.example",
    status: "accepted",
    validUntil: isoDay(9),
    converted: false,
    items: [
      { description: "Brand identity package", quantity: 1, price: 2400 },
      { description: "Style guide", quantity: 1, price: 600 },
      { description: "Social templates", quantity: 3, price: 150 },
    ],
    events: [
      { label: "Created", at: ago(6) },
      { label: "Sent to accounts@northwind.example", at: ago(6) },
      { label: "Viewed by client", at: ago(5, 4) },
      { label: "Accepted by Priya Nair", at: ago(4, 2) },
    ],
  },
  {
    id: 2,
    number: "EST-0010",
    client: "Bluebird Co.",
    email: "hello@bluebird.example",
    status: "declined",
    validUntil: isoDay(-2),
    converted: false,
    items: [{ description: "Packaging design", quantity: 1, price: 3200 }],
    events: [
      { label: "Created", at: ago(12) },
      { label: "Sent to hello@bluebird.example", at: ago(12) },
      { label: "Declined by client", at: ago(9) },
    ],
  },
  {
    id: 1,
    number: "EST-0009",
    client: "Acme Corp",
    email: "billing@acme.example",
    status: "expired",
    validUntil: isoDay(-9),
    converted: false,
    items: [
      { description: "Annual tax preparation", quantity: 1, price: 1500 },
    ],
    events: [
      { label: "Created", at: ago(30) },
      { label: "Sent to billing@acme.example", at: ago(30) },
      { label: "Expired without a response", at: ago(9) },
    ],
  },
];

export const SIGNATURE_TEMPLATES = [
  {
    id: "work_authorization",
    title: "Work authorization",
    description: "Approval to start the work at the agreed price.",
    statement:
      "I authorize the work described below to begin, and I agree to the stated price and schedule.",
  },
  {
    id: "change_order",
    title: "Change order",
    description: "Approval for a change to the original scope.",
    statement:
      "I approve the change described below and agree to the revised price and schedule.",
  },
  {
    id: "simple_agreement",
    title: "Simple agreement",
    description: "A short agreement or set of terms.",
    statement: "I have read the terms below and I agree to them.",
  },
];

export const SAMPLE_SIGNATURES = [
  {
    id: 4,
    templateId: "simple_agreement",
    title: "Photography usage terms",
    client: "Acme Corp",
    email: "billing@acme.example",
    scope: "Usage terms for the product photos delivered on the 1st.",
    amount: null,
    status: "draft",
    signedName: null,
    events: [{ label: "Created", at: ago(0, 1) }],
  },
  {
    id: 3,
    templateId: "change_order",
    title: "Change order: extra landing page",
    client: "Bluebird Co.",
    email: "hello@bluebird.example",
    scope:
      "Add one landing page to the original scope, delivered on the same schedule.",
    amount: 600,
    status: "viewed",
    signedName: null,
    events: [
      { label: "Created", at: ago(2) },
      { label: "Sent to hello@bluebird.example", at: ago(2) },
      { label: "Opened by client", at: ago(1, 5) },
    ],
  },
  {
    id: 2,
    templateId: "work_authorization",
    title: "Work authorization: brand identity",
    client: "Northwind Studio",
    email: "accounts@northwind.example",
    scope: "Brand identity package, delivered within three weeks of approval.",
    amount: 3450,
    status: "signed",
    signedName: "Priya Nair",
    events: [
      { label: "Created", at: ago(7) },
      { label: "Sent to accounts@northwind.example", at: ago(7) },
      { label: "Opened by client", at: ago(6, 22) },
      { label: "Signed by Priya Nair", at: ago(6, 21) },
    ],
  },
  {
    id: 1,
    templateId: "simple_agreement",
    title: "Retainer terms",
    client: "Acme Corp",
    email: "billing@acme.example",
    scope: "Monthly bookkeeping retainer, billed on the 1st of each month.",
    amount: 400,
    status: "declined",
    signedName: null,
    events: [
      { label: "Created", at: ago(15) },
      { label: "Sent to billing@acme.example", at: ago(15) },
      { label: "Opened by client", at: ago(14) },
      { label: "Declined by client", at: ago(13) },
    ],
  },
];
