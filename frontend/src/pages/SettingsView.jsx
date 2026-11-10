import { Monitor, Moon, Sun } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  PageHeader,
  Skeleton,
} from "../components/ui";
import { formatDate } from "../lib/format";
import { PLAN } from "../lib/plan";
import { cn } from "../lib/cn";

const THEMES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "system", label: "System", icon: Monitor },
  { id: "dark", label: "Dark", icon: Moon },
];

const STATUS = {
  active: { tone: "success", label: "Active" },
  past_due: { tone: "warning", label: "Payment failed" },
  inactive: { tone: "neutral", label: "No active plan" },
};

const TIER = { MONTHLY: "Monthly plan", YEARLY: "Yearly plan" };

function BillingCard({ billing }) {
  const s = STATUS[billing.status];
  const busy = billing.busy;

  return (
    <Card>
      <CardHeader
        title="Plan and billing"
        description={`LedgerFlow ${PLAN.name}`}
        action={s && <Badge tone={s.tone}>{s.label}</Badge>}
      />
      <div className="space-y-4 p-5">
        {billing.status === "loading" ? (
          <Skeleton className="h-10 w-48" />
        ) : billing.status === "unknown" ? (
          <p className="text-sm text-fg-muted">
            Billing information isn't available right now.
          </p>
        ) : billing.status === "active" ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-fg">
                {TIER[billing.tier] ?? `${PLAN.name} plan`}
              </p>
              {billing.periodEnd && (
                <p className="text-sm text-fg-muted">
                  Current period ends {formatDate(billing.periodEnd)}
                </p>
              )}
            </div>
            <Button
              variant="secondary"
              onClick={billing.openPortal}
              loading={busy === "portal"}
              disabled={!!busy}
            >
              Manage billing
            </Button>
          </div>
        ) : billing.status === "past_due" ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-fg-muted">
              Your last payment didn't go through. Update your payment method to
              restore access.
            </p>
            <Button
              onClick={billing.openPortal}
              loading={busy === "portal"}
              disabled={!!busy}
            >
              Update payment method
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-fg-muted">
              Subscribe to create invoices, download PDFs, and use the AI
              assistant.
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => billing.startCheckout("monthly")}
                loading={busy === "monthly"}
                disabled={!!busy}
              >
                Monthly ${PLAN.monthly}
              </Button>
              <Button
                onClick={() => billing.startCheckout("yearly")}
                loading={busy === "yearly"}
                disabled={!!busy}
              >
                Yearly ${PLAN.yearly}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export function SettingsView({ theme, setTheme, currentUser, billing }) {
  const name = currentUser?.username || "Account";
  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your account and preferences."
      />

      <Card>
        <CardHeader title="Account" />
        <div className="flex items-center gap-4 p-5">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
            {name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-fg">{name}</p>
            <p className="text-sm text-fg-muted">LedgerFlow workspace</p>
          </div>
        </div>
      </Card>

      <BillingCard billing={billing} />

      <Card>
        <CardHeader
          title="Appearance"
          description="Choose how LedgerFlow looks to you."
        />
        <div className="grid gap-3 p-5 sm:grid-cols-3">
          {THEMES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              aria-pressed={theme === id}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                theme === id
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border text-fg-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Accept client payments"
          description="Let clients pay your invoices by card."
          action={<Badge>Coming soon</Badge>}
        />
        <div className="flex items-center justify-between gap-4 p-5">
          <p className="text-sm text-fg-muted">
            Route client payments straight to your account.
          </p>
          <Button variant="secondary" disabled>
            Connect Stripe
          </Button>
        </div>
      </Card>
    </>
  );
}
