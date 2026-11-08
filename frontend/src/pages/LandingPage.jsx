import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "../components/ui";
import { Logo } from "../components/layout/Logo";
import { ThemeToggle } from "../components/layout/ThemeToggle";

export function LandingPage({ isAuthed, theme, setTheme }) {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-3">
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <Link to={isAuthed ? "/app" : "/login"}>
            <Button variant="secondary" size="sm">
              {isAuthed ? "Open app" : "Sign in"}
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Get paid faster, with less paperwork.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-fg-muted">
          Itemized invoices, clear payment tracking, and an AI assistant that
          handles the busywork.
        </p>
        <Link to={isAuthed ? "/app" : "/login"} className="mt-8 inline-block">
          <Button size="md">
            {isAuthed ? "Open your dashboard" : "Get started"}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </Link>
        <p className="mt-16 text-xs text-fg-subtle">
          Placeholder. Features, screenshots, and pricing come next.
        </p>
      </main>
    </div>
  );
}
