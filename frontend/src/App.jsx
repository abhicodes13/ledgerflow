import React, { useState, useRef } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useLedgerFlowData } from "./hooks/useLedgerFlowData";
import { useTheme } from "./hooks/useTheme";
import { useToast } from "./components/ui";
import { AppShell } from "./components/layout/AppShell";
import { AuthScreen } from "./components/layout/AuthScreen";
import { RequireAuth } from "./components/RequireAuth";
import { AIConsole } from "./components/AIConsole";
import { LandingPage } from "./pages/LandingPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { DashboardView } from "./pages/DashboardView";
import { InvoicesView } from "./pages/InvoicesView";
import { ClientsView } from "./pages/ClientsView";
import { AutomationsView } from "./pages/AutomationsView";
import { SettingsView } from "./pages/SettingsView";
import { invoiceState } from "./lib/format";
import { tabToPath } from "./lib/routes";
import { errorMessage, readError } from "./lib/api";

function App() {
  const data = useLedgerFlowData();
  const { theme, setTheme } = useTheme();
  const toast = useToast();

  const location = useLocation();
  const navigate = useNavigate();
  // Used by the assistant shortcuts and dashboard buttons: setActiveTab("billing")
  const setActiveTab = (id) => navigate(tabToPath(id));

  // Assistant panel visibility
  const [isConsoleVisible, setIsConsoleVisible] = useState(true);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Auth form state
  const [isRegistering, setIsRegistering] = useState(false);
  const [authUsername, setAuthUsername] = useState("");
  const [authEmail, setAuthEmail] = useState("");
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
    if (!authUsername || !authPassword || (isRegistering && !authEmail)) {
      setAuthMessage({
        text: "Please fill in all the fields.",
        isError: true,
      });
      return;
    }
    setAuthSubmitting(true);
    setAuthMessage({ text: "", isError: false });

    const endpointPath = isRegistering
      ? "/api/auth/register"
      : "/api/auth/login";

    const body = { username: authUsername, password: authPassword };
    if (isRegistering) body.email = authEmail.trim();

    try {
      const res = await fetch(`${data.API_BASE}${endpointPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          errorMessage(
            resData,
            isRegistering
              ? "Couldn't create your account."
              : "Couldn't sign you in.",
          ),
        );
      }

      if (isRegistering) {
        setAuthMessage({
          text: "Account created! You can sign in now.",
          isError: false,
        });
        setAuthUsername("");
        setAuthEmail("");
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

  // Sign out: RequireAuth sends you to /login once the token is cleared
  const handleLogout = () => {
    data.handleLogout();
  };

  // Create invoice
  const handleInvoiceSubmitInternal = async (e) => {
    e.preventDefault();
    try {
      const body = {
        client_id: parseInt(data.selectedClientId, 10),
        due_date: data.dueDate,
        items: data.items.map((i) => ({
          description: i.description,
          quantity: parseInt(i.quantity, 10),
          price: parseFloat(i.price),
        })),
      };
      // The server assigns a number when none is sent
      if (data.invoiceNumber?.trim()) {
        body.invoice_number = data.invoiceNumber.trim();
      }

      const res = await fetch(`${data.API_BASE}/api/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok)
        throw new Error(await readError(res, "Couldn't save the invoice."));
      const created = await res.json().catch(() => null);
      const assigned = created?.invoice?.invoice_number;

      data.setSelectedClientId("");
      data.setInvoiceNumber("");
      data.setDueDate("");
      data.setItems([{ description: "", quantity: 1, price: "" }]);
      data.fetchMetrics();
      data.fetchInvoicesList();
      toast.success(
        assigned ? `"Invoice {assigned} created` : "Invoice created",
      );
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
      if (!res.ok)
        throw new Error(await readError(res, "Couldn't save the client."));

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
      if (!res.ok) {
        throw new Error(
          await readError(res, "Couldn't mark the invoice as paid."),
        );
      }
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
      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        setChatMessages((prev) => [
          ...prev,
          {
            type: "text",
            sender: "ai",
            text: errorMessage(
              resData,
              "Sorry, I couldn't handle that request.",
            ),
          },
        ]);
      } else if (resData.type === "approval_required") {
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
          text: "Error connecting to core AI route.",
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
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Keep the confirmation card so the user can retry or cancel
        toast.error(errorMessage(resData, "Couldn't run that action."));
        return;
      }
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

  // Layout route: the shell wraps every /app/* page
  const shell = (
    <AppShell
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
      <Outlet />
    </AppShell>
  );

  const loginElement = data.token ? (
    <Navigate to={location.state?.from?.pathname ?? "/app"} replace />
  ) : (
    <AuthScreen
      isRegistering={isRegistering}
      onToggleMode={() => {
        setIsRegistering(!isRegistering);
        setAuthMessage({ text: "", isError: false });
      }}
      username={authUsername}
      setUsername={setAuthUsername}
      email={authEmail}
      setEmail={setAuthEmail}
      password={authPassword}
      setPassword={setAuthPassword}
      message={authMessage}
      submitting={authSubmitting}
      onSubmit={handleAuthSubmit}
      theme={theme}
      setTheme={setTheme}
    />
  );

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingPage
            isAuthed={!!data.token}
            theme={theme}
            setTheme={setTheme}
          />
        }
      />
      <Route path="/login" element={loginElement} />

      <Route element={<RequireAuth token={data.token} />}>
        <Route path="/app" element={shell}>
          <Route
            index
            element={
              <DashboardView
                metrics={data.metrics}
                invoicesList={data.invoicesList}
                loading={data.loading}
                currentUser={data.currentUser}
                onNavigate={setActiveTab}
              />
            }
          />
          <Route
            path="invoices"
            element={
              <InvoicesView
                data={data}
                filteredInvoices={filteredInvoices}
                handleInvoiceSubmitInternal={handleInvoiceSubmitInternal}
                handleSettleInternal={handleSettleInternal}
                onNavigate={setActiveTab}
              />
            }
          />
          <Route
            path="clients"
            element={
              <ClientsView
                data={data}
                handleClientSubmitInternal={handleClientSubmitInternal}
              />
            }
          />
          <Route path="automations" element={<AutomationsView />} />
          <Route
            path="settings"
            element={
              <SettingsView
                theme={theme}
                setTheme={setTheme}
                currentUser={data.currentUser}
              />
            }
          />
          <Route
            path="*"
            element={<NotFoundPage home="/app" label="Back to dashboard" />}
          />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
