import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  ChevronRight,
  Copy,
  CreditCard,
  Download,
  FileText,
  Mail,
  Plus,
  Trash2,
  Send,
} from "lucide-react";
import {
  Badge,
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
import { RemindedNote } from "../components/ReminderModal";
import { NewClientInline } from "../components/NewClientInline";
import { SendInvoiceModal } from "../components/SendInvoiceModal";
import {
  dateInDays,
  daysUntilDue,
  formatCurrency,
  formatDate,
  invoiceAmountCents,
  invoiceClientEmail,
  invoiceState,
  isPaidOnline,
  lastRemindedOf,
  timeAgo,
} from "../lib/format";
import { exportInvoices } from "../lib/exports";
import { fetchPdfBlob, saveBlob } from "../lib/api";
import { getTerms, rememberTerms } from "../lib/terms";
import { usePaymentLink } from "../hooks/usePaymentLink";
import { cn } from "../lib/cn";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "overdue", label: "Overdue" },
  { id: "paid", label: "Paid" },
];

const DUE_PRESETS = [
  { label: "On receipt", days: 0 },
  { label: "Net 15", days: 15 },
  { label: "Net 30", days: 30 },
  { label: "Net 45", days: 45 },
];

const NEW_CLIENT = "__new__";
const blankItem = () => ({ description: "", quantity: 1, price: "" });

