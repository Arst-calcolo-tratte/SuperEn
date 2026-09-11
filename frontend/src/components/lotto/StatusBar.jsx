import React from "react";
import { RefreshCw, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

const fmt = (iso) => {
  if (!iso) return "mai";
  try {
    const d = new Date(iso);
    return d.toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

export const StatusBar = ({ meta, updating, onUpdate }) => {
  const status = meta?.status || "empty";
  const isError = status === "error";

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-4 sm:p-5"
      data-testid="status-bar"
    >
      <div className="flex items-center gap-3" data-testid="status-update-indicator">
        {isError ? (
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
        ) : (
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
          </span>
        )}
        <div className="leading-tight">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {isError ? (
              <span className="text-red-400">Aggiornamento non riuscito</span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Dati aggiornati
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5" data-testid="timestamp-last-update">
            <Clock className="w-3 h-3" />
            Ultimo aggiornamento: {fmt(meta?.last_updated)}
          </div>
          {isError && (
            <div className="text-xs text-red-400/80 mt-1 max-w-md truncate">
              {meta?.error}
            </div>
          )}
        </div>
      </div>

      <button
        data-testid="btn-force-update"
        onClick={onUpdate}
        disabled={updating}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-wait text-emerald-950 font-heading font-bold px-5 py-2.5 text-sm transition-all duration-200 hover:shadow-[0_0_24px_rgba(16,185,129,0.5)]"
      >
        <RefreshCw className={`w-4 h-4 ${updating ? "animate-spin" : ""}`} />
        {updating ? "Aggiornamento..." : "Aggiorna"}
      </button>
    </div>
  );
};
