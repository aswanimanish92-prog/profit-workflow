# Business Overview Prototype — Spec

Source of truth: `~/Downloads/Business Overview Card Wireframes.html` (boards A–F, overlaps, Manage page, blue card states) and five Profit-screen screenshots (2026-10-26).

## Screens
| Route | What |
|---|---|
| `/` | Home. Wallet card, Business overview card, Services. Card state comes from `cardStates.json`. |
| `/overview` | Business overview (Manage page / "MBL"). Today · This week · This month tabs drive the blue card. |
| `/profit` | Today's review. Recategorise payments, add cash, submit. Five layouts = the five screenshots. |
| `/catch-up` | Missed-days queue (B5, B6, G1). |
| `/states` | Gallery of every card and blue-card state. |

## Card rules (from "Card anatomy")
- Five slots: header + streak chip, value, status line, insight line, CTA.
- Two tap zones: value/eye reveals in place; the rest opens the Manage page. New users (nothing to reveal) → whole card navigates.
- Status line + CTA show the single highest-priority condition; chip, value, insight each show their own state.
- Masked amounts follow the wallet preference; % and arrows are never masked. Re-mask on background.
- Grey value = not today's number. Loss uses the word "Loss" in muted red. Never show ₦0 for an error.

## Merchant build vs debug
`/states` and the Prototype controls only appear in `next dev` or after opening a link with `?debug=<NEXT_PUBLIC_DEBUG_KEY>` (set the env var at build time; without it, debug can't be unlocked in a build).

## Profit page A/B test
Merchants are split evenly at random across three Profit pages: A `profit_page_test` = `/profit`, B `profit_page_1` = `/profit-test1`, C `profit_page_2` = `/profit-test2`. The variant is kept in localStorage (same page on every visit); a `sessionId` (`crypto.randomUUID()`) is kept in sessionStorage. Outside debug, `/profit` (where every in-app link points) sends the merchant to their assigned page; `/profit-test1` and `/profit-test2` open directly for anyone with the URL. Links `/0`, `/1`, `/2` pin variant A, B, C on this device (replacing the random assignment) and open Home, so every Profit link from Home to the end of the flow shows that variant, in debug sessions too. Debug sessions can open any layout and are logged with `debug: true`.

Once the Profit flow is submitted, the next Overview load (after its coach marks close) opens a bottom sheet, once per session, that asks the questions in `src/data/feedback.json` one at a time, then says thank you. Each row is POSTed to `NEXT_PUBLIC_ANALYTICS_URL` (a Google Apps Script web app, `scripts/sheets-webhook.gs`; set at build time, or rows only go to the console): `{timestamp, sessionId, variant, feedbackQuestion, feedbackResponse, completedFlow, debug}`. Per session it logs one flow start (`completedFlow: false`), one completion (`true`, no question) and one row per answer; the variant is the layout actually shown.

## State
All screen data reads from and mutates `src/context/MockDataContext.tsx`. Submitting the review closes today (streak +1) and puts Home into "Just updated" (C6) with the computed profit counting up.

A card state can set `day` (`"healthy"` default, `"loss"` for F2). The day picks the Profit payments and baseline and the Manage scenario the card opens, so all three screens show the same numbers.

Profit figures are live everywhere. `src/data/history.json` holds the days before today (from the September dataset) for each period and what it's compared with. The context adds today's Profit-page totals on top. Home cards with `value.live`, insights and blue cards with `figures`, and Manage insights with `figures` all read the result, so recategorising a payment updates every page.

## Domain rule: Adaptive Profit Display & Prototype Feedback Loop
CEO wants month-to-date profit; Product wants it tied to the merchant's lifecycle (MTD misleads a merchant with 2 logged days). The prototype shows both and asks the merchant which they prefer.
- No profit surface may hardcode "Today". Each reads `profitView` from `MockDataContext` (or `useProfitPerspective()`), which resolves the stored `profitViewMode` (`'auto_lifecycle' | 'today' | 'mtd_till_date' | 'active_days'`).
- Every `profitView` carries completeness: `daysLoggedInMonth`, `daysElapsedInMonth`, `loggedDays`, `lastUpdatedTime`, plus `partial` (below the lifecycle threshold).

### Architecture
| Piece | Where |
|---|---|
| Copy, lifecycles (logged days, earlier totals), threshold (5), month names, prompt, nudge | `src/data/profitView.json` |
| Resolver, MAI's sentence (`maiQuote`), missing days, stored preference (localStorage `mbl-profit-view`), once-per-session ask, device feedback log | `src/lib/profitView.ts` |
| State: `lifecycle`, `profitView`, `setProfitViewMode`, `askProfitView` / `answerProfitView`, `feedbackLog`; `useProfitPerspective()` selector | `src/context/MockDataContext.tsx` |
| Month figure | A new user's `figures.month` is only their logged days, with no comparison, so the Home card, MAI, the Manage "This month" blue card and the Profit page's month to date all agree. |
| Home card | Pill `Today | This month (till now)`, label, secondary line (`BusinessOverviewCard`); counts up when the timeframe changes |
| MAI | `MaiBanner` under the Home card quotes `maiQuote`, masked with the card. New user on Today: "Your profit today is ₦X (₦Y across the 2 days you've recorded this month)." Month: "Your October profit till [time] today is ₦Y." |
| First-tap question | First drill-down tap until answered (once per session) opens `ProfitViewSheet`. The answer sets the mode, animates the card, and logs a row (`feedbackResponse` = mode id) and a device log entry. |
| Drill-down | Card body opens Manage on the matching tab (`today` or `month`). New users see `MissingDays`: the nudge plus a day strip, linking to /catch-up. |
| Profit page | `useLead` in `ProfitScreen`: the header leads with the Home timeframe and puts the other figure below; with no comparison period it says "Not enough days yet". |
| Coach marks | `byView` copy per timeframe (`partial` wins) with `{month}` / `{days}` tokens, filled in `CoachMarks` from the context |
| /states | Cards go through `toLiveCard` / `toLiveBlueCard`, the same transforms Home and Manage use |
| Demo bar | `DemoBar` (debug only, top centre): lifecycle switch, reset first-click prompt, feedback log. The Prototype controls panel keeps the mode override. |

The lifecycle lives in memory like other prototype state, so a page reload goes back to New user.
