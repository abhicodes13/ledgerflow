import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Landmark,
  Sparkles,
  Wallet,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { Button, Input } from "../ui";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const FEATURES = [
  { icon: FileText, text: "Create and send itemized invoices in seconds" },
  { icon: Wallet, text: "See what's paid, pending, and overdue at a glance" },
  { icon: Sparkles, text: "Let the AI assistant handle the busywork" },
];

export function AuthScreen({
  isRegistering,
  onToggleMode,
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  message,
  submitting,
  onSubmit,
  theme,
  setTheme,
}) {
  return (
    <div className="grid min-h-dvh bg-bg text-fg lg:grid-cols-2">
      {/* Brand panel (large screens). Fixed colors so it looks the same in both themes. */}
      <div className="relative hidden overflow-hidden bg-[oklch(0.27_0.1_277)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[oklch(0.6_0.22_277)]/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-[oklch(0.55_0.2_320)]/30 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/15 backdrop-blur">
            <Landmark className="h-5 w-5" aria-hidden />
          </div>
          <span className="text-xl font-semibold tracking-tight">
            LedgerFlow
          </span>
        </div>

        <div className="relative max-w-md space-y-8">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Get paid faster, with less paperwork.
          </h2>
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/85">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/50">
          © {new Date().getFullYear()} LedgerFlow
        </p>
      </div>

      {/* Form */}
      <div className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="absolute right-4 top-4">
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>

        <div className="w-full max-w-sm animate-fadeIn space-y-8">
          <Logo large className="lg:hidden" />

          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">
              {isRegistering ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-sm text-fg-muted">
              {isRegistering
                ? "Set up your workspace to start invoicing."
                : "Sign in to manage your invoices and clients."}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              autoComplete="username"
              required
            />
            {isRegistering && (
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            )}
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={isRegistering ? "new-password" : "current-password"}
              required
            />

            {message.text && (
              <div
                role={message.isError ? "alert" : "status"}
                className={cn(
                  "flex items-start gap-2 rounded-lg border p-3 text-sm",
                  message.isError
                    ? "border-danger/30 bg-danger-soft text-danger"
                    : "border-success/30 bg-success-soft text-success",
                )}
              >
                {message.isError ? (
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden
                  />
                ) : (
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden
                  />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <Button type="submit" loading={submitting} className="w-full">
              {isRegistering ? "Create account" : "Sign in"}
            </Button>
          </form>

          <p className="text-center text-sm text-fg-muted">
            {isRegistering ? "Already have an account?" : "New to LedgerFlow?"}{" "}
            <button
              type="button"
              onClick={onToggleMode}
              className="font-medium text-accent hover:underline"
            >
              {isRegistering ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
