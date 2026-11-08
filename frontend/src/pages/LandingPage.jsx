import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  Clock,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { Logo } from "../components/layout/Logo";
import { ThemeToggle } from "../components/layout/ThemeToggle";
import { Badge } from "../components/ui";
import { Aurora, Reveal } from "../components/landing/Effects";
import { Showcase } from "../components/landing/Showcase";
import { cn } from "../lib/cn";

/* ───────── Edit your plan here ───────── */
const PLAN = {
  name: "Pro",
  tagline: "Everything you need to invoice and get paid.",
  monthly: 19,
  yearly: 200,
  features: [
    "Unlimited invoices and clients",
    "Itemized invoices with automatic totals",
    "Paid, pending, and overdue tracking",
    "Dashboard with cash-flow overview",
    "AI assistant with approval before every action",
    "Light and dark themes",
  ],
};
const yearlyFull = PLAN.monthly * 12;
const savings = yearlyFull - PLAN.yearly;
const savingsPct = Math.round((savings / yearlyFull) * 100);

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

const SOLUTIONS = [
  {
    icon: LayoutDashboard,
    title: "See what needs attention, instantly",
    text: "Your dashboard lists unpaid invoices by urgency, with overdue ones flagged and counted, so you always know who to follow up with.",
  },
  {
    icon: FileText,
    title: "Invoices in under a minute",
    text: "Add line items, watch the total update live, and get the next invoice number suggested for you.",
  },
  {
    icon: Users,
    title: "Every client in one place",
    text: "See how much each client has been billed and what they still owe, next to their full invoice history.",
  },
  {
    icon: Sparkles,
    title: "An assistant that does the typing",
    text: 'Say "add a client named Acme" or "draft an invoice for $2,000". It prepares the action, and nothing happens until you confirm.',
  },
];

const STEPS = [
  {
    title: "Add your client",
    text: "Name and billing email. That's all it takes.",
  },
  {
    title: "Create an invoice",
    text: "Add line items and a due date. Totals are calculated for you.",
  },
  {
    title: "Track and collect",
    text: "Watch paid, pending, and overdue update, then mark invoices paid.",
  },
];

const FAQ = [
  {
    q: "Who is LedgerFlow for?",
    a: "Freelancers, consultants, and small service businesses who send invoices and want a simple way to track who has paid.",
  },
  {
    q: "What can the AI assistant do?",
    a: "It can add clients, draft invoices, and mark invoices as paid from a plain-English request. Each time, it shows you a summary first.",
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
    q: "Is my data private?",
    a: "Yes. You sign in to your own account, and each account can only see its own clients and invoices.",
  },
  {
    q: "Does it work on my phone?",
    a: "Yes. LedgerFlow adapts to phones, tablets, and laptops, and has light and dark themes.",
  },
  {
    q: "Can I email invoices or accept card payments?",
    a: "Not yet. Emailing invoices and online card payments are coming. Today you create invoices, track their status, and mark them paid inside LedgerFlow.",
  },
  {
    q: "Can I switch between monthly and yearly billing?",
    a: "Yes. The yearly plan costs less per month, and you can change plans at any time.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. There's no long-term contract on the monthly plan.",
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

function Pricing({ cta }) {
  const [yearly, setYearly] = useState(true);
  const perMonthYearly = (PLAN.yearly / 12).toFixed(2);

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

        <Link to={cta} className={`${btnPrimary} mt-6 w-full`}>
          Get started
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>

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

export function LandingPage({ isAuthed, theme, setTheme }) {
  const cta = isAuthed ? "/app" : "/login";

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
            Create invoices, see exactly who owes what, and let an AI assistant
            handle the typing. Nothing changes until you confirm.
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

        {/* Solutions */}
        <section id="features" className="scroll-mt-20 px-4 py-20 sm:px-6">
          <SectionHeading
            eyebrow="The solution"
            title="One calm place for your invoices"
            text="LedgerFlow replaces the spreadsheets and the guesswork."
          />
          <div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-2">
            {SOLUTIONS.map(({ icon: Icon, title, text }, i) => (
              <Reveal
                key={title}
                delay={i * 90}
                className="flex gap-4 rounded-xl border border-border bg-surface/80 p-6 backdrop-blur-sm"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm text-fg-muted">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

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

        <Pricing cta={cta} />

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 px-4 pb-20 sm:px-6">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions, answered"
            text="Can't find what you're looking for? You'll be able to reach support from inside the app."
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

      <footer className="border-t border-border px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <p className="text-sm text-fg-subtle">
            © {new Date().getFullYear()} LedgerFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
