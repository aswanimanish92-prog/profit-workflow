"use client";

import { CalendarPlus } from "lucide-react";
import { useMockData, useProfitPerspective } from "@/context/MockDataContext";
import { missingDays } from "@/lib/profitView";
import { cn } from "@/lib/utils";

/** New users: which days this month have no record, and a nudge to add them before trusting the month total. */
export function MissingDays({ onAdd }: { onAdd: () => void }) {
  const { data } = useMockData();
  const { view } = useProfitPerspective();
  if (!view.partial) return null;
  const missing = missingDays(view);
  if (!missing.length) return null;
  const { daysElapsedInMonth, loggedDays } = view.completeness;

  return (
    <section data-coach="missing" className="rounded-2xl border border-[#FAD7A5] bg-[#FFF8EC] p-4">
      <p className="text-[13px] font-semibold leading-[18px] text-[#7C2D12]">
        {data.profitView.missingNudge.replace("{missing}", `${missing.length} day${missing.length === 1 ? "" : "s"}`)}
      </p>
      <div className="mt-3 grid grid-cols-11 gap-1" aria-label={`${loggedDays.length} of ${daysElapsedInMonth} days recorded`}>
        {Array.from({ length: daysElapsedInMonth }, (_, i) => i + 1).map((d) => {
          const logged = loggedDays.includes(d);
          return (
            <span
              key={d}
              title={`${d} ${data.profitView.monthShort}${logged ? "" : ": no record"}`}
              className={cn(
                "grid h-6 place-items-center rounded-md text-[10px] font-semibold",
                logged ? "bg-[#1D4FD7] text-white" : "border border-dashed border-[#E8A14A] text-[#B45309]",
                d === daysElapsedInMonth && "ring-2 ring-[#1D4FD7]/30",
              )}
            >
              {d}
            </span>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-3 text-[11px] text-[#5B6170]">
          <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-[#1D4FD7]" /> Recorded</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-sm border border-dashed border-[#E8A14A]" /> Missing</span>
        </span>
        <button onClick={onAdd} className="flex h-9 items-center gap-1.5 rounded-full bg-[#16181D] px-3.5 text-xs font-bold text-white">
          <CalendarPlus className="size-3.5" /> Add missing days
        </button>
      </div>
    </section>
  );
}
