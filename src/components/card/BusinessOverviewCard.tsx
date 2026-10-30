"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Lock, TriangleAlert } from "lucide-react";
import type { CardInsight, CardState, CardTarget, ProfitView, ProfitViewMode } from "@/types/mockData";
import { cn } from "@/lib/utils";
import { compactNaira, insightNaira, naira, signedNaira, splitKobo } from "@/lib/format";
import { StreakChip } from "./StreakChip";

const MASK = "₦ •••";
let tooltipShown = false;

interface Props {
  card: CardState;
  /** The user's mask preference (true = hidden). */
  masked: boolean;
  onMaskChange?: (masked: boolean) => void;
  onAction?: (target: CardTarget) => void;
  /** Called with whether the amount is currently hidden, so nearby quotes (MAI) mask with it. */
  onHiddenChange?: (hidden: boolean) => void;
  /** Timeframe pill tap (cards with `profitView`). */
  onViewChange?: (mode: ProfitViewMode) => void;
  /** Static rendering for the states gallery: no animations. */
  still?: boolean;
}

/** Home "Business overview" card: header + chip, value, status, insight, CTA. */
export function BusinessOverviewCard({ card, masked, onMaskChange, onAction, onViewChange, onHiddenChange, still }: Props) {
  // Follows the mask preference until the user taps the eye on this card.
  const [override, setOverride] = useState<boolean | null>(null);
  const hidden = override ?? (card.value.forceReveal ? false : card.startMasked ? true : masked);
  const [showTip, setShowTip] = useState(() => !still && !!card.value.tooltip && !tooltipShown);
  const shown = useCountUp(card.value.amount ?? 0, still ? undefined : card.value.countFrom);
  const status = useLiveTick(card.status.text, !still && !!card.status.liveTick);

  // Re-mask when the app goes to the background (B2).
  useEffect(() => {
    const onVis = () => document.visibilityState === "hidden" && masked && setOverride(true);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [masked]);

  // One-time tooltip (A6).
  useEffect(() => {
    if (!showTip) return;
    tooltipShown = true;
    const t = setTimeout(() => setShowTip(false), 4000);
    return () => clearTimeout(t);
  }, [showTip]);

  const toggle = () => {
    setShowTip(false);
    setOverride(!hidden);
    onMaskChange?.(!hidden);
  };

  const go = (t: CardTarget) => !card.loading && onAction?.(t);
  const isAmount = card.value.mode === "amount";
  const valueHidden = isAmount && hidden;
  const view = card.profitView;
  useEffect(() => onHiddenChange?.(valueHidden), [valueHidden, onHiddenChange]);

  return (
    <div
      role={card.wholeCard ? "button" : undefined}
      tabIndex={card.wholeCard ? 0 : undefined}
      onClick={() => go(card.wholeCard ? card.cta.target : "overview")}
      onKeyDown={(e) => card.wholeCard && e.key === "Enter" && go(card.cta.target)}
      aria-busy={card.loading || undefined}
      data-coach="card"
      className={cn(
        "relative flex w-full flex-col gap-2.5 overflow-hidden rounded-2xl border border-[#E4E4E0] bg-white p-[18px] text-left text-[#16181D]",
        !card.loading && "cursor-pointer",
      )}
    >
      {card.status.confetti && !still && <Confetti />}

      {/* 1 · Header + streak chip */}
      <div className="flex min-h-7 items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          {view ? (
            <TimeframePill view={view} onChange={onViewChange} />
          ) : (
            <span className="text-sm font-medium leading-5 text-[#5B6170]">{card.header}</span>
          )}
          {card.sub && (
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="w-fit text-xs leading-4 text-[#8A909C] underline-offset-2 hover:underline"
            >
              {card.sub}
            </button>
          )}
        </div>
        {card.chip && (
          <div data-coach="chip">
            <StreakChip tone={card.chip.tone} days={card.chip.days} onClick={() => onAction?.("streak")} />
          </div>
        )}
      </div>

      {view && (
        <div key={`label-${view.resolved}`} className="-mb-2 text-[13px] font-medium text-[#5B6170] animate-in fade-in slide-in-from-bottom-1 duration-300">
          {view.label}
        </div>
      )}

      {/* 2 · Value + 5 · CTA */}
      <div className="flex min-h-11 items-center justify-between gap-3">
        <div data-coach={isAmount ? "value" : undefined} className="relative flex min-w-0 items-center gap-1">
          {card.value.mode === "skeleton" && <div className="h-7 w-[150px] rounded-lg bg-[#ECECE8]" />}
          {card.value.mode === "locked" && (
            <>
              <span className="text-[28px] font-bold leading-[34px] tracking-[2px]">{MASK}</span>
              <Lock className="ml-2 size-4 text-[#8A909C]" aria-label="Locked" />
            </>
          )}
          {isAmount && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
              aria-label={valueHidden ? "Show profit" : "Hide profit"}
              className="flex min-w-0 items-center gap-2"
            >
              {valueHidden ? (
                <span className="text-[28px] font-bold leading-[34px] tracking-[2px]">{MASK}</span>
              ) : (
                <Amount value={shown} card={card} />
              )}
              {valueHidden ? (
                <Eye className="size-[18px] flex-none text-[#5B6170]" />
              ) : (
                <EyeOff className="size-[18px] flex-none text-[#5B6170]" />
              )}
            </button>
          )}
          {showTip && (
            <div className="absolute left-24 top-full z-10 mt-1 whitespace-nowrap rounded-md bg-[#16181D] px-2.5 py-1.5 text-xs font-medium text-white shadow-lg">
              {card.value.tooltip}
            </div>
          )}
        </div>
        {card.cta.label && (
          <button
            type="button"
            data-coach="cta"
            onClick={(e) => {
              e.stopPropagation();
              go(card.cta.target);
            }}
            className="h-10 flex-none rounded-full bg-[#1D4FD7] px-4 text-sm font-bold text-white transition hover:bg-[#1A45BF] active:translate-y-px"
          >
            {card.cta.label}
          </button>
        )}
      </div>

      {view && isAmount && (
        <div key={`sub-${view.resolved}`} className="-mt-2 text-xs text-[#8A909C] animate-in fade-in slide-in-from-bottom-1 duration-300">
          {view.secondary.before}
          <span className="font-semibold text-[#5B6170]">
            {valueHidden ? "₦ •••" : view.secondary.signed ? signedNaira(view.secondary.amount) : lossNaira(view.secondary.amount)}
          </span>
          {view.secondary.after}
        </div>
      )}

      {/* 3 · Status line */}
      {card.loading ? (
        <div className="flex flex-col gap-2">
          <div className="h-2.5 w-[230px] rounded-full bg-[#ECECE8]" />
          <div className="h-2.5 w-[180px] rounded-full bg-[#ECECE8]" />
        </div>
      ) : (
        <div data-coach="status">
          <StatusLine card={card} text={valueHidden && card.status.maskedText ? card.status.maskedText : status} hidden={valueHidden} />
        </div>
      )}

      {/* 4 · Insight line */}
      {card.insight.kind !== "none" && !card.loading && (
        <>
          <div className="h-px bg-[#ECECE8]" />
          <div data-coach="insight">
            <Insight insight={card.insight} hidden={valueHidden} />
          </div>
        </>
      )}
    </div>
  );
}

