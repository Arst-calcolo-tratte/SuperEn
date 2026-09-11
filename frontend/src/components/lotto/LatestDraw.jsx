import React from "react";
import { Copy, Trophy, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Ball } from "./Ball";

const fmtDate = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

export const LatestDraw = ({ game, draw }) => {
  if (!draw) {
    return (
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-8 text-center text-slate-400">
        Nessuna estrazione disponibile.
      </div>
    );
  }

  const copy = () => {
    const parts = [draw.main.join(" - ")];
    if (draw.jolly != null) parts.push(`Jolly: ${draw.jolly}`);
    if (draw.superstar != null) parts.push(`SuperStar: ${draw.superstar}`);
    if (draw.oro?.length) parts.push(`Oro: ${draw.oro.join(", ")}`);
    navigator.clipboard.writeText(parts.join(" | "));
    toast.success("Numeri copiati negli appunti");
  };

  return (
    <div
      className="relative rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 backdrop-blur-xl p-5 sm:p-7 overflow-hidden"
      data-testid="latest-draw-card"
    >
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="flex items-start justify-between gap-4 mb-6 relative">
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-400 font-mono-num">
            Ultima estrazione
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="font-heading text-lg sm:text-xl font-bold">
              Concorso n° {draw.concorso ?? "—"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-1 capitalize">
            <Calendar className="w-3.5 h-3.5" />
            {fmtDate(draw.date)}
          </div>
        </div>
        <button
          data-testid="copy-numbers-btn"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 hover:border-emerald-400/50 hover:bg-white/[0.05] px-3 py-2 text-xs font-medium text-slate-300 transition-all"
        >
          <Copy className="w-3.5 h-3.5" /> Copia
        </button>
      </div>

      <div className="flex flex-wrap gap-2.5 sm:gap-3 relative" data-testid="latest-draw-numbers-container">
        {draw.main.map((n, i) => (
          <Ball key={i} value={n} type={game} size="hero" testid={`ball-number-${i}`} />
        ))}
      </div>

      {(draw.jolly != null || draw.superstar != null || draw.oro?.length > 0) && (
        <div className="flex flex-wrap items-center gap-5 mt-6 pt-5 border-t border-white/10 relative">
          {draw.jolly != null && (
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-pink-300 font-semibold">Jolly</span>
              <Ball value={draw.jolly} type="jolly" testid="jolly-ball" />
            </div>
          )}
          {draw.superstar != null && (
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-amber-300 font-semibold">SuperStar</span>
              <Ball value={draw.superstar} type="superstar" testid="superstar-ball" />
            </div>
          )}
          {draw.oro?.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-yellow-300 font-semibold">Oro</span>
              {draw.oro.map((n, i) => (
                <Ball key={i} value={n} type="oro" testid={`oro-ball-${i}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
