"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/** Mobile bottom sheet, scoped to the phone frame (absolute, not fixed). */
export function BottomSheet({
  open,
  onClose,
  children,
  className,
  label,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  label: string;
}) {
  const host = useSyncExternalStore(
    noopSubscribe,
    () => document.getElementById("phone-overlay"),
    () => null,
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!host) return null;
  return createPortal(
    <div
      className={cn("absolute inset-0 transition-opacity", open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0")}
      aria-hidden={!open}
    >
      <button aria-label="Close" className="absolute inset-0 h-full w-full bg-[#16181D]/60" onClick={onClose} tabIndex={-1} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn(
          "absolute inset-x-0 bottom-0 max-h-[92%] overflow-y-auto rounded-t-[28px] bg-white px-5 pb-6 pt-3 transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full",
          className,
        )}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#DCDCD6]" />
        {children}
      </div>
    </div>,
    host,
  );
}

const noopSubscribe = () => () => {};
