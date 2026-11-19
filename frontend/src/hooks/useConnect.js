import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "../lib/api";

// The Connect API is still a draft, so this is the only place that reads its status payload.
// Returns: "not_connected" | "incomplete" | "restricted" | "active" | "unknown"
export function readConnectStatus(payload) {
  const p = payload?.data ?? payload?.account ?? payload ?? {};
  const raw = String(p.status ?? p.state ?? "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (
    [
      "active",
      "complete",
      "completed",
      "enabled",
      "ready",
      "verified",
    ].includes(raw)
  )
    return "active";
  if (["restricted", "restricted_soon", "rejected", "disabled"].includes(raw))
    return "restricted";
  if (
    [
      "onboarding_incomplete",
      "incomplete",
      "pending",
      "onboarding",
      "requires_action",
      "in_progress",
    ].includes(raw)
  )
    return "incomplete";
  if (
    [
      "not_connected",
      "none",
      "not_started",
      "disconnected",
      "no_account",
    ].includes(raw)
  )
    return "not_connected";

  if (p.charges_enabled === true || p.payments_enabled === true)
    return "active";
  if (p.connected === false) return "not_connected";
  if (
    p.connected === true ||
    p.account_id ||
    p.stripe_account_id ||
    p.details_submitted === false
  )
    return "incomplete";
  return "unknown";
}

// Only follow https links to the browser
function safeHttps(value) {
  try {
    const u = new URL(String(value));
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

// status: "loading" | "not_connected" | "incomplete" | "restricted" | "active" | "unknown" | "error"
export function useConnect({ apiBase, token, toast }) {
  const [status, setStatus] = useState("loading");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) return null;
    try {
      const res = await fetch(`${apiBase}/api/connect/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error("status failed");
      const next = readConnectStatus(body);
      setStatus(next);
      return next;
    } catch {
      setStatus((s) => (s === "loading" ? "error" : s));
      return null;
    }
  }, [apiBase, token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Coming back with the browser's Back button after Stripe
  useEffect(() => {
    const onShow = (e) => e.persisted && setBusy(false);
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  // Used for first-time setup, to continue setup, and when a setup link expired
  const start = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/api/connect/onboarding-link`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(errorMessage(body, "Couldn't open the setup page."));
      const url = safeHttps(body?.url);
      if (!url)
        throw new Error("The setup link looks invalid. Please try again.");
      window.location.assign(url); // stays busy while the browser leaves
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  }, [apiBase, token, toast]);

  return { status, busy, refresh, start };
}
