# Alpha Test Harness for Moniebook Lite

* **Author:** Manish Aswani
* **Date:** 2026-10-28
* **Status:** Brainstorm, after one round of review across six lenses (design, codebase details, scope, comprehension, implementation readiness, structure)

## Overview

Moniebook Lite has three screens: Home, Profit and Overview. Before building on them we want evidence that merchants find it simple, useful and free of bookkeeping chores. Account managers will send each alpha merchant a link over WhatsApp or email. The merchant opens it on their own phone, usually inside WhatsApp's or Gmail's built-in browser, with nobody watching.

The harness adds four things to the existing prototype:

1. **Scenario links.** Each link puts the merchant into one prepared situation (a good day, a loss day, or a return after 7 days away) and identifies them.
2. **Event logging.** Timestamped taps and screen views are sent to a remote store, tagged with merchant, session and scenario.
3. **A short feedback prompt** after the merchant finishes the main task.
4. **Merchant-safe presentation.** Debug tools are hidden, the copy is free of accounting jargon, and the screens look right on a real phone.

The three questions the alpha should answer:

* **Q1 – Trust (healthy day):** Do merchants close the day without checking the figures first?
* **Q2 – Loss (negative profit day):** When the day is a loss, do merchants understand why and carry on, or leave?
* **Q3 – Gap (7 days away):** After a gap, do merchants deal with today first, or feel pushed into clearing a backlog?

## Analysis

The review agreed the harness can be built. It also found that, as specified, it would collect a lot of data that does not answer Q1–Q3. The problems, most severe first:

### Blockers

1. **The measurements do not match the questions.**
   * Q1 uses time to tap "Save today" as a proxy for trust. No such button exists; the button says "Submit and continue" (or "Accept and continue" in the hero layout). The Profit page also opens with 4 uncategorised payments that the merchant must sort first. Coach marks open on every screen by default (`src/context/MockDataContext.tsx:141`). So the timer mostly measures sorting and reading tips, not trust.
   * "Checking the figures" has no single tap to detect. Payments are listed inline. The candidates are the category picker, the "How is my profit calculated?" link, and the card body that opens Overview.
   * Q2 runs on a demo business. The loss is not the merchant's money, so "anxiety" and "engagement" mostly measure curiosity.
   * **Needed:** a one-page table with one row per question listing the scenario, the events that count as a yes or a no, the feedback question, the threshold (or "descriptive only"), and the design decision it feeds.

2. **The loss scenario contradicts itself.** Home card F2 shows "Loss ₦2,400". Its "See why" button opens Overview scenario D75, which shows blue card T1, a non-loss day. The Profit page is built from the September dataset and comes to about +₦10.6k. The existing "Loss week" blue card is not used by any scenario. A merchant would see a loss on Home and a profit one tap later. Q2 cannot be tested until all three screens use the same loss data.

3. **The gap scenario offers no choice to observe.** Cards B5 and B6 offer only "Catch up". Finishing catch-up forces a fixed card. Nowhere does "do today" sit next to "catch up on past days", so Q3's behaviour cannot happen, let alone be logged. A new card design with both actions is needed. The name `cold_start_7_days` also reads like "brand-new user"; it should say "returning after 7 days".

4. **A reload or navigation loses who the merchant is and which scenario they're in.** Nothing reads the URL today. All state is held in memory, and every link inside the app goes to a bare path. In-app browsers often reload the page when the merchant switches back from a chat, which would put them back on the default state and start a second session. **Needed:** read the link once, keep merchant, scenario and session in `sessionStorage`, restore from there on every load, and log `session_resumed` separately from `session_start`.

5. **There is no server to send events to.** `next.config.ts` sets `output: "export"`, so the site is static files with no API routes. Events must go straight from the phone to a third-party service. That service's key will be visible in the page code, so anyone with a link can send fake events. Either pick a provider whose public keys can only add data, or drop static export and add one rate-limited event endpoint. Deep links such as `/profit` also depend on the host serving `profit.html`, or a reload shows a 404.

