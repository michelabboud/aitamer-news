# Automatic Grok and Cursor publishing

Owner instruction: "fix it please, I need grok bots and curosr to be able to publish without approvals or reviews".

## Scope and design

No human editorial approval or review is required for supported same-repository Grok and owner-account Cursor publishing submissions. Automated validation, exact content certificates, trusted numbering and ordinary merge rules remain. See ADR0055. The bot route cannot change code, workflows, author identities, arbitrary paths or delete files. Quill remains article-only. Existing separate image proposals keep their own route.

PR483 at0e11c4819b835999f149c9c94dfd243ab5b5906f contains16assets and zero article files. The new collector accepts all16 and binds their binary identities. Its title/body's claims about scheduled posts are not established by that tree. Draft PR481 remains held.

## Tool dependency vetting

Poppler pdfinfo is used only by credential-free validation, via stdin, with a10second timeout and1MiB output bound. It parses the document structure rather than trusting a PDF filename/header. No package is added to the npm dependency graph. The isolated admission job installs the latest distribution-maintained poppler-utils from Ubuntu's configured security/update repositories and apt records the selected exact build in the run log. Upstream latest releases and release/security maintenance were checked on2026-11-15: [Poppler releases](https://poppler.freedesktop.org/releases/), [Ubuntu packages](https://packages.ubuntu.com/poppler-utils), [Ubuntu security package](https://packages.ubuntu.com/noble/poppler-utils). Upstream26.11 is listed; local qualification uses distro pdfinfo24.02.0 with distribution security maintenance. This intentionally uses the runner's maintained distro package instead of building an upstream parser in CI. PDF parsers have a vulnerability history; never run this parser in the credentialed orchestration job. Signature-only checks were rejected after review reproduced a corrupt PDF passing them; qpdf would add a second equivalent system tool with no demonstrated benefit here.

## Verification ledger

- Initial regressions reproduced missing Cursor eligibility and unsupported binary assets.
- Focused admission128/128 before adding the final PDF parser regression.
- First full suite1728/1730: two old routing tests asserted Cursor must never use observation checks. Updated them to the new routing contract and added positive Cursor observation isolation coverage. This was an expected contract change, not an unrelated failure.
- Nine new publishing tests pass with PUBLISHING_PDF_INTEGRATION=1, including automatic dispatch without any human-review lookup, binary digest/materialization, stale-main refusal, refused paths/modes, JSON identity and a corrupt PDF rejected by the real parser.
- Production source build emitted1960pages and Content-Security-Policy for14inline script hashes. Source feature changes affect workflow/data admission, not reader layout.
- Full suite before final parser-isolation correction passed1736/1736; frozen-candidate rerun and hosted acceptance are recorded in the GitHub source PR and private run receipts.

Private evidence: ~/.local/state/aitamer-uiux/bot-publishing-20261115/. All earlier failures are retained. Parser integration is opt-in for general suites and explicitly enabled by the isolated admission job; candidate PDF parsing is always mandatory in its materialize CLI. Privileged deterministic re-verification does not invoke the parser. Review also corrected parser install order before first use.

The task worktree, dependencies and dist are retained for exact-candidate/live acceptance until the task finishes; no unrelated worktrees or historical artifacts are removed.

## Live configuration

Cursor namespace ruleset24467961 previously allowed only admins and the Cursor App. Add the existing trusted allocator App5107739, matching Grok's existing namespace configuration. Preserve existing actors, conditions, enforcement and rules. Private before/proposed/readback JSON receipts retain exact configuration. Required reviews on main already equal zero; required automated checks remain enabled. This changes publishing access on michelabboud/aitamer-news only.

Final source qualification:1736tests,1736pass,0fail,0skipped with PUBLISHING_PDF_INTEGRATION=1 (58.1s). Source review used one independent Strong-tier Codex reviewer; token use unavailable. The review retained its original failure reproductions and focused repair checks. A cumulative asset-byte cap is a non-blocking hardening observation for already authorized producers, recorded in BACKLOG.
