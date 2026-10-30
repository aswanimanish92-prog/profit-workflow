# Prototype Build Checklist
## Phase 1: Data & State Setup
- [x] Inspect all CSV/JSON files in raw-data/ (folder was empty; data taken from "Business Overview Card Wireframes.html" + Profit screenshots)
- [x] Convert raw files into clean JSON files in src/data/
- [x] Generate TypeScript interfaces in src/types/mockData.ts
- [x] Build src/context/MockDataContext.tsx

## Phase 2: Screens & Flows
- [x] Build screens and wire to useMockData()
  - [x] Home with Business overview card (55 states: A1–A6, B1–B6, C1–C7, D1–D10, tiers T1–R-M, F1–F11, overlaps P1–P4)
  - [x] Streak sheet (chip tap) with editable reminder / rest days
  - [x] Business overview (Manage) page: tabs, blue card (14 states), money in/out, services + coming-soon sheet / waitlist, chart, insight, pay yourself, records, invoices, accuracy, streak row
  - [x] Manage scenarios: D=75, M0, setup started, M3, M5, O4, O1; "chart before services" order toggle
  - [x] Profit review screen, 5 layouts from screenshots (simple, breakdown, hero, no-history, reviewed); live recategorising, add cash, submit → Home "Just updated"
  - [x] Catch-up queue
  - [x] /states gallery of every card + blue card state
  - [x] Prototype controls panel (hidden by default; floating toggle)
  - [x] Coach marks on the Home card: spotlight walkthrough of each slot (value/eye, streak chip, status, insight, CTA, tap-to-open); shows on first visit, skips slots the current state lacks, replay from controls; copy in src/data/coachMarks.json
  - [x] Coach marks on the Profit page explaining the proposition: profit worked out for you, month on track, breakdown, accuracy, sort payments, add cash, full working, submit to close the day; adapts to all 5 layouts
  - [x] Coach marks on Business overview: tabs, blue card, to-do, money in/out, services, chart, insight, pay yourself, records, accuracy, streak; setup-state copy for M0/S1/O1; restarts on scenario change
- [x] Interactivity pass: no dead taps or hardcoded screen data
  - [x] Home wallet reads name/account/balance from business.json; balance tap toggles the shared mask preference
  - [x] Home header icons, wallet actions, Services tiles (Invoices → /overview), Edit, bottom nav respond
  - [x] Overview: Settings opens streak/reminder sheet, date picker, insight rows, "See all" → /catch-up
  - [x] Profit: accuracy derived in context (Low → Medium after edits → High after submit); signed vs-last-month %

- [x] Profit page uses raw-data/moniebook_lite_dummy_transactions_sep2026.json: Demo Mama Put Kitchen (BIZ-F), 30 Sep as "today"
  - [x] 9 successful payments (pending/failed/reversed dropped); dataset categories mapped to Sales/Restock/Expense/Personal/Others
  - [x] 4 uncategorised payments start with no chip selected; fees count as expenses; month-to-date from 1–29 Sep
- [x] Home card "View details" CTA → /profit (card body still → Manage)
- [x] Profit test variants (screenshots 2026-10-28), shared screen in src/components/profit/ProfitScreen.tsx
  - [x] /profit-test1: blue header with *profit, month to date + vs last month, no header cash button, "Cash or money elsewhere?" after payments
  - [x] /profit-test2: illustrated hero + breakdown (MTD, vs last month, accuracy), cash prompt above and below payments, "Submit and continue"
  - [x] Both selectable from the Prototype controls "Profit screen layout" menu

