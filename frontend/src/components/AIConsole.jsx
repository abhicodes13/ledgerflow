import { useEffect, useRef } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  PanelRightClose,
  Repeat,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  XCircle,
} from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "./ui";
import {
  ActionDetails,
  ReportTable,
  RichText,
  describeAction,
} from "./ChatContent";

// send: true = sends right away. false = fills the box so you can finish the sentence.
const SUGGESTIONS = [
  { icon: FileText, label: "Invoice a client", text: "Invoice ", send: false },
  {
    icon: Repeat,
    label: "Same as last time",
    text: "Same as last time for ",
    send: false,
  },
  {
    icon: BarChart3,
    label: "Overdue invoices",
    text: "Show my overdue invoices",
    send: true,
  },
  {
    icon: UserPlus,
    label: "Add client",
    text: "Register a new client named ",
    send: false,
  },
  {
    icon: CheckCircle2,
    label: "Mark paid",
    text: "Mark invoice as paid: ",
    send: false,
  },
  {
    icon: Mail,
    label: "Send reminders",
    text: "Send reminders for my overdue invoices",
    send: true,
  },
];

const TONES = {
  default: {
    box: "border-accent/40 bg-accent-soft/50",
    head: "text-accent",
    label: "Needs your OK",
    Icon: ShieldCheck,
  },
  serious: {
    box: "border-warning/50 bg-warning-soft/40",
    head: "text-warning",
    label: "Sends real emails",
    Icon: Mail,
  },
  danger: {
    box: "border-danger/40 bg-danger-soft/40",
    head: "text-danger",
    label: "Review carefully",
    Icon: AlertTriangle,
  },
};

const FINISHED = {
  done: { label: "Done", Icon: CheckCircle2 },
  expired: { label: "Expired", Icon: Clock },
  cancelled: { label: "Cancelled", Icon: XCircle },
};

