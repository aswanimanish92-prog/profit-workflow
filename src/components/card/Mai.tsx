"use client";

import { Sparkles } from "lucide-react";
import { useProfitPerspective } from "@/context/MockDataContext";
import { cn } from "@/lib/utils";

export function MaiAvatar({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("grid size-9 flex-none place-items-center rounded-full bg-gradient-to-br from-[#1D4FD7] to-[#7C3AED] text-sm font-bold text-white", className)}
    >
      M
    </div>
  );
}

/** MAI's running profit quote on Home. Same timeframe, numbers and masking as the card above it. */
export function MaiBanner({ hidden }: { hidden?: boolean }) {
  const { view, quote } = useProfitPerspective(hidden);
  return (
    <div data-coach="mai" className="mt-2.5 flex items-start gap-2.5 rounded-2xl bg-[#EEF1FF] px-3.5 py-3">
      <MaiAvatar className="size-7 text-xs" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-xs font-semibold text-[#4338CA]">
          MAI <Sparkles className="size-3" />
        </div>
        <p key={view.resolved} className="mt-0.5 text-[13px] leading-[18px] text-[#16181D] animate-in fade-in duration-300">
          {quote}
        </p>
      </div>
    </div>
  );
}
