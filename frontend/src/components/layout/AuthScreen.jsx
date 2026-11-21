import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Input } from "../ui";
import { AuthLayout, FormMessage } from "./AuthLayout";

const linkClass = "font-medium text-accent hover:underline";

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
  const [agreed, setAgreed] = useState(false);
  const toggle = () => {
    setAgreed(false);
    onToggleMode();
  };

  return (
    <AuthLayout theme={theme} setTheme={setTheme}>
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

        {!isRegistering && (
          <div className="-mt-2 flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-accent hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        )}

        {isRegistering && (
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-fg-muted">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              required
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-strong accent-accent"
            />
            <span>
              I agree to the{" "}
              <Link
                to="/terms"
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>
        )}

        {message.text && (
          <FormMessage tone={message.isError ? "error" : "success"}>
            {message.text}
          </FormMessage>
        )}

        <Button type="submit" loading={submitting} className="w-full">
          {isRegistering ? "Create account" : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-fg-muted">
        {isRegistering ? "Already have an account?" : "New to LedgerFlow?"}{" "}
        <button type="button" onClick={toggle} className={linkClass}>
          {isRegistering ? "Sign in" : "Create an account"}
        </button>
      </p>
    </AuthLayout>
  );
}
