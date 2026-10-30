"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleCheck, Plus, X } from "lucide-react";
import { useMockData, useProfitPerspective, type ProfitTotals } from "@/context/MockDataContext";
import { BottomSheet } from "@/components/shell/BottomSheet";
import { HowCalculatedSheet } from "@/components/overview/Sections";
import { CoachMarks } from "@/components/shell/CoachMarks";
import { cn } from "@/lib/utils";
import { pctChange } from "@/lib/figures";
import { compactNaira, naira, signedNaira, splitKobo } from "@/lib/format";
import type { CashEntry, ProfitLayout, Transaction, TxnCategory } from "@/types/mockData";

const IN_CATS: TxnCategory[] = ["Sales", "Personal", "Others"];
const OUT_CATS: TxnCategory[] = ["Restock", "Expense", "Personal", "Others"];
const ACC = {
  High: "bg-[#DCFCE7] text-[#166534]",
  Medium: "bg-[#FEF3E2] text-[#92400E]",
  Low: "bg-[#FDECEC] text-[#B42318]",
};

/** Amount formatters drop the sign, so a negative profit is labelled "Loss" in words. */
function lossText(n: number, formatted: string) {
  return n < 0 ? `Loss ${formatted}` : formatted;
}

/** Month totals: full naira while small (a new user's few days), abbreviated from ₦100K. */
function monthNaira(n: number) {
  return Math.abs(n) >= 100_000 ? compactNaira(n, 1) : naira(n);
}

function signedPct(n: number | undefined) {
  if (n === undefined) return "–";
  return `${n >= 0 ? "+" : "−"}${Math.abs(n)}%`;
}

/** Profit review screen. `variant` pins a layout for its own route (e.g. /profit-test1). */
export function ProfitScreen({ variant }: { variant?: ProfitLayout }) {
  const router = useRouter();
  const m = useMockData();
  const { totals, profitLayout: layout, setProfitLayout, startFlow } = m;

  useEffect(() => {
    if (variant) setProfitLayout(variant);
  }, [variant, setProfitLayout]);
  useEffect(() => startFlow(variant ?? layout), [startFlow, variant, layout]);
  const [cashOpen, setCashOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);

  const submit = () => {
    m.submitReview();
    document.getElementById("phone-scroll")?.scrollTo({ top: 0 });
  };

  const cta =
    layout === "reviewed"
      ? { label: "Accept sorting, continue", onClick: () => router.push("/overview") }
      : { label: layout === "hero" ? "Accept and continue" : "Submit and continue", onClick: submit };

  const blueHeader =
    layout === "simple" || layout === "breakdown" || layout === "no-history" || layout === "reviewed" || layout === "test1";

  return (
    <div className="flex min-h-full flex-col">
      {/* The blue profit card stays pinned while the payments scroll beneath it. */}
      <div className={cn(blueHeader && "sticky top-0 z-10 bg-[#F2F2EF]")}>
        <div className={cn("px-4 pb-2 pt-1", blueHeader && layout !== "reviewed" && "bg-white")}>
          <button aria-label="Back" onClick={() => router.push("/")} className="grid size-10 place-items-center rounded-full bg-[#DCE6FF]">
            <ArrowLeft className="size-5 text-[#1D4FD7]" />
          </button>
          {(layout === "simple" || layout === "no-history" || layout === "reviewed" || layout === "test1") && <h1 className="mt-2 text-xl font-bold">Profit</h1>}
        </div>

        {blueHeader && <BlueHeader layout={layout} totals={totals} onAddCash={() => setCashOpen(true)} />}
      </div>

      {!blueHeader && <Hero totals={totals} onHow={() => setHowOpen(true)} />}

      <div className="flex flex-col gap-3 px-4 pb-28 pt-4">
        {layout !== "simple" && layout !== "no-history" && layout !== "hero" && layout !== "test1" && layout !== "test2" && (
          <button data-coach="how" onClick={() => setHowOpen(true)} className="self-center text-sm font-semibold text-[#1D4FD7] underline underline-offset-2">
            How is my profit calculated?
          </button>
        )}

        {layout === "reviewed" ? (
          <ReviewedSummary totals={totals} cash={m.cashEntries} onAgain={m.reviewAgain} onEditCash={() => setCashOpen(true)} />
        ) : (
          <>
            {(layout === "breakdown" || layout === "hero" || layout === "test2") && <Breakdown totals={totals} />}
            {(layout === "hero" || layout === "test2") && <CashPrompt onAdd={() => setCashOpen(true)} />}
            <CashList entries={m.cashEntries} onRemove={m.removeCashEntry} />

            <h2 className="mt-2 text-lg font-bold">Sort your payments</h2>
            {m.transactions.map((t, i) => (
              <TxnCard key={t.id} t={t} onPick={(c) => m.setCategory(t.id, c)} coach={i === 0} />
            ))}
            {layout !== "breakdown" && <CashPrompt onAdd={() => setCashOpen(true)} />}
          </>
        )}
      </div>

      <div className="sticky bottom-0 mt-auto border-t border-[#E4E4E0] bg-white px-4 py-3">
        <button data-coach="submit" onClick={cta.onClick} className="h-12 w-full rounded-full bg-[#1D4FD7] text-[15px] font-bold text-white">
          {cta.label}
        </button>
      </div>

      <AddCashSheet open={cashOpen} onClose={() => setCashOpen(false)} />
      <HowCalculatedSheet open={howOpen} onClose={() => setHowOpen(false)} />
      {m.coachMarksOpen.profit && (
        <CoachMarks key={layout} marks={m.data.coachMarks.profit} onDone={() => m.setCoachMarksOpen("profit", false)} />
      )}
    </div>
  );
}