const lossNaira = (n: number) => (n < 0 ? `Loss ${naira(n)}` : naira(n));

/** Header pill: Today | This month (till now). Logged-days view sits under the month segment. */
function TimeframePill({ view, onChange }: { view: ProfitView; onChange?: (mode: ProfitViewMode) => void }) {
  const segments = [
    { mode: "today", label: "Today", on: view.resolved === "today" },
    { mode: "mtd_till_date", label: "This month (till now)", on: view.resolved !== "today" },
  ] as const;
  return (
    <div data-coach="timeframe" role="radiogroup" aria-label="Profit timeframe" className="flex w-fit rounded-full bg-[#F1F1EE] p-0.5 text-xs font-semibold">
      {segments.map((s) => (
        <button
          key={s.mode}
          type="button"
          role="radio"
          aria-checked={s.on}
          onClick={(e) => {
            e.stopPropagation();
            if (!s.on) onChange?.(s.mode);
          }}
          className={cn(
            "rounded-full px-3 py-1 transition-all duration-200",
            s.on ? "bg-white text-[#16181D] shadow-sm" : "text-[#5B6170] hover:text-[#16181D]",
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

function Amount({ value, card }: { value: number; card: CardState }) {
  const { stale, loss, approx, compact } = card.value;
  const color = stale ? "text-[#A3A8B2]" : loss ? "text-[#B42318]" : "text-[#16181D]";
  if (compact) {
    return <span className={cn("text-[28px] font-bold leading-[34px]", color)}>{compactNaira(value)}</span>;
  }
  const { whole, kobo } = splitKobo(value);
  return (
    <span className={cn("flex items-baseline whitespace-nowrap", color)}>
      {loss && <span className="mr-1.5 text-sm font-semibold text-[#B42318]">Loss</span>}
      {approx && <span className="mr-1 text-[24px] font-bold">≈</span>}
      <span className="text-[28px] font-bold leading-[34px] tracking-[-0.5px]">{whole}</span>
      <span className="text-lg font-medium">{kobo}</span>
    </span>
  );
}

function StatusLine({ card, text, hidden }: { card: CardState; text: string; hidden: boolean }) {
  const s = card.status;
  switch (s.tone) {
    case "dot":
      return (
        <div className="flex items-center gap-2 text-[13px] font-medium text-[#16181D]">
          <span className="size-1.5 flex-none rounded-full bg-[#1D4FD7]" />
          <span>{text}</span>
        </div>
      );
    case "warn":
      return (
        <div className="flex items-start gap-2 rounded-lg bg-[#FEF3E2] px-3 py-2 text-[13px] font-medium text-[#92400E]">
          <TriangleAlert className="mt-px size-4 flex-none" />
          <span>{text}</span>
        </div>
      );
    case "error":
      return (
        <div className="flex items-center gap-2 rounded-lg bg-[#FDECEC] px-3 py-2 text-[13px] font-medium text-[#B42318]">
          <TriangleAlert className="size-4 flex-none" />
          <span>{text}</span>
        </div>
      );
    case "neutral":
      return <div className="rounded-lg bg-[#F4F4F1] px-3 py-2 text-[13px] text-[#3F4451]">{text}</div>;
    case "celebrate":
      return <div className="rounded-lg bg-[#FEF6D8] px-3 py-2 text-[13px] font-medium text-[#713F12]">{text}</div>;
    case "delta":
      return (
        <div className="flex items-center gap-2 text-[13px] font-medium text-[#166534]">
          <span className="rounded-full bg-[#E3F4E8] px-2 py-0.5 text-xs font-bold">
            {hidden ? "₦ •••" : `${(s.delta ?? 0) < 0 ? "−" : "+"}${naira(s.delta ?? 0)}`}
          </span>
          <span>{text}</span>
        </div>
      );
    default:
      return (
        <div className={cn("text-[13px]", s.muted ? "text-[#8A909C]" : s.dark ? "text-[#16181D]" : "text-[#3F4451]")}>{text}</div>
      );
  }
}

function Insight({ insight: i, hidden }: { insight: CardInsight; hidden: boolean }) {
  const amt = i.amount !== undefined ? (hidden ? "₦ •••" : insightNaira(i.amount)) : "";
  if (i.kind === "text") return <div className="text-[13px] font-semibold text-[#16181D]">{i.label}</div>;
  if (i.kind === "bar")
    return (
      <div className="h-1.5 overflow-hidden rounded-full bg-[#ECECE8]">
        <div className="h-full rounded-full bg-[#1D4FD7]" style={{ width: `${(i.progress ?? 0) * 100}%` }} />
      </div>
    );
  if (i.kind === "progress")
    return (
      <div className="flex flex-col gap-2">
        <div className="text-[13px] font-semibold text-[#16181D]">{i.label}</div>
        <div className="flex gap-1.5" aria-label={`${i.filled} of ${i.total} days recorded`}>
          {Array.from({ length: i.total ?? 7 }, (_, k) => (
            <span key={k} className={cn("size-2.5 rounded-full", k < (i.filled ?? 0) ? "bg-[#EA580C]" : "bg-[#DCDCD6]")} />
          ))}
        </div>
      </div>
    );
  return (
    <div className="flex flex-wrap items-baseline gap-x-1.5 text-[13px]">
      <span className="font-semibold text-[#16181D]">
        {i.label} {amt}
        {i.after}
      </span>
      {i.pct !== undefined && (
        <span className={cn("font-bold", i.pct >= 0 ? "text-[#15803D]" : "text-[#B42318]")}>
          {i.pct >= 0 ? "▲" : "▼"}
          {Math.abs(i.pct)}%
        </span>
      )}
      {i.absChange !== undefined && (
        <span className="font-bold text-[#15803D]">{hidden ? "₦ •••" : naira(i.absChange)} better</span>
      )}
      {i.flat && <span className="text-[#5B6170]">–</span>}
      {i.suffix && <span className="text-[#5B6170]">{i.suffix}</span>}
    </div>
  );
}

function useCountUp(target: number, from?: number) {
  const [v, setV] = useState(from ?? target);
  useEffect(() => {
    if (from === undefined) return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / 900);
      setV(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, from]);
  return from === undefined ? target : Math.round(v);
}

/** C7: the leading count ticks up once, in place, a few seconds after render. Callers key the card by state. */
function useLiveTick(text: string, on: boolean) {
  const [bump, setBump] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (!on) return;
    timer.current = setTimeout(() => setBump(1), 3500);
    return () => clearTimeout(timer.current);
  }, [text, on]);
  if (!bump) return text;
  return text.replace(/^\d+/, (n) => String(Number(n) + bump));
}

function Confetti() {
  const colors = ["#EA580C", "#CA8A04", "#1D4FD7", "#15803D", "#C026D3"];
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {Array.from({ length: 18 }, (_, k) => (
        <span
          key={k}
          className="absolute top-0 h-2 w-1.5 rounded-sm opacity-0 animate-[confetti_1.6s_ease-out_forwards]"
          style={{ left: `${(k * 53) % 100}%`, background: colors[k % colors.length], animationDelay: `${(k % 6) * 80}ms` }}
        />
      ))}
    </div>
  );
}