6. **A scenario is a bundle of settings the code cannot express in one place.** Each scenario needs a Home card state, Overview scenario, blue card, Profit layout, transactions, catch-up days and streak gap set together. The existing IDs (55 card states, D75/M0/S1/…) do not map to the three names. **Needed:** one versioned `alphaScenarios.json` applied by a single `applyScenario(id)` function built from `resetAll`, with a defined fallback for an unknown or missing ID.

### Major risks

7. **Debug controls are visible to merchants.** The "Prototype controls" button (`src/components/shell/ControlPanel.tsx:26-34`) always shows, covers the Submit button and bottom nav, and lets anyone change scenario. `/states`, `/profit-test1` and `/profit-test2` are open to anyone. Remove them from the alpha build, or show them only when a separate debug key is in the link. Tag debug sessions so they can be filtered out.

8. **Forwarded links and link previews will corrupt data.** Merchants forward links and account managers reuse them. WhatsApp, Gmail and security scanners open links to build previews, and some run the page's code, which would log fake sessions. Use opaque tokens rather than names in the link, remove the token from the address bar after reading it, keep a device ID, flag a token seen on two devices, and only log `session_start` after the merchant's first tap.

9. **Events get lost on weak networks.** Queue events on the phone with a sequence number and ID, send in batches, send what remains when the page is hidden (`sendBeacon`), retry, and drop duplicates on the receiving side. Measure time between taps on the phone, not by arrival time. Treat "left without submitting" as the last event in a session, not as a detected exit, which in-app browsers report unreliably.

10. **The first screen undermines trust.** The page title "Business Overview Prototype" becomes the WhatsApp link preview. A fake "9:30" status bar (`src/components/shell/AppShell.tsx:31`) appears under the phone's real one. Fixed dates ("since Wed 2 Sep" when today is 28 Oct) make a 7-day gap look like two months, or like a bug.

11. **Merchants won't know what they're being asked to do.** A short intro screen is needed: one instruction ("Pretend you own Mama Put Kitchen. Check how today went, then finish your day."), a one-line backstory for the scenario, "This is not your account. Nothing you tap moves money.", and a consent line about recording taps. Account managers need a two-line message to send with the link. Naming the task weakens Q1 a little. Not naming it makes every drop-off unreadable.

