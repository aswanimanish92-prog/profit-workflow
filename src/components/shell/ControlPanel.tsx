"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMockData } from "@/context/MockDataContext";
import type { ProfitLayout, ProfitViewMode } from "@/types/mockData";

const PROFIT_LAYOUTS: { id: ProfitLayout; label: string }[] = [
  { id: "simple", label: "Simple header + Log cash" },
  { id: "breakdown", label: "Month-to-date + breakdown" },
  { id: "hero", label: "Illustrated hero" },
  { id: "no-history", label: "Not enough history yet" },
  { id: "reviewed", label: "Reviewed (per source)" },
  { id: "test1", label: "Test 1: blue header + MTD" },
  { id: "test2", label: "Test 2: hero + breakdown" },
];

const PROFIT_VIEW_MODES: { id: ProfitViewMode; label: string }[] = [
  { id: "auto_lifecycle", label: "Auto (by days logged)" },
  { id: "today", label: "Today" },
  { id: "mtd_till_date", label: "Month till today" },
  { id: "active_days", label: "Logged days only" },
];

/** Prototype-only controls: jump between the wireframe states. Hidden until toggled open. */
export function ControlPanel() {
  const m = useMockData();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const groups = Array.from(new Set(m.data.cardStates.map((c) => c.group)));

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full border border-[#DCDCD6] bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#1D4FD7] shadow-md"
      >
        Prototype controls
      </button>
    );
  }

  return (
    <aside className="w-full max-w-[390px] px-4 pb-10 text-[13px] text-[#3F4451] lg:sticky lg:top-10 lg:w-[300px] lg:px-0">
      <div className="rounded-2xl border border-[#DCDCD6] bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1D4FD7]">Prototype controls</h2>
          <div className="flex items-center gap-3">
            <button onClick={m.resetAll} className="text-xs font-semibold text-[#5B6170] underline">
              Reset
            </button>
            <button onClick={() => setOpen(false)} className="text-xs font-semibold text-[#5B6170] underline">
              Hide
            </button>
          </div>
        </div>

        <Field label="Home card state">
          <select
            value={m.cardStateId}
            onChange={(e) => {
              m.setCardStateId(e.target.value);
              router.push("/");
            }}
            className="w-full rounded-lg border border-[#DCDCD6] bg-white px-2 py-1.5"
          >
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {m.data.cardStates
                  .filter((c) => c.group === g)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} · {c.title}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          <p className="mt-1 text-xs text-[#8A909C]">{m.homeCard.when}</p>
        </Field>

        <Field label="Coach marks">
          <div className="grid grid-cols-1 gap-2">
            {(
              [
                { screen: "home", href: "/", label: "Home card" },
                { screen: "profit", href: "/profit", label: "Profit page" },
                { screen: "overview", href: "/overview", label: "Business overview" },
              ] as const
            ).map((c) => (
              <button
                key={c.screen}
                onClick={() => {
                  m.setCoachMarksOpen(c.screen, true);
                  router.push(c.href);
                }}
                className="rounded-lg border border-[#DCDCD6] bg-white px-2 py-1.5 font-semibold text-[#1D4FD7]"
              >
                Replay {c.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Mask preference">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={m.masked} onChange={(e) => m.setMasked(e.target.checked)} />
            Hide amounts (like the wallet balance)
          </label>
        </Field>

        <Field label="Profit timeframe (Home card)">
          <select
            value={m.profitViewPref.mode}
            onChange={(e) => m.setProfitViewMode(e.target.value as ProfitViewMode, "debug")}
            className="w-full rounded-lg border border-[#DCDCD6] bg-white px-2 py-1.5"
          >
            {PROFIT_VIEW_MODES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-[#8A909C]">Lifecycle, prompt reset and the feedback log are in the Demo bar at the top.</p>
        </Field>

        <Field label="Manage page scenario">
          <select
            value={m.scenarioId}
            onChange={(e) => {
              m.setScenarioId(e.target.value);
              router.push("/overview");
            }}
            className="w-full rounded-lg border border-[#DCDCD6] bg-white px-2 py-1.5"
          >
            {m.data.overviewScenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Blue card override">
          <select
            value={m.blueCardOverride ?? ""}
            onChange={(e) => {
              m.setBlueCardOverride(e.target.value || null);
              router.push("/overview");
            }}
            className="w-full rounded-lg border border-[#DCDCD6] bg-white px-2 py-1.5"
          >
            <option value="">Follow scenario + tab</option>
            {m.data.blueCards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id} · {b.title}
              </option>
            ))}
          </select>
          <label className="mt-2 flex items-center gap-2">
            <input type="checkbox" checked={m.chartFirst} onChange={(e) => m.setChartFirst(e.target.checked)} />
            Proposed order: chart before services
          </label>
        </Field>

        <Field label="Profit screen layout">
          <select
            value={m.profitLayout}
            onChange={(e) => {
              const l = e.target.value as ProfitLayout;
              m.setProfitLayout(l);
              router.push(l === "test1" || l === "test2" ? `/profit-${l}` : "/profit");
            }}
            className="w-full rounded-lg border border-[#DCDCD6] bg-white px-2 py-1.5"
          >
            {PROFIT_LAYOUTS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>

        <nav className="mt-4 grid grid-cols-2 gap-2 border-t border-[#ECECE8] pt-4 text-xs font-semibold">
          <Link className="rounded-lg bg-[#F4F4F1] px-2 py-1.5 text-center" href="/">Home</Link>
          <Link className="rounded-lg bg-[#F4F4F1] px-2 py-1.5 text-center" href="/overview">Business overview</Link>
          <Link className="rounded-lg bg-[#F4F4F1] px-2 py-1.5 text-center" href="/profit">Profit review</Link>
          <Link className="rounded-lg bg-[#F4F4F1] px-2 py-1.5 text-center" href="/catch-up">Catch up</Link>
          <Link className="col-span-2 rounded-lg bg-[#EEF4FF] px-2 py-1.5 text-center text-[#1D4FD7]" href="/states">
            All card states →
          </Link>
        </nav>
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="mb-1 text-xs font-semibold text-[#16181D]">{label}</div>
      {children}
    </div>
  );
}
