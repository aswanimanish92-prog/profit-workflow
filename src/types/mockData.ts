// ---------- Home: Business overview card ----------

/** Flame chip on the card header. */
export type ChipTone =
  | "closed" // filled orange: today closed
  | "open" // outlined grey: today still open
  | "risk" // orange ring: at risk
  | "gold" // milestone / personal best
  | "freeze" // saved by a freeze
  | "rest"; // rest day

export type ValueMode =
  | "amount" // shows the number (respects the mask preference)
  | "locked" // ₦ ••• with a lock, nothing to reveal
  | "skeleton"; // loading

export type StatusTone =
  | "plain" // grey text
  | "dot" // blue dot + dark text (pending / new activity)
  | "warn" // amber banner with warning icon
  | "error" // red banner
  | "neutral" // grey banner (streak saved / ended)
  | "celebrate" // gold banner
  | "delta"; // green delta pill + "Updated just now"

export type InsightKind =
  | "none"
  | "text" // plain line
  | "progress" // dots under a line
  | "bar" // setup progress bar
  | "change"; // amount + % / absolute change + suffix

/** Where a tap on the card or CTA goes. */
export type CardTarget =
  | "intro" // MBL intro / setup
  | "setup" // the exact setup step left
  | "review" // today's review (profit screen)
  | "overview" // MBL / Business overview
  | "overview-week"
  | "catch-up"
  | "streak"
  | "retry"
  | "none";

export interface CardInsight {
  kind: InsightKind;
  /** Bold lead, e.g. "Last 7 days". */
  label?: string;
  /** Amount in naira; follows the mask. */
  amount?: number;
  /** Extra text right after the amount, e.g. " · 3 of 7 days recorded". */
  after?: string;
  /** Signed percent change; shown with an arrow, never masked. */
  pct?: number;
  /** Absolute change in naira (used when the base is zero or negative). */
  absChange?: number;
  /** Fill amount and change from this period's live figures instead of the numbers above. */
  figures?: FigureKey;
  /** Suffix after the change, e.g. "vs previous 7". */
  suffix?: string;
  /** Flat state (within ±2%). */
  flat?: boolean;
  /** progress dots: filled / total. */
  filled?: number;
  total?: number;
  /** setup bar 0..1 */
  progress?: number;
}

export interface CardState {
  id: string; // e.g. "B2"
  group: string; // e.g. "B. Returning: reveal and freshness"
  title: string; // e.g. "Calculated today, revealed"
  when: string;
  tap: string;
  header: string;
  /** Second header line (business name for F11). */
  sub?: string;
  chip?: { tone: ChipTone; days: number };
  value: {
    mode: ValueMode;
    amount?: number;
    /** Grey: not today's number. */
    stale?: boolean;
    loss?: boolean;
    approx?: boolean;
    /** Abbreviate (₦12.35M). */
    compact?: boolean;
    /** Start revealed regardless of the mask preference (A6, B2). */
    forceReveal?: boolean;
    /** Show a one-time "Tap to hide" tooltip (A6). */
    tooltip?: string;
    /** Count up from this value on first render (C6). */
    countFrom?: number;
    /** Show today's live profit from the Profit page instead of `amount`. */
    live?: boolean;
  };
  status: {
    tone: StatusTone;
    text: string;
    delta?: number;
    /** Variant of `text` used while the value is masked. */
    maskedText?: string;
    /** Count in the text ticks up while the user is looking (C7). */
    liveTick?: boolean;
    confetti?: boolean;
    muted?: boolean;
    dark?: boolean;
  };
  insight: CardInsight;
  cta: { label: string; target: CardTarget };
  /** Whole card navigates (new users: nothing to reveal). */
  wholeCard?: boolean;
  /** Start masked even if the user's preference is revealed (B1). */
  startMasked?: boolean;
  /** Not tappable (F6). */
  loading?: boolean;
  /** Which day's payments the Profit and Manage pages show with this card (default "healthy"). */
  day?: DayId;
  /** Timeframe pill, label and secondary line. Filled by the context for `value.live` cards. */
  profitView?: ProfitView;
}

// ---------- Streaks ----------

export type StreakDayState = "closed" | "freeze" | "rest" | "missed" | "today" | "future";

export interface StreakDay {
  date: string; // ISO yyyy-mm-dd
  day: number;
  state: StreakDayState;
}

export interface StreakInfo {
  current: number;
  best: number;
  freezes: number;
  todayClosed: boolean;
  reminderTime: string;
  restDays: string;
  rangeLabel: string;
  days: StreakDay[];
}

// ---------- Profit screen (today's review) ----------

export type TxnCategory = "Sales" | "Restock" | "Expense" | "Personal" | "Others";

