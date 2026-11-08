import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "../ui";

const OPTIONS = [
  { id: "light", label: "Light", icon: Sun },
  { id: "system", label: "System", icon: Monitor },
  { id: "dark", label: "Dark", icon: Moon },
];

// Three-way switch: light / system / dark
export function ThemeToggle({ theme, setTheme, className }) {
  return (
    <div
      role="group"
      aria-label="Theme"
      className={cn(
        "inline-flex rounded-lg border border-border bg-surface-2 p-0.5",
        className,
      )}
    >
      {OPTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setTheme(id)}
          aria-pressed={theme === id}
          aria-label={label}
          title={label}
          className={cn(
            "grid h-7 w-8 place-items-center rounded-md transition-colors",
            theme === id
              ? "bg-surface text-fg shadow-sm"
              : "text-fg-subtle hover:text-fg",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </button>
      ))}
    </div>
  );
}

// Single icon button for tight spaces (mobile header): cycles light > dark > system
export function ThemeCycle({ theme, setTheme }) {
  const order = ["light", "dark", "system"];
  const next = order[(order.indexOf(theme) + 1) % order.length];
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label={`Theme: ${theme}. Switch to ${next}`}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </Button>
  );
}
