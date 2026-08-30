import React, { useState, useEffect } from "react";

function App() {
  // 1. SYSTEM DATA STATES
  const [metrics, setMetrics] = useState({
    total_outstanding_cents: 0,
    total_collected_cents: 0,
    total_clients_count: 0,
  });
  const [loading, setLoading] = useState(true);

  // 2. CLIENT MANAGEMENT STATES
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientMessage, setClientMessage] = useState({
    text: "",
    isError: false,
  });
  const [clientSubmitting, setClientSubmitting] = useState(false);

  // 3. NEW FEATURE STATES: INVOICE GENERATOR CONTROL
  const [selectedClientId, setSelectedClientId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [itemPrice, setItemPrice] = useState("");
  const [invoiceMessage, setInvoiceMessage] = useState({
    text: "",
    isError: false,
  });
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);

  // Core Analytics Fetcher
  const fetchMetrics = () => {
    fetch("/api/analytics/overview")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.data) setMetrics(payload.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  // Handler: Register New Client Account
  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!clientName || !clientEmail) {
      setClientMessage({ text: "Name and email are required.", isError: true });
      return;
    }
    setClientSubmitting(true);
    setClientMessage({ text: "", isError: false });

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clientName, email: clientEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error.");

      setClientMessage({
        text: `Success: ${data.client.name} saved!`,
        isError: false,
      });
      setClientName("");
      setClientEmail("");
      fetchMetrics();
    } catch (err) {
      setClientMessage({ text: err.message, isError: true });
    } finally {
      setClientSubmitting(false);
    }
  };

  // 4. NEW HANDLER: Submits Complete Multi-Table Invoice Transaction
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (
      !selectedClientId ||
      !invoiceNumber ||
      !dueDate ||
      !itemDescription ||
      !itemPrice
    ) {
      setInvoiceMessage({
        text: "All billing fields are required.",
        isError: true,
      });
      return;
    }
    setInvoiceSubmitting(true);
    setInvoiceMessage({ text: "", isError: false });

    // Package your line item fields cleanly into an items data array array list
    const itemsArray = [
      {
        description: itemDescription,
        quantity: parseInt(itemQuantity, 10) || 1,
        price: parseFloat(itemPrice) || 0,
      },
    ];

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: parseInt(selectedClientId, 10),
          invoice_number: invoiceNumber,
          due_date: dueDate,
          items: itemsArray,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transaction failed.");

      setInvoiceMessage({
        text: `Success: ${invoiceNumber} created safely inside transaction!`,
        isError: false,
      });
      setInvoiceNumber("");
      setDueDate("");
      setItemDescription("");
      setItemQuantity("1");
      setItemPrice("");
      fetchMetrics(); // Re-trigger live dashboard math instantly
    } catch (err) {
      setInvoiceMessage({ text: err.message, isError: true });
    } finally {
      setInvoiceSubmitting(false);
    }
  };

  const formatCurrency = (cents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 antialiased font-sans">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950 p-6 flex flex-col justify-between hidden md:flex">
        <div className="space-y-8">
          <div>
            <span className="text-xl font-black tracking-tight text-white">
              Ledger<span className="text-blue-500">Flow</span>
            </span>
            <p className="text-[10px] text-slate-600 font-mono mt-0.5">
              V4_CORE_ACTIVE
            </p>
          </div>
          <nav className="space-y-1">
            <a
              href="#dashboard"
              className="flex items-center space-x-3 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
            >
              <span>📊</span> <span>Dashboard</span>
            </a>
            <a
              href="#invoices"
              className="flex items-center space-x-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-900 hover:text-white transition-all"
            >
              <span>🧾</span> <span>Invoices</span>
            </a>
            <a
              href="#clients"
              className="flex items-center space-x-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-900 hover:text-white transition-all"
            >
              <span>👥</span> <span>Clients</span>
            </a>
          </nav>
        </div>
        <div className="border-t border-slate-900 pt-4 text-xs text-slate-400">
          <span>👨‍💻 Abhi (Admin)</span>
        </div>
      </aside>

      {/* WORKSPACE CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-slate-900 bg-slate-950 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Workspace Dashboard
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            SVR: 3000 // DB: 5433
          </span>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-8 max-w-5xl w-full mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Financial Control Summary
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Monitor active accounts receivable balances, liquid cash assets,
              and client profiles.
            </p>
          </div>

          {/* DYNAMIC METRIC CARDS */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <span>Accounts Receivable</span>
                <span className="text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded text-[9px]">
                  ⏳ Pending
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-bold font-mono text-white">
                {loading
                  ? "..."
                  : formatCurrency(metrics.total_outstanding_cents)}
              </h3>
              <div className="absolute top-0 right-0 h-[2px] w-0 bg-amber-500 group-hover:w-full transition-all duration-300"></div>
            </div>

            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <span>Revenue Collected</span>
                <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[9px]">
                  💰 Settled
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-bold font-mono text-emerald-400">
                {loading
                  ? "..."
                  : formatCurrency(metrics.total_collected_cents)}
              </h3>
              <div className="absolute top-0 right-0 h-[2px] w-0 bg-emerald-500 group-hover:w-full transition-all duration-300"></div>
            </div>

            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <span>Active Clients</span>
                <span className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-[9px]">
                  👥 Profiles
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-bold font-mono text-white">
                {loading ? "..." : metrics.total_clients_count}
              </h3>
              <div className="absolute top-0 right-0 h-[2px] w-0 bg-blue-500 group-hover:w-full transition-all duration-300"></div>
            </div>
          </div>
          {/* NEW INVOICE CREATOR SLAT PANEL */}
          <section className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                // Generate Invoice
              </h3>
              <p className="text-[11px] text-slate-500">
                Launch atomic transactions across multi-row asset logs.
              </p>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Target Client ID
                  </label>
                  <input
                    type="number"
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    placeholder="e.g. 12"
                    className="w-full border border-slate-900 rounded-xl px-3 py-2 bg-slate-900 text-white focus:outline-none focus:border-zinc-700 transition-all font-medium placeholder:text-slate-700"
                  />
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

              <div className="border-t border-slate-900 pt-3 space-y-2">
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  // Line Item Details
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="Item Description (e.g. Frontend Consultation)"
                    className="w-full border border-slate-900 rounded-xl px-3 py-2 bg-slate-900 text-white focus:outline-none focus:border-zinc-700 transition-all font-medium placeholder:text-slate-700"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(e.target.value)}
                      placeholder="Qty"
                      className="w-full border border-slate-900 rounded-xl px-3 py-2 bg-slate-900 text-white focus:outline-none focus:border-zinc-700 transition-all font-medium placeholder:text-slate-700"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      placeholder="Price ($)"
                      className="w-full border border-slate-900 rounded-xl px-3 py-2 bg-slate-900 text-white focus:outline-none focus:border-zinc-700 transition-all font-medium placeholder:text-slate-700"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={invoiceSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl transition-all shadow-md shadow-blue-600/5 font-semibold disabled:opacity-50"
              >
                {invoiceSubmitting ? "Processing..." : "Generate Invoice"}
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
        </main>
      </div>
    </div>
  );
}

export default App;
