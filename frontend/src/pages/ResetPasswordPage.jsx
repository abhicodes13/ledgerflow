import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button, Input } from "../components/ui";
import { AuthLayout, FormMessage } from "../components/layout/AuthLayout";
import { API_BASE } from "../lib/config";
import { errorMessage, postJson } from "../lib/api";

const MIN = 8;
const MAX = 72;
const LIMITED = "Too many attempts, try again later.";
const OFFLINE =
  "Couldn't reach the server. Check your connection and try again.";
const linkButton =
  "inline-flex h-10 w-full items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover";

const byteLength = (s) => new TextEncoder().encode(s).length;

function passwordProblem(pw) {
  if (pw.length < MIN) return `Use at least ${MIN} characters.`;
  if (byteLength(pw) > MAX) {
    return `Use at most ${MAX} characters (some symbols and emoji count as more than one).`;
  }
  return "";
}

export function ResetPasswordPage({ theme, setTheme }) {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null); // { text, link }

  const pwError = submitted ? passwordProblem(password) : "";
  const matchError =
    submitted && !pwError && confirm !== password
      ? "Passwords don't match."
      : "";

  const submit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    if (passwordProblem(password) || confirm !== password) return;

    setSubmitting(true);
    const r = await postJson(`${API_BASE}/api/auth/reset-password`, {
      token,
      newPassword: password,
    });
    setSubmitting(false);

    if (r.ok && r.data?.success === true) {
      navigate("/login", {
        replace: true,
        state: {
          notice:
            "Password updated. Log in with your username and new password.",
        },
      });
      return;
    }
    if (r.network) return setError({ text: OFFLINE, link: false });
    if (r.status === 429) return setError({ text: LIMITED, link: false });
    setError({
      text: errorMessage(r.data, "This reset link is invalid or has expired."),
      link: true,
    });
  };

  if (!token) {
    return (
      <AuthLayout theme={theme} setTheme={setTheme}>
        <div className="space-y-4">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-warning-soft text-warning">
            <AlertTriangle className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            This reset link is incomplete
          </h1>
          <p className="text-sm text-fg-muted">
            Open the link from your email again, or request a new one.
          </p>
        </div>
        <Link to="/forgot-password" className={linkButton}>
          Request a new link
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout theme={theme} setTheme={setTheme}>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          Set a new password
        </h1>
        <p className="text-sm text-fg-muted">
          Choose a new password for your account. This link works once and
          expires 30 minutes after it was sent.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Input
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          hint={`${MIN} to ${MAX} characters`}
          error={pwError}
          required
        />
        <Input
          label="Confirm new password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          error={matchError}
          required
        />

        {error && <FormMessage>{error.text}</FormMessage>}
        {error?.link && (
          <p className="text-sm text-fg-muted">
            Need a new link?{" "}
            <Link
              to="/forgot-password"
              className="font-medium text-accent hover:underline"
            >
              Request one
            </Link>
          </p>
        )}

        <Button
          type="submit"
          loading={submitting}
          disabled={!password || !confirm}
          className="w-full"
        >
          Update password
        </Button>
      </form>

      <p className="text-center text-sm text-fg-muted">
        <Link to="/login" className="font-medium text-accent hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
