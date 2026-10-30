"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMockData } from "@/context/MockDataContext";
import { BottomSheet } from "@/components/shell/BottomSheet";
import { cn } from "@/lib/utils";
import { Flame } from "./icons";
import type { StreakDayState } from "@/types/mockData";

const REMINDERS = ["5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"];
const REST = ["Sundays", "Saturdays and Sundays", "No rest days"];

const DAY: Record<StreakDayState, string> = {
  closed: "bg-[#EA580C] text-white",
  freeze: "bg-[#EEF4FF] text-[#1E3A8A] ring-2 ring-[#7EA2EA]",
  rest: "bg-[#ECECE8] text-[#8A909C]",
  missed: "border border-dashed border-[#A3A8B2] text-[#5B6170]",
  today: "ring-2 ring-[#EA580C] text-[#EA580C]",
  future: "text-[#C4C7CE]",
};

export function StreakSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { streak, updateStreakSettings } = useMockData();
  const router = useRouter();
  const [editing, setEditing] = useState<"reminder" | "rest" | null>(null);

  const title = `${streak.current}-day streak`;
  const sub = streak.todayClosed ? "Today is closed. See you tomorrow" : `Close today to make it ${streak.current + 1}`;

  return (
    <BottomSheet open={open} onClose={onClose} label="Streak details">
      <div className="flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-full bg-[#FFEDE0]">
          <Flame fill={streak.todayClosed ? "#EA580C" : "none"} stroke="#EA580C" size={22} />
        </div>
        <div className="flex-1">
          <h2 className="text-[22px] font-bold leading-7">{title}</h2>
          <p className="text-sm text-[#5B6170]">{sub}</p>
        </div>
        <button aria-label="Close" onClick={onClose} className="grid size-10 place-items-center rounded-full bg-[#F4F4F1]">
          <X className="size-5" />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          [streak.current, "Current"],
          [streak.best, "Best"],
          [streak.freezes, "Freeze saved"],
        ].map(([n, l]) => (
          <div key={l} className="rounded-xl bg-[#F4F4F1] p-3">
            <div className="text-xl font-bold">{n}</div>
            <div className="text-xs text-[#5B6170]">{l}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-baseline justify-between">
        <h3 className="text-[15px] font-bold">Last 4 weeks</h3>
        <span className="text-[13px] text-[#5B6170]">{streak.rangeLabel}</span>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-y-2 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="text-xs font-medium text-[#8A909C]">
            {d}
          </span>
        ))}
        {streak.days.map((d) => (
          <span key={d.date} className="grid place-items-center">
            <span className={cn("grid size-9 place-items-center rounded-full text-sm font-bold", DAY[d.state])}>{d.day}</span>
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#5B6170]">
        <Legend cls="bg-[#EA580C]" label="Closed" />
        <Legend cls="ring-2 ring-[#7EA2EA] bg-white" label="Freeze used" />
        <Legend cls="bg-[#ECECE8]" label="Rest day" />
        <Legend cls="border border-dashed border-[#A3A8B2]" label="Missed" />
        <Legend cls="ring-2 ring-[#EA580C] bg-white" label="Today" />
      </div>

      <div className="mt-5 divide-y divide-[#ECECE8] border-t border-[#ECECE8]">
        <SettingRow
          title="Daily reminder"
          value={`${streak.reminderTime}, only if today is open`}
          editing={editing === "reminder"}
          onEdit={() => setEditing(editing === "reminder" ? null : "reminder")}
          options={REMINDERS}
          current={streak.reminderTime}
          onPick={(v) => {
            updateStreakSettings({ reminderTime: v });
            setEditing(null);
          }}
        />
        <SettingRow
          title="Rest days"
          value={streak.restDays}
          editing={editing === "rest"}
          onEdit={() => setEditing(editing === "rest" ? null : "rest")}
          options={REST}
          current={streak.restDays}
          onPick={(v) => {
            updateStreakSettings({ restDays: v });
            setEditing(null);
          }}
        />
      </div>

      <button
        onClick={() => (streak.todayClosed ? onClose() : router.push("/profit"))}
        className="mt-5 h-12 w-full rounded-full bg-[#1D4FD7] text-[15px] font-bold text-white"
      >
        {streak.todayClosed ? "Done" : "Close today"}
      </button>
    </BottomSheet>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-full", cls)} />
      {label}
    </span>
  );
}

function SettingRow(props: {
  title: string;
  value: string;
  editing: boolean;
  onEdit: () => void;
  options: string[];
  current: string;
  onPick: (v: string) => void;
}) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[15px] font-semibold">{props.title}</div>
          <div className="text-[13px] text-[#5B6170]">{props.value}</div>
        </div>
        <button onClick={props.onEdit} className="h-9 rounded-full border border-[#DCDCD6] px-4 text-sm font-semibold">
          {props.editing ? "Cancel" : "Change"}
        </button>
      </div>
      {props.editing && (
        <div className="mt-2 flex flex-wrap gap-2">
          {props.options.map((o) => (
            <button
              key={o}
              onClick={() => props.onPick(o)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[13px] font-medium",
                o === props.current ? "border-[#1D4FD7] bg-[#EEF4FF] text-[#1D4FD7]" : "border-[#DCDCD6]",
              )}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
