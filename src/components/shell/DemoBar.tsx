"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { useMockData } from "@/context/MockDataContext";
import { cn } from "@/lib/utils";
import type { Lifecycle, ResolvedProfitView } from "@/types/mockData";

const ANSWER_LABELS: Record<ResolvedProfitView, string> = {
  mtd_till_date: "Month till today",
  today: "Only today",
  active_days: "Only recorded days",
};

/** Floating bar for live stakeholder demos: lifecycle, first-tap prompt reset and the answers given so far. */
export function DemoBar() {
  const m = useMockData();
  const [open, setOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const lifecycles = Object.keys(m.data.profitView.lifecycles) as Lifecycle[];
  const counts = m.feedbackLog.reduce<Partial<Record<ResolvedProfitView, number>>>(
    (c, e) => ({ ...c, [e.mode]: (c[e.mode] ?? 0) + 1 }),
    {},
  );

  return (
    <div className="fixed left-1/2 top-2 z-50 w-max max-w-[calc(100vw-16px)] -translate-x-1/2 text-xs">
      <div className="rounded-2xl border border-[#DCDCD6] bg-white/95 shadow-lg backdrop-blur">
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex w-full items-center justify-center gap-1.5 px-3 py-1.5 font-bold text-[#1D4FD7]"
        >
          Demo · {m.data.profitView.lifecycles[m.lifecycle].label}
          {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>

        {open && (
          <div className="flex flex-col gap-2.5 border-t border-[#ECECE8] p-3">
            <div>
              <div className="mb-1 font-semibold text-[#5B6170]">Customer lifecycle</div>
              <div role="radiogroup" aria-label="Customer lifecycle" className="flex rounded-full bg-[#F1F1EE] p-0.5 font-semibold">
                {lifecycles.map((l) => (
                  <button
                    key={l}
                    role="radio"
                    aria-checked={m.lifecycle === l}
                    onClick={() => m.setLifecycle(l)}
                    className={cn(
                      "flex-1 rounded-full px-3 py-1.5 transition-all",
                      m.lifecycle === l ? "bg-white text-[#16181D] shadow-sm" : "text-[#5B6170]",
                    )}
                  >
                    {m.data.profitView.lifecycles[l].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={m.resetProfitView}
                className="flex items-center gap-1.5 rounded-full border border-[#DCDCD6] px-3 py-1.5 font-semibold text-[#16181D]"
              >
                <RotateCcw className="size-3" /> Reset 1st-click prompt
              </button>
              <span className="text-[#8A909C]">
                {m.profitViewPref.answeredAt ? `Answered: ${ANSWER_LABELS[m.profitViewPref.mode as ResolvedProfitView] ?? "—"}` : "Not asked yet"}
              </span>
            </div>

            <div>
              <button onClick={() => setLogOpen(!logOpen)} className="flex items-center gap-1 font-semibold text-[#5B6170]">
                Feedback log ({m.feedbackLog.length}) {logOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              </button>
              {logOpen && (
                <div className="mt-1.5 rounded-lg bg-[#F7F7F5] p-2">
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(ANSWER_LABELS) as ResolvedProfitView[]).map((k) => (
                      <span key={k} className="rounded-full bg-white px-2 py-0.5 font-semibold text-[#16181D]">
                        {ANSWER_LABELS[k]}: {counts[k] ?? 0}
                      </span>
                    ))}
                  </div>
                  <ol className="mt-2 max-h-36 overflow-y-auto">
                    {[...m.feedbackLog].reverse().map((e) => (
                      <li key={e.at} className="flex justify-between gap-3 border-t border-[#ECECE8] py-1 text-[#3F4451]">
                        <span>{ANSWER_LABELS[e.mode]}</span>
                        <span className="text-[#8A909C]">
                          {m.data.profitView.lifecycles[e.lifecycle]?.label.split(" (")[0]} ·{" "}
                          {new Date(e.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </span>
                      </li>
                    ))}
                    {!m.feedbackLog.length && <li className="py-1 text-[#8A909C]">No answers yet.</li>}
                  </ol>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#8A909C]">
                    <span>This device only. All testers&apos; answers go to the analytics sheet.</span>
                    {m.feedbackLog.length > 0 && (
                      <button onClick={m.clearFeedbackLog} className="font-semibold underline">
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
