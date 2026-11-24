import { useRef, useState } from "react";
import { AlertTriangle, Paperclip } from "lucide-react";
import { Button, Modal, useToast } from "./ui";
import { readError } from "../lib/api";
import { formatCurrency, formatDate, invoiceAmountCents } from "../lib/format";

// Confirms, then asks the server to email the invoice. The server picks the recipient
// from the client's record, so only the invoice id is sent.
export function SendInvoiceModal({
  invoice,
  email,
  apiBase,
  token,
  onClose,
  onSent,
}) {
  const toast = useToast();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);

  const send = async () => {
    if (busy.current) return;
    busy.current = true;
    setSending(true);
    setError("");
    try {
      const res = await fetch(
        `${apiBase}/api/invoices/${encodeURIComponent(invoice.id)}/send`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) {
        // For example: already sent in the last 5 minutes, or the daily limit
        setError(await readError(res, "Couldn't send the invoice."));
        return;
      }
      const body = await res.json().catch(() => null);
      toast.success(
        typeof body?.message === "string" && body.message
          ? body.message
          : `Invoice ${invoice.invoice_number} emailed${email ? ` to ${email}` : ""}`,
      );
      onSent?.();
      onClose();
    } catch {
      setError(
        "Couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      busy.current = false;
      setSending(false);
    }
  };

  const rows = [
    ["Invoice", invoice.invoice_number, true],
    ["Client", invoice.client_name, false],
    ["Sending to", email || "No email on file", false],
    ["Amount", formatCurrency(invoiceAmountCents(invoice)), true],
    ["Due date", formatDate(invoice.due_date), true],
  ];

  return (
    <Modal
      open
      onOpenChange={(open) => !open && !sending && onClose()}
      title="Email this invoice"
      description="Your client gets the invoice by email."
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={send} loading={sending} disabled={!email}>
            Send email
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <dl className="space-y-2 rounded-xl bg-surface-2 p-4 text-sm">
          {rows.map(([label, value, mono]) => (
            <div
              key={label}
              className="flex items-baseline justify-between gap-4"
            >
              <dt className="text-xs font-medium text-fg-muted">{label}</dt>
              <dd
                className={`min-w-0 truncate text-right font-medium text-fg ${mono ? "num" : ""}`}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>

        {!email && (
          <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm text-warning">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              This client has no email address. Add one on the Clients page
              first.
            </span>
          </div>
        )}

        <p className="flex items-start gap-2 text-sm text-fg-muted">
          <Paperclip
            className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle"
            aria-hidden
          />
          <span>
            The invoice PDF is attached, and replies come to you. To avoid
            duplicates, the same invoice can't be emailed twice within 5
            minutes.
          </span>
        </p>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
