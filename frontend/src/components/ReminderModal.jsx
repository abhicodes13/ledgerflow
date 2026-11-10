import { AlertTriangle, CheckCircle2, Mail } from "lucide-react";
import { Button, Modal, Skeleton } from "./ui";
import { formatCurrency, lastRemindedOf, timeAgo } from "../lib/format";

const humanize = (s) =>
  String(s || "")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// " · Reminded 2 days ago" (renders nothing if the server doesn't send it)
export function RemindedNote({ invoice, className }) {
  const { at } = lastRemindedOf(invoice);
  const text = at ? timeAgo(at) : null;
  return text ? <span className={className}> · Reminded {text}</span> : null;
}

export function ReminderModal({ reminders }) {
  const { open, phase, preview, result, error, close, confirm, retry } =
    reminders;
  const recipients = preview?.recipients ?? [];
  const skipped = preview?.skipped ?? [];
  const invoiceCount = preview?.invoice_count ?? 0;
  const sending = phase === "sending";

  let footer;
  if (phase === "ready" || sending) {
    footer =
      recipients.length > 0 ? (
        <>
          <Button variant="secondary" onClick={close} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={confirm} loading={sending}>
            <Mail className="h-4 w-4" aria-hidden />
            Send {plural(recipients.length, "email")}
          </Button>
        </>
      ) : (
        <Button onClick={close}>Close</Button>
      );
  } else if (phase === "done") {
    footer = <Button onClick={close}>Done</Button>;
  } else if (phase === "error") {
    footer = (
      <>
        <Button variant="secondary" onClick={close}>
          Close
        </Button>
        <Button onClick={retry}>Try again</Button>
      </>
    );
  } else {
    footer = (
      <Button variant="secondary" onClick={close}>
        Cancel
      </Button>
    );
  }

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && !sending && close()}
      title="Send payment reminders"
      description="Review who will be emailed. Nothing is sent until you confirm."
      size="md"
      footer={footer}
    >
      {phase === "loading" && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {phase === "error" && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      {(phase === "ready" || sending) && (
        <div className="space-y-5">
          {recipients.length === 0 ? (
            <p className="text-sm text-fg-muted">
              Nothing to send right now.
              {skipped.length > 0 && " Here's why:"}
            </p>
          ) : (
            <p className="text-sm text-fg-muted">
              {plural(recipients.length, "client")} will each get one email
              {invoiceCount > 0 &&
                ` about ${plural(invoiceCount, "overdue invoice")}`}
              .
            </p>
          )}

          {recipients.length > 0 && (
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              {recipients.map((r, i) => {
                const name = r.client_name ?? r.name ?? "Client";
                const email = r.email ?? r.client_email;
                const n =
                  r.invoice_count ??
                  (Array.isArray(r.invoices) ? r.invoices.length : null);
                const total = r.total_cents ?? r.total_amount_cents ?? null;
                return (
                  <li
                    key={r.client_id ?? r.email ?? i}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-fg">
                        {name}
                      </p>
                      {email && (
                        <p className="truncate text-xs text-fg-muted">
                          {email}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      {total != null && (
                        <p className="num text-sm font-semibold text-fg">
                          {formatCurrency(total)}
                        </p>
                      )}
                      {n != null && (
                        <p className="text-xs text-fg-subtle">
                          {plural(n, "invoice")}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {skipped.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold text-fg-muted">
                Skipped ({skipped.length})
              </h3>
              <ul className="space-y-1.5 rounded-lg bg-surface-2 p-3 text-sm text-fg-muted">
                {skipped.map((x, i) => (
                  <li key={i}>
                    {x.invoice_number ? `${x.invoice_number}: ` : ""}
                    {humanize(x.reason)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {phase === "done" && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-success/30 bg-success-soft p-4 text-sm text-fg"
        >
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0 text-success"
            aria-hidden
          />
          <p>
            Sent {plural(result?.sent ?? 0, "reminder email")}
            {result?.failed ? `. ${result.failed} failed to send` : ""}.
          </p>
        </div>
      )}
    </Modal>
  );
}