function headline(profit: number) {
  return profit >= 0 ? "You made a profit today!" : "You made a loss today";
}

/**
 * What the header leads with: today's review, or the month (or recorded days) when that's the merchant's
 * timeframe on Home. The other figure moves to the line below, so both are always on screen.
 */
function useLead(totals: ProfitTotals) {
  const m = useMockData();
  const { view } = useProfitPerspective();
  const pv = m.data.profitView;
  const month = m.figures.month;
  const days = view.completeness.daysLoggedInMonth;
  const daysText = `${days} recorded day${days === 1 ? "" : "s"}`;
  const monthLead = view.resolved !== "today";
  const monthHeadline =
    view.resolved === "active_days"
      ? `Your ${month.profit >= 0 ? "profit" : "loss"} on ${daysText}`
      : `Your ${pv.monthLong} ${month.profit >= 0 ? "profit" : "loss"} so far`;
  return {
    monthLead,
    headline: monthLead ? monthHeadline : headline(totals.profit),
    amount: monthLead ? month.profit : totals.profit,
    /** Label and value of the figure that isn't leading. */
    other: monthLead
      ? { label: "Today so far", value: lossText(totals.profit, signedNaira(totals.profit)) }
      : { label: view.partial ? `${pv.monthShort} so far (${daysText})` : "Month to date", value: lossText(month.profit, monthNaira(month.profit)) },
    /** A new user's month has no fair comparison yet. */
    vsLastMonth: month.previous ? signedPct(pctChange(month, 1)) : "Not enough days yet",
  };
}

function BigAmount({ value, className }: { value: number; className?: string }) {
  const { whole, kobo } = splitKobo(value);
  return (
    <div className={cn("flex items-baseline font-bold", className)}>
      {value < 0 && <span className="mr-2 text-lg">Loss</span>}
      <span className="text-[34px] leading-[42px] tracking-[-0.5px]">{whole}</span>
      <span className="text-xl">{kobo}</span>
    </div>
  );
}

