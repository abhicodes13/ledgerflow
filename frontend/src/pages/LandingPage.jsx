import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  Clock,
  CreditCard,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  Mail,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { Logo } from "../components/layout/Logo";
import { ThemeToggle } from "../components/layout/ThemeToggle";
import { SiteFooter } from "../components/layout/SiteFooter";
import { Badge } from "../components/ui";
import { Aurora, Reveal } from "../components/landing/Effects";
import { Showcase } from "../components/landing/Showcase";
import { Slideshow } from "../components/landing/tourKit";
import { ESTIMATE_SLIDES } from "../components/landing/docScenes";
import { Screens } from "../components/landing/Screens";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PLAN, perMonthYearly, savings, savingsPct } from "../lib/plan";
import { cn } from "../lib/cn";

const PAIN_POINTS = [
  {
    icon: Clock,
    title: "Chasing late payments",
    text: "You send the invoice, then lose track of who's late. Following up feels awkward, so it gets postponed.",
  },
  {
    icon: FileSpreadsheet,
    title: "Invoices scattered everywhere",
    text: "Spreadsheets, documents, and email threads. Numbering drifts and finding one old invoice takes too long.",
  },
  {
    icon: Wallet,
    title: "No clear picture of your cash",
    text: "How much is owed? How much came in? Answering that means adding things up by hand.",
  },
  {
    icon: Bell,
    title: "Admin that eats your week",
    text: "Retyping client details and line items for every invoice is time you could spend on actual work.",
  },
];

const STATUS = {
  live: { tone: "success", label: "Live" },
  rolling: { tone: "accent", label: "Rolling out" },
};

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "See what needs attention",
    text: "Unpaid invoices are listed by urgency. Copy a payment link, send a reminder, or mark paid in one click.",
    status: "live",
  },
  {
    icon: FileText,
    title: "Invoices in under a minute",
    text: "Line items, live totals, automatic numbering, and due dates like Net 30. Email it to your client with the PDF attached, or download it.",
    status: "live",
  },
  {
    icon: Sparkles,
    title: "An assistant that does the typing",
    text: "Say “invoice Spears for 2 hours at $150”. It prepares the invoice, and nothing happens until you confirm.",
    status: "live",
  },
  {
    icon: Mail,
    title: "Reminders you review first",
    text: "See exactly who will be emailed, then confirm. Clients reminded recently are skipped automatically.",
    status: "live",
  },
  {
    icon: CreditCard,
    title: "Get paid by card",
    text: "Share a payment link. Your client pays through Stripe, and the invoice marks itself paid.",
    status: "rolling",
  },
  {
    icon: BarChart3,
    title: "Know where you stand",
    text: "Cash flow by month, what's owed by how late it is, and your top clients, all on your dashboard.",
    status: "live",
  },
  {
    icon: Users,
    title: "Every client in one place",
    text: "See what each client has been billed and still owes, with search and CSV export.",
    status: "live",
  },
  {
    icon: Smartphone,
    title: "Works on every screen",
    text: "Light and dark themes, a phone layout, and install it like an app. Jump anywhere with Cmd+K.",
    status: "live",
  },
];

const STEPS = [
  {
    title: "Add your client",
    text: "Name and billing email. That's all it takes.",
  },
  {
    title: "Create an invoice",
    text: "Add line items and a due date, or just ask the assistant.",
  },
  {
    title: "Track and collect",
    text: "Watch paid, pending, and overdue update. Send reminders, share a payment link, or mark invoices paid.",
  },
];

const linkClass = "font-medium text-accent hover:underline";

const FAQ = [
  {
    q: "Who is LedgerFlow for?",
    a: "Freelancers, consultants, and small service businesses who send invoices and want a simple way to track who has paid.",
  },
  {
    q: "What can the AI assistant do?",
    a: "It can add clients, create invoices (including a repeat of a client's last one), email invoices, mark them as paid, send overdue reminders, void invoices, fix due dates and client details, and summarize your numbers. Each time, it shows you a summary first.",
  },
  {
    q: "Will the AI change my data without asking?",
    a: "No. The assistant prepares an action and waits. Nothing runs until you press Confirm, and you can cancel anything that looks wrong.",
  },
  {
    q: "What if the assistant misunderstands me?",
    a: "That's why the confirmation step exists. You see exactly what it's about to do, such as the client name or invoice items, before it happens.",
  },
  {
    q: "How do reminders work?",
    a: "Choose your overdue invoices, review who will be emailed, and confirm. Clients who were reminded recently, or who have no email on file, are skipped, so nobody gets spammed.",
  },
  {
    q: "How do online payments work?",
    a: "Connect a Stripe account in Settings (it takes about 5 minutes), then copy a payment link from any unpaid invoice. Your client pays by card on a Stripe page, and the invoice marks itself paid. Online payments are rolling out now, and Stripe's processing fees apply.",
  },
  {
    q: "Can I email an invoice to my client?",
    a: "Yes. Send any unpaid invoice from LedgerFlow and your client gets it by email with the PDF attached. Replies come straight to you. You can also ask the assistant to do it, and you confirm first.",
  },
  {
    q: "Is my data private and secure?",
    a: (
      <>
        Each account can only see its own clients and invoices. Passwords are
        stored securely, and card details are handled by Stripe, so they never
        touch our servers. See our{" "}
        <Link to="/privacy" className={linkClass}>
          Privacy Policy
        </Link>{" "}
        for the details.
      </>
    ),
  },
  {
    q: "Can I export my data?",
    a: "Yes. Export your invoices and your clients to CSV from their pages whenever you like.",
  },
  {
    q: "Does it work on my phone?",
    a: "Yes. LedgerFlow adapts to phones, tablets, and laptops, and you can install it on your home screen like an app.",
  },
  {
    q: "What are Estimates and Signatures?",
    a: "A preview of what's next: send an estimate, let your client approve it online, and turn it into an invoice. You can try both inside the app with sample data. They aren't live yet.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. There's no long-term contract. Manage or cancel your plan from Settings, under Plan and billing.",
  },
];

