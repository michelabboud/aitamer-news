# All-post WebP validation · 2026-10-18

CONFIRMED: implementation and local evidence below; independent pinned-source review and remote deployment pending.

## Scope and source

Michel requested every post use WebP. Source base f8764bc7d29c07ac5d6ab557462b44d0d94ede2b has 907 posts:578 on media.aitamer.news and329 on bots.aitamer.news, all using JPEG metadata. All907 same-name WebP twins returned200 image/webp in a cache-isolated read-only probe. No image uploads, replacements or deletions were needed. Private inventory and probe evidence are retained under /home/michel/.local/state/aitamer-publisher/all-webp-20261018/.

A shared picture component selects declared WebP pairs for articles, cards and homepage lead, preserving JPEG fallback, alt text, loading priority, dimensions and local media rewriting. A positive TypeScript catalog participates in the existing Astro cache fingerprint. Unknown future JPEGs remain publishable JPEG-only quality fallbacks; explicit bot WebP remains supported. Required deploy media verification now checks declared WebP twins. ADR0038 records the decision.

## Local validation

- Full suite1037 passed,0 failed. Media helper20/20; checker20/20. Worker established3 new checker tests failed before implementing the new collection logic.
- Production build passed. Media check1815/1815 passed (1813 live targets, including JPEG fallbacks, WebP sources and site share card).
- Parsed every rendered article:906 of906 have the expected WebP source and exact JPEG fallback and social URL; one draft is not rendered but is included in the907-pair catalog. All116 homepage cards and homepage lead have WebP sources.
- Browser: original-media article currentSrc is welcome-to-aitamer.webp,960x540, with .jpg fallback and social image; homepage lead and lazy card use bot-host WebP. Their displayed ratio remains16:9. At390px viewport document width is390px, with no horizontal overflow. Initial homepage image requests were4 WebP and0 JPEG; no speed claim inferred.
- Source post files and specimen ledger have no diff against base. Article text, dates and identities remain intact.

## Models and isolation

Top planner: GPT-6 Astra at xhigh, source-only plan. Catalog/checker worker: GPT-6.1 Sol at high, three owned files, shared workspace with explicit ownership; no commits or uploads. Coordinator owns rendering and integration. Independent source reviews will be pinned before acceptance; no filesystem sandbox or blind isolation is claimed for the implementation lanes.

## Hygiene and operations

Private logs and browser evidence retained. A temporary loopback static server on8776 is used for browser checks and will be stopped before close-out; no persistent service or new datastore. One site clone; no extra worktree, stash or unrelated source changes. Generated dist is retained as build evidence. Local PR branch removed only after commits are proven reachable from main. Deployment and final live verification receipts will be appended privately and available in the PR/actions.
