const nf = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

/** "₦12,400" (no kobo). Negative numbers keep their sign after ₦ is stripped by callers. */
export function naira(n: number) {
  return `₦${nf.format(Math.abs(Math.round(n)))}`;
}

/** Signed naira: "+₦2,100" / "−₦2,100". */
export function signedNaira(n: number) {
  return `${n < 0 ? "−" : "+"}${naira(n)}`;
}

/** "₦12.35M" / "₦81.2M" / "₦46K". */
export function compactNaira(n: number, digits = 2) {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `₦${+(a / 1_000_000).toFixed(digits)}M`;
  if (a >= 1_000) return `₦${+(a / 1_000).toFixed(0)}K`;
  return naira(a);
}

/** Insight amounts abbreviate from ₦1M. */
export function insightNaira(n: number) {
  return Math.abs(n) >= 1_000_000 ? compactNaira(n, 1) : naira(n);
}

/** Split into whole naira + kobo for the "₦12,400.00" display. */
export function splitKobo(n: number) {
  const a = Math.abs(n);
  const whole = Math.floor(a);
  const kobo = Math.round((a - whole) * 100);
  return { whole: `₦${nf.format(whole)}`, kobo: `.${String(kobo).padStart(2, "0")}` };
}
