import React, { useState } from "react";
import { Wand2, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import { Ball } from "./Ball";
import { generateTickets } from "@/lib/api";
import { GAMES } from "@/constants/games";

const STRATEGIES = [
  { id: "random", label: "Casuale" },
  { id: "frequent", label: "Frequenti" },
  { id: "late", label: "Ritardatari" },
  { id: "balanced", label: "Bilanciato" },
];

export const Generator = ({ game }) => {
  const [strategy, setStrategy] = useState("random");
  const [count, setCount] = useState(2);
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const g = GAMES[game];

  const generate = async () => {
    setLoading(true);
    try {
      const res = await generateTickets({ game, strategy, tickets: count });
      setTickets(res.tickets || []);
      toast.success(`${res.tickets.length} schedine generate`);
    } catch (e) {
      toast.error("Errore nella generazione delle schedine");
    } finally {
      setLoading(false);
    }
  };

  const copyTicket = (t) => {
    let s = t.main.join(" - ");
    if (t.superstar != null) s += ` | SuperStar: ${t.superstar}`;
    navigator.clipboard.writeText(s);
    toast.success("Schedina copiata");
  };

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-5 sm:p-6" data-testid="generator-section">
      <div className="flex items-center gap-2 mb-1">
        <Wand2 className="w-5 h-5 text-emerald-400" />
        <h3 className="font-heading text-lg sm:text-xl font-bold">Generatore Schedine</h3>
      </div>
      <p className="text-xs text-slate-400 mb-5">Crea giocate per {g.name} basate su strategia.</p>

      <div className="flex flex-wrap gap-4 items-end mb-5">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Strategia</label>
          <div className="flex flex-wrap gap-1.5" data-testid="generator-strategy-select">
            {STRATEGIES.map((s) => (
              <button
                key={s.id}
                data-testid={`generator-strategy-${s.id}`}
                onClick={() => setStrategy(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  strategy === s.id
                    ? "bg-emerald-500 text-emerald-950"
                    : "bg-white/[0.04] border border-white/10 text-slate-300 hover:bg-white/[0.08]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Schedine</label>
          <input
            data-testid="generator-count-input"
            type="number"
            min={1}
            max={10}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
            className="w-20 rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          data-testid="generator-generate-btn"
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-emerald-950 font-heading font-bold px-5 py-2.5 text-sm transition-all hover:shadow-[0_0_24px_rgba(16,185,129,0.5)]"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          Genera
        </button>
      </div>

      <div className="space-y-3" data-testid="generated-ticket-display">
        {tickets.map((t, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 flex-wrap rounded-xl bg-gradient-to-r from-white/[0.05] to-transparent border border-white/10 border-dashed p-3.5"
            data-testid={`generated-ticket-${i}`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono-num text-xs text-slate-500 w-8">#{i + 1}</span>
              {t.main.map((n, j) => (
                <Ball key={j} value={n} type={game} size="compact" />
              ))}
              {t.superstar != null && (
                <>
                  <span className="text-[10px] text-amber-300 ml-1">SS</span>
                  <Ball value={t.superstar} type="superstar" size="compact" />
                </>
              )}
            </div>
            <button
              onClick={() => copyTicket(t)}
              className="text-slate-400 hover:text-emerald-400 transition-colors"
              data-testid={`copy-ticket-${i}`}
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        ))}
        {tickets.length === 0 && (
          <div className="text-center text-slate-500 text-sm py-6 border border-dashed border-white/10 rounded-xl">
            Premi "Genera" per creare le tue schedine.
          </div>
        )}
      </div>
    </div>
  );
};
