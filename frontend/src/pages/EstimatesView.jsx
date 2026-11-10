import { useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Eye,
  FileText,
  Plus,
  Send,
  Trash2,
  XCircle,
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
  useToast,
} from "../components/ui";
import {
  ClientFrame,
  Notice,
  PreviewBanner,
  Section,
  Stat,
  StatusPill,
  Timeline,
} from "../components/preview/parts";
import { Slideshow } from "../components/landing/tourKit";
import { ESTIMATE_SLIDES } from "../components/landing/docScenes";
import {
  SAMPLE_CLIENTS,
  SAMPLE_ESTIMATES,
  isoDay,
  itemsTotalCents,
  nextNumber,
  nowISO,
} from "../lib/sampleDocs";
import { formatCurrency, formatDate } from "../lib/format";
import { cn } from "../lib/cn";

const isAwaiting = (e) => e.status === "sent" || e.status === "viewed";
const isClosed = (e) => e.status === "declined" || e.status === "expired";
const sumCents = (list) =>
  list.reduce((s, e) => s + itemsTotalCents(e.items), 0);

const FILTERS = [
  { id: "all", label: "All", test: () => true },
  { id: "draft", label: "Draft", test: (e) => e.status === "draft" },
  { id: "awaiting", label: "Awaiting", test: isAwaiting },
  { id: "accepted", label: "Accepted", test: (e) => e.status === "accepted" },
  { id: "closed", label: "Closed", test: isClosed },
];

const DEFAULT_VALID_UNTIL = isoDay(14);
const blankItem = () => ({ description: "", quantity: 1, price: "" });
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

function ItemsTable({ items }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <ul className="divide-y divide-border">
        {items.map((it, i) => {
          const unit = Math.round((parseFloat(it.price) || 0) * 100);
          const qty = Number(it.quantity) || 0;
          return (
            <li
              key={i}
              className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate text-fg">{it.description}</p>
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
      <div className="flex items-center justify-between bg-surface-2 px-4 py-3">
        <span className="text-sm font-medium text-fg-muted">Total</span>
        <span className="num text-base font-semibold text-fg">
          {formatCurrency(itemsTotalCents(items))}
        </span>
      </div>
    </div>
  );
}

/* What the client sees when they open the link */
function EstimateClientView({ estimate, business, onRespond }) {
  const [name, setName] = useState("");
  const open = isAwaiting(estimate);

  return (
    <ClientFrame url="ledgerflow.app/e/8fK2xQ…">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-medium text-fg-muted">
            Estimate {estimate.number} from {business}
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight">
            Prepared for {estimate.client}
          </h3>
          <p className="text-sm text-fg-muted">
            Valid until {formatDate(estimate.validUntil)}
          </p>
        </div>

        <ItemsTable items={estimate.items} />

        {open && (
          <div className="space-y-3">
            <Input
              label="Type your full name to accept"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
            />
            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={!name.trim()}
                onClick={() => onRespond(true, name.trim())}
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                Accept estimate
              </Button>
              <Button variant="secondary" onClick={() => onRespond(false)}>
                Decline
              </Button>
            </div>
          </div>
        )}
        {estimate.status === "accepted" && (
          <Notice tone="success" icon={CheckCircle2}>
            Accepted. Thank you! {business} has been notified.
          </Notice>
        )}
        {estimate.status === "declined" && (
          <Notice tone="danger" icon={XCircle}>
            You declined this estimate.
          </Notice>
        )}
        {estimate.status === "expired" && (
          <Notice tone="neutral" icon={XCircle}>
            This estimate has expired.
          </Notice>
        )}
        {estimate.status === "draft" && (
          <Notice tone="neutral" icon={Eye}>
            Preview only. Send the estimate to let your client respond.
          </Notice>
        )}
      </div>
    </ClientFrame>
  );
}

function NewEstimateModal({ onCreate, onClose }) {
  const [clientId, setClientId] = useState("");
  const [validUntil, setValidUntil] = useState(DEFAULT_VALID_UNTIL);
  const [items, setItems] = useState([blankItem()]);

  const update = (i, field, value) =>
    setItems((list) =>
      list.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)),
    );

  const valid =
    clientId &&
    validUntil &&
    items.every(
      (i) =>
        i.description.trim() &&
        Number(i.quantity) > 0 &&
        parseFloat(i.price) >= 0,
    );

  const submit = (e) => {
    e.preventDefault();
    const client = SAMPLE_CLIENTS.find((c) => String(c.id) === clientId);
    onCreate({
      client,
      validUntil,
      items: items.map((i) => ({
        description: i.description.trim(),
        quantity: Number(i.quantity),
        price: parseFloat(i.price),
      })),
    });
  };

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title="New estimate"
      description="Add the details and line items."
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="estimate-form" disabled={!valid}>
            Create estimate
          </Button>
        </>
      }
    >
      <form id="estimate-form" onSubmit={submit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
          >
            <option value="">Select a client</option>
            {SAMPLE_CLIENTS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input
            label="Valid until"
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            required
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-fg">Line items</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setItems((l) => [...l, blankItem()])}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add item
            </Button>
          </div>

          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 items-center gap-2">
              <Input
                aria-label={`Item ${idx + 1} description`}
                wrapperClassName="col-span-12 sm:col-span-6"
                value={item.description}
                onChange={(e) => update(idx, "description", e.target.value)}
                placeholder="Description"
              />
              <div className="col-span-4 sm:col-span-2">
                <Input
                  aria-label={`Item ${idx + 1} quantity`}
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => update(idx, "quantity", e.target.value)}
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
                  onChange={(e) => update(idx, "price", e.target.value)}
                  placeholder="0.00"
                  className="num"
                />
              </div>
              <div className="col-span-3 flex justify-end sm:col-span-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setItems((l) => l.filter((_, i) => i !== idx))}
                  disabled={items.length <= 1}
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
            {formatCurrency(itemsTotalCents(items))}
          </span>
        </div>
      </form>
    </Modal>
  );
}