const btn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium transition-colors";
const btnPrimary = `${btn} bg-accent text-accent-fg hover:bg-accent-hover`;
const btnSecondary = `${btn} border border-border-strong bg-surface text-fg hover:bg-surface-2`;

function SectionHeading({ eyebrow, title, text }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <p className="text-sm font-semibold text-accent">{eyebrow}</p>
      )}
      <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {text && <p className="mt-4 text-fg-muted">{text}</p>}
    </Reveal>
  );
}

function Pricing({ cta, isAuthed, billing }) {
  const [yearly, setYearly] = useState(true);

  return (
    <section id="pricing" className="scroll-mt-20 px-4 py-20 sm:px-6">
      <SectionHeading
        eyebrow="Pricing"
        title="Simple pricing. One plan."
        text="No tiers to compare and no hidden fees."
      />

      <div className="mt-8 flex justify-center">
        <div
          role="group"
          aria-label="Billing period"
          className="inline-flex rounded-full border border-border bg-surface-2 p-1"
        >
          {[
            { id: false, label: "Monthly" },
            { id: true, label: "Yearly" },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              aria-pressed={yearly === o.id}
              onClick={() => setYearly(o.id)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                yearly === o.id
                  ? "bg-surface text-fg shadow-sm"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              {o.label}
              {o.id && (
                <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
                  Save {savingsPct}%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <Reveal className="mx-auto mt-8 max-w-md rounded-2xl border-2 border-accent bg-surface p-8 shadow-[var(--shadow-pop)]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{PLAN.name}</h3>
          {yearly && <Badge tone="success">Save ${savings} a year</Badge>}
        </div>
        <p className="mt-1 text-sm text-fg-muted">{PLAN.tagline}</p>

        <p className="mt-6 flex items-baseline gap-1">
          <span className="num text-5xl font-semibold tracking-tight">
            ${yearly ? PLAN.yearly : PLAN.monthly}
          </span>
          <span className="text-fg-muted">/{yearly ? "year" : "month"}</span>
        </p>
        <p className="mt-1 h-5 text-sm text-fg-subtle">
          {yearly ? (
            <>
              That's ${perMonthYearly}/month instead of{" "}
              <span className="num line-through">${PLAN.monthly}</span>
            </>
          ) : (
            "Billed monthly. Cancel anytime."
          )}
        </p>

        {!isAuthed ? (
          <Link to="/login" className={`${btnPrimary} mt-6 w-full`}>
            Get started
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : billing?.status === "active" ? (
          <Link to="/app" className={`${btnPrimary} mt-6 w-full`}>
            Open your dashboard
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : (
          <button
            type="button"
            disabled={!!billing?.busy}
            onClick={() =>
              billing?.startCheckout(yearly ? "yearly" : "monthly")
            }
            className={`${btnPrimary} mt-6 w-full disabled:opacity-60`}
          >
            {billing?.busy ? "Opening checkout..." : "Subscribe"}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        )}
        <p className="mt-3 text-center text-xs text-fg-subtle">
          Secure checkout by Stripe. By subscribing you agree to our{" "}
          <Link to="/terms" className="underline hover:text-fg">
            Terms
          </Link>
          .
        </p>

        <ul className="mt-8 space-y-3">
          {PLAN.features.map((f) => (
            <li key={f} className="flex items-start gap-3 text-sm">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-success"
                aria-hidden
              />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

export function LandingPage({ isAuthed, theme, setTheme, billing }) {
  const cta = isAuthed ? "/app" : "/login";
  useDocumentTitle("LedgerFlow: get paid faster, with less paperwork");

  // Links like /#pricing from other pages scroll to their section
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    try {
      document
        .getElementById(decodeURIComponent(hash.slice(1)))
        ?.scrollIntoView();
    } catch {
      /* ignore malformed hashes */
    }
  }, [hash]);

  return (
    <div className="relative isolate min-h-dvh bg-bg text-fg">
      <Aurora />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="LedgerFlow home">
            <Logo />
          </Link>
          <nav
            aria-label="Page sections"
            className="hidden items-center gap-7 text-sm font-medium text-fg-muted md:flex"
          >
            <a href="#features" className="hover:text-fg">
              Features
            </a>
            <a href="#pricing" className="hover:text-fg">
              Pricing
            </a>
            <a href="#faq" className="hover:text-fg">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle
              theme={theme}
              setTheme={setTheme}
              className="hidden sm:inline-flex"
            />
            <Link to={cta} className={`${btnSecondary} h-9 px-4`}>
              {isAuthed ? "Open app" : "Sign in"}
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero: headline + live product tour */}
        <section className="relative px-4 pb-20 pt-12 text-center sm:px-6 sm:pt-16">
          <Badge tone="accent" className="mb-5">
            Invoicing with an AI assistant
          </Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Get paid <span className="gradient-text">faster</span>, with less
            paperwork.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-fg-muted">
            Create invoices, send reminders, and see exactly who owes what, with
            an AI assistant that does the typing. Nothing changes until you
            confirm.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to={cta} className={btnPrimary}>
              {isAuthed ? "Open your dashboard" : "Get started"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a href="#pricing" className={btnSecondary}>
              See pricing
            </a>
          </div>

          <div className="mt-12">
            <Showcase />
            <p className="mt-6 text-xs text-fg-subtle">
              Sample data for illustration.
            </p>
          </div>
        </section>

        {/* Pain points */}
        <section className="border-y border-border bg-surface/60 px-4 py-20 backdrop-blur-sm sm:px-6">
          <SectionHeading
            eyebrow="The problem"
            title="Getting paid shouldn't be this hard"
            text="Most small businesses don't lose money because of bad work. They lose it to messy invoicing."
          />
          <div className="mx-auto mt-12 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PAIN_POINTS.map(({ icon: Icon, title, text }, i) => (
              <Reveal
                key={title}
                delay={i * 90}
                className="rounded-xl border border-border bg-bg/80 p-6"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-danger-soft text-danger">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-fg-muted">{text}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 px-4 py-20 sm:px-6">
          <SectionHeading
            eyebrow="Everything in one place"
            title="One calm place for your invoices"
            text="From the first invoice to the last payment, without the spreadsheets and the guesswork."
          />
          <div className="mx-auto mt-12 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, text, status }, i) => (
              <Reveal
                key={title}
                delay={(i % 4) * 90}
                className="flex flex-col rounded-xl border border-border bg-surface/80 p-6 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent-soft text-accent">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <Badge tone={STATUS[status].tone}>
                    {STATUS[status].label}
                  </Badge>
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-fg-muted">{text}</p>
              </Reveal>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-fg-subtle">
            Rolling out means we're finishing it now.
          </p>
        </section>

        {/* Real screenshots (only appear once the image files exist) */}
        <Screens />

        {/* How it works */}
        <section className="border-y border-border bg-surface/60 px-4 py-20 backdrop-blur-sm sm:px-6">
          <SectionHeading
            eyebrow="How it works"
            title="Up and running in three steps"
          />
          <ol className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <Reveal delay={i * 120} className="text-center">
                  <span className="num mx-auto grid h-10 w-10 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-fg">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-semibold">{s.title}</h3>
                  <p className="mx-auto mt-1.5 max-w-xs text-sm text-fg-muted">
                    {s.text}
                  </p>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        {/* Estimates preview */}
        <section className="px-4 py-20 sm:px-6">
          <SectionHeading
            eyebrow="Coming soon"
            title="Quote the work. Get it approved. Invoice it."
            text="Send an estimate, let your client approve it online, then turn it into an invoice in one click. Signatures work the same way. Both are in preview today, and you can try them with sample data inside the app."
          />
          <div className="mx-auto mt-12 max-w-4xl">
            <Reveal>
              <Slideshow label="Estimates tour" slides={ESTIMATE_SLIDES} />
            </Reveal>
            <p className="mt-6 text-center text-xs text-fg-subtle">
              Sample data for illustration.
            </p>
          </div>
        </section>

        <Pricing cta={cta} isAuthed={isAuthed} billing={billing} />

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 px-4 pb-20 sm:px-6">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions, answered"
            text="Can't find what you're looking for? You can email us any time."
          />
          <div className="mx-auto mt-10 max-w-2xl divide-y divide-border rounded-xl border border-border bg-surface">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-fg-subtle transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="mt-3 text-sm text-fg-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-4xl rounded-2xl bg-[oklch(0.27_0.1_277)] px-6 py-14 text-center text-white">
            <ShieldCheck
              className="mx-auto h-8 w-8 text-white/70"
              aria-hidden
            />
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              Ready to spend less time on invoices?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-white/70">
              Set up your first client and invoice in a few minutes.
            </p>
            <Link
              to={cta}
              className={`${btn} mt-8 bg-white text-[oklch(0.27_0.1_277)] hover:bg-white/90`}
            >
              {isAuthed ? "Open your dashboard" : "Get started"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter isAuthed={isAuthed} />
    </div>
  );
}
