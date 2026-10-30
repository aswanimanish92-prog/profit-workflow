# Moniebook Lite alpha: research plan

Companion to `concepts_brief.md`. Step 1 of the build order (the research table) and step 2 (the jargon audit). Thresholds are blank until cohort size is decided (open decision 2). Write them down before the first link goes out.

## Research table

| | Q1 Trust | Q2 Loss | Q3 Gap |
|---|---|---|---|
| **Question** | Do merchants close the day without checking the figures first? | When the day is a loss, do they understand why and carry on, or leave? | After 7 days away, do they deal with today first or feel pushed to clear a backlog? |
| **Scenario** | `healthy_day`: Home B1, healthy day, Manage D75 | `loss_day`: Home F2, loss day, Manage D75L (blue card TL) | `returning_after_7_days`: needs a new card with "Today" and "Catch up" side by side |
| **Ready?** | Yes, but see confounders | Yes. Home, Profit and Manage all show Loss ₦2,400 | **No.** B5 and B6 offer only "Catch up". Design the new card first |
| **Counts as yes** | Taps the Profit submit button with no check event before it | Opens a check event (See why, breakdown, "How is my profit calculated?"), then submits | First review action is today's Profit page |
| **Counts as no** | A check event before submit | Session ends after the loss is shown, with no submit | First review action is `/catch-up` |
| **Check events** | Category picker opened, "How is my profit calculated?", card body opens Manage, Manage tab change | Same | n/a |
| **Feedback question** | "How sure were you that today's profit was right?" (Not sure at all … Very sure) | "How clear was it why Mama Put made a loss today?" (Not clear at all … Very clear) | "After being away, how much did you feel you had to fill in the missed days first?" (Not at all … Very much) |
| **Threshold** | TBD, e.g. "≥ _ of _ submit with no check" | TBD | TBD |
| **Decision it feeds** | Whether Home can lead with "close today" and tuck the working away | Loss copy on Home and Profit, and whether the reason ("mostly on stock") belongs on the Home card | Whether a returning merchant sees today first or the backlog first |

### Confounders to settle before Q1 means anything

- **Uncategorised payments.** The healthy day opens with 4 to sort, the loss day with 2. Sorting is required, not a sign of distrust. Either pre-sort them in the alpha bundles or time sorting separately (open decision 10).
- **Coach marks.** They open on every screen by default (`INITIAL.coachMarksOpen` in `src/context/MockDataContext.tsx`). Either turn them off for alpha links or log them and subtract their time.
- **More than one button finishes the day.** The Profit button says "Submit and continue", or "Accept and continue" in the hero layout. The streak sheet has its own "Close today". After submitting, "Accept sorting, continue" goes to Manage. Pick one alpha layout and count only the Profit button as `submit_day`.
- **Healthy-day numbers don't agree yet.** Home B1 says ₦12,400 while the Profit page starts at about ₦10,595. The loss day was fixed. The healthy day still needs the same treatment.

### Draft event list

`session_start` (after first tap), `session_resumed`, `screen_view {screen}`, `coach_mark_step {screen, step}`, `coach_mark_skip`, `category_open {txn}`, `category_set {txn, category}`, `cash_add_open`, `how_calculated_open`, `card_body_tap`, `card_cta_tap {target}`, `overview_tab {period}`, `submit_day {layout}`, `catch_up_open`, `catch_up_day {day}`, `feedback_shown`, `feedback_answer {value}`, `feedback_dismiss`.

Every event carries merchant token, session ID, scenario, scenario-bundle version, build version, sequence number and client timestamp.

## Jargon audit (baseline before the alpha)

Scope: Home card states, Profit page, Manage page, catch-up, and coach marks. Suggestions only. No copy has been changed yet, so this is the "before" for the alpha.

| Term | Where it appears | Problem | Plainer option |
|---|---|---|---|
| "close your numbers", "Close your day", "Close today", "Today is closed" | Streak coach marks, Profit coach mark, card status, catch-up | Bookkeeping idiom. Merchants may read it as shutting the shop | "Finish today", "Done for today" |
| "Submit", "Submit and continue", "lock in" | Profit button and coach mark | Sounds like a form or an irreversible filing | "Save today" / "I'm done for today" |
| "Accept sorting, continue" | Profit (reviewed layouts) | Meaning unclear | "Looks right, save" |
| "Estimated profit" | Home card header | "Estimated" undercuts trust (Q1) | "Profit today (so far)" |
| "Accuracy: High / Medium / Low", "See how sure we are", "raises it" | Blue card to-do, Profit breakdown, Manage | Abstract. Merchants can't act on a grade | "2 payments to check", "All payments checked" |
| "month to date", "vs same point last month", "vs previous 7", "vs August" | Profit header, Home insight | Finance shorthand. "vs" is English shorthand, not speech | "So far this month", "Compared with last month by this date" |
| "Restock", "Stock purchase", "Expense" | Category chips | Mostly fine, but the split between them is what merchants get wrong | Keep, and add one example each (tomatoes = stock, rider = expense) |
| "recorded" / "not recorded", "Record 6 more days" | Blue cards, card status, records row (16 places) | Implies the merchant did data entry | "3 days missing", "Check 6 more days" |
| "Calculate", "not calculated", "calculation" | A-state cards | Suggests the merchant does maths | "See today's profit" |
| "freeze", "Freeze used", "saved by a freeze" | Streak sheet, card status | Game jargon with no explanation | "Missed day covered" or drop for alpha |
| "rest days" | Streak sheet, coach marks | Fine, but not explained | "Days the shop is closed" |
| "streak", "unlock your weekly view" | Card status, streak chip | Gamified. Fine for some, noise for others. Gating language ("unlock") feels like a paywall | Keep "streak", drop "unlock" |
| "cost price", "missing cost price" | Card status, coming-soon | Accounting term | "what you paid for it" |
| "Profit insight", "Bookkeeping services", "Your team's module" | Manage page | Product labels, not merchant words | "What changed", "More tools" |
| "pending" | Money in/out, coach mark | Fine for bank users, but say why it matters | "Not arrived yet" |

Words that read well and should stay: "Sales", "Expenses", "Personal", "Cash or money elsewhere?", "Loss" (spelled out, not just a minus sign).
