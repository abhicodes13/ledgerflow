import { useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, CircleHelp, XCircle } from "lucide-react";
import { Logo } from "../components/layout/Logo";
import { ThemeToggle } from "../components/layout/ThemeToggle";
import { Card } from "../components/ui";
import { cn } from "../lib/cn";

const TONES = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  neutral: "bg-surface-2 text-fg-muted",
};

const RESULTS = {
  success: {
    tone: "success",
    icon: CheckCircle2,
    title: "Thank you, payment received",
    text: "Your payment went through. You can close this page.",
  },
  cancelled: {
    tone: "neutral",
    icon: XCircle,
    title: "Payment cancelled",
    text: "You haven't been charged. Use the payment link you were sent to try again.",
  },
  paid: {
    tone: "success",
    icon: CheckCircle2,
    title: "Already paid",
    text: "This invoice has already been paid. There's nothing more to do.",
  },
  void: {
    tone: "neutral",
    icon: XCircle,
    title: "Invoice cancelled",
    text: "This invoice was cancelled, so there's nothing to pay. Please contact the sender if you have questions.",
  },
  unavailable: {
    tone: "warning",
    icon: AlertTriangle,
    title: "Payment link unavailable",
    text: "This payment link isn't available. Please contact the sender.",
  },
  invalid: {
    tone: "warning",
    icon: AlertTriangle,
    title: "Payment link not valid",
    text: "This payment link isn't valid. Check that you used the whole link, or contact the sender.",
  },
};

const FALLBACK = {
  tone: "neutral",
  icon: CircleHelp,
  title: "Nothing to show",
  text: "This page needs a valid payment link. Please use the link you were sent.",
};

export function PayResultPage({ theme, setTheme }) {
  const [params] = useSearchParams();
  const status = params.get("status") ?? "";
  // hasOwn, so a value like "constructor" can't match something inherited
  const r = Object.hasOwn(RESULTS, status) ? RESULTS[status] : FALLBACK;
  const Icon = r.icon;

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </header>
      <main className="grid flex-1 place-items-center px-4 pb-16">
        <Card className="w-full max-w-md animate-fadeIn p-8 text-center">
          <span
            className={cn(
              "mx-auto grid h-14 w-14 place-items-center rounded-full",
              TONES[r.tone],
            )}
          >
            <Icon className="h-7 w-7" aria-hidden />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">
            {r.title}
          </h1>
          <p className="mt-2 text-sm text-fg-muted">{r.text}</p>
        </Card>
      </main>
    </div>
  );
}
