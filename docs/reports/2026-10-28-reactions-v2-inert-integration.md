# Inert reaction v2 reader source integration

2026-10-28. Source-only worker result; independent review and Git close-out belong to the coordinator.

The worker's original sections below are a dated record of the initial environment and remain preserved. The coordinator's later clean dependency installation, independent reviews and full checks supersede their statements that dependencies and build evidence are unavailable; see the final section.

## Candidate binding

- Worktree: `/home/michel/projects/aitamer-news-lanes/reactions-v2-inert-20261028`.
- Branch: `feat/reactions-v2-inert-20261028`.
- Verified starting `HEAD` and `origin/main`: `f0d1fbd8abe07de8ba5eef93be4998405ecdcd29`, with no initial working changes.
- Accepted template source: `5ff88c5280d580600a43ac69e977f2d4e2a315c1` in `aitamer-uiux`, `templates/aitamer-news/src/`.
- [15-file byte manifest](2026-10-28-reactions-v2-inert-source-manifest.json). The manifest binds the uncommitted source candidate by path, length and SHA-256; `HEAD` still identifies the upstream baseline, not the integrated source.
- The two tracked replacements (`src/components/Reactions.astro`, `src/lib/reactions.ts`) matched the exact destination baseline before writing; their prior SHA-256 digests are preserved in the manifest. All other 13 source paths were absent from the baseline and working tree.
- The existing browser harness, data-host reader, site metadata, comment limits and v1 reaction schema are byte-identical to the accepted template prerequisites.

## Scope and decisions

Only the 15 reaction sources/tests were ported. [Plan](../plans/2026-10-28-reactions-v2-inert-integration.md) and [decision](../adr/0049-inert-reaction-v2-reader-and-private-journal.md) record why the integration remains inert. Existing site configuration, global CSS, privacy page, v1 schema/snapshot/routes and dependency manifests were compared with baseline and are unchanged. `COMMENTS_SOURCE = 'r2'`, `REACTIONS_SOURCE = 'baked'`, `REACTIONS_LIVE = false` remain exact. No whole-template copy, privacy edit, provider read, installation, Cargo, Git mutation, PR, push, cloud action or deployment occurred.

## Verification

Node `v24.20.0` and installed Google Chrome were used. The worktree has no `node_modules` directory.

| Command / check | Exact result | Meaning |
|---|---|---|
| `node --experimental-strip-types --no-warnings=ExperimentalWarning --test src/lib/reactions.test.ts src/lib/reactions-v2.test.ts src/lib/reactions-v2-persistence.test.ts src/lib/reaction-receipts.test.ts` | `tests 48`, `pass 48`, `fail 0`, `skipped 0`; exit 0 | Existing baked rules, bounded v2 reader, receipt wire rules and fail-closed storage boundary pass |
| `node --experimental-strip-types --no-warnings=ExperimentalWarning --test --test-concurrency=1 src/lib/reactions-v2-persistence-browser.test.ts src/lib/reaction-journal.test.ts` | `tests 3`, `pass 3`, `fail 0`, `skipped 0`; exit 0 | Real isolated Chromium verifies journal corruption/replacement handling and IndexedDB reload/navigation, empty barriers, concurrent tabs, quota/storage failure, reset and recovery |
| `node --experimental-strip-types --no-warnings=ExperimentalWarning --test src/lib/reaction-contract-v2.test.ts src/lib/reactions-component-browser.test.ts` | `tests 2`, `pass 0`, `fail 2`; exit 1, import failures | Missing `astro` and `@astrojs/compiler-rs`; neither test body runs. No schema/component-runtime acceptance |
| `node scripts/check-reactions.mjs` | exit 1: `Cannot find module 'astro/package.json'` from `scripts/frontmatter.mjs` | Existing content check unavailable without local dependencies |
| `node --experimental-strip-types --no-warnings=ExperimentalWarning --test scripts/check-reactions.test.mjs` | `tests 1`, `pass 0`, `fail 1`; exit 1: missing `astro` | Existing schema-backed script test unavailable without local dependencies |
| Exact manifest/protected-path validation | 15 source hashes match; protected files and flags unchanged | Exact port and inert configuration verified |
| `git diff --check` | exit 0 | Tracked diff has no whitespace errors |

Missing-package failures are environment limitations, not claimed product regressions or passing checks. The unchanged existing v1 schema and `frontmatter.mjs` also require Astro; no alternate checkout was changed to supply it. No source edits followed the passing tests.

Before the browser run: 1-minute load `5.91` on 28 CPUs, 42,576 MiB available memory, `/dev/shm` 3.7 GiB used of 48 GiB, working filesystem about 9.7 GiB free of 1007 GiB. CPU and memory admitted a bounded browser run; low disk headroom prevented heavy build/install work. No cleanup occurred.


## Additional read-only hook-assisted qualification

At the coordinator's explicit follow-up instruction, a read-only Node `registerHooks` resolver used the existing dependency tree at `/home/michel/projects/aitamer-uiux/templates/aitamer-news/node_modules`. Both candidate and dependency-checkout `package-lock.json` are byte-identical, SHA-256 `9d5c8f4b0a24d4f37cc7db398dae551632a1396fa420523e8ae618729eb47806`. Installed package versions are Astro `7.3.5` and `@astrojs/compiler-rs` `0.5.0`. No package was copied, linked, installed or changed in either checkout; the hook and output live in the external evidence directory. The new worktree still has no installed dependency tree. This is hook-assisted evidence, not a clean local build or installation proof.

