import { Search } from "lucide-react";
import { cn } from "../../lib/cn";

export function SearchInput({ className, ...props }) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
        aria-hidden
      />
      <input
        type="search"
        className="h-10 w-full rounded-lg border border-border-strong bg-surface pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        {...props}
      />
    </div>
  );
}