## Phase 3: Alpha harness (see concepts_brief.md, ALPHA_PLAN.md)
- [x] Research table for Q1–Q3 in ALPHA_PLAN.md (thresholds TBD until cohort size is decided)
- [x] Jargon audit baseline in ALPHA_PLAN.md (suggestions only; copy unchanged)
- [x] Merchant-safe build: controls panel and /states hidden unless the link has `?debug=<NEXT_PUBLIC_DEBUG_KEY>` (always on in `next dev`); key stripped from the address bar, kept in sessionStorage
- [x] Link preview title "Moniebook Lite"; fake 9:30 status bar shown only in the desktop phone frame
- [x] Loss day agrees across screens: F2 (`day: "loss"`) swaps in src/data/lossDay.json; Profit and Manage (D75L, blue card TL) both show Loss ₦2,400; Submit counts from −₦2,400
- [x] Healthy day agreement: one set of live figures (src/lib/figures.ts) feeds Home, Profit and Manage
  - [x] src/data/history.json: days before today (Sep dataset, BIZ-F) for today, week, last 7 days and month, plus comparison periods; August comparison is synthetic (+2.6% at start)
  - [x] Home cards with `value.live` show today's profit (₦10,595 at start); "Last 7 days" insights with `figures: "last7"`
  - [x] Blue cards T1, TL, D4T, W1, M1, M5 with `figures`: amount, rows, change, verdict and to-do (accuracy + payments left) are computed
  - [x] Manage insight paragraph, "keep ₦N of every ₦100" row and accuracy follow the same figures (D75, D75L, M5)
  - [x] Profit month to date and vs last month come from the month figure; losses labelled "Loss" in the breakdown
  - [x] Submit counts Home up from the starting estimate to the reviewed profit
- [x] Adaptive profit display (SPEC "Adaptive Profit Display", architecture table there)
  - [x] Home card pill + label + secondary line; `auto_lifecycle` under 5 logged days → Today, else month till now
  - [x] MAI's first-tap question (ProfitViewSheet): saves the mode, animates the card, logs to the sheet and the device log
  - [x] MAI banner on Home quotes the same view (`useProfitPerspective`), masked with the card
  - [x] New user's month figure = logged days only, everywhere (Home, MAI, Manage blue card, Profit page MTD); no stale comparison
  - [x] Card drill-down opens Manage on the matching tab; missing-days nudge + day strip for new users
  - [x] Demo bar: New user (2 days) / Mature user (20 days), reset 1st-click prompt, feedback log
  - [x] Profit page header leads with the Home timeframe (today, or "Your October profit so far" / recorded days) with the other figure below; new users get "Oct so far (2 recorded days)" and "Not enough days yet" instead of "–"; all 7 layouts
  - [x] Coach marks follow the timeframe (`byView` in coachMarks.json, `{month}`/`{days}` tokens, "partial" wins); new steps: timeframe pill, MAI, missing days
  - [x] /states renders live cards and blue cards through the same transforms as Home and Manage (`toLiveCard`, `toLiveBlueCard`)
- [ ] Home "Last 7 days" insight ignores lifecycle (a 2-day user sees a 7-day figure)
- [ ] MAI chat drawer (none exists; only the banner and the question sheet)
- [ ] Still static: N1 and G1 week cards (early-days / missed-days histories), chart, money in/out, pay yourself, records dots, /states gallery
- [ ] Gap scenario: new card with "Today" and "Catch up" side by side; rename to `returning_after_7_days`
- [ ] Relative dates (no fixed "2 Sep" / "16 Oct" / "30 Sep")
- [ ] alphaScenarios.json + applyScenario(id); link and session handling in sessionStorage
- [ ] track(), event list, offline queue
- [x] Feedback prompt: A/B test of the three Profit pages (src/lib/experiment.ts): random even split kept in localStorage, sessionId in sessionStorage, merchants sent from /profit to their assigned page (variant routes open by direct URL, no debug key); two questions from src/data/feedback.json on the Overview load after the Profit flow is submitted; rows (start, completion, answers) POSTed to a Google Sheets web app (scripts/sheets-webhook.gs) via NEXT_PUBLIC_ANALYTICS_URL
- [x] Variant links: /0, /1, /2 pin Profit variant A, B, C (src/components/shell/PinVariant.tsx) and open Home; without one the random split applies
- [x] /ceo: frozen copy of Home (src/app/ceo/page.tsx) for the CEO test; / keeps evolving separately
- [ ] Provider, consent and intro screen
- [ ] Link generation for account managers; dry run in WhatsApp and Gmail in-app browsers

## Open
- [ ] Real illustration asset for the hero Profit layout (CSS placeholder now)
- [ ] Business switcher for F11 (open question 5 in wireframes)
