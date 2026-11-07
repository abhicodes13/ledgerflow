import React from "react";

export function InvoiceForm({
  clientsList,
  selectedClientId,
  setSelectedClientId,
  invoiceNumber,
  setInvoiceNumber,
  dueDate,
  setDueDate,
  items,
  setItems,
  invoiceMessage,
  handleInvoiceSubmit,
}) {
  const handleUpdateItemField = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  return (
    <div className="p-5 rounded-xl border bg-white border-zinc-200/80 dark:bg-[#121212] dark:border-zinc-800/60 space-y-4 tracking-tight font-sans shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors">
      <div className="space-y-0.5">
        <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase">
          Compose Invoice
        </h3>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
          Generate multi-line checkout statements
        </p>
      </div>

      <form onSubmit={handleInvoiceSubmit} className="space-y-3.5 text-xs">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">
            Target Customer
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full rounded-lg px-3 py-2 bg-zinc-50 dark:bg-[#18181b] text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 focus:outline-none transition-colors"
          >
            <option
              value=""
              className="text-zinc-800 dark:text-zinc-100 bg-white dark:bg-[#121212]"
            >
              Select target account...
            </option>
            {clientsList?.map((c) => (
              <option
                key={c.id}
                value={c.id}
                className="text-zinc-800 dark:text-zinc-100 bg-white dark:bg-[#121212]"
              >
                {c.name} ({c.email})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">
              Statement ID
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="INV-0012"
              className="w-full rounded-lg px-3 py-2 bg-zinc-50 dark:bg-[#18181b] text-zinc-800 dark:text-white border border-zinc-200 dark:border-zinc-800 focus:outline-none transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">
              Maturity Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-zinc-50 dark:bg-[#18181b] text-zinc-400 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/40">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">
            Line Items Breakdown
          </label>
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <input
                type="text"
                value={item.description}
                onChange={(e) =>
                  handleUpdateItemField(idx, "description", e.target.value)
                }
                placeholder="Item Description"
                className="col-span-6 rounded-lg px-3 py-1.5 bg-zinc-50 dark:bg-[#18181b] text-zinc-800 dark:text-white border border-zinc-200 dark:border-zinc-800 focus:outline-none transition-colors"
              />
              <input
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  handleUpdateItemField(idx, "quantity", e.target.value)
                }
                placeholder="1"
                className="col-span-2 rounded-lg px-3 py-1.5 bg-zinc-50 dark:bg-[#18181b] text-zinc-800 dark:text-white border border-zinc-200 dark:border-zinc-800 focus:outline-none text-center transition-colors"
              />
              <input
                type="number"
                step="0.01"
                value={item.price}
                onChange={(e) =>
                  handleUpdateItemField(idx, "price", e.target.value)
                }
                placeholder="0.00"
                className="col-span-4 rounded-lg px-3 py-1.5 bg-zinc-50 dark:bg-[#18181b] text-zinc-800 dark:text-white border border-zinc-200 dark:border-zinc-800 focus:outline-none text-right transition-colors"
              />
            </div>
          ))}
        </div>

        {invoiceMessage?.text && (
          <div
            className={`p-2.5 rounded-lg border font-medium text-[11px] ${invoiceMessage.isError ? "bg-red-500/5 border-red-500/10 text-red-400" : "bg-emerald-500/5 border-emerald-500/10 text-emerald-400"}`}
          >
            {invoiceMessage.text}
          </div>
        )}

        <button
          type="submit"
          disabled={!selectedClientId || !invoiceNumber.trim() || !dueDate}
          className="w-full py-2 rounded-lg font-bold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 disabled:bg-zinc-50 dark:disabled:bg-zinc-900/40 disabled:text-zinc-400 transition-colors shadow-sm text-xs"
        >
          Broadcast Statement
        </button>
      </form>
    </div>
  );
}