function ResultLine({ tone, icon: Icon, children }) {
  const styles = {
    success: "text-success",
    danger: "text-danger",
    neutral: "text-fg-muted",
  };
  return (
    <div
      role={tone === "danger" ? "alert" : undefined}
      className={cn("flex items-start gap-2 text-sm", styles[tone])}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function ApprovalCard({ msg, onConfirm, onCancel }) {
  const d = describeAction(msg.action, msg.summary);
  const ActionIcon = d.icon;
  const tone = TONES[d.tone] ?? TONES.default;
  const { status } = msg;
  const confirming = status === "confirming";
  const muted = status === "expired" || status === "cancelled";
  const header = FINISHED[status] ?? { label: tone.label, Icon: tone.Icon };

  // A new card takes focus on its Confirm button, so keyboard and screen reader users land on it
  const cardRef = useRef(null);
  useEffect(() => {
    cardRef.current?.querySelector("[data-confirm]")?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={cardRef}
      className={cn(
        "space-y-3 rounded-xl border p-4 animate-fadeIn transition-colors",
        muted
          ? "border-border bg-surface-2 opacity-70"
          : status === "done"
            ? "border-success/30 bg-success-soft/40"
            : tone.box,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div
          className={cn(
            "flex items-center gap-2 text-sm font-semibold",
            muted
              ? "text-fg-muted"
              : status === "done"
                ? "text-success"
                : tone.head,
          )}
        >
          <ActionIcon className="h-4 w-4" aria-hidden />
          {d.title}
        </div>
        <span className="flex items-center gap-1 text-xs text-fg-subtle">
          <header.Icon className="h-3.5 w-3.5" aria-hidden />
          {header.label}
        </span>
      </div>

      {msg.text && (
        <div className="text-sm text-fg">
          <RichText text={msg.text} />
        </div>
      )}

      <ActionDetails details={d} />

      {(status === "waiting" || confirming) && (
        <div className="flex gap-2">
          <Button
            size="md"
            className="min-h-11 flex-1"
            data-confirm
            loading={confirming}
            disabled={confirming}
            onClick={() => onConfirm(msg.id)}
          >
            {d.confirmLabel}
          </Button>
          <Button
            size="md"
            variant="secondary"
            className="min-h-11"
            disabled={confirming}
            onClick={() => onCancel(msg.id)}
          >
            Cancel
          </Button>
        </div>
      )}

      {status === "failed" && (
        <>
          <ResultLine tone="danger" icon={AlertTriangle}>
            {msg.note}
          </ResultLine>
          <div className="flex gap-2">
            {msg.canRetry && (
              <Button
                size="md"
                className="min-h-11 flex-1"
                onClick={() => onConfirm(msg.id)}
              >
                Try again
              </Button>
            )}
            <Button
              size="md"
              variant="secondary"
              className="min-h-11"
              onClick={() => onCancel(msg.id)}
            >
              Dismiss
            </Button>
          </div>
        </>
      )}

      {status === "done" && (
        <ResultLine tone="success" icon={CheckCircle2}>
          <RichText text={msg.note} />
        </ResultLine>
      )}
      {status === "expired" && (
        <ResultLine tone="neutral" icon={Clock}>
          {msg.note}
        </ResultLine>
      )}
      {status === "cancelled" && (
        <ResultLine tone="neutral" icon={XCircle}>
          Cancelled.
        </ResultLine>
      )}
    </div>
  );
}

function Deck({ msg, onPick, disabled }) {
  return (
    <div className="space-y-3 animate-fadeIn">
      <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-surface-2 px-3.5 py-2.5 text-sm text-fg">
        {msg.text}
      </div>
      <div className="space-y-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            type="button"
            disabled={disabled}
            onClick={() => onPick(s)}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-border px-3.5 py-2.5 text-left text-sm font-medium text-fg transition-colors hover:border-accent hover:bg-accent-soft disabled:opacity-50"
          >
            <s.icon className="h-4 w-4 text-accent" aria-hidden />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AIConsole({
  messages,
  input,
  setInput,
  loading,
  onSend,
  onConfirm,
  onCancel,
  onClose,
}) {
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Follow the conversation as it grows
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const pick = (s) => {
    if (s.send) return onSend(s.text);
    setInput(s.text);
    inputRef.current?.focus();
  };

  const showChips = messages.length > 1;

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] xl:pt-3">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-soft text-accent">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-fg">AI assistant</h2>
            <p className="text-xs text-fg-subtle">Ask in plain English</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11"
          aria-label="Close assistant"
          onClick={onClose}
        >
          <PanelRightClose className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      {/* Conversation */}
      <div
        className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4"
        aria-live="polite"
      >
        {messages.map((msg) => {
          if (msg.type === "action_deck") {
            return (
              <Deck key={msg.id} msg={msg} onPick={pick} disabled={loading} />
            );
          }
          if (msg.type === "approval_box") {
            return (
              <ApprovalCard
                key={msg.id}
                msg={msg}
                onConfirm={onConfirm}
                onCancel={onCancel}
              />
            );
          }
          if (msg.type === "error") {
            return (
              <div key={msg.id} className="flex animate-fadeIn">
                <div
                  role="alert"
                  className="max-w-[90%] space-y-2 rounded-2xl rounded-tl-sm border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger"
                >
                  <p>{msg.text}</p>
                  {msg.retryText && (
                    <Button
                      size="md"
                      variant="secondary"
                      className="min-h-11"
                      disabled={loading}
                      onClick={() => onSend(msg.retryText, { retry: true })}
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                      Try again
                    </Button>
                  )}
                </div>
              </div>
            );
          }

          const isUser = msg.sender === "user";
          return (
            <div key={msg.id} className="space-y-2 animate-fadeIn">
              <div className={cn("flex", isUser && "justify-end")}>
                <div
                  className={cn(
                    "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm",
                    isUser
                      ? "rounded-br-sm bg-accent text-accent-fg"
                      : "rounded-tl-sm bg-surface-2 text-fg",
                  )}
                >
                  {isUser ? msg.text : <RichText text={msg.text} />}
                </div>
              </div>
              {!isUser && msg.report && <ReportTable report={msg.report} />}
            </div>
          );
        })}

        {loading && (
          <div
            className="flex"
            role="status"
            aria-label="Assistant is thinking"
          >
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-surface-2 px-4 py-3">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-fg-subtle"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-border pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {showChips && (
          <div
            role="group"
            aria-label="Suggestions"
            className="flex gap-2 overflow-x-auto px-3 pt-3 [scrollbar-width:none]"
          >
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                type="button"
                disabled={loading}
                onClick={() => pick(s)}
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-border px-3.5 text-xs font-medium text-fg-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
              >
                <s.icon className="h-3.5 w-3.5" aria-hidden />
                {s.label}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSend(input);
          }}
          className="flex items-center gap-2 p-3 pb-1"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            maxLength={2000}
            autoComplete="off"
            enterKeyHint="send"
            aria-label="Message the assistant"
            placeholder={
              loading ? "Working on it..." : "Ask me to do something..."
            }
            className="h-11 min-w-0 flex-1 rounded-lg border border-border-strong bg-surface px-3 text-base text-fg placeholder:text-fg-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50 sm:text-sm"
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Send message"
            disabled={loading || !input.trim()}
            className="min-h-11 min-w-11"
          >
            <Send className="h-4 w-4" aria-hidden />
          </Button>
        </form>
        <p className="px-4 pb-1 text-[11px] text-fg-subtle">
          AI can make mistakes. Review before approving.
        </p>
      </div>
    </div>
  );
}
