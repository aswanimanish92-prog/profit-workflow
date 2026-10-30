"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DEBUG_ROUTES, useDebugMode } from "@/lib/debug";
import { VARIANTS } from "@/lib/experiment";
import { useMockData } from "@/context/MockDataContext";
import { ControlPanel } from "./ControlPanel";
import { DemoBar } from "./DemoBar";

/** Centres a 390×844 phone on desktop with the prototype controls beside it; full-bleed on phones. */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const debug = useDebugMode();
  const { experiment } = useMockData();
  const assigned = experiment && VARIANTS[experiment.variant].route;
  const path = pathname.replace(/\/$/, "") || "/";
  const debugRoute = DEBUG_ROUTES.some((r) => path.startsWith(r));
  // In-app links all point to /profit, so merchants are sent on to their assigned variant from there.
  // The variant routes themselves open for anyone with the URL. Debug skips this unless a /0, /1, /2 link pinned the variant.
  const toAssigned = path === "/profit" && assigned && assigned !== path ? assigned : null;
  const redirect = debug === false && debugRoute ? "/" : debug === false || experiment?.pinned ? toAssigned : null;
  const blocked = (debugRoute && debug !== true) || redirect !== null;

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  if (blocked) return null;
  if (pathname.startsWith("/states")) return <>{children}</>;

  return (
    <div className="flex min-h-dvh flex-col items-center gap-6 bg-[#E9E8E3] lg:flex-row lg:items-start lg:justify-center lg:gap-10 lg:py-10">
      <div className="relative w-full overflow-hidden bg-[#F2F2EF] sm:mt-6 sm:w-[390px] sm:rounded-[36px] sm:shadow-[0_0_0_10px_#16181D,0_20px_60px_rgba(0,0,0,0.25)] lg:mt-0">
        <div className="relative flex h-dvh flex-col sm:h-[844px]">
          <StatusBar />
          <div id="phone-scroll" className="relative flex-1 overflow-y-auto">
            {children}
          </div>
          <div id="phone-overlay" className="pointer-events-none absolute inset-0 z-40" />
        </div>
      </div>
      {debug && <ControlPanel />}
      {debug && <DemoBar />}
    </div>
  );
}

/** Fake status bar for the desktop phone frame only; on a real phone the OS draws its own. */
function StatusBar() {
  return (
    <div className="hidden h-9 flex-none items-center justify-between px-6 sm:flex text-[13px] font-semibold text-[#16181D]">
      <span>9:30</span>
      <span className="flex items-center gap-1" aria-hidden="true">
        <span className="h-2.5 w-4 rounded-sm bg-[#16181D]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#16181D]" />
      </span>
    </div>
  );
}
