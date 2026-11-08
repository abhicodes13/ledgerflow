import { useMemo, useState } from "react";
import { Copy, Plus, Users } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  Skeleton,
  StatusBadge,
  useToast,
} from "../components/ui";
import { formatCurrency, formatDate, invoiceAmountCents } from "../lib/format";
import { cn } from "../lib/cn";

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

export function ClientsView({ data, handleClientSubmitInternal }) {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState(null);

  const clients = data.clientsList || [];

  // TEMPORARY: matches by client_id when the API provides it, otherwise by name.
  // Once findAll returns i.client_id, the name fallback is never used.
  const invoicesFor = (client) =>
    (data.invoicesList || []).filter((inv) =>
      inv.client_id != null
        ? Number(inv.client_id) === Number(client.id)
        : inv.client_name === client.name,
    );

  const stats = useMemo(() => {
    const map = new Map();
    clients.forEach((c) => {
      const list = invoicesFor(c);
      let billed = 0;
      let outstanding = 0;
      list.forEach((inv) => {
        const amt = invoiceAmountCents(inv);
        billed += amt;
        if (inv.status !== "paid") outstanding += amt;
      });
      map.set(c.id, { count: list.length, billed, outstanding, list });
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, data.invoicesList]);

  const q = query.trim().toLowerCase();
  const visible = q
    ? clients.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q),
      )
    : clients;

  const submitClient = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await handleClientSubmitInternal(e);
    setSubmitting(false);
    if (ok) setCreateOpen(false);
  };

  const copyEmail = async (email) => {
    try {
      await navigator.clipboard.writeText(email);
      toast.success("Email copied");
    } catch {
      toast.error("Couldn't copy to the clipboard");
    }
  };

  const selStats = selected ? stats.get(selected.id) : null;

  return (
    <>
      <PageHeader
        title="Clients"
        description="The people and companies you bill."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Add client
          </Button>
        }
      />

      <div className="space-y-4">
        <SearchInput
          aria-label="Search clients"
          placeholder="Search by name or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full sm:max-w-xs"
        />

        <Card className="overflow-hidden">
          {data.loading ? (
            <div className="space-y-4 p-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              icon={Users}
              title={q ? "No clients match your search" : "No clients yet"}
              description={
                q
                  ? "Try a different name or email."
                  : "Add your first client to start invoicing."
              }
              action={
                !q && (
                  <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4" aria-hidden />
                    Add client
                  </Button>
                )
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((client) => {
                const s = stats.get(client.id);
                return (
                  <li key={client.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(client)}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                        {initials(client.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">
                          {client.name}
                        </p>
                        <p className="truncate text-sm text-fg-muted">
                          {client.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            "num text-sm font-semibold",
                            s?.outstanding > 0
                              ? "text-warning"
                              : "text-fg-subtle",
                          )}
                        >
                          {formatCurrency(s?.outstanding)}
                        </p>
                        <p className="text-xs text-fg-subtle">
                          {s?.count || 0} invoice{s?.count === 1 ? "" : "s"}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* ── Add client ── */}
      <Modal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Add client"
        description="You can invoice them right after."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="client-form"
              loading={submitting}
              disabled={!data.clientName?.trim() || !data.clientEmail?.trim()}
            >
              Add client
            </Button>
          </>
        }
      >
        <form id="client-form" onSubmit={submitClient} className="space-y-4">
          <Input
            label="Name"
            value={data.clientName || ""}
            onChange={(e) => data.setClientName(e.target.value)}
            placeholder="Acme Corporation"
            autoComplete="organization"
            required
          />
          <Input
            label="Billing email"
            type="email"
            value={data.clientEmail || ""}
            onChange={(e) => data.setClientEmail(e.target.value)}
            placeholder="billing@acme.co"
            autoComplete="email"
            required
          />
        </form>
      </Modal>

      {/* ── Client detail ── */}
      <Modal
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected?.name ?? ""}
        description={selected?.email}
        size="md"
        footer={
          selected && (
            <>
              <Button
                variant="secondary"
                onClick={() => copyEmail(selected.email)}
              >
                <Copy className="h-4 w-4" aria-hidden />
                Copy email
              </Button>
              <Button onClick={() => setSelected(null)}>Done</Button>
            </>
          )
        }
      >
        {selected && selStats && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Billed", value: formatCurrency(selStats.billed) },
                {
                  label: "Outstanding",
                  value: formatCurrency(selStats.outstanding),
                  warn: selStats.outstanding > 0,
                },
                { label: "Invoices", value: selStats.count },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-surface-2 p-3">
                  <p className="text-xs font-medium text-fg-muted">{m.label}</p>
                  <p
                    className={cn(
                      "num mt-1 text-sm font-semibold sm:text-base",
                      m.warn ? "text-warning" : "text-fg",
                    )}
                  >
                    {m.value}
                  </p>
                </div>
              ))}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-fg">Invoices</h3>
              {selStats.list.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-fg-muted">
                  No invoices for this client yet.
                </p>
              ) : (
                <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                  {selStats.list.map((inv) => (
                    <li
                      key={inv.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="num text-sm font-medium text-fg">
                          {inv.invoice_number}
                        </p>
                        <p className="text-xs text-fg-subtle">
                          Due {formatDate(inv.due_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge invoice={inv} />
                        <span className="num text-sm font-medium text-fg">
                          {formatCurrency(invoiceAmountCents(inv))}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selected.created_at && (
              <p className="text-xs text-fg-subtle">
                Client since {formatDate(selected.created_at)}
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
