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
  setActiveTab,
  setIsMobileChatOpen,
  // 📡 Access the desktop panel visibility toggle state from App.jsx
  isConsoleVisible,
  setIsConsoleVisible,
}) {
  return (
    <div className="w-full h-full flex flex-col bg-[#0b0b0e] text-zinc-100 font-sans select-none relative transition-colors duration-300">
      {/* 🧭 PREMIUM TECHNICAL HUD BAR HEADER */}
      <div className="p-4 border-b border-zinc-900 bg-[#0e0e12] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
          <h2 className="text-[10px] font-black tracking-widest text-zinc-500 uppercase font-mono">
            AI_CORE_TERMINAL //
          </h2>
        </div>

        {/* 🛠️ 2026 PANEL COLLAPSE CONTROLLER BUTTON */}
        <button
          type="button"
          onClick={() => {
            setIsConsoleVisible(false);
            if (setIsMobileChatOpen) setIsMobileChatOpen(false);
          }}
          className="text-[9px] font-mono font-bold tracking-wider px-2 py-1 rounded-md bg-[#121216] border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
        >
          [COLLAPSE_PANEL]
        </button>
      </div>

      {/* 📜 ULTRA-MINIMALIST TECHNICAL STREAM TIMELINE */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs scrollbar-none">
        {chatMessages.map((msg, index) => (
          <div key={index} className="flex flex-col space-y-1.5 animate-fadeIn">
            {/* Monochromatic Tech-Label Prefix Headers */}
            <div className="flex items-center space-x-2 px-1">
              <span
                className={`text-[8px] font-mono tracking-widest font-black uppercase ${msg.sender === "user" ? "text-zinc-500" : "text-blue-500"}`}
              >
                {msg.sender === "user"
                  ? "OPERATOR_INPUT //"
                  : "COBALT_VECTOR_RESPONSE //"}
              </span>
              <span className="text-[8px] text-zinc-700 font-mono">
                SYS_LOC_0{index}
              </span>
            </div>

            {/* TYPE A: BORDERLESS RADAR TEXT DATA TRAY */}
            {msg.type === "text" && (
              <div
                className={`pl-3.5 pr-2 py-1.5 leading-relaxed text-xs font-medium border-l-2 bg-gradient-to-r from-zinc-900/40 to-transparent
                ${
                  msg.sender === "user"
                    ? "border-zinc-700 text-zinc-300"
                    : "border-blue-600 text-zinc-200"
                }`}
              >
                {msg.text}
              </div>
            )}
            {/* 🛠️ TYPE B: MINIMALIST CYBERNETIC WORKSPACE MACRO SHORTCUT CARDS */}
            {msg.type === "action_deck" && (
              <div className="w-full space-y-1.5 p-3 rounded-xl border border-zinc-900 bg-[#0e0e12]/40 shadow-inner">
                <p className="text-zinc-500 font-medium leading-relaxed text-[11px] mb-2 px-0.5">
                  {msg.text}
                </p>

                <div className="grid grid-cols-1 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("customers");
                      setChatInput("Register a new client named ");
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#111116] border border-zinc-900 text-left text-zinc-400 hover:border-zinc-800 hover:text-white transition-all group font-medium"
                  >
                    <span className="text-[11px]">
                      👥 Register Client Account
                    </span>
                    <span className="text-zinc-600 font-mono text-[9px] group-hover:text-blue-500 transition-colors">
                      [RUN]
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
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#111116] border border-zinc-900 text-left text-zinc-400 hover:border-zinc-800 hover:text-white transition-all group font-medium"
                  >
                    <span className="text-[11px]">
                      💳 Draft Financial Invoice
                    </span>
                    <span className="text-zinc-600 font-mono text-[9px] group-hover:text-blue-500 transition-colors">
                      [RUN]
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("billing");
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#111116] border border-zinc-900 text-left text-zinc-400 hover:border-zinc-800 hover:text-white transition-all group font-medium"
                  >
                    <span className="text-[11px]">
                      ⚖️ Settle Statement Ledger
                    </span>
                    <span className="text-zinc-600 font-mono text-[9px] group-hover:text-blue-500 transition-colors">
                      [RUN]
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* TYPE C: HUMAN-IN-THE-LOOP SECURE TRANSACTION APPROVAL DECK */}
            {msg.type === "approval_box" && (
              <div className="p-3.5 w-full rounded-xl border border-blue-900/30 bg-blue-950/5 text-zinc-300 space-y-3 font-medium animate-fadeIn shadow-lg">
                <div className="flex items-center space-x-2 pb-1.5 border-b border-blue-900/20">
                  <span className="text-[8px] font-mono font-black text-blue-500 tracking-widest">
                    SECURE_COMMIT_MATRIX
                  </span>
                </div>
                <p className="leading-relaxed text-zinc-400 text-[11px] font-sans">
                  {msg.text}
                </p>
                <div className="flex items-center space-x-2 pt-1 font-mono text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() =>
                      handleApproveAIAction(index, msg.action, msg.data)
                    }
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
                  >
                    EXECUTE_TRANSACTION
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
                                text: "❌ System transaction aborted by supervisor core.",
                              }
                            : m,
                        ),
                      )
                    }
                    className="bg-[#0e0e12] border border-zinc-900 hover:border-zinc-800 text-zinc-500 px-3 py-2 rounded-lg transition-colors"
                  >
                    ABORT
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* CYBERNETIC THINKING RADAR STATUS COMPILER */}
        {chatLoading && (
          <div className="flex flex-col space-y-1.5 items-start">
            <div className="flex items-center space-x-2 px-1">
              <span className="text-[8px] font-mono tracking-widest font-black text-blue-500 uppercase">
                COBALT_VECTOR_RESPONSE //
              </span>
            </div>
            <div className="pl-3.5 py-1 text-zinc-500 font-mono text-[10px] flex items-center space-x-2 border-l-2 border-zinc-800 bg-gradient-to-r from-zinc-900/20 to-transparent">
              <span className="inline-block w-1 h-1 bg-blue-500 rounded-full animate-ping" />
              <span>PARSING_INTENT_TELEMETRY...</span>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* 💻 MINIMALIST PROMPT INPUT FORM TRAY */}
      <form
        onSubmit={handleSendChatMessage}
        className="p-4 border-t border-zinc-900 flex items-center space-x-2 bg-[#0e0e12]"
      >
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          disabled={chatLoading}
          placeholder={
            chatLoading
              ? "Locking pipeline frames..."
              : "Input dynamic terminal statement..."
          }
          className="flex-1 text-xs border border-zinc-900 rounded-xl px-3 py-2.5 bg-[#070709] text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-700 disabled:opacity-40 font-mono tracking-wide transition-colors"
        />
        <button
          type="submit"
          disabled={chatLoading || !chatInput.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-black px-4 py-2.5 rounded-xl transition-all shadow-[0_4px_15px_rgba(37,99,235,0.2)] text-[10px] font-mono uppercase tracking-wider shrink-0"
        >
          RUN
        </button>
      </form>
    </div>
  );
}
