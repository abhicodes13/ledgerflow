import { Lock } from "lucide-react";
import { Button, Modal } from "./ui";

// Stripe-style statuses; anything else gets the default message
const MESSAGES = {
  past_due:
    "Your last payment didn't go through. Update your billing to keep creating and downloading invoices.",
  canceled:
    "Your subscription has ended. Subscribe again to keep creating and downloading invoices.",
};
const DEFAULT_MESSAGE =
  "This feature is part of the paid plan. Subscribe to create invoices, download PDFs, and use the AI assistant.";

export function UpgradeModal({ open, status, onClose, onViewPlans }) {
  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Subscription required"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Not now
          </Button>
          <Button onClick={onViewPlans}>View plans</Button>
        </>
      }
    >
      <div className="flex gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
          <Lock className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-sm text-fg-muted">
          {MESSAGES[status] ?? DEFAULT_MESSAGE}
        </p>
      </div>
    </Modal>
  );
}
