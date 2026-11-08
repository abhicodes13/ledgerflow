import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

const control =
  "w-full rounded-lg border bg-surface px-3 text-sm text-fg placeholder:text-fg-subtle " +
  "transition-colors focus:border-accent focus:outline-none focus-visible:outline-none " +
  "focus:ring-2 focus:ring-accent/30 disabled:opacity-50";

function Field({ id, label, hint, error, className, children }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-fg-muted">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : (
        hint && <p className="text-xs text-fg-subtle">{hint}</p>
      )}
    </div>
  );
}

export function Input({
  label,
  hint,
  error,
  className,
  wrapperClassName,
  ...props
}) {
  const id = useId();
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      className={wrapperClassName}
    >
      <input
        id={id}
        aria-invalid={!!error}
        className={cn(
          control,
          "h-10",
          error ? "border-danger" : "border-border-strong",
          className,
        )}
        {...props}
      />
    </Field>
  );
}

export function Select({
  label,
  hint,
  error,
  className,
  wrapperClassName,
  children,
  ...props
}) {
  const id = useId();
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      className={wrapperClassName}
    >
      <div className="relative">
        <select
          id={id}
          aria-invalid={!!error}
          className={cn(
            control,
            "h-10 appearance-none pr-9",
            error ? "border-danger" : "border-border-strong",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
          aria-hidden
        />
      </div>
    </Field>
  );
}
