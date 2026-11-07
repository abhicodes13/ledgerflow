import React, { useState, useRef, useEffect } from "react";
import { useLedgerFlowData } from "./hooks/useLedgerFlowData";
import { AIConsole } from "./components/AIConsole";
import { DashboardView } from "./pages/DashboardView";
import { InvoicesView } from "./pages/InvoicesView";
import { ClientsView } from "./pages/ClientsView";

function App() {
  const data = useLedgerFlowData();

  // 🧭 PAGE ROUTING & VIEWPORT PANEL VISIBILITY STATES
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isConsoleVisible, setIsConsoleVisible] = useState(true); // Open on desktop by default
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // 🔐 ORIGINAL STATE INFRASTRUCTURE FOR USER AUTHENTICATION
  const [isRegistering, setIsRegistering] = useState(false);
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authMessage, setAuthMessage] = useState({ text: "", isError: false });

  // 💬 CHAT HUB CONTROL DECK HANDLERS & STATUS HOOKS
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  const [chatMessages, setChatMessages] = useState([
    {
      type: "action_deck",
      sender: "ai",
      text: "Welcome to your LedgerFlow assistant. Click an active macro card below or input a standard text prompt to execute actions hands-free:",
    },
  ]);
  // 🔐 SECURE STANDARD SAAS AUTHENTICATION AGGREGATOR LOOP
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
      const res = await fetch(`${data.API_BASE}${endpointPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: authUsername,
          password: authPassword,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(
          resData.error || "Security authentication gate rejected request.",
        );
      }

      if (isRegistering) {
        setAuthMessage({
          text: "Account profile created successfully! Switching to login view...",
          isError: false,
        });
        setAuthUsername("");
        setAuthPassword("");
        setIsRegistering(false);
      } else {
        localStorage.setItem("lf_token", resData.token);
        localStorage.setItem("lf_user", JSON.stringify(resData.user));
        data.setToken(resData.token);
        data.setCurrentUser(resData.user);
        setAuthUsername("");
        setAuthPassword("");
      }
    } catch (err) {
      setAuthMessage({ text: err.message, isError: true });
    } finally {
      setAuthSubmitting(false);
    }
  };

  // 🚪 WORKSPACE CLEARANCE STATE DISMANTLER
  const handleLogout = () => {
    localStorage.removeItem("lf_token");
    localStorage.removeItem("lf_user");
    data.setToken("");
    data.setCurrentUser(null);
    data.setMetrics({
      total_outstanding_cents: 0,
      total_collected_cents: 0,
      total_clients_count: 0,
    });
    data.setClientsList([]);
    data.setInvoicesList([]);
    data.setSearchTerm("");
  };
  // 📊 MANUAL FORM BILLING STATEMENT DISPATCH LOOP
  // 📊 FIXED: SCHEMA-ALIGNED MANUAL FORM BILLING STATEMENT DISPATCH LOOP
  const handleInvoiceSubmitInternal = async (e) => {
    e.preventDefault();

    // Defensive check to ensure data.items is an array block
    const formLines = Array.isArray(data.items) ? data.items : [];

    if (
      !data.selectedClientId ||
      !data.invoiceNumber ||
      !data.dueDate ||
      formLines.length === 0
    ) {
      alert(
        "⚠️ Form validation error: All core billing parameters must be fully populated.",
      );
      return;
    }

    try {
      const res = await fetch(`${data.API_BASE}/api/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.token}`,
        },
        body: JSON.stringify({
          // Force numbers to be explicit integers matching your Postgres constraints
          client_id: parseInt(data.selectedClientId, 10),
          invoice_number: data.invoiceNumber.trim(),
          due_date: data.dueDate,
          // 🎯 FIXED: Map the frontend price dollars string directly into unit_amount_cents column
          items: formLines.map((i) => ({
            description: i.description || "Operational Consulting Services",
            quantity: parseInt(i.quantity, 10) || 1,
            unit_amount_cents: Math.round(parseFloat(i.price) * 100) || 0,
          })),
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(
          resData.error || "Database validation rejection exception.",
        );
      }

      // Clear local entry state parameters smoothly upon a successful postgres row insert
      data.setInvoiceNumber("");
      data.setDueDate("");
      data.setItems([{ description: "", quantity: 1, price: "" }]);

      data.fetchMetrics();
      data.fetchInvoicesList();
      alert(
        "✅ Invoice statement and itemized rows successfully committed to Postgres!",
      );
    } catch (err) {
      console.error("❌ Manual Form Invoice Submit Failure:", err.message);
      alert(`⚠️ Billing Rejection: ${err.message}`);
    }
  };

  // 👥 MANUAL FORM CUSTOMER RECORD SUBMIT HANDLER
  const handleClientSubmitInternal = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${data.API_BASE}/api/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.token}`,
        },
        body: JSON.stringify({
          name: data.clientName,
          email: data.clientEmail,
        }),
      });
      if (!res.ok) throw new Error("Entity insert failure.");
      data.fetchMetrics();
      data.fetchClientsList();
    } catch (err) {
      console.error("❌ Manual Form Client Submit Failure:", err.message);
    }
  };

  const handleSettleInternal = async (id) => {
    await fetch(`${data.API_BASE}/api/invoices/${id}/settle`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${data.token}` },
    });
    data.fetchMetrics();
    data.fetchInvoicesList();
  };
  // 💬 CHAT TIMELINE CORE DISPATCH ENGINES
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userText = chatInput;
    setChatMessages((prev) => [
      ...prev,
      { type: "text", sender: "user", text: userText },
    ]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch(`${data.API_BASE}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.token}`,
        },
        body: JSON.stringify({ message: userText }),
      });
      const resData = await res.json();
      if (resData.type === "approval_required") {
        setChatMessages((prev) => [
          ...prev,
          {
            type: "approval_box",
            sender: "ai",
            text: resData.message,
            action: resData.action,
            data: resData.data,
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { type: "text", sender: "ai", text: resData.message },
        ]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          type: "text",
          sender: "ai",
          text: `Error connecting to core AI route.`,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // 🛡️ HUMAN-IN-THE-LOOP SECURE TRANSACTION APPROVAL DISPATCHER
  const handleApproveAIAction = async (msgIndex, action, payload) => {
    try {
      const res = await fetch(`${data.API_BASE}/api/chat/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.token}`,
        },
        body: JSON.stringify({ action, data: payload }),
      });
      const resData = await res.json();
      setChatMessages((prev) =>
        prev.map((msg, idx) =>
          idx === msgIndex
            ? {
                type: "text",
                sender: "ai",
                text: `Action Confirmed: ${resData.message}`,
              }
            : msg,
        ),
      );
      data.fetchMetrics();
      data.fetchInvoicesList();
    } catch (err) {
      alert(`❌ Transaction execution bottleneck: ${err.message}`);
    }
  };

  const filteredInvoices =
    data.invoicesList?.filter(
      (inv) =>
        inv.invoice_number
          ?.toLowerCase()
          .includes(data.searchTerm.toLowerCase()) ||
        inv.client_name?.toLowerCase().includes(data.searchTerm.toLowerCase()),
    ) || [];
  // 🔐 STAGE E: STANDARD SAAS SIGN-IN / SIGN-UP SCREEN OVERLAY
  if (!data.token) {
    return (
      <div className="bg-[#0e0e11] text-zinc-100 flex min-h-screen items-center justify-center p-4 antialiased font-sans">
        <div className="w-full max-w-md rounded-2xl bg-[#141419] border border-zinc-800/80 p-8 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all animate-fadeIn">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest text-blue-500 uppercase font-bold">
              SECURE_WORKSPACE_GATEWAY
            </span>
            <h2 className="text-xl font-black uppercase text-white tracking-tight">
              Ledger//<span className="text-blue-500">Flow</span>
            </h2>
            <p className="text-zinc-500 text-[11px] font-medium font-sans">
              {isRegistering
                ? "Create your new business merchant account profile"
                : "Sign in to access your accounting ledgers"}
            </p>
          </div>

          <form
            onSubmit={handleAuthSubmit}
            className="space-y-4 text-xs font-medium"
          >
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-zinc-400 uppercase font-mono tracking-wider">
                Account Username ID
              </label>
              <input
                type="text"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                placeholder="operator_id"
                className="w-full rounded-xl px-4 py-3 bg-[#0e0e11] text-white border border-zinc-800 focus:border-blue-500 outline-none transition-colors font-medium animate-fadeIn"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-zinc-400 uppercase font-mono tracking-wider">
                Security Access Password
              </label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 bg-[#0e0e11] text-white border border-zinc-800 focus:border-blue-500 outline-none transition-colors font-mono"
                required
              />
            </div>

            {authMessage.text && (
              <p
                className={`font-mono text-[10px] uppercase font-bold tracking-wide border p-3 rounded-xl animate-fadeIn
                ${authMessage.isError ? "border-red-500/20 bg-red-500/5 text-red-400" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"}`}
              >
                {authMessage.isError ? "❌ ERROR: " : "✅ SUCCESS: "}
                {authMessage.text}
              </p>
            )}

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-[0_4px_20px_rgba(37,99,235,0.25)] uppercase tracking-wider text-[11px] font-mono"
            >
              {authSubmitting
                ? "Processing..."
                : isRegistering
                  ? "Register Account"
                  : "Sign In to System"}
            </button>
          </form>

          {/* Form State Toggle Interface */}
          <div className="text-center pt-2 border-t border-zinc-800/60">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setAuthMessage({ text: "", isError: false });
              }}
              className="text-[10px] font-mono text-zinc-500 hover:text-blue-400 font-bold uppercase transition-colors"
            >
              {isRegistering
                ? "[ Already have an account? Sign In ]"
                : "[ Need a workspace? Create Account ]"}
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-[#0e0e11] text-zinc-100 flex flex-col h-screen font-sans tracking-tight antialiased overflow-hidden select-none">
      {/* 🧭 CHROMATIC FLOATING RESPONSIVE HEADER BAR */}
      <header className="w-full h-16 flex items-center justify-between px-4 sm:px-6 bg-[#141419]/90 border-b border-b-zinc-800/60 z-30 shadow-xl backdrop-blur-md">
        <div className="flex items-center space-x-6 sm:space-x-8">
          <span className="text-xs font-black text-white tracking-tight uppercase font-mono border border-zinc-800 px-2.5 py-1.5 rounded-lg bg-[#0e0e11]">
            L//<span className="text-blue-500">F</span>
          </span>

          {/* 💻 DESKTOP HORIZONTAL CONTROL PATHS */}
          <nav className="hidden md:flex items-center space-x-1">
            {[
              { id: "dashboard", label: "Overview" },
              { id: "billing", label: "Invoices" },
              { id: "customers", label: "Clients" },
              { id: "automations", label: "Automations" },
              { id: "settings", label: "Settings" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 font-sans
                  ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)]"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 📱 MINI-TAB SCROLL STRIP FOR MOBILE CONSOLES */}
        <div className="flex md:hidden items-center space-x-1 bg-[#1c1c24] p-1 rounded-xl border border-zinc-800 overflow-x-auto max-w-[140px] sm:max-w-xs scrollbar-none">
          {[
            { id: "dashboard", l: "Ovw" },
            { id: "billing", l: "Inv" },
            { id: "customers", l: "Cli" },
            { id: "automations", l: "Auto" },
            { id: "settings", l: "Set" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors shrink-0
                ${activeTab === t.id ? "bg-blue-600 text-white" : "text-zinc-500"}`}
            >
              {t.l}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <button
            type="button"
            onClick={() => {
              setIsConsoleVisible(!isConsoleVisible);
              setIsMobileChatOpen(!isMobileChatOpen);
            }}
            className="p-2 border border-zinc-800 rounded-xl bg-[#1c1c24] text-blue-500 font-bold text-[10px] uppercase font-mono"
          >
            {isConsoleVisible || isMobileChatOpen
              ? "Hide AI Terminal"
              : "Show AI Terminal"}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="text-[10px] border border-zinc-800 text-zinc-500 hover:text-red-400 font-mono font-bold px-2.5 py-1.5 rounded-lg bg-[#1c1c24] transition-colors"
          >
            LOGOUT
          </button>
        </div>
      </header>

      {/* LOWER DOUBLE CHANNEL VIEWPORT CANVAS */}
      <div className="flex flex-1 w-full overflow-hidden relative h-[calc(100vh-4rem)]">
        {/* RESPONSIVE PRIMARY VIEWPORT DISPLAY PORT */}
        <div
          className={`h-full flex flex-col p-4 sm:p-6 overflow-y-auto space-y-6 z-10 transition-all duration-300
          ${isConsoleVisible ? "w-full md:w-[70%]" : "w-full"}`}
        >
          {activeTab === "dashboard" && (
            <DashboardView
              metrics={data.metrics}
              invoicesList={data.invoicesList}
            />
          )}
          {activeTab === "billing" && (
            <InvoicesView
              data={data}
              filteredInvoices={filteredInvoices}
              handleInvoiceSubmitInternal={handleInvoiceSubmitInternal}
              handleSettleInternal={handleSettleInternal}
            />
          )}
          {activeTab === "customers" && (
            <ClientsView
              data={data}
              handleClientSubmitInternal={handleClientSubmitInternal}
            />
          )}

          {/* AUTOMATIONS SUB-VIEW BLOCKS */}
          {activeTab === "automations" && (
            <div className="p-6 rounded-2xl bg-[#141419] border border-zinc-800/80 space-y-4 shadow-xl animate-fadeIn">
              <h3 className="text-xs font-black tracking-tight text-white uppercase font-sans">
                Autonomous AI Tone Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {[
                  "Friendly Reminder",
                  "Firm / Corporate",
                  "Strict Collections",
                ].map((tone, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border text-center font-bold text-xs ${i === 1 ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-zinc-800 text-zinc-500"}`}
                  >
                    {tone}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS SUB-VIEW BLOCKS */}
          {activeTab === "settings" && (
            <div className="p-6 rounded-2xl bg-[#141419] border border-zinc-800/80 space-y-4 shadow-xl animate-fadeIn">
              <h3 className="text-xs font-black tracking-tight text-white uppercase font-sans">
                Infrastructure Core
              </h3>
              <div className="p-4 rounded-xl border border-zinc-800/60 bg-[#1c1c24] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">
                    Stripe Checkout Integration Gateway
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Route payments safely into multi-tenant accounts
                  </p>
                </div>
                <button
                  type="button"
                  className="bg-blue-600 text-white font-mono font-bold text-[10px] uppercase px-4 py-2 rounded-xl"
                >
                  Connect Stripe
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DYNAMIC COLLAPSIBLE CONSOLE DRAWER FRAME */}
        {/* 🟢 FIXED: DYNAMIC CHROMATIC RESPONSIVE CONSOLE DRAWER FRAME */}
        {/* 📱 🚀 UNBREAKABLE TOUCH-SAFE RESPONSIVE CONSOLE DRAWER FRAME */}
        <div
          className={`
          /* On mobile, it acts as an absolute layer over the view. On Mac, it snaps back inside the desktop flex row. */
          fixed md:relative top-0 bottom-0 right-0 z-50 w-[280px] sm:w-[320px] md:w-[30%] h-full bg-[#141419] transition-transform duration-300 ease-out transform
          /* 🎯 FORCE LAYOUT DEPTH: If isConsoleVisible is false on desktop, hide it completely. On mobile, look entirely at isMobileChatOpen. */
          ${isMobileChatOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}
          ${!isConsoleVisible ? "md:hidden" : ""}
          border-l border-zinc-800/80 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] md:shadow-none
        `}
        >
          <AIConsole
            chatInput={chatInput}
            setChatInput={setChatInput}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
            chatLoading={chatLoading}
            chatBottomRef={chatBottomRef}
            handleSendChatMessage={handleSendChatMessage}
            handleApproveAIAction={handleApproveAIAction}
            setActiveTab={setActiveTab}
            isMobileChatOpen={isMobileChatOpen}
            setIsMobileChatOpen={setIsMobileChatOpen}
            isConsoleVisible={isConsoleVisible}
            setIsConsoleVisible={setIsConsoleVisible}
          />
        </div>

        {/* 🌫️ MOBILE BACKDROP BLUR SHIELD: Closes the drawer if you tap outside the AI box */}
        {isMobileChatOpen && (
          <div
            onClick={() => setIsMobileChatOpen(false)}
            className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          />
        )}
      </div>
    </div>
  );
}

export default App;
