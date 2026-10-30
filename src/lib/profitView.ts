"use client";

import { useSyncExternalStore } from "react";
import { naira } from "@/lib/format";
import type { Lifecycle, ProfitView, ProfitViewData, ProfitViewMode, ResolvedProfitView } from "@/types/mockData";

/** The merchant's chosen timeframe for the Home card. Kept on this device, like the A/B variant. */
export interface ProfitViewPreference {
  mode: ProfitViewMode;
  source: "default" | "first_tap_prompt" | "pill" | "debug";
  /** Set once the first-tap question is answered; until then the question can be asked. */
  answeredAt: string | null;
}

export const DEFAULT_PREFERENCE: ProfitViewPreference = { mode: "auto_lifecycle", source: "default", answeredAt: null };

const PREF_KEY = "mbl-profit-view"; // localStorage
const ASKED_KEY = "mbl-profit-view-asked"; // sessionStorage: ask at most once per session
const LOG_KEY = "mbl-profit-view-log"; // localStorage: answers given on this device, for the demo bar

const listeners = new Set<() => void>();
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let cached: ProfitViewPreference | undefined;

function read(): ProfitViewPreference {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(PREF_KEY);
    cached = raw ? { ...DEFAULT_PREFERENCE, ...JSON.parse(raw) } : DEFAULT_PREFERENCE;
  } catch {
    cached = DEFAULT_PREFERENCE;
  }
  return cached!;
}

/** Stored preference; the default during the static prerender. */
export function useProfitViewPreference(): ProfitViewPreference {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_PREFERENCE);
}

/** Saves the preference, or clears it (and the once-per-session ask) with null. */
export function saveProfitViewPreference(p: ProfitViewPreference | null) {
  cached = p ?? DEFAULT_PREFERENCE;
  try {
    if (p) localStorage.setItem(PREF_KEY, JSON.stringify(p));
    else {
      localStorage.removeItem(PREF_KEY);
      sessionStorage.removeItem(ASKED_KEY);
    }
  } catch {
    // Storage blocked: the preference lasts for this page load only.
  }
  listeners.forEach((fn) => fn());
}

/** True the first time it's called this session. */
export function claimProfitViewAsk(): boolean {
  try {
    if (sessionStorage.getItem(ASKED_KEY)) return false;
    sessionStorage.setItem(ASKED_KEY, "1");
  } catch {
    // Storage blocked: ask anyway.
  }
  return true;
}

/** One answer to MAI's question, kept on this device. Every tester's answer also goes to the analytics sheet. */
export interface FeedbackLogEntry {
  at: string;
  mode: ResolvedProfitView;
  lifecycle: Lifecycle;
  variant: string;
}

const NO_LOG: FeedbackLogEntry[] = [];
let cachedLog: FeedbackLogEntry[] | undefined;

function readLog(): FeedbackLogEntry[] {
  if (cachedLog) return cachedLog;
  try {
    cachedLog = JSON.parse(localStorage.getItem(LOG_KEY) ?? "[]");
  } catch {
    cachedLog = [];
  }
  return cachedLog!;
}

export function useFeedbackLog(): FeedbackLogEntry[] {
  return useSyncExternalStore(subscribe, readLog, () => NO_LOG);
}

/** Adds an entry, or empties the log with null. */
export function writeFeedbackLog(entry: FeedbackLogEntry | null) {
  cachedLog = entry ? [...readLog(), entry] : [];
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(cachedLog));
  } catch {
    // Storage blocked: the log lasts for this page load only.
  }
  listeners.forEach((fn) => fn());
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Fills `{monthStart}` and `{days}` in the prompt copy. */
export function fillPrompt(text: string, data: ProfitViewData, days: number) {
  return text.replace("{monthStart}", data.monthStart).replace("{days}", plural(days, "day"));
}

/** Picks the timeframe and writes the label and secondary line. `today` and `monthToDate` are profits. */
export function resolveProfitView(
  mode: ProfitViewMode,
  data: ProfitViewData,
  lifecycle: Lifecycle,
  f: { today: number; monthToDate: number },
  lastUpdatedTime: string,
): ProfitView {
  const { loggedDays } = data.lifecycles[lifecycle];
  const days = loggedDays.length;
  const daysText = `${plural(days, "day")} logged`;
  const partial = days < data.lifecycleThreshold;
  const resolved: ResolvedProfitView = mode !== "auto_lifecycle" ? mode : partial ? "today" : "mtd_till_date";
  const base = {
    mode,
    resolved,
    resolvedBy: mode === "auto_lifecycle" ? ("lifecycle_rule" as const) : ("user" as const),
    today: f.today,
    monthToDate: f.monthToDate,
    completeness: { daysLoggedInMonth: days, daysElapsedInMonth: data.dayOfMonth, loggedDays, lastUpdatedTime },
    partial,
  };
  if (resolved === "today") {
    return {
      ...base,
      amount: f.today,
      label: "Today's profit",
      secondary: { before: `${data.monthShort} total (${daysText}): `, amount: f.monthToDate },
    };
  }
  // Days without records add nothing, so the logged-days total equals month to date; only the framing differs.
  return {
    ...base,
    amount: f.monthToDate,
    label:
      resolved === "active_days"
        ? `Profit on your ${plural(days, "record day")} (${data.monthShort})`
        : `${data.monthShort} profit (till today, ${lastUpdatedTime})`,
    secondary: { before: "Today: ", amount: f.today, signed: true, after: ` • ${daysText}` },
  };
}

/** Fills {month}, {monthShort} and {days} in timeframe-aware copy (coach marks). */
export function fillView(text: string, view: ProfitView, data: ProfitViewData) {
  return text
    .replaceAll("{monthShort}", data.monthShort)
    .replaceAll("{month}", data.monthLong)
    .replaceAll("{days}", plural(view.completeness.daysLoggedInMonth, "day"));
}

/** Days before today with no record. */
export function missingDays(view: ProfitView) {
  const { daysElapsedInMonth, loggedDays } = view.completeness;
  return Array.from({ length: daysElapsedInMonth }, (_, i) => i + 1).filter((d) => !loggedDays.includes(d));
}

/** MAI's one-line profit quote. Amounts follow the mask preference. */
export function maiQuote(view: ProfitView, data: ProfitViewData, masked: boolean) {
  const amt = (n: number) => (masked ? "₦ •••" : n < 0 ? `a loss of ${naira(n)}` : naira(n));
  const days = view.completeness.daysLoggedInMonth;
  if (view.resolved === "today") {
    return `Your profit today is ${amt(view.today)} (${amt(view.monthToDate)} across the ${plural(days, "day")} you've recorded this month).`;
  }
  if (view.resolved === "active_days") {
    return `Your profit across the ${plural(days, "day")} you've recorded in ${data.monthLong} is ${amt(view.monthToDate)}.`;
  }
  return `Your ${data.monthLong} profit till ${view.completeness.lastUpdatedTime} today is ${amt(view.monthToDate)}.`;
}
