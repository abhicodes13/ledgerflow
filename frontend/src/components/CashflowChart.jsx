import React from "react";

export function CashflowChart({ metrics }) {
  const outstanding = metrics.total_outstanding_cents || 0;
  const collected = metrics.total_collected_cents || 0;
  const total = outstanding + collected;

  const outstandingPercent =
    total > 0 ? Math.round((outstanding / total) * 100) : 0;
  const collectedPercent =
    total > 0 ? Math.round((collected / total) * 100) : 0;

  return (
    <section className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-6">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          // Real-Time Cashflow Proportions
        </h3>
        <p className="text-[11px] text-slate-500">
          Visual telemetry breakdown matching your authorized tenant ledger
          rows.
        </p>
      </div>

      <div className="space-y-4">
        <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${collectedPercent}%` }}
            className="bg-emerald-500 transition-all duration-500 ease-out"
          />
          <div
            style={{ width: `${outstandingPercent}%` }}
            className="bg-amber-500 transition-all duration-500 ease-out"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 font-mono text-xs">
          <div className="flex items-center space-x-3 p-3 rounded-xl border border-slate-900 bg-slate-900/10">
            <span className="h-2 w-2 rounded-full bg-emerald-500 block"></span>
            <div className="flex-1 flex justify-between items-center">
              <span className="text-slate-500">Settled Revenue:</span>
              <span className="text-emerald-400 font-bold">
                {collectedPercent}%
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-xl border border-slate-900 bg-slate-900/10">
            <span className="h-2 w-2 rounded-full bg-amber-500 block"></span>
            <div className="flex-1 flex justify-between items-center">
              <span className="text-slate-500">Accounts Receivable:</span>
              <span className="text-amber-400 font-bold">
                {outstandingPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
