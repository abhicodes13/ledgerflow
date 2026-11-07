import React, { useState } from "react";
import { InvoiceForm } from "../components/InvoiceForm";

export function InvoicesView({
  data,
  filteredInvoices,
  handleInvoiceSubmitInternal,
  handleDownloadPdf,
  handleSettleInternal,
}) {
  // 🌓 LOCAL STATE: MANAGES THE ACTIVE HIGH-FIDELITY INSPECTION MODAL ROW OVERLAY
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState(null);

  const dollarFormat = (cents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format((cents || 0) / 100);
  };

  // Helper macro workflow actions for the interactive model deck
  const handleCopyInvoiceLink = (inv) => {
    const mockLink = `${window.location.origin}/checkout/statement/${inv.invoice_number}`;
    navigator.clipboard.writeText(mockLink);
    alert(`🔑 Secure checkout link copied to clipboard:\n${mockLink}`);
  };

  const handleEmailInvoiceCopy = (inv) => {
    alert(
      `✉️ Dispatching secure automated email notification payload to the registered endpoint tracking profile for: ${inv.client_name}`,
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans tracking-tight">
      {/* Primary Invoicing Generation Form Panel */}
      <InvoiceForm
        clientsList={data.clientsList}
        selectedClientId={data.selectedClientId}
        setSelectedClientId={data.setSelectedClientId}
        invoiceNumber={data.invoiceNumber}
        setInvoiceNumber={data.setInvoiceNumber}
        dueDate={data.dueDate}
        setDueDate={data.setDueDate}
        items={data.items}
        setItems={data.setItems}
        invoiceMessage={data.invoiceMessage}
        handleInvoiceSubmit={handleInvoiceSubmitInternal}
      />
      {/* 📊 THE RE-DESIGNED PREMIUM MONOCHROMATIC LEDGER HISTORY FEED */}
      <div className="rounded-xl border border-zinc-200 bg-white dark:bg-[#121212] dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors duration-200">
        {/* Header control deck */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="text-xs font-black tracking-wider text-zinc-900 dark:text-zinc-50 uppercase font-mono">
              Statement Log Registry
            </h3>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
              Historical audit records for active multi-tenant accounts
            </p>
          </div>
          <input
            type="text"
            placeholder="Search parameters / names..."
            value={data.searchTerm}
            onChange={(e) => data.setSearchTerm(e.target.value)}
            className="text-xs border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 bg-zinc-50 dark:bg-[#18181b] text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors w-full sm:w-64 font-medium"
          />
        </div>

        {/* Table Matrix Body Canvas */}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
          {filteredInvoices.length === 0 ? (
            <p className="p-8 text-center text-zinc-400 dark:text-zinc-500 text-[11px] font-medium font-mono uppercase tracking-wider">
              No transactional data matching parameters.
            </p>
          ) : (
            filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                onClick={() => setSelectedInvoiceForModal(inv)}
                className="flex items-center justify-between p-4 bg-white dark:bg-[#121212] hover:bg-zinc-50/50 dark:hover:bg-[#161618]/40 cursor-pointer transition-all group"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-50 group-hover:text-blue-500 transition-colors">
                      {inv.invoice_number}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${inv.status === "paid" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-zinc-400 dark:text-zinc-500 text-[11px] font-medium font-sans">
                    {inv.client_name} •{" "}
                    <span className="font-mono">
                      Due:{" "}
                      {inv.due_date
                        ? new Date(inv.due_date).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </p>
                </div>

                <div
                  className="flex items-center space-x-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="font-black text-zinc-900 dark:text-white text-xs font-sans pr-2">
                    {dollarFormat(
                      inv.amount_cents || inv.total_amount_cents || inv.amount,
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadPdf(inv.id, inv.invoice_number)
                    }
                    className="bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm"
                  >
                    PDF
                  </button>
                  {inv.status !== "paid" && (
                    <button
                      type="button"
                      onClick={() => handleSettleInternal(inv.id)}
                      className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm"
                    >
                      Settle
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* 🚀 HIGH-FIDELITY INTERACTIVE STATEMENT INVOICE MODAL POPUP */}
      {selectedInvoiceForModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div
            className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white dark:bg-[#121212] dark:border-zinc-800 shadow-2xl p-6 relative flex flex-col space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Control Header Panel */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase font-mono tracking-widest">
                  Inspection Viewport
                </span>
                <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase font-sans">
                  Statement Document Registry
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoiceForModal(null)}
                className="p-1 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 rounded-lg text-zinc-400 dark:text-zinc-500 text-xs font-bold px-2.5 transition-colors font-mono"
              >
                ESC
              </button>
            </div>

            {/* 📑 HIGH-FIDELITY DIGITAL INVOICE PREVIEW SURFACE */}
            <div className="p-6 rounded-xl border border-zinc-100 bg-zinc-50/50 dark:border-zinc-800/40 dark:bg-[#161618]/30 space-y-6 font-sans">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-lg font-black tracking-tight text-zinc-900 dark:text-white font-mono">
                    {selectedInvoiceForModal.invoice_number}
                  </span>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                    LedgerFlow Autonomous Billing Node
                  </p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${selectedInvoiceForModal.status === "paid" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}
                >
                  {selectedInvoiceForModal.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs border-t border-b border-zinc-100 dark:border-zinc-800/40 py-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase font-mono tracking-wider">
                    Target Client Entity
                  </label>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">
                    {selectedInvoiceForModal.client_name}
                  </p>
                  <p className="text-zinc-400 dark:text-zinc-500 text-[11px]">
                    Multi-tenant Sandbox Account
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase font-mono tracking-wider">
                    Maturity Date
                  </label>
                  <p className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {selectedInvoiceForModal.due_date
                      ? new Date(
                          selectedInvoiceForModal.due_date,
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Dynamic Line-Item Display Array Simulation */}
              <div className="space-y-2 text-xs">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase font-mono tracking-wider">
                  Line Item Summary Breakdown
                </label>
                <div className="p-3.5 rounded-lg border border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800/80 flex items-center justify-between font-medium">
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {selectedInvoiceForModal.description ||
                      "Operational Engineering Services / Technical Consulting Block"}
                  </span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-white">
                    {dollarFormat(
                      selectedInvoiceForModal.amount_cents ||
                        selectedInvoiceForModal.total_amount_cents ||
                        selectedInvoiceForModal.amount,
                    )}
                  </span>
                </div>
              </div>

              {/* Grand Total Footer Grid Panel */}
              <div className="flex justify-end pt-2">
                <div className="flex items-center space-x-4 border-t border-zinc-200 dark:border-zinc-800/60 pt-3 pr-2">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase font-mono tracking-wider">
                    Total Aggregate Valuation:
                  </span>
                  <span className="text-lg font-black font-sans text-zinc-900 dark:text-white">
                    {dollarFormat(
                      selectedInvoiceForModal.amount_cents ||
                        selectedInvoiceForModal.total_amount_cents ||
                        selectedInvoiceForModal.amount,
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* 🛠️ INTERACTIVE ROW ACTION CONTROL DECK */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-sans font-bold">
              <button
                type="button"
                onClick={() => handleCopyInvoiceLink(selectedInvoiceForModal)}
                className="bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 py-2.5 rounded-lg transition-colors text-zinc-800 dark:text-zinc-200"
              >
                🔗 Copy Link
              </button>

              <button
                type="button"
                onClick={() => handleEmailInvoiceCopy(selectedInvoiceForModal)}
                className="bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 py-2.5 rounded-lg transition-colors text-zinc-800 dark:text-zinc-200"
              >
                ✉️ Email Copy
              </button>

              <button
                type="button"
                onClick={() => {
                  handleDownloadPdf(
                    selectedInvoiceForModal.id,
                    selectedInvoiceForModal.invoice_number,
                  );
                }}
                className="bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 py-2.5 rounded-lg transition-colors text-zinc-800 dark:text-zinc-200"
              >
                📥 Get PDF
              </button>

              {selectedInvoiceForModal.status !== "paid" ? (
                <button
                  type="button"
                  onClick={() => {
                    handleSettleInternal(selectedInvoiceForModal.id);
                    setSelectedInvoiceForModal(null);
                  }}
                  className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 py-2.5 rounded-lg transition-colors"
                >
                  ✅ Settle Paid
                </button>
              ) : (
                <div className="bg-emerald-500/10 text-emerald-500 text-[10px] font-mono font-bold tracking-wider flex items-center justify-center rounded-lg uppercase border border-emerald-500/20">
                  🔒 SETTLED_ARCHIVE
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
