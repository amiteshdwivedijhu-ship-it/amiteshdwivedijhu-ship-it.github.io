# Finding to Training

A working prototype for a synthetic ready-meals plant. A QA lead opens an audit finding. A sample AI draft turns the linked SOP into a short lesson in English and Spanish. A supervisor edits and approves it, a bilingual reviewer marks the Spanish, and workers finish it on a phone. The supervisor marks floor observations. The finding closes only when the checks pass, and the audit packet keeps the record.

This is not an Intertek or Intertek Alchemy product. It does not use their code, logos, or content. The plant, people, SOPs, and findings are synthetic. The lesson is a sample draft stored in data.js. Nothing is sent over the network.

## How to open

Open `index.html` in a browser. No build step and no install. The page stores progress in localStorage. Use Reset demo to restore the seed.

## 90-second path

1. Open F-1042, the allergen changeover miss on Line 3.
2. Pick Training gap. Open the lesson draft and its SOP citations. On a phone, tap Espanol.
3. Edit one lesson line. Approve as Dale Turner. Mark Spanish reviewed as Ana Ruiz. Assign Line 3, all shifts, and a due date.
4. Open the worker phone view. Answer the 3 questions and sign off.
5. Tap Simulate shift. Mark at least 3 floor observations Qualified.
6. Close finding unlocks. Show the audit packet.

## Close rule

A finding can close only when all are true:

1. A named supervisor approved the lesson. The AI draft cannot be published without that approval.
2. Each lesson step cites an SOP section and version.
3. The Spanish version is marked reviewed by a bilingual reviewer.
4. At least 95% of assigned workers completed it with a passing check.
5. At least 3 floor observations are marked Qualified.

If a check fails, Close finding stays locked and the screen says why.
