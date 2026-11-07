import React from "react";

export function Navbar({
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  currentUser,
  handleLogout,
}) {
  const navTabs = [
    { id: "dashboard", label: "Overview" },
    { id: "billing", label: "Invoices" },
    { id: "customers", label: "Clients" },
    { id: "automations", label: "Automations" },
    { id: "settings", label: "Settings" },
    { id: "profile", label: "Profile" },
    { id: "bank", label: "Bank" },
  ];

  return (
    <header className="w-full h-14 flex items-center justify-between px-6 bg-white/75 dark:bg-[#1c1c1e]/60 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800/40 z-20 transition-all duration-200">
      {/* Brand & Extended Tabs Group */}
      <div className="flex items-center space-x-8">
        <span className="text-base font-black text-zinc-900 dark:text-white tracking-tight font-sans">
          Ledger<span className="text-blue-500">Flow</span>
        </span>

        <nav className="flex items-center space-x-1">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 font-sans
                ${
                  activeTab === tab.id
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm"
                    : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Settings & User Identity Group */}
      <div className="flex items-center space-x-4 text-xs">
        {/* Light/Dark Mode Switcher */}
        <button
          type="button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 text-zinc-500 dark:text-zinc-400 hover:text-blue-500 transition-colors"
        >
          {isDarkMode ? "☀️" : "🌙"}
        </button>

        {/* User Multi-Tenant Badge */}
        <div className="flex items-center space-x-2 border-l border-zinc-200 dark:border-zinc-800/60 pl-4">
          <div className="w-5 h-5 rounded-full bg-blue-600/10 flex items-center justify-center font-mono font-bold text-blue-500 text-[10px]">
            {currentUser?.username?.slice(0, 2).toUpperCase() || "OP"}
          </div>
          <span className="font-medium text-zinc-500 dark:text-zinc-400 max-w-[80px] truncate">
            {currentUser?.username}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-[10px] border border-zinc-200 dark:border-zinc-800 hover:border-red-500/20 text-zinc-400 hover:text-red-400 px-2 py-0.5 rounded transition-colors font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