export interface Transaction {
  id: string;
  name: string;
  /** Second line, e.g. "GTBank • 0047744374" or "Credit". */
  meta: string;
  time?: string;
  /** Positive = money in, negative = money out. */
  amount: number;
  /** Unset = uncategorised: no chip selected and left out of profit until the user picks one. */
  category?: TxnCategory;
  source: "moniepoint" | "other";
}

export interface CashEntry {
  id: string;
  kind: "Sales" | "Restock" | "Expense";
  amount: number;
  note: string;
}

export interface ProfitBaseline {
  /** Already-categorised Moniepoint activity not in the review list. */
  sales: number;
  stock: number;
  expenses: number;
}

export type FigureKey = "today" | "todayEarly" | "week" | "last7" | "month" | "monthNew";

export interface SalesExpenses {
  sales: number;
  /** Stock and other expenses together, as on the blue card. */
  expenses: number;
}

/** Days in a period before today, plus the period it is compared with. Today's live totals are added on top. */
export interface PeriodHistory {
  /** Used in verdicts, e.g. "this week". */
  word: string;
  range: string;
  /** e.g. "last Wednesday", for "₦1,100 more than last Wednesday". */
  compareText?: string;
  before: SalesExpenses;
  previous?: SalesExpenses;
}

export type ProfitLayout =
  | "simple" // blue header + Log cash
  | "breakdown" // blue header with MTD + breakdown table
  | "hero" // illustration header
  | "no-history" // MTD "Not enough history yet"
  | "reviewed" // after submit: per-source breakdown
  | "test1" // /profit-test1: blue header with MTD, no header cash button
  | "test2"; // /profit-test2: illustrated hero + breakdown, Submit and continue

// ---------- Manage page (Business overview) ----------

export type Period = "today" | "week" | "month";

export interface BlueCardRow {
  label: "Sales" | "Expenses";
  amount: number;
  /** Naira change; undefined = no comparison. 0 = "Same". */
  change?: number;
  /** Is this change good news? (expenses down = good) */
  good?: boolean;
}

export interface BlueCardState {
  id: string;
  title: string;
  note: string;
  kind: "live" | "setup";
  // live
  period?: string;
  range?: string;
  amount?: number;
  loss?: boolean;
  approx?: boolean;
  change?: { amount: number; text: string } | null;
  noCompare?: string;
  rows?: BlueCardRow[];
  verdict?: string;
  todo?: { tone: "ok" | "info" | "warn"; text: string; target: CardTarget };
  /** Amount, rows, change, verdict and to-do follow these live figures. */
  figures?: FigureKey;
  // setup
  setupTitle?: string;
  setupText?: string;
  steps?: { done: number; total: number };
  setupCta?: { label: string; target: CardTarget };
  setupNote?: string;
}

export interface ChartPoint {
  label: string;
  sales: number;
  expenses: number;
}

export interface RecordDay {
  dow: string; // S M T W T F S
  state: "recorded" | "missed" | "rest" | "empty" | "today";
}

export interface OverviewScenario {
  id: string;
  title: string;
  daysRecorded: number;
  /** Blue card per period tab. */
  blue: Record<Period, string>;
  defaultPeriod: Period;
  money: { in: number; out: number; pending: number };
  chart:
    | { kind: "example" }
    | {
        kind: "live";
        subtitle: string;
        headline: string;
        points: ChartPoint[];
        footnote: string;
      };
  insight?: {
    heading: string;
    body: string;
    /** Write `body` from these live figures. */
    figures?: FigureKey;
    /** A row with `figures` gets its sub filled with "You keep ₦N of every ₦100". */
    rows: { title: string; sub: string; locked?: boolean; figures?: FigureKey }[];
  };
  payYourself?: { taken: number; safe: number };
  records: { summary: string; days: RecordDay[]; cta?: string };
  invoices: { label: string; count: number; paid: number; paidCount: number; unpaid: number; unpaidCount: number };
  accuracy: "High" | "Medium" | "Low" | "Not set up";
  /** Accuracy follows today's Profit page instead of `accuracy`. */
  liveAccuracy?: boolean;
  streakRow?: { title: string; sub: string };
}

export interface ComingSoonFeature {
  id: "items" | "customers";
  name: string;
  pitch: string;
  uses: string[];
}

// ---------- Catch-up ----------

export interface CatchUpDay {
  id: string;
  label: string; // "Mon 12 Oct"
  summary: string; // "23 sales · ₦61,000 in · 4 payments out"
  group: "comparison" | "earlier";
  recorded: boolean;
}

// ---------- Root ----------

