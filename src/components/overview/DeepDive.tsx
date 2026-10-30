"use client";

import { useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { useMockData } from "@/context/MockDataContext";
import { BottomSheet } from "@/components/shell/BottomSheet";
import { AddCashSheet } from "@/components/profit/ProfitScreen";
import { cn } from "@/lib/utils";
import { naira } from "@/lib/format";
import type { Transaction, TxnCategory } from "@/types/mockData";

const IN_CATS: TxnCategory[] = ["Sales", "Personal", "Others"];
const OUT_CATS: TxnCategory[] = ["Restock", "Expense", "Personal", "Others"];
const NAME: Record<TxnCategory, string> = { Sales: "Sale", Restock: "Stock", Expense: "Expense", Personal: "Personal", Others: "Other" };

const lossNaira = (n: number) => (n < 0 ? `Loss ${naira(n)}` : naira(n));

/**
 * Overview deep dive (design lead brief, 2026-10-30): what to sort, where the money went, and every payment.
 * Payments are today's; a correction here goes through the context, so Home, Profit and Overview all recalculate.
 */
export function DeepDive() {
  const m = useMockData();
  const [open, setOpen] = useState<string | null>(null);
  const [cashOpen, setCashOpen] = useState(false);
  const txn = m.transactions.find((t) => t.id === open);
  const unsorted = m.transactions.filter((t) => !t.category);

  return (
    <>
      {unsorted.length > 0 && (
        <section data-coach="review" className="rounded-2xl border border-[#FAD7A5] bg-[#FFF8EC] p-4">
          <h3 className="text-[15px] font-bold text-[#7C2D12]">
            {unsorted.length} payment{unsorted.length > 1 ? "s" : ""} to sort
          </h3>
          <div className="mt-2 flex flex-col divide-y divide-[#FAD7A5]">
            {unsorted.map((t) => (
              <PaymentRow key={t.id} t={t} onOpen={() => setOpen(t.id)} />
            ))}
          </div>
        </section>
      )}

      <Summary onAddCash={() => setCashOpen(true)} />

      <section className="rounded-2xl bg-white p-4">
        <h3 className="text-[15px] font-bold">Today&apos;s payments</h3>
        <div className="mt-2 flex flex-col divide-y divide-[#ECECE8]">
          {m.transactions.map((t) => (
            <PaymentRow key={t.id} t={t} onOpen={() => setOpen(t.id)} />
          ))}
          {m.cashEntries.map((e) => (
            <div key={e.id} className="flex items-center justify-between py-2.5 text-sm">
              <span>
                <span className="font-semibold">Cash</span>
                <span className="text-[#5B6170]"> · {e.kind === "Restock" ? "Stock" : e.kind}</span>
              </span>
              <span className={cn("font-bold", e.kind === "Sales" && "text-[#15803D]")}>
                {e.kind === "Sales" ? "+" : "-"}
                {naira(e.amount)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <PaymentSheet t={txn} onClose={() => setOpen(null)} onPick={(c) => txn && m.setCategory(txn.id, c)} />
      <AddCashSheet open={cashOpen} onClose={() => setCashOpen(false)} />
    </>
  );
}

/** Where the money went for the selected tab. Today splits stock, expenses and cash; week and month only have totals. */
function Summary({ onAddCash }: { onAddCash: () => void }) {
  const { period, totals, figures } = useMockData();
  const f = figures[period];
  const rows =
    period === "today"
      ? [
          { label: "Sales", value: naira(totals.sales), good: true },
          { label: "Stock bought", value: `-${naira(totals.stock)}` },
          { label: "Expenses", value: `-${naira(totals.expenses)}` },
        ]
      : [
          { label: "Sales", value: naira(f.sales), good: true },
          { label: "Stock and expenses", value: `-${naira(f.expenses)}` },
        ];
  const profit = period === "today" ? totals.profit : f.profit;
  const { other } = totals.bySource;
  const cash = other.sales - other.stock - other.expenses;

  return (
    <section data-coach="summary" className="rounded-2xl bg-white p-4 text-[15px]">
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between py-1">
          <span>{r.label}</span>
          <span className={cn("font-semibold", r.good && "text-[#15803D]")}>{r.value}</span>
        </div>
      ))}
      <div className="my-2 h-px bg-[#ECECE8]" />
      <div className="flex justify-between font-bold">
        <span>Profit</span>
        <span className={cn(profit < 0 && "text-[#B42318]")}>{lossNaira(profit)}</span>
      </div>
      {period === "today" && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-[#F4F4F1] px-3 py-2 text-sm">
          <span>
            Cash <b>{cash ? (cash < 0 ? `-${naira(cash)}` : naira(cash)) : "none"}</b>
          </span>
          <button onClick={onAddCash} className="flex items-center gap-1 text-[13px] font-bold text-[#1D4FD7]">
            <Plus className="size-4" /> Add cash
          </button>
        </div>
      )}
    </section>
  );
}

function PaymentRow({ t, onOpen }: { t: Transaction; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="flex w-full items-center gap-3 py-2.5 text-left">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{t.name}</div>
        <div className={cn("text-xs", t.category ? "text-[#5B6170]" : "font-semibold text-[#B45309]")}>
          {t.category ? NAME[t.category] : "Not sorted"}
        </div>
      </div>
      <span className={cn("text-sm font-bold", t.amount >= 0 && "text-[#15803D]")}>
        {t.amount >= 0 ? "+" : "-"}
        {naira(t.amount)}
      </span>
      <ChevronRight className="size-4 text-[#8A909C]" />
    </button>
  );
}

/** One payment's detail; picking a category recalculates profit everywhere. */
function PaymentSheet({ t, onClose, onPick }: { t?: Transaction; onClose: () => void; onPick: (c: TxnCategory) => void }) {
  return (
    <BottomSheet open={!!t} onClose={onClose} label="Payment detail">
      {t && (
        <>
          <div className={cn("text-[28px] font-bold", t.amount >= 0 && "text-[#15803D]")}>
            {t.amount >= 0 ? "+" : "-"}
            {naira(t.amount)}
          </div>
          <div className="mt-1 text-[15px] font-semibold">{t.name}</div>
          <div className="text-[13px] text-[#5B6170]">
            {t.meta}
            {t.time && ` · ${t.time}`}
          </div>
          <h3 className="mt-4 text-sm font-bold">What was it?</h3>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={`Category for ${t.name}`}>
            {(t.amount >= 0 ? IN_CATS : OUT_CATS).map((c) => (
              <button
                key={c}
                role="radio"
                aria-checked={t.category === c}
                onClick={() => onPick(c)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold",
                  t.category === c ? "bg-[#DCE6FF] text-[#1D4FD7]" : "bg-[#ECECE8] text-[#16181D]",
                )}
              >
                {NAME[c]}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="mt-5 h-12 w-full rounded-full bg-[#1D4FD7] text-[15px] font-bold text-white">
            Done
          </button>
        </>
      )}
    </BottomSheet>
  );
}
