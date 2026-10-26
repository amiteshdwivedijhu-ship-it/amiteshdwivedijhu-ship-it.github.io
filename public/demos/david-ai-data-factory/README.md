# Data Factory Console (prototype)

A working prototype of an internal tool for a speech data factory. It follows one sample project, "Project Halyard," a 1,200-hour, 4-language, full-duplex conversation dataset for a sample buyer, from spec to release.

**All data is sample data.** The buyer, contributors, sessions, rates, scores, and golden-set numbers are made up. Waveforms are drawn from sample numbers, not real audio. This is not a David AI product and is not affiliated with David AI. Nothing in it is sent anywhere.

## Views
1. **Pulse**: accepted hours vs. target, accept rate, cost per accepted hour, forecast finish and bottleneck language, daily output by QA result, ranked alerts, rejection reasons, coverage by language.
2. **Spec to plan**: the buyer request, the 6-stage process (hypothesize to release), a live spec (hours, weeks, language and environment mix, pay, contributor hours), a per-language collection plan, and a capacity check with fix options (extend, rebalance, recruit).
3. **Session QA**: 240 sample sessions with auto checks (SNR, channel bleed, clipping, overlap, turn gap, silence), audio judge scores, PII and duplicate-voice flags. Editable QA rules re-score every session. Session detail has a 2-channel waveform with overlap bands and visual playback, a synced transcript, and accept/reject with a required reason. Bulk decisions also need a reason.
4. **Coverage**: language x environment heatmap vs. quota, biggest gaps, accents and speaker spread per cell, and a targeted batch plan (sessions, contributors, cost) you can queue.
5. **Judge calibration**: Cohen's kappa for an audio LLM judge (v2 live, v3 candidate) vs. human labels on a 200-clip golden set, by rubric item and language. Confusion matrix, a regression gate (min kappa, max drop per slice), routing options, and the failing hi-IN code-switching cases.
6. **Contributors**: quality roll-up per contributor, flags (duplicate voice, scripted talk, no headphones, clipping), and actions (pause and hold sessions, queue coaching note, promote).
7. **Release gate**: batch B-14 checks (review queue, PII, duplicate voice, judge gate, coverage balance, manifest validity). Release unlocks only when all pass or are waived with a reason. Downloads a JSONL manifest and a release note.

## 90-second path
1. Pulse: 1,010 of 1,200 hours, forecast 9 days late, hi-IN is the bottleneck, judge v3 is ready (10s).
2. Judge: v3 is better almost everywhere but fails hi-IN naturalness on code-switched talk. Make "v3, keep v2 on hi-IN" live (20s).
3. Contributors: C-3307 and C-2291 share a voice. Pause both; their sessions go on hold (10s).
4. Coverage: hi-IN street and café are the gaps. Queue a targeted batch (15s).
5. Release: clear the review queue, hold extra en-US quiet sessions, re-link 2 consent records, release, download the manifest (35s).

## Run
Open `index.html`, or serve the folder (`python3 -m http.server`). No build step, no network calls, no backend. State is saved in localStorage. "Reset demo" in the footer restores the seed.

Built by Ami (Amitesh Dwivedi).
