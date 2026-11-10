import { useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Eye,
  FileSignature,
  Plus,
  Send,
  ShieldCheck,
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
  Textarea,
  Timeline,
} from "../components/preview/parts";
import { Slideshow } from "../components/landing/tourKit";
import { SIGNATURE_SLIDES } from "../components/landing/docScenes";
import {
  SAMPLE_CLIENTS,
  SAMPLE_SIGNATURES,
  SIGNATURE_TEMPLATES,
  nowISO,
} from "../lib/sampleDocs";
import { formatCurrency } from "../lib/format";
import { cn } from "../lib/cn";

const isAwaiting = (r) => r.status === "sent" || r.status === "viewed";
const isClosed = (r) => r.status === "declined" || r.status === "expired";

const FILTERS = [
  { id: "all", label: "All", test: () => true },
  { id: "draft", label: "Draft", test: (r) => r.status === "draft" },
  { id: "awaiting", label: "Awaiting", test: isAwaiting },
  { id: "signed", label: "Signed", test: (r) => r.status === "signed" },
  { id: "closed", label: "Closed", test: isClosed },
];

const templateOf = (id) => SIGNATURE_TEMPLATES.find((t) => t.id === id);
const dollars = (n) => formatCurrency(Math.round(n * 100));
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

/* What the client sees when they open the signing link */
function SignatureClientView({ request, business, onSign, onDecline }) {
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const template = templateOf(request.templateId);
  const open = isAwaiting(request);

  return (
    <ClientFrame url="ledgerflow.app/s/3dW9pL…">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-medium text-fg-muted">
            Signature requested by {business}
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight">
            {request.title}
          </h3>
        </div>

        {template && (
          <p className="text-sm text-fg-muted">{template.statement}</p>
        )}

        <div className="rounded-xl bg-surface-2 p-4 text-sm">
          <p className="whitespace-pre-wrap text-fg">{request.scope}</p>
          {request.amount != null && (
            <p className="num mt-2 font-semibold text-fg">
              {dollars(request.amount)}
            </p>
          )}
        </div>

        {open && (
          <div className="space-y-3">
            <Input
              label="Type your full name to sign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-fg-muted">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="h-4 w-4 rounded border-border-strong accent-accent"
              />
              I agree and consent to sign electronically
            </label>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={!name.trim() || !agreed}
                onClick={() => onSign(name.trim())}
              >
                Sign
              </Button>
              <Button variant="secondary" onClick={onDecline}>
                Decline
              </Button>
            </div>
          </div>
        )}
        {request.status === "signed" && (
          <Notice tone="success" icon={CheckCircle2}>
            Signed by {request.signedName}. Your signature has been recorded.
          </Notice>
        )}
        {request.status === "declined" && (
          <Notice tone="danger" icon={XCircle}>
            You declined this request.
          </Notice>
        )}
        {request.status === "expired" && (
          <Notice tone="neutral" icon={XCircle}>
            This request has expired.
          </Notice>
        )}
        {request.status === "draft" && (
          <Notice tone="neutral" icon={Eye}>
            Preview only. Send the request to let your client sign.
          </Notice>
        )}
      </div>
    </ClientFrame>
  );
}

function NewRequestModal({ onCreate, onClose }) {
  const [templateId, setTemplateId] = useState(SIGNATURE_TEMPLATES[0].id);
  const [title, setTitle] = useState(SIGNATURE_TEMPLATES[0].title);
  const [clientId, setClientId] = useState("");
  const [scope, setScope] = useState("");
  const [amount, setAmount] = useState("");

  const pick = (t) => {
    setTemplateId(t.id);
    setTitle(t.title);
  };
  const valid = clientId && title.trim() && scope.trim();

  const submit = (e) => {
    e.preventDefault();
    const client = SAMPLE_CLIENTS.find((c) => String(c.id) === clientId);
    const n = parseFloat(amount);
    onCreate({
      templateId,
      title: title.trim(),
      client,
      scope: scope.trim(),
      amount: Number.isNaN(n) ? null : n,
    });
  };

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title="New signature request"
      description="Choose a template and add the details."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="signature-form" disabled={!valid}>
            Create request
          </Button>
        </>
      }
    >
      <form id="signature-form" onSubmit={submit} className="space-y-5">
        <div
          role="group"
          aria-label="Template"
          className="grid gap-2 sm:grid-cols-3"
        >
          {SIGNATURE_TEMPLATES.map((t) => {
            const selected = templateId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={selected}
                onClick={() => pick(t)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors",
                  selected
                    ? "border-accent bg-accent-soft"
                    : "border-border hover:bg-surface-2",
                )}
              >
                <p
                  className={cn(
                    "text-sm font-medium",
                    selected ? "text-accent" : "text-fg",
                  )}
                >
                  {t.title}
                </p>
                <p className="mt-1 text-xs text-fg-muted">{t.description}</p>
              </button>
            );
          })}
        </div>

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
            label="Document title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <Textarea
          label="What are they approving?"
          rows={4}
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          placeholder="Describe the work, the schedule, and anything else they should know."
        />

        <Input
          label="Amount in USD (optional)"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="num"
        />
      </form>
    </Modal>
  );
}

