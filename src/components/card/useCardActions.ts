"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useMockData } from "@/context/MockDataContext";
import type { CardTarget } from "@/types/mockData";

/** Maps a card tap target to a prototype route or sheet. */
export function useCardActions() {
  const router = useRouter();
  const { setScenarioId, setPeriod, setCardStateId, cardStateId, day, profitView } = useMockData();
  // The Manage page opens on the same timeframe the Home card shows.
  const cardPeriod = profitView.resolved === "today" ? "today" : "month";
  const [streakOpen, setStreakOpen] = useState(false);

  const act = useCallback(
    (t: CardTarget) => {
      switch (t) {
        case "intro":
          setScenarioId("M0");
          router.push("/overview");
          break;
        case "setup":
          setScenarioId("S1");
          router.push("/overview");
          break;
        case "review":
          router.push("/profit");
          break;
        case "overview":
          setScenarioId(day.overviewScenario);
          setPeriod(cardPeriod);
          router.push("/overview");
          break;
        case "overview-week":
          setScenarioId(day.overviewScenario);
          setPeriod("week");
          router.push("/overview");
          break;
        case "catch-up":
          router.push("/catch-up");
          break;
        case "streak":
          setStreakOpen(true);
          break;
        case "retry": {
          // Refetch in place: loading skeleton, then the loaded card.
          const back = cardStateId === "F8" ? "F1" : cardStateId;
          setCardStateId("F6");
          setTimeout(() => setCardStateId(back), 1200);
          break;
        }
      }
    },
    [router, setScenarioId, setPeriod, setCardStateId, cardStateId, day.overviewScenario, cardPeriod],
  );

  return { act, streakOpen, setStreakOpen };
}
