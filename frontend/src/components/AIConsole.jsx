import { useEffect, useState } from "react";
import {
  CheckCircle2,
  FileText,
  PanelRightClose,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "./ui";
import { DetailsCard, RichText } from "./ChatContent";

export function AIConsole({
  chatInput,
  setChatInput,
  chatMessages,
  setChatMessages,
  chatLoading,
  chatBottomRef,
  handleSendChatMessage,
  handleApproveAIAction,
  setActiveTab,
  setIsMobileChatOpen,
  setIsConsoleVisible,
}) {
  // Index of the approval currently being executed (blocks double clicks)
  const [pending, setPending] = useState(null);

  // Follow the conversation as it grows
  useEffect(() => {
    chatBottomRef?.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [chatMessages, chatLoading, chatBottomRef]);

  const approve = async (index, msg) => {
    if (pending !== null) return;
    setPending(index);
    try {
      await handleApproveAIAction(index, msg.action, msg.data);
    } finally {
      setPending(null);
    }
  };

  const cancel = (index) =>
    setChatMessages((prev) =>
      prev.map((m, i) =>
        i === index
          ? {
              type: "text",
              sender: "ai",
              text: "Okay, I cancelled that action.",
            }
          : m,
      ),
    );

  const QUICK_ACTIONS = [
    {
      icon: Users,
      label: "Add a client",
      run: () => {
        setActiveTab("customers");
        setChatInput("Register a new client named ");
      },
    },
    {
      icon: FileText,
      label: "Draft an invoice",
      run: () => {
        setActiveTab("billing");
        setChatInput("Draft an invoice for Acme Corp amount $2000 ");
      },
    },
    {
      icon: CheckCircle2,
      label: "Mark an invoice as paid",
      run: () => setActiveTab("billing"),
    },
  ];

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
          aria-label="Close assistant"
          onClick={() => {
            setIsConsoleVisible(false);
            setIsMobileChatOpen?.(false);
          }}
        >
          <PanelRightClose className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      {/* Conversation */}
      <div
        className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
        aria-live="polite"
      >
        {chatMessages.map((msg, index) => {
          const isUser = msg.sender === "user";

          if (msg.type === "action_deck") {
            const confirmed =
              !isUser && /^Action Confirmed:/i.test(msg.text || "");

            if (confirmed) {
              return (
                <div
                  key={index}
                  className="flex items-start gap-2.5 rounded-xl border border-success/30 bg-success-soft p-3.5 text-sm text-fg animate-fadeIn"
                >
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-success"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <RichText
                      text={msg.text.replace(/^Action Confirmed:\s*/i, "")}
                    />
                  </div>
                </div>
              );
            }

            return (
              <div
                key={index}
                className={cn("flex animate-fadeIn", isUser && "justify-end")}
              >
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
            );
          }

          if (msg.type === "approval_box") {
            const busy = pending === index;
            return (
              <div
                key={index}
                className="space-y-3 rounded-xl border border-accent/40 bg-accent-soft/50 p-4 animate-fadeIn"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-accent">
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  Please confirm
                </div>
                <div className="text-sm text-fg">
                  <RichText text={msg.text} />
                </div>
                <DetailsCard data={msg.data} />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    loading={busy}
                    disabled={pending !== null}
                    onClick={() => approve(index, msg)}
                  >
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending !== null}
                    onClick={() => cancel(index)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={index}
              className={cn("flex animate-fadeIn", isUser && "justify-end")}
            >
              <div
                className={cn(
                  "max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm",
                  isUser
                    ? "rounded-br-sm bg-accent text-accent-fg"
                    : "rounded-tl-sm bg-surface-2 text-fg",
                )}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {chatLoading && (
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
        <div ref={chatBottomRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSendChatMessage}
        className="flex shrink-0 items-center gap-2 border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          disabled={chatLoading}
          aria-label="Message the assistant"
          placeholder={
            chatLoading ? "Working on it..." : "Ask me to do something..."
          }
          className="h-10 min-w-0 flex-1 rounded-lg border border-border-strong bg-surface px-3 text-sm text-fg placeholder:text-fg-subtle transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Send message"
          disabled={chatLoading || !chatInput.trim()}
          className="h-10 w-10"
        >
          <Send className="h-4 w-4" aria-hidden />
        </Button>
      </form>
    </div>
  );
}