function BlueHeader({ layout, totals, onAddCash }: { layout: ProfitLayout; totals: ProfitTotals; onAddCash: () => void }) {
  const lead = useLead(totals);
  const showMtd = layout !== "simple";
  const noHistory = layout === "no-history";
  const starred = layout === "simple" || layout === "test1";
  return (
    <section className="bg-[#1D4FD7] px-4 pb-4 pt-4 text-white">
      <div className="flex items-end justify-between gap-3">
        <div data-coach="profit">
          <p className="text-[13px]">{starred ? lead.headline.replace("profit", "*profit") : lead.headline}</p>
          <BigAmount value={lead.amount} />
          {lead.monthLead && !showMtd && (
            <p className="text-xs font-semibold">
              {lead.other.label}: {lead.other.value}
            </p>
          )}
          <p className="text-xs text-white/85">{starred || noHistory ? "*Estimate" : "Estimate"}</p>
        </div>
        {layout !== "simple" && layout !== "no-history" && layout !== "test1" && (
          <AddCashButton label="Add cash" onClick={onAddCash} />
        )}
      </div>
      {layout === "simple" && (
        <div className="mt-3">
          <AddCashButton label="Log cash" onClick={onAddCash} />
        </div>
      )}
      {showMtd && (
        <div data-coach="month" className="mt-3 grid grid-cols-2 gap-3 border-t border-white/20 pt-3 text-xs">
          <div>
            <div className="text-white/85">{lead.other.label} {!noHistory && layout !== "test1" && "*Est"}</div>
            <div className="text-[15px] font-bold">{noHistory && !lead.monthLead ? "Not enough history yet" : lead.other.value}</div>
          </div>
          <div>
            <div className="text-white/85">vs same point last month</div>
            <div className="text-[15px] font-bold">{noHistory ? "Not enough history yet" : lead.vsLastMonth}</div>
          </div>
        </div>
      )}
    </section>
  );
}

function AddCashButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button data-coach="cash" onClick={onClick} className="inline-flex h-8 flex-none items-center gap-1 rounded-full bg-white px-3 text-[13px] font-bold text-[#1D4FD7]">
      <Plus className="size-4" /> {label}
    </button>
  );
}

function Hero({ totals, onHow }: { totals: ProfitTotals; onHow: () => void }) {
  const lead = useLead(totals);
  return (
    <section className="px-4 pt-2 text-center">
      <div className="relative h-40 overflow-hidden rounded-2xl bg-gradient-to-b from-[#3B82F6] to-[#1D4FD7]">
        <div className="absolute inset-x-0 bottom-0 h-16 bg-[#7F1D1D]/80" />
        <div className="absolute left-1/2 top-12 h-16 w-48 -translate-x-1/2 -rotate-6 rounded-lg bg-[#16A34A] shadow-[0_6px_0_#15803D,0_12px_0_#166534]">
          <div className="absolute inset-2 rounded border-2 border-dashed border-white/50" />
          <div className="absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/30 text-lg font-bold text-white">
            ₦
          </div>
        </div>
      </div>
      <div data-coach="profit" className="mt-4">
        <h1 className="text-xl font-bold">{lead.headline}</h1>
        <BigAmount value={lead.amount} className={cn("justify-center", lead.amount < 0 && "text-[#B42318]")} />
        {lead.monthLead && (
          <p className="text-sm text-[#5B6170]">
            {lead.other.label}: <b className="text-[#16181D]">{lead.other.value}</b>
          </p>
        )}
      </div>
      <button data-coach="how" onClick={onHow} className="text-sm font-semibold text-[#1D4FD7] underline underline-offset-2">
        How is my profit calculated?
      </button>
    </section>
  );
}

