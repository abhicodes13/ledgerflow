import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Mail,
  Percent,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Modal,
  PageHeader,
  Skeleton,
  StatusBadge,
  useToast,
} from "../components/ui";
import {
  formatCurrency,
  formatDate,
  invoiceAmountCents,
  invoiceState,
} from "../lib/format";
import { cn } from "../lib/cn";

// Suggestions are placeholders until the AI backend supplies real ones.
const SUGGESTIONS = [
  {
    id: "rec_01",
    title: "Send reminders for overdue invoices",
    description:
      "Email a polite reminder to every client who has an overdue invoice.",
    impact: "Could speed up collections",
    actionType: "batch_remind",
    payload: { targets: "all_overdue" },
  },
  {
    id: "rec_02",
    title: "Draft a first invoice for new clients",
    description:
      "Clients with no invoices yet can get a starter invoice from a template.",
    impact: "Gets new clients billed sooner",
    actionType: "draft_initial",
    payload: { template: "baseline_retainer" },
  },
];

const TONE_STYLES = {
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

function daysFromToday(dateValue) {
  if (!dateValue) return null;
  const today = new Date(new Date().toDateString());
  return Math.round((new Date(dateValue) - today) / 86_400_000);
}

function dueLabel(inv) {
  if (inv.status === "paid") return "Paid";
  const d = daysFromToday(inv.due_date);
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

export function DashboardView({
  metrics,
  invoicesList,
  loading = false,
  currentUser,
  onNavigate,
}) {
  const toast = useToast();
  const [suggestion, setSuggestion] = useState(null);

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

  const sendReminder = (inv) =>
    toast.info(
      `Reminder for ${inv.invoice_number} to ${inv.client_name} (preview: email sending isn't connected yet)`,
    );

  return (
    <>
      <PageHeader
        title={name ? `${greeting}, ${name}` : greeting}
        description={`${clientCount} client${clientCount === 1 ? "" : "s"} · ${all.length} invoice${all.length === 1 ? "" : "s"}`}
        actions={
          <Button onClick={() => onNavigate?.("billing")}>
            <FileText className="h-4 w-4" aria-hidden />
            Go to invoices
          </Button>
        }
      />

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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate?.("billing")}
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Button>
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
                    <span className="num text-sm font-medium text-fg">
                      {inv.invoice_number}
                    </span>
                    <StatusBadge invoice={inv} />
                  </div>
                  <p className="mt-0.5 truncate text-sm text-fg-muted">
                    {inv.client_name} · {dueLabel(inv)}
                    {inv.due_date && ` (${formatDate(inv.due_date)})`}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className="num text-sm font-semibold text-fg">
                    {formatCurrency(invoiceAmountCents(inv))}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => sendReminder(inv)}
                  >
                    <Mail className="h-3.5 w-3.5" aria-hidden />
                    Remind
                  </Button>
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
                <Button size="sm" onClick={() => onNavigate?.("billing")}>
                  Create invoice
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between gap-4 px-5 py-3.5"
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
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* AI suggestions */}
        <Card>
          <CardHeader
            title="AI suggestions"
            description="Ideas to save you time."
            action={<Badge tone="accent">Preview</Badge>}
          />
          <ul className="divide-y divide-border">
            {SUGGESTIONS.map((rec) => (
              <li key={rec.id} className="flex items-start gap-3 px-5 py-4">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                  <Sparkles className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-fg">{rec.title}</p>
                  <p className="mt-0.5 text-sm text-fg-muted">
                    {rec.description}
                  </p>
                  <p className="mt-1 text-xs text-fg-subtle">{rec.impact}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSuggestion(rec)}
                >
                  Review
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Modal
        open={!!suggestion}
        onOpenChange={(open) => !open && setSuggestion(null)}
        title={suggestion?.title ?? ""}
        description="Review before anything runs."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSuggestion(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast.info(
                  "This is a preview. Suggestions aren't connected to the backend yet.",
                );
                setSuggestion(null);
              }}
            >
              Run action
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">{suggestion?.description}</p>
        <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-xs text-fg-subtle">
          Action: <span className="num">{suggestion?.actionType}</span>
        </p>
      </Modal>
    </>
  );
}
