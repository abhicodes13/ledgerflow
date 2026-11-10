import {
  Check,
  CheckCircle2,
  ClipboardList,
  FileText,
  Pencil,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "../ui";
import { cn } from "../../lib/cn";
import { useAnimatedNumber } from "./Effects";
import { Frame, fade, money, useSequence, useTyping } from "./tourKit";

function Field({ label, children }) {
  return (
    <div>
      <p className="text-xs font-medium text-fg-muted">{label}</p>
      <p className="num mt-1 truncate rounded-lg border border-border-strong px-2.5 py-2 text-xs">
        {children}
      </p>
    </div>
  );
}

function Pop({ children }) {
  return (
    <div className="absolute bottom-5 right-5 flex animate-fadeIn items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs font-medium shadow-[var(--shadow-pop)]">
      <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
      {children}
    </div>
  );
}

const press = (on) => on && "scale-95 ring-4 ring-accent/20";

/* ───────── Estimates ───────── */

const E1_TIMES = [900, 1900, 2900, 4400];
const E1_ITEMS = [
  { d: "Brand identity package", q: 1, p: 2400 },
  { d: "Style guide", q: 1, p: 600 },
  { d: "Social templates", q: 3, p: 150 },
];

function EstimateBuildScene() {
  const step = useSequence(E1_TIMES);
  const shown = Math.min(step, E1_ITEMS.length);
  const target = E1_ITEMS.slice(0, shown).reduce((s, i) => s + i.q * i.p, 0);
  const total = useAnimatedNumber(target, 600);

  return (
    <Frame title="New estimate">
      <div className="flex h-full flex-col text-sm">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Client">Northwind Studio</Field>
          <Field label="Estimate number">EST-0015</Field>
          <Field label="Valid until">Dec 20, 2026</Field>
        </div>

        <p className="mb-2 mt-5 text-xs font-semibold">Line items</p>
        <ul className="space-y-2">
          {E1_ITEMS.map((it, i) => (
            <li
              key={it.d}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2",
                fade(shown > i),
              )}
            >
              <span className="truncate">{it.d}</span>
              <span className="num shrink-0 text-xs text-fg-muted">
                {it.q} × {money(it.p)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <div className="flex items-baseline gap-3 rounded-xl bg-surface-2 px-4 py-2.5">
            <span className="text-xs font-medium text-fg-muted">Total</span>
            <span className="num text-xl font-semibold">{money(total)}</span>
          </div>
          <span
            className={cn(
              "rounded-lg bg-accent px-4 py-2.5 text-xs font-medium text-accent-fg transition-all duration-300",
              press(step >= 4),
            )}
          >
            Create estimate
          </span>
        </div>

        {step >= 4 && <Pop>Estimate created</Pop>}
      </div>
    </Frame>
  );
}

const E2_TIMES = [1000, 3200, 4400];
const E2_ITEMS = [
  ["Brand identity package", "$2,400"],
  ["Style guide", "$600"],
  ["Social templates × 3", "$450"],
];

function EstimateApproveScene() {
  const step = useSequence(E2_TIMES);
  const name = "Priya Nair";
  const typed = useTyping(name, { speed: 70, enabled: step >= 1 });
  const accepted = step >= 3;

  return (
    <Frame title="What your client sees">
      <div className="mx-auto flex h-full max-w-md flex-col text-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-fg-muted">Estimate EST-0015</p>
            <p className="font-semibold">Prepared for Northwind Studio</p>
          </div>
          <p className="text-xs text-fg-muted">Valid until Dec 20</p>
        </div>

        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border text-xs">
          {E2_ITEMS.map(([d, p]) => (
            <li key={d} className="flex justify-between px-3 py-1.5">
              <span>{d}</span>
              <span className="num">{p}</span>
            </li>
          ))}
          <li className="flex justify-between bg-surface-2 px-3 py-1.5 font-semibold">
            <span>Total</span>
            <span className="num">$3,450</span>
          </li>
        </ul>

        <div className="mt-auto space-y-2 pt-3">
          {accepted ? (
            <div className="flex animate-fadeIn items-start gap-2.5 rounded-xl border border-success/30 bg-success-soft p-3.5">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-success"
                aria-hidden
              />
              <p>Accepted by {name}. Thank you!</p>
            </div>
          ) : (
            <>
              <div className="num rounded-lg border border-border-strong px-3 py-2 text-xs">
                {typed || (
                  <span className="text-fg-subtle">
                    Type your name to accept
                  </span>
                )}
                {step >= 1 && typed.length < name.length && (
                  <span className="ml-0.5 animate-pulse">|</span>
                )}
              </div>
              <div className="flex gap-2">
                <span
                  className={cn(
                    "flex-1 rounded-lg bg-accent py-2 text-center text-xs font-medium text-accent-fg transition-all",
                    step >= 2 && "ring-4 ring-accent/20",
                  )}
                >
                  Accept estimate
                </span>
                <span className="rounded-lg border border-border-strong px-3 py-2 text-xs font-medium text-fg-muted">
                  Decline
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </Frame>
  );
}

const E3_TIMES = [1200, 2400, 3400];

function EstimateConvertScene() {
  const step = useSequence(E3_TIMES);
  const converted = step >= 3;

  const rows = [
    { n: "EST-0013", c: "Acme Corp", a: "$950", tone: "warning", s: "Viewed" },
    {
      n: "EST-0014",
      c: "Bluebird Co.",
      a: "$1,800",
      tone: "accent",
      s: "Sent",
    },
  ];

  return (
    <Frame title="Estimates">
      <div className="flex h-full flex-col gap-3 text-sm">
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          <li className="flex items-center justify-between gap-3 bg-accent-soft/40 px-4 py-2.5">
            <div className="min-w-0">
              <p className="num font-medium">EST-0015</p>
              <p className="truncate text-xs text-fg-muted">Northwind Studio</p>
            </div>
            <div className="flex items-center gap-3">
              {!converted && (
                <span
                  className={cn(
                    "rounded-lg border border-border-strong bg-surface px-2.5 py-1.5 text-xs font-medium transition-all",
                    step >= 1 && "border-accent text-accent",
                    step >= 2 && "ring-4 ring-accent/20",
                  )}
                >
                  Convert to invoice
                </span>
              )}
              <Badge
                key={converted ? "c" : "a"}
                tone={converted ? "neutral" : "success"}
                className="animate-fadeIn"
              >
                {converted ? "Converted" : "Accepted"}
              </Badge>
              <span className="num w-16 text-right font-semibold">$3,450</span>
            </div>
          </li>
          {rows.map((r) => (
            <li
              key={r.n}
              className="flex items-center justify-between gap-3 px-4 py-2.5"
            >
              <div className="min-w-0">
                <p className="num font-medium">{r.n}</p>
                <p className="truncate text-xs text-fg-muted">{r.c}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={r.tone}>{r.s}</Badge>
                <span className="num w-16 text-right font-semibold">{r.a}</span>
              </div>
            </li>
          ))}
        </ul>

        <div
          className={cn(
            "mt-auto rounded-xl border border-success/30 bg-success-soft p-3.5",
            fade(converted),
          )}
        >
          <p className="flex items-center gap-2 text-xs font-semibold text-success">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Invoice created from the estimate
          </p>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="num text-sm font-medium">
              INV-0021 · Northwind Studio
            </span>
            <span className="num font-semibold">$3,450</span>
          </div>
        </div>
      </div>
    </Frame>
  );
}

export const ESTIMATE_SLIDES = [
  {
    id: "build",
    icon: ClipboardList,
    title: "Build an estimate",
    text: "Add line items and a valid-until date, just like an invoice. The total updates as you type.",
    Scene: EstimateBuildScene,
  },
  {
    id: "approve",
    icon: CheckCircle2,
    title: "Your client approves online",
    text: "They open a secure link, no account needed, type their name, and accept or decline.",
    Scene: EstimateApproveScene,
  },
  {
    id: "convert",
    icon: FileText,
    title: "Turn it into an invoice",
    text: "Once it's accepted, one click creates an invoice with the same line items.",
    Scene: EstimateConvertScene,
  },
];

/* ───────── Signatures ───────── */

const S1_TIMES = [900, 1800, 3600, 4600];
const S1_TEMPLATES = [
  { t: "Work authorization", d: "Approval to start the work" },
  { t: "Change order", d: "Approval for a scope change" },
  { t: "Simple agreement", d: "A short set of terms" },
];

function SignatureRequestScene() {
  const step = useSequence(S1_TIMES);
  const email = "priya@northwind.example";
  const typed = useTyping(email, { speed: 40, enabled: step >= 2 });

  return (
    <Frame title="New signature request">
      <div className="flex h-full flex-col text-sm">
        <p className="mb-2 text-xs font-semibold">Choose a template</p>
        <div className="grid grid-cols-3 gap-2">
          {S1_TEMPLATES.map((tpl, i) => {
            const selected = step >= 1 && i === 0;
            return (
              <div
                key={tpl.t}
                className={cn(
                  "rounded-xl border p-3 transition-colors duration-300",
                  selected ? "border-accent bg-accent-soft" : "border-border",
                )}
              >
                <p
                  className={cn(
                    "text-xs font-semibold",
                    selected && "text-accent",
                  )}
                >
                  {tpl.t}
                </p>
                <p className="mt-1 text-xs text-fg-muted">{tpl.d}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Field label="Client">Northwind Studio</Field>
          <Field label="Send to">
            {typed || <span className="text-fg-subtle">name@company.com</span>}
          </Field>
        </div>

        <div className="mt-auto flex justify-end pt-4">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-xs font-medium text-accent-fg transition-all duration-300",
              press(step >= 3),
            )}
          >
            <Send className="h-3.5 w-3.5" aria-hidden />
            Send for signature
          </span>
        </div>

        {step >= 4 && <Pop>Sent to {email}</Pop>}
      </div>
    </Frame>
  );
}

const S2_TIMES = [1000, 2800, 3800, 4800];

function SignatureSignScene() {
  const step = useSequence(S2_TIMES);
  const name = "Priya Nair";
  const typed = useTyping(name, { speed: 80, enabled: step >= 1 });
  const signed = step >= 4;

  return (
    <Frame title="What your client sees">
      <div className="mx-auto flex h-full max-w-md flex-col text-sm">
        <p className="text-xs text-fg-muted">Signature requested</p>
        <p className="font-semibold">Work authorization</p>
        <p className="mt-2 text-xs text-fg-muted">
          I authorize the work below to begin, and I agree to the stated price
          and schedule.
        </p>
        <div className="mt-3 rounded-lg bg-surface-2 p-3 text-xs">
          <p>Brand identity package, delivered within three weeks.</p>
          <p className="num mt-1 font-semibold">$3,450.00</p>
        </div>

        <div className="mt-auto space-y-2 pt-3">
          {signed ? (
            <div className="flex animate-fadeIn items-start gap-2.5 rounded-xl border border-success/30 bg-success-soft p-3.5">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-success"
                aria-hidden
              />
              <p>Signed by {name}. Your signature has been recorded.</p>
            </div>
          ) : (
            <>
              <div className="num rounded-lg border border-border-strong px-3 py-2 text-xs">
                {typed || (
                  <span className="text-fg-subtle">
                    Type your full name to sign
                  </span>
                )}
                {step >= 1 && typed.length < name.length && (
                  <span className="ml-0.5 animate-pulse">|</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-fg-muted">
                <span
                  className={cn(
                    "grid h-4 w-4 place-items-center rounded border transition-colors",
                    step >= 2
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-border-strong",
                  )}
                >
                  {step >= 2 && <Check className="h-3 w-3" aria-hidden />}
                </span>
                I agree and consent to sign electronically
              </div>
              <span
                className={cn(
                  "block rounded-lg bg-accent py-2 text-center text-xs font-medium text-accent-fg transition-all",
                  step >= 3 && "ring-4 ring-accent/20",
                )}
              >
                Sign
              </span>
            </>
          )}
        </div>
      </div>
    </Frame>
  );
}

const S3_TIMES = [600, 1500, 2400, 3300];
const S3_EVENTS = [
  { l: "Sent to priya@northwind.example", t: "Dec 1, 9:14 AM" },
  { l: "Opened by client", t: "Dec 1, 9:31 AM" },
  { l: "Signed by Priya Nair", t: "Dec 1, 9:33 AM" },
];

function SignatureRecordScene() {
  const step = useSequence(S3_TIMES);
  const done = step >= 3;

  return (
    <Frame title="Signature record">
      <div className="flex h-full flex-col text-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">Work authorization</p>
            <p className="text-xs text-fg-muted">
              Northwind Studio · $3,450.00
            </p>
          </div>
          <Badge
            key={done ? "signed" : "waiting"}
            tone={done ? "success" : "accent"}
            className="animate-fadeIn"
          >
            {done ? "Signed" : "Awaiting"}
          </Badge>
        </div>

        <ol className="space-y-3">
          {S3_EVENTS.map((e, i) => (
            <li key={e.l} className={cn("flex gap-3", fade(step > i))}>
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
              <div>
                <p className="text-sm">{e.l}</p>
                <p className="text-xs text-fg-subtle">{e.t}</p>
              </div>
            </li>
          ))}
        </ol>

        <div
          className={cn(
            "mt-auto flex items-center gap-3 rounded-xl bg-surface-2 px-4 py-3",
            fade(step >= 4),
          )}
        >
          <ShieldCheck className="h-4 w-4 shrink-0 text-success" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-medium">Document fingerprint</p>
            <p className="num truncate text-xs text-fg-muted">
              9f2c…e41a · the exact version they signed
            </p>
          </div>
        </div>
      </div>
    </Frame>
  );
}

export const SIGNATURE_SLIDES = [
  {
    id: "request",
    icon: Send,
    title: "Pick a template and send",
    text: "Choose a template, add the details, and email your client a signing link.",
    Scene: SignatureRequestScene,
  },
  {
    id: "sign",
    icon: Pencil,
    title: "They sign from any device",
    text: "Your client types their name and agrees. No account and no printing.",
    Scene: SignatureSignScene,
  },
  {
    id: "record",
    icon: ShieldCheck,
    title: "Keep a clear record",
    text: "Every step is logged with the name, the time, and the exact version they signed.",
    Scene: SignatureRecordScene,
  },
];