function Breakdown({ totals }: { totals: ProfitTotals }) {
  const m = useMockData();
  const month = m.figures.month;
  const { view } = useProfitPerspective();
  const lead = useLead(totals);
  const days = view.completeness.daysLoggedInMonth;
  return (
    <section data-coach="breakdown" className="rounded-2xl bg-white p-4 text-[15px]">
      <Line label="Sales" value={naira(totals.sales)} />
      <Line label="Stock purchase" value={`-${naira(totals.stock)}`} />
      <Line label="Expenses" value={`-${naira(totals.expenses)}`} />
      <div className="my-2 h-px bg-[#ECECE8]" />
      <Line label={lead.monthLead ? "Today's estimated profit" : "Estimated profit"} value={lossText(totals.profit, naira(totals.profit))} bold />
      <div data-coach="month">
        <Line
          label={view.partial ? `Profit on ${days} recorded day${days === 1 ? "" : "s"}` : "Profit month to date"}
          value={lossText(month.profit, monthNaira(month.profit))}
        />
        <Line label="vs same point last month" value={lead.vsLastMonth} />
      </div>
      <div data-coach="accuracy" className="mt-1 flex items-center justify-between font-bold">
        Accuracy of estimate
        <span className={cn("rounded-full px-2.5 py-0.5 text-[13px]", ACC[m.accuracy])}>{m.accuracy}</span>
      </div>
    </section>
  );
}

function ReviewedSummary({
  totals,
  cash,
  onAgain,
  onEditCash,
}: {
  totals: ProfitTotals;
  cash: CashEntry[];
  onAgain: () => void;
  onEditCash: () => void;
}) {
  const { accuracy } = useMockData();
  const { moniepoint: mp, other } = totals.bySource;
  const group = (title: string, a: number, b: number, neg: boolean) => (
    <div className="py-1.5">
      <div className="text-[13px] font-semibold text-[#5B6170]">{title}</div>
      <Line label="Moniepoint" value={`${neg ? "-" : ""}${naira(a)}`} />
      <Line label="Cash and other banks" value={`${neg ? "-" : ""}${naira(b)}`} />
    </div>
  );
  return (
    <>
      <section data-coach="breakdown" className="rounded-2xl bg-white p-4 text-[15px]">
        {group("Sales", mp.sales, other.sales, false)}
        <div className="h-px bg-[#ECECE8]" />
        {group("Stock purchase", mp.stock, other.stock, true)}
        <div className="h-px bg-[#ECECE8]" />
        {group("Expenses", mp.expenses, other.expenses, true)}
        <div className="my-2 h-px bg-[#ECECE8]" />
        <Line label="Estimated profit" value={lossText(totals.profit, naira(totals.profit))} bold />
        <div data-coach="accuracy" className="mt-1 flex items-center justify-between font-bold">
          Accuracy of estimate
          <span className={cn("rounded-full px-2.5 py-0.5 text-[13px]", ACC[accuracy])}>{accuracy}</span>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#F4F4F1] px-3 py-2.5 text-sm">
          <CircleCheck className="size-4 text-[#15803D]" /> Payments reviewed
        </div>
        <button onClick={onAgain} className="mt-2 h-10 w-full rounded-full bg-[#DCE6FF] text-sm font-bold text-[#1D4FD7]">
          Review again
        </button>
      </section>
      <section className="flex items-center justify-between rounded-2xl bg-white p-4 text-sm">
        <span>{cash.length ? `${cash.length} cash payment${cash.length > 1 ? "s" : ""} added` : "No cash added"}</span>
        <button data-coach="cash" onClick={onEditCash} className="rounded-full bg-[#DCE6FF] px-3 py-1.5 text-[13px] font-bold text-[#1D4FD7]">
          {cash.length ? "Edit" : "Add"}
        </button>
      </section>
    </>
  );
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between py-0.5", bold && "font-bold")}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function TxnCard({ t, onPick, coach }: { t: Transaction; onPick: (c: TxnCategory) => void; coach?: boolean }) {
  const cats = t.amount >= 0 ? IN_CATS : OUT_CATS;
  return (
    <article data-coach={coach ? "txn" : undefined} className="rounded-2xl bg-white p-4">
      <div className="flex justify-between gap-3">
        <div>
          <div className="text-[15px] font-bold">{t.name}</div>
          <div className="text-[13px] text-[#5B6170]">{t.meta}</div>
        </div>
        <div className="text-right">
          <div className={cn("text-[15px] font-bold", t.amount >= 0 ? "text-[#15803D]" : "text-[#16181D]")}>
            {t.amount >= 0 ? "+" : "-"}
            {naira(t.amount)}
          </div>
          {t.time && <div className="text-[13px] text-[#5B6170]">{t.time}</div>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={`Category for ${t.name}`}>
        {cats.map((c) => (
          <button
            key={c}
            role="radio"
            aria-checked={t.category === c}
            onClick={() => onPick(c)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[13px] font-semibold",
              t.category === c ? "bg-[#DCE6FF] text-[#1D4FD7]" : "bg-[#ECECE8] text-[#16181D]",
            )}
          >
            {c}
          </button>
        ))}
      </div>
    </article>
  );
}

