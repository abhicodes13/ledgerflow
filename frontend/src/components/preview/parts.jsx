import { useId } from "react";
import { Info, Lock } from "lucide-react";
import { Badge, Card } from "../ui";
import { timeAgo } from "../../lib/format";
import { cn } from "../../lib/cn";

export function PreviewBanner({ children }) {
  return (
    <div
      role="note"
      className="flex items-start gap-2.5 rounded-xl border border-accent/30 bg-accent-soft/60 p-4 text-sm text-fg"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
      <p>{children}</p>
    </div>
  );
}

export function Section({ title, description, children }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-fg-muted">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-fg-muted">{label}</p>
      <p className="num mt-2 text-2xl font-semibold tracking-tight text-fg">
        {value}
      </p>
      <p className="mt-1 text-xs text-fg-subtle">{hint}</p>
    </Card>
  );
}

const STATUS = {
  draft: { tone: "neutral", label: "Draft" },
  sent: { tone: "accent", label: "Sent" },
  viewed: { tone: "warning", label: "Viewed" },
  accepted: { tone: "success", label: "Accepted" },
  signed: { tone: "success", label: "Signed" },
  declined: { tone: "danger", label: "Declined" },
  expired: { tone: "neutral", label: "Expired" },
};

export function StatusPill({ status }) {
  const s = STATUS[status] ?? { tone: "neutral", label: status };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function Notice({ tone = "neutral", icon: Icon, children }) {
  const styles = {
    success: "border-success/30 bg-success-soft text-success",
    danger: "border-danger/30 bg-danger-soft text-danger",
    neutral: "border-border bg-surface-2 text-fg-muted",
  };
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-lg border p-3 text-sm",
        styles[tone],
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

export function Timeline({ events }) {
  return (
    <ol className="space-y-3">
      {events.map((e, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
          <div className="min-w-0">
            <p className="text-sm text-fg">{e.label}</p>
            <p className="text-xs text-fg-subtle">{timeAgo(e.at) ?? ""}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

// A fake browser window, to show what the client will see
export function ClientFrame({ url, children }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
        </span>
        <span className="num ml-2 flex min-w-0 flex-1 items-center gap-1.5 truncate rounded-md bg-surface px-2.5 py-1 text-xs text-fg-muted">
          <Lock className="h-3 w-3 shrink-0" aria-hidden />
          {url}
        </span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Textarea({ label, hint, className, ...props }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-fg-muted">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          "w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
          className,
        )}
        {...props}
      />
      {hint && <p className="text-xs text-fg-subtle">{hint}</p>}
    </div>
  );
}
