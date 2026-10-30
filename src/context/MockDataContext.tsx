"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type {
  BlueCardState,
  CardState,
  CashEntry,
  CatchUpDay,
  CoachMark,
  CoachScreen,
  DayData,
  DayId,
  FeedbackQuestion,
  FigureKey,
  Lifecycle,
  MockData,
  PeriodHistory,
  OverviewScenario,
  Period,
  ProfitLayout,
  ProfitView,
  ProfitViewData,
  ProfitViewMode,
  ResolvedProfitView,
  StreakInfo,
  Transaction,
  TxnCategory,
} from "@/types/mockData";
import business from "@/data/business.json";
import cardStates from "@/data/cardStates.json";
import streak from "@/data/streak.json";
import transactions from "@/data/transactions.json";
import profitBaseline from "@/data/profitBaseline.json";
import lossDay from "@/data/lossDay.json";
import blueCards from "@/data/blueCards.json";
import overviewScenarios from "@/data/overviewScenarios.json";
import comingSoon from "@/data/comingSoon.json";
import catchUp from "@/data/catchUp.json";
import coachMarks from "@/data/coachMarks.json";
import history from "@/data/history.json";
import feedback from "@/data/feedback.json";
import profitViewData from "@/data/profitView.json";
import { claimOnce, logRow, pinVariant, useExperiment, VARIANTS, variantForLayout, type Experiment, type VariantKey } from "@/lib/experiment";
import {
  claimProfitViewAsk,
  resolveProfitView,
  maiQuote,
  saveProfitViewPreference,
  useFeedbackLog,
  useProfitViewPreference,
  writeFeedbackLog,
  type FeedbackLogEntry,
  type ProfitViewPreference,
} from "@/lib/profitView";
import { buildFigure, liveBlueCard, liveInsight, liveScenarioInsight, type Figure } from "@/lib/figures";

const seed: MockData = {
  business,
  cardStates: cardStates as CardState[],
  streak: streak as StreakInfo,
  days: {
    healthy: { transactions: transactions as Transaction[], profitBaseline, overviewScenario: "D75" },
    loss: lossDay as DayData,
  },
  blueCards: blueCards as BlueCardState[],
  overviewScenarios: overviewScenarios as OverviewScenario[],
  comingSoon: comingSoon as MockData["comingSoon"],
  catchUp: catchUp as CatchUpDay[],
  coachMarks: coachMarks as Record<CoachScreen, CoachMark[]>,
  history: history as Record<FigureKey, PeriodHistory>,
  feedback: feedback as FeedbackQuestion[],
  profitView: profitViewData as ProfitViewData,
};

const FIGURE_KEYS = Object.keys(seed.history) as FigureKey[];

export interface ProfitTotals {
  sales: number;
  stock: number;
  expenses: number;
  profit: number;
  /** Split by source for the reviewed layout. */
  bySource: {
    moniepoint: { sales: number; stock: number; expenses: number };
    other: { sales: number; stock: number; expenses: number };
  };
}

export interface Waitlist {
  joined: boolean;
  uses: string[];
}

interface MockDataContextValue {
  data: MockData;

  // Home card
  cardStateId: string;
  setCardStateId: (id: string) => void;
  homeCard: CardState;
  /** A card state with live figures and the profit timeframe applied, as Home would show it (the /states gallery). */
  toLiveCard: (c: CardState) => CardState;
  /** A blue card with live figures applied, as the Manage page would show it. */
  toLiveBlueCard: (b: BlueCardState) => BlueCardState;
  /** User's wallet-style mask preference (true = hidden). */
  masked: boolean;
  setMasked: (m: boolean) => void;

  /** Coach marks per screen: open on first visit, replayable from the controls. */
  coachMarksOpen: Record<CoachScreen, boolean>;
  setCoachMarksOpen: (screen: CoachScreen, open: boolean) => void;

  // Streak
  streak: StreakInfo;
  updateStreakSettings: (patch: Partial<Pick<StreakInfo, "reminderTime" | "restDays">>) => void;

  /** Today's data set, picked by the Home card state (F2 = loss day). */
  day: DayData;

