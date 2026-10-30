"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useMockData, useProfitPerspective } from "@/context/MockDataContext";
import { fillView } from "@/lib/profitView";
import type { CoachMark } from "@/types/mockData";

const PAD = 6;
const GAP = 12;
/** Rough bubble height, to decide whether it fits beside the spotlight. */
const BUBBLE = 170;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Step-by-step spotlight scoped to the phone frame. Each step targets a data-coach element;
 * steps whose element isn't on the current screen state are skipped.
 */
export function CoachMarks({
  marks,
  variant,
  onDone,
}: {
  marks: CoachMark[];
  /** Screen variant; steps with a matching entry in `variants` use that body instead. */
  variant?: string;
  onDone: () => void;
}) {
  const host = useSyncExternalStore(
    noopSubscribe,
    () => document.getElementById("phone-overlay"),
    () => null,
  );
  const [steps, setSteps] = useState<CoachMark[]>([]);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const step = steps[index];
  const { data } = useMockData();
  const { view } = useProfitPerspective();

  // Pick the steps whose slot is on screen once the card has rendered.
  useEffect(() => {
    const t = setTimeout(() => setSteps(marks.filter((m) => findTarget(m.target))), 300);
    return () => clearTimeout(t);
  }, [marks]);

  const measure = useCallback(() => {
    if (!step || !host) return;
    const el = findTarget(step.target);
    if (!el) return setRect(null);
    const a = el.getBoundingClientRect();
    const o = host.getBoundingClientRect();
    setRect({ top: a.top - o.top - PAD, left: a.left - o.left - PAD, width: a.width + PAD * 2, height: a.height + PAD * 2 });
  }, [step, host]);

  useEffect(() => {
    if (!step) return;
    findTarget(step.target)?.scrollIntoView({ block: "center", behavior: "smooth" });
    const raf = requestAnimationFrame(measure);
    const t = setTimeout(measure, 350);
    const scroller = document.getElementById("phone-scroll");
    scroller?.addEventListener("scroll", measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      scroller?.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [step, measure]);

  const last = index === steps.length - 1;
  const next = useCallback(() => (last ? onDone() : setIndex((i) => i + 1)), [last, onDone]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDone();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, onDone]);

  if (!host || !step || !rect) return null;

  // Put the bubble on whichever side of the spotlight has more room; pin it to the bottom if neither fits.
  const below = rect.top + rect.height / 2 < host.clientHeight / 2;
  const room = below ? host.clientHeight - rect.top - rect.height : rect.top;
  const place =
    room < BUBBLE + GAP
      ? { bottom: GAP }
      : below
        ? { top: rect.top + rect.height + GAP }
        : { bottom: host.clientHeight - rect.top + GAP };
  // Copy follows the profit timeframe the merchant sees; "partial" (few days logged) wins.
  const byView = (view.partial && step.byView?.partial) || step.byView?.[view.resolved];
  const title = fillView(byView?.title ?? step.title, view, data.profitView);
  const body = fillView((variant && step.variants?.[variant]) || byView?.body || step.body, view, data.profitView);

  return createPortal(
    <div className="pointer-events-auto absolute inset-0 z-50">
      {/* Swallow taps so the card underneath can't be used mid-tour. */}
      <div className="absolute inset-0" onClick={next} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-[20px] shadow-[0_0_0_9999px_rgba(22,24,29,0.62)] ring-2 ring-white transition-all duration-300"
        style={rect}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coach-title"
        className="absolute inset-x-4 rounded-2xl bg-white p-4 text-[#16181D] shadow-xl transition-all duration-300"
        style={place}
      >
        <div className="mb-1 text-xs font-semibold text-[#1D4FD7]">
          {index + 1} of {steps.length}
        </div>
        <h3 id="coach-title" className="text-base font-bold">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-5 text-[#3F4451]">{body}</p>
        <div className="mt-4 flex items-center justify-between">
          <button onClick={onDone} className="text-sm font-semibold text-[#5B6170]">
            Skip
          </button>
          <div className="flex gap-2">
            {index > 0 && (
              <button
                onClick={() => setIndex((i) => i - 1)}
                className="h-9 rounded-full border border-[#DCDCD6] px-4 text-sm font-semibold"
              >
                Back
              </button>
            )}
            <button autoFocus onClick={next} className="h-9 rounded-full bg-[#1D4FD7] px-4 text-sm font-bold text-white">
              {last ? "Got it" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    host,
  );
}

function findTarget(target: string) {
  return document.querySelector<HTMLElement>(`#phone-scroll [data-coach="${target}"]`);
}

const noopSubscribe = () => () => {};
