# Revisioned comments reader

## What changed

The prepared comments cutover now reads `v2/comments/<slug>.json` and `v2/comments-index.json`. V2 adds a positive decimal revision and permits an empty story, allowing the writer to retain an origin fence after removals. Browser metadata is validated before existing text-only rendering; empty envelopes clear comments/counts. No error path falls back to v1 or baked comment text. Reactions remain v1 with their existing switches.

New v2 schemas, snapshots and pinned routes coexist with frozen v1. Current unversioned comment-schema routes serve v2. V1 schemas, snapshots, pinned routes, baked collection validation, old publisher and reactions remain unchanged. Revision strings are bounded to40digits and checked without floating-point conversion; generatedAt is informational and no earlier than contained comment dates.

## Verification

Baseline after integrating current public main:1,396 tests pass,0fail. New behavioral RED:6tests fail before implementation. Final focused suite:140pass,0fail. Full suite:1,415pass,0fail. Production build:1,389pages; Pagefind1,050pages; CSP11inline-script hashes. Strict check:posts exits0 (1,054numbered/1,052machine-authored,0findings), retaining one unchanged article warning. These results bind the reader implementation; independent reviews and browser/live cutover acceptance remain open.

Evidence remains private at `/home/michel/.local/state/aitamer-uiux/comments-r2-recovery-20261025/` (baseline, RED, focused/full, build and content-check logs). V1 source/snapshot/route/loader byte-preservation checks exit0; built v1/v2 routes match their respective snapshots.

Snapshot SHA256:

- Story:`6443b616fec9208023d3d02f49c53d71df21476b208be7d2a7aeaba38d126db1`.
- Index:`66a6746d7c9644befc27c6c31595af7d6c30eb3b9bbfc735f6aaee184434349c`.

## Assumptions and limits

Review correction0.2.125: independent deep review found browser metadata accepted a timestamp without seconds while the schema refused it; root reproduced RED (actual list, expected failed), required seconds and absolute-end matching, then observed19/19 focused and1,415/1,415 full tests. The corrected production build also passes (1,389pages,11CSP hashes). Mechanical/deep source reviews otherwise found no blocker and the stale v1 URL comment is fixed. Before the timestamp correction, a real Chromium fixture run passed18checks: valid/empty files, invalid v1/newline/overflow/time metadata, redirect refusal without a v1 fetch, retry failure announcement, recent index rendering and empty index clearing. This is local browser evidence with intercepted synthetic data, not live bucket acceptance. An initial harness attempt failed because its execution sandbox lacked global URL; the corrected harness uses the request string and passed. Reports and RED/GREEN logs remain with the private evidence directory. PR343 supersedes closed PR339.

The writer supplies durable revisions independently of clocks. This source task does not deploy that writer, retire the old publisher, block legacy URLs or perform the site switch. The prepared privacy date must be updated if the actual UTC cutover day changes. A full final HTML comparison and runtime browser checks remain with the coordinator. Model ledger: Strong implementation GPT-6.1Sol xhigh; source reviews pending. No owned server or fixture process remains; generated dist and the run's dependency symlink are retained for upcoming browser review, not committed. Other branches, published articles, generated specimen identities and previous evidence are preserved.
