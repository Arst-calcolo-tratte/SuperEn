import React from "react";
import { BALL_STYLES } from "@/constants/games";

const SIZES = {
  compact: "w-8 h-8 text-xs",
  standard: "w-11 h-11 sm:w-12 sm:h-12 text-base sm:text-lg",
  hero: "w-14 h-14 sm:w-16 sm:h-16 text-xl sm:text-2xl",
};

export const Ball = ({ value, type = "superenalotto", size = "standard", testid }) => {
  return (
    <div
      data-testid={testid}
      className={`${SIZES[size]} ${BALL_STYLES[type] || BALL_STYLES.superenalotto} font-mono-num font-extrabold rounded-full flex items-center justify-center shrink-0 select-none transition-transform duration-200 hover:scale-110 hover:-translate-y-0.5`}
    >
      {value}
    </div>
  );
};
