import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { errorMessage } from "../lib/api";

// status: "loading" | "active" | "inactive" | "past_due" | "unknown"
export function useBilling({ apiBase, token, toast }) {
  const [info, setInfo] = useState({
    status: "loading",
    tier: null,
    periodEnd: null,
  });
  const [busy, setBusy] = useState(null); // "monthly" | "yearly" | "portal" | null

  // /api/me is not behind the paywall, so it works for unpaid users too
  const refresh = useCallback(async () => {
    if (!token) return null;
    try {
      const res = await fetch(`${apiBase}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("me failed");
      const body = await res.json();
      const u = body.user ?? body;
      const next = {
        status: u.billing_status ?? "unknown",
        tier: u.subscription_tier ?? null,
        periodEnd: u.current_period_end ?? null,
      };
      setInfo(next);
      return next;
    } catch {
      setInfo((i) =>
        i.status === "loading" ? { ...i, status: "unknown" } : i,
      );
      return null;
    }
  }, [apiBase, token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Coming back with the browser's Back button after Stripe
  useEffect(() => {
    const onShow = (e) => e.persisted && setBusy(null);
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  // Called when any API response says "subscription required"
  const setStatus = useCallback(
    (status) => setInfo((i) => ({ ...i, status })),
    [],
  );

  const post = useCallback(
    async (path, body) => {
      const res = await fetch(`${apiBase}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      return { res, data };
    },
    [apiBase, token],
  );

  const openPortal = useCallback(async () => {
    setBusy("portal");
    try {
      const { res, data } = await post("/api/payment/billing-portal");
      if (!res.ok || !data.url) {
        throw new Error(
          errorMessage(data, "Could not open the billing portal."),
        );
      }
      window.location.assign(data.url);
    } catch (err) {
      toast.error(err.message);
      setBusy(null);
    }
  }, [post, toast]);

  const startCheckout = useCallback(
    async (priceType) => {
      setBusy(priceType);
      try {
        const { res, data } = await post(
          "/api/payment/create-checkout-session",
          { priceType },
        );
        if (res.status === 409 && data.code === "USE_BILLING_PORTAL") {
          return openPortal();
        }
        if (res.status === 409) {
          // Already subscribed: our status was stale
          toast.info(errorMessage(data));
          await refresh();
          setBusy(null);
          return;
        }
        if (!res.ok || !data.url) {
          throw new Error(errorMessage(data, "Could not start checkout."));
        }
        window.location.assign(data.url);
      } catch (err) {
        toast.error(err.message);
        setBusy(null);
      }
    },
    [post, openPortal, refresh, toast],
  );

  const status = token ? info.status : "loading";

  return {
    status,
    tier: info.tier,
    periodEnd: info.periodEnd,
    busy,
    isActive: status === "active",
    isBlocked: status === "inactive" || status === "past_due",
    refresh,
    setStatus,
    startCheckout,
    openPortal,
  };
}

// Handles /app?payment=success|cancelled after Stripe sends the user back.
// The webhook activates the plan a moment later, so we check every 2 seconds.
export function usePaymentReturn(billing, toast) {
  const { search, pathname } = useLocation();
  const navigate = useNavigate();
  const flag = new URLSearchParams(search).get("payment");
  const handled = useRef(false);
  const { refresh } = billing;

  useEffect(() => {
    if (!flag) {
      handled.current = false;
      return;
    }
    if (handled.current) return;
    handled.current = true;

    navigate(pathname, { replace: true }); // clean the URL

    if (flag === "cancelled") {
      toast.info("Checkout cancelled. You haven't been charged.");
      return;
    }
    if (flag !== "success") return;

    (async () => {
      toast.info("Payment received. Activating your plan...");
      for (let i = 0; i < 10; i++) {
        const next = await refresh();
        if (next?.status === "active") {
          toast.success("You're all set. Welcome to LedgerFlow Pro!");
          return;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
      toast.info(
        "Still activating. This can take a minute, so refresh shortly.",
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flag]);
}
