# Inert reactions reader integration review

**No blocking source finding**, independent review of `ce4e618c408949e4bb5c0c5708998624c564da0a` against `f0d1fbd8abe07de8ba5eef93be4998405ecdcd29`, retained at `refs/codex/review/reaction-v2-inert-site-20261028`. Reviewer `gpt-6.1-sol` at `xhigh`, Git-object inspection only.

All 15 ported source/test files match the accepted template candidate; the report's 24 candidate hashes match. Comments remain on R2, reactions remain baked and off, and the only additional served surface is the static v2 schema. Existing CSS, dependencies, privacy page and v1 schema routes are unchanged. The reviewer found a stale comment in `site.ts` referring to the old v1 reaction URL; it was corrected after the reviewed snapshot and needs focused re-review.

Retained evidence reports 3/3 synthetic Chromium tests, 3/3 hook-assisted component/v2 tests and 17 passing v1 contract tests within a mixed 17-pass/1-fail run. The initially reported 48 unit passes lacked a separate raw log at review time; the coordinator subsequently requested one. Full clean dependency-backed content/tests/build, device checks, privacy approval and live Worker/D1/R2 remain open. This review establishes neither deployment nor live-site state.

## Comment correction re-review

The reviewer confirmed the stale comment is corrected in `91dcccfc45c0d93e33339c0f10fed3f0e416cf44` against `ce4e618c408949e4bb5c0c5708998624c564da0a`, retained at `refs/codex/review/reaction-v2-inert-site-comment-20261028`; the three switches remain unchanged. The retained raw unit log records 48/48 passing with no skips. This is source review only; clean full build, live integration, privacy and device gates remain open.

## Status-ID protection review

The reviewer confirmed the new production rule protects the component's status ID and real content-collision tests pass, but found a P3 boundary issue in `45ecd8e1ddd8a5caf0fb2e80bbfffe029905b615`: it reserves suffixes longer than the supported 120-character story slug. A 121-character suffix cannot collide and should remain a valid heading. A bounded pattern and regression are being added. The retained rule-file suite reports 54/54 passing; real build, live service and activation gates remain separate.

## Status-ID boundary re-review

The independent reviewer accepted `714923dad9b29b16c62beabc187907945db9568e` against `45ecd8e1ddd8a5caf0fb2e80bbfffe029905b615`, retained at `refs/codex/review/site-reaction-status-bound-20261028`. The rule now accepts the actual 1–120-character slug boundary: a 120-character collision is rejected and a 121-character ordinary heading is allowed. The retained focused regression reports 10 passing, zero failures and zero skips; `git diff --check` passed. This focused source review does not establish build, privacy approval, deployment or live runtime behavior.
