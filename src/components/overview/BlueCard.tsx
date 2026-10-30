"use client";

import { CalendarDays, ChevronRight, TrendingUp } from "lucide-react";
import type { BlueCardRow, BlueCardState, CardTarget } from "@/types/mockData";
import { cn } from "@/lib/utils";
import { naira, splitKobo } from "@/lib/format";

const TODO_DOT = { ok: "bg-[#86EFAC]", info: "bg-[#C9D8F5]", warn: "bg-[#FBBF24]" };

/** Manage page hero: profit, its change, sales/expenses rows, a verdict and one to-do line. */
export function BlueCard({ card, onAction }: { card: BlueCardState; onAction: (t: CardTarget) => void }) {
  if (card.kind === "setup") return <SetupCard card={card} onAction={onAction} />;

  const { whole, kobo } = splitKobo(card.amount ?? 0);
  const up = (card.change?.amount ?? 0) >= 0;

  return (
    <section className="overflow-hidden rounded-[20px] bg-[#1D4FD7] text-white" aria-label={card.period}>
      <div className="px-[18px] pb-4 pt-[18px]">
        <h2 className="text-[15px] font-bold">{card.period}</h2>
        <p className="text-[13px] leading-[17px] text-white/85">{card.range}</p>

        <div className="mt-2.5 flex items-baseline">
          {card.loss && <span className="mr-2 text-xl font-bold">Loss</span>}
          {card.approx && <span className="mr-2 text-[30px] font-bold">≈</span>}
          <span className="text-[36px] font-bold leading-[44px] tracking-[-0.5px]">{whole}</span>
          <span className="text-[22px] font-semibold">{kobo}</span>
        </div>

        {card.change && (
          <span
            className={cn(
              "mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-bold",
              up ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEE2E2] text-[#991B1B]",
            )}
          >
            {up ? "▲" : "▼"} {naira(card.change.amount)} {card.change.text}
          </span>
        )}
        {card.noCompare && (
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[13px] font-semibold">
            <CalendarDays className="size-3.5" /> {card.noCompare}
          </span>
        )}

        <div className="mt-3 flex flex-col gap-3 rounded-xl bg-white/10 px-3 py-3">
          {card.rows?.map((r) => <Row key={r.label} row={r} />)}
        </div>

        <p className="mt-3 text-[15px] font-bold leading-5">{card.verdict}</p>
      </div>

      {card.todo && (
        <button
          data-coach="todo"
          onClick={() => onAction(card.todo!.target)}
          className="flex w-full items-center gap-2.5 border-t border-white/15 bg-[#1A45BF] px-[18px] py-3.5 text-left text-sm font-semibold"
        >
          <span className={cn("size-2 flex-none rounded-full", TODO_DOT[card.todo.tone])} />
          <span className="flex-1">{card.todo.text}</span>
          <ChevronRight className="size-4" />
        </button>
      )}
    </section>
  );
}

function Row({ row }: { row: BlueCardRow }) {
  const c = row.change;
  return (
    <div className="flex items-center text-[15px]">
      <span className="w-[82px] text-white/80">{row.label}</span>
      <span className="flex-1 font-bold">{naira(row.amount)}</span>
      {c !== undefined &&
        (c === 0 ? (
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">Same</span>
        ) : (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-bold",
              row.good ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEE2E2] text-[#991B1B]",
            )}
          >
            {c > 0 ? "▲" : "▼"} {naira(c)}
          </span>
        ))}
    </div>
  );
}

function SetupCard({ card, onAction }: { card: BlueCardState; onAction: (t: CardTarget) => void }) {
  return (
    <section className="rounded-[20px] bg-[#1D4FD7] p-[18px] text-white">
      <div className="grid size-11 place-items-center rounded-lg bg-white/15">
        <TrendingUp className="size-5" />
      </div>
      <h2 className="mt-3.5 text-[22px] font-bold">{card.setupTitle}</h2>
      <p className="mt-1.5 text-[15px] leading-[22px] text-white/95">{card.setupText}</p>
      {card.steps && (
        <div className="mt-4 flex items-center gap-2.5">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white" style={{ width: `${(card.steps.done / card.steps.total) * 100}%` }} />
          </div>
          <span className="text-[13px] font-semibold">
            {card.steps.done} of {card.steps.total} steps done
          </span>
        </div>
      )}
      {card.setupCta && (
        <button
          onClick={() => onAction(card.setupCta!.target)}
          className="mt-4 h-12 w-full rounded-full bg-white text-[15px] font-bold text-[#1D4FD7]"
        >
          {card.setupCta.label}
        </button>
      )}
      {card.setupNote && <p className="mt-2.5 text-center text-[13px] text-white/90">{card.setupNote}</p>}
    </section>
  );
}
