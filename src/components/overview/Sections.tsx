"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Box, ChevronRight, FileText, LayoutGrid, Lock, Play, Users } from "lucide-react";
import { useMockData } from "@/context/MockDataContext";
import { BottomSheet } from "@/components/shell/BottomSheet";
import { Flame } from "@/components/card/icons";
import { cn } from "@/lib/utils";
import { naira } from "@/lib/format";
import type { ComingSoonFeature, OverviewScenario, RecordDay } from "@/types/mockData";

export function MoneyInOut({ money }: { money: OverviewScenario["money"] }) {
  return (
    <section className="grid grid-cols-2 rounded-2xl bg-white p-4">
      <div className="pr-4">
        <div className="flex items-center gap-1.5 text-sm text-[#3F4451]">
          <ArrowDown className="size-4 text-[#15803D]" /> Money in
        </div>
        <div className="mt-1 text-lg font-bold">{naira(money.in)}</div>
        <div className="text-xs text-[#5B6170]">{naira(money.pending)} still pending</div>
      </div>
      <div className="border-l border-[#ECECE8] pl-4">
        <div className="flex items-center gap-1.5 text-sm text-[#3F4451]">
          <ArrowUp className="size-4 text-[#B42318]" /> Money out
        </div>
        <div className="mt-1 text-lg font-bold">{naira(money.out)}</div>
      </div>
    </section>
  );
}

