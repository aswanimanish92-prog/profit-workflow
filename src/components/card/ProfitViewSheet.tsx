"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { BottomSheet } from "@/components/shell/BottomSheet";
import { useMockData } from "@/context/MockDataContext";
import { fillPrompt } from "@/lib/profitView";
import { cn } from "@/lib/utils";
import { MaiAvatar } from "./Mai";
import type { ResolvedProfitView } from "@/types/mockData";

/** MAI's first-tap question: which timeframe the merchant wants on the Home card. */
export function ProfitViewSheet() {
  const { data, profitView, profitPromptOpen, answerProfitView, closeProfitPrompt } = useMockData();
  const { prompt } = data.profitView;
  const days = profitView.completeness.daysLoggedInMonth;
  // Brief tick on the chosen option before the sheet closes.
  const [picked, setPicked] = useState<ResolvedProfitView | null>(null);

  const pick = (mode: ResolvedProfitView) => {
    if (picked) return;
    setPicked(mode);
    setTimeout(() => {
      answerProfitView(mode);
      setPicked(null);
    }, 350);
  };

  return (
    <BottomSheet open={profitPromptOpen} onClose={closeProfitPrompt} label="How do you track your profit?">
      <div className="flex items-center gap-2.5">
        <MaiAvatar />
        <div className="text-[13px] font-semibold text-[#5B6170]">MAI</div>
      </div>
      <h2 className="mt-3 text-lg font-bold leading-6 text-[#16181D]">{prompt.title}</h2>
      <p className="mt-1 text-sm text-[#5B6170]">{prompt.subtitle}</p>
      <div role="radiogroup" aria-label={prompt.title} className="mt-5 flex flex-col gap-2.5">
        {prompt.options.map((o) => {
          const on = picked === o.mode;
          return (
            <button
              key={o.mode}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => pick(o.mode)}
              className={cn(
                "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-semibold transition-colors",
                on ? "border-[#1D4FD7] bg-[#EEF4FF] text-[#1D4FD7]" : "border-[#E4E4E0] text-[#16181D] active:bg-[#F4F4F1]",
              )}
            >
              {fillPrompt(o.label, data.profitView, days)}
              <span
                className={cn(
                  "grid size-5 flex-none place-items-center rounded-full border-2",
                  on ? "border-[#1D4FD7] bg-[#1D4FD7]" : "border-[#C9CBD1]",
                )}
              >
                {on && <Check className="size-3 text-white" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-[#8A909C]">You can switch any time with the toggle on the card.</p>
    </BottomSheet>
  );
}
