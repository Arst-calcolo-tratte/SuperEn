import React from "react";
import { Ball } from "./Ball";

const fmtDate = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
  } catch {
    return iso;
  }
};

export const Archive = ({ game, draws }) => {
  const rows = (draws || []).slice(0, 12);
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-5 sm:p-6 h-full" data-testid="archive-section">
      <h3 className="font-heading text-lg sm:text-xl font-bold mb-4">Archivio Estrazioni</h3>
      <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1" data-testid="archive-draws-list">
        {rows.map((d, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 hover:bg-white/[0.06] transition-colors"
            data-testid={`archive-draw-${i}`}
          >
            <div className="w-14 shrink-0 leading-tight">
              <div className="text-xs font-mono-num text-slate-200">{fmtDate(d.date)}</div>
              <div className="text-[10px] text-slate-500">n° {d.concorso ?? "—"}</div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {d.main.slice(0, 10).map((n, j) => (
                <Ball key={j} value={n} type={game} size="compact" />
              ))}
              {d.main.length > 10 && (
                <span className="text-xs text-slate-500 self-center">+{d.main.length - 10}</span>
              )}
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="text-center text-slate-500 text-sm py-6">Nessuna estrazione.</div>
        )}
      </div>
    </div>
  );
};