export function InvoicesView({
  data,
  filteredInvoices,
  handleInvoiceSubmitInternal,
  handleSettleInternal,
  onRemind,
}) {
  const toast = useToast();
  const [filter, setFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [addingClient, setAddingClient] = useState(false);
  const [pendingClient, setPendingClient] = useState(null); // a client just added, waiting for the list to refresh
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState(null);
  const [settling, setSettling] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [emailing, setEmailing] = useState(null); // the invoice being emailed
  // Line items for the open invoice. Loading = detail.id !== selected.id
  const [detail, setDetail] = useState({ id: null, items: [] });

  const username = data.currentUser?.username;
  const clients = data.clientsList || [];
  // The inline form shows when asked for, or when there are no clients yet
  const showInline = !pendingClient && (addingClient || clients.length === 0);

  // Deep links: /app/invoices?new=1 opens the form, ?invoice=ID opens that invoice
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    const wantNew = params.get("new") === "1";
    const wantId = params.get("invoice");
    if (!wantNew && !wantId) return;

    if (wantId) {
      const list = data.invoicesList || [];
      const found = list.find((i) => String(i.id) === wantId);
      if (!found) {
        // Wait while the list loads. Once it has, a missing invoice just drops the link.
        if (list.length > 0) setParams({}, { replace: true });
        return;
      }
      setSelected(found);
    }
    if (wantNew) setCreateOpen(true);
    setParams({}, { replace: true });
  }, [params, setParams, data.invoicesList]);

  // After adding a client inline, select them as soon as the refreshed list has them
  useEffect(() => {
    if (!pendingClient) return;
    const found = clients.find(
      (c) =>
        (pendingClient.id != null &&
          String(c.id) === String(pendingClient.id)) ||
        String(c.email ?? "").toLowerCase() === pendingClient.email,
    );
    if (!found) return;
    data.setSelectedClientId(String(found.id));
    setPendingClient(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingClient, data.clientsList]);

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

  // Try to load real line items. If the endpoint doesn't exist,
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

  // Online payment link for the open invoice (only unpaid, non-void invoices can be paid)
  const payable =
    !!selected && selected.status !== "paid" && selected.status !== "void";
  const payLink = usePaymentLink({
    apiBase: data.API_BASE,
    token: data.token,
    invoiceId: selected?.id,
    active: payable,
  });

  // ── Create invoice ──
  const changeCreateOpen = (open) => {
    setCreateOpen(open);
    if (!open) {
      setAddingClient(false);
      setPendingClient(null);
    }
  };

  const chooseClient = (value) => {
    setPendingClient(null);
    if (value === NEW_CLIENT) {
      setAddingClient(true);
      data.setSelectedClientId("");
      return;
    }
    setAddingClient(false);
    data.setSelectedClientId(value);
    // Pre-fill the due date with this client's usual terms, unless one is already set
    if (value && !data.dueDate) {
      const days = getTerms(username, value);
      if (days !== null) data.setDueDate(dateInDays(days));
    }
  };

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

  // Invoice number is optional: the server assigns one when it's empty
  const formValid =
    data.selectedClientId &&
    data.dueDate &&
    formItems.every(
      (i) =>
        i.description.trim() &&
        Number(i.quantity) > 0 &&
        parseFloat(i.price) >= 0,
    );

  const submitInvoice = async (e) => {
    e.preventDefault();
    // Read these now: the form is cleared as soon as the invoice is saved
    const clientId = data.selectedClientId;
    const days = daysUntilDue(data.dueDate);
    setSubmitting(true);
    const ok = await handleInvoiceSubmitInternal(e);
    setSubmitting(false);
    if (ok) {
      rememberTerms(username, clientId, days);
      changeCreateOpen(false);
    }
  };

  const exportCsv = () => {
    exportInvoices(visible, data.clientsList);
    toast.success(
      `Exported ${visible.length} invoice${visible.length === 1 ? "" : "s"}`,
    );
  };

  // ── Detail actions ──
  const copyPaymentLink = async () => {
    if (!payLink.url) return;
    try {
      await navigator.clipboard.writeText(payLink.url);
      toast.success("Payment link copied");
    } catch {
      toast.error("Couldn't copy to the clipboard");
    }
  };

  const downloadPdf = async (inv) => {
    setDownloading(true);
    try {
      const blob = await fetchPdfBlob(
        `${data.API_BASE}/api/invoices/${inv.id}/pdf`,
        data.token,
      );
      const safe = String(inv.invoice_number || inv.id).replace(
        /[^\w.-]+/g,
        "_",
      );
      saveBlob(blob, `${safe}.pdf`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDownloading(false);
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

  const selEmail = selected
    ? invoiceClientEmail(selected, data.clientsList)
    : "";
  const selReminded = selected ? lastRemindedOf(selected) : { known: false };
  const searching = !!data.searchTerm;

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Create, track, and collect payment on your invoices."
        actions={
          <>
            {counts.overdue > 0 && (
              <Button variant="secondary" onClick={() => onRemind?.()}>
                <Mail className="h-4 w-4" aria-hidden />
                Send reminders
              </Button>
            )}
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              New invoice
            </Button>
          </>
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
          <div className="flex gap-2">
            <SearchInput
              aria-label="Search invoices"
              placeholder="Search invoice or client..."
              value={data.searchTerm || ""}
              onChange={(e) => data.setSearchTerm(e.target.value)}
              className="min-w-0 flex-1 lg:w-72 lg:flex-none"
            />
            <Button
              variant="secondary"
              className="shrink-0"
              onClick={exportCsv}
              disabled={visible.length === 0}
            >
              <Download className="h-4 w-4" aria-hidden />
              Export CSV
            </Button>
          </div>
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
                        {inv.status !== "paid" && (
                          <RemindedNote invoice={inv} />
                        )}
                        {isPaidOnline(inv) && " · Paid online"}
                      </p>
                    </div>
                    <p className="hidden w-36 text-sm text-fg-muted sm:block">
                      {inv.due_date
                        ? `Due ${formatDate(inv.due_date)}`
                        : "No due date"}
                    </p>
                    <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex sm:w-24 sm:justify-end">
                        <StatusBadge invoice={inv} />
                      </div>
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
        onOpenChange={changeCreateOpen}
        title="New invoice"
        description="Add the details and line items."
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => changeCreateOpen(false)}>
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
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Client"
              value={showInline ? NEW_CLIENT : data.selectedClientId || ""}
              onChange={(e) => chooseClient(e.target.value)}
              required
            >
              <option value="">Select a client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value={NEW_CLIENT}>+ New client…</option>
            </Select>
            <Input
              label="Invoice number (optional)"
              hint="Leave blank and we'll number it for you."
              value={data.invoiceNumber || ""}
              onChange={(e) => data.setInvoiceNumber(e.target.value)}
              placeholder="Assigned automatically"
            />
            <div className="space-y-2">
              <Input
                label="Due date"
                type="date"
                value={data.dueDate || ""}
                onChange={(e) => data.setDueDate(e.target.value)}
                required
              />
              <div
                role="group"
                aria-label="Due date presets"
                className="flex flex-wrap gap-1.5"
              >
                {DUE_PRESETS.map((p) => {
                  const active = data.dueDate === dateInDays(p.days);
                  return (
                    <button
                      key={p.days}
                      type="button"
                      aria-pressed={active}
                      onClick={() => data.setDueDate(dateInDays(p.days))}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        active
                          ? "border-accent bg-accent-soft text-accent"
                          : "border-border text-fg-muted hover:bg-surface-2 hover:text-fg",
                      )}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {showInline && (
            <NewClientInline
              apiBase={data.API_BASE}
              token={data.token}
              canCancel={clients.length > 0}
              onCancel={() => setAddingClient(false)}
              onCreated={({ id, email }) => {
                setAddingClient(false);
                setPendingClient({ id, email });
                data.fetchClientsList();
                data.fetchMetrics();
              }}
            />
          )}

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
              <Button
                variant="secondary"
                onClick={() => downloadPdf(selected)}
                loading={downloading}
              >
                <Download className="h-4 w-4" aria-hidden />
                Download PDF
              </Button>
              {selected.status !== "paid" && selected.status !== "void" && (
                <Button
                  variant="secondary"
                  onClick={() => setEmailing(selected)}
                >
                  <Send className="h-4 w-4" aria-hidden />
                  Email invoice
                </Button>
              )}
              {payLink.url && (
                <Button variant="secondary" onClick={copyPaymentLink}>
                  <Copy className="h-4 w-4" aria-hidden />
                  Copy payment link
                </Button>
              )}
              {invoiceState(selected) === "overdue" && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    const id = selected.id;
                    setSelected(null);
                    onRemind?.([id]);
                  }}
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  Send reminder
                </Button>
              )}
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
              <div className="min-w-0">
                <p className="text-xs font-medium text-fg-muted">Billed to</p>
                <p className="mt-0.5 text-base font-semibold text-fg">
                  {selected.client_name}
                </p>
                {selEmail && (
                  <p className="truncate text-sm text-fg-muted">{selEmail}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <StatusBadge invoice={selected} />
                {isPaidOnline(selected) && (
                  <Badge tone="success">Paid online</Badge>
                )}
              </div>
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

            {payable && payLink.status === "ready" && !payLink.url && (
              <div className="flex items-start gap-2.5 rounded-lg bg-surface-2 p-3 text-sm text-fg-muted">
                <CreditCard
                  className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle"
                  aria-hidden
                />
                {payLink.reason === "payments_not_set_up" ? (
                  <span>
                    Online payments aren't set up yet. Connect Stripe in{" "}
                    <Link
                      to="/app/settings/payments"
                      className="font-medium text-accent hover:underline"
                    >
                      Settings → Payments
                    </Link>
                    .
                  </span>
                ) : payLink.reason === "invalid_link" ? (
                  <span>
                    The payment link has an unexpected format, so it can't be
                    copied. Please contact support.
                  </span>
                ) : (
                  <span>Online payment isn't available for this invoice.</span>
                )}
              </div>
            )}
            {payable && payLink.status === "error" && (
              <p className="text-xs text-fg-subtle">
                Couldn't check whether online payment is available. Close and
                reopen this invoice to try again.
              </p>
            )}

            {selected.status !== "paid" && selReminded.known && (
              <p className="text-xs text-fg-subtle">
                Last reminded:{" "}
                {selReminded.at ? timeAgo(selReminded.at) : "Never"}
              </p>
            )}

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
      {emailing && (
        <SendInvoiceModal
          invoice={emailing}
          email={invoiceClientEmail(emailing, data.clientsList)}
          apiBase={data.API_BASE}
          token={data.token}
          onClose={() => setEmailing(null)}
        />
      )}
    </>
  );
}
