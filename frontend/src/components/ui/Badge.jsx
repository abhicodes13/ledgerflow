import { cn } from "../../lib/cn";
import { invoiceState } from "../../lib/format";

const tones = {
  neutral: "bg-surface-2 text-fg-muted",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function Badge({ tone = "neutral", className, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

const statusMap = {
  paid: { tone: "success", label: "Paid" },
  pending: { tone: "warning", label: "Pending" },
  overdue: { tone: "danger", label: "Overdue" },
};

export function StatusBadge({ invoice }) {
  const { tone, label } = statusMap[invoiceState(invoice)];
  return <Badge tone={tone}>{label}</Badge>;
}