export interface Business {
  owner: string;
  initials: string;
  level: number;
  name: string;
  accountNumber: string;
  walletBalance: number;
  otherBusinesses: string[];
}

// ---------- Coach marks ----------

export type CoachScreen = "home" | "profit" | "overview";

/** Element a coach mark spotlights (matches a data-coach attribute on the screen). */
export type CoachTarget =
  // Home card
  | "card"
  | "value"
  | "chip"
  | "status"
  | "insight"
  | "cta"
  | "timeframe"
  | "mai"
  // Profit
  | "profit"
  | "month"
  | "breakdown"
  | "accuracy"
  | "txn"
  | "cash"
  | "how"
  | "submit"
  // Overview
  | "tabs"
  | "blue"
  | "missing"
  | "todo"
  | "money"
  | "services"
  | "chart"
  | "pay"
  | "records"
  | "streak";

export interface CoachMark {
  id: string;
  target: CoachTarget;
  title: string;
  body: string;
  /** Body overrides keyed by screen variant, e.g. "wholeCard" (new-user Home card) or "setup" (profit not set up). */
  variants?: Record<string, string>;
  /**
   * Copy for the merchant's profit timeframe. "partial" (too few days logged) wins over the resolved view.
   * Title and body may use {month}, {monthShort} and {days} ("2 days").
   */
  byView?: Partial<Record<ResolvedProfitView | "partial", { title?: string; body?: string }>>;
}

export type DayId = "healthy" | "loss";

/** One day's data, kept in agreement across Home, Profit and the Manage page. */
export interface DayData {
  transactions: Transaction[];
  profitBaseline: ProfitBaseline;
  /** Manage page scenario the card body and "See why" open. */
  overviewScenario: string;
}

export interface MockData {
  business: Business;
  cardStates: CardState[];
  streak: StreakInfo;
  days: Record<DayId, DayData>;
  history: Record<FigureKey, PeriodHistory>;
  blueCards: BlueCardState[];
  overviewScenarios: OverviewScenario[];
  comingSoon: ComingSoonFeature[];
  catchUp: CatchUpDay[];
  coachMarks: Record<CoachScreen, CoachMark[]>;
  feedback: FeedbackQuestion[];
  profitView: ProfitViewData;
}

// ---------- Profit view: which timeframe the Home card shows ----------

export type ProfitViewMode = "auto_lifecycle" | "today" | "mtd_till_date" | "active_days";
/** What the card actually shows; auto_lifecycle resolves to one of these. */
export type ResolvedProfitView = Exclude<ProfitViewMode, "auto_lifecycle">;
/** New users have logged fewer days this month than `lifecycleThreshold`. */
export type Lifecycle = "early" | "mature";

/** src/data/profitView.json */
export interface ProfitViewData {
  monthShort: string;
  monthLong: string;
  monthStart: string;
  /** Today's date in the month; days before it without a record are missing. */
  dayOfMonth: number;
  /** auto_lifecycle shows Today below this many logged days, the month from it on. */
  lifecycleThreshold: number;
  lastUpdated: string;
  lifecycles: Record<
    Lifecycle,
    {
      label: string;
      /** Dates this month with records, today included. */
      loggedDays: number[];
      /** Totals of the logged days before today. Omit to use the month history (`history.month`). */
      monthBefore?: SalesExpenses;
    }
  >;
  /** First-tap question from MAI. `{monthStart}` and `{days}` are filled in. */
  prompt: { title: string; subtitle: string; options: { mode: ResolvedProfitView; label: string }[] };
  /** Manage-page nudge for new users; `{missing}` is filled in. */
  missingNudge: string;
}

export interface ProfitView {
  /** Stored preference. */
  mode: ProfitViewMode;
  resolved: ResolvedProfitView;
  resolvedBy: "user" | "lifecycle_rule";
  /** Profit for the resolved period. */
  amount: number;
  today: number;
  monthToDate: number;
  /** e.g. "Today's profit", "Oct profit (till today, 9:30 AM)". */
  label: string;
  /** Line under the value; `amount` is masked with the value. */
  secondary: { before: string; amount: number; signed?: boolean; after?: string };
  completeness: {
    daysLoggedInMonth: number;
    daysElapsedInMonth: number;
    loggedDays: number[];
    lastUpdatedTime: string;
  };
  /** Below the lifecycle threshold: too few days for a fair month total. */
  partial: boolean;
}

// ---------- Feedback after the Profit flow ----------

/** Shown one at a time after Submit. The answer logged is the number tapped, or the option's 1-based position. */
export interface FeedbackQuestion {
  id: string;
  question: string;
  scale:
    | { kind: "number"; min: number; max: number; low: string; high: string }
    | { kind: "labels"; options: string[] };
}
