"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMockData } from "@/context/MockDataContext";
import { BusinessOverviewCard } from "@/components/card/BusinessOverviewCard";
import { BlueCard } from "@/components/overview/BlueCard";

/** Board view: every Home card state and Manage-page blue card, like the wireframe file. */
export default function StatesPage() {
  const { data, setCardStateId, setBlueCardOverride, toLiveCard, toLiveBlueCard, profitView, setProfitViewMode, lifecycle } = useMockData();
  const router = useRouter();
  const groups = Array.from(new Set(data.cardStates.map((c) => c.group)));

  return (
    <main className="min-h-dvh bg-[#F2F2EF] px-4 py-10 sm:px-12">
      <div className="mx-auto max-w-[1180px]">
        <Link href="/" className="text-sm font-semibold text-[#1D4FD7]">
          ← Back to prototype
        </Link>
        <h1 className="mt-3 text-3xl font-bold">Business overview card · all states</h1>
        <p className="mt-1 max-w-2xl text-[15px] text-[#5B6170]">
          Every state from the wireframes, rendered from <code>src/data/cardStates.json</code>. Tap a card to open it on Home.
        </p>
        <p className="mt-2 max-w-2xl text-[13px] text-[#5B6170]">
          Live cards follow the current profit timeframe: <b>{profitView.label}</b> ({data.profitView.lifecycles[lifecycle].label},{" "}
          {profitView.resolvedBy === "user" ? "merchant's choice" : "auto by days logged"}). Use any card&apos;s pill or the Demo bar to switch.
        </p>

        {groups.map((g) => (
          <section key={g} className="mt-12">
            <h2 className="text-xl font-bold">{g}</h2>
            <div className="mt-5 grid gap-x-10 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
              {data.cardStates
                .filter((c) => c.group === g)
                .map((c) => (
                  <div key={c.id}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-md bg-[#16181D] px-1.5 py-0.5 text-xs font-bold text-white">{c.id}</span>
                      <span className="text-[15px] font-bold">{c.title}</span>
                    </div>
                    <div className="max-w-[358px]">
                      <BusinessOverviewCard
                        card={toLiveCard(c)}
                        masked={false}
                        still
                        onViewChange={(mode) => setProfitViewMode(mode, "debug")}
                        onAction={() => {
                          setCardStateId(c.id);
                          router.push("/");
                        }}
                      />
                    </div>
                    <p className="mt-2 max-w-[358px] text-[13px] text-[#3F4451]">
                      <b>{g.startsWith("Overlaps") ? "Situation" : "When"}</b> {c.when}
                    </p>
                    <p className="mt-1 max-w-[358px] text-[13px] text-[#5B6170]">
                      <b>{g.startsWith("Overlaps") ? "" : "Tap "}</b>
                      {c.tap}
                    </p>
                  </div>
                ))}
            </div>
          </section>
        ))}

        <section className="mt-16">
          <h2 className="text-xl font-bold">Manage page · Blue card states</h2>
          <div className="mt-5 grid gap-x-10 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
            {data.blueCards.map((b) => (
              <div key={b.id} className="max-w-[358px]">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-md bg-[#16181D] px-1.5 py-0.5 text-xs font-bold text-white">{b.id}</span>
                  <span className="text-[15px] font-bold">{b.title}</span>
                </div>
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    setBlueCardOverride(b.id);
                    router.push("/overview");
                  }}
                >
                  <BlueCard card={toLiveBlueCard(b)} onAction={() => {}} />
                </div>
                <p className="mt-2 text-[13px] text-[#3F4451]">{b.note}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
