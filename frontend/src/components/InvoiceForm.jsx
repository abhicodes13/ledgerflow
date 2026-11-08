import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Copy,
  FileText,
  Mail,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  Select,
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

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "overdue", label: "Overdue" },
  { id: "paid", label: "Paid" },
];

const blankItem = () => ({ description: "", quantity: 1, price: "" });

export function InvoicesView({
  data,
  filteredInvoices,
  handleInvoiceSubmitInternal,
  handleSettleInternal,
  onNavigate,
}) {
  const toast = useToast();
  const [filter, setFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState(null);
  const [settling, setSettling] = useState(false);
  // Line items for the open invoice. Loading = detail.id !== selected.id
  const [detail, setDetail] = useState({ id: null, items: [] });

  const formItems =
    Array.isArray(data.items) && data.items.length ? data.items : [blankItem()];

  const counts = useMemo(() => {
    const c = { all: filteredInvoices.length, pending: 0, overdue: 0, paid: 0 };
    filteredInvoices.forEach((inv) => {
      c[invoiceState(inv)] += 1;
    });
    return c;
  }, [filteredInvoices]);

  const visible =
    filter === "all"
      ? filteredInvoices
      : filteredInvoices.filter((inv) => invoiceState(inv) === filter);

  // Try to load real line items. If the endpoint doesn't exist yet,
  // quietly fall back to a single summary row.
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    const id = selected.id;
    fetch(`${data.API_BASE}/api/invoices/${id}/items`, {
      headers: { Authorization: `Bearer ${data.token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((payload) => {
        if (!cancelled)
          setDetail({
            id,
            items: Array.isArray(payload.items) ? payload.items : [],
          });
      })
      .catch(() => {
        if (!cancelled) setDetail({ id, items: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [selected, data.API_BASE, data.token]);

  const itemsLoading = !!selected && detail.id !== selected.id;

  // ── Create invoice ──
  const updateItem = (index, field, value) =>
    data.setItems(
      formItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  const addItem = () => data.setItems([...formItems, blankItem()]);
  const removeItem = (index) =>
    formItems.length > 1 &&
    data.setItems(formItems.filter((_, i) => i !== index));

  const totalCents = Math.round(
    formItems.reduce(
      (sum, i) => sum + (Number(i.quantity) || 0) * (parseFloat(i.price) || 0),
      0,
    ) * 100,
  );

  const formValid =
    data.selectedClientId &&
    data.invoiceNumber?.trim() &&
    data.dueDate &&
    formItems.every(
      (i) =>
        i.description.trim() &&
        Number(i.quantity) > 0 &&
        parseFloat(i.price) >= 0,
    );

  const submitInvoice = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await handleInvoiceSubmitInternal(e);
    setSubmitting(false);
    if (ok) setCreateOpen(false);
  };

  // ── Detail actions ──
  const copyLink = async (inv) => {
    const link = `${window.location.origin}/checkout/statement/${inv.invoice_number}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied (preview: the checkout page isn't built yet)");
    } catch {
      toast.error("Couldn't copy to the clipboard");
    }
  };

  const settle = async () => {
    setSettling(true);
    const ok = await handleSettleInternal(selected.id);
    setSettling(false);
    if (ok) setSelected(null);
  };

  const detailRows =
    selected && !itemsLoading && detail.items.length > 0
      ? detail.items.map((it) => ({
          key: it.id ?? it.description,
          description: it.description,
          quantity: it.quantity,
          unit: it.unit_amount_cents,
        }))
      : selected
        ? [
            {
              key: "summary",
              description: "Invoice total",
              quantity: 1,
              unit: invoiceAmountCents(selected),
            },
          ]
        : [];

  const searching = !!data.searchTerm;

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Create, track, and collect payment on your invoices."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            New invoice
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by status"
          >
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  filter === f.id
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border text-fg-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                {f.label}
                <span className="num ml-1.5 text-xs opacity-70">
                  {counts[f.id]}
                </span>
              </button>
            ))}
          </div>
          <SearchInput
            aria-label="Search invoices"
            placeholder="Search invoice or client..."
            value={data.searchTerm || ""}
            onChange={(e) => data.setSearchTerm(e.target.value)}
            className="w-full lg:w-72"
          />
        </div>

        <Card className="overflow-hidden">
          {data.loading ? (
            <div className="space-y-4 p-5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={
                searching || filter !== "all"
                  ? "No invoices match your filters"
                  : "No invoices yet"
              }
              description={
                searching || filter !== "all"
                  ? "Try a different search or status."
                  : "Create your first invoice to get started."
              }
              action={
                !searching &&
                filter === "all" && (
                  <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4" aria-hidden />
                    New invoice
                  </Button>
                )
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((inv) => (
                <li key={inv.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(inv)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="num text-sm font-medium text-fg">
                        {inv.invoice_number}
                      </p>
                      <p className="truncate text-sm text-fg-muted">
                        {inv.client_name}
                      </p>
                    </div>
                    <p className="hidden w-36 text-sm text-fg-muted sm:block">
                      {inv.due_date
                        ? `Due ${formatDate(inv.due_date)}`
                        : "No due date"}
                    </p>
                    <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-4">
                      <StatusBadge invoice={inv} />
                      <span className="num w-24 text-right text-sm font-semibold text-fg">
                        {formatCurrency(invoiceAmountCents(inv))}
                      </span>
                    </div>
                    <ChevronRight
                      className="hidden h-4 w-4 shrink-0 text-fg-subtle sm:block"
                      aria-hidden
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ── New invoice ── */}
      <Modal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New invoice"
        description="Add the details and line items."
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="invoice-form"
              loading={submitting}
              disabled={!formValid}
            >
              Create invoice
            </Button>
          </>
        }
      >
        <form id="invoice-form" onSubmit={submitInvoice} className="space-y-6">
          {(data.clientsList?.length ?? 0) === 0 && (
            <div className="rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm text-warning">
              You need a client first.{" "}
              <button
                type="button"
                className="font-medium underline"
                onClick={() => {
                  setCreateOpen(false);
                  onNavigate?.("customers");
                }}
              >
                Add a client
              </button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Client"
              value={data.selectedClientId || ""}
              onChange={(e) => data.setSelectedClientId(e.target.value)}
              required
            >
              <option value="">Select a client</option>
              {data.clientsList?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input
              label="Invoice number"
              value={data.invoiceNumber || ""}
              onChange={(e) => data.setInvoiceNumber(e.target.value)}
              placeholder="INV-0001"
              required
            />
            <Input
              label="Due date"
              type="date"
              value={data.dueDate || ""}
              onChange={(e) => data.setDueDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-fg">Line items</h3>
              <Button variant="ghost" size="sm" onClick={addItem}>
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Add item
              </Button>
            </div>

            <div className="hidden grid-cols-12 gap-2 px-0.5 text-xs font-medium text-fg-muted sm:grid">
              <span className="col-span-6">Description</span>
              <span className="col-span-2">Qty</span>
              <span className="col-span-3">Price (USD)</span>
            </div>

            {formItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 items-center gap-2">
                <Input
                  aria-label={`Item ${idx + 1} description`}
                  className="col-span-12"
                  wrapperClassName="col-span-12 sm:col-span-6"
                  value={item.description}
                  onChange={(e) =>
                    updateItem(idx, "description", e.target.value)
                  }
                  placeholder="Description"
                />
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    aria-label={`Item ${idx + 1} quantity`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(idx, "quantity", e.target.value)
                    }
                    className="num"
                  />
                </div>
                <div className="col-span-5 sm:col-span-3">
                  <Input
                    aria-label={`Item ${idx + 1} price`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => updateItem(idx, "price", e.target.value)}
                    placeholder="0.00"
                    className="num"
                  />
                </div>
                <div className="col-span-3 flex justify-end sm:col-span-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(idx)}
                    disabled={formItems.length <= 1}
                    aria-label={`Remove item ${idx + 1}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
            <span className="text-sm font-medium text-fg-muted">Total</span>
            <span className="num text-xl font-semibold text-fg">
              {formatCurrency(totalCents)}
            </span>
          </div>
        </form>
      </Modal>

      {/* ── Invoice detail ── */}
      <Modal
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected ? `Invoice ${selected.invoice_number}` : ""}
        size="lg"
        footer={
          selected && (
            <>
              <Button variant="secondary" onClick={() => copyLink(selected)}>
                <Copy className="h-4 w-4" aria-hidden />
                Copy link
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  toast.info(
                    `Preview: emailing ${selected.client_name} isn't connected yet`,
                  )
                }
              >
                <Mail className="h-4 w-4" aria-hidden />
                Send email
              </Button>
              {selected.status !== "paid" ? (
                <Button onClick={settle} loading={settling}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Mark as paid
                </Button>
              ) : (
                <span className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-success-soft px-4 text-sm font-medium text-success">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Paid
                </span>
              )}
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-fg-muted">Billed to</p>
                <p className="mt-0.5 text-base font-semibold text-fg">
                  {selected.client_name}
                </p>
              </div>
              <StatusBadge invoice={selected} />
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-xl bg-surface-2 p-4">
              <div>
                <p className="text-xs font-medium text-fg-muted">Due date</p>
                <p className="mt-0.5 text-sm font-medium text-fg">
                  {formatDate(selected.due_date)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-fg-muted">Amount</p>
                <p className="num mt-0.5 text-sm font-semibold text-fg">
                  {formatCurrency(invoiceAmountCents(selected))}
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-fg">Items</h3>
              {itemsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border">
                  <ul className="divide-y divide-border">
                    {detailRows.map((row) => (
                      <li
                        key={row.key}
                        className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-fg">{row.description}</p>
                          {row.quantity > 1 && (
                            <p className="num text-xs text-fg-subtle">
                              {row.quantity} × {formatCurrency(row.unit)}
                            </p>
                          )}
                        </div>
                        <span className="num shrink-0 font-medium text-fg">
                          {formatCurrency(row.quantity * row.unit)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between bg-surface-2 px-4 py-3">
                    <span className="text-sm font-medium text-fg-muted">
                      Total
                    </span>
                    <span className="num text-base font-semibold text-fg">
                      {formatCurrency(invoiceAmountCents(selected))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