export function SignaturesView({ currentUser }) {
  const toast = useToast();
  const business = currentUser?.username || "Your business";

  const [requests, setRequests] = useState(SAMPLE_SIGNATURES);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [viewing, setViewing] = useState(false);

  const selected = requests.find((r) => r.id === selectedId) ?? null;

  const patch = (id, changes, eventLabel) =>
    setRequests((list) =>
      list.map((r) =>
        r.id === id
          ? {
              ...r,
              ...changes,
              events: eventLabel
                ? [...r.events, { label: eventLabel, at: nowISO() }]
                : r.events,
            }
          : r,
      ),
    );

  const createRequest = ({ templateId, title, client, scope, amount }) => {
    const id = Math.max(0, ...requests.map((r) => r.id)) + 1;
    setRequests((list) => [
      {
        id,
        templateId,
        title,
        client: client.name,
        email: client.email,
        scope,
        amount,
        status: "draft",
        signedName: null,
        events: [{ label: "Created", at: nowISO() }],
      },
      ...list,
    ]);
    setCreateOpen(false);
    toast.success("Request created (preview)");
  };

  const sendRequest = (r) => {
    patch(r.id, { status: "sent" }, `Sent to ${r.email}`);
    toast.info(`Preview: no email was sent to ${r.email}`);
  };

  const openView = (r) => {
    if (r.status === "sent")
      patch(r.id, { status: "viewed" }, "Opened by client");
    setViewing(true);
  };

  const active = FILTERS.find((f) => f.id === filter);
  const q = query.trim().toLowerCase();
  const visible = requests.filter(
    (r) =>
      active.test(r) &&
      (!q ||
        r.title.toLowerCase().includes(q) ||
        r.client.toLowerCase().includes(q)),
  );
  const counts = Object.fromEntries(
    FILTERS.map((f) => [f.id, requests.filter(f.test).length]),
  );

  const selTemplate = selected ? templateOf(selected.templateId) : null;

  return (
    <>
      <PageHeader
        title="Signatures"
        description="Get written approval before you start."
        actions={<Badge tone="accent">Preview</Badge>}
      />

      <PreviewBanner>
        This is a preview with sample data. Nothing is sent or saved, and the
        live version is coming soon.
      </PreviewBanner>

      <Section title="How it will work" description="A quick look at the flow.">
        <Slideshow label="Signatures tour" slides={SIGNATURE_SLIDES} />
      </Section>

      <Section
        title="Try it with sample data"
        description="Create a request, then preview what your client sees and sign it. Everything resets when you leave the page."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat
            label="Awaiting signature"
            value={counts.awaiting}
            hint={plural(counts.awaiting, "request")}
          />
          <Stat
            label="Signed"
            value={counts.signed}
            hint={plural(counts.signed, "document")}
          />
          <Stat
            label="Declined or expired"
            value={counts.closed}
            hint={plural(counts.closed, "request")}
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
              aria-label="Search signature requests"
              placeholder="Search document or client..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full lg:w-64"
            />
            <Button onClick={() => setCreateOpen(true)} className="shrink-0">
              <Plus className="h-4 w-4" aria-hidden />
              New request
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          {visible.length === 0 ? (
            <EmptyState
              icon={FileSignature}
              title="No requests match"
              description="Try a different search or status."
            />
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">
                        {r.title}
                      </p>
                      <p className="truncate text-sm text-fg-muted">
                        {r.client} · {templateOf(r.templateId)?.title}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                      <div className="flex sm:w-24 sm:justify-end">
                        <StatusPill status={r.status} />
                      </div>
                      <span className="num w-24 text-right text-sm font-semibold text-fg">
                        {r.amount != null ? dollars(r.amount) : "—"}
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
        <NewRequestModal
          onCreate={createRequest}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {/* Request detail */}
      <Modal
        open={!!selected && !viewing}
        onOpenChange={(o) => !o && setSelectedId(null)}
        title={selected?.title ?? ""}
        size="lg"
        footer={
          selected && (
            <>
              <Button variant="secondary" onClick={() => openView(selected)}>
                <Eye className="h-4 w-4" aria-hidden />
                Preview client view
              </Button>
              {selected.status === "draft" && (
                <Button onClick={() => sendRequest(selected)}>
                  <Send className="h-4 w-4" aria-hidden />
                  Send for signature
                </Button>
              )}
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-fg-muted">Sent to</p>
                <p className="mt-0.5 text-base font-semibold text-fg">
                  {selected.client}
                </p>
                <p className="truncate text-sm text-fg-muted">
                  {selected.email}
                </p>
              </div>
              <StatusPill status={selected.status} />
            </div>

            <div className="rounded-xl bg-surface-2 p-4 text-sm">
              <p className="text-xs font-medium text-fg-muted">
                {selTemplate?.title}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-fg">
                {selected.scope}
              </p>
              {selected.amount != null && (
                <p className="num mt-2 font-semibold text-fg">
                  {dollars(selected.amount)}
                </p>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-fg">
                Audit trail
              </h3>
              <Timeline events={selected.events} />
            </div>

            {selected.status === "signed" && (
              <div className="flex items-center gap-3 rounded-xl border border-border px-4 py-3">
                <ShieldCheck
                  className="h-4 w-4 shrink-0 text-success"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-fg">
                    Document fingerprint (sample)
                  </p>
                  <p className="num text-xs text-fg-muted">
                    9f2c…e41a · signed by {selected.signedName}
                  </p>
                </div>
              </div>
            )}
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
          <SignatureClientView
            request={selected}
            business={business}
            onSign={(name) =>
              patch(
                selected.id,
                { status: "signed", signedName: name },
                `Signed by ${name}`,
              )
            }
            onDecline={() =>
              patch(selected.id, { status: "declined" }, "Declined by client")
            }
          />
        )}
      </Modal>
    </>
  );
}
