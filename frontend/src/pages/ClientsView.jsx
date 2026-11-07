import React, { useState } from "react";

export function ClientsView({ data, handleClientSubmitInternal }) {
  // 🌓 LOCAL VIEWPORT OVERLAY MODAL STATE
  const [selectedClientForModal, setSelectedClientForModal] = useState(null);

  return (
    <div className="space-y-8 animate-fadeIn font-sans tracking-tight text-zinc-100 w-full pb-12">
      {/* IDENTITY TRAILING TRACK HEADER */}
      <div className="space-y-0.5 pb-4 border-b border-zinc-900 w-full">
        <span className="text-[9px] font-mono tracking-widest text-blue-500 font-bold uppercase">
          Multi_Tenant_Registry_Node
        </span>
        <h2 className="text-sm font-black text-white uppercase tracking-tight">
          Client Infrastructure
        </h2>
      </div>

      {/* 🧭 TRACK A: HIGH-EFFICIENCY HORIZONTAL ACCOUNT INJECTOR BAND (BRIGHTENED ACCENTS) */}
      <form
        onSubmit={handleClientSubmitInternal}
        className="w-full bg-[#111114] border border-zinc-900 rounded-xl p-5 shadow-md text-xs font-medium flex flex-col sm:flex-row items-end gap-4"
      >
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-400 uppercase font-mono tracking-wider">
              Company / Operator Name
            </label>
            {/* 🟢 BRIGHTENED INPUTS: Uses premium bg-[#1c1c24] background profiles */}
            <input
              type="text"
              value={data.clientName || ""}
              onChange={(e) => data.setClientName(e.target.value)}
              placeholder="e.g., Acme Corporation"
              className="w-full rounded-xl px-4 py-3 bg-[#1c1c24] text-white border border-zinc-800/80 focus:border-blue-500 outline-none font-medium placeholder-zinc-600 shadow-inner"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-400 uppercase font-mono tracking-wider">
              Operational Email Profile
            </label>
            <input
              type="email"
              value={data.clientEmail || ""}
              onChange={(e) => data.setClientEmail(e.target.value)}
              placeholder="billing@acme.co"
              className="w-full rounded-xl px-4 py-3 bg-[#1c1c24] text-white border border-zinc-800/80 focus:border-blue-500 outline-none font-medium placeholder-zinc-600 shadow-inner"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-[0_4px_15px_rgba(37,99,235,0.2)] font-mono uppercase text-[10px] tracking-wider shrink-0 h-[46px] flex items-center justify-center"
        >
          Commit Entity
        </button>
      </form>

      {/* 🧭 TRACK B: THE EDGE-TO-EDGE SYMMETRIC CUSTOMER TRAIL ROWS */}
      <div className="w-full space-y-4">
        <div className="border-b border-zinc-900 pb-3">
          <h3 className="text-xs font-black tracking-wider text-white uppercase font-mono">
            Active Tenant Clusters
          </h3>
          <p className="text-[11px] text-zinc-500 font-medium">
            Isolated verified customer nodes stored inside active PostgreSQL
            storage
          </p>
        </div>

        <div className="divide-y divide-zinc-900/40 border-b border-zinc-900 w-full">
          {!data.clientsList || data.clientsList.length === 0 ? (
            <div className="p-8 text-center text-zinc-600 font-mono text-[10px] uppercase font-bold tracking-widest">
              No active tenant records verified in workspace field loops.
            </div>
          ) : (
            data.clientsList.map((client) => (
              <div
                key={client.id}
                onClick={() => setSelectedClientForModal(client)}
                className="py-4 flex items-center justify-between hover:bg-zinc-900/10 group transition-colors cursor-pointer w-full select-none"
              >
                <div className="space-y-1">
                  <p className="font-bold text-white text-xs font-sans group-hover:text-blue-400 transition-colors">
                    {client.name}
                  </p>
                  <p className="text-zinc-500 font-mono text-[10px] tracking-wide">
                    {client.email}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="font-mono text-[10px] text-zinc-400 bg-[#111114] border border-zinc-800 px-3 py-1 rounded-lg font-bold shadow-sm">
                    UID_0{client.id}
                  </div>
                  <span className="text-zinc-700 group-hover:text-zinc-400 text-[10px] font-mono font-bold transition-colors">
                    PROFILE→
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* 🚀 HIGH-FIDELITY CLIENT METADATA INSPECTION OVERLAY MODAL */}
      {selectedClientForModal &&
        (() => {
          // 📊 RUNTIME ANALYTICS FILTER: Extract genuine business insights for this specific client
          const clientInvoices =
            data.invoicesList?.filter(
              (inv) =>
                Number(inv.client_id) === Number(selectedClientForModal.id),
            ) || [];
          const invoiceCount = clientInvoices.length;

          let totalBilledCents = 0;
          let pendingUnpaidCents = 0;

          clientInvoices.forEach((inv) => {
            const amt = Number(
              inv.amount_cents || inv.total_amount_cents || inv.amount || 0,
            );
            totalBilledCents += amt;
            if (inv.status !== "paid") {
              pendingUnpaidCents += amt;
            }
          });

          const dollarFormat = (cents) => {
            return new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(cents / 100);
          };

          return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
              <div
                className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#141419] shadow-2xl p-6 relative flex flex-col space-y-6 max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-blue-500 uppercase font-mono tracking-widest">
                      Tenant_Account_Overview
                    </span>
                    <h2 className="text-xs font-black text-white uppercase font-sans">
                      Customer Financial Profile
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedClientForModal(null)}
                    className="p-1.5 border border-zinc-800 hover:border-zinc-700 bg-[#0e0e11] rounded-xl text-zinc-500 text-[10px] font-bold px-3 font-mono transition-colors"
                  >
                    ESC
                  </button>
                </div>

                {/* Profile Surface Grid */}
                <div className="p-5 rounded-2xl border border-zinc-800/80 bg-[#0e0e11]/50 space-y-5 font-sans text-xs">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-white tracking-tight">
                        {selectedClientForModal.name}
                      </h3>
                      <p className="font-mono text-zinc-500 text-[10px] tracking-wide">
                        {selectedClientForModal.email}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-blue-500/10 text-blue-400 uppercase tracking-wider">
                      UID_0{selectedClientForModal.id}
                    </span>
                  </div>

                  {/* 🟢 BUSINESS METRICS TRUCK BANDS */}
                  <div className="border-t border-zinc-800/60 pt-4 space-y-2 font-medium text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#141419] border border-zinc-800/50">
                      <span className="text-zinc-500">
                        Total Lifetime Billed
                      </span>
                      <span className="font-mono font-bold text-white text-sm">
                        {dollarFormat(totalBilledCents)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#141419] border border-zinc-800/50">
                      <span className="text-zinc-500">
                        Pending Arrears Balance
                      </span>
                      <span
                        className={`font-mono font-bold text-sm ${pendingUnpaidCents > 0 ? "text-amber-500" : "text-zinc-500"}`}
                      >
                        {dollarFormat(pendingUnpaidCents)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#141419] border border-zinc-800/50">
                      <span className="text-zinc-500">
                        Active Billing Statements
                      </span>
                      <span className="font-mono font-bold text-blue-400">
                        {invoiceCount}{" "}
                        <span className="text-[10px] text-zinc-600 font-sans uppercase">
                          Rows
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Utility Interaction Ribbon */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        selectedClientForModal.email,
                      );
                      alert(
                        `✉️ Copied client email address string directly to clipboard:\n${selectedClientForModal.email}`,
                      );
                    }}
                    className="bg-[#1c1c24] hover:bg-[#22222c] border border-zinc-800 py-2.5 rounded-xl text-zinc-300 transition-colors"
                  >
                    📋 COPY_EMAIL_HASH
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedClientForModal(null)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-xl transition-colors text-center"
                  >
                    [CLOSE]
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
