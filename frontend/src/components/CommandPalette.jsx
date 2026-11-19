import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  CornerDownLeft,
  CreditCard,
  FileText,
  LogOut,
  Mail,
  Monitor,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
  UserPlus,
  Users,
} from "lucide-react";
import { NAV, SOON_NAV } from "./layout/nav";
import {
  formatCurrency,
  invoiceAmountCents,
  invoiceState,
} from "../lib/format";
import { shortcutLabel } from "../lib/platform";
import { cn } from "../lib/cn";

const norm = (s) => String(s ?? "").toLowerCase();
const STATE_LABEL = { paid: "Paid", pending: "Pending", overdue: "Overdue" };

// Every typed word must appear somewhere in the item. Matches at the start of the label rank higher.
function score(item, tokens) {
  if (!tokens.length) return 1;
  const label = norm(item.label);
  const haystack = `${label} ${norm(item.hint)} ${norm(item.keywords)}`;
  let total = 0;
  for (const t of tokens) {
    if (!haystack.includes(t)) return 0;
    total += label.startsWith(t) ? 3 : label.includes(t) ? 2 : 1;
  }
  return total;
}

function Kbd({ children, className }) {
  return (
    <kbd
      className={cn(
        "num rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-fg-subtle",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

function PaletteBody({
  invoices,
  clients,
  overdueCount,
  theme,
  setTheme,
  onGo,
  onRemind,
  onAskAssistant,
  onLogout,
  onClose,
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = "command-palette-list";

  const sections = useMemo(() => {
    const tokens = norm(query).split(/\s+/).filter(Boolean);
    const searching = tokens.length > 0;
    const match = (items) =>
      items
        .map((item) => ({ item, s: score(item, tokens) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .map((x) => x.item);

    const actions = [
      {
        id: "a-invoice",
        label: "New invoice",
        hint: "Create an invoice",
        icon: Plus,
        keywords: "create add draft bill",
        run: () => onGo("/app/invoices?new=1"),
      },
      {
        id: "a-client",
        label: "Add client",
        hint: "Register a new client",
        icon: UserPlus,
        keywords: "new create register customer",
        run: () => onGo("/app/clients?new=1"),
      },
      overdueCount > 0 && {
        id: "a-remind",
        label: "Send overdue reminders",
        hint: `${overdueCount} overdue invoice${overdueCount === 1 ? "" : "s"}`,
        icon: Mail,
        keywords: "remind email chase collect",
        run: () => onRemind(),
      },
      {
        id: "a-ai",
        label: "Ask the AI assistant",
        hint: "Open the assistant",
        icon: Sparkles,
        keywords: "chat help ai",
        run: () => onAskAssistant(""),
      },
    ].filter(Boolean);

    const go = [...NAV, ...SOON_NAV].map((n) => ({
      id: `g-${n.id}`,
      label: n.label,
      hint: "Go to page",
      icon: n.icon,
      keywords: n.id,
      run: () => onGo(n.to),
    }));
    go.push({
      id: "g-payments",
      label: "Payments",
      hint: "Set up online payments",
      icon: CreditCard,
      keywords: "stripe connect card",
      run: () => onGo("/app/settings/payments"),
    });

    const prefs = [
      { id: "p-light", label: "Theme: Light", icon: Sun, id2: "light" },
      { id: "p-dark", label: "Theme: Dark", icon: Moon, id2: "dark" },
      { id: "p-system", label: "Theme: System", icon: Monitor, id2: "system" },
    ].map((p) => ({
      id: p.id,
      label: p.label,
      hint: theme === p.id2 ? "Current" : "Appearance",
      icon: p.icon,
      keywords: "theme appearance dark light mode",
      run: () => setTheme(p.id2),
    }));
    prefs.push({
      id: "p-out",
      label: "Sign out",
      hint: "Log out of LedgerFlow",
      icon: LogOut,
      keywords: "logout log out",
      run: () => onLogout(),
    });

    const invoiceItems = (invoices || []).map((inv) => {
      const state = invoiceState(inv);
      return {
        id: `i-${inv.id}`,
        label: String(inv.invoice_number ?? `Invoice ${inv.id}`),
        hint: [
          inv.client_name,
          formatCurrency(invoiceAmountCents(inv)),
          STATE_LABEL[state],
        ]
          .filter(Boolean)
          .join(" · "),
        icon: FileText,
        keywords: `${inv.client_name ?? ""} ${state}`,
        run: () => onGo(`/app/invoices?invoice=${inv.id}`),
      };
    });

    const clientItems = (clients || []).map((c) => {
      const phone = c.phone_number ?? c.phone ?? "";
      return {
        id: `c-${c.id}`,
        label: String(c.name ?? "Client"),
        hint: [c.email, phone].filter(Boolean).join(" · "),
        icon: Users,
        keywords: String(phone),
        run: () => onGo(`/app/clients?client=${c.id}`),
      };
    });

    const out = [];
    if (!searching) {
      out.push({ title: "Actions", items: actions });
      out.push({ title: "Recent invoices", items: invoiceItems.slice(0, 3) });
      out.push({ title: "Go to", items: go });
    } else {
      out.push({ title: "Actions", items: match(actions) });
      out.push({ title: "Go to", items: match(go) });
      out.push({ title: "Invoices", items: match(invoiceItems).slice(0, 5) });
      out.push({ title: "Clients", items: match(clientItems).slice(0, 5) });
      out.push({ title: "Preferences", items: match(prefs) });
    }
    return out.filter((s) => s.items.length);
  }, [
    query,
    invoices,
    clients,
    overdueCount,
    theme,
    setTheme,
    onGo,
    onRemind,
    onAskAssistant,
    onLogout,
  ]);

  const flat = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  const indexOf = useMemo(
    () => new Map(flat.map((it, i) => [it.id, i])),
    [flat],
  );
  const current = Math.min(active, Math.max(flat.length - 1, 0));

  // Keep the highlighted row visible while moving with the arrow keys
  useEffect(() => {
    const id = flat[current]?.id;
    if (id)
      document.getElementById(`cp-${id}`)?.scrollIntoView({ block: "nearest" });
  }, [current, flat]);

  // Close first, then run, so a modal opened by the command isn't fighting this one
  const pick = (item) => {
    onClose();
    setTimeout(item.run, 60);
  };

  const onKeyDown = (e) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (flat.length) setActive((current + 1) % flat.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flat.length) setActive((current - 1 + flat.length) % flat.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flat[current]) pick(flat[current]);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border px-4">
        <Search className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden />
        <input
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={
            flat[current] ? `cp-${flat[current].id}` : undefined
          }
          aria-autocomplete="list"
          aria-label="Search pages, invoices, and clients, or run a command"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search or run a command..."
          autoComplete="off"
          spellCheck={false}
          className="h-12 min-w-0 flex-1 bg-transparent text-base text-fg placeholder:text-fg-subtle focus:outline-none sm:text-sm"
        />
        <Kbd className="hidden sm:inline">Esc</Kbd>
      </div>

      <div
        id={listId}
        role="listbox"
        aria-label="Results"
        className="max-h-[min(24rem,55vh)] overflow-y-auto overscroll-contain pb-2"
      >
        {flat.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-fg-muted">
            No results for “{query.trim()}”.
          </p>
        ) : (
          sections.map((sec) => (
            <div key={sec.title} role="group" aria-label={sec.title}>
              <p
                aria-hidden
                className="px-4 pb-1 pt-3 text-xs font-medium text-fg-subtle"
              >
                {sec.title}
              </p>
              {sec.items.map((item) => {
                const idx = indexOf.get(item.id);
                const selected = idx === current;
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    id={`cp-${item.id}`}
                    role="option"
                    aria-selected={selected}
                    onMouseMove={() => !selected && setActive(idx)}
                    onClick={() => pick(item)}
                    className={cn(
                      "mx-2 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5",
                      selected && "bg-accent-soft",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                        selected
                          ? "bg-surface text-accent"
                          : "bg-surface-2 text-fg-subtle",
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate text-sm font-medium",
                          selected ? "text-accent" : "text-fg",
                        )}
                      >
                        {item.label}
                      </p>
                      {item.hint && (
                        <p className="truncate text-xs text-fg-muted">
                          {item.hint}
                        </p>
                      )}
                    </div>
                    {selected && (
                      <CornerDownLeft
                        className="h-4 w-4 shrink-0 text-accent"
                        aria-hidden
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <div className="hidden items-center gap-4 border-t border-border bg-surface-2 px-4 py-2 text-xs text-fg-subtle sm:flex">
        <span className="flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> to move
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>↵</Kbd> to open
        </span>
        <span className="ml-auto">{shortcutLabel} to toggle</span>
      </div>
    </>
  );
}

export function CommandPalette({ open, onOpenChange, ...rest }) {
  // Cmd/Ctrl+K from anywhere in the app
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      if (e.key.toLowerCase() !== "k") return;
      // Don't stack on top of another open dialog
      if (!open && document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      onOpenChange(!open);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 animate-fadeIn bg-[var(--overlay)] backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 top-[8vh] z-50 mx-auto w-[calc(100%-2rem)] max-w-xl animate-fadeIn overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-pop)] focus:outline-none sm:top-[14vh]"
        >
          <Dialog.Title className="sr-only">Search and commands</Dialog.Title>
          <PaletteBody {...rest} onClose={() => onOpenChange(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
