import React, { useState } from "react";

export function DashboardView({ metrics, invoicesList, data: dataContext }) {
  // 🌓 LOCAL STATE: MANAGES THE WORKSPACE MICRO-APPROVAL INTERACTION TILE POPUPS
  const [activeAiActionModal, setActiveAiActionModal] = useState(null);

  const formatCurrency = (cents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format((cents || 0) / 100);
  };

  const allInvoices = invoicesList || [];
  const unpaidInvoices = allInvoices.filter((inv) => inv.status !== "paid");

  const paidCount = allInvoices.filter((inv) => inv.status === "paid").length;
  const collectionEfficiency =
    allInvoices.length > 0
      ? Math.round((paidCount / allInvoices.length) * 100)
      : 100;

  const handleDispatchReminder = (invNumber, clientName) => {
    alert(
      `✉️ AI Dispatcher: Secure automated collection notification link transmitted to ${clientName} regarding Statement ${invNumber}.`,
    );
  };

  // 🤖 WORKSPACE AI PREDICTIVE AUTOMATION RECOMMENDATIONS MATRIX
  const mockAiRecommendations = [
    {
      id: "rec_01",
      title: "Automated Liquidity Clearance Loop",
      description:
        "Trigger a batched billing sweep to close out overdue transaction columns for settled records.",
      impact: "Accelerate collection metrics by ~12%",
      badge: "OPTIMIZATION",
      actionType: "batch_settle",
      payload: { targets: "all_overdue" },
    },
    {
      id: "rec_02",
      title: "Provision Unbilled Client Workspace",
      description:
        "A newly created client entity has zero active invoices mapped to their relational database rows.",
      impact: "Draft initial baseline consulting statement",
      badge: "BILLING_GAP",
      actionType: "draft_initial",
      payload: { template: "baseline_retainer" },
    },
  ];

  const handleExecuteModalAiAction = (action, payload) => {
    alert(
      `⚡ Core AI Handshake Triggered:\nAction: ${action.toUpperCase()}\nPayload: ${JSON.stringify(payload)}\n\nDispatching request telemetry frame straight to your backend /api/chat/confirm parser pipe now...`,
    );
    setActiveAiActionModal(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn font-sans tracking-tight text-zinc-200 w-full pb-12 select-none">
      {/* 🧭 TOP RADAR HEADER BRAND NODE */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900 w-full">
        <div className="space-y-0.5">
          <h2 className="text-sm font-bold text-zinc-400 uppercase font-mono tracking-wider">
            Workspace Performance Deck //
          </h2>
          <p className="text-[11px] text-zinc-500 font-medium">
            Real-time ledger audit trails and operational intelligence
            controllers
          </p>
        </div>
        <span className="text-[9px] font-mono font-bold px-2 py-1 rounded bg-zinc-900/60 border border-zinc-800 text-blue-400 uppercase tracking-widest shadow-inner animate-pulse">
          Live_Sync_OK
        </span>
      </div>

      {/* 📊 SHADCN TYPE MINIMALIST MICRO-CARD HUD MATRIX */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        <div className="p-4 rounded-xl border border-zinc-900 bg-[#0c0c0e] space-y-1 shadow-sm">
          <p className="text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase">
            Outstanding Balance
          </p>
          <p className="text-lg font-black text-white font-mono tracking-tight">
            {formatCurrency(metrics?.total_outstanding_cents || 0)}
          </p>
          <span className="text-[9px] font-sans font-medium text-zinc-600 block">
            Active outstanding accounts collection pipeline
          </span>
        </div>
        <div className="p-4 rounded-xl border border-zinc-900 bg-[#0c0c0e] space-y-1 shadow-sm">
          <p className="text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase">
            Settled Capital
          </p>
          <p className="text-lg font-black text-emerald-400 font-mono tracking-tight">
            {formatCurrency(metrics?.total_collected_cents || 0)}
          </p>
          <span className="text-[9px] font-sans font-medium text-zinc-600 block">
            Verified funds written completely to Postgres
          </span>
        </div>
        <div className="p-4 rounded-xl border border-zinc-900 bg-[#0c0c0e] space-y-1 shadow-sm">
          <p className="text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase">
            System Efficiency
          </p>
          <p className="text-lg font-black text-blue-400 font-mono tracking-tight">
            {collectionEfficiency}%
          </p>
          <span className="text-[9px] font-sans font-medium text-zinc-600 block">
            Ratio of total accounts settled vs drafted logs
          </span>
        </div>
      </div>

      {/* 🚨 CRITICAL TRACK: ATTENTION REQUIRED / ARREARS BANNER */}
      <div className="w-full space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-1 h-1 bg-amber-500 rounded-full animate-ping" />
          <h3 className="text-xs font-black tracking-wider text-white uppercase font-mono">
            Attention Required / Pending Arrears
          </h3>
        </div>
        <div className="w-full border border-zinc-900 rounded-xl bg-[#0c0c0e] divide-y divide-zinc-900/60 overflow-hidden shadow-md">
          {unpaidInvoices.length === 0 ? (
            <p className="p-6 text-center text-zinc-600 font-mono text-[10px] uppercase font-bold tracking-widest">
              Clean Slate Registry. Zero pending collections anomalies detected.
            </p>
          ) : (
            unpaidInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0c0c0e] hover:bg-zinc-900/10 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono font-bold text-xs text-white">
                      {inv.invoice_number}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      OVERDUE_COLLECTION
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-medium font-sans">
                    {inv.client_name} •{" "}
                    <span className="text-zinc-600 font-mono">
                      Limit:{" "}
                      {inv.due_date
                        ? new Date(inv.due_date).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 font-mono text-xs w-full sm:w-auto">
                  <span className="font-bold text-amber-500 font-sans tracking-tight">
                    {formatCurrency(
                      inv.amount_cents ||
                        inv.total_amount_cents ||
                        inv.amount ||
                        0,
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleDispatchReminder(
                        inv.invoice_number,
                        inv.client_name,
                      )
                    }
                    className="text-[9px] font-mono font-bold tracking-wider px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors uppercase"
                  >
                    [DISPATCH REMINDER]
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* 🤖 TRACK 2: AI COBALT PREDICTIVE AUTOMATION RECOMMENDATIONS */}
      <div className="w-full space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-1 h-1 bg-blue-500 rounded-full" />
          <h3 className="text-xs font-black tracking-wider text-white uppercase font-mono">
            Autonomous AI Optimization Insights
          </h3>
        </div>

        <div className="w-full border border-zinc-900 rounded-xl bg-[#0c0c0e] divide-y divide-zinc-900/60 overflow-hidden shadow-md">
          {mockAiRecommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0c0c0e] hover:bg-zinc-900/10 transition-colors animate-fadeIn"
            >
              <div className="space-y-1 sm:max-w-[75%]">
                <div className="flex items-center space-x-2.5">
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {rec.badge}
                  </span>
                  <h4 className="font-sans font-bold text-xs text-zinc-200">
                    {rec.title}
                  </h4>
                </div>
                <p className="text-[11px] text-zinc-500 font-medium font-sans leading-relaxed">
                  {rec.description}{" "}
                  <span className="text-zinc-400 font-mono text-[10px] block mt-0.5">
                    Expected Impact: {rec.impact}
                  </span>
                </p>
              </div>

              <div className="flex items-center justify-end font-mono text-xs w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveAiActionModal(rec)}
                  className="w-full sm:w-auto text-[9px] font-mono font-black tracking-wider px-4 py-2 rounded-lg bg-blue-600 border border-blue-500 text-white hover:bg-blue-500 transition-all uppercase shadow-[0_2px_10px_rgba(37,99,235,0.15)]"
                >
                  [ENGAGE]
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ⚙️ TRACK 3: INFRASTRUCTURE EFFICIENCY RECAP */}
      <div className="w-full space-y-3">
        <h3 className="text-xs font-black tracking-wider text-white uppercase font-mono px-0.5">
          Infrastructure Efficiency Summary
        </h3>
        <div className="w-full bg-[#0c0c0e] border border-zinc-900 rounded-xl p-5 shadow-sm text-xs font-medium grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-[9px] font-mono font-bold tracking-wider text-zinc-500 uppercase">
              Multi-Tenant Mapping Status
            </p>
            <p className="text-white leading-relaxed font-sans text-[11px]">
              System currently multiplexing{" "}
              <span className="text-blue-500 font-bold font-mono">
                {allInvoices.length} billing rows
              </span>{" "}
              cleanly across{" "}
              <span className="text-purple-400 font-bold font-mono">
                {metrics?.total_clients_count || 0} customer partitions
              </span>{" "}
              inside isolated local PostgreSQL table frames.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-mono font-bold tracking-wider text-zinc-500 uppercase">
              SaaS Optimization Note
            </p>
            <p className="text-zinc-400 leading-relaxed font-sans text-[11px]">
              Maintain an active collection velocity threshold higher than{" "}
              <span className="text-emerald-400 font-bold font-mono">85%</span>{" "}
              to maximize operational liquidity parameters. Run the AI sidebar
              console commands to parse intent rows automatically.
            </p>
          </div>
        </div>
      </div>

      {/* 🚀 HIGH-FIDELITY INTERACTIVE AI MICRO-APPROVAL OVERLAY MODAL */}
      {activeAiActionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#141419] shadow-2xl p-6 relative flex flex-col space-y-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-blue-500 uppercase font-mono tracking-widest">
                  AI_Decision_Verification
                </span>
                <h2 className="text-xs font-black text-white uppercase font-sans">
                  Confirm Automation Prompt
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveAiActionModal(null)}
                className="p-1.5 border border-zinc-800 hover:border-zinc-700 bg-[#0e0e11] rounded-xl text-zinc-500 text-[10px] font-bold px-3 font-mono transition-colors"
              >
                ESC
              </button>
            </div>

            {/* Content Body Surface */}
            <div className="p-4 rounded-xl border border-zinc-800/80 bg-[#0e0e11]/50 space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold text-blue-400 uppercase tracking-wider block">
                  TARGET_ROUTING_ACTION
                </span>
                <h3 className="text-xs font-black text-white uppercase font-mono">
                  {activeAiActionModal.actionType}
                </h3>
              </div>
              <div className="space-y-1.5 border-t border-zinc-800/60 pt-3 text-zinc-400 leading-relaxed font-medium">
                <p>{activeAiActionModal.description}</p>
                <div className="p-3 bg-[#141419] border border-zinc-800/50 rounded-lg text-[10px] font-mono font-bold text-zinc-500 flex items-center justify-between">
                  <span>PAYLOAD_ARGUMENTS:</span>
                  <span className="text-zinc-300">
                    {JSON.stringify(activeAiActionModal.payload)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Triggers Ribbon */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono font-bold pt-1">
              <button
                type="button"
                onClick={() =>
                  handleExecuteModalAiAction(
                    activeAiActionModal.actionType,
                    activeAiActionModal.payload,
                  )
                }
                className="bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl transition-all shadow-[0_4px_15px_rgba(37,99,235,0.25)] uppercase tracking-wider font-black"
              >
                CONFIRM_EXECUTE
              </button>
              <button
                type="button"
                onClick={() => setActiveAiActionModal(null)}
                className="bg-[#1c1c24] hover:bg-[#22222c] border border-zinc-800 py-2.5 rounded-xl text-zinc-400 transition-colors uppercase text-center"
              >
                [ABORT]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
