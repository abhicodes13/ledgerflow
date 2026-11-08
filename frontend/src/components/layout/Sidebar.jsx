import { LogOut, Sparkles } from "lucide-react";
import { cn } from "../../lib/cn";
import { NAV } from "./nav";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function Sidebar({
  activeTab,
  setActiveTab,
  badges = {},
  theme,
  setTheme,
  currentUser,
  onLogout,
  consoleVisible,
  drawerOpen,
  onToggleConsole,
  onToggleDrawer,
}) {
  const name = currentUser?.username || "Account";

  // Below xl the assistant is a slide-over drawer; at xl+ it's an inline panel.
  const assistantButton = (onClick, active, className) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-accent-soft text-accent"
          : "text-fg-muted hover:bg-surface-2 hover:text-fg",
        className,
      )}
    >
      <Sparkles className="h-[18px] w-[18px]" aria-hidden />
      AI assistant
    </button>
  );

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>

      <nav aria-label="Main" className="flex-1 space-y-1 px-3 py-2">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent-soft text-accent"
                  : "text-fg-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden />
              <span className="flex-1 text-left">{label}</span>
              {badges[id] > 0 && (
                <span className="rounded-full bg-danger-soft px-1.5 text-xs font-semibold leading-5 text-danger">
                  {badges[id]}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-border p-3">
        {assistantButton(onToggleDrawer, drawerOpen, "flex xl:hidden")}
        {assistantButton(onToggleConsole, consoleVisible, "hidden xl:flex")}

        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium text-fg-muted">Theme</span>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-surface-2 p-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
            {name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg">{name}</p>
            <p className="text-xs text-fg-subtle">Signed in</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Sign out"
            title="Sign out"
            className="rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-surface hover:text-danger"
          >
            <LogOut className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  );
}
