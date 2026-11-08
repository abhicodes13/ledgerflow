import React, { useState, useRef } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useLedgerFlowData } from "./hooks/useLedgerFlowData";
import { useTheme } from "./hooks/useTheme";
import { useToast } from "./components/ui";
import { AppShell } from "./components/layout/AppShell";
import { AuthScreen } from "./components/layout/AuthScreen";
import { AIConsole } from "./components/AIConsole";
import { DashboardView } from "./pages/DashboardView";
import { InvoicesView } from "./pages/InvoicesView";
import { ClientsView } from "./pages/ClientsView";
import { AutomationsView } from "./pages/AutomationsView";
import { SettingsView } from "./pages/SettingsView";
import { invoiceState } from "./lib/format";
import { pathToTab, tabToPath } from "./lib/routes";

function App() {
  const data = useLedgerFlowData();
  const { theme, setTheme } = useTheme();
  const toast = useToast();

  // Routing: the URL is the source of truth for the active tab
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = pathToTab(location.pathname); // null = not an app page
  const setActiveTab = (id) => navigate(tabToPath(id));

  // Assistant panel visibility
  const [isConsoleVisible, setIsConsoleVisible] = useState(true);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Auth form state
  const [isRegistering, setIsRegistering] = useState(false);
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authMessage, setAuthMessage] = useState({ text: "", isError: false });

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  const [chatMessages, setChatMessages] = useState([
    {
      type: "action_deck",
      sender: "ai",
      text: "Hi! I can add clients, draft invoices, and mark payments as received. Pick a shortcut below or just type what you need.",
    },
  ]);

  // Sign in / sign up
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

  // Sign out (the hook's version clears everything correctly)
  const handleLogout = () => {
    data.handleLogout();
  };

  // Create invoice
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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Couldn't save the invoice.");
      }
      data.setSelectedClientId("");
      data.setInvoiceNumber("");
      data.setDueDate("");
      data.setItems([{ description: "", quantity: 1, price: "" }]);
      data.fetchMetrics();
      data.fetchInvoicesList();
      toast.success("Invoice created");
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  // Add client
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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Couldn't save the client.");
      }
      data.setClientName("");
      data.setClientEmail("");
      data.fetchMetrics();
      data.fetchClientsList();
      toast.success("Client added");
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  // Mark invoice as paid
  const handleSettleInternal = async (id) => {
    try {
      const res = await fetch(`${data.API_BASE}/api/invoices/${id}/settle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${data.token}` },
      });
      if (!res.ok) throw new Error("Couldn't mark the invoice as paid.");
      data.fetchMetrics();
      data.fetchInvoicesList();
      toast.success("Invoice marked as paid");
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  // Send a chat message
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
    } catch {
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

  // Approve an AI-proposed action
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
      data.fetchClientsList();
    } catch (err) {
      toast.error(`Couldn't run that action: ${err.message}`);
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

  const overdueCount = (data.invoicesList || []).filter(
    (inv) => invoiceState(inv) === "overdue",
  ).length;

  // Logged out: everything goes to /login
  if (!data.token) {
    if (location.pathname !== "/login") {
      return <Navigate to="/login" replace />;
    }
    return (
      <AuthScreen
        isRegistering={isRegistering}
        onToggleMode={() => {
          setIsRegistering(!isRegistering);
          setAuthMessage({ text: "", isError: false });
        }}
        username={authUsername}
        setUsername={setAuthUsername}
        password={authPassword}
        setPassword={setAuthPassword}
        message={authMessage}
        submitting={authSubmitting}
        onSubmit={handleAuthSubmit}
        theme={theme}
        setTheme={setTheme}
      />
    );
  }

  // Logged in: send "/", "/login" and unknown URLs to the dashboard
  if (activeTab === null) {
    return <Navigate to="/app" replace />;
  }

  return (
    <AppShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      badges={{ billing: overdueCount }}
      theme={theme}
      setTheme={setTheme}
      currentUser={data.currentUser}
      onLogout={handleLogout}
      consoleVisible={isConsoleVisible}
      drawerOpen={isMobileChatOpen}
      onToggleConsole={() => setIsConsoleVisible((v) => !v)}
      onToggleDrawer={() => setIsMobileChatOpen((v) => !v)}
      onCloseDrawer={() => setIsMobileChatOpen(false)}
      assistant={
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
      }
    >
      {activeTab === "dashboard" && (
        <DashboardView
          metrics={data.metrics}
          invoicesList={data.invoicesList}
          loading={data.loading}
          currentUser={data.currentUser}
          onNavigate={setActiveTab}
        />
      )}
      {activeTab === "billing" && (
        <InvoicesView
          data={data}
          filteredInvoices={filteredInvoices}
          handleInvoiceSubmitInternal={handleInvoiceSubmitInternal}
          handleSettleInternal={handleSettleInternal}
          onNavigate={setActiveTab}
        />
      )}
      {activeTab === "customers" && (
        <ClientsView
          data={data}
          handleClientSubmitInternal={handleClientSubmitInternal}
        />
      )}
      {activeTab === "automations" && <AutomationsView />}
      {activeTab === "settings" && (
        <SettingsView
          theme={theme}
          setTheme={setTheme}
          currentUser={data.currentUser}
        />
      )}
    </AppShell>
  );
}

export default App;
