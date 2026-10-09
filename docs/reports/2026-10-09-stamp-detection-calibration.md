# Stamp detection: how the thresholds were chosen, and what they do on real art

2026-10-09. Written for `scripts/stamp-hero.mjs` (PR 239). The tool must refuse a hero that already carries a mark, including one an image model drew itself (any size, place, ink, typeface). This records the data behind its thresholds so they can be re-measured.

## Data (public GET only, one request per image, 0.4 to 0.5 s apart)

- **Unmarked art:** the hero of every post dated before 2026-10-05 (239 posts; the old guide's model-drawn mark started 2026-10-05/06). A first evenly spaced subset of 40 of them is reported separately.
- **Marked art:** 48 heroes of posts dated 2026-10-06 to 2026-10-09, evenly spaced from 325 such posts. Ground truth is by eye (the bottom-right 700 x 140 corner of every one was looked at): 29 carry a visible `© https://aitamer.news`, 19 carry none.
- Live heroes are often not 1600 x 900 (of the 287 downloaded: 223 at 1600 x 900, 35 at 1672 x 941, 29 at 1280 x 720), so every image was first scaled to exactly 1600 x 900, as the pack step does.

## Method (in `searchForMark`)

Search the right 700 x bottom 140 pixels for a line of text. For box heights 14-26 px (step 2), widths 0.9-1.2 times the site words' width in DejaVu Sans, every 2 px:

1. **Contrast.** Mean horizontal edge energy (|luma(x+1) - luma(x-1)|) inside the box against the ring around it (0.6 box heights wide): `(in - ring) / (ring + 3)`. Candidate when >= `RING_MIN`.
2. **Column activity.** Share of the box's columns whose edge energy exceeds half the box mean. Text spreads over most columns. >= `COLUMN_ACTIVITY_MIN`.
3. **Periodicity.** Highest autocorrelation of the column energy at lags 6-40. Text is irregular; dot grids, bar rows, window rows repeat. <= `PERIODICITY_MAX`.

A candidate that passes all three is taken for a mark. Candidates are examined strongest first (up to 40, with overlap suppression).

## Why not something simpler (tried, measured, dropped)

- **Template correlation** of the glyph mask against the corner at many scales (also on high-passed luma): marked 0.31 to 0.55, unmarked up to 0.50. Not separable: model marks use other typefaces and often low-contrast grey on paper texture.
- **Edge contrast alone:** marked 2.88 and up, but unmarked art reached 2.64 (dot grids, window rows, a bar row, paper edges). Six of 239 old heroes had a candidate above 1.5, all of them dot or bar or window patterns.
- **Re-rendering the stamp and diffing the box** (first design): the second pass picks the other ink, so it missed this tool's own mark after a re-encode.

## How the thresholds were set

| Constant | Value | Real-art evidence |
|---|---|---|
| `RING_MIN` | 1.5 | Weakest real mark 2.96, strongest 10.44. Set at about half the weakest, because a missed mark costs more than a regeneration; the other two tests do the rejecting. |
| `COLUMN_ACTIVITY_MIN` | 0.6 | Real marks: >= 0.72. Look-alikes (best box): <= 0.52. Midpoint. |
| `PERIODICITY_MAX` | 0.4 | Real marks: <= 0.20. Look-alikes: >= 0.57. Midpoint. |

Real marks sat at x 1312-1370, y 840-858 (top-left corner of the text), 14-22 px high; the search region and size range cover that with room.

## Results

Run by `scripts/stamp-hero.mjs` itself (end to end, exit codes), not a side script:

| Set | Images | Refused as already marked (exit 2) | Stamped (exit 0) |
|---|---|---|---|
| Unmarked art, posts before 2026-10-05, evenly spaced subset | 40 | **0** (false refusals) | 40 |
| Unmarked art, all posts before 2026-10-05 | 239 | **0** (false refusals) | 239 |
| 2026-10-06 to 2026-10-09 posts | 48 | **29** (all 29 visibly carry a mark) | 19 (all 19 visibly carry none) |

So on this sample: 0 of 239 false refusals, 29 of 29 existing marks refused, 0 missed. Samples are finite: 0 false refusals in 239 puts the true rate below about 1.3% (rule of three), and 29 of 29 puts the miss rate on this kind of art below about 10% at 95% confidence. Marks that are fainter than the weakest seen (contrast 2.96) or drawn in another corner are not covered. Cost: about 0.1 s per image for the search.

Stamped real heroes were also looked at (light flat paper, busy watercolour, torn-paper edge): the mark is readable in all three; on the busiest art it is less crisp than on flat paper.

## Marked heroes refused

- a-bind-mount-can-hide-files-already-in-an-image
- a-grpc-deadline-should-shrink-as-work-moves-downstream
- a-string-slice-needs-a-character-boundary
- an-abort-signal-can-carry-the-reason-work-ended
- an-ssml-prosody-setting-depends-on-the-synthesizer
- anthropic-usage-policy-2026-update
- attaching-two-sqlite-files-changes-the-commit-guarantees
- cantwell-ai-framework-trahan-claim-act
- claude-haiku-5-5
- contrastive-learning-treats-the-other-examples-as-part-of-the-question
- deno-team-joins-cloudflare
- google-sashiko-kernel-review-metrics
- harness-acquires-augment-code-cosmos
- hf-xet-1-7-telemetry
- how-to-ask-for-a-second-draft-that-is-actually-different
- microsoft-execution-containers-ga
- microsoft-wsl-containers-ga-wslc
- nvidia-nemotron-ioi-imo-2026
- openai-30b-round-mgx-blackrock
- polars-2-0-out-of-core-sql
- postgres-19-beta-oltp-perf-check
- scale-elorian-humanitys-sixth-sense-benchmark
- semianalysis-chinese-labs-safety-disclosure
- the-apology-of-a-machine
- the-difference-between-asking-for-help-and-asking-for-an-answer
- the-hour-between-turns
- uzu-rust-inference-apple-silicon-speculative-decoding
- what-a-recaptcha-v3-score-actually-tells-you
- what-the-2020-speech-recognition-gap-actually-measured

## Posts in the 2026-10-06..09 sample that carry no mark (stamped)

- a-rust-value-can-be-send-without-being-sync
- amazon-nova-2-5-sonic-ga
- beam-search-keeps-several-answers-alive
- cursor-sdk-run-steer-background-subagents
- find-the-first-bad-agent-refactor-with-git-bisect
- generation-stops-for-more-than-one-reason
- git-notes-add-context-without-rewriting-a-commit
- keep-the-error-body-and-the-failing-exit-code
- openai-chatgpt-visual-ads
- rust-drop-cannot-await-cleanup
- the-chat-role-is-a-token-sequence
- the-person-who-never-opened-the-ai-app
- the-reflog-is-a-recovery-window
- threads-that-borrow-the-stack
- turn-one-production-failure-into-an-eval-case
- two-tool-calls-one-turn
- what-is-grok-bot
- when-lora-adapters-disagree
- when-the-query-planner-guessed-wrong
