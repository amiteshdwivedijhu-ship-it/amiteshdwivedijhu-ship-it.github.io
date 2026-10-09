# Clinic Launch Desk

A working prototype of a practice-advisor desk for a fake fall cohort of 8 NP-owned clinics. The cohort board shows stage, days in stage against a sample playbook, status in words, a projected first-patient date, and the top blocker. Birchwood Family Health has a critical-path launch plan. Launch Assist drafts the next action from a source line. The advisor approves, edits, or dismisses. A phone list lets the NP mark what they did this week.

All practice, NP, payer, and dollar data is sample data. Payer names are made up. This is not a Duet product. It does not use Duet code or logos. Nothing is sent over the network. Mark as sent (demo) only updates this browser.

## How to open

Open `index.html` in a browser. No build step and no install. The page stores progress in localStorage. Use Reset demo to restore the Oct 8 sample file.

## 90 second path

1. Open the cohort board. There are 8 practices. Birchwood is At risk. First patient is Nov 14. The target was Nov 2.
2. Open Birchwood. The critical path is Harbor, paused because the CAQH attestation expired Sep 30. The Nov 14 date is explained in one sentence.
3. Approve Launch Assist 1 (re-attest text) and 2 (open on approved payers). First patient returns to Nov 2. Full payer go-live stays Nov 14. Birchwood moves to On track. The go-live check still shows Medicare pass, Pinecrest fail on gate 3, and Harbor fail on gate 1.
4. At phone width, open This week. Tap I did it on Re-attest CAQH. The launch plan shows that Rosa marked it done.
5. Open First 90 days. The channel table uses the sample numbers. The Pinecrest roster test has a kill rule: under 4% at week 3.
6. Open Metrics. Time to launch, enrollment spread, steps automated 21% to 36% with advisor approval, and the audit log. Reset demo restores the seed.
