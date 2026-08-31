import React from "react";

export function MetricCards({ loading, metrics }) {
  const formatCurrency = (cents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <div className="grid gap-6 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 relative overflow-hidden group">
        <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          <span>Accounts Receivable</span>
          <span className="text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded text-[9px]">
            ⏳ Pending
          </span>
        </div>
        <h3 className="mt-4 text-2xl font-bold font-mono text-white">
          {loading ? "..." : formatCurrency(metrics.total_outstanding_cents)}
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
          {loading ? "..." : formatCurrency(metrics.total_collected_cents)}
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
  );
}
