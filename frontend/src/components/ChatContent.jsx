import {
  AlertTriangle,
  Ban,
  CalendarClock,
  CheckCircle2,
  FileText,
  ListPlus,
  Mail,
  Sparkles,
  Timer,
  UserPlus,
} from "lucide-react";
import { cn } from "../lib/cn";
import { formatDate } from "../lib/format";

/* ───────── Text with light formatting (builds React nodes, never raw HTML) ───────── */

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

/* ───────── Report table (assistant "report" objects) ───────── */

const ALIGN = { left: "text-left", center: "text-center", right: "text-right" };
const MAX_ROWS = 50;

// All values arrive as formatted strings, so they are shown exactly as sent
export function ReportTable({ report }) {
  const { title, columns, rows } = report;
  const shown = rows.slice(0, MAX_ROWS);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface animate-fadeIn">
      {title && (
        <p className="border-b border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-fg">
          {title}
        </p>
      )}
      {shown.length === 0 ? (
        <p className="px-3 py-3 text-sm text-fg-muted">No results.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {title && <caption className="sr-only">{title}</caption>}
            <thead>
              <tr className="border-b border-border text-xs text-fg-muted">
                {columns.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    className={cn("px-3 py-2 font-medium", ALIGN[c.align])}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shown.map((row, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "whitespace-nowrap px-3 py-2 text-fg",
                        ALIGN[c.align],
                        c.align === "right" && "num",
                      )}
                    >
                      {String(row[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length > MAX_ROWS && (
        <p className="border-t border-border px-3 py-2 text-xs text-fg-subtle">
          Showing the first {MAX_ROWS} of {rows.length} rows.
        </p>
      )}
    </div>
  );
}

/* ───────── Action cards ─────────
   The server sends a `summary` for each proposed action. Money is already a formatted
   string ("$1,500.50"), so it is shown as-is and never recomputed. Dates are
   YYYY-MM-DD and are formatted without time zones. */

const str = (v) => (v == null ? "" : String(v));
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}/;
const dateText = (v) => (DATE_ONLY.test(str(v)) ? formatDate(v) : str(v));

const humanize = (s) =>
  String(s || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());

const itemRow = (it) => {
  if (!it || typeof it !== "object") {
    return { description: str(it), detail: "", amount: "" };
  }
  const qty = Number(it.quantity);
  return {
    description: str(it.description) || "Item",
    detail: qty > 1 ? `${qty} × ${str(it.unit_price)}` : "",
    amount: str(it.line_total ?? it.amount ?? it.total),
  };
};

// tone: "default" | "serious" (real emails) | "danger" (destructive)
const ACTIONS = {
  create_client: {
    title: "New client",
    confirmLabel: "Add client",
    icon: UserPlus,
    build: (s) => ({
      rows: [
        { label: "Name", value: str(s.name) },
        { label: "Email", value: str(s.email) },
        s.phone && { label: "Phone", value: str(s.phone), mono: true },
      ],
    }),
  },

  create_invoice: {
    title: "New invoice",
    confirmLabel: (s) =>
      s.new_client ? "Add client and create invoice" : "Create invoice",
    icon: FileText,
    build: (s) => ({
      heading: str(s.client_name) || str(s.new_client?.name),
      newClient:
        s.new_client && typeof s.new_client === "object" ? s.new_client : null,
      copiedFrom: s.copied_from ? str(s.copied_from) : null,
      items: Array.isArray(s.items) ? s.items.map(itemRow) : [],
      rows: [
        s.due_date && {
          label: "Due date",
          value: dateText(s.due_date),
          mono: true,
        },
        s.total && {
          label: "Total",
          value: str(s.total),
          mono: true,
          strong: true,
        },
      ],
    }),
  },

  settle_invoice: {
    title: "Mark as paid",
    confirmLabel: "Mark as paid",
    icon: CheckCircle2,
    build: (s) => ({
      rows: [
        { label: "Invoice", value: str(s.invoice_number), mono: true },
        { label: "Client", value: str(s.client_name) },
        { label: "Amount", value: str(s.total), mono: true, strong: true },
      ],
    }),
  },

  send_reminders: {
    title: "Send reminders",
    confirmLabel: "Send reminders",
    icon: Mail,
    tone: "serious",
    alwaysBuild: true, // the server sends no summary for this one
    build: () => ({
      note: "This emails your clients for real. Check the message above before you confirm.",
    }),
  },

  extend_due_date: {
    title: "Extend due date",
    confirmLabel: "Extend due date",
    icon: CalendarClock,
    build: (s) => ({
      rows: [
        { label: "Invoice", value: str(s.invoice_number), mono: true },
        { label: "Client", value: str(s.client_name) },
        {
          label: "Current due date",
          value: dateText(s.old_due_date),
          mono: true,
        },
        {
          label: "New due date",
          value: dateText(s.new_due_date),
          mono: true,
          strong: true,
        },
      ],
    }),
  },

  void_invoice: {
    title: "Void invoice",
    confirmLabel: "Void invoice",
    icon: Ban,
    tone: "danger",
    build: (s) => ({
      rows: [
        { label: "Invoice", value: str(s.invoice_number), mono: true },
        { label: "Client", value: str(s.client_name) },
        { label: "Total", value: str(s.total), mono: true, strong: true },
      ],
      note: "Voiding is a serious change. Make sure this is the right invoice.",
    }),
  },

  add_invoice_item: {
    title: "Add line item",
    confirmLabel: "Add item",
    icon: ListPlus,
    build: (s) => {
      const isObject = s.item && typeof s.item === "object";
      return {
        itemsLabel: "Item to add",
        items: isObject ? [itemRow(s.item)] : [],
        rows: [
          { label: "Invoice", value: str(s.invoice_number), mono: true },
          { label: "Client", value: str(s.client_name) },
          !isObject && s.item && { label: "Item", value: str(s.item) },
          {
            label: "New total",
            value: str(s.new_total),
            mono: true,
            strong: true,
          },
        ],
      };
    },
  },

  set_client_defaults: {
    title: "Payment terms",
    confirmLabel: "Save terms",
    icon: Timer,
    build: (s) => ({
      rows: [
        { label: "Client", value: str(s.client_name) },
        {
          label: "Payment terms",
          value: Number.isFinite(Number(s.terms_days))
            ? `Net ${Number(s.terms_days)}`
            : str(s.terms_days),
          mono: true,
          strong: true,
        },
      ],
    }),
  },
};

// Actions we don't know yet still get a readable card
function genericBuild(s) {
  const rows = [];
  let items = [];
  for (const [key, value] of Object.entries(s)) {
    if (value == null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length && value.every((v) => v && typeof v === "object")) {
        items = value.map(itemRow);
      }
      continue;
    }
    if (typeof value === "object") continue;
    rows.push({
      label: humanize(key),
      value: /date/i.test(key) ? dateText(value) : str(value),
    });
  }
  return { rows, items };
}

export function describeAction(action, summary) {
  const s = summary && typeof summary === "object" ? summary : null;
  const entry = ACTIONS[action];

  let base = {};
  if (entry && (s || entry.alwaysBuild)) base = entry.build(s || {});
  else if (s) base = genericBuild(s);

  return {
    title: entry?.title || humanize(action) || "Action",
    confirmLabel:
      typeof entry?.confirmLabel === "function"
        ? entry.confirmLabel(s || {})
        : entry?.confirmLabel || "Confirm",
    icon: entry?.icon || Sparkles,
    tone: entry?.tone || "default",
    heading: base.heading || "",
    rows: (base.rows ?? []).filter((r) => r && r.value !== ""),
    items: base.items ?? [],
    itemsLabel: base.itemsLabel || "Items",
    newClient: base.newClient || null,
    copiedFrom: base.copiedFrom || null,
    list: base.list ?? null,
    warnings: base.warnings ?? [],
    note: base.note ?? null,
  };
}

export function ActionDetails({ details }) {
  const {
    heading,
    rows,
    items,
    itemsLabel,
    newClient,
    copiedFrom,
    list,
    warnings,
    note,
  } = details;

  const empty =
    !heading &&
    !rows.length &&
    !items.length &&
    !newClient &&
    !copiedFrom &&
    !list?.length &&
    !warnings.length &&
    !note;
  if (empty) return null;

  return (
    <div className="space-y-2">
      {heading && (
        <p className="text-sm font-semibold text-fg">For {heading}</p>
      )}

      {newClient && (
        <div className="space-y-0.5 rounded-lg border border-accent/30 bg-surface p-3 text-sm">
          <p className="text-xs font-medium text-accent">New client</p>
          <p className="font-medium text-fg">{str(newClient.name)}</p>
          {newClient.email && (
            <p className="text-fg-muted">{str(newClient.email)}</p>
          )}
          {newClient.phone && (
            <p className="num text-xs text-fg-muted">{str(newClient.phone)}</p>
          )}
        </div>
      )}

      {copiedFrom && (
        <p className="text-xs text-fg-subtle">Copied from {copiedFrom}</p>
      )}

      {items.length > 0 && (
        <div>
          {items.length > 0 && itemsLabel !== "Items" && (
            <p className="mb-1 text-xs font-medium text-fg-muted">
              {itemsLabel}
            </p>
          )}
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
            {items.map((it, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-fg">{it.description}</p>
                  {it.detail && (
                    <p className="num text-xs text-fg-subtle">{it.detail}</p>
                  )}
                </div>
                {it.amount && (
                  <span className="num shrink-0 font-medium text-fg">
                    {it.amount}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

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
