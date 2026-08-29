import React, { useState, useEffect } from "react";

function App() {
  const [metrics, setMetrics] = useState({
    total_outstanding_cents: 0,
    total_collected_cents: 0,
    total_clients_count: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/overview")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.data) setMetrics(payload.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatCurrency = (cents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 antialiased font-sans">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950 p-6 flex flex-col justify-between hidden md:flex">
        <div className="space-y-8">
          <div>
            <span className="text-xl font-black tracking-tight text-white">
              Ledger<span className="text-blue-500">Flow</span>
            </span>
            <p className="text-[10px] text-slate-600 font-mono mt-0.5">
              V4_CORE_ACTIVE
            </p>
          </div>
          <nav className="space-y-1">
            <a
              href="#dashboard"
              className="flex items-center space-x-3 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
            >
              <span>📊</span> <span>Dashboard</span>
            </a>
            <a
              href="#invoices"
              className="flex items-center space-x-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-900 hover:text-white transition-all"
            >
              <span>🧾</span> <span>Invoices</span>
            </a>
            <a
              href="#clients"
              className="flex items-center space-x-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-900 hover:text-white transition-all"
            >
              <span>👥</span> <span>Clients</span>
            </a>
          </nav>
        </div>
        <div className="border-t border-slate-900 pt-4 flex items-center space-x-3 text-xs text-slate-400">
          <span>👨‍💻 Abhi (Admin)</span>
        </div>
      </aside>

      {/* WORKSPACE CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-slate-900 bg-slate-950 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Workspace Dashboard
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            SVR: 3000 // DB: 5433
          </span>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-8 max-w-5xl w-full mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Financial Control Summary
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Monitor active accounts receivable balances, liquid cash assets,
              and client profiles.
            </p>
          </div>

          {/* DYNAMIC METRIC CARDS */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <span>Accounts Receivable</span>
                <span className="text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded text-[9px]">
                  ⏳ Pending
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-bold font-mono text-white">
                {loading
                  ? "..."
                  : formatCurrency(metrics.total_outstanding_cents)}
              </h3>
              <div className="absolute top-0 right-0 h-[2px] w-0 bg-amber-500 group-hover:w-full transition-all duration-300"></div>
            </div>

            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <span>Revenue Collected</span>
                <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[9px]">
                  💰 Settled
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-bold font-mono text-emerald-400">
                {loading
                  ? "..."
                  : formatCurrency(metrics.total_collected_cents)}
              </h3>
              <div className="absolute top-0 right-0 h-[2px] w-0 bg-emerald-500 group-hover:w-full transition-all duration-300"></div>
            </div>

            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <span>Active Clients</span>
                <span className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-[9px]">
                  👥 Profiles
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-bold font-mono text-white">
                {loading ? "..." : metrics.total_clients_count}
              </h3>
              <div className="absolute top-0 right-0 h-[2px] w-0 bg-blue-500 group-hover:w-full transition-all duration-300"></div>
            </div>
          </div>

          {/* REALTIME SYSTEM NETWORK STATUS PANEL */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5 font-mono text-[11px] text-slate-400 space-y-2">
            <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
              // PIPELINE ACTIVITY TELEMETRY
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1.5">
              <span className="text-slate-500">PostgreSQL Database:</span>
              <span className="text-emerald-400">CONNECTED // PORT 5433</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Express Routing API:</span>
              <span className="text-emerald-400">ONLINE // PORT 3000</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