  // Profit / review
  transactions: Transaction[];
  setCategory: (id: string, c: TxnCategory) => void;
  cashEntries: CashEntry[];
  addCashEntry: (e: Omit<CashEntry, "id">) => void;
  removeCashEntry: (id: string) => void;
  totals: ProfitTotals;
  /** Today, week, last 7 days and month: earlier days plus today's live totals. Home, Profit and Manage all read these. */
  figures: Record<FigureKey, Figure>;
  /** Today's estimate accuracy: Low until the user sorts payments or adds cash, High once submitted. */
  accuracy: "High" | "Medium" | "Low";
  profitLayout: ProfitLayout;
  setProfitLayout: (l: ProfitLayout) => void;
  reviewed: boolean;
  submitReview: () => void;
  reviewAgain: () => void;

  // A/B test of the Profit pages
  /** Assigned Profit variant and session id; null during the static prerender. */
  experiment: Experiment | null;
  /** Opens `variant` for the rest of the flow instead of the random one (the /0, /1, /2 links). */
  pinVariant: (variant: VariantKey) => void;
  /** Logs the flow start once per session; the Profit screen calls it on open with the layout it shows. */
  startFlow: (layout: ProfitLayout) => void;
  /** Feedback sheet: opens on the Overview page once the Profit flow has been submitted, once per session. */
  feedbackOpen: boolean;
  /** Overview calls this on load; opens the sheet if a review was submitted and feedback hasn't been asked yet. */
  openDueFeedback: () => void;
  /** Logs one row per answered question, keyed by question id. */
  submitFeedback: (answers: Record<string, number>) => void;
  closeFeedback: () => void;

  // Home card timeframe
  /** Stored timeframe preference; `answeredAt` is null until the first-tap question is answered. */
  profitViewPref: ProfitViewPreference;
  /** Resolved timeframe, amounts and completeness for the Home card (and later MAI). */
  profitView: ProfitView;
  setProfitViewMode: (mode: ProfitViewMode, source: ProfitViewPreference["source"]) => void;
  /** Prototype lifecycle: which days this month the merchant has logged. New users' month figure is just those days. */
  lifecycle: Lifecycle;
  setLifecycle: (l: Lifecycle) => void;
  profitPromptOpen: boolean;
  /** Home calls this before a card drill-down. Opens MAI's question and returns true if it should be asked. */
  askProfitView: () => boolean;
  answerProfitView: (mode: ResolvedProfitView) => void;
  closeProfitPrompt: () => void;
  /** Forget the preference so the first-tap question shows again. */
  resetProfitView: () => void;
  /** Answers to MAI's question on this device (the demo bar shows them). */
  feedbackLog: FeedbackLogEntry[];
  clearFeedbackLog: () => void;

  // Manage page
  scenarioId: string;
  setScenarioId: (id: string) => void;
  scenario: OverviewScenario;
  period: Period;
  setPeriod: (p: Period) => void;
  blueCard: BlueCardState;
  blueCardOverride: string | null;
  setBlueCardOverride: (id: string | null) => void;
  chartFirst: boolean;
  setChartFirst: (v: boolean) => void;
  waitlist: Record<string, Waitlist>;
  joinWaitlist: (id: string, uses: string[]) => void;

  // Catch-up
  catchUpDays: CatchUpDay[];
  recordDay: (id: string) => void;

  resetAll: () => void;
}

const MockDataContext = createContext<MockDataContextValue | null>(null);

function computeTotals(txns: Transaction[], cash: CashEntry[], base: DayData["profitBaseline"]): ProfitTotals {
  const mp = { sales: base.sales, stock: base.stock, expenses: base.expenses };
  const other = { sales: 0, stock: 0, expenses: 0 };
  for (const t of txns) {
    const abs = Math.abs(t.amount);
    const bucket = t.source === "other" ? other : mp;
    if (t.category === "Sales") bucket.sales += abs;
    else if (t.category === "Restock") bucket.stock += abs;
    else if (t.category === "Expense") bucket.expenses += abs;
  }
  for (const c of cash) {
    if (c.kind === "Sales") other.sales += c.amount;
    else if (c.kind === "Restock") other.stock += c.amount;
    else other.expenses += c.amount;
  }
  const sales = mp.sales + other.sales;
  const stock = mp.stock + other.stock;
  const expenses = mp.expenses + other.expenses;
  return { sales, stock, expenses, profit: sales - stock - expenses, bySource: { moniepoint: mp, other } };
}

