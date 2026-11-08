import { Landmark } from "lucide-react";
import { cn } from "../../lib/cn";

export function Logo({ large = false, className }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "grid place-items-center rounded-lg bg-linear-to-br from-accent to-accent-hover text-accent-fg shadow-sm",
          large ? "h-10 w-10" : "h-8 w-8",
        )}
      >
        <Landmark className={large ? "h-5 w-5" : "h-4 w-4"} aria-hidden />
      </div>
      <span
        className={cn(
          "font-semibold tracking-tight text-fg",
          large ? "text-xl" : "text-base",
        )}
      >
        LedgerFlow
      </span>
    </div>
  );
}
