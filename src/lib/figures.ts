import type { BlueCardRow, BlueCardState, CardInsight, FigureKey, OverviewScenario, PeriodHistory } from "@/types/mockData";
import { naira } from "@/lib/format";

/** One period's numbers: the days before today plus today's live Profit-page totals. */
export interface Figure {
  key: FigureKey;
  sales: number;
  expenses: number;
  profit: number;
  previous?: { sales: number; expenses: number; profit: number };
  history: PeriodHistory;
}

export function buildFigure(key: FigureKey, history: PeriodHistory, today: { sales: number; expenses: number }): Figure {
  const sales = history.before.sales + today.sales;
  const expenses = history.before.expenses + today.expenses;
  const p = history.previous;
  return {
    key,
    sales,
    expenses,
    profit: sales - expenses,
    previous: p && { ...p, profit: p.sales - p.expenses },
    history,
  };
}

/** Percent change against the comparison period; undefined when there is none or its profit is ≤ 0. */
export function pctChange(f: Figure, digits = 0): number | undefined {
  if (!f.previous || f.previous.profit <= 0) return undefined;
  const m = 10 ** digits;
  return Math.round(((f.profit - f.previous.profit) / f.previous.profit) * 100 * m) / m;
}

/** "You keep ₦17 of every ₦100" */
export function keepPer100(f: Figure) {
  return f.sales > 0 ? `You keep ₦${Math.max(0, Math.round((f.profit / f.sales) * 100))} of every ₦100` : "";
}

function verdict(f: Figure, compare: boolean) {
  const { word } = f.history;
  if (f.profit < 0) return `You spent ${naira(-f.profit)} more than you made ${word}.`;
  if (!compare || !f.previous) return `You kept ₦${Math.round((f.profit / Math.max(f.sales, 1)) * 100)} of every ₦100 you sold ${word}.`;
  const soldMore = f.sales >= f.previous.sales;
  const spentMore = f.expenses > f.previous.expenses;
  if (soldMore && !spentMore) return "You sold more and spent less. Well done.";
  if (soldMore) return f.profit >= f.previous.profit ? "Sales grew faster than your spending." : "You sold more, but spending grew faster. Check your costs.";
  if (!spentMore) return "Sales were lower, but you spent less.";
  return "Sales were lower and you spent more.";
}

/** Fills a blue card from live figures so it matches Home and the Profit page. */
export function liveBlueCard(
  card: BlueCardState,
  f: Figure,
  review: { accuracy: string; toReview: number },
): BlueCardState {
  const compare = !!card.change && !!f.previous;
  const prev = f.previous;
  const row = (r: BlueCardRow): BlueCardRow => {
    const isSales = r.label === "Sales";
    const amount = isSales ? f.sales : f.expenses;
    // No comparison period (e.g. a new user's month): drop the seed change rather than show a stale one.
    if (!prev) return { ...r, amount, change: undefined };
    if (!compare || r.change === undefined) return { ...r, amount };
    const change = amount - (isSales ? prev.sales : prev.expenses);
    return { ...r, amount, change, good: isSales ? change >= 0 : change <= 0 };
  };
  const diff = prev ? f.profit - prev.profit : 0;
  return {
    ...card,
    range: f.history.range,
    amount: Math.abs(f.profit),
    loss: f.profit < 0,
    change: compare ? { amount: diff, text: `${diff >= 0 ? "more" : "less"} than ${f.history.compareText}` } : prev ? card.change : undefined,
    rows: card.rows?.map(row),
    verdict: verdict(f, compare),
    todo: {
      tone: review.toReview ? "info" : "ok",
      text: `Accuracy: ${review.accuracy} · ${
        review.toReview ? `${review.toReview} payment${review.toReview > 1 ? "s" : ""} to review` : "all payments reviewed"
      }`,
      target: "review",
    },
  };
}

/** Home insight line ("Last 7 days ₦… ▲12%") from live figures. */
export function liveInsight(i: CardInsight, f: Figure): CardInsight {
  const out: CardInsight = { ...i, amount: f.profit };
  if (i.pct === undefined && i.absChange === undefined) return out;
  const pct = pctChange(f);
  if (pct !== undefined) return { ...out, pct, absChange: undefined, suffix: i.pct !== undefined ? i.suffix : "vs previous 7" };
  // Comparison period made a loss: a percentage means nothing, so show the naira difference.
  const diff = f.previous ? f.profit - f.previous.profit : 0;
  return { ...out, pct: undefined, absChange: diff > 0 ? diff : undefined, suffix: diff > 0 ? `than ${f.history.compareText}` : undefined };
}

/** Writes the Manage-page insight paragraph from live figures. */
export function liveScenarioInsight(
  insight: NonNullable<OverviewScenario["insight"]>,
  figure: (k: FigureKey) => Figure,
): NonNullable<OverviewScenario["insight"]> {
  const rows = insight.rows.map((r) => (r.figures ? { ...r, sub: keepPer100(figure(r.figures)) } : r));
  if (!insight.figures) return { ...insight, rows };
  const f = figure(insight.figures);
  let body =
    f.profit >= 0
      ? `You sold ${naira(f.sales)} and spent ${naira(f.expenses)}, so you kept ${naira(f.profit)}.`
      : `You sold ${naira(f.sales)} and spent ${naira(f.expenses)}, a loss of ${naira(-f.profit)}.`;
  if (f.previous) {
    const diff = f.profit - f.previous.profit;
    const ds = f.sales - f.previous.sales;
    const de = f.expenses - f.previous.expenses;
    const why = Math.abs(de) > Math.abs(ds) ? `you spent ${de > 0 ? "more" : "less"}` : `you sold ${ds > 0 ? "more" : "less"}`;
    body += ` That's ${naira(diff)} ${diff >= 0 ? "more" : "less"} than ${f.history.compareText}, mostly because ${why}.`;
  }
  return { ...insight, body, rows };
}
