import React from "react";

export function CashflowChart({ data }) {
  const points = Array.isArray(data) ? data : [];

  return (
    <div className="p-5 rounded-xl border bg-white border-zinc-200/80 dark:bg-[#121212] dark:border-zinc-800/60 transition-colors flex flex-col justify-between h-[210px] tracking-tight font-sans shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="space-y-0.5">
        <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase">
          Cashflow Velocity
        </h3>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
          Real-time rolling multi-tenant traffic vectors
        </p>
      </div>

      <div className="h-24 w-full flex items-end justify-between pt-4 px-1 space-x-2">
        {points.map((val, idx) => {
          const maxCeiling = Math.max(...points, 100);
          const barHeight = `${Math.max((val / maxCeiling) * 100, 8)}%`;

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center group relative h-full justify-end"
            >
              <div className="absolute -top-7 scale-0 group-hover:scale-100 transition-all duration-150 px-2 py-1 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 rounded text-[9px] font-mono font-bold z-20">
                ${val.toLocaleString()}
              </div>
              <div
                style={{ height: barHeight }}
                className="w-full rounded-t bg-zinc-100 dark:bg-zinc-800/50 group-hover:bg-zinc-900 dark:group-hover:bg-zinc-100 transition-all duration-150"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
