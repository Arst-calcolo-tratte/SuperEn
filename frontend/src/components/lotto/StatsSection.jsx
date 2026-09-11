import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Flame, Snowflake } from "lucide-react";
import { GAMES } from "@/constants/games";

const CustomTooltip = ({ active, payload, unit }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg bg-slate-900/95 border border-white/15 px-3 py-2 text-xs shadow-xl">
      <div className="font-mono-num font-bold text-slate-100">Numero {p.number}</div>
      <div className="text-slate-400">
        {unit === "delay" ? `${p.value} estrazioni di ritardo` : `Uscito ${p.value} volte`}
      </div>
    </div>
  );
};

export const StatsSection = ({ game, stats }) => {
  const [tab, setTab] = useState("frequent");
  const g = GAMES[game];

  const frequent = (stats?.frequent || []).slice(0, 15).map((x) => ({ number: x.number, value: x.count }));
  const late = (stats?.late || []).slice(0, 15).map((x) => ({ number: x.number, value: x.delay }));
  const data = tab === "frequent" ? frequent : late;
  const color = tab === "frequent" ? g.chart : g.chartLate;

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-5 sm:p-6 h-full" data-testid="stats-section">
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h3 className="font-heading text-lg sm:text-xl font-bold">Laboratorio Statistiche</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Su {stats?.total_draws || 0} estrazioni analizzate
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10">
          <button
            data-testid="stats-tab-frequent"
            onClick={() => setTab("frequent")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === "frequent" ? "bg-emerald-500 text-emerald-950" : "text-slate-400 hover:text-slate-100"
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> Frequenti
          </button>
          <button
            data-testid="stats-tab-late"
            onClick={() => setTab("late")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === "late" ? "bg-amber-500 text-amber-950" : "text-slate-400 hover:text-slate-100"
            }`}
          >
            <Snowflake className="w-3.5 h-3.5" /> Ritardatari
          </button>
        </div>
      </div>

      <div className="h-[300px]" data-testid={tab === "frequent" ? "stats-frequent-chart" : "stats-late-chart"}>
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            Nessun dato statistico disponibile.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="number"
                width={28}
                tick={{ fill: "#94a3b8", fontSize: 12, fontFamily: "JetBrains Mono" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<CustomTooltip unit={tab === "late" ? "delay" : "count"} />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={14}>
                {data.map((_, i) => (
                  <Cell key={i} fill={color} fillOpacity={1 - i * 0.045} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
