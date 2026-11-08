import { cn } from "../../lib/cn";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface shadow-[var(--shadow-card)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-border px-5 py-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-fg">{title}</h3>
        {description && (
          <p className="mt-0.5 text-sm text-fg-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