const INITIAL = {
  cardStateId: "B1",
  masked: true,
  coachMarksOpen: { home: true, profit: true, overview: true } as Record<CoachScreen, boolean>,
  scenarioId: "D75",
  profitLayout: "breakdown" as ProfitLayout,
  lifecycle: "early" as Lifecycle,
};

export function MockDataProvider({ children }: { children: ReactNode }) {
  const data = seed;

  const [cardStateId, setCardStateIdRaw] = useState(INITIAL.cardStateId);
  const [masked, setMasked] = useState(INITIAL.masked);
  const [coachMarksOpen, setCoachMarksOpenRaw] = useState(INITIAL.coachMarksOpen);
  const setCoachMarksOpen = useCallback((screen: CoachScreen, open: boolean) => {
    setCoachMarksOpenRaw((c) => ({ ...c, [screen]: open }));
  }, []);
  const [justUpdated, setJustUpdated] = useState<{ from: number; to: number } | null>(null);
  const [streakState, setStreak] = useState<StreakInfo>(data.streak);
  const [txns, setTxns] = useState<Transaction[]>(data.days.healthy.transactions);
  const [cashEntries, setCash] = useState<CashEntry[]>([]);
  const [profitLayout, setProfitLayoutRaw] = useState<ProfitLayout>(INITIAL.profitLayout);
  const [layoutBeforeReview, setLayoutBeforeReview] = useState<ProfitLayout>(INITIAL.profitLayout);
  const [reviewed, setReviewed] = useState(false);
  const experiment = useExperiment();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackDue, setFeedbackDue] = useState(false);
  const [scenarioId, setScenarioIdRaw] = useState(INITIAL.scenarioId);
  const rawScenario = data.overviewScenarios.find((s) => s.id === scenarioId) ?? data.overviewScenarios[0];
  const [period, setPeriod] = useState<Period>(rawScenario.defaultPeriod);
  const [blueCardOverride, setBlueCardOverride] = useState<string | null>(null);
  const [chartFirst, setChartFirst] = useState(false);
  const [waitlist, setWaitlist] = useState<Record<string, Waitlist>>({});
  const [catchUpDays, setCatchUpDays] = useState<CatchUpDay[]>(data.catchUp);
  const profitViewPref = useProfitViewPreference();
  const [lifecycle, setLifecycleRaw] = useState<Lifecycle>(INITIAL.lifecycle);
  const feedbackLog = useFeedbackLog();
  const [lastUpdated, setLastUpdated] = useState(data.profitView.lastUpdated);
  const [profitPromptOpen, setProfitPromptOpen] = useState(false);
  /** Amount shown before the timeframe changed, so the card counts from it. Cleared once the count has run. */
  const [viewSwitch, setViewSwitch] = useState<{ from: number; resolved: ResolvedProfitView } | null>(null);

  const baseCard = data.cardStates.find((c) => c.id === cardStateId) ?? data.cardStates[0];
  const dayId: DayId = baseCard.day ?? "healthy";
  const day = data.days[dayId];

  const totals = useMemo(() => computeTotals(txns, cashEntries, day.profitBaseline), [txns, cashEntries, day.profitBaseline]);
  const startProfit = useMemo(() => computeTotals(day.transactions, [], day.profitBaseline).profit, [day]);
  const figures = useMemo(() => {
    const today = { sales: totals.sales, expenses: totals.stock + totals.expenses };
    // A new user's month is only the days they've logged, with nothing fair to compare against.
    const { loggedDays, monthBefore } = data.profitView.lifecycles[lifecycle];
    const history: Record<FigureKey, PeriodHistory> = monthBefore
      ? {
          ...data.history,
          month: { ...data.history.month, range: `This month so far (${loggedDays.length} days recorded)`, before: monthBefore, previous: undefined },
        }
      : data.history;
    return Object.fromEntries(FIGURE_KEYS.map((k) => [k, buildFigure(k, history[k], today)])) as Record<FigureKey, Figure>;
  }, [totals, data.history, data.profitView, lifecycle]);
  const profitView = useMemo(
    () =>
      resolveProfitView(profitViewPref.mode, data.profitView, lifecycle, { today: figures.today.profit, monthToDate: figures.month.profit }, lastUpdated),
    [profitViewPref.mode, data.profitView, lifecycle, figures, lastUpdated],
  );
  const toReview = txns.filter((t) => !t.category).length;
  const edited = cashEntries.length > 0 || txns.some((t, i) => t.category !== day.transactions[i]?.category);
  const accuracy = reviewed ? "High" : edited ? "Medium" : "Low";

  const setCardStateId = useCallback(
    (id: string) => {
      setCardStateIdRaw(id);
      setJustUpdated(null);
      // Switching to a card on another day swaps in that day's payments, so Home, Profit and Manage agree.
      const next = data.cardStates.find((c) => c.id === id)?.day ?? "healthy";
      if (next !== dayId) {
        setTxns(data.days[next].transactions);
        setCash([]);
        setReviewed(false);
        setProfitLayoutRaw((l) => (l === "reviewed" ? layoutBeforeReview : l));
      }
    },
    [data, dayId, layoutBeforeReview],
  );

  const currentStreak = streakState.current;
  // Cards marked live show the same today / last-7-days numbers as the Profit and Manage pages.
  // After a review is submitted, Home shows the "Just updated" state (C6) with the live number.
  // Live cards show the resolved timeframe (today or month to date) and count up when it changes.
  const switchFrom = viewSwitch?.resolved === profitView.resolved ? viewSwitch.from : undefined;
  const toLiveCard = useCallback(
    (c: CardState): CardState => ({
      ...c,
      value: c.value.live
        ? { ...c.value, amount: Math.abs(profitView.amount), loss: profitView.amount < 0, countFrom: switchFrom ?? c.value.countFrom }
        : c.value,
      insight: c.insight.figures ? liveInsight(c.insight, figures[c.insight.figures]) : c.insight,
      profitView: c.value.live ? profitView : undefined,
    }),
    [profitView, figures, switchFrom],
  );
  const homeCard: CardState = useMemo(() => {
    if (!justUpdated) return toLiveCard(baseCard);
    const c6 = toLiveCard(data.cardStates.find((c) => c.id === "C6")!);
    const delta = justUpdated.to - justUpdated.from;
    // The review changes today's profit; the month view moves by the same amount.
    const offset = profitView.amount - profitView.today;
    const to = justUpdated.to + offset;
    return {
      ...c6,
      chip: { tone: "closed", days: currentStreak },
      value: { mode: "amount", amount: Math.abs(to), countFrom: switchFrom ?? justUpdated.from + offset, loss: to < 0 },
      status: { tone: "delta", text: "Updated just now", delta },
      profitView,
    };
  }, [baseCard, justUpdated, data.cardStates, currentStreak, profitView, toLiveCard]);

  /** Lets the card count from what it showed to the new timeframe's amount. */
  const countFromShown = useCallback(
    (resolved: ResolvedProfitView) => {
      setViewSwitch({ from: homeCard.value.amount ?? 0, resolved });
      setTimeout(() => setViewSwitch(null), 1200);
    },
    [homeCard.value.amount],
  );

  const setProfitViewMode = useCallback(
    (mode: ProfitViewMode, source: ProfitViewPreference["source"]) => {
      const next = resolveProfitView(mode, data.profitView, lifecycle, profitView, lastUpdated);
      if (next.resolved !== profitView.resolved) countFromShown(next.resolved);
      saveProfitViewPreference({ ...profitViewPref, mode, source });
    },
    [data.profitView, lifecycle, profitView, lastUpdated, countFromShown, profitViewPref],
  );

  const setLifecycle = useCallback(
    (l: Lifecycle) => {
      if (l === lifecycle) return;
      // The month amount changes with the lifecycle; under auto the timeframe can too.
      countFromShown(resolveProfitView(profitViewPref.mode, data.profitView, l, profitView, lastUpdated).resolved);
      setLifecycleRaw(l);
    },
    [lifecycle, countFromShown, profitViewPref.mode, data.profitView, profitView, lastUpdated],
  );

  const askProfitView = useCallback(() => {
    if (profitViewPref.answeredAt || !claimProfitViewAsk()) return false;
    setProfitPromptOpen(true);
    return true;
  }, [profitViewPref.answeredAt]);

  const answerProfitView = useCallback(
    (mode: ResolvedProfitView) => {
      setProfitPromptOpen(false);
      setProfitViewMode(mode, "first_tap_prompt");
      const at = new Date().toISOString();
      const variant = experiment ? VARIANTS[experiment.variant].id : variantForLayout(profitLayout);
      saveProfitViewPreference({ mode, source: "first_tap_prompt", answeredAt: at });
      writeFeedbackLog({ at, mode, lifecycle, variant });
      logRow({ variant, feedbackQuestion: data.profitView.prompt.title, feedbackResponse: mode, completedFlow: reviewed });
    },
    [setProfitViewMode, experiment, profitLayout, data.profitView.prompt.title, reviewed, lifecycle],
  );

  const clearFeedbackLog = useCallback(() => writeFeedbackLog(null), []);

  const closeProfitPrompt = useCallback(() => setProfitPromptOpen(false), []);

  const resetProfitView = useCallback(() => {
    saveProfitViewPreference(null);
    setProfitPromptOpen(false);
    setViewSwitch(null);
  }, []);

  const setCategory = useCallback((id: string, c: TxnCategory) => {
    setTxns((prev) => prev.map((t) => (t.id === id ? { ...t, category: c } : t)));
  }, []);

  const addCashEntry = useCallback((e: Omit<CashEntry, "id">) => {
    setCash((prev) => [...prev, { ...e, id: `cash-${Date.now()}` }]);
  }, []);

  const removeCashEntry = useCallback((id: string) => {
    setCash((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const setProfitLayout = useCallback((l: ProfitLayout) => {
    setProfitLayoutRaw(l);
    setReviewed(l === "reviewed");
  }, []);

  const submitReview = useCallback(() => {
    // Count up from what Home showed before the review: today's starting estimate for live cards.
    const prevAmount = baseCard.value.live ? startProfit : (baseCard.value.amount ?? 0) * (baseCard.value.loss ? -1 : 1);
    setLayoutBeforeReview(profitLayout === "reviewed" ? layoutBeforeReview : profitLayout);
    setProfitLayoutRaw("reviewed");
    setReviewed(true);
    if (profitLayout !== "reviewed" && claimOnce("completed")) {
      logRow({ variant: variantForLayout(profitLayout), feedbackQuestion: null, feedbackResponse: null, completedFlow: true });
    }
    setFeedbackDue(true);
    setLastUpdated(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
    setJustUpdated({ from: prevAmount, to: totals.profit });
    setStreak((s) => {
      if (s.todayClosed) return s;
      const current = s.current + 1;
      return {
        ...s,
        todayClosed: true,
        current,
        best: Math.max(s.best, current),
        days: s.days.map((d) => (d.state === "today" ? { ...d, state: "closed" } : d)),
      };
    });
  }, [baseCard.value, startProfit, profitLayout, layoutBeforeReview, totals.profit]);

  const startFlow = useCallback((layout: ProfitLayout) => {
    if (claimOnce("started")) {
      logRow({ variant: variantForLayout(layout), feedbackQuestion: null, feedbackResponse: null, completedFlow: false });
    }
  }, []);

  const submitFeedback = useCallback(
    (answers: Record<string, number>) => {
      const variant = variantForLayout(layoutBeforeReview);
      for (const q of data.feedback) {
        if (answers[q.id] === undefined) continue;
        logRow({ variant, feedbackQuestion: q.question, feedbackResponse: answers[q.id], completedFlow: true });
      }
    },
    [data.feedback, layoutBeforeReview],
  );

  const openDueFeedback = useCallback(() => {
    if (!feedbackDue) return;
    setFeedbackDue(false);
    if (claimOnce("feedback")) setFeedbackOpen(true);
  }, [feedbackDue]);

  const closeFeedback = useCallback(() => setFeedbackOpen(false), []);

  const reviewAgain = useCallback(() => {
    setProfitLayoutRaw(layoutBeforeReview);
    setReviewed(false);
  }, [layoutBeforeReview]);

  const setScenarioId = useCallback(
    (id: string) => {
      setScenarioIdRaw(id);
      setBlueCardOverride(null);
      const s = data.overviewScenarios.find((x) => x.id === id);
      if (s) setPeriod(s.defaultPeriod);
    },
    [data.overviewScenarios],
  );

  const scenario: OverviewScenario = useMemo(
    () => ({
      ...rawScenario,
      accuracy: rawScenario.liveAccuracy ? accuracy : rawScenario.accuracy,
      insight: rawScenario.insight && liveScenarioInsight(rawScenario.insight, (k) => figures[k]),
    }),
    [rawScenario, accuracy, figures],
  );

  const rawBlueCard =
    data.blueCards.find((b) => b.id === (blueCardOverride ?? scenario.blue[period])) ?? data.blueCards[0];
  const toLiveBlueCard = useCallback(
    (b: BlueCardState) => (b.figures ? liveBlueCard(b, figures[b.figures], { accuracy, toReview }) : b),
    [figures, accuracy, toReview],
  );
  const blueCard = toLiveBlueCard(rawBlueCard);

  const joinWaitlist = useCallback((id: string, uses: string[]) => {
    setWaitlist((w) => ({ ...w, [id]: { joined: true, uses } }));
  }, []);

  const recordDay = useCallback((id: string) => {
    setCatchUpDays((days) => days.map((d) => (d.id === id ? { ...d, recorded: true } : d)));
  }, []);

  const updateStreakSettings = useCallback((patch: Partial<Pick<StreakInfo, "reminderTime" | "restDays">>) => {
    setStreak((s) => ({ ...s, ...patch }));
  }, []);

  const resetAll = useCallback(() => {
    setCardStateIdRaw(INITIAL.cardStateId);
    setMasked(INITIAL.masked);
    setCoachMarksOpenRaw(INITIAL.coachMarksOpen);
    setJustUpdated(null);
    setStreak(data.streak);
    setTxns(data.days.healthy.transactions);
    setCash([]);
    setProfitLayoutRaw(INITIAL.profitLayout);
    setReviewed(false);
    setFeedbackOpen(false);
    setFeedbackDue(false);
    setScenarioIdRaw(INITIAL.scenarioId);
    setPeriod("week");
    setBlueCardOverride(null);
    setChartFirst(false);
    setWaitlist({});
    setCatchUpDays(data.catchUp);
    setLifecycleRaw(INITIAL.lifecycle);
    setLastUpdated(data.profitView.lastUpdated);
    resetProfitView();
  }, [data, resetProfitView]);

  const value: MockDataContextValue = {
    data,
    cardStateId,
    setCardStateId,
    homeCard,
    toLiveCard,
    toLiveBlueCard,
    masked,
    setMasked,
    coachMarksOpen,
    setCoachMarksOpen,
    streak: streakState,
    updateStreakSettings,
    day,
    transactions: txns,
    setCategory,
    cashEntries,
    addCashEntry,
    removeCashEntry,
    totals,
    figures,
    accuracy,
    profitLayout,
    setProfitLayout,
    reviewed,
    submitReview,
    reviewAgain,
    profitViewPref,
    profitView,
    setProfitViewMode,
    lifecycle,
    setLifecycle,
    profitPromptOpen,
    askProfitView,
    answerProfitView,
    closeProfitPrompt,
    resetProfitView,
    feedbackLog,
    clearFeedbackLog,
    experiment,
    pinVariant,
    startFlow,
    feedbackOpen,
    openDueFeedback,
    submitFeedback,
    closeFeedback,
    scenarioId,
    setScenarioId,
    scenario,
    period,
    setPeriod,
    blueCard,
    blueCardOverride,
    setBlueCardOverride,
    chartFirst,
    setChartFirst,
    waitlist,
    joinWaitlist,
    catchUpDays,
    recordDay,
    resetAll,
  };

  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>;
}

export function useMockData() {
  const ctx = useContext(MockDataContext);
  if (!ctx) throw new Error("useMockData must be used inside <MockDataProvider>");
  return ctx;
}

/** The profit timeframe slice: what the Home card and MAI quote, and how to change it. */
export function useProfitPerspective(hidden?: boolean) {
  const { data, profitView, profitViewPref, setProfitViewMode, masked } = useMockData();
  return {
    view: profitView,
    pref: profitViewPref,
    setMode: setProfitViewMode,
    /** MAI's sentence for the current timeframe; amounts follow `hidden` (what the card shows) or the mask preference. */
    quote: maiQuote(profitView, data.profitView, hidden ?? masked),
  };
}
