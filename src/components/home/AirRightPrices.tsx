"use client";

import { useState } from "react";
import { MUMBAI_AIR_RIGHT_TICKER } from "@/config/mumbai";

export default function AirRightPrices() {
  const [isPaused, setIsPaused] = useState(false);
  const items = [...MUMBAI_AIR_RIGHT_TICKER, ...MUMBAI_AIR_RIGHT_TICKER, ...MUMBAI_AIR_RIGHT_TICKER];

  return (
    <div className="overflow-hidden border-b border-line bg-ink">
      <div className="mx-auto flex max-w-6xl items-center gap-5 px-4 py-3.5 md:px-5">
        <div className="whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.18em] text-white/55">
          Air rights
        </div>
        <div
          className="flex-1 overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className="flex w-max items-center gap-10 animate-ticker"
            style={{ animationPlayState: isPaused ? "paused" : "running" }}
          >
            {items.map((item, index) => (
              <div
                key={`${item.city}-${index}`}
                className="flex items-center gap-2 whitespace-nowrap text-sm"
              >
                <span className="text-white/45">{item.city}</span>
                <span className={item.isUp ? "font-medium text-[#9BE0BF]" : "font-medium text-[#F0B59A]"}>
                  {item.price}
                  <span className="ml-1 opacity-70">{item.isUp ? "↑" : "↓"}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
