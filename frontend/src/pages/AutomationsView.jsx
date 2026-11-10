import {
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarClock,
  FileText,
  Mail,
  MessageSquare,
  Repeat,
  Sparkles,
  UserPlus,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  Skeleton,
  StatusBadge,
} from "../components/ui";
import {
  formatCurrency,
  invoiceAmountCents,
  invoiceState,
  lastRemindedOf,
  timeAgo,
} from "../lib/format";

const PROMPTS = [
  {
    icon: Mail,
    title: "Send overdue reminders",
    text: "Prepare emails for every overdue invoice.",
    prompt: "Send reminders for my overdue invoices",
  },
  {
    icon: BarChart3,
    title: "Summarize my business",
    text: "Get a quick read on what's owed and collected.",
    prompt: "How is my business doing?",
  },
  {
    icon: UserPlus,
    title: "Add a client",
    text: "Tell the assistant a name and an email.",
    prompt: "Register a new client named ",
  },
];

const PLANNED = [
  {
    icon: CalendarClock,
    title: "Scheduled reminders",
    text: "Automatically remind clients when an invoice becomes overdue.",
  },
  {
    icon: MessageSquare,
    title: "Text message reminders",
    text: "Send reminders by SMS as well as email.",
  },
  {
    icon: Repeat,
    title: "Recurring invoices",
    text: "Bill repeat clients automatically each month.",
  },
  {
    icon: FileText,
    title: "Weekly summary",
    text: "A Monday email with what's owed and what's overdue.",
  },
  {
    icon: Sparkles,
    title: "Reminder tone",
    text: "Choose friendly, firm, or strict wording.",
  },
];

// Module-level so the render body stays free of clock calls
function withinDays(value, days) {
  const t = new Date(value).getTime();
  return !Number.isNaN(t) && Date.now() - t <= days * 86_400_000;
}

function Stat({ label, value, hint, loading }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-fg-muted">{label}</p>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-24" />
      ) : (
        <p className="num mt-2 text-2xl font-semibold tracking-tight text-fg">
          {value}
        </p>
      )}
      <p className="mt-1 text-xs text-fg-subtle">{hint}</p>
    </Card>
  );
}

export function AutomationsView({
  invoices = [],
  clients = [],
  loading = false,
  onRemind,
  onAskAssistant,
}) {
  const overdue = invoices.filter((inv) => invoiceState(inv) === "overdue");
  const overdueCents = overdue.reduce(
    (sum, inv) => sum + invoiceAmountCents(inv),
    0,
  );

  const history = invoices
    .map((inv) => ({ inv, ...lastRemindedOf(inv) }))
    .filter((x) => x.at && !Number.isNaN(new Date(x.at).getTime()))
    .sort((a, b) => new Date(b.at) - new Date(a.at));
  const fieldKnown = invoices.some((inv) => lastRemindedOf(inv).known);
  const thisWeek = history.filter((x) => withinDays(x.at, 7)).length;

  const noEmail = clients.filter((c) => !c.email?.trim());

  return (
    <>
      <PageHeader
        title="Automations"
        description="Let LedgerFlow handle the follow-ups. You stay in control."
      />

      <section
        aria-label="Reminder overview"
        className="grid gap-4 sm:grid-cols-3"
      >
        <Stat
          label="Overdue invoices"
          value={overdue.length}
          hint="Past their due date"
          loading={loading}
        />
        <Stat
          label="Overdue amount"
          value={formatCurrency(overdueCents)}
          hint="Waiting to be collected"
          loading={loading}
        />
        <Stat
          label="Reminded this week"
          value={fieldKnown ? thisWeek : "—"}
          hint={
            fieldKnown
              ? "Invoices with a reminder in 7 days"
              : "Not available yet"
          }
          loading={loading}
        />
      </section>

      {noEmail.length > 0 && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm text-warning"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            {noEmail.length} client{noEmail.length === 1 ? " has" : "s have"} no
            email address and can't receive reminders:{" "}
            {noEmail
              .slice(0, 3)
              .map((c) => c.name)
              .join(", ")}
            {noEmail.length > 3 && ` and ${noEmail.length - 3} more`}.
          </p>
        </div>
      )}

      {/* Active: payment reminders */}
      <Card>
        <CardHeader
          title="Payment reminders"
          description="Email clients who haven't paid an overdue invoice."
          action={<Badge tone="success">Active</Badge>}
        />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm text-fg-muted">
            {overdue.length > 0
              ? `You have ${overdue.length} overdue invoice${overdue.length === 1 ? "" : "s"}. You'll see exactly who gets emailed before anything is sent. Clients reminded recently are skipped automatically.`
              : "Nothing is overdue right now. When an invoice passes its due date, you can send a reminder from here."}
          </p>
          <Button
            onClick={() => onRemind?.()}
            disabled={overdue.length === 0}
            className="shrink-0"
          >
            <Mail className="h-4 w-4" aria-hidden />
            Review and send
          </Button>
        </div>
      </Card>

      {/* Assistant shortcuts */}
      <Card>
        <CardHeader
          title="Ask the assistant"
          description="Fills the chat for you. Press Send, then confirm before anything changes."
        />
        <div className="grid gap-3 p-5 md:grid-cols-3">
          {PROMPTS.map(({ icon: Icon, title, text, prompt }) => (
            <button
              key={title}
              type="button"
              onClick={() => onAskAssistant?.(prompt)}
              className="flex flex-col items-start gap-2 rounded-xl border border-border p-4 text-left transition-colors hover:border-accent hover:bg-accent-soft"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent-soft text-accent">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-sm font-medium text-fg">{title}</span>
              <span className="text-sm text-fg-muted">{text}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Reminder activity */}
      <Card>
        <CardHeader
          title="Reminder activity"
          description="Your most recent reminders."
        />
        {history.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={
              fieldKnown
                ? "No reminders sent yet"
                : "Activity isn't available yet"
            }
            description={
              fieldKnown
                ? "Reminders you send will show up here."
                : "Once reminder times are tracked for your invoices, they'll appear here."
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {history.slice(0, 5).map(({ inv, at }) => (
              <li
                key={inv.id}
                className="flex items-center justify-between gap-4 px-5 py-3.5"
              >
                <div className="min-w-0">
                  <p className="num text-sm font-medium text-fg">
                    {inv.invoice_number}
                  </p>
                  <p className="truncate text-sm text-fg-muted">
                    {inv.client_name} · Reminded {timeAgo(at)}
                  </p>
                </div>
                <StatusBadge invoice={inv} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Planned */}
      <Card>
        <CardHeader
          title="Coming soon"
          description="What we're building next."
        />
        <ul className="grid gap-px bg-border sm:grid-cols-2">
          {PLANNED.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3 bg-surface p-5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-fg-subtle">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-medium text-fg">{title}</p>
                <p className="mt-0.5 text-sm text-fg-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
