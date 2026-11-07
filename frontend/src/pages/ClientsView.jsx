import React from "react";
import { ClientForm } from "../components/ClientForm";

export function ClientsView({ data, handleClientSubmitInternal }) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <ClientForm
        clientName={data.clientName}
        setClientName={data.setClientName}
        clientEmail={data.clientEmail}
        setClientEmail={data.setClientEmail}
        clientMessage={data.clientMessage}
        handleClientSubmit={handleClientSubmitInternal}
      />

      {/* Accounts List View */}
      <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#1c1c1e]/75 border border-zinc-100 dark:border-zinc-800/40 space-y-3 shadow-sm backdrop-blur-md transition-colors">
        <h3 className="text-xs font-bold tracking-tight text-zinc-900 dark:text-white uppercase font-sans border-b border-zinc-100/50 dark:border-zinc-800/30 pb-2">
          Registered Accounts Directory
        </h3>
        <div className="space-y-1.5 text-xs overflow-y-auto max-h-[320px]">
          {data.clientsList.map((client) => (
            <div
              key={client.id}
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 border border-transparent hover:border-zinc-100/40 dark:hover:border-zinc-800/30 transition-colors"
            >
              <div>
                <p className="font-bold text-zinc-900 dark:text-white">
                  {client.name}
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono font-medium">
                  {client.email}
                </p>
              </div>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 font-mono">
                ID: #{client.id}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
