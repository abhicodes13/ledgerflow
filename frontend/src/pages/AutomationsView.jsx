import { useState } from "react";
import { Check } from "lucide-react";
import { Badge, Card, CardHeader, PageHeader } from "../components/ui";
import { cn } from "../lib/cn";

const TONES = [
  {
    id: "friendly",
    title: "Friendly reminder",
    description: "Warm and polite. Good for long-standing clients.",
  },
  {
    id: "firm",
    title: "Firm and professional",
    description: "Clear and direct, without being harsh.",
  },
  {
    id: "strict",
    title: "Strict collections",
    description: "Formal wording for seriously overdue invoices.",
  },
];

export function AutomationsView() {
  const [tone, setTone] = useState("firm");

  return (
    <>
      <PageHeader
        title="Automations"
        description="Control how the AI assistant communicates with your clients."
      />
      <Card>
        <CardHeader
          title="Reminder tone"
          description="How payment reminders are worded."
          action={<Badge tone="accent">Preview</Badge>}
        />
        <div className="grid gap-3 p-5 sm:grid-cols-3">
          {TONES.map((t) => {
            const selected = tone === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTone(t.id)}
                aria-pressed={selected}
                className={cn(
                  "relative rounded-xl border p-4 text-left transition-colors",
                  selected
                    ? "border-accent bg-accent-soft"
                    : "border-border hover:bg-surface-2",
                )}
              >
                {selected && (
                  <Check
                    className="absolute right-3 top-3 h-4 w-4 text-accent"
                    aria-hidden
                  />
                )}
                <p className="pr-6 text-sm font-medium text-fg">{t.title}</p>
                <p className="mt-1 text-sm text-fg-muted">{t.description}</p>
              </button>
            );
          })}
        </div>
        <p className="border-t border-border px-5 py-3 text-xs text-fg-subtle">
          This selection isn't saved yet. It will be wired to the backend later.
        </p>
      </Card>
    </>
  );
}