Hook: `/home/michel/.local/share/aitamer-news/reactions-v2-inert-20261028/readonly-dependency-hook.mjs`, SHA-256 `5a90bc56690fc49e14bec9cd7a898d4338339741a81f5a558bbb708c3cb8f05c`. Dependency metadata: `hook-assisted-dependency-metadata.json` in the same directory. The hook first tries ordinary resolution, then redirects unresolved bare imports to the matching dependency checkout.

| Hook-assisted command | Result |
|---|---|
| `node --import <hook> --experimental-strip-types --no-warnings=ExperimentalWarning --test --test-concurrency=1 src/lib/reaction-contract-v2.test.ts src/lib/reactions-component-browser.test.ts` | `tests 3`, `pass 3`, `fail 0`, `skipped 0`; exit 0. Validates actual Astro-rendered component/client in Chrome and frozen v2 route/schema behavior |
| `node --import <hook> scripts/check-reactions.mjs` | exit 1. CJS `createRequire().resolve('astro/package.json')` still fails under the ESM-oriented fallback; preserved in `hook-assisted-baked-content-check.log` |
| `node --import <hook> --experimental-strip-types --no-warnings=ExperimentalWarning --test scripts/check-reactions.test.mjs src/lib/reaction-contract.test.ts` | `tests 18`, `pass 17`, `fail 1`, `skipped 0`; exit 1. All 17 existing frozen-v1 contract tests pass; content-check script cannot import through its CJS Astro lookup. Mixed failure preserved in `hook-assisted-frozen-v1-and-content-tests.log` |

The first failed clean-environment attempts remain recorded above. A hook-assisted pass does not change those attempts into passes. Before the additional browser test: 1-minute load `6.14` on 28 CPUs, 43,013 MiB available memory, filesystem about 9.5 GiB free, `/dev/shm` 3.7 GiB used of 48 GiB. Only bounded tests ran.

Actual component fixture/profile/results: `/tmp/aitamer-reactions-component-alK912`. Full hook-assisted component/contract output: `/home/michel/.local/share/aitamer-news/reactions-v2-inert-20261028/hook-assisted-contract-component-tests.log`. Source hashes remain unchanged from the original passing unit/persistence candidate.

## Coordinator qualification, 2026-10-28

The accepted source and heading-ID correction were independently reviewed, with the final correction pinned at `714923dad9b29b16c62beabc187907945db9568e`; see [review](../reviews/2026-10-28-reactions-v2-inert-review.md). After clean `npm ci` from this worktree's existing lockfile, `npm test` passed 1,457/1,457 and `npm run test:site` passed 1,426/1,426, both without skips. `npm run check:posts` passed with the previously logged reader-note warning for `made-on-youtube-2026-gemini-ask-studio.md`. The live media check found all 2,211 expected hero images. `npm run build` completed 1,461 pages; `check:bodies:build`, `check:csp`, `check:dist`, `check:files`, `check:links`, and `check:diagrams:dist` each passed. Exact command logs are retained in `/home/michel/.local/share/aitamer-news/reactions-v2-inert-20261028/`.

The test/build product files matched the reviewed candidate; only review documentation changed after the frozen source snapshot. A clean dependency installation and these local checks do not establish live D1/R2, release, merge, deployment, device accessibility or Part B privacy approval. The site continues to use R2 comments, baked reactions and `REACTIONS_LIVE = false`. Model ledger: Standard implementation, Strong independent source review and coordinator integration. The working filesystem had about 8 GiB available; generated `node_modules` and the 90 MiB `dist` are retained with this active lane, with no cleanup or evidence deletion. The Rust 25 GiB floor remains unmet.

## Retained evidence

- Browser command output: `/home/michel/.local/share/aitamer-news/reactions-v2-inert-20261028/bounded-browser-tests.log`.
- Native journal fixture/profile/results: `/tmp/aitamer-reaction-journal-order-PR3gtG`.
- Public-envelope persistence fixture/profile/results: `/tmp/aitamer-reactions-v2-persistence-Vf2FMq`.
- These browser fixtures use synthetic local endpoints and isolated profiles; no real provider reads occurred.
- Shared dashboard: `/home/michel/.local/state/build-task-dashboard/tasks.html`; project is the worktree above, run `reactions-v2-inert-20261028`, session `reactions-v2-site-worker`. Reported build state covers bounded evidence only and must not be read as a full build pass.

## Remaining gates and handoff

Coordinator must independently review the exact source manifest, then own any authorized version allocation, commit, checkpoint and source push. This worker made no Git mutation and left `VERSION` unchanged. Full `npm test`, strict content checks and production Astro build/artifact checks remain unavailable here without local dependencies and sufficient build capacity. Actual Astro-rendered component and v1/v2 contracts passed using the separately documented read-only dependency hook; a clean local dependency-backed run remains unverified. Apple WebKit, iOS, VoiceOver/screen-reader and device-specific reaction behavior remain unrun. Reactions privacy wording, persistence retention/reset disclosure, real writer/provider endpoint qualification, deployment and actual live activation remain separate; no approval or acceptance is inferred from the source port or synthetic Chrome checks. No worker-started process remains running after the completed browser checks.