export function BookkeepingServices() {
  const { data, waitlist, joinWaitlist } = useMockData();
  const [open, setOpen] = useState<ComingSoonFeature | null>(null);
  const [uses, setUses] = useState<string[]>([]);
  const onList = open ? waitlist[open.id]?.joined : false;

  const tiles = [
    { id: "invoice", label: "Invoice", Icon: FileText },
    { id: "items", label: "Items", Icon: Box },
    { id: "customers", label: "Customers", Icon: Users },
    { id: "more", label: "More", Icon: LayoutGrid },
  ] as const;

  return (
    <section>
      <h3 className="mb-2.5 text-lg font-bold">Bookkeeping services</h3>
      <div className="grid grid-cols-4 gap-2">
        {tiles.map(({ id, label, Icon }) => {
          const feature = data.comingSoon.find((f) => f.id === id);
          const joined = feature && waitlist[feature.id]?.joined;
          return (
            <button
              key={id}
              onClick={() => {
                if (feature) {
                  setUses([]);
                  setOpen(feature);
                } else toast(`${label} opens here`);
              }}
              className={cn(
                "relative flex h-[84px] flex-col items-center justify-center gap-2 rounded-xl bg-white text-[13px] font-semibold",
                joined && "border-2 border-[#1D4FD7]",
                feature ? "text-[#5B6170]" : "text-[#16181D]",
              )}
            >
              {feature && (
                <span
                  className={cn(
                    "absolute -top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    joined ? "bg-[#DCE6FF] text-[#1D4FD7]" : "bg-[#ECECE8] text-[#3F4451]",
                  )}
                >
                  {joined ? "On the list" : "Soon"}
                </span>
              )}
              <Icon className={cn("size-5", feature ? "text-[#8A909C]" : "text-[#1D4FD7]")} />
              {label}
            </button>
          );
        })}
      </div>

      <BottomSheet open={!!open} onClose={() => setOpen(null)} label="Coming soon">
        {open && !onList && (
          <>
            <div className="grid size-14 place-items-center rounded-2xl bg-[#DCE6FF]">
              {open.id === "customers" ? <Users className="size-6 text-[#1D4FD7]" /> : <Box className="size-6 text-[#1D4FD7]" />}
            </div>
            <span className="mt-5 inline-block rounded-full bg-[#ECECE8] px-2 py-0.5 text-xs font-semibold">Coming soon</span>
            <h2 className="mt-2 text-[22px] font-bold">{open.name} is coming soon</h2>
            <p className="mt-1.5 text-[15px] text-[#3F4451]">{open.pitch}</p>
            <p className="mt-4 text-sm font-semibold">
              What would you use it for? <span className="font-normal text-[#8A909C]">(optional)</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {open.uses.map((u) => (
                <button
                  key={u}
                  aria-pressed={uses.includes(u)}
                  onClick={() => setUses((s) => (s.includes(u) ? s.filter((x) => x !== u) : [...s, u]))}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium",
                    uses.includes(u) ? "border-[#1D4FD7] bg-[#EEF4FF] text-[#1D4FD7]" : "border-[#DCDCD6]",
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                joinWaitlist(open.id, uses);
                setOpen(null);
                toast.success(`You're on the list for ${open.name}`);
              }}
              className="mt-5 h-12 w-full rounded-full bg-[#1D4FD7] text-[15px] font-bold text-white"
            >
              Notify me
            </button>
            <button onClick={() => setOpen(null)} className="mt-2 h-11 w-full text-[15px] font-semibold">
              Not now
            </button>
          </>
        )}
        {open && onList && (
          <>
            <h2 className="text-xl font-bold">You&apos;re on the list</h2>
            <p className="mt-1.5 text-[15px] text-[#3F4451]">We&apos;ll tell you when {open.name} is ready.</p>
            <button onClick={() => setOpen(null)} className="mt-5 h-12 w-full rounded-full bg-[#1D4FD7] text-[15px] font-bold text-white">
              OK
            </button>
          </>
        )}
      </BottomSheet>
    </section>
  );
}

export function ProfitInsight({ insight }: { insight: NonNullable<OverviewScenario["insight"]> }) {
  const [playing, setPlaying] = useState(false);
  return (
    <section className="rounded-2xl bg-white p-4">
      <h3 className="text-lg font-bold">Profit insight</h3>
      <div className="mt-2 flex gap-3">
        <div className="flex-1">
          {/* The full read is behind Listen, so the card only carries the headline. */}
          <p className="text-[15px] font-bold">{insight.heading}</p>
        </div>
        <button
          onClick={() => {
            setPlaying(true);
            setTimeout(() => setPlaying(false), 2500);
          }}
          className="flex flex-col items-center gap-1 text-xs font-semibold text-[#1D4FD7]"
          aria-label="Listen to this insight"
        >
          <span className={cn("grid size-12 place-items-center rounded-full bg-[#1D4FD7]", playing && "animate-pulse")}>
            <Play className="size-5 fill-white text-white" />
          </span>
          {playing ? "Playing" : "Listen"}
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {insight.rows.map((r) => (
          <button
            key={r.title}
            onClick={() => (r.locked ? toast(r.sub) : toast(r.title, { description: r.sub }))}
            className={cn("flex items-center rounded-xl bg-[#F4F4F1] px-3 py-2.5 text-left", r.locked && "opacity-75")}
          >
            <div className="flex-1">
              <div className="text-sm font-semibold">{r.title}</div>
            </div>
            {r.locked ? <Lock className="size-4 text-[#8A909C]" /> : <ChevronRight className="size-4 text-[#8A909C]" />}
          </button>
        ))}
      </div>
    </section>
  );
}

export function PayYourself({ pay }: { pay: NonNullable<OverviewScenario["payYourself"]> }) {
  const total = pay.taken + pay.safe;
  return (
    <section className="rounded-2xl bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold">Pay yourself</h3>
        <span className="rounded-full bg-[#ECECE8] px-2 py-0.5 text-[11px] font-semibold text-[#3F4451]">Your team&apos;s module</span>
      </div>
      <p className="mt-1.5 text-[15px] font-bold">You&apos;ve taken {naira(pay.taken)} this month</p>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full">
        <div className="bg-[#1D4FD7]" style={{ width: `${(pay.taken / total) * 100}%` }} />
        <div className="flex-1 bg-[#86CFA0]" />
      </div>
      <div className="mt-2 flex flex-col gap-1 text-[13px]">
        <LegendRow color="bg-[#1D4FD7]" label="Already taken" value={naira(pay.taken)} />
        <LegendRow color="bg-[#86CFA0]" label="Still safe to take" value={naira(pay.safe)} />
      </div>
    </section>
  );
}

const REC: Record<RecordDay["state"], string> = {
  recorded: "bg-[#1D4FD7]",
  rest: "bg-[#DCDCD6]",
  missed: "border border-dashed border-[#A3A8B2]",
  empty: "bg-[#ECECE8]",
  today: "bg-[#1D4FD7] ring-2 ring-[#9DB4F0] ring-offset-1",
};

export function YourRecords({
  records,
  onCta,
  onSeeAll,
}: {
  records: OverviewScenario["records"];
  onCta: () => void;
  onSeeAll: () => void;
}) {
  const firstEmpty = records.days.every((d) => d.state === "empty" || d.state === "today");
  return (
    <section className="rounded-2xl bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold">Your records</h3>
        <button onClick={onSeeAll} className="text-sm font-semibold text-[#1D4FD7]">
          See all
        </button>
      </div>
      <p className="mt-1 text-[13px] text-[#3F4451]">{records.summary}</p>
      <div className="mt-3 grid grid-cols-14 gap-0.5">
        {records.days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span
              className={cn(
                "size-5 rounded-full",
                firstEmpty && d.state !== "today" ? "border border-dashed border-[#DCDCD6]" : REC[d.state],
                firstEmpty && d.state === "today" && "border border-dashed border-[#DCDCD6] bg-transparent ring-0",
              )}
            />
            <span className={cn("text-[11px] font-semibold", d.state === "today" ? "text-[#1D4FD7]" : "text-[#8A909C]")}>
              {d.dow}
            </span>
          </div>
        ))}
      </div>
      {!firstEmpty && (
        <div className="mt-2 flex gap-4 text-xs text-[#3F4451]">
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#1D4FD7]" />Recorded</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full border border-dashed border-[#A3A8B2]" />Missed</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#DCDCD6]" />Rest day</span>
        </div>
      )}
      {records.cta && (
        <button onClick={onCta} className="mt-3 h-11 w-full rounded-full border border-[#1D4FD7] text-sm font-bold text-[#1D4FD7]">
          {records.cta}
        </button>
      )}
    </section>
  );
}