12. **Privacy law (Nigeria's NDPR) is the slowest dependency.** It needs a lawful basis, consent wording and a retention period. Free-text notes are the largest exposure, because merchants may type names or phone numbers.

13. **"Rate 1–5" is ambiguous.** Rate what: the app, today's profit, the test? Ask one concrete question with labelled ends ("How easy was it to see how Mama Put did today?", from Very hard to Very easy), once per session, after Submit or catch-up. Merchants who leave early give no feedback, so decide whether account managers follow up on WhatsApp.

14. **Changes mid-alpha mix versions.** Tag every event with the build and scenario-bundle version. Freeze the link format before the first send. Finish the jargon audit before naming events and writing prompts, and include coach-mark copy ("close your numbers", "rest days", "freeze") in it.

### What holds up

* One scenario per link, applied from the link, matches how account managers already work.
* A small `track(event, props)` function with a fixed event list and a console output can be built before the provider is chosen.
* The jargon audit is cheap and useful whatever happens to the rest.

## Goals vs. Non-Goals

* **In-Scope Goals:**
  * Research table linking Q1–Q3 to scenarios, events, feedback questions and thresholds.
  * Jargon audit of Home, Profit, Overview and coach-mark copy, done before the alpha as the baseline.
  * Three scenario bundles whose data agrees across all screens, including a loss on Profit and Overview and a new gap card with "today" and "catch up" side by side.
  * Link handling: opaque token plus scenario, kept in `sessionStorage` across reloads, with a scenario lock so merchants can't switch.
  * Hidden debug mode, unlocked by a separate key in the link.
  * `track()` with a session wrapper (merchant token, session ID, scenario, build version, sequence number) and an offline queue.
  * Intro screen with the task, backstory, a "not your account" line and consent.
  * One feedback question after the main task.
  * Mobile fixes: remove the fake status bar on phones, set a link-preview title, use relative dates.
  * A dry run in the WhatsApp and Gmail in-app browsers on Android before the first send.

* **Out-of-Scope Non-Goals:**
  * Merchants' own transaction data (a known limit that weakens Q1 and Q2).
  * Voice notes.
  * A custom event backend or dashboards. Use a raw export and one analysis sheet or notebook.
  * Detecting page exit as a primary metric.
  * A `today_focus_retained` event. Work it out afterwards from the session's events.
  * Server-side rendering per merchant.
  * Several scenarios in one sitting.
  * `/states`, `/profit-test1`, `/profit-test2` and the controls panel in the merchant build.

## Alternatives Weighed

* **Moderated sessions over WhatsApp video (5–8 merchants, think-aloud, about 20 minutes each).** *Kept as a strong candidate to run first.* It is the cheapest way to learn *why* merchants act as they do, which is what Q1–Q3 ask. A hybrid (moderated pilot with 3 merchants, then the unmoderated alpha) is possible. Paid tools such as Maze or Lookback work poorly in in-app browsers and on Nigerian mobile data. Plain WhatsApp video calls avoid that.
* **Ready-made analytics with session replay (Microsoft Clarity or PostHog).** *Kept if the alpha stays unmoderated.* One script tag, captures link parameters, and replays show drilldowns better than a hand-built event list. Still needs a privacy decision on third-party scripts.
* **Google Form or Tally for feedback, prefilled with token and scenario.** *Kept as the low-effort option.* No build work, but merchants leave the app to answer. The in-app option is a bottom sheet after Submit.
* **Custom event backend.** *Rejected.* Costly, more privacy exposure, and little value at alpha size (on the order of a few thousand events).
* **Free tier or Google Sheet as the event store.** *Acceptable.* The volume is small.
* **Merchants' own data.** *Rejected for this alpha.* It would make Q2 meaningful but needs data access and handling beyond a prototype.
* **Reusing existing state IDs instead of scenario bundles.** *Partly rejected.* Reuse IDs where they fit, but the loss and gap scenarios need new combined data and a new card, so a thin bundle layer is unavoidable.
* **Logging to the browser console.** *Rejected.* Nobody can see a merchant's phone console in an unmoderated test.
* **Free switching between scenarios by the merchant.** *Rejected.* It would show merchants that the states are staged.

## Key Decisions & Staging for Next Steps

**Decided so far**

* Unmoderated, on merchants' own phones, mobile first.
* Account managers send links by WhatsApp or email.
* Working assumptions (not yet confirmed): one scenario per link; demo data with an intro screen; text feedback only; jargon audit before the alpha.

**Open decisions, in the order they block work**

1. **Moderated, unmoderated or hybrid.** The review suggests a small moderated pilot first. This decides how much of the harness is worth building.
2. **Cohort size and decision thresholds per question.** Below about 20 merchants, event counts are anecdotes. Thresholds should be written down before the first link goes out.
3. **Static export with a third-party service, or a Next.js server with one event route.** This blocks the provider choice.
4. **Provider, hosting, and whether links expire.**
5. **Privacy:** lawful basis, consent wording, retention and deletion, and whether third-party scripts are allowed.
6. **Tokens:** format, whether they are signed, and who keeps the token-to-merchant list (an account-manager sheet or a script).
7. **Session rules:** whether a reload continues the session, the idle timeout, and what a second device on the same token means.
8. **Scenario contents:** the exact card, overview, blue card, transactions and dates for each bundle, and whether `/catch-up` can be reached.
9. **Event definitions:** which button counts as "finish the day", which taps count as checking the figures, whether time with the tab hidden counts, and what counts as auditing a loss.
10. **Whether to pre-sort the 4 uncategorised payments** in the alpha scenarios, or time sorting separately.
11. **Whether the intro screen names the task.**
12. **Feedback:** timing, whether it can be dismissed (and whether that is logged), and a follow-up for merchants who leave early.
13. **Debug unlock and a kill switch** for logging.

**Suggested build order (for `TASKS.md` Phase 3)**

1. Research table (`ALPHA_PLAN.md`) and thresholds.
2. Jargon audit.
3. Scenario bundles with agreeing data, the new gap card, and link and session handling, tested in WhatsApp and Gmail browsers.
4. `track()`, the event list and the offline queue.
5. Feedback prompt.
6. Provider, consent and intro screen.
7. Link generation for account managers and a dry run.
