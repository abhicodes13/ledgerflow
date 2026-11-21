import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { LEGAL } from "../../lib/legal";

const linkClass = "text-sm text-fg-muted transition-colors hover:text-fg";

function Column({ title, children }) {
  return (
    <nav aria-label={title}>
      <p className="text-sm font-semibold text-fg">{title}</p>
      <ul className="mt-3 space-y-2">{children}</ul>
    </nav>
  );
}

export function SiteFooter({ isAuthed = false }) {
  return (
    <footer className="border-t border-border px-4 py-12 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-3 sm:col-span-2">
          <Logo />
          <p className="max-w-xs text-sm text-fg-muted">
            Invoicing with an AI assistant that asks before it acts.
          </p>
        </div>

        <Column title="Product">
          <li>
            <Link
              to={{ pathname: "/", hash: "#features" }}
              className={linkClass}
            >
              Features
            </Link>
          </li>
          <li>
            <Link
              to={{ pathname: "/", hash: "#pricing" }}
              className={linkClass}
            >
              Pricing
            </Link>
          </li>
          <li>
            <Link to={{ pathname: "/", hash: "#faq" }} className={linkClass}>
              FAQ
            </Link>
          </li>
        </Column>

        <Column title="Account">
          <li>
            <Link to={isAuthed ? "/app" : "/login"} className={linkClass}>
              {isAuthed ? "Open app" : "Sign in or create account"}
            </Link>
          </li>
        </Column>

        <Column title="Legal">
          <li>
            <Link to="/terms" className={linkClass}>
              Terms of Service
            </Link>
          </li>
          <li>
            <Link to="/privacy" className={linkClass}>
              Privacy Policy
            </Link>
          </li>
          <li>
            <a href={`mailto:${LEGAL.contactEmail}`} className={linkClass}>
              Contact
            </a>
          </li>
        </Column>
      </div>

      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-2 border-t border-border pt-6 text-sm text-fg-subtle sm:flex-row sm:justify-between">
        <p>
          © {new Date().getFullYear()} {LEGAL.company}. All rights reserved.
        </p>
        <p>Payments are processed by Stripe.</p>
      </div>
    </footer>
  );
}
