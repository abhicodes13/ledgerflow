import React from "react";
import { useLedgerFlowData } from "./hooks/useLedgerFlowData";
import { MetricCards } from "./components/MetricCards";
import { CashflowChart } from "./components/CashflowChart";
import { ClientForm } from "./components/ClientForm";
import { InvoiceForm } from "./components/InvoiceForm";

function App() {
  // ⚡ LINK CUSTOM DATA STREAM HOOK ENGINE
  const data = useLedgerFlowData();

  // Asynchronous Blob PDF Secure Downloader Implementation
  const handleDownloadPdf = async (invoiceId, invoiceNumber) => {
    try {
      const res = await fetch(
        `http://54.242.227.226:3000/api/invoices/${invoiceId}/pdf`,
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
      ? "http://54.242.227.226:3000/api/auth/register"
      : "http://54.242.227.226:3000/api/auth/login";

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

  // Form Submission Interceptor Bridges
  const handleClientSubmitInternal = async (e) => {
    e.preventDefault();
    if (!data.clientName || !data.clientEmail) return;
    try {
      const res = await fetch("http://54.242.227.226:3000/api/clients", {
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
      const res = await fetch("http://54.242.227.226:3000/api/invoices", {
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
    await fetch(`http://54.242.227.226:3000/api/invoices/${id}/settle`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${data.token}` },
    });
    data.fetchMetrics();
    data.fetchInvoicesList();
  };

  const filteredInvoices = data.invoicesList.filter(
    (inv) =>
      inv.invoice_number
        .toLowerCase()
        .includes(data.searchTerm.toLowerCase()) ||
      inv.client_name.toLowerCase().includes(data.searchTerm.toLowerCase()),
  );
  // Unauthenticated Gatekeeper Screen Overlay View
  if (!data.token) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-slate-100 antialiased font-sans items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-slate-900 bg-slate-950 p-8 space-y-6 shadow-xl shadow-black/40">
          {/* Brand Header Section */}
          <div className="text-center space-y-1">
            <span className="text-2xl font-black tracking-tight text-white">
              Ledger<span className="text-blue-500">Flow</span>
            </span>
            <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
              SaaS_Modular_V4
            </p>
          </div>

          {/* Dynamic View Descriptions */}
          <div className="space-y-1 text-center">
            <h2 className="text-base font-bold text-white tracking-tight">
              {data.isRegistering
                ? "Create Administrative Account"
                : "Authenticate Session Login"}
            </h2>
            <p className="text-xs text-slate-500">
              {data.isRegistering
                ? "Provision private multi-tenant asset rows."
                : "Access sandboxed cashflow summaries."}
            </p>
          </div>

          {/* Standard Form Actions Gateway */}
          <form
            onSubmit={handleAuthSubmitInternal}
            className="space-y-4 text-xs"
          >
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">
                Account Username
              </label>
              <input
                type="text"
                value={data.authUsername}
                onChange={(e) => data.setAuthUsername(e.target.value)}
                placeholder="e.g. AbhiAdmin"
                className="w-full border border-slate-900 rounded-xl px-3 py-2 bg-slate-900 text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">
                Secure Password
              </label>
              <input
                type="password"
                value={data.authPassword}
                onChange={(e) => data.setAuthPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full border border-slate-900 rounded-xl px-3 py-2 bg-slate-900 text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl transition-all shadow-md"
            >
              {data.isRegistering ? "Sign Up Profile" : "Sign In Session"}
            </button>
          </form>

          {/* 🚀 THE ENTERPRISE RECRUITER GATEWAY: Injected seamlessly right under the form */}
          {!data.isRegistering && (
            <button
              type="button"
              onClick={async () => {
                // 1. Automatically update your local UI hook states
                data.setAuthUsername("demo_account");
                data.setAuthPassword("demopass123");

                // 2. Fire the token transaction directly to your live AWS EC2 server [2.1]
                try {
                  data.setAuthMessage({
                    text: "Authenticating sandboxed session...",
                    isError: false,
                  });

                  const res = await fetch(
                    "http://54.242.227.226:3000/api/auth/login",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        username: "demo_account",
                        password: "demopass123",
                      }),
                    },
                  );

                  const resData = await res.json();

                  if (resData.success) {
                    data.setToken(resData.token); // Locks token in memory and logs them in! [2.1]
                  } else {
                    data.setAuthMessage({
                      text: resData.error || "Authentication failed",
                      isError: true,
                    });
                  }
                } catch (err) {
                  console.error("Demo login request error tracker:", err);
                  data.setAuthMessage({
                    text: "Network connection refused by cloud gateway",
                    isError: true,
                  });
                }
              }}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2 rounded-xl transition-all shadow-md text-xs tracking-wide shadow-black/20"
            >
              ⚡ One-Click Recruiter Demo Login
            </button>
          )}

          {/* System Toast Messages Log */}
          {data.authMessage.text && (
            <div
              className={`p-2.5 rounded-xl border text-[11px] font-mono text-center ${
                data.authMessage.isError
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              }`}
            >
              {data.authMessage.text}
            </div>
          )}

          {/* View Toggle Trigger Link */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                data.setIsRegistering(!data.isRegistering);
                data.setAuthMessage({ text: "", isError: false });
              }}
              className="text-xs font-semibold text-slate-500 hover:text-white transition-all underline underline-offset-4"
            >
              {data.isRegistering
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
              V4_SaaS_MODULAR
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
            <span>👤 Account: {data.currentUser?.username}</span>
          </div>
          <button
            onClick={data.handleLogout}
            className="w-full bg-slate-900 hover:bg-red-950 border border-slate-800 text-slate-400 text-[11px] font-bold py-1.5 rounded-lg transition-all"
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
            AUTH: JWT_ACTIVE // ID: {data.currentUser?.id}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-8 max-w-5xl w-full mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Isolated Accounts Summary
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Monitor multi-tenant metrics using clean decoupled modular
              components.
            </p>
          </div>

          {/* ⚡ MOUNT MODULAR COMPONENTS CHANNELS */}
          <MetricCards loading={data.loading} metrics={data.metrics} />
          <CashflowChart metrics={data.metrics} />

          <div className="grid gap-6 md:grid-cols-2">
            <ClientForm
              clientName={data.clientName}
              setClientName={data.setClientName}
              clientEmail={data.clientEmail}
              setClientEmail={data.setClientEmail}
              clientSubmitting={data.clientSubmitting}
              clientMessage={data.clientMessage}
              onSubmit={handleClientSubmitInternal}
            />
            <InvoiceForm
              selectedClientId={data.selectedClientId}
              setSelectedClientId={data.setSelectedClientId}
              invoiceNumber={data.invoiceNumber}
              setInvoiceNumber={data.setInvoiceNumber}
              dueDate={data.dueDate}
              setDueDate={data.setDueDate}
              clientsList={data.clientsList}
              invoiceSubmitting={data.invoiceSubmitting}
              invoiceMessage={data.invoiceMessage}
              items={data.items}
              setItems={data.setItems}
              onSubmit={handleInvoiceSubmitInternal}
            />
          </div>

          <section className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  // Real-Time Transaction Ledger
                </h3>
                <p className="text-[11px] text-slate-500">
                  Operational data rows compiled dynamically via query inner
                  joints.
                </p>
              </div>
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  value={data.searchTerm}
                  onChange={(e) => data.setSearchTerm(e.target.value)}
                  placeholder="🔍 Search Ledger..."
                  className="w-full border border-slate-900 rounded-xl px-3 py-1.5 bg-slate-900 text-white text-xs focus:outline-none"
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
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(inv.total_amount_cents / 100)}
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${inv.status === "paid" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-4 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              handleDownloadPdf(inv.id, inv.invoice_number)
                            }
                            className="bg-slate-900 border border-slate-800 text-slate-300 font-semibold px-2.5 py-1 rounded-lg text-[11px] hover:bg-slate-800 hover:text-white transition-all shadow-sm"
                          >
                            PDF
                          </button>
                          {inv.status === "pending" && (
                            <button
                              onClick={() => handleSettleInternal(inv.id)}
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
        </main>
      </div>
    </div>
  );
}

export default App;