function CashPrompt({ onAdd }: { onAdd: () => void }) {
  return (
    <section className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4">
      <div className="text-[15px] font-bold">Any cash?</div>
      <button data-coach="cash" onClick={onAdd} className="flex-none rounded-full bg-[#DCE6FF] px-3.5 py-1.5 text-[13px] font-bold text-[#1D4FD7]">
        Add it
      </button>
    </section>
  );
}

function CashList({ entries, onRemove }: { entries: CashEntry[]; onRemove: (id: string) => void }) {
  if (!entries.length) return null;
  return (
    <section className="rounded-2xl bg-white p-4">
      <div className="mb-1 text-[13px] font-semibold text-[#5B6170]">Cash and other banks</div>
      {entries.map((e) => (
        <div key={e.id} className="flex items-center justify-between py-1.5 text-sm">
          <span>
            <span className="font-semibold">{e.kind}</span>
            {e.note && <span className="text-[#5B6170]"> · {e.note}</span>}
          </span>
          <span className="flex items-center gap-2">
            <span className={cn("font-bold", e.kind === "Sales" ? "text-[#15803D]" : "")}>
              {e.kind === "Sales" ? "+" : "-"}
              {naira(e.amount)}
            </span>
            <button aria-label="Remove" onClick={() => onRemove(e.id)} className="text-[#8A909C]">
              <X className="size-4" />
            </button>
          </span>
        </div>
      ))}
    </section>
  );
}

export function AddCashSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addCashEntry } = useMockData();
  const [kind, setKind] = useState<CashEntry["kind"]>("Sales");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const value = Number(amount.replace(/[^\d]/g, ""));

  return (
    <BottomSheet open={open} onClose={onClose} label="Add cash or other payments">
      <h2 className="text-xl font-bold">Add cash</h2>
      <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Type">
        {(["Sales", "Restock", "Expense"] as const).map((k) => (
          <button
            key={k}
            role="radio"
            aria-checked={kind === k}
            onClick={() => setKind(k)}
            className={cn(
              "h-10 rounded-full text-sm font-semibold",
              kind === k ? "bg-[#DCE6FF] text-[#1D4FD7]" : "bg-[#ECECE8]",
            )}
          >
            {k === "Restock" ? "Stock" : k}
          </button>
        ))}
      </div>
      <label className="mt-4 block text-sm font-semibold">
        Amount
        <div className="mt-1 flex h-12 items-center rounded-xl border border-[#DCDCD6] px-3 focus-within:border-[#1D4FD7]">
          <span className="mr-1 text-[#5B6170]">₦</span>
          <input
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full bg-transparent text-base font-semibold outline-none"
          />
        </div>
      </label>
      <label className="mt-3 block text-sm font-semibold">
        Note <span className="font-normal text-[#8A909C]">(optional)</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Cash sales at the shop"
          className="mt-1 h-12 w-full rounded-xl border border-[#DCDCD6] px-3 text-base outline-none focus:border-[#1D4FD7]"
        />
      </label>
      <button
        disabled={!value}
        onClick={() => {
          addCashEntry({ kind, amount: value, note: note.trim() });
          setAmount("");
          setNote("");
          onClose();
        }}
        className="mt-5 h-12 w-full rounded-full bg-[#1D4FD7] text-[15px] font-bold text-white disabled:opacity-40"
      >
        Add {value ? naira(value) : ""}
      </button>
    </BottomSheet>
  );
}
