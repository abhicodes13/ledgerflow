import { Link } from "react-router-dom";
import { Button, Input } from "../ui";
import { AuthLayout, FormMessage } from "./AuthLayout";

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
        <button
          type="button"
          onClick={onToggleMode}
          className="font-medium text-accent hover:underline"
        >
          {isRegistering ? "Sign in" : "Create an account"}
        </button>
      </p>
    </AuthLayout>
  );
}
