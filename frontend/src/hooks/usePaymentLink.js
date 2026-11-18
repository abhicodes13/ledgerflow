import { useEffect, useState } from "react";
import { errorMessage } from "../lib/api";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

// Only https links reach the clipboard. Plain http is allowed for localhost, for local testing.
function safeLink(value) {
  try {
    const u = new URL(String(value));
    if (u.protocol === "https:") return u.toString();
    if (u.protocol === "http:" && LOCAL_HOSTS.has(u.hostname))
      return u.toString();
    return null;
  } catch {
    return null;
  }
}

// status: "loading" | "ready" | "error" | "idle"
// ready + url      -> the link can be copied
// ready + no url   -> payments aren't available; `reason` says why
export function usePaymentLink({ apiBase, token, invoiceId, active }) {
  const [state, setState] = useState({
    id: null,
    status: "loading",
    url: null,
    reason: null,
  });

  useEffect(() => {
    if (!active || !invoiceId || !token) return;
    const controller = new AbortController();

    fetch(
      `${apiBase}/api/connect/invoices/${encodeURIComponent(invoiceId)}/payment-link`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      },
    )
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok)
          throw new Error(
            errorMessage(body, "Couldn't check the payment link."),
          );
        return body;
      })
      .then((body) => {
        const url = body?.enabled ? safeLink(body.url) : null;
        setState({
          id: invoiceId,
          status: "ready",
          url,
          reason:
            body?.enabled && !url ? "invalid_link" : (body?.reason ?? null),
        });
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setState({ id: invoiceId, status: "error", url: null, reason: null });
        }
      });

    return () => controller.abort();
  }, [apiBase, token, invoiceId, active]);

  if (!active || !invoiceId) return { status: "idle", url: null, reason: null };
  if (state.id !== invoiceId)
    return { status: "loading", url: null, reason: null };
  return state;
}
