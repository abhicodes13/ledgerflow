import { useCallback, useRef, useState } from "react";
import { errorMessage } from "../lib/api";

const CLOSED = {
  open: false,
  phase: "idle", // "loading" | "ready" | "sending" | "done" | "error"
  preview: null,
  result: null,
  error: null,
  ids: null,
};

// Preview who would be emailed, then send only after the user confirms.
export function useReminders({ apiBase, token, onSent }) {
  const [state, setState] = useState(CLOSED);
  const run = useRef(0); // ignores answers that arrive after the modal closed

  const call = useCallback(
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
      if (!res.ok) throw new Error(errorMessage(data, "Something went wrong."));
      return data;
    },
    [apiBase, token],
  );

  // start()            -> all overdue invoices (the server decides who)
  // start([12, 15])    -> only those invoices
  const start = useCallback(
    async (invoiceIds) => {
      const id = ++run.current;
      const ids =
        Array.isArray(invoiceIds) && invoiceIds.length
          ? invoiceIds.map(Number)
          : null;
      setState({ ...CLOSED, open: true, phase: "loading", ids });
      try {
        const preview = await call("/api/reminders/preview", {
          channel: "email",
          ...(ids ? { invoice_ids: ids } : {}),
        });
        if (run.current !== id) return;
        setState((s) => ({ ...s, phase: "ready", preview }));
      } catch (err) {
        if (run.current !== id) return;
        setState((s) => ({ ...s, phase: "error", error: err.message }));
      }
    },
    [call],
  );

  const confirm = useCallback(async () => {
    const pendingId = state.preview?.pendingActionId;
    if (!pendingId || state.phase !== "ready") return;
    const id = run.current;
    setState((s) => ({ ...s, phase: "sending" }));
    try {
      const result = await call(
        `/api/reminders/${encodeURIComponent(pendingId)}/confirm`,
      );
      if (run.current !== id) return;
      setState((s) => ({ ...s, phase: "done", result }));
      onSent?.(result);
    } catch (err) {
      if (run.current !== id) return;
      setState((s) => ({ ...s, phase: "error", error: err.message }));
    }
  }, [call, state.preview, state.phase, onSent]);

  const close = useCallback(() => {
    run.current += 1;
    setState(CLOSED);
  }, []);

  const retry = useCallback(() => start(state.ids), [start, state.ids]);

  return { ...state, start, confirm, close, retry };
}
