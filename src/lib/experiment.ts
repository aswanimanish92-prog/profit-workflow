"use client";

import { useSyncExternalStore } from "react";
import { readDebug } from "@/lib/debug";
import type { ProfitLayout } from "@/types/mockData";

/** The three Profit pages under test. Merchants are split evenly and keep their page on this device. */
export const VARIANTS = {
  A: { id: "profit_page_test", route: "/profit" },
  B: { id: "profit_page_1", route: "/profit-test1" },
  C: { id: "profit_page_2", route: "/profit-test2" },
} as const;

export type VariantKey = keyof typeof VARIANTS;
export type VariantId = (typeof VARIANTS)[VariantKey]["id"];

export interface Experiment {
  sessionId: string;
  variant: VariantKey;
  /** Set by a /0, /1 or /2 link this session: the variant was chosen, not randomised. */
  pinned: boolean;
}

/** One row in the sheet. Flow start, flow completion and each feedback answer each send one. */
export interface AnalyticsRow {
  timestamp: string;
  sessionId: string;
  variant: VariantId;
  feedbackQuestion: string | null;
  /** A number for the Profit-flow questions; the chosen mode id for the Home timeframe question. */
  feedbackResponse: number | string | null;
  completedFlow: boolean;
  /** Team sessions opened with ?debug=, so they can be filtered out of the results. */
  debug: boolean;
}

const VARIANT_KEY = "mbl-variant"; // localStorage: same page on every visit
const SESSION_KEY = "mbl-session"; // sessionStorage: one id per browser session
const PINNED_KEY = "mbl-pinned"; // sessionStorage: variant came from a /0, /1 or /2 link
const ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_URL;

/** Assigned variant and session id. null during the static prerender. */
export function useExperiment(): Experiment | null {
  return useSyncExternalStore(subscribe, readExperiment, () => null);
}

const listeners = new Set<() => void>();
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Replaces the random assignment with `variant`, on this device from now on. */
export function pinVariant(variant: VariantKey) {
  safeSet(localStorage, VARIANT_KEY, variant);
  safeSet(sessionStorage, PINNED_KEY, "1");
  resolved = { ...readExperiment(), variant, pinned: true };
  listeners.forEach((fn) => fn());
}

let resolved: Experiment | undefined;

/** Reads or creates the assignment once per page load; later calls return the cached object. */
function readExperiment(): Experiment {
  if (resolved) return resolved;
  let variant = safeGet(localStorage, VARIANT_KEY) as VariantKey | null;
  if (!variant || !(variant in VARIANTS)) {
    const keys = Object.keys(VARIANTS) as VariantKey[];
    variant = keys[Math.floor(Math.random() * keys.length)];
    safeSet(localStorage, VARIANT_KEY, variant);
  }
  let sessionId = safeGet(sessionStorage, SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    safeSet(sessionStorage, SESSION_KEY, sessionId);
  }
  return (resolved = { sessionId, variant, pinned: safeGet(sessionStorage, PINNED_KEY) === "1" });
}

/** Short links that pin a variant: /0 → A, /1 → B, /2 → C. */
export const PIN_LINKS = { "0": "A", "1": "B", "2": "C" } as const satisfies Record<string, VariantKey>;

/** The variant a Profit layout belongs to. Debug sessions can open any layout, so log what was seen. */
export function variantForLayout(layout: ProfitLayout): VariantId {
  if (layout === "test1") return VARIANTS.B.id;
  if (layout === "test2") return VARIANTS.C.id;
  return VARIANTS.A.id;
}

/** True the first time `step` is claimed this session, so starts, completions and feedback log once. */
export function claimOnce(step: "started" | "completed" | "feedback"): boolean {
  const key = `mbl-${step}`;
  if (safeGet(sessionStorage, key)) return false;
  safeSet(sessionStorage, key, "1");
  return true;
}

/**
 * Sends one row to the Google Sheets web app (see scripts/sheets-webhook.gs). Apps Script can't answer a
 * CORS preflight, so the body goes as text/plain via sendBeacon, which also survives the page closing.
 * Without NEXT_PUBLIC_ANALYTICS_URL the row is only printed to the console.
 */
export function logRow(row: Omit<AnalyticsRow, "timestamp" | "sessionId" | "debug">) {
  const full: AnalyticsRow = { timestamp: new Date().toISOString(), sessionId: readExperiment().sessionId, debug: readDebug(), ...row };
  if (!ENDPOINT) {
    console.info("[analytics]", full);
    return;
  }
  const body = JSON.stringify(full);
  try {
    if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "text/plain" }))) return;
  } catch {
    // Fall through to fetch.
  }
  fetch(ENDPOINT, { method: "POST", mode: "no-cors", keepalive: true, headers: { "Content-Type": "text/plain" }, body }).catch(() => {});
}

function safeGet(store: Storage, key: string) {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(store: Storage, key: string, value: string) {
  try {
    store.setItem(key, value);
  } catch {
    // Private mode or blocked storage: the assignment lasts until the next reload.
  }
}
