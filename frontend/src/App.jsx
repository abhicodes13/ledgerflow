import React, { useEffect, useState } from "react";
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
import { useBilling, usePaymentReturn } from "./hooks/useBilling";
import { useReminders } from "./hooks/useReminders";
import { useAssistant } from "./hooks/useAssistant";
import { useToast } from "./components/ui";
import { AppShell } from "./components/layout/AppShell";
import { AuthScreen } from "./components/layout/AuthScreen";
import { RequireAuth } from "./components/RequireAuth";
import { AIConsole } from "./components/AIConsole";
import { ReminderModal } from "./components/ReminderModal";
import { LandingPage } from "./pages/LandingPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PaywallView } from "./pages/PaywallView";
import { DashboardView } from "./pages/DashboardView";
import { InvoicesView } from "./pages/InvoicesView";
import { ClientsView } from "./pages/ClientsView";
import { AutomationsView } from "./pages/AutomationsView";
import { SettingsView } from "./pages/SettingsView";
import { EstimatesView } from "./pages/EstimatesView";
import { SignaturesView } from "./pages/SignaturesView";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { invoiceState } from "./lib/format";
import { tabToPath } from "./lib/routes";
import { errorMessage, readError } from "./lib/api";
import { API_ERROR_EVENT } from "./lib/apiGuard";

function App() {
  const data = useLedgerFlowData();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const billing = useBilling({
    apiBase: data.API_BASE,
    token: data.token,
    toast,
  });
  usePaymentReturn(billing, toast);

  const reminders = useReminders({
    apiBase: data.API_BASE,
    token: data.token,
    onSent: () => {
      data.fetchInvoicesList();
      data.fetchMetrics();
    },
  });

  const assistant = useAssistant({
    apiBase: data.API_BASE,
    token: data.token,
    // After a confirmed (or already-used) action, refresh what's on screen
    onChanged: () => {
      data.fetchMetrics();
      data.fetchInvoicesList();
      data.fetchClientsList();
    },
  });

  const location = useLocation();
  const navigate = useNavigate();
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

  // React to auth and billing failures from any API call
  useEffect(() => {
    const onApiError = (e) => {
      const { status, code, billingStatus } = e.detail;
      if (code === "SUBSCRIPTION_REQUIRED") {
        billing.setStatus(billingStatus || "inactive"); // shows the paywall
        setIsMobileChatOpen(false); // so the paywall isn't hidden behind the chat
      } else if (status === 401) {
        data.handleLogout();
        toast.error("Your session has ended. Please sign in again.");
      }
    };
    window.addEventListener(API_ERROR_EVENT, onApiError);
    return () => window.removeEventListener(API_ERROR_EVENT, onApiError);
  });

  // Sign in / sign up
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authUsername || !authPassword || (isRegistering && !authEmail)) {
      setAuthMessage({ text: "Please fill in all the fields.", isError: true });
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
      if (!res.ok) {
        throw new Error(await readError(res, "Couldn't save the invoice."));
      }
      const created = await res.json().catch(() => null);
      const assigned = created?.invoice?.invoice_number;

      data.setSelectedClientId("");
      data.setInvoiceNumber("");
      data.setDueDate("");
      data.setItems([{ description: "", quantity: 1, price: "" }]);
      data.fetchMetrics();
      data.fetchInvoicesList();
      toast.success(
        assigned ? `Invoice ${assigned} created` : "Invoice created",
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
          phone_number: data.clientPhone?.trim() || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(await readError(res, "Couldn't save the client."));
      }

      data.setClientName("");
      data.setClientEmail("");
      data.setClientPhone("");
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

  // Used by the Automations shortcuts: fill the chat and show the assistant
  const askAssistant = (text) => {
    assistant.setInput(text);
    if (window.matchMedia("(min-width: 1280px)").matches) {
      setIsConsoleVisible(true);
    } else {
      setIsMobileChatOpen(true);
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

  // Unpaid accounts see the paywall instead of empty pages (Settings stays open)
  const gated = (page) =>
    billing.isBlocked ? <PaywallView billing={billing} /> : page;

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
          messages={assistant.messages}
          input={assistant.input}
          setInput={assistant.setInput}
          loading={assistant.loading}
          onSend={assistant.send}
          onConfirm={assistant.confirm}
          onCancel={assistant.cancel}
          clients={data.clientsList}
          invoices={data.invoicesList}
          onClose={() => {
            setIsConsoleVisible(false);
            setIsMobileChatOpen(false);
          }}
        />
      }
    >
      <Outlet />
      <ReminderModal reminders={reminders} />
    </AppShell>
  );

  // Shows "Password updated" after a reset (passed through the router's state)
  const loginMessage =
    !authMessage.text && !isRegistering && location.state?.notice
      ? { text: location.state.notice, isError: false }
      : authMessage;

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
      message={loginMessage}
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
            billing={billing}
          />
        }
      />
      <Route path="/login" element={loginElement} />
      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage theme={theme} setTheme={setTheme} />}
      />
      <Route
        path="/reset-password"
        element={<ResetPasswordPage theme={theme} setTheme={setTheme} />}
      />

      {/* Stripe currently returns users to /dashboard?payment=... */}
      <Route
        path="/dashboard"
        element={
          <Navigate
            to={{ pathname: "/app", search: location.search }}
            replace
          />
        }
      />

      <Route element={<RequireAuth token={data.token} />}>
        <Route path="/app" element={shell}>
          <Route
            index
            element={gated(
              <DashboardView
                metrics={data.metrics}
                invoicesList={data.invoicesList}
                loading={data.loading}
                currentUser={data.currentUser}
                onNavigate={setActiveTab}
                onRemind={reminders.start}
              />,
            )}
          />
          <Route
            path="invoices"
            element={gated(
              <InvoicesView
                data={data}
                filteredInvoices={filteredInvoices}
                handleInvoiceSubmitInternal={handleInvoiceSubmitInternal}
                handleSettleInternal={handleSettleInternal}
                onNavigate={setActiveTab}
                onRemind={reminders.start}
              />,
            )}
          />
          <Route
            path="clients"
            element={gated(
              <ClientsView
                data={data}
                handleClientSubmitInternal={handleClientSubmitInternal}
              />,
            )}
          />
          <Route
            path="automations"
            element={gated(
              <AutomationsView
                invoices={data.invoicesList}
                clients={data.clientsList}
                loading={data.loading}
                onRemind={reminders.start}
                onAskAssistant={askAssistant}
              />,
            )}
          />
          <Route
            path="settings"
            element={
              <SettingsView
                theme={theme}
                setTheme={setTheme}
                currentUser={data.currentUser}
                billing={billing}
              />
            }
          />
          <Route
            path="estimates"
            element={<EstimatesView currentUser={data.currentUser} />}
          />
          <Route
            path="signatures"
            element={<SignaturesView currentUser={data.currentUser} />}
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
