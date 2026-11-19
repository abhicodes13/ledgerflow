import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Mail,
  Percent,
  Plus,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  Skeleton,
  StatusBadge,
  useToast,
} from "../components/ui";
import { RemindedNote } from "../components/ReminderModal";
import { copyPaymentLink, paymentLinkMessage } from "../lib/paymentLink";
import {
  daysUntilDue,
  formatCurrency,
  formatDate,
  invoiceAmountCents,
  invoiceState,
} from "../lib/format";
import { cn } from "../lib/cn";

const PROMPTS = [
  {
    icon: Mail,
    title: "Send overdue reminders",
    text: "Prepare emails for every overdue invoice.",
    prompt: "Send reminders for my overdue invoices",
  },
  {
    icon: Sparkles,
    title: "How is my business doing?",
    text: "A quick summary of what's owed and collected.",
    prompt: "How is my business doing?",
  },
  {
    icon: FileText,
    title: "Invoice a client",
    text: "Tell the assistant who, and how much.",
    prompt: "Invoice ",
  },
];

const TONE_STYLES = {
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

function dueLabel(inv) {
  if (inv.status === "paid") return "Paid";
  const d = daysUntilDue(inv.due_date);
  // The server decides what's overdue, so the text never contradicts the badge
  if (invoiceState(inv) === "overdue" && (d === null || d >= 0))
    return "Overdue";
  if (d === null) return "No due date";
  if (d < 0) return `Overdue by ${-d} day${d === -1 ? "" : "s"}`;
  if (d === 0) return "Due today";
  return `Due in ${d} day${d === 1 ? "" : "s"}`;
}

function Metric({ label, value, hint, icon: Icon, tone, loading }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-fg-muted">{label}</p>
        <span
          className={cn(
            "grid h-8 w-8 place-items-center rounded-lg",
            TONE_STYLES[tone],
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-32" />
      ) : (
        <p className="num mt-2 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
          {value}
        </p>
      )}
      <p className="mt-1 text-xs text-fg-subtle">{hint}</p>
    </Card>
  );
}

function RowSkeleton() {
  return (
    <div className="space-y-4 p-5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  );
}

// Copy payment link, Remind (overdue only), and Mark paid, right on the row
function AttentionActions({ inv, apiBase, token, onRemind, onSettle }) {
  const toast = useToast();
  const [linking, setLinking] = useState(false);
  const [armed, setArmed] = useState(false);
  const [settling, setSettling] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    if (linking) return;
    setLinking(true);
    const r = await copyPaymentLink(apiBase, token, inv.id);
    setLinking(false);
    if (r.ok) toast.success(`Payment link for ${inv.invoice_number} copied`);
    else if (r.error) toast.error(r.error);
    else toast.info(paymentLinkMessage(r.reason));
  };

  // Marking paid can't be undone, so the first tap arms the button for 4 seconds
  const settle = async () => {
    if (settling) return;
    if (!armed) {
      setArmed(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setArmed(false), 4000);
      return;
    }
    clearTimeout(timer.current);
    setSettling(true);
    await onSettle?.(inv.id);
    setSettling(false);
    setArmed(false);
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="ghost"
        size="sm"
        loading={linking}
        onClick={copy}
        aria-label={`Copy payment link for ${inv.invoice_number}`}
        title="Copy payment link"
      >
        {!linking && <Copy className="h-3.5 w-3.5" aria-hidden />}
      </Button>

      {invoiceState(inv) === "overdue" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemind?.([inv.id])}
          aria-label={`Send a reminder for ${inv.invoice_number}`}
          title="Send reminder"
        >
          <Mail className="h-3.5 w-3.5" aria-hidden />
        </Button>
      )}

      <Button
        variant={armed ? "primary" : "secondary"}
        size="sm"
        loading={settling}
        onClick={settle}
        aria-label={
          armed
            ? `Confirm marking ${inv.invoice_number} as paid`
            : `Mark ${inv.invoice_number} as paid`
        }
      >
        {!settling && <Check className="h-3.5 w-3.5" aria-hidden />}
        {armed ? "Confirm?" : "Mark paid"}
      </Button>
    </div>
  );
}

