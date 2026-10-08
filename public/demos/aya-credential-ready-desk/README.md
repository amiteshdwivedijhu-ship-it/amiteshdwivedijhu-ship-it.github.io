# Credential Ready Desk

A working prototype of a credentialing desk for a fake queue of 10 upcoming starts. Each upload is pre-checked against the facility list when it lands. The pre-check can flag and draft. Only the specialist, Carla Mendes, can set an item to Approved. One nudge groups every open item for the clinician, and a recruiter heads-up sits beside it. Nothing is sent unless a person approves it. Submit to facility stays locked until every required item is Approved.

All clinician, facility, and document data is sample data. Facility names are made up. This is not an Aya Healthcare product. It does not use Aya code or logos. Nothing is sent over the network. Mark as sent (demo) and Submit (demo) only update this browser.

## How to open

Open `index.html` in a browser. No build step and no install. The page stores progress in localStorage. Use Reset demo to restore the Oct 8 sample file.

## 90 second path

1. Open the start queue. There are 10 packets. Dana Whitfield is At risk, 4 of 10, facility deadline Oct 19.
2. Open Dana's packet. BLS is flagged for rule MV-3. The TB date is unreadable. Hep B has a name mismatch with a marriage certificate on file.
3. Approve Hep B (the linked name-change document allows it). Reject BLS with "Expires mid-assignment". Request a new TB image. The count is 5 of 10. Approve stays blocked on the old BLS card.
4. Open Nudge. Approve the one grouped message and the recruiter heads-up. Mark as sent (demo) sends nothing.
5. At phone width, open Clinician. Dana sees 3 things left. Upload the sample clear TB result dated Sep 2, 2026. The pre-check reads the date and leaves the item Pending.
6. Approve that TB item. The count is 6 of 10. Submit to facility stays locked and lists BLS, flu, the drug screen, and the background check. Then open Ops and the audit log. Reset demo restores the seed.
