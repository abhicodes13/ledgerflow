import React from "react";

export function ClientForm({
  clientName,
  setClientName,
  clientEmail,
  setClientEmail,
  clientSubmitting,
  clientMessage,
  onSubmit,
}) {
  return (
    <section className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4 flex flex-col justify-between">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          // Register Client
        </h3>
        <p className="text-[11px] text-slate-500">
          Inject buyer rows directly to your database roledex.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-3 text-xs">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">
            Client Name
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g. Wally West"
            className="w-full border border-slate-900 rounded-xl px-3 py-2 bg-slate-900 text-white focus:outline-none focus:border-zinc-700 transition-all font-medium placeholder:text-slate-700"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">
            Email Address
          </label>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="e.g. wally@west.com"
            className="w-full border border-slate-900 rounded-xl px-3 py-2 bg-slate-900 text-white focus:outline-none focus:border-zinc-700 transition-all font-medium placeholder:text-slate-700"
          />
        </div>
        <button
          type="submit"
          disabled={clientSubmitting}
          className="w-full bg-zinc-100 hover:bg-zinc-200 text-[#09090b] font-bold py-2 rounded-xl transition-all shadow-sm font-semibold disabled:opacity-50"
        >
          {clientSubmitting ? "Saving..." : "Save Profile"}
        </button>
      </form>
      {clientMessage.text && (
        <div
          className={`p-2.5 rounded-xl border text-[11px] font-mono ${clientMessage.isError ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}
        >
          {clientMessage.text}
        </div>
      )}
    </section>
  );
}
