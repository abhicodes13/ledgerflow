import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  PageHeader,
  Skeleton,
  useToast,
} from "../components/ui";
import { OnboardingTour } from "../components/payments/OnboardingTour";
import { useConnect } from "../hooks/useConnect";

// Everything except "active" and "not started" means: finish setting up
const BADGES = {
  not_connected: <Badge>Not connected</Badge>,
  incomplete: <Badge tone="warning">Finish setting up</Badge>,
  restricted: <Badge tone="warning">Finish setting up</Badge>,
  active: <Badge tone="success">Payments enabled</Badge>,
};

export function PaymentsView({ apiBase, token }) {
  const toast = useToast();
  const connect = useConnect({ apiBase, token, toast });
  const { status, busy, refresh, start } = connect;

  const [params, setParams] = useSearchParams();
  const flag = params.get("connect");
  // Stripe sends people back here with ?connect=return or ?connect=refresh (expired link)
  const [expired] = useState(() => flag === "refresh");
  const [checking, setChecking] = useState(false);
  const handled = useRef(false);

  useEffect(() => {
    if (!flag || handled.current) return;
    handled.current = true;
    setParams({}, { replace: true }); // clean the address bar
    if (flag !== "return") return;

    (async () => {
      // Stripe can take a moment to finish verifying
      for (let i = 0; i < 4; i++) {
        const next = await refresh();
        if (next === "active") {
          toast.success("Payments are enabled. Clients can now pay online.");
          return;
        }
        if (i < 3) await new Promise((r) => setTimeout(r, 2000));
      }
      toast.info(
        "Stripe is still verifying your details. Check back in a few minutes.",
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flag]);

  const checkNow = async () => {
    setChecking(true);
    await refresh();
    setChecking(false);
  };

  const finishSetup = status === "incomplete" || status === "restricted";

  return (
    <>
      <PageHeader
        title="Payments"
        description="Let clients pay your invoices online."
        actions={
          <Link
            to="/app/settings"
            className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Settings
          </Link>
        }
      />

      {expired && status !== "active" && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm text-warning"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            Your setup link expired. Choose Continue setup to get a fresh one.
          </p>
        </div>
      )}

      <Card>
        <CardHeader
          title="Online payments"
          description="Powered by Stripe."
          action={BADGES[status]}
        />
        <div className="space-y-5 p-5">
          {status === "loading" && <Skeleton className="h-16 w-full" />}

          {(status === "error" || status === "unknown") && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-fg-muted">
                We couldn't read your payment status right now.
              </p>
              <Button variant="secondary" onClick={checkNow} loading={checking}>
                <RefreshCw className="h-4 w-4" aria-hidden />
                Try again
              </Button>
            </div>
          )}

          {status === "not_connected" && (
            <>
              <p className="max-w-xl text-sm text-fg-muted">
                Connect a Stripe account so clients can pay invoices by card.
                Here's what to expect before you go to Stripe.
              </p>
              <OnboardingTour />
              <Button onClick={start} loading={busy}>
                <CreditCard className="h-4 w-4" aria-hidden />
                Connect Stripe
              </Button>
            </>
          )}

          {finishSetup && (
            <>
              <p className="max-w-xl text-sm text-fg-muted">
                {status === "restricted"
                  ? "Stripe needs a bit more information before you can accept payments. Your details so far are saved."
                  : "Setup isn't finished. Stripe needs a few more details before you can accept payments. Your progress is saved."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={start} loading={busy}>
                  Finish setting up payments
                </Button>
                <Button
                  variant="secondary"
                  onClick={checkNow}
                  loading={checking}
                  disabled={busy}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  Check status
                </Button>
              </div>
            </>
          )}

          {status === "active" && (
            <>
              <div className="flex items-start gap-2.5 rounded-xl border border-success/30 bg-success-soft p-4 text-sm text-fg">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-success"
                  aria-hidden
                />
                <p>
                  Payments are enabled. Open an unpaid invoice and choose Copy
                  payment link to send to your client.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/app/invoices"
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
                >
                  Go to invoices
                </Link>
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
                >
                  Manage in Stripe
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
                <Button variant="ghost" onClick={checkNow} loading={checking}>
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  Refresh status
                </Button>
              </div>
              <p className="text-xs text-fg-subtle">
                Use Stripe for refunds, disputes, and payout settings.
              </p>
            </>
          )}

          <p className="flex items-center gap-2 border-t border-border pt-4 text-xs text-fg-subtle">
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
            Payments are processed securely by Stripe, and Stripe's processing
            fees apply.
          </p>
        </div>
      </Card>
    </>
  );
}
