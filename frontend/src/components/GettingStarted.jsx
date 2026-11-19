import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Button, Card } from "./ui";
import { readConnectStatus } from "../hooks/useConnect";
import { cn } from "../lib/cn";

// null = still checking, true = payments enabled, false = not (or couldn't tell)
function useConnectActive({ apiBase, token, enabled }) {
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (!enabled || !token) return;
    const controller = new AbortController();
    fetch(`${apiBase}/api/connect/status`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) =>
        setActive(body ? readConnectStatus(body) === "active" : false),
      )
      .catch((err) => {
        if (err.name !== "AbortError") setActive(false);
      });
    return () => controller.abort();
  }, [apiBase, token, enabled]);

  return active;
}

export function GettingStarted({
  apiBase,
  token,
  username,
  loading,
  clients = [],
  invoices = [],
  onGo,
}) {
  const storageKey = `lf_checklist_hidden:${username || "me"}`;
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  });
  const connected = useConnectActive({
    apiBase,
    token,
    enabled: !hidden && !loading,
  });

  const steps = [
    {
      id: "client",
      title: "Add your first client",
      text: "A name and a billing email is all it takes.",
      done: clients.length > 0,
      action: "Add client",
      to: "/app/clients?new=1",
    },
    {
      id: "invoice",
      title: "Create your first invoice",
      text: "Add line items and a due date. The total is worked out for you.",
      done: invoices.length > 0,
      action: "Create invoice",
      to: "/app/invoices?new=1",
    },
    {
      id: "payments",
      title: "Connect online payments",
      text: "Let clients pay by card from a link. Takes about 5 minutes.",
      done: connected === true,
      action: "Set up payments",
      to: "/app/settings/payments",
    },
    {
      id: "paid",
      title: "Collect your first payment",
      text: "Share a payment link, or mark an invoice as paid.",
      done: invoices.some((i) => i.status === "paid"),
      action: "Open invoices",
      to: "/app/invoices",
    },
  ];

  const done = steps.filter((s) => s.done).length;
  const nextId = steps.find((s) => !s.done)?.id;

  // Wait until we know about payments, so established accounts never see a flash of this card
  if (hidden || loading || connected === null || done === steps.length)
    return null;

  const hide = () => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* private mode: it will simply show again next time */
    }
    setHidden(true);
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-fg">
            Get set up in {steps.length} steps
          </h2>
          <p className="mt-0.5 text-sm text-fg-muted">
            {done} of {steps.length} done
          </p>
          <div
            role="progressbar"
            aria-label="Setup progress"
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-valuenow={done}
            className="mt-3 h-1.5 max-w-xs overflow-hidden rounded-full bg-surface-2"
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${(done / steps.length) * 100}%` }}
            />
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Hide getting started"
          onClick={hide}
        >
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <ol className="divide-y divide-border">
        {steps.map((s, i) => {
          const isNext = s.id === nextId;
          return (
            <li
              key={s.id}
              className={cn(
                "flex items-center gap-4 px-5 py-3.5",
                isNext && "bg-accent-soft/40",
              )}
            >
              <span
                className={cn(
                  "num grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                  s.done
                    ? "border-success/30 bg-success-soft text-success"
                    : "border-border-strong text-fg-subtle",
                )}
              >
                {s.done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    s.done ? "text-fg-muted" : "text-fg",
                  )}
                >
                  {s.title}
                </p>
                <p className="text-sm text-fg-muted">{s.text}</p>
              </div>
              {s.done ? (
                <span className="shrink-0 text-xs font-medium text-success">
                  Done
                </span>
              ) : (
                <Button
                  size="sm"
                  variant={isNext ? "primary" : "secondary"}
                  className="shrink-0"
                  onClick={() => onGo(s.to)}
                >
                  {s.action}
                </Button>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
