"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Check, Info } from "lucide-react";
import { useMockData } from "@/context/MockDataContext";
import { cn } from "@/lib/utils";
import type { CatchUpDay } from "@/types/mockData";

export default function CatchUpPage() {
  const router = useRouter();
  const { catchUpDays, recordDay, setCardStateId } = useMockData();
  const done = catchUpDays.filter((d) => d.recorded).length;
  const total = catchUpDays.length;
  const next = catchUpDays.find((d) => !d.recorded);
  const left = total - done;

  const record = (d: CatchUpDay) => {
    recordDay(d.id);
    toast.success(`${d.label} recorded`);
    if (left === 1) setCardStateId("T3");
  };

  return (
    <div className="flex min-h-full flex-col">
      <div className="px-4 pt-1">
        <div className="flex items-center gap-3">
          <button aria-label="Back" onClick={() => router.back()} className="grid size-11 place-items-center rounded-full bg-[#DCE6FF]">
            <ArrowLeft className="size-5 text-[#1D4FD7]" />
          </button>
          <h1 className="text-[17px] font-bold">Catch up</h1>
        </div>

        <h2 className="mt-5 text-2xl font-bold">{left ? `${left} day${left > 1 ? "s" : ""} to record` : "All caught up"}</h2>
        <p className="mt-1 text-[15px] text-[#3F4451]">
          {left
            ? "Your payments are already here. For each day, just add expenses and any missing cost prices."
            : "Every missing day is recorded. Your week-on-week view is back."}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#DCDCD6]">
            <div className="h-full rounded-full bg-[#1D4FD7] transition-all" style={{ width: `${(done / total) * 100}%` }} />
          </div>
          <span className="text-sm font-semibold">
            {done} of {total} done
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-28 pt-5">
        <Group title="Needed for this week's comparison" tone="text-[#92400E]" days={catchUpDays.filter((d) => d.group === "comparison")} next={next} onRecord={record} />
        <Group title="Earlier this month" tone="text-[#5B6170]" days={catchUpDays.filter((d) => d.group === "earlier")} next={next} onRecord={record} />
        <div className="flex gap-2.5 rounded-xl bg-[#E6E6E1] p-3.5 text-sm text-[#3F4451]">
          <Info className="mt-0.5 size-4 flex-none" />
          Recorded days count toward your insights. Your streak only grows one day at a time, so past days won&apos;t change it.
        </div>
      </div>

      <div className="sticky bottom-0 mt-auto border-t border-[#E4E4E0] bg-white px-4 py-3">
        <button
          onClick={() => (next ? record(next) : router.push("/"))}
          className="h-12 w-full rounded-full bg-[#1D4FD7] text-[15px] font-bold text-white"
        >
          {next ? (done ? `Next: ${next.label}` : `Start with ${next.label}`) : "Back to Home"}
        </button>
      </div>
    </div>
  );
}

function Group({
  title,
  tone,
  days,
  next,
  onRecord,
}: {
  title: string;
  tone: string;
  days: CatchUpDay[];
  next?: CatchUpDay;
  onRecord: (d: CatchUpDay) => void;
}) {
  return (
    <section>
      <h3 className={cn("mb-2 text-xs font-bold uppercase tracking-wide", tone)}>{title}</h3>
      <div className="divide-y divide-[#ECECE8] rounded-2xl bg-white">
        {days.map((d) => (
          <div key={d.id} className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex-1">
              <div className="text-[15px] font-bold">{d.label}</div>
              <div className="text-[13px] text-[#5B6170]">{d.summary}</div>
            </div>
            {d.recorded ? (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#15803D]">
                <Check className="size-4" /> Recorded
              </span>
            ) : (
              <button
                onClick={() => onRecord(d)}
                className={cn(
                  "h-9 rounded-full px-4 text-sm font-bold",
                  next?.id === d.id ? "bg-[#1D4FD7] text-white" : "border border-[#1D4FD7] text-[#1D4FD7]",
                )}
              >
                Record
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
