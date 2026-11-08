import { formatCurrency, formatDate } from "../lib/format";

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

/* ───────── Pending action details ───────── */

const HIDDEN = new Set(["user_id", "id"]);

const label = (key) =>
  key
    .replace(/_cents$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());

function formatValue(key, value) {
  if (value === null || value === undefined || value === "") return "—";
  if (/_cents$/.test(key)) return formatCurrency(value);
  // Assumes plain amount/price/total fields are in dollars (matches "amount $2000")
  if (/(amount|price|total)$/i.test(key) && !isNaN(Number(value)))
    return formatCurrency(Number(value) * 100);
  if (/date/i.test(key)) return formatDate(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function ItemsList({ items }) {
  return (
    <ul className="mt-1 divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {items.map((it, i) => {
        const qty = Number(it.quantity) || 1;
        const price = Number(it.price ?? 0);
        return (
          <li
            key={i}
            className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
          >
            <span className="min-w-0 truncate text-fg">
              {it.description || "Item"}
            </span>
            <span className="num shrink-0 text-fg-muted">
              {qty} × {formatCurrency(price * 100)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function DetailsCard({ data }) {
  if (!data || typeof data !== "object") return null;
  const entries = Object.entries(data).filter(
    ([k, v]) => !HIDDEN.has(k) && v !== undefined,
  );
  if (entries.length === 0) return null;

  return (
    <dl className="space-y-2 rounded-lg bg-surface p-3 text-sm">
      {entries.map(([key, value]) =>
        Array.isArray(value) ? (
          <div key={key}>
            <dt className="text-xs font-medium text-fg-muted">{label(key)}</dt>
            <dd>
              {value.every((v) => v && typeof v === "object") ? (
                <ItemsList items={value} />
              ) : (
                <span className="text-fg">{value.join(", ")}</span>
              )}
            </dd>
          </div>
        ) : typeof value === "object" && value !== null ? null : (
          <div key={key} className="flex items-baseline justify-between gap-4">
            <dt className="text-xs font-medium text-fg-muted">{label(key)}</dt>
            <dd className="num min-w-0 truncate text-right font-medium text-fg">
              {formatValue(key, value)}
            </dd>
          </div>
        ),
      )}
    </dl>
  );
}
