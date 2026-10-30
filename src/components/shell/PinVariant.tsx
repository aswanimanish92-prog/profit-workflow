"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMockData } from "@/context/MockDataContext";
import { PIN_LINKS } from "@/lib/experiment";

/** Behind /0, /1 and /2: pins that link's Profit variant, then starts the flow from Home. */
export function PinVariant({ link }: { link: keyof typeof PIN_LINKS }) {
  const router = useRouter();
  const { pinVariant } = useMockData();

  useEffect(() => {
    pinVariant(PIN_LINKS[link]);
    router.replace("/");
  }, [link, pinVariant, router]);

  return null;
}
