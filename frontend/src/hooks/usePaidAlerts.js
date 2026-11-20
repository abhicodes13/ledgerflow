import { useCallback, useEffect, useRef } from "react";
import {
  formatCurrency,
  invoiceAmountCents,
  isPaidOnline,
} from "../lib/format";

const WINDOW_MS = 15_000; // how long after a background refresh we still treat the next list as one

const label = (inv) =>
  [inv.invoice_number, inv.client_name].filter(Boolean).join(" · ");

// Tells you when an invoice flips to paid on its own (for example a client paying by card).
// It only reacts to background refreshes (switching back to the tab, or the periodic check),
// so your own "Mark paid" clicks never produce a second toast.
// Returns a function to call right before a background refresh.
export function usePaidAlerts({ invoices, toast }) {
  const known = useRef(null); // invoice id -> status, from the previous list
  const backgroundAt = useRef(0);
  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    if (!Array.isArray(invoices)) return;
    const previous = known.current;
    known.current = new Map(invoices.map((i) => [i.id, i.status]));

    const fromBackground = Date.now() - backgroundAt.current < WINDOW_MS;
    backgroundAt.current = 0;
    if (!previous || !fromBackground) return;

    const fresh = invoices.filter(
      (i) =>
        i.status === "paid" &&
        previous.has(i.id) &&
        previous.get(i.id) !== "paid",
    );
    if (fresh.length === 0) return;

    if (fresh.length === 1) {
      const inv = fresh[0];
      toastRef.current.success(
        `${isPaidOnline(inv) ? "Payment received" : "Marked as paid"}: ${label(inv)} · ${formatCurrency(invoiceAmountCents(inv))}`,
        { duration: 8000 },
      );
    } else {
      const total = fresh.reduce((sum, i) => sum + invoiceAmountCents(i), 0);
      toastRef.current.success(
        `${fresh.length} invoices were just paid · ${formatCurrency(total)}`,
        { duration: 8000 },
      );
    }
  }, [invoices]);

  return useCallback(() => {
    backgroundAt.current = Date.now();
  }, []);
}
