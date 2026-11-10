import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Mail,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { cn } from "../lib/cn";
import { formatCurrency, formatDate, invoiceAmountCents } from "../lib/format";

/* ───────── Text with light formatting ───────── */

function inline(str) {
  return str.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code
          key={i}
          className="num rounded bg-surface px-1 py-0.5 text-[0.85em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    return part;
  });
}

export function RichText({ text = "" }) {
  const lines = String(text).replace(/\\n/g, "\n").split("\n");
  const blocks = [];
  let list = null;

  lines.forEach((raw) => {
    const line = raw.trim();
    const li = /^([-*•]|\d+[.)])\s+(.*)$/.exec(line);
    if (li) {
      if (!list) {
        list = { type: "list", ordered: /^\d/.test(li[1]), items: [] };
        blocks.push(list);
      }
      list.items.push(li[2]);
      return;
    }
    list = null;
    if (line) blocks.push({ type: "p", text: line });
  });

  return (
    <div className="space-y-2">
      {blocks.map((b, i) =>
        b.type === "p" ? (
          <p key={i}>{inline(b.text)}</p>
        ) : b.ordered ? (
          <ol key={i} className="list-decimal space-y-1 pl-5">
            {b.items.map((t, j) => (
              <li key={j}>{inline(t)}</li>
            ))}
          </ol>
        ) : (
          <ul key={i} className="list-disc space-y-1 pl-5">
            {b.items.map((t, j) => (
              <li key={j}>{inline(t)}</li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}

/* ───────── Action registry ─────────
   One entry per AI action the server can propose (`action` in approval_required).
   build() returns what the card shows. To support a new tool, add an entry here.
   If you forget, the generic fallback below still shows a readable card. */

const ACTIONS = {
  create_client: {
    title: "New client",
    confirmLabel: "Add client",
    icon: UserPlus,
    build: ({ data }) => ({
      rows: [
        { label: "Name", value: data.name },
        { label: "Email", value: data.email },
        data.phone_number && {
          label: "Phone",
          value: data.phone_number,
          mono: true,
        },
      ],
    }),
  },

  create_invoice: {
    title: "New invoice",
    confirmLabel: "Create invoice",
    icon: FileText,
    build: ({ data, clients }) => {
      const client = clients.find(
        (c) => Number(c.id) === Number(data.client_id),
      );
      const items = Array.isArray(data.items) ? data.items : [];
      const totalCents = items.reduce(
        (sum, it) =>
          sum +
          Math.round(Number(it.price || 0) * 100) * (Number(it.quantity) || 1),
        0,
      );
      return {
        rows: [
          {
            label: "Client",
            value: client ? client.name : `Client #${data.client_id}`,
          },
          client?.email && { label: "Email", value: client.email },
          { label: "Due date", value: formatDate(data.due_date), mono: true },
          {
            label: "Invoice number",
            value: data.invoice_number || "Assigned automatically",
          },
          {
            label: "Total",
            value: formatCurrency(totalCents),
            mono: true,
            strong: true,
          },
        ],
        items,
        warnings:
          client || clients.length === 0
            ? []
            : [
                "I couldn't match this to a client in your list. Check it before confirming.",
              ],
      };
    },
  },

  settle_invoice: {
    title: "Mark as paid",
    confirmLabel: "Mark as paid",
    icon: CheckCircle2,
    build: ({ data, invoices }) => {
      const inv = invoices.find((i) => Number(i.id) === Number(data.invoiceId));
      if (!inv) {
        return {
          rows: [{ label: "Invoice", value: `#${data.invoiceId}`, mono: true }],
          warnings: invoices.length
            ? [
                "I couldn't match this to an invoice in your list. Check it before confirming.",
              ]
            : [],
        };
      }
      return {
        rows: [
          { label: "Invoice", value: inv.invoice_number, mono: true },
          { label: "Client", value: inv.client_name },
          {
            label: "Amount",
            value: formatCurrency(invoiceAmountCents(inv)),
            mono: true,
            strong: true,
          },
          { label: "Due date", value: formatDate(inv.due_date), mono: true },
        ],
        warnings:
          inv.status === "paid"
            ? ["This invoice is already marked as paid."]
            : [],
      };
    },
  },

  send_reminders: {
    title: "Send reminders",
    confirmLabel: "Send reminders",
    icon: Mail,
    build: ({ data }) => ({
      rows: [{ label: "Channel", value: "Email" }],
      // If the server ever adds `recipients` to data, they're listed here
      list: Array.isArray(data.recipients)
        ? data.recipients
            .map((r) => r.client_name || r.name || r.email)
            .filter(Boolean)
        : null,
      note: "Each client with an overdue invoice gets one email. Clients reminded recently, or without an email, are skipped.",
    }),
  },
};

/* ───────── Generic fallback for actions not in the registry ───────── */

const ID_KEY = /^id$|_id$|[a-z]Id$/; // hides id, client_id, invoiceId, pendingActionId, ...

const humanize = (s) =>
  String(s || "")
    .replace(/(_cents|Cents)$/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());

function formatValue(key, value) {
  if (/_cents$|Cents$/.test(key)) return formatCurrency(value);
  if (/(amount|price|total)$/i.test(key) && !isNaN(Number(value)))
    return formatCurrency(Math.round(Number(value) * 100));
  if (/date/i.test(key)) return formatDate(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function genericBuild(data) {
  const rows = [];
  let items = [];
  for (const [key, value] of Object.entries(data || {})) {
    if (ID_KEY.test(key) || value == null || value === "") continue;
    if (Array.isArray(value)) {
      if (
        value.length &&
        value.every((v) => v && typeof v === "object" && "description" in v)
      ) {
        items = value;
      } else if (value.every((v) => typeof v !== "object")) {
        rows.push({ label: humanize(key), value: value.join(", ") });
      }
      continue;
    }
    if (typeof value === "object") continue;
    rows.push({ label: humanize(key), value: formatValue(key, value) });
  }
  return { rows, items };
}

/* ───────── Public API ───────── */

export function describeAction(action, data = {}, ctx = {}) {
  const clients = ctx.clients ?? [];
  const invoices = ctx.invoices ?? [];
  const entry = ACTIONS[action];
  const base = entry
    ? entry.build({ data, clients, invoices })
    : genericBuild(data);

  return {
    title: entry?.title ?? humanize(action) ?? "Action",
    confirmLabel: entry?.confirmLabel ?? "Confirm",
    icon: entry?.icon ?? Sparkles,
    rows: (base.rows ?? []).filter(Boolean),
    items: base.items ?? [],
    list: base.list ?? null,
    warnings: base.warnings ?? [],
    note: base.note ?? null,
  };
}

export function ActionDetails({ details }) {
  const { rows, items, list, warnings, note } = details;
  if (
    !rows.length &&
    !items.length &&
    !list?.length &&
    !warnings.length &&
    !note
  ) {
    return null;
  }

  return (
    <div className="space-y-2">
      {rows.length > 0 && (
        <dl className="space-y-2 rounded-lg bg-surface p-3 text-sm">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-baseline justify-between gap-4"
            >
              <dt className="text-xs font-medium text-fg-muted">{r.label}</dt>
              <dd
                className={cn(
                  "min-w-0 truncate text-right text-fg",
                  r.mono && "num",
                  r.strong ? "font-semibold" : "font-medium",
                )}
              >
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {items.length > 0 && (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {items.map((it, i) => {
            const qty = Number(it.quantity) || 1;
            const unit =
              it.unit_amount_cents != null
                ? Number(it.unit_amount_cents)
                : Math.round(Number(it.price || 0) * 100);
            return (
              <li
                key={i}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-fg">{it.description || "Item"}</p>
                  {qty > 1 && (
                    <p className="num text-xs text-fg-subtle">
                      {qty} × {formatCurrency(unit)}
                    </p>
                  )}
                </div>
                <span className="num shrink-0 font-medium text-fg">
                  {formatCurrency(qty * unit)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {list?.length > 0 && (
        <ul className="space-y-1 rounded-lg bg-surface p-3 text-sm text-fg">
          {list.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      )}

      {warnings.map((w) => (
        <div
          key={w}
          className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft p-2.5 text-xs text-warning"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{w}</span>
        </div>
      ))}

      {note && <p className="text-xs text-fg-subtle">{note}</p>}
    </div>
  );
}
