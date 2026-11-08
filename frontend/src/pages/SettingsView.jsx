import { Monitor, Moon, Sun } from "lucide-react";
import { Badge, Button, Card, CardHeader, PageHeader } from "../components/ui";
import { cn } from "../lib/cn";

const THEMES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "system", label: "System", icon: Monitor },
  { id: "dark", label: "Dark", icon: Moon },
];

export function SettingsView({ theme, setTheme, currentUser }) {
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
          title="Payments"
          description="Accept card payments on your invoices."
          action={<Badge>Coming soon</Badge>}
        />
        <div className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-medium text-fg">Stripe</p>
            <p className="text-sm text-fg-muted">
              Route client payments straight to your account.
            </p>
          </div>
          <Button variant="secondary" disabled>
            Connect Stripe
          </Button>
        </div>
      </Card>
    </>
  );
}
