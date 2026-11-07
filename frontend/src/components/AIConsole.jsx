import React from "react";

export function AIConsole({
  chatInput,
  setChatInput,
  chatMessages,
  setChatMessages,
  chatLoading,
  chatBottomRef,
  handleSendChatMessage,
  handleApproveAIAction,
  setActiveTab, // 📡 Accesses parent routing controllers to execute workspace page jumping
}) {
  return (
    <div className="w-[30%] h-full flex flex-col bg-white dark:bg-[#121212] border-l border-zinc-200/80 dark:border-zinc-800/60 shadow-sm transition-colors duration-200">
      {/* 🧭 PANEL TOP HEADER: COMPONENT IDENTIFIER STRIP */}
      <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800/60 flex items-center space-x-2">
        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
        <h2 className="text-xs font-black tracking-tight text-zinc-900 dark:text-white uppercase font-sans">
          LedgerFlow AI Core
        </h2>
      </div>
      {/* 📜 CONVERSATIONAL FEED CANVAS TIMELINE */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
        {chatMessages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col space-y-1 ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            <span className="text-[9px] text-zinc-400 dark:text-zinc-600 font-mono tracking-wider uppercase font-bold">
              {msg.sender === "user" ? "You" : "Assistant"}
            </span>

            {/* TYPE A: STANDARD CONVERSATIONAL BUBBLE */}
            {msg.type === "text" && (
              <div
                className={`p-3 max-w-[88%] rounded-xl border leading-relaxed ${msg.sender === "user" ? "bg-zinc-900 border-zinc-800 text-white dark:bg-zinc-100 dark:border-white dark:text-zinc-950 font-medium" : "bg-zinc-50 border-zinc-200/60 dark:bg-[#1c1c1e] dark:border-zinc-800/60 text-zinc-700 dark:text-zinc-300"}`}
              >
                {msg.text}
              </div>
            )}

            {/* 🛠️ TYPE B: BEAUTIFUL, INTERACTIVE ACTION DECK SHORTCUTS */}
            {msg.type === "action_deck" && (
              <div className="w-full space-y-2.5 p-4 rounded-xl border bg-zinc-50/50 border-zinc-200/60 dark:bg-[#18181b]/30 dark:border-zinc-800/40">
                <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed mb-2">
                  {msg.text}
                </p>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("customers");
                      setChatInput("Register a new client named ");
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg border bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-left text-zinc-800 dark:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors group"
                  >
                    <span className="font-bold">
                      👥 Register New Client Entity
                    </span>
                    <span className="text-zinc-400 font-mono text-[10px] group-hover:translate-x-0.5 transition-transform">
                      →
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("billing");
                      setChatInput(
                        "Draft an invoice for Acme Corp amount $2000 ",
                      );
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg border bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-left text-zinc-800 dark:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors group"
                  >
                    <span className="font-bold">💳 Draft Dynamic Invoices</span>
                    <span className="text-zinc-400 font-mono text-[10px] group-hover:translate-x-0.5 transition-transform">
                      →
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("billing");
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg border bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-left text-zinc-800 dark:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors group"
                  >
                    <span className="font-bold">
                      ⚖️ Settle Outstanding Balances
                    </span>
                    <span className="text-zinc-400 font-mono text-[10px] group-hover:translate-x-0.5 transition-transform">
                      →
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("dashboard");
                      setChatInput(
                        "Analyze my monthly recurring revenue metrics",
                      );
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg border bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-left text-zinc-800 dark:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors group"
                  >
                    <span className="font-bold">📊 Pull Analytics Reports</span>
                    <span className="text-zinc-400 font-mono text-[10px] group-hover:translate-x-0.5 transition-transform">
                      →
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* TYPE C: HUMAN-IN-THE-LOOP APPROVAL BOX MODAL */}
            {msg.type === "approval_box" && (
              <div className="p-4 w-full rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/10 dark:bg-blue-950/5 text-zinc-700 dark:text-zinc-300 space-y-3 font-medium">
                <p className="leading-relaxed">{msg.text}</p>
                <div className="flex items-center space-x-2 pt-1 font-sans">
                  <button
                    type="button"
                    onClick={() =>
                      handleApproveAIAction(index, msg.action, msg.data)
                    }
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold py-2 rounded-lg transition-colors shadow-sm"
                  >
                    Confirm Execution
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setChatMessages((prev) =>
                        prev.map((m, idx) =>
                          idx === index
                            ? {
                                type: "text",
                                sender: "ai",
                                text: "❌ Transaction aborted by client operator.",
                              }
                            : m,
                        ),
                      )
                    }
                    className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 text-[11px] font-bold px-3 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {/* DYNAMIC AI LOADING PACKET STATUS OVERLAY */}
        {chatLoading && (
          <div className="flex flex-col space-y-1 items-start">
            <span className="text-[9px] text-zinc-400 dark:text-zinc-600 font-mono font-bold uppercase tracking-wider">
              Assistant
            </span>
            <div className="p-3 bg-zinc-50 border border-zinc-200/60 dark:bg-[#1c1c1e] dark:border-zinc-800/60 rounded-xl text-zinc-400 dark:text-zinc-500 font-medium text-[11px] flex items-center space-x-1 shadow-sm">
              <span
                className="w-1 h-1 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1 h-1 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1 h-1 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
              <span className="pl-1 font-mono text-[10px]">
                THINKING_VECTOR...
              </span>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* 💻 MESSAGE PROMPT TYPING INPUT FORM BAR */}
      <form
        onSubmit={handleSendChatMessage}
        className="p-4 border-t border-zinc-200/80 dark:border-zinc-800/60 flex items-center space-x-2 bg-white dark:bg-[#121212]"
      >
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          disabled={chatLoading}
          placeholder={
            chatLoading
              ? "Processing system instruction array..."
              : "Ask your financial assistant anything..."
          }
          className="flex-1 text-xs border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 bg-zinc-50 dark:bg-[#18181b] text-zinc-800 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 disabled:opacity-50 font-medium transition-colors"
        />
        <button
          type="submit"
          disabled={chatLoading || !chatInput.trim()}
          className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white disabled:opacity-40 px-4 py-2.5 rounded-lg font-bold text-xs transition-colors shadow-sm uppercase tracking-wider font-sans"
        >
          Send
        </button>
      </form>
    </div>
  );
}
