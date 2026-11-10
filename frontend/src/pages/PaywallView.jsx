import { useState } from "react";
import { Check, Lock, RefreshCw } from "lucide-react";
import { Badge, Button, Card, useToast } from "../components/ui";
import { PLAN, perMonthYearly, savings } from "../lib/plan";
import { cn } from "../lib/cn";

export function PaywallView({ billing }) {
  const toast = useToast();
  const [checking, setChecking] = useState(false);
  const pastDue = billing.status === "past_due";
  const busy = billing.busy;

  const plans = [
    {
      id: "monthly",
      label: "Monthly",
      price: PLAN.monthly,
      per: "month",
      note: "Billed monthly",
    },
    {
      id: "yearly",
      label: "Yearly",
      price: PLAN.yearly,
      per: "year",
      note: `$${perMonthYearly}/month`,
      badge: `Save $${savings}`,
      featured: true,
    },
  ];

  const recheck = async () => {
    setChecking(true);
    const next = await billing.refresh();
    setChecking(false);
    if (next?.status === "active") {
      toast.success("You're all set. Welcome to LedgerFlow Pro!");
    } else {
      toast.info(
        "No active plan yet. If you just paid, give it a few seconds and try again.",
      );
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-4">
      <div className="text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
          <Lock className="h-5 w-5" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {pastDue
            ? "Your last payment didn't go through"
            : "Activate your plan"}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
          {pastDue
            ? "Update your payment method to get back to your invoices, clients, and the AI assistant."
            : "Your account is ready. Choose a plan to start creating invoices, tracking payments, and using the AI assistant."}
        </p>
      </div>

      {pastDue ? (
        <Card className="p-6 text-center">
          <Button
            onClick={billing.openPortal}
            loading={busy === "portal"}
            disabled={!!busy}
          >
            Update payment method
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((p) => (
            <Card
              key={p.id}
              className={cn(
                "flex flex-col p-6",
                p.featured && "border-2 border-accent",
              )}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{p.label}</h2>
                {p.badge && <Badge tone="success">{p.badge}</Badge>}
              </div>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="num text-4xl font-semibold tracking-tight">
                  ${p.price}
                </span>
                <span className="text-fg-muted">/{p.per}</span>
              </p>
              <p className="mt-1 text-sm text-fg-subtle">{p.note}</p>
              <Button
                className="mt-6 w-full"
                variant={p.featured ? "primary" : "secondary"}
                onClick={() => billing.startCheckout(p.id)}
                loading={busy === p.id}
                disabled={!!busy}
              >
                Subscribe {p.label.toLowerCase()}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={recheck}
          loading={checking}
          disabled={!!busy}
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />I already paid,
          refresh status
        </Button>
      </div>

      <ul className="mx-auto grid max-w-xl gap-2.5 text-sm sm:grid-cols-2">
        {PLAN.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 text-success"
              aria-hidden
            />
            <span className="text-fg-muted">{f}</span>
          </li>
        ))}
      </ul>

      <p className="text-center text-xs text-fg-subtle">
        Secure checkout by Stripe.
      </p>
    </div>
  );
}
