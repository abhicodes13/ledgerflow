import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Button, Input } from "../components/ui";
import { AuthLayout, FormMessage } from "../components/layout/AuthLayout";
import { API_BASE } from "../lib/config";
import { postJson } from "../lib/api";

const SENT = "If an account exists for that email, we've sent a reset link.";
const LIMITED = "Too many attempts, try again later.";
const OFFLINE =
  "Couldn't reach the server. Check your connection and try again.";

export function ForgotPasswordPage({ theme, setTheme }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    setSending(true);
    setError("");
    const r = await postJson(`${API_BASE}/api/auth/forgot-password`, {
      email: value,
    });
    setSending(false);

    if (r.status === 429) return setError(LIMITED);
    if (r.network) return setError(OFFLINE);
    // Same message for every other response, so nobody can learn which emails have accounts
    setSent(true);
  };

  const back = (
    <Link
      to="/login"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Back to sign in
    </Link>
  );

  if (sent) {
    return (
      <AuthLayout theme={theme} setTheme={setTheme}>
        <div className="space-y-4">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-success-soft text-success">
            <MailCheck className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="text-sm text-fg-muted">{SENT}</p>
          <p className="text-sm text-fg-muted">
            The link works once and expires in 30 minutes. The email also shows
            your username, which is what you sign in with. Check your spam
            folder if you don't see it.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3">
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
            className="text-sm font-medium text-fg-muted hover:text-fg hover:underline"
          >
            Use a different email
          </button>
          {back}
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout theme={theme} setTheme={setTheme}>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          Forgot your password?
        </h1>
        <p className="text-sm text-fg-muted">
          Enter your email and we'll send you a link to reset it.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        {error && <FormMessage>{error}</FormMessage>}
        <Button
          type="submit"
          loading={sending}
          disabled={!email.trim()}
          className="w-full"
        >
          Send reset link
        </Button>
      </form>

      {back}
    </AuthLayout>
  );
}
