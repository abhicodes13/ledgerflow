import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const icons = {
  success: <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />,
  error: <AlertCircle className="h-4 w-4 text-danger" aria-hidden />,
  info: <Info className="h-4 w-4 text-accent" aria-hidden />,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback(
    (id) => setToasts((t) => t.filter((x) => x.id !== id)),
    [],
  );

  const push = useCallback(
    (message, { tone = "info", duration = 4000 } = {}) => {
      const id = crypto.randomUUID();
      setToasts((t) => [...t, { id, message, tone }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      toast: push,
      success: (m, o) => push(m, { ...o, tone: "success" }),
      error: (m, o) => push(m, { ...o, tone: "error", duration: 6000 }),
      info: (m, o) => push(m, { ...o, tone: "info" }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-20 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 md:bottom-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-surface p-3.5 text-sm text-fg shadow-[var(--shadow-pop)] animate-fadeIn"
          >
            <span className="mt-0.5">{icons[t.tone]}</span>
            <p className="flex-1">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="rounded p-0.5 text-fg-subtle hover:text-fg"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