export function EstimatesView({ currentUser }) {
  const toast = useToast();
  const business = currentUser?.username || "Your business";

  const [estimates, setEstimates] = useState(SAMPLE_ESTIMATES);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [viewing, setViewing] = useState(false);

  const selected = estimates.find((e) => e.id === selectedId) ?? null;

  const patch = (id, changes, eventLabel) =>
    setEstimates((list) =>
      list.map((e) =>
        e.id === id
          ? {
              ...e,
              ...changes,
              events: eventLabel
                ? [...e.events, { label: eventLabel, at: nowISO() }]
                : e.events,
            }
          : e,
      ),
    );

  const createEstimate = ({ client, validUntil, items }) => {
    const id = Math.max(0, ...estimates.map((e) => e.id)) + 1;
    setEstimates((list) => [
      {
        id,
        number: nextNumber(list, "EST"),
        client: client.name,
        email: client.email,
        status: "draft",
        validUntil,
        converted: false,
        items,
        events: [{ label: "Created", at: nowISO() }],
      },
      ...list,
    ]);
    setCreateOpen(false);
    toast.success("Estimate created (preview)");
  };

  const sendEstimate = (e) => {
    patch(e.id, { status: "sent" }, `Sent to ${e.email}`);
    toast.info(`Preview: no email was sent to ${e.email}`);
  };

  const convert = (e) => {
    patch(e.id, { converted: true }, "Converted to an invoice");
    toast.info(
      "Preview: the live version creates an invoice with the same line items.",
    );
  };

  const openView = (e) => {
    if (e.status === "sent")
      patch(e.id, { status: "viewed" }, "Viewed by client");
    setViewing(true);
  };

  const respond = (e, accepted, name) =>
    patch(
      e.id,
      { status: accepted ? "accepted" : "declined" },
      accepted ? `Accepted by ${name}` : "Declined by client",
    );

  const active = FILTERS.find((f) => f.id === filter);
  const q = query.trim().toLowerCase();
  const visible = estimates.filter(
    (e) =>
      active.test(e) &&
      (!q ||
        e.number.toLowerCase().includes(q) ||
        e.client.toLowerCase().includes(q)),
  );
  const counts = Object.fromEntries(
    FILTERS.map((f) => [f.id, estimates.filter(f.test).length]),
  );

  const awaiting = estimates.filter(isAwaiting);
  const accepted = estimates.filter((e) => e.status === "accepted");
  const decided = accepted.length + estimates.filter(isClosed).length;
  const rate = decided ? Math.round((accepted.length / decided) * 100) : null;

  return (
    <>
      <PageHeader
        title="Estimates"
        description="Quote the work, get approval, then invoice it."
        actions={<Badge tone="accent">Preview</Badge>}
      />

      <PreviewBanner>
        This is a preview with sample data. Nothing is sent or saved, and the
        live version is coming soon.
      </PreviewBanner>

      <Section title="How it will work" description="A quick look at the flow.">
        <Slideshow label="Estimates tour" slides={ESTIMATE_SLIDES} />
      </Section>

      <Section
        title="Try it with sample data"
        description="Create, send, and approve an estimate. Everything resets when you leave the page."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat
            label="Awaiting approval"
            value={formatCurrency(sumCents(awaiting))}
            hint={plural(awaiting.length, "estimate")}
          />
          <Stat
            label="Accepted"
            value={formatCurrency(sumCents(accepted))}
            hint={plural(accepted.length, "estimate")}
          />
          <Stat
            label="Approval rate"
            value={rate === null ? "—" : `${rate}%`}
            hint="Accepted vs. declined or expired"
          />
        </div>

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
              aria-label="Search estimates"
              placeholder="Search estimate or client..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full lg:w-64"
            />
            <Button onClick={() => setCreateOpen(true)} className="shrink-0">
              <Plus className="h-4 w-4" aria-hidden />
              New estimate
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          {visible.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No estimates match"
              description="Try a different search or status."
            />
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(e.id)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="num text-sm font-medium text-fg">
                        {e.number}
                      </p>
                      <p className="truncate text-sm text-fg-muted">
                        {e.client}
                      </p>
                    </div>
                    <p className="hidden w-40 text-sm text-fg-muted sm:block">
                      {(isAwaiting(e) || e.status === "draft") &&
                        `Valid until ${formatDate(e.validUntil)}`}
                    </p>
                    <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                      <div className="flex gap-1.5 sm:w-44 sm:justify-end">
                        <StatusPill status={e.status} />
                        {e.converted && <Badge>Converted</Badge>}
                      </div>
                      <span className="num w-24 text-right text-sm font-semibold text-fg">
                        {formatCurrency(itemsTotalCents(e.items))}
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
      </Section>

      {createOpen && (
        <NewEstimateModal
          onCreate={createEstimate}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {/* Estimate detail */}
      <Modal
        open={!!selected && !viewing}
        onOpenChange={(o) => !o && setSelectedId(null)}
        title={selected ? `Estimate ${selected.number}` : ""}
        size="lg"
        footer={
          selected && (
            <>
              <Button variant="secondary" onClick={() => openView(selected)}>
                <Eye className="h-4 w-4" aria-hidden />
                Preview client view
              </Button>
              {selected.status === "draft" && (
                <Button onClick={() => sendEstimate(selected)}>
                  <Send className="h-4 w-4" aria-hidden />
                  Send to client
                </Button>
              )}
              {selected.status === "accepted" &&
                (selected.converted ? (
                  <span className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-success-soft px-4 text-sm font-medium text-success">
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    Converted to invoice
                  </span>
                ) : (
                  <Button onClick={() => convert(selected)}>
                    <FileText className="h-4 w-4" aria-hidden />
                    Convert to invoice
                  </Button>
                ))}
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-fg-muted">
                  Prepared for
                </p>
                <p className="mt-0.5 text-base font-semibold text-fg">
                  {selected.client}
                </p>
                <p className="truncate text-sm text-fg-muted">
                  {selected.email}
                </p>
              </div>
              <StatusPill status={selected.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-xl bg-surface-2 p-4">
              <div>
                <p className="text-xs font-medium text-fg-muted">Valid until</p>
                <p className="mt-0.5 text-sm font-medium text-fg">
                  {formatDate(selected.validUntil)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-fg-muted">Total</p>
                <p className="num mt-0.5 text-sm font-semibold text-fg">
                  {formatCurrency(itemsTotalCents(selected.items))}
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-fg">Items</h3>
              <ItemsTable items={selected.items} />
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-fg">Activity</h3>
              <Timeline events={selected.events} />
            </div>
          </div>
        )}
      </Modal>

      {/* What the client sees */}
      <Modal
        open={!!selected && viewing}
        onOpenChange={(o) => !o && setViewing(false)}
        title="Client view"
        description="This is what your client sees when they open the link."
        size="lg"
      >
        {selected && (
          <EstimateClientView
            estimate={selected}
            business={business}
            onRespond={(accepted, name) => respond(selected, accepted, name)}
          />
        )}
      </Modal>
    </>
  );
}
