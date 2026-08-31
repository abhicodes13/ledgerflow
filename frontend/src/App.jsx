import React, { useState, useEffect } from "react";

function App() {
  // =========================================================================
  // 1. SECURITY & SESSION MEMORY STATES
  // =========================================================================
  const [token, setToken] = useState(localStorage.getItem("lf_token") || "");
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("lf_user")) || null,
  );
  const [isRegistering, setIsRegistering] = useState(false);

  // Auth Form Input States
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState({ text: "", isError: false });
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // =========================================================================
  // 2. SYSTEM DATA TELEMETRY STATES
  // =========================================================================
  const [metrics, setMetrics] = useState({
    total_outstanding_cents: 0,
    total_collected_cents: 0,
    total_clients_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [clientsList, setClientsList] = useState([]);
  const [invoicesList, setInvoicesList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Core Data Forms Input States
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientMessage, setClientMessage] = useState({
    text: "",
    isError: false,
  });
  const [clientSubmitting, setClientSubmitting] = useState(false);

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

  // =========================================================================
  // 3. BACKGROUND SECURED FETCHERS (STAGE 3 HEADERS LOADED ⚡)
  // =========================================================================
  const fetchMetrics = () => {
    if (!token) return;
    fetch("/api/analytics/overview", {
      headers: { Authorization: `Bearer ${token}` }, // ◄── Pass security gate!
    })
      .then((res) => res.json())
      .then((payload) => {
        if (payload.data) setMetrics(payload.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchClientsList = () => {
    if (!token) return;
    fetch("/api/clients", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((payload) => {
        if (payload.clients) setClientsList(payload.clients);
      })
      .catch((err) => console.error("❌ Dropdown lookup breakdown:", err));
  };

  const fetchInvoicesList = () => {
    if (!token) return;
    fetch("/api/invoices", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((payload) => {
        if (payload.invoices) setInvoicesList(payload.invoices);
      })
      .catch((err) => console.error("❌ Ledger grid lookup breakdown:", err));
  };

  useEffect(() => {
    if (token) {
      fetchMetrics();
      fetchClientsList();
      fetchInvoicesList();
    }
  }, [token]);

  // =========================================================================
  // 4. SECURITY & AUTH ACTION EVENT HANDLERS
  // =========================================================================
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authUsername || !authPassword) {
      setAuthMessage({
        text: "Credentials fields cannot be left blank.",
        isError: true,
      });
      return;
    }
    setAuthSubmitting(true);
    setAuthMessage({ text: "", isError: false });

    const endpointPath = isRegistering
      ? "/api/auth/register"
      : "/api/auth/login";

    try {
      const res = await fetch(endpointPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: authUsername,
          password: authPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error || "Security authentication gate rejected request.",
        );

      if (isRegistering) {
        setAuthMessage({
          text: "Account profile created successfully! Switching to login view...",
          isError: false,
        });
        setAuthUsername("");
        setAuthPassword("");
        setIsRegistering(false);
      } else {
        localStorage.setItem("lf_token", data.token);
        localStorage.setItem("lf_user", JSON.stringify(data.user));
        setToken(data.token);
        setCurrentUser(data.user);
        setAuthUsername("");
        setAuthPassword("");
      }
    } catch (err) {
      setAuthMessage({ text: err.message, isError: true });
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("lf_token");
    localStorage.removeItem("lf_user");
    setToken("");
    setCurrentUser(null);
    setMetrics({
      total_outstanding_cents: 0,
      total_collected_cents: 0,
      total_clients_count: 0,
    });
    setClientsList([]);
    setInvoicesList([]);
    setSearchTerm("");
  };

  // =========================================================================
  // 5. CORE WORKSPACE DATA FORM HANDLERS (STAGE 3 AUTH-HEADERS LOADED ⚡)
  // =========================================================================
  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!clientName || !clientEmail) {
      setClientMessage({
        text: "Name and email are required fields.",
        isError: true,
      });
      return;
    }
    setClientSubmitting(true);
    setClientMessage({ text: "", isError: false });

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ◄── Pass Stage 3 verification fences!
        },
        body: JSON.stringify({ name: clientName, email: clientEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server rejected insertion.");

      setClientMessage({
        text: `Success: ${clientName} saved!`,
        isError: false,
      });
      setClientName("");
      setClientEmail("");
      fetchMetrics();
      fetchClientsList();
    } catch (err) {
      setClientMessage({ text: err.message, isError: true });
    } finally {
      setClientSubmitting(false);
    }
  };

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
        text: "All fields are required to process billing.",
        isError: true,
      });
      return;
    }
    setInvoiceSubmitting(true);
    setInvoiceMessage({ text: "", isError: false });

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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ◄── Pass Stage 3 verification fences!
        },
        body: JSON.stringify({
          client_id: parseInt(selectedClientId, 10),
          invoice_number: invoiceNumber,
          due_date: dueDate,
          items: itemsArray,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transaction rejected.");

      setInvoiceMessage({
        text: `Success: ${invoiceNumber} generated!`,
        isError: false,
      });
      setSelectedClientId("");
      setInvoiceNumber("");
      setDueDate("");
      setItemDescription("");
      setItemQuantity("1");
      setItemPrice("");
      fetchMetrics();
      fetchInvoicesList();
    } catch (err) {
      setInvoiceMessage({ text: err.message, isError: true });
    } finally {
      setInvoiceSubmitting(false);
    }
  };

  const handleSettleInvoice = async (targetId) => {
    try {
      const res = await fetch(`/api/invoices/${targetId}/settle`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ◄── Pass Stage 3 verification fences!
        },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error || "Challenge response verification failed.",
        );

      fetchMetrics();
      fetchInvoicesList();
    } catch (err) {
      console.error("❌ Settlement connection drop:", err.message);
    }
  };

  const formatCurrency = (cents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const filteredInvoices = invoicesList.filter((inv) => {
    return (
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.client_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleDownloadPdf = async (invoiceId, invoiceNumber) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`, // ◄── Passes security verification!
        },
      });
      if (!res.ok) throw new Error("Failed to download PDF stream.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `STATEMENT-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ PDF Download Error:", err.message);
    }
  };

  // =========================================================================
  // 6. DYNAMIC UI PRESENTATION RENDERING LAYER
  // =========================================================================
  if (!token) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-slate-100 antialiased font-sans items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-slate-900 bg-slate-950 p-8 space-y-6 shadow-xl shadow-black/40">
          <div className="text-center space-y-1">
            <span className="text-2xl font-black tracking-tight text-white">
              Ledger<span className="text-blue-500">Flow</span>
            </span>
            <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
              SaaS_Gateway_V4
            </p>
          </div>
          <div className="space-y-1 text-center">
            <h2 className="text-base font-bold text-white tracking-tight">
              {isRegistering
                ? "Create Administrative Account"
                : "Authenticate Session Login"}
            </h2>
            <p className="text-xs text-slate-500">
              {isRegistering
                ? "Provision private multi-tenant asset rows."
                : "Access sandboxed cashflow summaries."}
            </p>
          </div>
          <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Account Username
              </label>
              <input
                type="text"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                placeholder="e.g. AbhiAdmin"
                className="w-full border border-slate-900 rounded-xl px-3 py-2 bg-slate-900 text-white focus:outline-none focus:border-zinc-700 transition-all font-medium placeholder:text-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Secure Password
              </label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full border border-slate-900 rounded-xl px-3 py-2 bg-slate-900 text-white focus:outline-none focus:border-zinc-700 transition-all font-medium placeholder:text-slate-700"
              />
            </div>
            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl transition-all shadow-md shadow-blue-600/10 font-semibold disabled:opacity-50"
            >
              {authSubmitting
                ? "Authenticating Encryption..."
                : isRegistering
                  ? "Sign Up Profile"
                  : "Sign In Session"}
            </button>
          </form>
          {authMessage.text && (
            <div
              className={`p-2.5 rounded-xl border text-[11px] font-mono text-center ${authMessage.isError ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}
            >
              {authMessage.text}
            </div>
          )}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setAuthMessage({ text: "", isError: false });
              }}
              className="text-xs font-semibold text-slate-500 hover:text-white transition-all underline decoration-slate-800 underline-offset-4"
            >
              {isRegistering
                ? "Already registered? Log in here"
                : "Don't have an account? Sign up here"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 antialiased font-sans">
      <aside className="w-64 border-r border-slate-900 bg-slate-950 p-6 flex flex-col justify-between hidden md:flex">
        <div className="space-y-8">
          <div>
            <span className="text-xl font-black tracking-tight text-white">
              Ledger<span className="text-blue-500">Flow</span>
            </span>
            <p className="text-[10px] text-slate-600 font-mono mt-0.5">
              V4_SaaS_SECURE
            </p>
          </div>
          <nav className="space-y-1">
            <a
              href="#dashboard"
              className="flex items-center space-x-3 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
            >
              <span>📊</span> <span>Dashboard</span>
            </a>
          </nav>
        </div>
        <div className="border-t border-slate-900 pt-4 flex flex-col space-y-3">
          <div className="text-xs text-slate-400 font-medium">
            <span>👤 Active Account: {currentUser?.username}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-slate-900 hover:bg-red-950 border border-slate-800 hover:border-red-900/40 text-slate-400 hover:text-red-400 text-[11px] font-bold py-1.5 rounded-lg transition-all"
          >
            Disconnect Session
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-slate-900 bg-slate-950 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Sandboxed Tenant Workspace
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            AUTH: JWT_ACTIVE // ID: {currentUser?.id}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-8 max-w-5xl w-full mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Isolated Accounts Summary
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Monitor active accounts receivable balances, liquid cash assets,
              and client profiles unique to your session.
            </p>
          </div>

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

          <div className="grid gap-6 md:grid-cols-2">
            {/* CLIENT REGISTER PANEL */}
            <section className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  // Register Client
                </h3>
                <p className="text-[11px] text-slate-500">
                  Inject buyer rows directly to your database roledex.
                </p>
              </div>
              <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Wally West"
                    className="w-full border border-slate-900 rounded-xl px-3 py-2 bg-slate-900 text-white focus:outline-none focus:border-zinc-700 transition-all font-medium placeholder:text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="e.g. wally@west.com"
                    className="w-full border border-slate-900 rounded-xl px-3 py-2 bg-slate-900 text-white focus:outline-none focus:border-zinc-700 transition-all font-medium placeholder:text-slate-700"
                  />
                </div>
                <button
                  type="submit"
                  disabled={clientSubmitting}
                  className="w-full bg-zinc-100 hover:bg-zinc-200 text-[#09090b] font-bold py-2 rounded-xl transition-all shadow-sm font-semibold disabled:opacity-50"
                >
                  {clientSubmitting ? "Saving..." : "Save Profile"}
                </button>
              </form>
              {clientMessage.text && (
                <div
                  className={`p-2.5 rounded-xl border text-[11px] font-mono ${clientMessage.isError ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}
                >
                  {clientMessage.text}
                </div>
              )}
            </section>

            {/* INVOICE GENERATOR PANEL */}
            <section className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  // Generate Invoice
                </h3>
                <p className="text-[11px] text-slate-500">
                  Launch atomic transactions across multi-row asset logs.
                </p>
              </div>
              <form
                onSubmit={handleCreateInvoice}
                className="space-y-3 text-xs"
              >
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
          </div>

          <section className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  // Real-Time Transaction Ledger
                </h3>
                <p className="text-[11px] text-slate-500">
                  Live operational data rows compiled directly via inner
                  relational database SQL joints.
                </p>
              </div>
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="🔍 Search Invoice # or Client Name..."
                  className="w-full border border-slate-900 rounded-xl px-3 py-1.5 bg-slate-900 text-white text-xs focus:outline-none focus:border-zinc-700 transition-all font-medium placeholder:text-slate-600"
                />
              </div>
            </div>
            <div className="overflow-x-auto border border-slate-900 rounded-xl bg-slate-950">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-900/30 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Invoice #</th>
                    <th className="p-4">Client Name</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 font-medium">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="p-8 text-center text-slate-600 font-mono"
                      >
                        No matching transactional records located.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-slate-900/20 transition-all"
                      >
                        <td className="p-4 font-mono font-bold text-white">
                          {inv.invoice_number}
                        </td>
                        <td className="p-4 text-slate-300">
                          {inv.client_name}
                        </td>
                        <td className="p-4 text-slate-400">
                          {new Date(inv.due_date).toLocaleDateString()}
                        </td>
                        <td className="p-4 font-mono font-bold text-white">
                          {formatCurrency(inv.total_amount_cents)}
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${inv.status === "paid" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-4 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              handleDownloadPdf(inv.id, inv.invoice_number)
                            }
                            className="bg-slate-950 border border-slate-800 text-slate-300 font-semibold px-2.5 py-1 rounded-lg text-[11px] hover:bg-slate-800 hover:text-white transition-all shadow-sm"
                          >
                            PDF
                          </button>
                          {inv.status === "pending" && (
                            <button
                              onClick={() => handleSettleInvoice(inv.id)}
                              className="bg-white hover:bg-zinc-200 text-[#09090b] font-bold px-2.5 py-1 rounded-lg text-[11px] transition-all shadow-sm"
                            >
                              Settle
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5 font-mono text-[11px] text-slate-400 space-y-2">
            <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
              // PIPELINE ACTIVITY TELEMETRY
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1.5">
              <span className="text-slate-500">PostgreSQL Database:</span>
              <span className="text-emerald-400">CONNECTED // PORT 5433</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Express Routing API:</span>
              <span className="text-emerald-400">ONLINE // PORT 3000</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
