import { NavLink } from "react-router-dom";
import { cn } from "../../lib/cn";
import { NAV } from "./nav";

export function BottomNav({ badges = {} }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
    >
      <ul className="grid grid-cols-5">
        {NAV.map(({ id, label, icon: Icon, to, end }) => (
          <li key={id}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "relative flex w-full flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium transition-colors",
                  isActive ? "text-accent" : "text-fg-subtle",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" />
                  )}
                  <span className="relative">
                    <Icon className="h-5 w-5" aria-hidden />
                    {badges[id] > 0 && (
                      <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-danger" />
                    )}
                  </span>
                  <span className="w-full truncate text-center">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
