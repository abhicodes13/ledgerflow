import {
  Banknote,
  CheckCircle2,
  CreditCard,
  IdCard,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { Slideshow, Frame, fade, useSequence } from "../landing/tourKit";

function Row({ icon: Icon, title, text, visible }) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border px-3.5 py-3",
        fade(visible),
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-fg">{title}</p>
        <p className="text-xs text-fg-muted">{text}</p>
      </div>
    </li>
  );
}

/* Slide 1: what to have ready */
const READY_TIMES = [500, 1100, 1700, 2300];

function ReadyScene() {
  const step = useSequence(READY_TIMES);
  return (
    <Frame title="Before you start">
      <div className="flex h-full flex-col gap-3 text-sm">
        <p className="flex items-center gap-2 font-semibold">
          <Timer className="h-4 w-4 text-accent" aria-hidden />
          About 5 minutes. Have these ready:
        </p>
        <ul className="space-y-2">
          <Row
            icon={Banknote}
            title="Bank details"
            text="Where your payouts will go"
            visible={step >= 1}
          />
          <Row
            icon={IdCard}
            title="A government ID"
            text="Stripe verifies who you are"
            visible={step >= 2}
          />
          <Row
            icon={CreditCard}
            title="Business details"
            text="Name, address, and a phone number"
            visible={step >= 3}
          />
        </ul>
        <p className={cn("mt-auto text-xs text-fg-subtle", fade(step >= 4))}>
          Your progress is saved, so you can stop and come back.
        </p>
      </div>
    </Frame>
  );
}

/* Slide 2: the steps */
const FLOW_TIMES = [700, 1500, 2300];
const FLOW = [
  {
    t: "Go to Stripe",
    d: "A secure page opens. You never leave your account's control.",
  },
  {
    t: "Verify your details",
    d: "Answer a few questions and add your bank account.",
  },
  {
    t: "Come back here",
    d: "You return to LedgerFlow, ready to share payment links.",
  },
];

function FlowScene() {
  const step = useSequence(FLOW_TIMES);
  return (
    <Frame title="How it works">
      <ol className="space-y-3 text-sm">
        {FLOW.map((s, i) => (
          <li key={s.t} className={cn("flex gap-3", fade(step > i))}>
            <span
              className={cn(
                "num grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors duration-500",
                step > i
                  ? "bg-accent text-accent-fg"
                  : "bg-surface-2 text-fg-muted",
              )}
            >
              {i + 1}
            </span>
            <div>
              <p className="font-medium text-fg">{s.t}</p>
              <p className="text-xs text-fg-muted">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
    </Frame>
  );
}

/* Slide 3: what you get */
const RESULT_TIMES = [700, 1500, 2600];

function ResultScene() {
  const step = useSequence(RESULT_TIMES);
  return (
    <Frame title="After setup">
      <div className="flex h-full flex-col gap-3 text-sm">
        <div
          className={cn(
            "rounded-xl border border-border p-3.5",
            fade(step >= 1),
          )}
        >
          <p className="text-xs text-fg-muted">Invoice INV-0012</p>
          <div className="mt-1 flex items-center justify-between">
            <span className="num text-lg font-semibold">$1,200.00</span>
            <span className="rounded-lg border border-border-strong px-2.5 py-1.5 text-xs font-medium">
              Copy payment link
            </span>
          </div>
        </div>
        <p className={cn("text-xs text-fg-muted", fade(step >= 2))}>
          Your client pays by card on a secure page.
        </p>
        <div
          className={cn(
            "mt-auto flex items-center gap-2.5 rounded-xl border border-success/30 bg-success-soft p-3.5",
            fade(step >= 3),
          )}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden />
          <p className="font-medium">
            INV-0012 paid online. It updates by itself.
          </p>
        </div>
      </div>
    </Frame>
  );
}

const SLIDES = [
  {
    id: "ready",
    icon: Timer,
    title: "What you'll need",
    text: "Setup takes about 5 minutes. Have these ready.",
    Scene: ReadyScene,
  },
  {
    id: "flow",
    icon: ShieldCheck,
    title: "How it works",
    text: "Stripe verifies you, then sends you back here.",
    Scene: FlowScene,
  },
  {
    id: "result",
    icon: CheckCircle2,
    title: "What you get",
    text: "Share a payment link and invoices mark themselves paid.",
    Scene: ResultScene,
  },
];

export function OnboardingTour() {
  return <Slideshow label="Payments setup tour" slides={SLIDES} />;
}
