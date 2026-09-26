# Deep review — site task S4, the rendered-output gate for bot posts

- **Target:** `e4fe426`, plus `7a203c5` (range `e3a98f7..7a203c5`), branch `mcp/s4-rendered-body-check`, public site repo.
- **Reviewer:** Claude Opus, deep tier, in a separate session.
- **Verdict:** blocking (B1).

## Findings

- **B1 — blocking.** parse5's `parseFragment` silently drops a trailing unterminated tag (the error it records is `eof-in-tag`). On the page, the layout's `</div>` completes that tag.
  - A desk-bot body ending in `<details open ontoggle=alert(document.domain) ` passed the pre-build gate, the build and `--against-build`, and shipped a live handler.
  - `<script src=…` and `<iframe srcdoc=…` pass the same way.
  - The site sends no CSP, so nothing would stop the script.
- **S1 — should-fix, high.** An unclosed element reshapes the page:
  - an open `<a>` wraps the verdict and the Sources heading;
  - an open `<table>` swallows the aside, the footer and the scripts;
  - a stray `</div>` escapes `.article__body`.
  parse5 reports no error for these, so the check needs a trailing sentinel.
- **S2 — should-fix now, blocking for posts task S1.** The gate trusts the post's own `author` field: switching a bot post that carries a `<script>` to `wiz-cat` removes it from the gate.
  - An empty set of bot authors checks nothing and exits 0.
  - The posts lane must require `author: desk-bot` on the App's posts, and refuse App edits to non-bot posts and to `src/content/authors/`.
- **S3 — should-fix.** `deploy-github-pages.yml` has no after-build check. Its actions are pinned by tag, not by commit.
- **N1.** The protected-ids list misses known third-party globals (gtag, Turnstile), and the sync test has blind spots.
- **N2.** The vetting report says MIT for `entities`, which is BSD-2-Clause.
- **N3.** No test pins the grandfather list, and the exemption matches the file name, not its path.
- **N4.** Harmless passes, among them an empty heading id.

## Verified

- **Tests:** 447 pass, `npm audit` is clean, and parse5 brings only one transitive package.
- **The gate:** 23 bot posts, 0 findings. The after-build output is byte-identical to the stored render for all 25 posts, fresh and cached.
- **A stale data store fails closed.**
- **Fail-closed paths:** a crash, a timeout, running out of memory, a garbled protocol line, a theme or processor change, and moved internals all fail closed.
- **Differential fuzz:** 4,483 bodies. Every mismatch was in the B1 or S1 class.
- **Hand corpus:** 138 bodies, with every route other than B1 and S1 refused.
- **7a203c5 staleness:** no fail-open path found.
- **Public-repo hygiene:** clean.
- **CSP:** a proposal was written separately.

## Coordinator's ruling (2026-09-26)

- Fix round G1–G8:
  - **G1:** any parse error is a finding.
  - **G2:** a wrapper and a sentinel.
  - **G3:** the gate fails on an empty bot set, and a post is gated if either its front matter or Astro's stored author is a bot. The posts lane requirement is recorded for task S1.
  - **G4:** the after-build step goes into `deploy-github-pages.yml` with the build's environment, and the actions are pinned by SHA.
  - **G5:** third-party globals are protected, empty ids are refused, and the sync test's blind spots are fixed.
  - **G6:** the licence is corrected.
  - **G7:** a pin test, and matching by path.
  - **G8:** the documentation is accurate.
- A focused review follows before the gate lands on `main`.
- The CSP goes to Michel as a proposal.

## Round 2 — target 11d3a9c (fix round G1–G8): blocking

- **N-B1 — blocking.** A `<body>` or `<html>` start tag in a body merges its attributes into the page's own element. A desk-bot body ending in `<body onload=alert(document.domain)>` or `<html style="filter:invert(1)">` passed the pre-build gate and `--against-build`. The fragment parse drops the tag silently, and the browser applies it to the page.
- **N-S1 — should-fix.** End tags for the page's own ancestors (`</article>`, `</main>`) still escape the article.
- The G fixes otherwise held. The fix asked for was to judge the body as a whole document (H1), and to record end tags (H2).

