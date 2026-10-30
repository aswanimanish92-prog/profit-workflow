"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, Settings } from "lucide-react";
import { useMockData } from "@/context/MockDataContext";
import { BlueCard } from "@/components/overview/BlueCard";
import { BusinessChart } from "@/components/overview/BusinessChart";
import {
  BookkeepingServices,
  CalcAndAccuracy,
  Invoices,
  MoneyInOut,
  PayYourself,
  ProfitInsight,
  StreakRow,
  YourRecords,
} from "@/components/overview/Sections";
import { StreakSheet } from "@/components/card/StreakSheet";
import { CoachMarks } from "@/components/shell/CoachMarks";
import { FeedbackSheet } from "@/components/profit/FeedbackSheet";
import { MissingDays } from "@/components/overview/MissingDays";
import { cn } from "@/lib/utils";
import type { CardTarget, Period } from "@/types/mockData";

const TABS: { id: Period; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

export default function OverviewPage() {
  const router = useRouter();
  const m = useMockData();
  const { scenario, blueCard, period, chartFirst } = m;
  const [streakOpen, setStreakOpen] = useState(false);
  // Feedback on the Profit flow waits until the Overview coach marks are out of the way.
  const { openDueFeedback } = m;
  const touring = m.coachMarksOpen.overview;
  useEffect(() => {
    if (!touring) openDueFeedback();
  }, [touring, openDueFeedback]);

  const act = (t: CardTarget) => {
    if (t === "setup") {
      if (m.scenarioId === "S1") {
        // Last setup step done: first calculation is next.
        m.setScenarioId("M3");
        m.setCardStateId("A5");
        router.push("/profit");
      } else {
        m.setScenarioId("S1");
        m.setCardStateId("A4");
        toast("Setup 2 of 3 done");
      }
    } else if (t === "catch-up") router.push("/catch-up");
    else if (t === "review") router.push("/profit");
  };

  const services = (
    <div key="services" data-coach="services">
      <BookkeepingServices />
    </div>
  );
  const chart = (
    <div key="chart" data-coach="chart">
      <BusinessChart chart={scenario.chart} onSetup={() => act("setup")} />
    </div>
  );

  return (
    <div className="flex flex-col gap-4 px-4 pb-8">
      <header className="flex items-center justify-between pt-1">
        <button aria-label="Back" onClick={() => router.push("/")} className="grid size-11 place-items-center rounded-full bg-[#DCE6FF]">
          <ArrowLeft className="size-5 text-[#1D4FD7]" />
        </button>
        <h1 className="text-[17px] font-bold">Business overview</h1>
        {/* Reminder and rest-day settings live in the streak sheet. */}
        <button aria-label="Settings" onClick={() => setStreakOpen(true)} className="grid size-11 place-items-center">
          <Settings className="size-5" />
        </button>
      </header>

      <div data-coach="tabs" className="flex gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={period === t.id}
            onClick={() => {
              m.setBlueCardOverride(null);
              m.setPeriod(t.id);
            }}
            className={cn(
              "h-11 flex-1 rounded-full border text-sm font-bold",
              period === t.id ? "border-[#16181D] bg-[#16181D] text-white" : "border-[#DCDCD6] bg-white",
            )}
          >
            {t.label}
          </button>
        ))}
        <button aria-label="Pick dates" onClick={() => toast("Custom dates open here")} className="grid size-11 flex-none place-items-center rounded-full border border-[#DCDCD6] bg-white">
          <CalendarDays className="size-[18px]" />
        </button>
      </div>

      <div data-coach="blue">
        <BlueCard card={blueCard} onAction={act} />
      </div>
      <MissingDays onAdd={() => router.push("/catch-up")} />
      <div data-coach="money">
        <MoneyInOut money={scenario.money} />
      </div>
      {chartFirst ? [chart, services] : [services, chart]}
      {scenario.insight && (
        <div data-coach="insight">
          <ProfitInsight insight={scenario.insight} />
        </div>
      )}
      {scenario.payYourself && (
        <div data-coach="pay">
          <PayYourself pay={scenario.payYourself} />
        </div>
      )}
      <div data-coach="records">
        <YourRecords records={scenario.records} onCta={() => router.push("/profit")} onSeeAll={() => router.push("/catch-up")} />
      </div>
      <Invoices inv={scenario.invoices} />
      <div data-coach="accuracy">
        <CalcAndAccuracy accuracy={scenario.accuracy} />
      </div>
      {scenario.streakRow && (
        <div data-coach="streak">
          <StreakRow row={scenario.streakRow} onOpen={() => setStreakOpen(true)} />
        </div>
      )}

      <StreakSheet open={streakOpen} onClose={() => setStreakOpen(false)} />
      <FeedbackSheet />
      {m.coachMarksOpen.overview && (
        <CoachMarks
          key={m.scenarioId}
          marks={m.data.coachMarks.overview}
          variant={blueCard.kind === "setup" ? "setup" : undefined}
          onDone={() => m.setCoachMarksOpen("overview", false)}
        />
      )}
    </div>
  );
}
