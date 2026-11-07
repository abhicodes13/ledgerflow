import React, { useState } from "react";

export function InvoicesView({
  data,
  filteredInvoices,
  handleInvoiceSubmitInternal,
  handleSettleInternal,
}) {
  // 🌓 LOCAL VIEWPORT MODAL OVERLAY STATE
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState(null);

  const dollarFormat = (cents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format((cents || 0) / 100);
  };

  const handleCopyInvoiceLink = (inv) => {
    const mockLink = `${window.location.origin}/checkout/statement/${inv.invoice_number}`;
    navigator.clipboard.writeText(mockLink);
    alert(`🔑 Secure checkout link copied to clipboard:\n${mockLink}`);
  };

  const handleEmailInvoiceCopy = (inv) => {
    alert(
      `✉️ Dispatching secure automated invoice copy notification payload to: ${inv.client_name}`,
    );
  };

  // 🛠️ MULTI-ITEM ARRAY PROFILE DYNAMICS MANAGERS
  const handleAddLineItem = () => {
    const currentItems = Array.isArray(data.items) ? data.items : [];
    data.setItems([
      ...currentItems,
      { description: "", quantity: 1, price: "" },
    ]);
  };

  const handleRemoveLineItem = (indexToRemove) => {
    if (data.items.length <= 1) return; // Keep at least one operational row active
    data.setItems(data.items.filter((_, idx) => idx !== indexToRemove));
  };

  const handleItemFieldChange = (index, field, value) => {
    const updatedItems = data.items.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    data.setItems(updatedItems);
  };

  // Safe baseline check to ensure data.items is always iterable on frame boot up
  const activeFormItems = Array.isArray(data.items)
    ? data.items
    : [{ description: "", quantity: 1, price: "" }];

  return (
    <div className="space-y-8 animate-fadeIn font-sans tracking-tight text-zinc-100 w-full pb-12">
      {/* IDENTITY TRAILING TRACK HEADER */}
      <div className="space-y-0.5 pb-4 border-b border-zinc-900 w-full">
        <span className="text-[9px] font-mono tracking-widest text-blue-500 font-bold uppercase">
          Billing_Ledger_Node
        </span>
        <h2 className="text-sm font-black text-white uppercase tracking-tight">
          Financial Invoicing
        </h2>
      </div>

      {/* 🧭 TRACK A: UNIFORM HORIZONTAL STATEMENT COMPOSER INPUT BAND (MULTI-ITEM CAPABLE) */}
      <form
        onSubmit={handleInvoiceSubmitInternal}
        className="w-full bg-[#111114] border border-zinc-900 rounded-xl p-5 space-y-5 shadow-md text-xs font-medium"
      >
        {/* Core Metadata Row (Lightened fields using sophisticated bg-[#1c1c24]) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-400 uppercase font-mono tracking-wider">
              Account Target Partner
            </label>
            <select
              value={data.selectedClientId}
              onChange={(e) => data.setSelectedClientId(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 bg-[#1c1c24] text-white border border-zinc-800/80 focus:border-blue-500 outline-none font-medium appearance-none"
            >
              <option value="">-- Select Client Profile --</option>
              {data.clientsList?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-400 uppercase font-mono tracking-wider">
              Serial Number tracking
            </label>
            <input
              type="text"
              value={data.invoiceNumber || ""}
              onChange={(e) => data.setInvoiceNumber(e.target.value)}
              placeholder="INV-0001"
              className="w-full rounded-xl px-3 py-2.5 bg-[#1c1c24] text-white border border-zinc-800/80 focus:border-blue-500 outline-none font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-400 uppercase font-mono tracking-wider">
              Maturity due Date
            </label>
            <input
              type="date"
              value={data.dueDate || ""}
              onChange={(e) => data.setDueDate(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 bg-[#1c1c24] text-white border border-zinc-800/80 focus:border-blue-500 outline-none font-mono text-zinc-400"
            />
          </div>
        </div>

        {/* Dynamic Relational Multi-Item Line Rows Deck */}
        <div className="space-y-3 pt-3 border-t border-zinc-900/60 w-full">
          <div className="flex items-center justify-between px-0.5 mb-1">
            <span className="text-[9px] font-mono tracking-widest text-zinc-500 font-bold uppercase">
              Itemized_Transaction_Line_Allocations
            </span>
            <button
              type="button"
              onClick={handleAddLineItem}
              className="text-[9px] font-mono font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase"
            >
              [+ Add Item Row]
            </button>
          </div>

          {activeFormItems.map((item, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-2 items-center w-full animate-fadeIn"
            >
              <div className="col-span-6 sm:col-span-7">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) =>
                    handleItemFieldChange(idx, "description", e.target.value)
                  }
                  placeholder="Item / service description allocation..."
                  className="w-full rounded-lg px-3 py-2 bg-[#1c1c24] text-white border border-zinc-800/80 focus:border-blue-500 outline-none font-sans"
                  required
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemFieldChange(idx, "quantity", e.target.value)
                  }
                  placeholder="Qty"
                  min="1"
                  className="w-full rounded-lg px-3 py-2 bg-[#1c1c24] text-white border border-zinc-800/80 focus:border-blue-500 outline-none text-center font-mono"
                  required
                />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) =>
                    handleItemFieldChange(idx, "price", e.target.value)
                  }
                  placeholder="Rate ($)"
                  className="w-full rounded-lg px-3 py-2 bg-[#1c1c24] text-white border border-zinc-800/80 focus:border-blue-500 outline-none font-mono"
                  required
                />
              </div>
              <div className="col-span-1 text-center">
                <button
                  type="button"
                  onClick={() => handleRemoveLineItem(idx)}
                  disabled={activeFormItems.length <= 1}
                  className="text-zinc-600 hover:text-red-400 disabled:opacity-20 font-bold font-mono transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-zinc-900/60 w-full">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-lg transition-all shadow-md font-mono uppercase text-[10px] tracking-wider"
          >
            Commit Multi-Item Statement
          </button>
        </div>
      </form>
      {/* 🧭 TRACK B: THE HIGH-DENSITY LINEAR HISTORICAL DATA BAND REGISTRY */}
      <div className="w-full space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-black tracking-wider text-white uppercase font-mono">
              Statement Log Registry
            </h3>
            <p className="text-[11px] text-zinc-500 font-medium">
              Historical audit records for active multi-tenant client channels
            </p>
          </div>
          <input
            type="text"
            placeholder="Search entries..."
            value={data.searchTerm || ""}
            onChange={(e) => data.setSearchTerm(e.target.value)}
            className="text-xs border border-zinc-800 rounded-lg px-3 py-1.5 bg-[#111114] text-white placeholder-zinc-700 outline-none focus:border-zinc-600 w-full sm:w-48 font-medium"
          />
        </div>

        <div className="divide-y divide-zinc-900/40 border-b border-zinc-900 w-full">
          {filteredInvoices.length === 0 ? (
            <p className="p-8 text-center text-zinc-600 font-mono text-[10px] uppercase font-bold tracking-widest">
              No transaction records matching matrix coordinates.
            </p>
          ) : (
            filteredInvoices.map((inv) => {
              const totalAmt =
                inv.amount_cents || inv.total_amount_cents || inv.amount;

              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoiceForModal(inv)}
                  className="py-4 flex items-center justify-between cursor-pointer hover:bg-zinc-900/10 group select-none transition-colors w-full"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono font-bold text-xs text-white group-hover:text-blue-400 transition-colors">
                        {inv.invoice_number}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${inv.status === "paid" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-zinc-500 text-[11px] font-sans">
                      {inv.client_name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 font-mono text-xs">
                    <span className="font-bold text-white font-sans">
                      {dollarFormat(totalAmt)}
                    </span>
                    <span className="text-zinc-700 text-[10px] uppercase tracking-wider font-bold">
                      INSPECT→
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 🚀 HIGH-FIDELITY BACKDROP BLURRED INSPECTION MODAL SYSTEM */}
      {selectedInvoiceForModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div
            className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-[#141419] shadow-2xl p-6 relative flex flex-col space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-blue-500 uppercase font-mono tracking-widest">
                  Inspection_Viewport
                </span>
                <h2 className="text-xs font-black text-white uppercase font-sans">
                  Statement Registry Profile
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoiceForModal(null)}
                className="p-1.5 border border-zinc-800 hover:border-zinc-700 bg-[#0e0e11] rounded-xl text-zinc-500 text-[10px] font-bold px-3 font-mono transition-colors"
              >
                ESC
              </button>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-800/80 bg-[#0e0e11]/50 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-md font-black tracking-tight text-white font-mono">
                    {selectedInvoiceForModal.invoice_number}
                  </span>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    LedgerFlow Production Vault Node
                  </p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${selectedInvoiceForModal.status === "paid" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}
                >
                  {selectedInvoiceForModal.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs border-t border-b border-zinc-800/60 py-4 font-medium">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-600 uppercase font-mono tracking-wider">
                    Target Account partner label
                  </label>
                  <p className="font-bold text-zinc-200">
                    {selectedInvoiceForModal.client_name}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <label className="text-[9px] font-bold text-zinc-600 uppercase font-mono tracking-wider">
                    Due Timeline maturity Date
                  </label>
                  <p className="font-mono font-bold text-blue-400">
                    {selectedInvoiceForModal.due_date
                      ? new Date(
                          selectedInvoiceForModal.due_date,
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <label className="text-[9px] font-bold text-zinc-600 uppercase font-mono tracking-wider">
                  Line Items Specification Summary
                </label>
                <div className="p-3.5 rounded-xl border border-zinc-800/60 bg-[#141419] flex items-center justify-between font-medium">
                  <span className="text-zinc-400">
                    {selectedInvoiceForModal.description ||
                      "Technical Consultation / Structural Full-Stack Software Engineering Services"}
                  </span>
                  <span className="font-mono font-bold text-white">
                    {dollarFormat(
                      selectedInvoiceForModal.amount_cents ||
                        selectedInvoiceForModal.total_amount_cents ||
                        selectedInvoiceForModal.amount,
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <div className="flex items-center space-x-4 border-t border-zinc-800/60 pt-3 pr-1">
                  <span className="text-[9px] font-bold text-zinc-600 uppercase font-mono tracking-wider">
                    Aggregate Valuation Balance:
                  </span>
                  <span className="text-md font-black text-white font-mono">
                    {dollarFormat(
                      selectedInvoiceForModal.amount_cents ||
                        selectedInvoiceForModal.total_amount_cents ||
                        selectedInvoiceForModal.amount,
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px] font-mono font-bold">
              <button
                type="button"
                onClick={() => handleCopyInvoiceLink(selectedInvoiceForModal)}
                className="bg-[#1c1c24] hover:bg-[#22222c] border border-zinc-800 py-2.5 rounded-xl text-zinc-300 transition-colors"
              >
                🔗 LINK
              </button>
              <button
                type="button"
                onClick={() => handleEmailInvoiceCopy(selectedInvoiceForModal)}
                className="bg-[#1c1c24] hover:bg-[#22222c] border border-zinc-800 py-2.5 rounded-xl text-zinc-300 transition-colors"
              >
                ✉️ EMAIL
              </button>
              <button
                type="button"
                onClick={() =>
                  alert(
                    "Background statement binary compile triggered successfully...",
                  )
                }
                className="bg-[#1c1c24] hover:bg-[#22222c] border border-zinc-800 py-2.5 rounded-xl text-zinc-300 transition-colors"
              >
                📥 GET_PDF
              </button>
              {selectedInvoiceForModal.status !== "paid" ? (
                <button
                  type="button"
                  onClick={() => {
                    handleSettleInternal(selectedInvoiceForModal.id);
                    setSelectedInvoiceForModal(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl shadow-md transition-all"
                >
                  ✅ SETTLE
                </button>
              ) : (
                <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wider flex items-center justify-center rounded-xl uppercase">
                  🔒 SETTLED
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