export function DashboardView({
  metrics,
  invoicesList,
  loading = false,
  currentUser,
  apiBase,
  token,
  onNavigate,
  onNewInvoice,
  onOpenInvoice,
  onRemind,
  onSettle,
  onAskAssistant,
  insights,
  checklist,
}) {
  const all = invoicesList || [];
  const unpaid = all.filter((inv) => inv.status !== "paid");
  const overdue = unpaid.filter((inv) => invoiceState(inv) === "overdue");
  const overdueCents = overdue.reduce(
    (sum, inv) => sum + invoiceAmountCents(inv),
    0,
  );
  const paidCount = all.length - unpaid.length;
  const collectionRate = all.length
    ? Math.round((paidCount / all.length) * 100)
    : null;

  // Overdue first, then by soonest due date; invoices without a date go last.
  const attention = [...unpaid].sort((a, b) => {
    const ao = invoiceState(a) === "overdue" ? 0 : 1;
    const bo = invoiceState(b) === "overdue" ? 0 : 1;
    if (ao !== bo) return ao - bo;
    return (
      (a.due_date ? new Date(a.due_date) : Infinity) -
      (b.due_date ? new Date(b.due_date) : Infinity)
    );
  });

  const recent = [...all]
    .sort(
      (a, b) =>
        new Date(b.created_at || 0) - new Date(a.created_at || 0) ||
        Number(b.id) - Number(a.id),
    )
    .slice(0, 5);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const name = currentUser?.username;
  const clientCount = metrics?.total_clients_count || 0;

  return (
    <>
      <PageHeader
        title={name ? `${greeting}, ${name}` : greeting}
        description={`${clientCount} client${clientCount === 1 ? "" : "s"} · ${all.length} invoice${all.length === 1 ? "" : "s"}`}
        actions={
          <Button onClick={() => onNewInvoice?.()}>
            <Plus className="h-4 w-4" aria-hidden />
            New invoice
          </Button>
        }
      />

      {checklist}

      {/* Key numbers */}
      <section
        aria-label="Key metrics"
        className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4"
      >
        <Metric
          label="Outstanding"
          value={formatCurrency(metrics?.total_outstanding_cents)}
          hint="Waiting to be paid"
          icon={Wallet}
          tone="accent"
          loading={loading}
        />
        <Metric
          label="Collected"
          value={formatCurrency(metrics?.total_collected_cents)}
          hint="Paid by clients"
          icon={CheckCircle2}
          tone="success"
          loading={loading}
        />
        <Metric
          label="Overdue"
          value={formatCurrency(overdueCents)}
          hint={`${overdue.length} invoice${overdue.length === 1 ? "" : "s"} past due`}
          icon={AlertTriangle}
          tone={overdue.length ? "danger" : "warning"}
          loading={loading}
        />
        <Metric
          label="Collection rate"
          value={collectionRate === null ? "—" : `${collectionRate}%`}
          hint="Invoices paid vs. created"
          icon={Percent}
          tone="accent"
          loading={loading}
        />
      </section>

      {/* Needs attention */}
      <Card>
        <CardHeader
          title="Needs attention"
          description="Unpaid invoices, most urgent first."
          action={
            attention.length > 0 && (
              <div className="flex items-center gap-1">
                {overdue.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onRemind?.()}
                  >
                    <Mail className="h-3.5 w-3.5" aria-hidden />
                    Remind all overdue
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate?.("billing")}
                >
                  View all
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>
            )
          }
        />
        {loading ? (
          <RowSkeleton />
        ) : attention.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="You're all caught up"
            description="There are no unpaid invoices right now."
          />
        ) : (
          <ul className="divide-y divide-border">
            {attention.slice(0, 5).map((inv) => (
              <li
                key={inv.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenInvoice?.(inv.id)}
                      className="num text-sm font-medium text-fg hover:text-accent hover:underline"
                    >
                      {inv.invoice_number}
                    </button>
                    <StatusBadge invoice={inv} />
                  </div>
                  <p className="mt-0.5 truncate text-sm text-fg-muted">
                    {inv.client_name} · {dueLabel(inv)}
                    {inv.due_date && ` (${formatDate(inv.due_date)})`}
                    <RemindedNote invoice={inv} />
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="num text-sm font-semibold text-fg">
                    {formatCurrency(invoiceAmountCents(inv))}
                  </span>
                  <AttentionActions
                    inv={inv}
                    apiBase={apiBase}
                    token={token}
                    onRemind={onRemind}
                    onSettle={onSettle}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        {!loading && attention.length > 5 && (
          <p className="border-t border-border px-5 py-3 text-xs text-fg-subtle">
            Showing 5 of {attention.length} unpaid invoices.
          </p>
        )}
      </Card>

      <div className="grid gap-6 2xl:grid-cols-2">
        {/* Recent invoices */}
        <Card>
          <CardHeader
            title="Recent invoices"
            description="Your latest activity."
          />
          {loading ? (
            <RowSkeleton />
          ) : recent.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No invoices yet"
              description="Create your first invoice to see it here."
              action={
                <Button size="sm" onClick={() => onNewInvoice?.()}>
                  Create invoice
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((inv) => (
                <li key={inv.id}>
                  <button
                    type="button"
                    onClick={() => onOpenInvoice?.(inv.id)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors hover:bg-surface-2"
                  >
                    <div className="min-w-0">
                      <p className="num text-sm font-medium text-fg">
                        {inv.invoice_number}
                      </p>
                      <p className="truncate text-sm text-fg-muted">
                        {inv.client_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge invoice={inv} />
                      <span className="num w-24 text-right text-sm text-fg">
                        {formatCurrency(invoiceAmountCents(inv))}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Ask the assistant */}
        <Card>
          <CardHeader
            title="Ask the assistant"
            description="Fills the chat for you. Press Send, then confirm."
          />
          <ul className="divide-y divide-border">
            {PROMPTS.map(({ icon: Icon, title, text, prompt }) => (
              <li key={title}>
                <button
                  type="button"
                  onClick={() => onAskAssistant?.(prompt)}
                  className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-2"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-fg">
                      {title}
                    </span>
                    <span className="block text-sm text-fg-muted">{text}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {insights}
    </>
  );
}
