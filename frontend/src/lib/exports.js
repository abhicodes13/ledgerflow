import { dateOnly, dollars, downloadCsv } from "./csv";
import {
  dateInDays,
  invoiceAmountCents,
  invoiceClientEmail,
  invoiceState,
  isPaidOnline,
  lastRemindedOf,
} from "./format";

const STATE = { paid: "Paid", pending: "Pending", overdue: "Overdue" };

const isoOrEmpty = (value) => {
  const d = new Date(value);
  return value && !Number.isNaN(d.getTime()) ? d.toISOString() : "";
};

export function exportInvoices(invoices, clients = []) {
  downloadCsv(`ledgerflow-invoices-${dateInDays(0)}.csv`, invoices, [
    { header: "Invoice number", value: (i) => i.invoice_number },
    { header: "Client", value: (i) => i.client_name },
    { header: "Client email", value: (i) => invoiceClientEmail(i, clients) },
    { header: "Status", value: (i) => STATE[invoiceState(i)] },
    { header: "Due date", value: (i) => dateOnly(i.due_date) },
    { header: "Amount (USD)", value: (i) => dollars(invoiceAmountCents(i)) },
    { header: "Paid online", value: (i) => (isPaidOnline(i) ? "Yes" : "No") },
    { header: "Last reminded", value: (i) => isoOrEmpty(lastRemindedOf(i).at) },
  ]);
}

// rows are clients merged with { count, billed, outstanding } (cents)
export function exportClients(rows) {
  downloadCsv(`ledgerflow-clients-${dateInDays(0)}.csv`, rows, [
    { header: "Name", value: (r) => r.name },
    { header: "Email", value: (r) => r.email },
    { header: "Phone", value: (r) => r.phone_number ?? r.phone },
    { header: "Invoices", value: (r) => r.count },
    { header: "Billed (USD)", value: (r) => dollars(r.billed) },
    { header: "Outstanding (USD)", value: (r) => dollars(r.outstanding) },
    { header: "Client since", value: (r) => dateOnly(r.created_at) },
  ]);
}
