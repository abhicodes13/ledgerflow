import React from "react";

export function ClientForm({
  clientName,
  setClientName,
  clientEmail,
  setClientEmail,
  clientMessage,
  handleClientSubmit,
}) {
  return (
    <div className="p-6 rounded-xl border bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 space-y-5 font-sans shadow-sm transition-colors duration-150">
      <div className="space-y-0.5">
        <h3 className="text-xs font-bold text-zinc-950 dark:text-zinc-50 uppercase font-mono tracking-wider">
          Register Account Profile
        </h3>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
          Provision isolated multi-tenant data records
        </p>
      </div>

      <form onSubmit={handleClientSubmit} className="space-y-4 text-xs">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase font-mono">
            Customer / Company Entity
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g. Acme Corporation"
            className="w-full rounded-lg px-4 py-3 bg-zinc-50 text-zinc-900 border border-zinc-200 dark:bg-zinc-950 dark:text-zinc-50 dark:border-zinc-800 placeholder-zinc-400 focus:outline-none transition-colors duration-150 text-[11px] font-medium"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase font-mono">
            Target Billing Email
          </label>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="billing@acme.com"
            className="w-full rounded-lg px-4 py-3 bg-zinc-50 text-zinc-900 border border-zinc-200 dark:bg-zinc-950 dark:text-zinc-50 dark:border-zinc-800 placeholder-zinc-400 focus:outline-none transition-colors duration-150 text-[11px] font-medium"
          />
        </div>

        {clientMessage?.text && (
          <div
            className={`p-3 rounded-lg border font-medium text-[11px] ${clientMessage.isError ? "bg-red-500/5 border-red-500/10 text-red-400" : "bg-emerald-500/5 border-emerald-500/10 text-emerald-400"}`}
          >
            {clientMessage.text}
          </div>
        )}

        <button
          type="submit"
          disabled={!clientName.trim() || !clientEmail.trim()}
          className="w-full py-3 rounded-lg font-bold bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 disabled:bg-zinc-100 dark:disabled:bg-zinc-800/40 disabled:text-zinc-400 dark:disabled:text-zinc-500 transition-colors text-xs uppercase tracking-wider shadow-sm"
        >
          Save Entity Profile
        </button>
      </form>
    </div>
  );
}