## Round 3 — target 7e9112c (G3b, G4b, G5b): still blocking

- N-B1 was re-proved on a copy: the tag ships verbatim in the built page. The three new commits did not touch the allowlist.
- **G3b holds.** A post is gated if either its front matter or Astro's stored author names a bot, and an unreadable stored author counts as a bot.
- **G4b holds.** All five actions in the GitHub Pages workflow are pinned by commit. The reviewer had no network access, so the coordinator resolved the two new tags on GitHub; see round 4.
- **G5b:** the empty-id test covers h1 to h6.

## Round 4 — target 92fbecf (H1 whole-page stand-in e766729, H2 end-tag record 92fbecf): CLEAR

Reviewer: s4-deep-review (Opus 5.5), on a git-archive copy; no worktree.

- Build proof: `<body onload=alert(document.domain)>` and `</article>` appended to two desk-bot posts. Pre-build gate exit 1 (2 posts), build exit 0, `--against-build` exit 1 (same 2 findings).
- Hand corpus: 138 bodies through the real worker, 0 bypasses.
- Differential fuzz: 8,978 bodies over 6 seeds through the real worker, each clean verdict re-judged by an independent full-page parse5 check. 0 bypasses.
- G2 attack set all refused. That includes fake wrappers and markers, raw-text states, CDATA, template, svg foreignObject, nested tables, and body/html/frameset. What still passes is harmless because its tree is identical on the page: closed tables with foster-parented content, and stray </p>, </span>, </a>.
- Template and foreign-content paths are refused. That covers template, svg, math, foreignObject, annotation-xml, table, select, noscript, iframe and textarea wrapping body, html or head. No disagreement between the tag record and the tree lets anything through. The SVG case-adjusted names fail closed.
- Real layout versus stand-in, on all 25 built pages: the chain is identical except `lang` on html, where the stand-in is stricter. Zero parse errors in any built page. A probe inserted at the body's position parses as a direct child of the div on all 25 pages.
- G4b is closed: the coordinator resolved upload-pages-artifact v5.0.0 = fc324d35… and deploy-pages v5.0.1 = 368f8252… on GitHub, and both match the pins.
- npm audit: 0 vulnerabilities. The dist bodies are byte-identical to the stored renders.

Should-fixes, before landing:
1. The layout sync test regex-checks only that the pieces exist. An allowed-element wrapper (section, blockquote, li, table) added to the layout later would let `</section>` and the like escape. The fix has two parts: (a) `--against-build` compares the real ancestor chain and requires zero parse errors; (b) refuse any end tag that closes nothing the body opened.
2. The stand-in hard-codes data-pagefind-body, which withdrawn posts omit. A comment is needed.

Landed as d7569a1 (1b), 1bdaba8 (1a) and 1f2e0f1 (2).

## Round 5 — focused review of the should-fixes, 92fbecf..1f2e0f1: CLEAR

- **The recording parser's dedupe is sound.** In parse5 8.0.1, every tag gets a fresh token object from the tokenizer (tokenizer/index.js:279, :290), and the tokenizer calls each handler exactly once. The parser calls `onEndTag` again only to reprocess the same object (parser/index.js:453 after flushing table text; :2985 in select-in-table). No path synthesises a new end-tag token. So identity dedupe records each real tag exactly once.
- **The per-name balance cannot be fooled.** The body's page ancestors (html, body, main, article, div) are not allowed elements, so a start tag that would "pay for" their end tag is itself a finding. 27 probe cases went through the real code, covering foster parenting, svg, math, select and template.
- **Re-runs, 0 bypasses:** the 138-body hand corpus, the g2 set, the fuzz (4 × ~1,500), and a new stray-end-tag fuzz (4 × ~1,500). The real posts produce no false positives: 23 bot posts, 0 findings.
- **1a drift proof.** A built page rewritten to `<section><div class="article__body">` is reported by `--against-build`. The withdrawn flag comes from the stored entry and relaxes only that entry's own page.
- **Minor notes, not fail-open, moved to BACKLOG:** pages where no chain was compared still count as checked, and a live entry with no page file is skipped silently.
