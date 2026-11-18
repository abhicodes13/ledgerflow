import { useEffect, useRef } from "react";

const MIN_GAP_MS = 20_000; // never refresh more often than this on focus
const POLL_MS = 30_000; // how often to check while something is unpaid

// Keeps the invoice list fresh without a manual reload.
// A client can pay from another tab or device, and the webhook flips the invoice to
// paid on the server. This brings that change onto the screen.
export function useLiveInvoices({ enabled, hasUnpaid, refresh }) {
  const refreshRef = useRef(refresh);
  const last = useRef(0);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;

    const run = (minGap) => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - last.current < minGap) return;
      last.current = now;
      refreshRef.current?.();
    };

    // When the user comes back to this tab or window
    const onFocus = () => run(MIN_GAP_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") run(MIN_GAP_MS);
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    // While an unpaid invoice might get paid
    const timer = hasUnpaid
      ? setInterval(() => run(POLL_MS - 1000), POLL_MS)
      : null;

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      if (timer) clearInterval(timer);
    };
  }, [enabled, hasUnpaid]);
}
