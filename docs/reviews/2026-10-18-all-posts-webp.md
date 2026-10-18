# All-post WebP validation · 2026-10-18

CONFIRMED: implementation, local checks and independent pinned-source acceptance below. PR289 owns current-head CI, merge and deployment receipts; final live evidence is retained privately with this run.

## Scope and source

Michel requested every post use WebP. Source base f8764bc7d29c07ac5d6ab557462b44d0d94ede2b has 907 posts: 578 on media.aitamer.news and 329 on bots.aitamer.news, all using JPEG metadata. All 907 same-name WebP twins returned 200 image/webp in a cache-isolated read-only probe. No image uploads, replacements or deletions were needed. Private inventory and probe evidence are retained under /home/michel/.local/state/aitamer-publisher/all-webp-20261018/.

A shared picture component selects declared WebP pairs for articles, cards and homepage lead, preserving JPEG fallback, alt text, loading priority, dimensions and local media rewriting. A positive TypeScript catalog participates in the existing Astro cache fingerprint. Unknown future JPEGs remain publishable JPEG-only quality fallbacks; explicit bot WebP remains supported. Required deploy media verification now checks declared WebP twins. ADR0038 records the decision.

## Local validation

- Full suite 1037 passed, 0 failed. Media helper 20/20; checker 20/20. Worker established 3 new checker tests failed before implementing the new collection logic.
- Production build passed. Media check 1815/1815 passed (1813 live targets, including JPEG fallbacks, WebP sources and site share card).
- Parsed every rendered article:906 of906 have the expected WebP source and exact JPEG fallback and social URL; one draft is not rendered but is included in the907-pair catalog. All 116 homepage cards and homepage lead have WebP sources.
- Browser: original-media article currentSrc is welcome-to-aitamer.webp,960x540, with .jpg fallback and social image; homepage lead and lazy card use bot-host WebP. Their displayed ratio remains16:9. At 390px viewport document width is 390px, with no horizontal overflow. Initial homepage image requests were 4 WebP and 0 JPEG; no speed claim inferred.
- Source post files and specimen ledger have no diff against base. Article text, dates and identities remain intact.

## Models and isolation

Top planner: GPT-6 Astra at xhigh, source-only plan. Catalog/checker worker: GPT-6.1 Sol at high, three owned files, shared workspace with explicit ownership; no commits or uploads. Coordinator owns rendering and integration. Independent source reviews will be pinned before acceptance; no filesystem sandbox or blind isolation is claimed for the implementation lanes.

## Hygiene and operations

Private logs and browser evidence retained. A temporary loopback static server on8776 is used for browser checks and will be stopped before close-out; no persistent service or new datastore. One site clone; no extra worktree, stash or unrelated source changes. Generated dist is retained as build evidence. Local PR branch removed only after commits are proven reachable from main. Deployment and final live verification receipts will be appended privately and available in the PR/actions.

## Independent acceptance

Mechanical reviewer, GPT-6.1 Sol at high, accepted e07c21ca24af71d9c8e5bd587398d3effaf7aded with no blockers. Independently verified exact equality of all 907 post hero URLs and catalog entries, no missing/surplus/malformed entries, no content or ledger changes, preserved attributes and complete failure-path tests. Source-only review, not an independent test/build run.

Deep reviewer, GPT-6.1 Sol at xhigh, confirmed the same production invariants and found one P2 blocker: production catalog evidence does not prove local WebP presence in the documented JPEG-only offline setup. The fix at 5d20a6a7d4899462027d6c114ac65678b277039c keeps JPEG-only rendering when PUBLIC_MEDIA_BASE is set. Two updated assertions failed before the fix and passed afterward. Final full suite 1037/1037 passed; final production build and parsed 906 article image pairs passed. The deep reviewer accepted that pinned fix with no remaining blockers. Reviewers had fresh brief contexts and shared filesystem access; they used Git objects, not mutable source. No dual-blind or sandbox claim is made.

All local output checks passed: CSP 1006 pages, 94675 internal links, 41 diagram rewrites, 1989 published files without secrets, 3000 deployed files within budget. The known grandfathered body findings and reader-text warning remain unchanged. The temporary browser server is stopped and port 8776 is marked released. Existing generated output and private evidence remain; no files or image objects were removed.
