import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Logo } from "../layout/Logo";
import { ThemeToggle } from "../layout/ThemeToggle";
import { SiteFooter } from "../layout/SiteFooter";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { formatDate } from "../../lib/format";
import { LEGAL } from "../../lib/legal";

const linkClass = "font-medium text-accent hover:underline";

export function P({ children }) {
  return (
    <p className="mt-3 text-sm leading-relaxed text-fg-muted">{children}</p>
  );
}

export function UL({ items }) {
  return (
    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg-muted">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function A({ to, href, children }) {
  return to ? (
    <Link to={to} className={linkClass}>
      {children}
    </Link>
  ) : (
    <a href={href} className={linkClass}>
      {children}
    </a>
  );
}

// sections: [{ id, title, body }]
export function LegalPage({ title, intro, sections, theme, setTheme }) {
  useDocumentTitle(`${title} · ${LEGAL.company}`);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label={`${LEGAL.company} home`}>
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle
              theme={theme}
              setTheme={setTheme}
              className="hidden sm:inline-flex"
            />
            <Link
              to="/"
              className="text-sm font-medium text-fg-muted hover:text-fg"
            >
              Back to home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="On this page" className="hidden lg:block">
          <ul className="sticky top-24 space-y-1 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block rounded-md px-2 py-1 text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="min-w-0 max-w-3xl">
          {!LEGAL.reviewed && (
            <div
              role="note"
              className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm text-warning"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>
                Draft. This document is a template and hasn't been reviewed by a
                lawyer yet.
              </p>
            </div>
          )}

          <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-fg-subtle">
            Effective {formatDate(LEGAL.effectiveDate)}
          </p>
          <p className="mt-6 text-sm leading-relaxed text-fg-muted">{intro}</p>

          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 pt-10">
              <h2 className="text-lg font-semibold tracking-tight">
                {s.title}
              </h2>
              {s.body}
            </section>
          ))}
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
