import { useEffect, useState, useCallback } from "react";
import "@/App.css";
import { Toaster, toast } from "sonner";
import { Ticket } from "lucide-react";
import { GameSelector } from "@/components/lotto/GameSelector";
import { StatusBar } from "@/components/lotto/StatusBar";
import { LatestDraw } from "@/components/lotto/LatestDraw";
import { StatsSection } from "@/components/lotto/StatsSection";
import { Generator } from "@/components/lotto/Generator";
import { Archive } from "@/components/lotto/Archive";
import { getResults, getStats, getStatus, triggerUpdate } from "@/lib/api";

function App() {
  const [game, setGame] = useState("superenalotto");
  const [results, setResults] = useState(null);
  const [stats, setStats] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async (g) => {
    setLoading(true);
    try {
      const [res, st, status] = await Promise.all([
        getResults(g, 30),
        getStats(g),
        getStatus(),
      ]);
      setResults(res);
      setStats(st);
      setMeta(status[g] || res.meta);
    } catch (e) {
      toast.error("Impossibile caricare i dati dal server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(game);
  }, [game, load]);

  const handleUpdate = async () => {
    setUpdating(true);
    const t = toast.loading("Aggiornamento risultati in corso...");
    try {
      const res = await triggerUpdate(game);
      const r = res.results?.[game];
      if (r?.status === "ok") {
        toast.success(`Aggiornato: ${r.total} estrazioni disponibili`, { id: t });
      } else {
        toast.error(`Aggiornamento non riuscito: ${r?.error || "errore"}`, { id: t });
      }
      await load(game);
    } catch (e) {
      toast.error("Errore di connessione durante l'aggiornamento", { id: t });
    } finally {
      setUpdating(false);
    }
  };

  const latest = results?.draws?.[0];

  return (
    <div className="min-h-screen bg-[#090D14] text-slate-100 relative overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.4)]">
              <Ticket className="w-6 h-6 text-emerald-950" />
            </div>
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight">
                Lotto Laboratorio
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Risultati, statistiche e generatore schedine
              </p>
            </div>
          </div>
        </header>

        <GameSelector active={game} onChange={setGame} />
        <StatusBar meta={meta} updating={updating} onUpdate={handleUpdate} />

        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-500" data-testid="loading-indicator">
            Caricamento dati...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <LatestDraw game={game} draw={latest} />
              </div>
              <div className="lg:col-span-5">
                <StatsSection game={game} stats={stats} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <Generator game={game} />
              </div>
              <div className="lg:col-span-4">
                <Archive game={game} draws={results?.draws} />
              </div>
            </div>
          </>
        )}

        <footer className="text-center text-xs text-slate-600 pt-4">
          Dati aggiornati automaticamente dal server · Fonte: estrazionedellotto.it
        </footer>
      </div>

      <Toaster theme="dark" position="top-center" richColors />
    </div>
  );
}

export default App;