export function Invoices({ inv }: { inv: OverviewScenario["invoices"] }) {
  const total = inv.paid + inv.unpaid;
  return (
    <section className="rounded-2xl bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold">Invoices</h3>
        <span className="text-[13px] text-[#5B6170]">{inv.label}</span>
      </div>
      <p className="mt-1.5 text-[13px] text-[#3F4451]">Total sent · {inv.count} invoices</p>
      <p className="text-2xl font-bold">{naira(total)}</p>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full">
        <div className="bg-[#1D4FD7]" style={{ width: `${(inv.paid / total) * 100}%` }} />
        <div className="flex-1 bg-[#FBBF24]" />
      </div>
      <div className="mt-2 flex flex-col gap-1 text-[13px]">
        <LegendRow color="bg-[#1D4FD7]" label={`${inv.paidCount} paid`} value={naira(inv.paid)} />
        <LegendRow color="bg-[#FBBF24]" label={`${inv.unpaidCount} unpaid`} value={naira(inv.unpaid)} />
      </div>
    </section>
  );
}

const ACC = {
  High: "bg-[#DCFCE7] text-[#166534]",
  Medium: "bg-[#FEF3E2] text-[#92400E]",
  Low: "bg-[#FDECEC] text-[#B42318]",
  "Not set up": "bg-[#ECECE8] text-[#3F4451]",
};

export function CalcAndAccuracy({ accuracy }: { accuracy: OverviewScenario["accuracy"] }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="divide-y divide-[#ECECE8] rounded-2xl bg-white">
      <button onClick={() => setOpen(true)} className="flex w-full items-center justify-between px-4 py-3.5 text-left text-[15px] font-semibold">
        How is my profit calculated? <ChevronRight className="size-4 text-[#8A909C]" />
      </button>
      <div className="flex items-center justify-between px-4 py-3.5 text-[15px] font-semibold">
        Accuracy of estimate
        <span className={cn("rounded-full px-2.5 py-0.5 text-[13px] font-bold", ACC[accuracy])}>{accuracy}</span>
      </div>
      <HowCalculatedSheet open={open} onClose={() => setOpen(false)} />
    </section>
  );
}

export function HowCalculatedSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} label="How profit is calculated">
      <h2 className="text-xl font-bold">How is my profit calculated?</h2>
      <div className="mt-3 rounded-xl bg-[#F4F4F1] p-4 text-[15px] font-semibold">
        Sales − Stock purchase − Expenses = Profit
      </div>
      <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm text-[#3F4451]">
        <li>Built from your Moniepoint payments.</li>
        <li>Personal money doesn&apos;t count.</li>
        <li>Add cash to include it.</li>
      </ul>
      <button onClick={onClose} className="mt-5 h-12 w-full rounded-full bg-[#1D4FD7] text-[15px] font-bold text-white">
        Got it
      </button>
    </BottomSheet>
  );
}

export function StreakRow({ row, onOpen }: { row: NonNullable<OverviewScenario["streakRow"]>; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left">
      <span className="grid size-11 place-items-center rounded-full bg-[#FFEDE0]">
        <Flame fill="#EA580C" stroke="#EA580C" size={18} />
      </span>
      <span className="flex-1">
        <span className="block text-[15px] font-bold">{row.title}</span>
        <span className="block text-[13px] text-[#5B6170]">{row.sub}</span>
      </span>
      <ChevronRight className="size-4 text-[#8A909C]" />
    </button>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-2">
        <span className={cn("size-2.5 rounded-full", color)} />
        {label}
      </span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
