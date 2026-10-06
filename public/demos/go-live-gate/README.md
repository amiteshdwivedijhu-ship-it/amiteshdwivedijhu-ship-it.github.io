# Go-Live Gate (static prototype)

Forward-deployed PM console that takes one synthetic freight agent, **Rate Confirmation to TMS Load Entry**, from signed spec to a live, handed-off agent for fake carrier **Ridgeback Freight Lines**.

Open `index.html` in a browser. No build step. No network. No live model.

## 90-second walkthrough

1. **Deployment card** - Synthetic carrier, rate con to load entry agent, go-live in 9 days (2026-10-15). Point at status steps and the hard product rule.
2. **UAT** - Open panel 3. Twenty loads. Three exceptions: a rate off by one digit, a missing reference, an appointment in the wrong time zone.
3. **Exceptions** - Panel 4.
   - On "Rate off by one digit": **Fix rule**.
   - On "Missing customer reference": **Accept as edge case**, type a note (required), **Save acceptance**.
   - On "Pickup appointment in the wrong time zone": **Fix rule**.
4. **Determinism** - Panel 5. Press **Run again**. After the rate rule is fixed, run A and run B match field by field.
5. **Gate** - Panel 6. Enter signoff name and date. All five checks go green. Press **Go Live**.
6. **Handoff** - Panel 7 shows accuracy at handoff, rules added, accepted edge cases, on-call contact, and the 30-day watch list. Press **Mark handed off**.
7. Stop. Ask how they decide an agent is ready today, and what the accuracy target at handoff is.

**Reset demo** restores the seed state (localStorage).

## What this proves about their problem

Euclid sells certainty: the same correct answer every time on freight back-office work. The FD PM seat is scored on go-lives by the committed date and agents meeting accuracy targets at handoff. Go-Live Gate is the screen between spec signed and handed to CSM.

## Files

| File | Role |
| --- | --- |
| `index.html` | Shell, viewport, banner, nav, panels, footer |
| `styles.css` | Paper / card / ink theme (inferred), phone stack at ~375px |
| `data.js` | Synthetic Ridgeback loads, field map, seeded exceptions |
| `app.js` | localStorage state, exception actions, determinism, gate lock/unlock |

## Hard gate rule (in UI)

Go Live unlocks only when:

1. Money and reference fields are 100% on the UAT set
2. Other fields are at least 98%
3. Zero open exceptions
4. Second run is identical
5. Customer UAT signoff has a name and date

## Out of scope

Real email ingest, OCR, model calls, real TMS, billing, multiple agents, login.

---

Prototype for interview practice. Not affiliated with Euclid. Not a Euclid product. Synthetic freight data only. No real shipper, carrier, or driver data.
