import { Link } from "react-router-dom";
import { ClipboardList, FileSignature, Mail } from "lucide-react";
import { Badge, Card, CardHeader, PageHeader } from "../components/ui";

// Where "Tell us what you need" emails go (opens the user's mail app).
// Leave empty to hide the button.
const FEEDBACK_EMAIL = "";

function ComingSoon({ icon: Icon, title, description, pitch, steps, subject }) {
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={<Badge tone="accent">Coming soon</Badge>}
      />

      <Card>
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent">
            <Icon className="h-7 w-7" aria-hidden />
          </span>
          <h2 className="mt-5 text-xl font-semibold tracking-tight">{pitch}</h2>
          <p className="mt-2 max-w-md text-sm text-fg-muted">
            We're building this next. Here's how it will work.
          </p>
        </div>

        <ol className="grid gap-px border-t border-border bg-border sm:grid-cols-2">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-3 bg-surface p-5">
              <span className="num grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-fg-muted">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-fg">{s.title}</p>
                <p className="mt-0.5 text-sm text-fg-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
          <p className="text-sm text-fg-muted">
            Need this sooner? Tell us what you'd use it for.
          </p>
          <div className="flex gap-2">
            {FEEDBACK_EMAIL && (
              <a
                href={`mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
              >
                <Mail className="h-4 w-4" aria-hidden />
                Tell us what you need
              </a>
            )}
            <Link
              to="/app/invoices"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
            >
              Go to invoices
            </Link>
          </div>
        </div>
      </Card>
    </>
  );
}

export function EstimatesSoon() {
  return (
    <ComingSoon
      icon={ClipboardList}
      title="Estimates"
      description="Quote the work before it starts."
      pitch="Send an estimate. Get an approval. Turn it into an invoice."
      subject="LedgerFlow: estimates"
      steps={[
        {
          title: "Build the estimate",
          text: "Add line items and a valid-until date, just like an invoice.",
        },
        {
          title: "Email it to your client",
          text: "They get a secure link to review it, no account needed.",
        },
        {
          title: "They accept or decline",
          text: "You see who approved it and when.",
        },
        {
          title: "Convert to an invoice",
          text: "One click turns an accepted estimate into an invoice.",
        },
      ]}
    />
  );
}

export function SignaturesSoon() {
  return (
    <ComingSoon
      icon={FileSignature}
      title="Signatures"
      description="Get written approval before you start."
      pitch="Send work authorizations and agreements for approval by email."
      subject="LedgerFlow: signatures"
      steps={[
        {
          title: "Prepare the document",
          text: "Write a work authorization, change order, or short agreement.",
        },
        {
          title: "Email a signing link",
          text: "Your client opens it on any device, no account needed.",
        },
        { title: "They sign online", text: "They type their name to approve." },
        {
          title: "Keep a record",
          text: "Saved with the name, the time, and the exact version they saw.",
        },
      ]}
    />
  );
}
