import { useState, useEffect } from "react";

export function useLedgerFlowData() {
  const [token, setToken] = useState(localStorage.getItem("lf_token") || "");
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("lf_user")) || null,
  );
  const [isRegistering, setIsRegistering] = useState(false);

  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState({ text: "", isError: false });
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [metrics, setMetrics] = useState({
    total_outstanding_cents: 0,
    total_collected_cents: 0,
    total_clients_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [clientsList, setClientsList] = useState([]);
  const [invoicesList, setInvoicesList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

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
  const [invoiceMessage, setInvoiceMessage] = useState({
    text: "",
    isError: false,
  });
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);
  const [items, setItems] = useState([
    { description: "", quantity: 1, price: "" },
  ]);

  const fetchMetrics = () => {
    if (!token) return;
    fetch("/api/analytics/overview", {
      headers: { Authorization: `Bearer ${token}` },
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
    fetch("/api/clients", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((payload) => {
        if (payload.clients) setClientsList(payload.clients);
      })
      .catch((err) => console.error("❌ Dropdown lookup error:", err));
  };

  const fetchInvoicesList = () => {
    if (!token) return;
    fetch("/api/invoices", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((payload) => {
        if (payload.invoices) setInvoicesList(payload.invoices);
      })
      .catch((err) => console.error("❌ Ledger grid lookup error:", err));
  };

  useEffect(() => {
    if (token) {
      fetchMetrics();
      fetchClientsList();
      fetchInvoicesList();
    }
  }, [token]);

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

  return {
    token,
    setToken,
    currentUser,
    setCurrentUser,
    isRegistering,
    setIsRegistering,
    authUsername,
    setAuthUsername,
    authPassword,
    setAuthPassword,
    authMessage,
    setAuthMessage,
    authSubmitting,
    metrics,
    loading,
    clientsList,
    invoicesList,
    searchTerm,
    setSearchTerm,
    clientName,
    setClientName,
    clientEmail,
    setClientEmail,
    clientMessage,
    setClientMessage,
    clientSubmitting,
    selectedClientId,
    setSelectedClientId,
    invoiceNumber,
    setInvoiceNumber,
    dueDate,
    setDueDate,
    invoiceMessage,
    setInvoiceMessage,
    invoiceSubmitting,
    items,
    setItems,
    fetchMetrics,
    fetchClientsList,
    fetchInvoicesList,
    handleLogout,
  };
}
