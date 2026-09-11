export const GAMES = {
  superenalotto: {
    id: "superenalotto",
    name: "SuperEnalotto",
    tag: "6 numeri · 1-90",
    accent: "emerald",
    accentHex: "#10B981",
    dot: "bg-emerald-400",
    activeTab: "bg-emerald-500 text-emerald-950 shadow-[0_0_24px_rgba(16,185,129,0.45)]",
    chart: "#10B981",
    chartLate: "#f59e0b",
  },
  vincicasa: {
    id: "vincicasa",
    name: "VinciCasa",
    tag: "5 numeri · 1-40",
    accent: "blue",
    accentHex: "#3B82F6",
    dot: "bg-blue-400",
    activeTab: "bg-blue-500 text-blue-950 shadow-[0_0_24px_rgba(59,130,246,0.45)]",
    chart: "#3B82F6",
    chartLate: "#f59e0b",
  },
  "10elotto": {
    id: "10elotto",
    name: "10eLotto",
    tag: "20 numeri · Oro",
    accent: "purple",
    accentHex: "#8B5CF6",
    dot: "bg-purple-400",
    activeTab: "bg-purple-500 text-purple-950 shadow-[0_0_24px_rgba(139,92,246,0.45)]",
    chart: "#8B5CF6",
    chartLate: "#f59e0b",
  },
};

export const GAME_ORDER = ["superenalotto", "vincicasa", "10elotto"];

export const BALL_STYLES = {
  superenalotto:
    "bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-950 text-white ring-1 ring-emerald-300/40 shadow-[0_4px_12px_rgba(16,185,129,0.35)]",
  vincicasa:
    "bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-950 text-white ring-1 ring-blue-300/40 shadow-[0_4px_12px_rgba(59,130,246,0.35)]",
  "10elotto":
    "bg-gradient-to-br from-purple-400 via-purple-600 to-purple-950 text-white ring-1 ring-purple-300/40 shadow-[0_4px_12px_rgba(139,92,246,0.35)]",
  jolly:
    "bg-gradient-to-br from-pink-400 via-rose-600 to-rose-950 text-white ring-2 ring-pink-300/60 shadow-[0_4px_12px_rgba(236,72,153,0.4)]",
  superstar:
    "bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-800 text-slate-950 ring-2 ring-amber-200/80 shadow-[0_4px_14px_rgba(245,158,11,0.5)]",
  oro:
    "bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-900 text-slate-950 ring-2 ring-yellow-200 shadow-[0_4px_12px_rgba(234,179,8,0.5)]",
};
