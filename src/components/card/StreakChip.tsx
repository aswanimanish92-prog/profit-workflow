import type { ChipTone } from "@/types/mockData";
import { cn } from "@/lib/utils";
import { Flame, Moon, Snowflake } from "./icons";

const TONES: Record<ChipTone, { box: string; fill: string; stroke: string }> = {
  closed: { box: "bg-[#FFEDE0] border border-[#FFD3B8] text-[#7C2D12]", fill: "#EA580C", stroke: "#EA580C" },
  open: { box: "bg-[#F4F4F1] border border-[#DCDCD6] text-[#3F4451]", fill: "none", stroke: "#8A909C" },
  risk: { box: "bg-[#FFF7F0] border-2 border-[#EA580C] text-[#7C2D12] animate-[ring-pulse_1.2s_ease-out_1]", fill: "none", stroke: "#EA580C" },
  gold: { box: "bg-[#FEF6D8] border border-[#E9C46A] text-[#713F12]", fill: "#CA8A04", stroke: "#CA8A04" },
  freeze: { box: "bg-[#EEF4FF] border border-[#C9D8F5] text-[#1E3A8A]", fill: "none", stroke: "#8A909C" },
  rest: { box: "bg-[#F4F4F1] border border-[#DCDCD6] text-[#3F4451]", fill: "none", stroke: "#8A909C" },
};

const LABEL: Record<ChipTone, string> = {
  closed: "today closed",
  open: "today still open",
  risk: "at risk, close today",
  gold: "milestone",
  freeze: "saved by a freeze",
  rest: "rest day",
};

export function StreakChip({ tone, days, onClick }: { tone: ChipTone; days: number; onClick?: () => void }) {
  const t = TONES[tone];
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      aria-label={`${days}-day streak, ${LABEL[tone]}. Open streak details`}
      className={cn("inline-flex h-7 flex-none items-center gap-1 rounded-full pl-2 pr-2.5 text-[13px] font-bold", t.box)}
    >
      <Flame fill={t.fill} stroke={t.stroke} />
      <span>{days}</span>
      {tone === "freeze" && <Snowflake />}
      {tone === "rest" && <Moon />}
    </button>
  );
}
