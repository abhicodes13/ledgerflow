import React from "react";

export function InvoiceForm({
  selectedClientId,
  setSelectedClientId,
  invoiceNumber,
  setInvoiceNumber,
  dueDate,
  setDueDate,
  clientsList,
  invoiceSubmitting,
  invoiceMessage,
  items,
  setItems,
  onSubmit,
}) {
  const handleAddItemRow = () =>
    setItems([...items, { description: "", quantity: 1, price: "" }]);
  const handleRemoveItemRow = (index) =>
    items.length > 1 && setItems(items.filter((_, idx) => idx !== index));
  const handleItemFieldChange = (index, field, value) => {
    setItems(
      items.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  return (
    <section className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          // Generate Invoice
        </h3>
        <p className="text-[11px] text-slate-500">
          Launch atomic transactions across multi-row asset logs.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Target Buyer
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full border border-slate-900 rounded-xl px-3 py-2 bg-slate-900 text-white focus:outline-none focus:border-zinc-700 transition-all font-medium"
            >
              <option value="">-- Choose Client --</option>
              {clientsList.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} (ID: {client.id})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Invoice Number
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-004"
              className="w-full border border-slate-900 rounded-xl px-3 py-2 bg-slate-900 text-white focus:outline-none focus:border-zinc-700 transition-all font-medium placeholder:text-slate-700"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border border-slate-900 rounded-xl px-3 py-2 bg-slate-900 text-white focus:outline-none focus:border-zinc-700 transition-all font-medium"
          />
        </div>

        <div className="border-t border-slate-900 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                // Line Item Details
              </div>
              <div className="text-[10px] font-mono text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-md inline-block border border-blue-500/20">
                {items.length}{" "}
                {items.length === 1 ? "Item Row Active" : "Item Rows Active"}
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddItemRow}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] transition-all border border-blue-500/20 shadow-md shadow-blue-600/10"
            >
              [+] Add Item Line
            </button>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1.5">
            {items.map((item, index) => (
              <div
                key={index}
                className="p-3.5 rounded-xl border border-slate-900 bg-slate-950/60 space-y-2 relative group/row"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                    ROW #{index + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(index)}
                      className="text-slate-500 hover:text-red-400 text-[10px] font-bold transition-all"
                    >
                      ✕ Remove Row
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) =>
                    handleItemFieldChange(index, "description", e.target.value)
                  }
                  placeholder="Item Description"
                  className="w-full border border-slate-900 rounded-xl px-3 py-2 bg-slate-900 text-white focus:outline-none focus:border-zinc-700 transition-all font-medium placeholder:text-slate-700"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemFieldChange(index, "quantity", e.target.value)
                    }
                    placeholder="Qty"
                    className="w-full border border-slate-900 rounded-xl px-3 py-2 bg-slate-900 text-white focus:outline-none focus:border-zinc-700 transition-all font-medium placeholder:text-slate-700"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={item.price}
                    onChange={(e) =>
                      handleItemFieldChange(index, "price", e.target.value)
                    }
                    placeholder="Price ($)"
                    className="w-full border border-slate-900 rounded-xl px-3 py-2 bg-slate-900 text-white focus:outline-none focus:border-zinc-700 transition-all font-medium placeholder:text-slate-700"
                  />
                </div>
              </div>
            ))}
          </div>
          {items.length > 2 && (
            <div className="text-center text-[9px] font-mono text-slate-600 tracking-wide animate-pulse pt-1">
              ↓ Scroll down to view all dynamic billing items ↓
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={invoiceSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl transition-all shadow-md shadow-blue-600/5 font-semibold disabled:opacity-50"
        >
          {invoiceSubmitting
            ? "Processing Transaction..."
            : "Generate Multi-Item Invoice"}
        </button>
      </form>
      {invoiceMessage.text && (
        <div
          className={`p-2.5 rounded-xl border text-[11px] font-mono ${invoiceMessage.isError ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}
        >
          {invoiceMessage.text}
        </div>
      )}
    </section>
  );
}
