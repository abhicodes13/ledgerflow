import React from "react";

export function MetricCards({ metrics }) {
  const formatCurrency = (cents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format((cents || 0) / 100);
  };

  const widgets = [
    {
      label: "Outstanding Balance",
      value: formatCurrency(metrics?.total_outstanding_cents),
    },
    {
      label: "Capital Collected",
      value: formatCurrency(metrics?.total_collected_cents),
    },
    { label: "Active Registries", value: metrics?.total_clients_count || 0 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full p-7  font-sans">
      {widgets.map((w, i) => (
        <div
          key={i}
          className="p-10 rounded-xl border bg-white text-zinc-950 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-50 dark:border-zinc-800 shadow-sm transition-colors duration-150"
        >
          <span className="text-[10px] tracking-widest font-bold uppercase text-zinc-400 dark:text-zinc-500 block mb-1 font-mono">
            {w.label}
          </span>
          <p className="text-2xl font-black tracking-tight">{w.value}</p>
        </div>
      ))}
    </div>
  );
}
