"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bell,
  CircleHelp,
  CreditCard,
  Gift,
  Grid2x2,
  House,
  LayoutGrid,
  Lightbulb,
  PiggyBank,
  ReceiptText,
  Send,
  Smartphone,
  Trophy,
  Wifi,
  Zap,
} from "lucide-react";
import { useMockData } from "@/context/MockDataContext";
import { BusinessOverviewCard } from "@/components/card/BusinessOverviewCard";
import { StreakSheet } from "@/components/card/StreakSheet";
import { ProfitViewSheet } from "@/components/card/ProfitViewSheet";
import { CoachMarks } from "@/components/shell/CoachMarks";
import { useCardActions } from "@/components/card/useCardActions";
import { splitKobo } from "@/lib/format";
import type { CardTarget } from "@/types/mockData";

const SERVICES = [
  { label: "Transfer", icon: Send },
  { label: "Airtime", icon: Smartphone },
  { label: "Data", icon: Wifi },
  { label: "Betting", icon: Trophy },
  { label: "Savings", icon: PiggyBank },
  { label: "Electricity", icon: Zap },
  { label: "Invoices", icon: ReceiptText, href: "/overview" },
  { label: "More", icon: LayoutGrid },
];

/** Outside this prototype's scope: acknowledge the tap without leaving Home. */
const notBuilt = (label: string) => toast(`${label} opens here`);

export default function HomePage() {
  const router = useRouter();
  const { data, homeCard, masked, setMasked, coachMarksOpen, setCoachMarksOpen, askProfitView, setProfitViewMode } = useMockData();
  const balance = splitKobo(data.business.walletBalance);
  const { act, streakOpen, setStreakOpen } = useCardActions();
  // A3: no business activity, so the card sits below Services.
  const belowServices = homeCard.id !== "A3";
  // First drill-down from a profit card asks MAI's timeframe question instead (once, until answered).
  const onCardAction = (t: CardTarget) => {
    if (homeCard.profitView && t !== "streak" && t !== "retry" && askProfitView()) return;
    act(t);
  };

  const card = (
    <section className="px-4">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-lg font-bold">Business overview</h2>
        <Link href="/overview" className="text-sm font-semibold text-[#1D4FD7] underline underline-offset-2">
          Manage
        </Link>
      </div>
      <BusinessOverviewCard
        // Profit cards stay mounted when the timeframe or amount changes, so a revealed value stays revealed and counts up.
        key={homeCard.id + (homeCard.profitView ? "" : (homeCard.value.amount ?? ""))}
        card={homeCard}
        masked={masked}
        onMaskChange={setMasked}
        onAction={onCardAction}
        onViewChange={(mode) => setProfitViewMode(mode, "pill")}
      />
    </section>
  );

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between px-4 pb-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-full bg-[#16213E] text-sm font-bold text-white">
            {data.business.initials}
          </div>
          <span className="text-[17px] font-medium">Level {data.business.level}</span>
        </div>
        <div className="flex gap-2 text-[#5B6170]">
          {[
            { I: CircleHelp, l: "Help" },
            { I: Lightbulb, l: "Tips" },
            { I: Bell, l: "Notifications" },
          ].map(({ I, l }) => (
            <button key={l} aria-label={l} onClick={() => notBuilt(l)} className="grid size-9 place-items-center rounded-lg bg-white">
              <I className="size-[18px]" />
            </button>
          ))}
        </div>
      </header>

      <section className="px-4">
        <div className="rounded-2xl bg-[#2B2F38] p-5 text-white">
          <div className="text-[13px] font-medium text-white/80">Wallet balance</div>
          {/* Tapping the balance sets the wallet mask preference, which the Business overview card follows. */}
          <button
            onClick={() => setMasked(!masked)}
            aria-label={masked ? "Show balance" : "Hide balance"}
            className={`mt-2 block text-2xl font-bold ${masked ? "tracking-[2px]" : ""}`}
          >
            {masked ? "₦ •••••" : `${balance.whole}${balance.kobo}`}
          </button>
          <div className="mt-1 text-xs text-white/60">
            {data.business.name} · {data.business.accountNumber}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-[13px] font-semibold">
            {["Add money", "Transfer", "Withdraw"].map((l) => (
              <button key={l} onClick={() => notBuilt(l)} className="rounded-full bg-white/10 py-2 text-center">
                {l}
              </button>
            ))}
          </div>
        </div>
      </section>

      {!belowServices && <div className="h-5" />}
      {belowServices && <div className="mt-5">{card}</div>}

      <section className="mt-5 px-4">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-lg font-bold">Services</h2>
          <button onClick={() => notBuilt("Edit services")} className="text-sm font-semibold text-[#1D4FD7] underline underline-offset-2">
            Edit
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {SERVICES.map(({ label, icon: I, href }) => (
            <button
              key={label}
              onClick={() => (href ? router.push(href) : notBuilt(label))}
              className="flex flex-col items-center gap-2 rounded-xl bg-white py-3.5 text-xs font-medium"
            >
              <I className="size-5 text-[#1D4FD7]" />
              {label}
            </button>
          ))}
        </div>
      </section>

      {!belowServices && <div className="mt-5">{card}</div>}

      <div className="flex-1" />
      <nav className="sticky bottom-0 mt-6 grid grid-cols-4 border-t border-[#E4E4E0] bg-white py-2 text-xs">
        {[
          { l: "Home", I: House, on: true },
          { l: "Card", I: CreditCard },
          { l: "Services", I: Grid2x2 },
          { l: "Rewards", I: Gift },
        ].map(({ l, I, on }) => (
          <button
            key={l}
            aria-current={on ? "page" : undefined}
            onClick={() => (on ? document.getElementById("phone-scroll")?.scrollTo({ top: 0, behavior: "smooth" }) : notBuilt(l))}
            className={`flex flex-col items-center gap-1 ${on ? "font-semibold text-[#1D4FD7]" : "text-[#5B6170]"}`}
          >
            <I className="size-5" />
            {l}
          </button>
        ))}
      </nav>

      <StreakSheet open={streakOpen} onClose={() => setStreakOpen(false)} />
      <ProfitViewSheet />
      {coachMarksOpen.home && (
        <CoachMarks
          key={homeCard.id}
          marks={data.coachMarks.home}
          variant={homeCard.wholeCard ? "wholeCard" : undefined}
          onDone={() => setCoachMarksOpen("home", false)}
        />
      )}
    </div>
  );
}
