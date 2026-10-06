# Ship Gate (static prototype)

**Problem it solves:** When a Factory Droid hits an org `ask` rule on a production step (git push to main, deploy, or a database migration), a platform lead needs one phone-friendly desk that shows the rule, the risk, the autonomy gap, and the session spend, and then lets them Approve, Block, or Cap autonomy.

Prototype for interview practice. Not affiliated with Factory or The San Francisco AI Factory, Inc. Not a Factory product. Synthetic org (Northline Eng), repos, PRs, sessions, people, and credit spend only. The screen is inferred from public docs language (Autonomy Level, permission rules with allow / ask / block, Enterprise Controls). It is not a copy of any Factory screen.

## Run it

1. Open `index.html` in any modern browser (double-click works, `file://` is fine).
2. No build step, no account, no network.
3. State lives in `sessionStorage` for the tab. Tap **Reset** (top right) to restore the seed data.

Files: `index.html` (shell), `styles.css` (phone-first layout), `data.js` (synthetic seed: 7 gate asks, 3 org rules, seed log), `app.js` (hash router, screens, decisions).

## 90-second walkthrough (happy path, try it at 375px wide)

| Time | Do this | What it shows |
|---|---|---|
| 0:00 | Open the page. Read the top banner and the **Late telemetry** banner. Tap **Retry sync** (or Dismiss). | Synthetic data is labeled. Spend can arrive late, and the desk says so instead of pretending. |
| 0:10 | The queue shows **7 open asks**. Tap **Blocked** to see the empty state, then go back to **Open**. Tap the **Start here** card, *Ship checkout-tax fix* (or the blue button at the bottom). | Each card shows repo, command risk (Push / Deploy / Migrate), session autonomy vs what it asks for, credits, and wait time. Counts match the list. |
| 0:25 | **Brief.** Read the org rule `org/git-push` (decision: ask), the autonomy track (Session Medium, Asks High, Org max High), and Spend (412 credits, about 1.86M tokens, 21% of the daily user limit). Tap the session ID to expand it. | The paused step, the rule that fired, and the cost are on one screen. |
| 0:40 | **Next: Review changes.** Two files are flagged **payments path**. Tests green and coverage unknown are small secondary chips. | A gate summary, not a code review or a rubric grid. |
| 0:55 | **Next: Decide.** Tap **Approve push** before ticking the box. | Approve is locked. The page explains why and points to the payments-path note. |
| 1:05 | Tick *I read the payments-path note*. Tap **Approve push**. | Approve unlocks only after a person confirms the risk. |
| 1:15 | **Proof.** Push released, actor Reviewer R, time in ET, rule, credits at decision. Queue now shows 6 open (was 7). Activity log has the new entry. | The decision is recorded and the queue updates. |

### Alternate paths (about 20 seconds each)

- **Cap autonomy:** Open `g-104` (also Dev K.) and go to Decide. Tap **Cap to Medium**, then confirm. The ask closes as Capped. Proof shows an autonomy picker where High is hidden for Dev K. The queue shows a banner: *High autonomy is hidden for Dev K. today.* Reset clears it.
- **Block:** Open any ask, go to Decide, tap **Block**. A one-line reason is required (quick picks offered). The ask moves to the **Blocked** tab with the reason. The session stays paused.
- **Filters:** All, Push, Deploy, Migrate, plus Open / Blocked / Closed tabs. Empty filters say what to do next.
- **Stretch items included:** a service-account deploy ask (`g-102`, svc-release-bot), a credit sparkline on the brief, and a "Leadership view elsewhere" row that names Agent Effectiveness without rebuilding it.

## What this proves

- Scale is about trust and control when AI writes and ships code, not another adoption chart.
- Org rules and autonomy ceilings only work if a human can decide the paused high-risk step with cost in view.
- Cap autonomy is a product decision, not a support ticket.

## Acceptance check (tested in headless Chrome at 375, 768, and 1280px)

- Loads from `index.html` with no build and no network. No console errors.
- Banner: "Synthetic demo data. Fake repos and spend."
- Queue count (7) matches the card list; filter counts match.
- Brief shows the rule ID, autonomy vs org max, credits and tokens.
- Early Approve tap explains the lock; Approve works after the confirm box.
- Cap updates the queue and hides High for that user until Reset.
- Block requires a reason and moves the item to Blocked.
- Empty filter state explains what to do. Late-telemetry banner can be retried or dismissed.
- Activity log shows actor and time. Reset restores seed data.
- At 375px: one column, no horizontal scroll, all tap targets at least 44px, body text 16px, labels at least 14px, modal is a bottom sheet that scrolls inside itself, toasts sit above the action bar.
- No em dashes or en dashes in any file.
- Footer on every screen says not affiliated with Factory.

Not deployed. Placeholder path if published later: `https://amiteshdwivedijhu-ship-it.github.io/demos/ship-gate/`
