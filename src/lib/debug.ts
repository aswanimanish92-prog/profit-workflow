"use client";

import { useSyncExternalStore } from "react";

/** Link param that unlocks the prototype controls and /states, e.g. `/?debug=<key>`. */
const PARAM = "debug";
const STORAGE_KEY = "mbl-debug";
const DEBUG_KEY = process.env.NEXT_PUBLIC_DEBUG_KEY;

/** Routes merchants must never reach. */
export const DEBUG_ROUTES = ["/states"];

/**
 * True when prototype controls should show: always in `next dev`; in a build, only after the link
 * carried `?debug=<NEXT_PUBLIC_DEBUG_KEY>`. Kept in sessionStorage so reloads and in-app navigation
 * stay unlocked. null during the static prerender.
 */
export function useDebugMode(): boolean | null {
  return useSyncExternalStore(noopSubscribe, readDebug, () => null);
}

let resolved: boolean | undefined;

/** Reads the link once per page load; later calls return the cached answer. */
export function readDebug(): boolean {
  if (resolved !== undefined) return resolved;
  if (process.env.NODE_ENV === "development") return (resolved = true);
  const url = new URL(window.location.href);
  const given = url.searchParams.get(PARAM);
  if (given !== null) {
    // Drop the key from the address bar so it isn't forwarded with a screenshot or copied link.
    url.searchParams.delete(PARAM);
    window.history.replaceState(window.history.state, "", url);
    if (DEBUG_KEY && given === DEBUG_KEY) safeSet(STORAGE_KEY, "1");
  }
  return (resolved = safeGet(STORAGE_KEY) === "1");
}

const noopSubscribe = () => () => {};

function safeGet(key: string) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: debug lasts until the next reload.
  }
}
