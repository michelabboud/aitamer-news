# Quill PR 248 conflict resolution, 2026-10-11

## 1. What was built

Resolve [PR 248](https://github.com/michelabboud/aitamer-news/pull/248) by a normal merge of current main `0636f657ce953ff732284653de892746a35f92f5` into the original Quill head `3d6888d72633be923c22307c48440a49d6fa702e`, on `quill-lane/app-content-lane`. No rebase, reset, force push or history rewrite.

Four conflicted files were combined explicitly:

- `scripts/specimen-admission.mjs`: retain Quill's `existingPosts` ancestor/current-main article texts and main's `blob(..., {candidate:true})` rejection boundary together. Discovery catches only `CandidateAdmissionError`, continues to later valid independent requests, then applies Quill's byline gate. Infrastructure/trusted-data failures still propagate. Main's terminal holds, source/approval/digest checks and exact required certificates remain intact.
- `CHANGELOG.md`: preserve the historical 0.2.85, 0.2.84 and 0.2.83 entries and add this merge repair at 0.2.86.
- `docs/adr/README.md`: keep both decisions 0036 and 0037.
- `VERSION`: allocate 0.2.86 above disk versions and all valid local/remote `checkpoint/*` and `v*` tags, using numeric SemVer precedence. `checkpoint/0.2.86` was absent locally and remotely at allocation and pre-commit reconciliation.

The diff against current main contains the Quill feature and this merge repair. `scripts/specimen-admission-data.mjs`, its tests, the main admission/single-PR tests and the ten-minute news schedule are byte-identical to current main. Articles, published metadata, specimen ledger and publication queue also equal current main; their changes relative to the original Quill branch come solely from the merged parent. The Quill actor pin stays `null`; no App, variable, installation, credential or ruleset was created or changed.

## 2. Verification evidence

Node 24.20.0, using the existing dependency installation. No dependency or lockfile change.

Retained raw logs: `/home/michel/.local/state/aitamer-pr248-conflict-fix-20261011/`. They are local evidence, excluded from the repository.

| Check | Decisive result | Log |
| --- | --- | --- |
| Rejected Quill-only discovery conflict choice, failing-first integration | 9 tests, 3 pass, **6 fail**, 0 skipped, exit 1 | `failing-first-quill.log` |
| Focused admission/data/single-PR, Quill/Grok publisher and deploy-workflow suite | **183 tests, 183 pass, 0 fail, 0 skipped**, exit 0 | `focused.log` |
| Full `npm test` | **1025 tests, 1025 pass, 0 fail, 0 skipped**, exit 0 | `full-tests.log` |
| `npm run check:posts` | 718 published posts numbered; 716 machine-authored posts, 0 findings; exit 0, existing reader-text warning below | `posts.log` |
| `npm run build` | 707 pages indexed; CSP hashes written for 796 pages; exit 0 | `build.log` |
| `npm run check:media` | **720/720** heroes answer **200 image/jpeg**, 708 live; exit 0 | `media.log` |
| Built secret/file/link/body/diagram/CSP checks | 1580 published files without secrets/server-only content; 2374 deploy files; 75010 internal links on 796 pages served; 719 rendered posts, 0 findings; all 41 diagrams checked; CSP valid; every exit 0 | `built-output-checks.log` |

Nine added real-Git integration regressions cover malformed, oversized and invalid-UTF-8 older Quill submissions before valid Quill/Grok submissions; generic infrastructure failures; and oversized/invalid-UTF-8 trusted baseline blobs. Existing tests retain own-article correction, human-article refusal, pin-disabled behavior, terminal holds, owner/Grok discovery, exact certificate provenance and strict current-base checks.

Implementation ledger: one GPT-6.1 Codex implementation lane. Independent reviewers are coordinator-owned and pending; reviewer model/effort/token receipts belong to their separate reports. Local checks do not establish remote CI, App activation, publication or deployment.

## 3. Assumptions made

The requested deliverable is a conflict-free update of the existing PR, preserving both branches' behavior. Combining only one side of the admission conflict loses either Quill byline evidence or main's candidate-isolation repair, so both are required. Malformed Quill candidate data belongs to the same producer boundary as Grok; only typed candidate failures are recoverable in discovery. Trusted baseline and infrastructure errors stay fatal.

Version 0.2.86 is a task checkpoint, not a phase release. The version hold remains assigned to this branch until the coordinator finishes reviewed branch/tag pushes. This site already serves real users, so production review requirements apply. No additional architecture decision was introduced beyond combining accepted decisions 0036 and 0037.

## 4. Concerns and observations

`check:posts` reports a working-note paragraph in unchanged `made-on-youtube-2026-gemini-ask-studio.md`; the existing two iframe grandfather exceptions remain. The article and checker match current main. Recorded in `BACKLOG.md`; editorial changes are outside the conflict fix. Pagefind also reports that its existing Default UI remains supported while recommending its Component UI for new integrations; no UI change was made.

Hygiene: 32 GiB available on the work filesystem before validation, above the owner's 3% floor. Existing shared `node_modules` symlink was reused. This task's build output is regenerable, but retained for review; test fixtures and logs remain as evidence. No deletion, quarantine, service restart or persistent server was performed. Other worktrees, branches, files and processes remain untouched.

## 5. Close-out confirmation

Source resolution, new behavioral tests, changelog, progress, plan, backlog and current handoff are prepared at VERSION 0.2.86. The local merge candidate is committed with the required identity and model trailer before handoff to the coordinator. Independent review is pending. The implementation lane performs no push, checkpoint tag, PR metadata edit, merge into main, App activation or live deployment. After accepted exact-candidate reviews, the coordinator owns the normal branch push, immutable checkpoint tag and remote CI verification. Michel subsequently authorized merging completed tasks after required reviews/checks; the coordinator may normally merge PR 248 and verify the resulting deployment, while leaving App activation out of scope. This report records a provisional local result; it does not claim those pending steps succeeded.

## Independent review disposition

Both fresh GPT-6 Astra xhigh reviews accept source6c879f65 with no blockers. Same-family limitation, review receipts committed. Activation-only variable kill-switch discrepancy recorded in BACKLOG; production pin remains null. Final review-record commit changes only documentation. Older worktrees and stash belong to other work and are preserved; task evidence and logs retained. Source candidate checkpoint/push and exact-head GitHub checks are coordinator next steps.
