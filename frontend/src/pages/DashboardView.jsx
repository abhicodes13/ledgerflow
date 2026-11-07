import React from "react";
import { MetricCards } from "../components/MetricCards";
import { CashflowChart } from "../components/CashflowChart";

export function DashboardView({ metrics }) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <MetricCards metrics={metrics} />
      <CashflowChart data={metrics?.chartData} />
    </div>
  );
}
