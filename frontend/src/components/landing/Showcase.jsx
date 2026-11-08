import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "../ui";
import { cn } from "../../lib/cn";
import { prefersReducedMotion, useAnimatedNumber } from "./Effects";

const SLIDE_MS = 8000;
const money = (n) =>
  `$${Math.round(n).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

/* ───────── helpers ───────── */

// Returns how many steps have happened. Reduced motion jumps to the end.
function useSequence(times) {
  const [step, setStep] = useState(() =>
    prefersReducedMotion() ? times.length : 0,
  );
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ids = times.map((t, i) => setTimeout(() => setStep(i + 1), t));
    return () => ids.forEach(clearTimeout);
  }, [times]);
  return step;
}

function useTyping(text, speed = 32) {
  const [n, setN] = useState(() => (prefersReducedMotion() ? text.length : 0));
  useEffect(() => {
    if (n >= text.length) return;
    const id = setTimeout(() => setN(n + 1), speed);
    return () => clearTimeout(id);
  }, [n, text, speed]);
  return text.slice(0, n);
}

const fade = (visible) =>
  cn(
    "transition-all duration-500",
    visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
  );

function Frame({ title, children }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
        <span className="ml-2 text-xs font-medium text-fg-muted">{title}</span>
      </div>
      <div className="min-h-0 flex-1 p-4 sm:p-5">{children}</div>
    </div>
  );
}

/* ───────── Slide 1: AI assistant ───────── */

const AI_TIMES = [2000, 3200, 5200];
const AI_MESSAGE = "Add a client named Acme Corp, billing@acme.co";

function AiScene() {
  const step = useSequence(AI_TIMES);
  const typed = useTyping(AI_MESSAGE);

  return (
    <Frame title="AI assistant">
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-3 overflow-hidden text-sm">
          {step >= 1 && (
            <div className="flex animate-fadeIn justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-3.5 py-2.5 text-accent-fg">
                {AI_MESSAGE}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex w-fit items-center gap-1 rounded-2xl rounded-tl-sm bg-surface-2 px-4 py-3">
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-fg-subtle"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </div>
          )}

          {step >= 2 && step < 3 && (
            <div className="animate-fadeIn space-y-3 rounded-xl border border-accent/40 bg-accent-soft/50 p-4">
              <div className="flex items-center gap-2 font-semibold text-accent">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Please confirm
              </div>
              <p className="text-fg">I'll add this client to your workspace.</p>
              <dl className="space-y-1.5 rounded-lg bg-surface p-3">
                <div className="flex justify-between gap-4">
                  <dt className="text-xs font-medium text-fg-muted">Name</dt>
                  <dd className="font-medium">Acme Corp</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-xs font-medium text-fg-muted">Email</dt>
                  <dd className="num font-medium">billing@acme.co</dd>
                </div>
              </dl>
              <div className="flex gap-2">
                <span className="flex-1 rounded-lg bg-accent py-2 text-center text-xs font-medium text-accent-fg ring-4 ring-accent/20">
                  Confirm
                </span>
                <span className="rounded-lg border border-border-strong px-3 py-2 text-xs font-medium text-fg-muted">
                  Cancel
                </span>
              </div>
            </div>
          )}

          {step >= 3 && (
            <div className="flex animate-fadeIn items-start gap-2.5 rounded-xl border border-success/30 bg-success-soft p-3.5">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-success"
                aria-hidden
              />
              <p>Client Acme Corp was added. You can invoice them now.</p>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg border border-border-strong px-3 py-2.5 text-sm">
          <span
            className={cn("flex-1 truncate", step >= 1 && "text-fg-subtle")}
          >
            {step === 0
              ? typed || "Ask me to do something..."
              : "Ask me to do something..."}
            {step === 0 && <span className="ml-0.5 animate-pulse">|</span>}
          </span>
          <Sparkles className="h-4 w-4 text-accent" aria-hidden />
        </div>
      </div>
    </Frame>
  );
}

/* ───────── Slide 2: create an invoice ───────── */

const INV_TIMES = [900, 1900, 2900, 4400];
const INV_ITEMS = [
  { d: "Website design", q: 1, p: 2400 },
  { d: "Logo refresh", q: 2, p: 225 },
  { d: "Hosting setup", q: 1, p: 400 },
];

function InvoiceScene() {
  const step = useSequence(INV_TIMES);
  const shown = Math.min(step, INV_ITEMS.length);
  const target = INV_ITEMS.slice(0, shown).reduce((s, i) => s + i.q * i.p, 0);
  const total = useAnimatedNumber(target, 600);

  return (
    <Frame title="New invoice">
      <div className="flex h-full flex-col text-sm">
        <div className="grid grid-cols-3 gap-3">
          {[
            ["Client", "Acme Corp"],
            ["Invoice number", "INV-016"],
            ["Due date", "Dec 5, 2026"],
          ].map(([l, v]) => (
            <div key={l}>
              <p className="text-xs font-medium text-fg-muted">{l}</p>
              <p className="num mt-1 truncate rounded-lg border border-border-strong px-2.5 py-2 text-xs">
                {v}
              </p>
            </div>
          ))}
        </div>

        <p className="mb-2 mt-5 text-xs font-semibold">Line items</p>
        <ul className="space-y-2">
          {INV_ITEMS.map((it, i) => (
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
              step >= 4 && "scale-95 ring-4 ring-accent/20",
            )}
          >
            Create invoice
          </span>
        </div>

        {step >= 4 && (
          <div className="absolute bottom-5 right-5 flex animate-fadeIn items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs font-medium shadow-[var(--shadow-pop)]">
            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
            Invoice created
          </div>
        )}
      </div>
    </Frame>
  );
}

/* ───────── Slide 3: who needs a nudge ───────── */

const TRACK_TIMES = [500, 1200, 1900, 3000];
const TRACK_ROWS = [
  {
    n: "INV-014",
    c: "Northwind Studio",
    a: 2400,
    tone: "danger",
    s: "Overdue by 5 days",
  },
  {
    n: "INV-017",
    c: "Bluebird Co.",
    a: 850,
    tone: "danger",
    s: "Overdue by 2 days",
  },
  {
    n: "INV-018",
    c: "Acme Corp",
    a: 1200,
    tone: "warning",
    s: "Due in 6 days",
  },
];

function TrackScene() {
  const step = useSequence(TRACK_TIMES);
  const overdue = useAnimatedNumber(step >= 4 ? 3250 : 0, 900);

  return (
    <Frame title="Overview">
      <div className="flex h-full flex-col text-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-semibold">Needs attention</p>
          <Badge tone="danger" className={fade(step >= 2)}>
            2 overdue
          </Badge>
        </div>

        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {TRACK_ROWS.map((r, i) => (
            <li
              key={r.n}
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-3",
                fade(step > i),
              )}
            >
              <div className="min-w-0">
                <p className="num font-medium">{r.n}</p>
                <p className="truncate text-xs text-fg-muted">
                  {r.c} · {r.s}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={r.tone}>
                  {r.tone === "danger" ? "Overdue" : "Pending"}
                </Badge>
                <span className="num w-20 text-right font-semibold">
                  {money(r.a)}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div
          className={cn(
            "mt-auto flex items-center gap-3 rounded-xl bg-danger-soft px-4 py-3 text-danger",
            fade(step >= 4),
          )}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          <span className="text-xs font-medium">Overdue total</span>
          <span className="num ml-auto text-lg font-semibold">
            {money(overdue)}
          </span>
        </div>
      </div>
    </Frame>
  );
}

/* ───────── The slideshow ───────── */

const SLIDES = [
  {
    id: "ai",
    icon: Sparkles,
    title: "Tell the assistant what you need",
    text: "Ask in plain English. It prepares the action and waits for your confirmation before anything changes.",
    Scene: AiScene,
  },
  {
    id: "invoice",
    icon: FileText,
    title: "Build invoices in seconds",
    text: "Add line items and watch the total update as you type. The next invoice number is suggested for you.",
    Scene: InvoiceScene,
  },
  {
    id: "track",
    icon: AlertTriangle,
    title: "See who needs a nudge",
    text: "Unpaid invoices are sorted by urgency, with overdue ones flagged and totaled.",
    Scene: TrackScene,
  },
];

export function Showcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const { Scene } = SLIDES[active];
  const next = () => setActive((a) => (a + 1) % SLIDES.length);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[22rem_1fr] lg:items-center"
    >
      <div
        role="tablist"
        aria-label="Product tour"
        aria-orientation="vertical"
        className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible"
      >
        {SLIDES.map((s, i) => {
          const selected = i === active;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(i)}
              className={cn(
                "relative min-w-[14rem] shrink-0 overflow-hidden rounded-xl border p-4 text-left transition-colors lg:min-w-0",
                selected
                  ? "border-border bg-surface shadow-[var(--shadow-card)]"
                  : "border-transparent hover:bg-surface/60",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                    selected
                      ? "bg-accent-soft text-accent"
                      : "bg-surface-2 text-fg-subtle",
                  )}
                >
                  <s.icon className="h-4 w-4" aria-hidden />
                </span>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    !selected && "text-fg-muted",
                  )}
                >
                  {s.title}
                </span>
              </div>
              {selected && (
                <p className="mt-2 hidden pl-12 text-sm text-fg-muted lg:block">
                  {s.text}
                </p>
              )}
              {selected && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-border">
                  <span
                    key={active}
                    onAnimationEnd={next}
                    className="progress-fill block h-full bg-accent"
                    style={{
                      animationDuration: `${SLIDE_MS}ms`,
                      animationPlayState: paused ? "paused" : "running",
                    }}
                  />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <div
          aria-hidden
          className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-r from-accent/25 via-[oklch(0.7_0.2_320)]/15 to-[oklch(0.75_0.15_220)]/25 blur-2xl"
        />
        <div
          role="tabpanel"
          className="relative h-[25rem] overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-pop)]"
        >
          <div key={active} className="h-full animate-fadeIn">
            <Scene />
          </div>
        </div>
      </div>
    </div>
  );
}
