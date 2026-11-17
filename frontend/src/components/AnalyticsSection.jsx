import { useState } from "react";
import { BarChart3, Users } from "lucide-react";
import { Card, CardHeader, EmptyState, Skeleton } from "./ui";
import { formatCurrency } from "../lib/format";
import { cn } from "../lib/cn";
import {
  normalizeAging,
  normalizeClients,
  normalizeRevenue,
  useInsight,
} from "../hooks/useAnalytics";

const compact = (cents) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format((Number(cents) || 0) / 100);

function monthLabel(value, long = false) {
  const m = /^(\d{4})-(\d{2})/.exec(String(value));
  if (!m) return String(value);
  return new Date(Date.UTC(+m[1], +m[2] - 1, 1)).toLocaleDateString("en-US", {
    month: long ? "long" : "short",
    year: long ? "numeric" : undefined,
    timeZone: "UTC",
  });
}

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

function Body({ status, error, children }) {
  if (status === "loading") {
    return (
      <div className="space-y-3 p-5">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }
  if (status === "error") {
    return (
      <p role="alert" className="p-5 text-sm text-danger">
        {error || "Couldn't load this."}
      </p>
    );
  }
  return children;
}

function Pills({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            value === o.id
              ? "border-accent bg-accent-soft text-accent"
              : "border-border text-fg-muted hover:bg-surface-2 hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Legend({ color, label, value }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={cn("h-2.5 w-2.5 rounded-sm", color)} aria-hidden />
      <span className="text-fg-muted">{label}</span>
      <span className="num font-semibold text-fg">{value}</span>
    </div>
  );
}

/* ───────── Invoiced vs collected, per month ───────── */

function RevenueCard({ apiBase, token, version }) {
  const [months, setMonths] = useState(6);
  const { status, data, error } = useInsight(
    apiBase,
    token,
    `/api/analytics/revenue?months=${months}`,
    normalizeRevenue,
    version,
  );

  const max = Math.max(1, ...data.flatMap((m) => [m.invoiced, m.collected]));
  const invoiced = data.reduce((s, m) => s + m.invoiced, 0);
  const collected = data.reduce((s, m) => s + m.collected, 0);
  const empty =
    status === "ready" &&
    (data.length === 0 || (invoiced === 0 && collected === 0));
  const height = (v) => (v > 0 ? `${Math.max((v / max) * 100, 3)}%` : "0%");

  return (
    <Card className="h-full">
      <CardHeader
        title="Cash flow"
        description="Invoiced and collected, by month."
        action={
          <Pills
            label="Months shown"
            value={months}
            onChange={setMonths}
            options={[
              { id: 6, label: "6 months" },
              { id: 12, label: "12 months" },
            ]}
          />
        }
      />
      <Body status={status} error={error}>
        {empty ? (
          <EmptyState
            icon={BarChart3}
            title="No activity yet"
            description="Create and collect on invoices to see your cash flow here."
          />
        ) : (
          <div className="p-5">
            <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2">
              <Legend
                color="bg-border-strong"
                label="Invoiced"
                value={formatCurrency(invoiced)}
              />
              <Legend
                color="bg-success"
                label="Collected"
                value={formatCurrency(collected)}
              />
            </div>

            <div aria-hidden className="relative">
              <span className="absolute left-0 top-0 text-[10px] text-fg-subtle">
                {compact(max)}
              </span>
              <div className="flex h-44 items-end gap-2 border-b border-border pt-4 sm:gap-3">
                {data.map((m) => (
                  <div
                    key={m.month}
                    title={`${monthLabel(m.month, true)}: invoiced ${formatCurrency(m.invoiced)}, collected ${formatCurrency(m.collected)}`}
                    className="flex h-full min-w-0 flex-1 items-end justify-center gap-1"
                  >
                    <div
                      className="w-full max-w-4 rounded-t bg-border-strong"
                      style={{ height: height(m.invoiced) }}
                    />
                    <div
                      className="w-full max-w-4 rounded-t bg-success"
                      style={{ height: height(m.collected) }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex gap-2 sm:gap-3">
                {data.map((m) => (
                  <p
                    key={m.month}
                    className="min-w-0 flex-1 truncate text-center text-xs text-fg-subtle"
                  >
                    {monthLabel(m.month)}
                  </p>
                ))}
              </div>
            </div>

            <table className="sr-only">
              <caption>Invoiced and collected per month</caption>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Invoiced</th>
                  <th>Collected</th>
                </tr>
              </thead>
              <tbody>
                {data.map((m) => (
                  <tr key={m.month}>
                    <td>{monthLabel(m.month, true)}</td>
                    <td>{formatCurrency(m.invoiced)}</td>
                    <td>{formatCurrency(m.collected)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Body>
    </Card>
  );
}

/* ───────── What's owed, by how late ───────── */

const AGING_TONES = [
  "bg-accent",
  "bg-warning",
  "bg-warning",
  "bg-danger",
  "bg-danger",
];

function AgingCard({ apiBase, token, version }) {
  const { status, data, error } = useInsight(
    apiBase,
    token,
    "/api/analytics/aging",
    normalizeAging,
    version,
  );
  const max = Math.max(1, ...data.map((b) => b.cents));
  const total = data.reduce((s, b) => s + b.cents, 0);
  const empty = status === "ready" && (data.length === 0 || total === 0);

  return (
    <Card className="h-full">
      <CardHeader title="Aging" description="What's owed, by how late it is." />
      <Body status={status} error={error}>
        {empty ? (
          <EmptyState
            icon={BarChart3}
            title="Nothing outstanding"
            description="Unpaid invoices will show up here by age."
          />
        ) : (
          <div className="p-5">
            <p className="text-sm text-fg-muted">Total outstanding</p>
            <p className="num text-2xl font-semibold tracking-tight">
              {formatCurrency(total)}
            </p>
            <ul className="mt-5 space-y-4">
              {data.map((b, i) => (
                <li key={b.key}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-fg">{b.label}</span>
                    <span className="num font-medium text-fg">
                      {formatCurrency(b.cents)}
                      {b.count > 0 && (
                        <span className="ml-1.5 text-xs font-normal text-fg-subtle">
                          · {b.count} invoice{b.count === 1 ? "" : "s"}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        AGING_TONES[i] ?? "bg-danger",
                      )}
                      style={{
                        width: `${b.cents > 0 ? Math.max((b.cents / max) * 100, 2) : 0}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Body>
    </Card>
  );
}

/* ───────── Clients ranked by a measure ───────── */

const SORTS = [
  {
    id: "outstanding",
    label: "Outstanding",
    value: (c) => c.outstanding,
    money: true,
  },
  { id: "overdue", label: "Overdue", value: (c) => c.overdue, money: true },
  { id: "paid", label: "Paid", value: (c) => c.paid, money: true },
  { id: "invoices", label: "Invoices", value: (c) => c.invoices, money: false },
];

function TopClientsCard({ apiBase, token, version }) {
  const [sortId, setSortId] = useState("outstanding");
  const sort = SORTS.find((s) => s.id === sortId);
  const { status, data, error } = useInsight(
    apiBase,
    token,
    `/api/analytics/clients?sort=${sortId}&limit=5`,
    normalizeClients,
    version,
  );
  const rows = data.filter((c) => sort.value(c) > 0);

  return (
    <Card>
      <CardHeader
        title="Top clients"
        description="Ranked by the measure you choose."
        action={
          <Pills
            label="Rank clients by"
            value={sortId}
            onChange={setSortId}
            options={SORTS}
          />
        }
      />
      <Body status={status} error={error}>
        {rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title={
              sortId === "overdue" ? "Nothing overdue" : "No clients to show"
            }
            description="This list fills in as you invoice your clients."
          />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((c) => (
              <li key={c.id} className="flex items-center gap-4 px-5 py-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                  {initials(c.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">
                    {c.name}
                  </p>
                  {c.email && (
                    <p className="truncate text-sm text-fg-muted">{c.email}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="num text-sm font-semibold text-fg">
                    {sort.money ? formatCurrency(sort.value(c)) : sort.value(c)}
                  </p>
                  <p className="text-xs text-fg-subtle">
                    {c.invoices} invoice{c.invoices === 1 ? "" : "s"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Body>
    </Card>
  );
}

export function AnalyticsSection({ apiBase, token, version }) {
  const shared = { apiBase, token, version };
  return (
    <section aria-label="Insights" className="space-y-6">
      <div className="grid gap-6 2xl:grid-cols-5">
        <div className="2xl:col-span-3">
          <RevenueCard {...shared} />
        </div>
        <div className="2xl:col-span-2">
          <AgingCard {...shared} />
        </div>
      </div>
      <TopClientsCard {...shared} />
    </section>
  );
}
