import { LogOut, Sparkles } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "../ui";
import { Logo } from "./Logo";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { ThemeCycle } from "./ThemeToggle";

export function AppShell({
  activeTab,
  setActiveTab,
  badges,
  theme,
  setTheme,
  currentUser,
  onLogout,
  consoleVisible,
  drawerOpen,
  onToggleConsole,
  onToggleDrawer,
  onCloseDrawer,
  assistant,
  children,
}) {
  return (
    <div className="flex h-dvh overflow-hidden bg-bg text-fg">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        badges={badges}
        theme={theme}
        setTheme={setTheme}
        currentUser={currentUser}
        onLogout={onLogout}
        consoleVisible={consoleVisible}
        drawerOpen={drawerOpen}
        onToggleConsole={onToggleConsole}
        onToggleDrawer={onToggleDrawer}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Phone header */}
        <header className="shrink-0 border-b border-border bg-surface/90 pt-[env(safe-area-inset-top)] backdrop-blur-lg md:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Logo />
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleDrawer}
                aria-label="Open AI assistant"
              >
                <Sparkles className="h-4 w-4" aria-hidden />
              </Button>
              <ThemeCycle theme={theme} setTheme={setTheme} />
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div
              key={activeTab}
              className="mx-auto w-full max-w-6xl animate-fadeIn space-y-8 px-4 py-6 pb-28 sm:px-6 md:pb-10 lg:px-8"
            >
              {children}
            </div>
          </main>

          {/* AI assistant: slide-over drawer below xl, inline panel at xl+ */}
          <aside
            aria-label="AI assistant"
            className={cn(
              "fixed inset-y-0 right-0 z-50 w-[min(24rem,100vw)] border-l border-border bg-surface shadow-[var(--shadow-pop)]",
              "transition-[transform,visibility] duration-300 ease-out",
              "xl:visible xl:static xl:z-auto xl:w-96 xl:shrink-0 xl:translate-x-0 xl:shadow-none",
              drawerOpen
                ? "visible translate-x-0"
                : "invisible translate-x-full",
              !consoleVisible && "xl:hidden",
            )}
          >
            {assistant}
          </aside>
        </div>
      </div>

      {drawerOpen && (
        <div
          onClick={onCloseDrawer}
          aria-hidden
          className="fixed inset-0 z-40 bg-[var(--overlay)] backdrop-blur-sm xl:hidden"
        />
      )}

      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        badges={badges}
      />
    </div>
  );
}
