# Deep review: sections v2 (ADR 0013), 2026-09-28

- **Target:** `670fbe9` (base `b92f4da`, main after #31). **Reviewer:** Ari, hexe profile `ari-sol-deep` (Codex, gpt-6-sol, effort xhigh), a separate process in a detached worktree, read-only. Receipt: 2,343,734 tokens in, 12,887 out.
- **Sandbox limits the reviewer reported:** `npm test` hit `spawnSync git EPERM` (35 passed, 7 failed for that reason), and `npm run build` stopped at `EROFS` writing `node_modules/.vite/deps`, so the reviewer ran focused tests only. The coordinator ran the full suite and the build: 540/540, build clean.
- **Verdict:** BLOCKED.

## Rulings (coordinator, validated against source)

| # | Finding | Severity (reviewer) | Ruling |
|---|---|---|---|
| 1 | A withdrawn bot post with no sources passes `findProblems` | blocking | **Refuted as a defect.** A withdrawn page renders only its title and the withdrawal notice (`src/pages/posts/[slug].astro`, the `withdrawn ?` branch): no body, no description, no claims; it is noindex and leaves every list, feed and search. The exemption predates this change. The docs said "only a human editor's opinion piece may omit sources", which was too absolute: fixed in `090e770` (ADR, POST.md, CHANGELOG, the check's message), with a regression test. |
| 2 | The cache key misses the comment and reaction schemas and `wildness.ts` | blocking | **Confirmed, fixed in `090e770`.** The fingerprint now covers `src/content.config.ts`, `src/content/*.ts`, `src/lib/**/*.ts` (tests excluded) and `package-lock.json`; `scripts/workflow-cache.test.mjs` walks the schema's real import graph. Mutation-checked: a broken fallback key fails the test. |
| 3 | Pagination tests don't exercise the routes | informational | **Accepted as a known gap.** Verified on the built site instead: `/news/` and `/news/2/` (29 posts, 24 + 5), prev link `/news/` with trailing slash (fixed in the same batch), canonical per page. |

Fix commits: `105c7b0` (layout, outside this review's scope), `090e770` (findings 1 and 2). A focused re-check of `670fbe9..090e770` follows.

## The reviewer's report, verbatim

BLOCKED

- **Blocking — Source-free bot posts can pass the publish check.** [scripts/stamp-specimens.mjs:344](/tmp/claude-1000/-home-michel-projects-aitamer-news/49512b34-1e61-40fb-a2b1-3bb811c5d22f/scratchpad/review-sections/wt/scripts/stamp-specimens.mjs:344) exempts every withdrawn post. A published, withdrawn `desk-bot` post with no sources passed both the post schema and `findProblems`, despite the decision allowing only a human editor’s piece tagged `opinion` to omit sources.

- **Blocking — Schema changes can reuse stale parsed content.** Both deploy cache keys ([Cloudflare:112](/tmp/claude-1000/-home-michel-projects-aitamer-news/49512b34-1e61-40fb-a2b1-3bb811c5d22f/scratchpad/review-sections/wt/.github/workflows/deploy-pages.yml:112), [GitHub Pages:47](/tmp/claude-1000/-home-michel-projects-aitamer-news/49512b34-1e61-40fb-a2b1-3bb811c5d22f/scratchpad/review-sections/wt/.github/workflows/deploy-github-pages.yml:47)) omit the comment and reaction schemas imported by [src/content.config.ts:5](/tmp/claude-1000/-home-michel-projects-aitamer-news/49512b34-1e61-40fb-a2b1-3bb811c5d22f/scratchpad/review-sections/wt/src/content.config.ts:5), and the post schema’s `wildness.ts` dependency. Astro’s glob loader skips parsing when a file’s digest is unchanged, so a cache restored after one of those schema changes can retain old validation results. [workflow-cache.test.mjs:14](/tmp/claude-1000/-home-michel-projects-aitamer-news/49512b34-1e61-40fb-a2b1-3bb811c5d22f/scratchpad/review-sections/wt/scripts/workflow-cache.test.mjs:14) repeats the same incomplete file list.

- **Informational — Pagination tests miss route behaviour.** [listing.test.ts:5](/tmp/claude-1000/-home-michel-projects-aitamer-news/49512b34-1e61-40fb-a2b1-3bb811c5d22f/scratchpad/review-sections/wt/src/lib/listing.test.ts:5) checks the page-size constant and URL helper, but never calls either listing’s `getStaticPaths` to check post coverage or links. Astro’s paginator produced the expected counts and neighbours in a focused 0/24/25/49-item simulation; built HTML and canonical URLs remain unverified.

The focused post-contract, listing, and cache tests passed. The full `npm test` run reported **35 passed, 7 failed**; a focused failure showed sandbox `spawnSync git EPERM`. `npm run build` stopped at `EROFS` while writing `node_modules/.vite/deps`, so I could not verify rendered pages. No repository files were changed.

Next: send the two blocking findings to the implementation lane.
