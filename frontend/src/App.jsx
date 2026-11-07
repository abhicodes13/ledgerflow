import React, { useState, useRef, useEffect } from "react";
import { useLedgerFlowData } from "./hooks/useLedgerFlowData";
import { MetricCards } from "./components/MetricCards";
import { CashflowChart } from "./components/CashflowChart";
import { ClientForm } from "./components/ClientForm";
import { InvoiceForm } from "./components/InvoiceForm";
import { AIConsole } from "./components/AIConsole";

function App() {
  const data = useLedgerFlowData();

  // 💻 LOCAL WORKSPACE VIEW STATE CONTROLLER (EXPANDED TO 5 PRODUCTION DOMAINS)
  const [activeTab, setActiveTab] = useState("dashboard"); // Options: "dashboard", "billing", "customers", "automations", "settings"

  // 🌓 LOCAL TRUE CASCADING THEME STATE CONTROLLER (LIGHT/DARK AGNOSTIC)
  const [isDarkMode, setIsDarkMode] = useState(true);

  // 🤖 LOCAL CHAT SUB-SYSTEM STATES
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      type: "action_deck",
      sender: "ai",
      text: "Hello! I am your LedgerFlow Autonomous Financial Assistant. Ask me to add clients, create invoice templates, or analyze business statistics hands-free.",
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // Auto-scroll chat panel to bottom on incoming packets
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);
  // Asynchronous Blob PDF Secure Downloader Implementation
  const handleDownloadPdf = async (invoiceId, invoiceNumber) => {
    try {
      const res = await fetch(
        `${data.API_BASE}/api/invoices/${invoiceId}/pdf`,
        {
          headers: { Authorization: `Bearer ${data.token}` },
        },
      );
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

  // Auth Submit Bridge Interceptor
  const handleAuthSubmitInternal = async (e) => {
    e.preventDefault();
    if (!data.authUsername || !data.authPassword) {
      data.setAuthMessage({
        text: "Credentials fields cannot be left blank.",
        isError: true,
      });
      return;
    }
    data.setAuthMessage({ text: "", isError: false });
    const endpointPath = data.isRegistering
      ? `${data.API_BASE}/api/auth/register`
      : `${data.API_BASE}/api/auth/login`;

    try {
      const res = await fetch(endpointPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.authUsername,
          password: data.authPassword,
        }),
      });
      const resData = await res.json();
      if (!res.ok)
        throw new Error(
          resData.error || "Authentication gate rejected request.",
        );

      if (data.isRegistering) {
        data.setAuthMessage({
          text: "Account profile created successfully! Switching to login view...",
          isError: false,
        });
        data.setAuthUsername("");
        data.setAuthPassword("");
        data.setIsRegistering(false);
      } else {
        localStorage.setItem("lf_token", resData.token);
        localStorage.setItem("lf_user", JSON.stringify(resData.user));
        data.setToken(resData.token);
        data.setCurrentUser(resData.user);
        data.setAuthUsername("");
        data.setAuthPassword("");
      }
    } catch (err) {
      data.setAuthMessage({ text: err.message, isError: true });
    }
  };

  // Standard Form Handlers
  const handleClientSubmitInternal = async (e) => {
    e.preventDefault();
    if (!data.clientName || !data.clientEmail) return;
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
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      data.setClientMessage({
        text: `Success: ${data.clientName} saved!`,
        isError: false,
      });
      data.setClientName("");
      data.setClientEmail("");
      data.fetchMetrics();
      data.fetchClientsList();
    } catch (err) {
      data.setClientMessage({ text: err.message, isError: true });
    }
  };
  const handleInvoiceSubmitInternal = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${data.API_BASE}/api/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.token}`,
        },
        body: JSON.stringify({
          client_id: parseInt(data.selectedClientId, 10),
          invoice_number: data.invoiceNumber,
          due_date: data.dueDate,
          items: data.items.map((i) => ({
            description: i.description,
            quantity: parseInt(i.quantity, 10),
            price: parseFloat(i.price),
          })),
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      data.setInvoiceMessage({
        text: `Success: Invoice Generated!`,
        isError: false,
      });
      data.setSelectedClientId("");
      data.setInvoiceNumber("");
      data.setDueDate("");
      data.setItems([{ description: "", quantity: 1, price: "" }]);
      data.fetchMetrics();
      data.fetchInvoicesList();
    } catch (err) {
      data.setInvoiceMessage({ text: err.message, isError: true });
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

  // 🤖 CONVERSATIONAL AI PIPELINE ROUTERS
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

      if (!res.ok) throw new Error(resData.error || "AI engine timeout.");

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
        { type: "text", sender: "ai", text: `⚠️ Error: ${err.message}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // 🔓 THE FINAL ATOMIC APPROVAL HANDSHAKE EXECUTIONER
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

      if (!res.ok) throw new Error(resData.error);

      setChatMessages((prev) =>
        prev.map((msg, idx) =>
          idx === msgIndex
            ? {
                type: "text",
                sender: "ai",
                text: `✅ Action Confirmed: ${resData.message}`,
              }
            : msg,
        ),
      );

      data.fetchMetrics();
      data.fetchClientsList();
      data.fetchInvoicesList();
    } catch (err) {
      alert(`Execution Failed: ${err.message}`);
    }
  };

  const filteredInvoices =
    data.invoicesList?.filter(
      (inv) =>
        inv.invoice_number
          .toLowerCase()
          .includes(data.searchTerm.toLowerCase()) ||
        inv.client_name.toLowerCase().includes(data.searchTerm.toLowerCase()),
    ) || [];
  // Unauthenticated Gatekeeper Screen Overlay View (Apple Studio Adaptive Frame)
  if (!data.token) {
    return (
      <div
        className={`${isDarkMode ? "dark bg-[#09090b]" : "bg-[#f5f5f7]"} flex min-h-screen text-zinc-800 dark:text-zinc-100 antialiased font-sans tracking-tight items-center justify-center p-6 transition-colors duration-200`}
      >
        <div className="w-full max-w-sm rounded-2xl border bg-white dark:bg-[#1c1c1e] border-zinc-100 dark:border-zinc-800/50 p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-base font-black tracking-tight text-zinc-900 dark:text-white">
                Ledger<span className="text-blue-500">Flow</span>
              </span>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-600 font-mono uppercase tracking-widest">
                Studio.v5
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 border border-zinc-100 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 text-xs"
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
          </div>

          <div className="space-y-0.5">
            <h2 className="text-xs font-black uppercase tracking-tight text-zinc-900 dark:text-white">
              {data.isRegistering
                ? "Create Platform Profile"
                : "Identity Authorization Key"}
            </h2>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              {data.isRegistering
                ? "Provision private multi-tenant ledger accounts"
                : "Access sandboxed business statements"}
            </p>
          </div>

          <form
            onSubmit={handleAuthSubmitInternal}
            className="space-y-4 text-xs"
          >
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                Profile Username
              </label>
              <input
                type="text"
                value={data.authUsername}
                onChange={(e) => data.setAuthUsername(e.target.value)}
                placeholder="e.g. abhi_operator"
                className="w-full rounded-xl px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-800 dark:text-white placeholder-zinc-400 border border-transparent focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                Account Password
              </label>
              <input
                type="password"
                value={data.authPassword}
                onChange={(e) => data.setAuthPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-800 dark:text-white placeholder-zinc-400 border border-transparent focus:outline-none"
              />
            </div>

            {data.authMessage.text && (
              <p
                className={`text-[11px] font-medium p-2.5 rounded-xl border ${data.authMessage.isError ? "bg-red-500/5 border-red-500/10 text-red-400" : "bg-emerald-500/5 border-emerald-500/10 text-emerald-400"}`}
              >
                {data.authMessage.text}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm"
            >
              {data.isRegistering
                ? "Run Account Script"
                : "Initialize Console Dashboard"}
            </button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => data.setIsRegistering(!data.isRegistering)}
              className="text-[11px] text-zinc-400 dark:text-zinc-500 hover:underline"
            >
              {data.isRegistering
                ? "Back to Login Panel"
                : "Need an account? Register profile"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Production Dashboard Screen View (Laid-Back Cupertino Edition)
  return (
    <div
      className={`${isDarkMode ? "dark bg-[#09090b] text-zinc-100" : "bg-[#f5f5f7] text-zinc-800"} flex flex-col h-screen font-sans tracking-tight antialiased transition-colors duration-200 overflow-hidden`}
    >
      {/* 💻 PLATFORM HEADER BAR A: FLOATING HORIZONTAL ACTION NAVBAR (Top Pinned) */}
      <header className="w-full h-14 flex items-center justify-between px-6 bg-white/80 dark:bg-[#1c1c1e]/60 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800/50 z-20 shadow-sm">
        {/* Logo and Core Identity Group */}
        <div className="flex items-center space-x-8">
          <div className="space-y-0.5">
            <span className="text-base font-black text-zinc-900 dark:text-white tracking-tight">
              Ledger<span className="text-blue-500">Flow</span>
            </span>
          </div>

          {/* ⚡ THE 5-TAB HORIZONTAL EXTENDED ROUTING MATRIX */}
          <nav className="flex items-center space-x-1">
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
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-100
                  ${
                    activeTab === tab.id
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm"
                      : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Global Control Group Settings */}
        <div className="flex items-center space-x-4 text-xs">
          {/* Light/Dark Toggle Matrix Card */}
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 text-slate-500 dark:text-zinc-400 hover:text-blue-500 transition-colors shadow-sm"
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>

          {/* User Logged-In Profile Indicator Badge */}
          <div className="flex items-center space-x-2 border-l border-zinc-200 dark:border-zinc-800 pl-4">
            <div className="w-5 h-5 rounded-full bg-blue-600/10 flex items-center justify-center font-mono font-bold text-blue-500 text-[10px]">
              {data.currentUser?.username?.slice(0, 2).toUpperCase()}
            </div>
            <span className="font-medium text-zinc-500 dark:text-zinc-400 hidden sm:inline">
              {data.currentUser?.username}
            </span>
            <button
              type="button"
              onClick={data.handleLogout}
              className="text-[10px] border border-zinc-200 dark:border-zinc-800 hover:border-red-500/20 text-zinc-400 hover:text-red-400 px-2 py-0.5 rounded transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* LOWER SPLIT WRAPPER HOOD CONTAINER */}
      <div className="flex flex-1 w-full overflow-hidden h-[calc(100vh-3.5rem)]">
        {/* 🛠️ PANEL B: THE PRIMARY WORKSPACE CANVAS CONTAINER (70% Width) */}
        <div className="w-[70%] h-full flex flex-col p-6 overflow-y-auto space-y-6">
          {/* Active Router Tab Views */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-fadeIn">
              <MetricCards metrics={data.metrics} />
              <CashflowChart data={data.metrics?.chartData} />
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-6 animate-fadeIn">
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

              {/* Cupertino Statement Ledger Stream View */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-zinc-100 dark:border-zinc-800/50 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-50 dark:border-zinc-800/30 pb-2">
                  <h3 className="text-xs font-bold tracking-tight text-zinc-900 dark:text-white uppercase font-sans">
                    Invoices Ledger History
                  </h3>
                  <input
                    type="text"
                    placeholder="Search parameters..."
                    value={data.searchTerm}
                    onChange={(e) => data.setSearchTerm(e.target.value)}
                    className="text-xs border border-zinc-100 dark:border-zinc-800 rounded-lg px-2.5 py-1 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none"
                  />
                </div>

                <div className="space-y-2 text-xs">
                  {filteredInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-zinc-50 dark:border-zinc-800/10 bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100/40 dark:hover:bg-zinc-900/50 transition-all font-sans"
                    >
                      <div className="space-y-0.5">
                        <p className="font-mono font-bold text-zinc-900 dark:text-white">
                          {inv.invoice_number}
                        </p>
                        <p className="text-zinc-400 dark:text-zinc-500 text-[11px] font-medium">
                          {inv.client_name} • Due:{" "}
                          {inv.due_date
                            ? new Date(inv.due_date).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <p className="font-bold text-zinc-900 dark:text-white">
                          ${(inv.amount_cents / 100).toFixed(2)}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${inv.status === "paid" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}
                        >
                          {inv.status}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadPdf(inv.id, inv.invoice_number)
                          }
                          className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-lg font-bold transition-all shadow-sm"
                        >
                          PDF
                        </button>
                        {inv.status !== "paid" && (
                          <button
                            type="button"
                            onClick={() => handleSettleInternal(inv.id)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg font-bold transition-all shadow-sm"
                          >
                            Settle
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "customers" && (
            <div className="space-y-6 animate-fadeIn">
              <ClientForm
                clientName={data.clientName}
                setClientName={data.setClientName}
                clientEmail={data.clientEmail}
                setClientEmail={data.setClientEmail}
                clientMessage={data.clientMessage}
                handleClientSubmit={handleClientSubmitInternal}
              />

              {/* Client Lookup Directory */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-zinc-100 dark:border-zinc-800/50 space-y-3 shadow-sm">
                <h3 className="text-xs font-bold tracking-tight text-zinc-900 dark:text-white uppercase font-sans border-b border-zinc-50 dark:border-zinc-800/30 pb-2">
                  Registered Accounts Directory
                </h3>
                <div className="space-y-1.5 text-xs overflow-y-auto max-h-[320px]">
                  {data.clientsList.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800/40 transition-colors"
                    >
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white">
                          {client.name}
                        </p>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono font-medium">
                          {client.email}
                        </p>
                      </div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 font-mono">
                        ID: #{client.id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* 🤖 NEW EXTENDED DOMAIN TAB 4: AUTOMATIONS SETTINGS */}
          {activeTab === "automations" && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-zinc-100 dark:border-zinc-800/50 space-y-5 shadow-sm animate-fadeIn">
              <div className="space-y-0.5">
                <h3 className="text-xs font-black tracking-tight text-zinc-900 dark:text-white uppercase font-sans">
                  Autonomous AI Collection Parameters
                </h3>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  Tune outreach tone filters for background ledger recovery
                  pipelines
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-2">
                {[
                  "Polite & Friendly",
                  "Firm & Professional",
                  "Enterprise Strict",
                ].map((tone, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`p-4 rounded-xl border text-center font-bold text-xs transition-colors ${i === 1 ? "border-blue-500 bg-blue-500/5 text-blue-500" : "border-zinc-100 dark:border-zinc-800/60 text-zinc-400"}`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed pt-2">
                *When enabled, your background microservices run autonomously at
                midnight, scanning past-due entries to execute targeted
                Nodemailer recovery streams with no human intervention.
              </p>
            </div>
          )}

          {/* ⚙️ NEW EXTENDED DOMAIN TAB 5: PLATFORM SETTINGS */}
          {activeTab === "settings" && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-zinc-100 dark:border-zinc-800/50 space-y-5 shadow-sm animate-fadeIn">
              <div className="space-y-0.5">
                <h3 className="text-xs font-black tracking-tight text-zinc-900 dark:text-white uppercase font-sans">
                  Company Core Infrastructure Configuration
                </h3>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  Manage payment distributions channels and user workspace
                  branding models
                </p>
              </div>
              <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">
                    Stripe Connect Bank Onboarding Link
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                    Link multi-tenant business accounts to process real-world
                    customer credit card checkouts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      "Redirecting safely to sandbox Stripe Connect gateway...",
                    )
                  }
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-sm"
                >
                  Connect Account
                </button>
              </div>
            </div>
          )}
        </div>
        <AIConsole
          chatInput={chatInput}
          setChatInput={setChatInput}
          chatMessages={chatMessages} // Passes down your automatic card seed arrays
          setChatMessages={setChatMessages}
          chatLoading={chatLoading}
          chatBottomRef={chatBottomRef}
          handleSendChatMessage={handleSendChatMessage}
          handleApproveAIAction={handleApproveAIAction}
          setActiveTab={setActiveTab} // Enables your shortcut macro keys to switch pages
        />
        {/* 🤖 PANEL C: PREMIUM CONVERSATIONAL AGENT CONSOLE TERMINAL (30% Width) 
        <div className="w-[30%] h-full flex flex-col bg-white/40 dark:bg-zinc-950/10 border-l border-zinc-100 dark:border-zinc-900/60 shadow-inner">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/50 bg-white/80 dark:bg-[#1c1c1e]/60 flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.4)]"></div>
            <h2 className="text-xs font-black tracking-tight text-zinc-900 dark:text-white uppercase font-sans">
              LedgerFlow AI Core
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col space-y-0.5 ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <span className="text-[9px] text-zinc-400 dark:text-zinc-600 font-mono tracking-wider uppercase font-bold">
                  {msg.sender === "user" ? "You" : "LedgerFlow AI"}
                </span>

                {msg.type === "text" && (
                  <div
                    className={`p-3 max-w-[85%] rounded-2xl border leading-relaxed shadow-sm font-medium ${msg.sender === "user" ? "bg-blue-600 border-blue-500 text-white rounded-br-none" : "bg-white dark:bg-[#1c1c1e] border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-bl-none"}`}
                  >
                    {msg.text}
                  </div>
                )}

                {msg.type === "approval_box" && (
                  <div className="p-4 w-full rounded-2xl border border-blue-200 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-950/5 text-zinc-700 dark:text-zinc-300 space-y-3 shadow-sm rounded-bl-none font-medium">
                    <p className="leading-relaxed">{msg.text}</p>
                    <div className="flex items-center space-x-2 pt-1 font-sans">
                      <button
                        type="button"
                        onClick={() =>
                          handleApproveAIAction(index, msg.action, msg.data)
                        }
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold py-1.5 rounded-xl transition-all shadow-sm"
                      >
                        Confirm Approval
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setChatMessages((prev) =>
                            prev.map((m, idx) =>
                              idx === index
                                ? {
                                    type: "text",
                                    sender: "ai",
                                    text: "❌ Action canceled by operator.",
                                  }
                                : m,
                            ),
                          )
                        }
                        className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {chatLoading && (
              <div className="flex flex-col space-y-0.5 items-start">
                <span className="text-[9px] text-zinc-400 dark:text-zinc-600 font-mono font-bold uppercase tracking-wider">
                  LedgerFlow AI
                </span>
                <div className="p-3 bg-white dark:bg-[#1c1c1e] border border-zinc-100 dark:border-zinc-800 rounded-2xl rounded-bl-none text-zinc-400 dark:text-zinc-500 font-medium text-[11px] flex items-center space-x-1 shadow-sm">
                  <span
                    className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></span>
                  <span
                    className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></span>
                  <span
                    className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></span>
                  <span className="pl-1">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef}></div>
          </div>

          <form
            onSubmit={handleSendChatMessage}
            className="p-4 border-t border-zinc-100 dark:border-zinc-900/60 bg-white/80 dark:bg-[#1c1c1e]/60 flex items-center space-x-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={chatLoading}
              placeholder={
                chatLoading
                  ? "Analyzing transaction matrices..."
                  : "Ask your financial assistant anything..."
              }
              className="flex-1 text-xs border border-zinc-100 dark:border-zinc-900 rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-zinc-900/50 text-zinc-800 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-blue-600 disabled:opacity-50 font-medium"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-100 dark:disabled:bg-zinc-900 text-white disabled:text-zinc-400 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm"
            >
              Send
            </button>
          </form>
        </div> */}
      </div>
    </div>
  );
}

export default App;
