import React from "react";
import { GAME_ORDER, GAMES } from "@/constants/games";

export const GameSelector = ({ active, onChange }) => {
  return (
    <div
      className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl"
      data-testid="game-selector"
    >
      {GAME_ORDER.map((id) => {
        const g = GAMES[id];
        const isActive = active === id;
        return (
          <button
            key={id}
            data-testid={`game-selector-${id}`}
            onClick={() => onChange(id)}
            className={`relative flex-1 min-w-[130px] px-4 py-3 rounded-xl font-heading font-semibold text-sm sm:text-base transition-all duration-300 ${
              isActive
                ? g.activeTab
                : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]"
            }`}
          >
            <span className="block">{g.name}</span>
            <span
              className={`block text-[10px] sm:text-xs font-normal mt-0.5 ${
                isActive ? "opacity-80" : "opacity-50"
              }`}
            >
              {g.tag}
            </span>
          </button>
        );
      })}
    </div>
  );
};
