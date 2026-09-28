# Deep review: diagrams (untrusted SVG), 2026-09-28

| | |
|---|---|
| Kind | Deep, at task grain (security risk class) |
| Target / base | `72d4e9445c2afedf44cd1e6cc0d414db9fea3c4e` / `ffe1e2d34bf433212d1411f67a7400044081c92e` |
| Reviewer | Ari, hexe profile `ari-sol-deep`: `gpt-6-sol` at effort `xhigh`, a separate process in a detached worktree of the target |
| Receipt | exit success; 5,349,193 tokens in (5,212,160 cached), 38,340 out; 40 min |
| Isolation | Blind to the implementation discussion; the brief and the commit only. Cold-read note written before probes. Single reviewer, not a dual-blind pair. |
| Verdict | BLOCKED (4 blocking, 2 informational, 1 minor) |
| Fixes | `7d349f1` (all seven findings); `3f642d3` (the re-check's five blockers) |
| Status | Re-check 1 (Opus) BLOCKED on `246551b`, ruled and fixed in `3f642d3`; re-check 2 of `3f642d3` owed before merge |

## Rulings (Quill, coordinator), each validated against source at the target

| # | Finding | Ruling | Evidence and fix |
|---|---|---|---|
| 1 | SVG elsewhere in `public/` skips the checks | **Confirmed, blocking.** Today only the maintainer's pull requests may touch `public/` (the publisher path guard), so it is not reachable by a bot yet; it becomes reachable the day a writer lane lands files, which is the point of ADR 0016. | `strayProblems`: outside `diagrams/`, only nine pinned SVGs, no symlinks, in `public/` and the build. Tests use the review's payload. The general path guard for writer lanes is in BACKLOG. |
| 2 | GitHub Pages serves diagrams without the lockdown | **Confirmed, blocking** (conditional on a manual or fork run of a disabled workflow). | The workflow refuses a build whose `dist/diagrams` is not empty, before upload; a test pins the order. |
| 3 | A reduced-motion decoy passes | **Confirmed, blocking**, reproduced: the review's probe returned no findings. | CSS is parsed; `motionProblem` requires a proof (same selector later in `reduce`, a universal `!important` stop, or `no-preference`). |
| 4 | Quadratic `url(` scan | **Confirmed, blocking**, reproduced: 9,405 ms for one 64 kB file on this machine. | One linear pass; 26 ms after. The same pass also removed a quadratic loop the fix itself first introduced (motion lookups use a map). Per-run limits added. |
| 5 | The rewrite can be malformed XML | **Confirmed, informational**, reproduced (two `href`, U+0001 shipped). | Both refused; tests. |
| 6 | `src()`, `image()`; unbounded rendering values | **Confirmed as a gap, informational.** | Functions refused (plus `env()`). Rendering budgets need browser profiling: BACKLOG. |
| 7 | Docs say all entities are refused | **Confirmed, minor.** | ADR and SECURITY.md say "entity declarations". |

## The reviewer's report, verbatim

# Security review — untrusted SVG diagrams

**Target:** `72d4e9445c2afedf44cd1e6cc0d414db9fea3c4e`  
**Base:** `ffe1e2d34bf433212d1411f67a7400044081c92e`  
**Review date:** 2026-09-28  
**Scope:** the committed change and the paths that can publish or serve an SVG. This is a review only; no repository file was changed. The cold read was recorded in `../COLD-READ.md` before probes.

## CONFIRMED findings

### 1. BLOCKING — an SVG in another public folder skips all diagram checks and the enforced policy

**Target locations:** `scripts/check-diagrams.mjs:41,226-275`; `scripts/rendered-body-allowlist.mjs:185-193,215-220`; `scripts/csp-headers.mjs:55-59,83-84,450-461`; `scripts/check-dist-links.mjs:134-143`.

The checker enumerates only `public/diagrams` and `dist/diagrams`. The bot body gate restricts **image** sources, but accepts any absolute site path as a **link**. Astro copies other `public/` assets to the build without processing ([Astro project structure](https://docs.astro.build/en/basics/project-structure/)). The site-wide policy is report-only; only `/diagrams/*` gets an enforcing `sandbox` policy. A report-only policy monitors rather than blocks ([Content Security Policy Level 3](https://www.w3.org/TR/CSP/#csp-report-only)). An SVG navigated to as a document uses the interactive processing mode, unlike an SVG displayed as an image ([SVG Integration](https://svgwg.org/specs/integration/)).

**Reproduction:** Add this file as `public/covers/payload.svg` in a writer-controlled change:

```xml
<svg xmlns="http://www.w3.org/2000/svg" onload="alert(document.domain)"></svg>
```

Link to it from a bot post with `[Open diagram](/covers/payload.svg)`. The pure probes returned `hrefProblem('/covers/payload.svg') === null`, `checkAll() === { findings: [], diagrams: [] }`, and, for a synthetic build containing that link and file, `checkLinks(dist).broken === []`. The generated header model gives `/covers/payload.svg` only `Content-Security-Policy-Report-Only`, while `/diagrams/post/chart.svg` receives the enforced sandbox. `check:dist` checks secret leakage, not SVG safety (`scripts/check-dist-secrets.mjs:18-35,73-91`). The diagram smoke plan also enumerates only `dist/diagrams` (`scripts/smoke-site.mjs:108-115`). Thus an unchecked SVG can ship and be linked from a post. Script execution on direct navigation follows the cited browser processing rules; a live browser run was unavailable in this lane.

**Fix:** Admit writer-controlled SVG only through one checked publishing path. Reject new SVG files elsewhere in `public/` and the final build, with an explicit, pinned exception list for existing trusted covers and favicon. Also apply an enforcing sandbox policy to every same-origin SVG response, and prevent post links to unchecked same-origin SVGs. Test the final distribution, not only the diagram subfolder.

### 2. BLOCKING — the retained GitHub Pages deployment serves diagrams without the lockdown

**Target locations:** `.github/workflows/deploy-github-pages.yml:3-6,53-57,67-78`; `scripts/csp-headers.mjs:83-84,450-461`; `SECURITY.md:78,84-87`.

The manual GitHub Pages workflow builds and uploads `dist`, and its own comment says GitHub Pages does not apply `_headers`. Running `check:csp` proves the **file** is present but cannot make that host send its policy. The workflow has no live header smoke check. On that deployment, opening `/aitamer-news/diagrams/<post>/<name>.svg` directly lacks the third layer. The original repository describes this workflow as retired and disabled in Actions settings; forks do not inherit that switch. This finding is conditional on a manual or fork deployment, not a claim that the current `aitamer.news` host lacks the policy.

**Reproduction:** Trigger the retained `workflow_dispatch` in an enabled repository with a valid diagram, then inspect the SVG response headers on its GitHub Pages URL. `_headers` is uploaded as an inert file, so the diagram-specific `Content-Security-Policy` and `nosniff` headers are absent. The workflow source documents that behavior; no deployment was triggered in this review.

**Fix:** Remove or hard-disable this publication path for untrusted diagrams, or serve those diagrams from a host that enforces the same response policy. A build-time `_headers` check is insufficient for a host that ignores the file.

### 3. BLOCKING — a reduced-motion marker passes without stopping the animation

**Target locations:** `scripts/check-diagrams.mjs:87-100,166-180,195-200`; `docs/adr/0016-diagrams-are-checked-svg-files.md:19-20`.

`hasReducedMotion` becomes true when the stylesheet contains the media-query text anywhere. It does not verify that the matching rule disables the animated selector or even changes an animation property. The checker accepted this complete file with no findings:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1">
  <style>.a{animation:spin 1ms infinite}@keyframes spin{to{opacity:0}}@media (prefers-reduced-motion: reduce){.a{fill:red}}</style>
  <rect class="a" width="1" height="1"/>
</svg>
```

The media rule changes only `fill`; the `animation` declaration remains active. A second accepted probe placed the media-query text inside a CSS string. This bypasses the animation condition stated in the decision and can force motion on readers who requested less motion.

**Fix:** Parse a constrained CSS grammar and verify an effective reduced-motion override for each animated selector and property, including cascade priority. Forbid inline animation when that proof cannot be made. A mere media-query substring must never satisfy this gate.

### 4. BLOCKING — incomplete `url(` tokens cause quadratic checker work below the byte limit

**Target locations:** `scripts/check-diagrams.mjs:43-46,85-96,128-138,175-180`.

`URL_CALL` restarts a scan of the remaining stylesheet at each incomplete `url(`. This payload is rejected eventually, but consumes disproportionate build time before the rejection:

```js
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><style>'
  + 'url('.repeat(16000) + '</style></svg>';
checkSvg(svg);
```

The file is 64,079 bytes, far below the 200,000-byte limit. `checkSvg` took **3,660 ms** for one rejected file in this lane. Direct `cssProblem` measurements for 1,000, 2,000, 4,000, 8,000 and 16,000 tokens were 23, 88, 344, 1,352 and 5,193 ms, approximately fourfold time per doubling. Many such files can stall post checks or CI without crossing a per-file limit. This is a build-time denial of service; the input does not pass the allowlist.

**Fix:** Replace the repeated global regex search with a linear CSS tokenizer that rejects malformed URL tokens on first encounter. Bound total diagram bytes and file count per run as well as each file, and regression-test worst-case malformed inputs with a measured time budget.

### 5. INFORMATIONAL — the checker can emit malformed XML

**Target locations:** `scripts/check-diagrams.mjs:104-119,159-164,169-181,192-204`.

The rewrite does not guarantee a well-formed XML document. Two accepted examples:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><linearGradient xmlns:xlink="http://www.w3.org/1999/xlink" href="#a" xlink:href="#b"/></svg>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><title>x&#x1;y</title></svg>
```

The first becomes a `linearGradient` with **two plain `href` attributes**, because `xlink:href` is rewritten to `href`; `fast-xml-parser`'s XML validator rejected it as `InvalidAttr: Attribute 'href' is repeated`. The second passes and emits literal U+0001 in text; U+FFFE likewise passes. Those code points are outside XML 1.0's legal character range. XML also requires unique attribute names ([XML 1.0, sections 2.2 and 3.1](https://www.w3.org/TR/xml/)). The likely effect is a broken diagram, not script execution or an external fetch. Browser parsing of these exact outputs was not available in this lane.

**Fix:** Detect collisions after attribute normalization, reject non-XML characters in all emitted text and values, and validate the complete serialized output as XML before writing it. Test browser XML parsing when a permitted browser lane is available.

### 6. INFORMATIONAL — the CSS check admits future URL-bearing functions and unbounded rendering values

**Target locations:** `scripts/check-diagrams.mjs:63-100,104-119`; `docs/adr/0016-diagrams-are-checked-svg-files.md:18-22`.

Both `svg{background-image:src("https://attacker.example/pixel")}` and `svg{background-image:image("https://attacker.example/pixel")}` pass `checkSvg` inside `<style>`. CSS Values defines `src()` as a URL-valued function that can make network requests ([CSS Values and Units Level 4](https://drafts.csswg.org/css-values/)); CSS Images Level 5 defines a URL/string form of `image()` ([CSS Images Level 5](https://drafts.csswg.org/css-images-5/)). I did **not** demonstrate a request in a current browser. The Cloudflare diagram CSP would block an image request on direct navigation, and secure SVG image mode disables external references; this is a grammar and future-compatibility gap, not a confirmed current exfiltration path.

Likewise, the checker accepts `viewBox="0 0 1e-300 1e-300"` with a filter region of `2e300` and `stdDeviation="1e300"`, as well as a self-referencing pattern. The 200 kB and 4,000-element limits bound source size, not filter surface area or rendering cost. No reader-side slowdown was measured, so this is a risk requiring browser profiling, not a demonstrated denial of service.

**Fix:** Parse and allowlist CSS property/value forms rather than blacklisting a few function names, and bound geometry, filter parameters and reference chains to measured rendering budgets. Keep `src()` and URL-bearing `image()` forms explicitly forbidden even before browser support changes.

### 7. MINOR — the documentation says all entities are rejected

**Target locations:** `docs/adr/0016-diagrams-are-checked-svg-files.md:21`; `SECURITY.md:86`; `scripts/check-diagrams.mjs:133-138,169-181`.

The precheck rejects `<!ENTITY` declarations but accepts ordinary character references. For example, `<title>A &amp; B</title>` passes, and the rewrite safely emits `&amp;`. The existing target test also intentionally verifies `&lt;` and `&amp;` in text (`scripts/check-diagrams.test.mjs:105-109`).

**Fix:** Say “entity declarations” rather than “entities” in the ADR and security guide.

## REFUTED hypotheses

- Inside the **checked diagram path**, `script`, uppercase event handlers, `foreignObject`, prefixed elements, an external `xlink:href`, a rebound `xmlns:xlink`, an extra namespace declaration, a DOCTYPE and CDATA were rejected by `checkSvg` in direct probes. HTML character references hiding `javascript:` were decoded and rejected.
- A UTF-8 BOM and a misleading `encoding="UTF-16"` XML declaration were accepted only after the checker removed or canonicalized them in its UTF-8 rewrite; neither produced hidden markup. NUL and non-BMP characters inserted into an element name produced unknown element names and were rejected.
- A file symlink under a valid diagram path was read and its malicious target content rejected. A symlink directory under the diagram root failed the path rule. These probes do not establish behavior for symlinks elsewhere in `public/`, which finding 1 covers as a broader publishing path.
- For Cloudflare Pages **static assets**, the `_headers` rule order used here matches Cloudflare's documented inheritance, `! Header` detach and comma joining rules ([Cloudflare Pages headers](https://developers.cloudflare.com/pages/configuration/headers/)). The generated model gave `/diagrams/post/chart.svg` the intended enforced policy with `nosniff`. The source tree contains no Pages Function route that would bypass `_headers` for this path. Live Cloudflare response behavior was not measured in this review.
- The requested `node --test scripts/check-diagrams.test.mjs` exited 0 but reported only one file-level pass in this constrained runtime. Executing `node scripts/check-diagrams.test.mjs` in-process reported **8 tests, 8 pass, 0 fail**. The adversarial probes above are separate from that suite.

## UNVERIFIED behavior and limits

No repository files were edited and no deployment was triggered. The target commit contains no `public/diagrams` files, so its deployment smoke plan would exercise no diagram response; the payloads above were checked in memory. Browser execution was unavailable: local headless Chrome exited with `SIGTRAP` in the container, and the Playwright browser tool required an approval this lane cannot grant. I did not turn standards-based conclusions into claims of a measured browser exploit or a measured reader-side denial of service. The reports are outside the detached checkout; the only pre-existing untracked checkout entry observed was the linked `node_modules`.

VERDICT: BLOCKED

## Re-check 1: Opus, of the fixes (`246551b`, base `72d4e94`)

| | |
|---|---|
| Reviewer | Claude Opus 5.5, a fresh in-process subagent (Strong tier; not blind by construction, which a single focused re-check does not require). Ari could not run: hexe's resource guard refused on disk (under 20 GB free) and then on load (busy 0.89 > 0.85). |
| Verdict | BLOCKED: five blocking, four informational, one minor. Motion and CSS findings tested in Chromium and Firefox with reduced motion emulated, opening the shipped rewrite as a page. |

| # | Finding | Ruling | Fix in `3f642d3` |
|---|---|---|---|
| B1 | Comments or elements inside `<style>` hide CSS | **Confirmed, blocking**, reproduced: `ur<!---->l(https://…)` passed and shipped as a real `url(`. | `<style>` holds only text; the whole sheet is checked as it ships; the rewrite must re-check unchanged. |
| B2 | `-webkit-animation` is not animation to the check | **Confirmed, blocking**, reproduced. | No vendor-prefixed property names. |
| B3 | `<style type="text/plain">` counted by the check, ignored by browsers | **Confirmed, blocking**, reproduced. | `type` on `<style>` must be `text/css`. |
| B4 | `re duce` counted as reduce | **Confirmed, blocking**, reproduced. | The query is matched as tokens; the bare `(prefers-reduced-motion)` is accepted as reduce. |
| B5 | parse5 is quadratic on floods of tags (present in the base) | **Confirmed, blocking** (build-time denial of service), reproduced: 9.9 s. | One-pass pre-scan: at most 4,000 start or end tags and 64 levels, before parsing: 1 ms. Run limits counted on inputs. |
| I | Stack overflow past 3,512 levels | Confirmed; fixed by the 64-level cap. | |
| I | An SVG saved as `.xml` in `public/` runs script | Confirmed; not reachable by a writer today. | HTML and XML documents are refused in `public/` outside `diagrams/`. |
| I | `@media (prefers-reduced-motion)` and `animation-play-state: paused` refused | The first is accepted now. **The second stays refused**: a pause can be undone by a later `animation-play-state: running` rule on another selector that never declares an animation, which the proof would not see. | |
| M | "never searched with a pattern" is inaccurate | Confirmed. | Comment rewritten. |

Found while fixing: the new "rewrite re-checks unchanged" rule first refused an honest 198 kB diagram, because the rewrite spells out close tags and outgrew the 200 kB limit. The size limit now applies to the writer's file only; that file passes in about 0.1 s, with a test.

### The re-check's report, verbatim

# Focused re-check (Opus, Strong tier): fixes to the diagrams deep review

**Target:** `246551b` (fixes in `7d349f1`) · **Base:** `72d4e94` · **Date:** 2026-09-28
**Mode:** review only. Nothing in the repository was modified. Probes live in `opus-probes/` next to this file; the cold read is `COLD-READ-opus.md`, written before any probe.

**How the browser claims were measured.** The Playwright copy bundled with the global `@playwright/mcp` package drove the installed `chromium_headless_shell-1243` and `firefox-1538` (by explicit `executablePath`; nothing was installed). Each payload went through `checkSvg` at the target, and the **shipped rewrite** (`output`) was written to disk and opened **as a document** in a context with `reducedMotion: 'reduce'`. "running" is `document.getAnimations().filter(a => a.playState === 'running').length`. `matchMedia('(prefers-reduced-motion: reduce)').matches` was `true` in every run. The control (the POST.md example, honest) gives `running: 0` in both engines. **Limit:** Playwright's reduced-motion emulation does not reach an SVG shown through `<img>`. The honest control also animated there (2 distinct frames, against 1 for a static control), so `<img>` mode could not tell passing files from failing ones, and every motion result below is document mode. The rule under test is the same in both modes: the file's own media query decides.

`node --test scripts/check-diagrams.test.mjs` at the target: **tests 15, pass 15, fail 0.** None of the payloads below is in the suite.

---

## Question 1: are the seven original findings resolved?

| # | Original finding | Re-run at 246551b | Status |
|---|---|---|---|
| 1 | SVG elsewhere in `public/` | `strayProblems` flags `covers/payload.svg`, `covers/X.SVGZ`, `deep/diagrams/a.svg` and the symlink `link` | **Resolved for `.svg`/`.svgz` names.** An SVG document under another extension still passes (finding I2). |
| 2 | GitHub Pages ships diagrams without the lockdown | The step runs after `npm run build` (which runs `--write`) and before `upload-pages-artifact`; `find … -print -quit` refuses any entry | **Resolved** (see question 4) |
| 3 | Reduced-motion decoy | Ari's fill-only stop is refused; the media query inside a string is refused | **The two exact probes are resolved. The class is not:** four new bypasses, B1–B4 |
| 4 | Quadratic `url(` | `url(` ×16000: refused in 14 ms | **Resolved for `url(`.** A worse quadratic path remains in the parser (B5); it was already there at the base |
| 5 | Malformed XML | `href`+`xlink:href` refused; U+0001 refused both as a reference and as a raw character | **Resolved** |
| 6 | `src()`, `image()` | Both refused as written | **Resolved as written, bypassed by B1** (`ima<!---->ge(` passes) |
| 7 | Docs say "entities" | ADR and SECURITY.md now say "entity declarations"; `&amp;` in a title passes | **Resolved** |

---

## BLOCKING findings

### B1. BLOCKING: the checker reads a different stylesheet from the one it ships. An XML comment or an element inside `<style>` hides any CSS token.

**Where:** `scripts/check-diagrams.mjs:398-411` (a comment child is dropped at 399; `cssProblem` runs **per text node** at 407; text nodes are pushed separately at 409) and `:427` (`sheets.join('\n')`). The rewrite at 411/418 concatenates the same chunks with **nothing** between them, or with a serialized child element between them.

parse5 in SVG foreign content parses `<!---->` as a comment node, and `<g/>` as a child element, inside `<style>`. Every regex in `cssProblem` (`url(`, `/*`, `src(`, `image(`, `@import`, `DANGEROUS_VALUE`) sees only one fragment. `parseStylesheet` sees the fragments joined with `\n`, which is a token boundary that the shipped file does not have. The rewrite then removes the comment, so **the shipped bytes contain exactly the token the checker refused to see**.

**Reproduction** (`opus-probes/probe.mjs`, `probe2.mjs`). Every row passes `checkSvg`. The shipped rewrite is shown.

| Payload `<style>` text | Shipped rewrite | Chromium | Firefox |
|---|---|---|---|
| `.a{fill:red}svg{background:ur<!---->l(https://attacker.example/px)}` | `svg{background:url(https://attacker.example/px)}` | **request to `https://attacker.example/px`** | **same request** |
| `@keyframes …  .a{animation:spin 200ms infinite;x:/<!---->*}@media (prefers-reduced-motion: reduce){.a{animation:none}}` | `…;x:/*}@media …` (the comment swallows the stop) | **running 1** | (same sheet, stop gone) |
| same, split with `<g/>` in place of the comment | `…;x:/<g></g>*}…` | **running 1** | (same) |
| `.<!---->a{animation:…}` plus a stop written `. a{animation:none}` | `.a{animation…}` … `. a{animation:none}` (the browser drops the stop as an invalid selector) | **running 1** | **running 1** |
| `svg{background-image:ima<!---->ge("https://…")}` | `image("https://…")` | refused function shipped | |

In the pass, the checker's `cssProblem` returned null for each fragment, and `parseStylesheet` over the `\n`-joined text produced a valid stop for `. a` (`.\na` normalized). The browser's `cssRules` for the shipped file show `@media (prefers-reduced-motion: reduce) {}` (empty) in both engines.

**Impact.** This is a working bypass of layer 2 in both directions. The file loads an external resource: the `/diagrams/*` Content Security Policy blocks that when the file is opened on its own, and `<img>` mode blocks it too, so layers 1 and 3 still hold for the fetch. The file also forces motion on a reader who asked for reduced motion, and **no layer stops that**. `--check-dist` also passes, because it compares the shipped bytes with the same flawed rewrite.

**Fix.**
1. `<style>` may hold **only text**. Refuse a comment or an element child of `style`: parse5 gives comment nodes in foreign content, and today they are skipped silently.
2. Run `cssProblem` on the **concatenated sheet exactly as it will ship** (`chunks.join('')`), never per chunk, and parse that same string.
3. As a backstop, check idempotence: `checkSvg(output)` must pass and must return `output` byte for byte. That one assertion catches every split-token class, including ones not listed here. Run it in `--write` and `--check-dist`.

### B2. BLOCKING: vendor-prefixed animation is never treated as animation

**Where:** `:114` (`CSS_PROPERTY = /^-?[a-z][a-z0-9-]*$/` admits `-webkit-animation`), `:274`/`:276` (`animates` and `stopsAnimation` compare against `animation` and `animation-name` only), `:297` (`startsWith('transition')`), `:342` (the `style` attribute: `startsWith('animation')`).

Chromium and Firefox both alias `-webkit-animation` to `animation`.

**Reproduction** (`probe.mjs`). Every case passes `checkSvg`:

| Case | Chromium | Firefox |
|---|---|---|
| `<style>.a{-webkit-animation:spin 1s infinite}@keyframes spin{…}</style>`, with **no reduced-motion rule at all** | running 1 | running 1 |
| `<rect style="-webkit-animation:spin 1s infinite">` (a `style` attribute, which the fix meant to refuse) | running 1 | running 1 |
| The honest file, with the stop, plus `style="-webkit-animation:…"` on the rect (the inline declaration beats the same-selector stop) | running 1 | running 1 |

`-webkit-transition` passes too, because it does not start with `transition`.

**Fix.** Normalize the property before any test: strip one `-webkit-`, `-moz-` or `-o-` prefix and compare the rest. Better, and in the spirit of the ADR ("refuse what is unknown"), replace `CSS_PROPERTY` with an **allowlist of property names**, the CSS twin of `ATTRIBUTES`, with no vendor prefixes. Add a test for each row above.

### B3. BLOCKING: a `<style type="…">` sheet is ignored by the browser but counted by the checker

**Where:** `:87` (`type` is in `ATTRIBUTES`, and it is allowed on every element), `:378`/`:409`/`:427` (every `<style>` text joins the one cascade).

**Reproduction** (`probe.mjs`, case `style_type_ignored`): the payload passes.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1">
  <style>.a{animation:spin 1s infinite}@keyframes spin{to{opacity:0}}</style>
  <style type="text/plain">@media (prefers-reduced-motion: reduce){.a{animation:none}}</style>
  <rect class="a" width="1" height="1"/>
</svg>
```

In both Chromium and Firefox, `document.styleSheets` holds only the first sheet: **running 1**. The same trick works in reverse to hide rules from a reviewer. Any future `media` attribute on `style` would open the same hole.

**Fix.** Refuse `type` on `<style>` unless the value is exactly `text/css`. Simplest is to refuse every attribute on `<style>` and allow `type` only on `feColorMatrix`/`feComposite`, where DOMPurify needs it. Test it.

### B4. BLOCKING: the media prelude is compared with every space removed, so an invalid query counts as the reduce query

**Where:** `:262` (`prelude.replace(/\s+/g, '').toLowerCase()`), compared at `:298`/`:299`/`:306` against `REDUCED_MOTION_QUERY`.

**Reproduction** (`probe.mjs`, case `media_space_in_value`): `@media (prefers-reduced-motion: re duce){.a{animation:none}}` passes as a valid stop. In a browser, `re duce` is two identifiers, so the feature is invalid and the query is false. Both engines: `running 1`, and `cssRules` shows `@media (prefers-reduced-motion: re duce)`. The same applies to `prefers-reduced -motion` and to any space inside a token.

**Fix.** Tokenize the prelude instead of deleting whitespace. Accept only `(` WS* `prefers-reduced-motion` WS* `:` WS* `reduce` WS* `)`, and the same for `no-preference`, for example `/^\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)$/i` on the trimmed prelude. Test with a space inside the value.

### B5. BLOCKING (present at the base as well, not introduced by the fix): parse5 is quadratic on hostile nesting; about 3 s for a file that **passes**, and 8.7–13 s for one refused file, all below 200 kB. The per-run caps do not bound the work.

**Where:** `:366` (parse5 over the whole file before any structural limit); `:426` (the element count is taken after the parse and after the recursive visit); `:527-528` (`MAX_TOTAL_BYTES` and `MAX_DIAGRAMS` count **only files that passed**, after every file has been parsed).

**Reproduction** (`opus-probes/timing.mjs`, `timing2.mjs`; the same numbers at the base via `timing2.mjs base`):

| Input (≤ 199 kB) | Target | Base | Result |
|---|---|---|---|
| `<g>`×1000, `</q>`×47,984 (unmatched end tags), `</g>`×1000 | 1,580 ms | 1,562 ms | **PASS** |
| `<g>`×2000, `</q>`×46,234, `</g>`×2000 | 2,906 ms | 2,930 ms | **PASS** |
| `<g>`×33000 then `</q>`×24000 | **12,932 ms** | not run | RangeError |
| `</svg>` then `<div>`×10k / 20k / 39k (HTML break-out) | 526 / 2,028 / **8,655 ms** | 597 / 2,479 / 8,658 ms | refused |

Each unmatched end tag in foreign content walks the open-element stack. Each HTML start tag after the break-out runs a scope check over the stack. The cost grows about 4× per doubling, which is quadratic. At the per-run cap of 2,000 passing files, about 3 s each is roughly 100 minutes. Refused files are uncapped, at about 13 s each. That is the same class and the same order of cost as original finding 4, which was ruled blocking. The CHANGELOG line "Linear-time checks" is not true of the file as a whole.

**Fix.** Before `parse()`, run a cheap linear pre-scan of the raw text:
- count `<` tag openings and refuse more than `MAX_ELEMENTS` start tags;
- refuse more end tags than start tags;
- cap nesting depth, for example at 64, with a linear tag scan.

Count the per-run budget over **input** bytes and files before checking, not over passing outputs. Add a timed regression test with these payloads, for example under 200 ms each.

---

## MINOR

### M1. The docs and comments claim linear parsing, and "never searched with a pattern"

**Where:** `:28` ("CSS is parsed in one linear pass, never searched with a pattern"), `CHANGELOG.md` ("Linear-time checks"), ADR 0016 ("a regular expression over the raw text is not a check").

`cssProblem` (`:138-148`) is still regexes over raw text, and B1 is exactly that weakness. parse5 is not linear (B5).

**Fix:** correct the text when B1 and B5 land.

---

## INFORMATIONAL

### I1. Deep nesting crashes the checker instead of refusing the file

**Where:** `:380-418`. `visit` recurses, and the limit is checked at 426.

**Reproduction** (`opus-probes/depth.mjs`): the deepest `<g>` nesting that does not crash is **3,512**, which is below `MAX_ELEMENTS` = 4,000. At 3,800 it throws `RangeError: Maximum call stack size exceeded at new Set … at visit (check-diagrams.mjs:387)`.

The run fails closed, so this is not a bypass. The report is an uncaught stack trace that names no file, and an honest but deeply grouped file between 3,513 and 4,000 levels crashes the run.

**Fix:** the depth cap from B5, or an iterative walk.

### I2. An SVG document under another name passes `strayProblems`

**Where:** `:470` (`SVG_NAME = /\.svgz?$/i`).

**Reproduction:** `stray/public/covers/doc.xml` containing `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>` produced no problem. Opened in Chromium, it **ran the script** (a dialog fired, and the root namespace was SVG). The same holds for `.xhtml`, `.html` and `.xsl`.

This is outside the writer path today: `public/` outside `diagrams/` is maintainer-only, and inside `diagrams/`, `DIAGRAM_PATH` admits only `.svg`. BACKLOG already records the path-guard gap ("an `.html` or `.xml` dropped in `public/`"). SECURITY.md's "no SVG anywhere else in the site but nine pinned files" is true by file name, not by content.

**Fix:** when the writer lane lands, make the stray walk an allowlist of extensions for writer-reachable folders, or sniff for an `<svg`/`<html` root in `.xml`/`.xhtml`/`.xsl`. Until then, reword SECURITY.md to say "no `.svg`/`.svgz` file".

### I3. Honest reduced-motion forms are refused (fails closed; worth documenting)

**Where:** `:110`, `:272-276`.

**Reproduction** (`opus-probes/orig.mjs`): each of these is a correct stop, and each is refused:
- `@media (prefers-reduced-motion){.a{animation:none}}`, the boolean form, which matches `reduce`;
- a stop that uses `animation-play-state: paused`.

POST.md lists the three accepted forms, so a writer is told. No change needed beyond perhaps accepting the boolean form once B4's tokenizer exists.

### I4. The `/diagrams/*` policy leaves `style-src 'unsafe-inline'` as the only CSS allowance

**Where:** SECURITY.md layer 3.

That is correct, and it is why B1's external `url()` does not load under the policy. Noting it: layer 3 is the only thing standing between B1 and a tracking pixel when the file is opened on its own, and nothing but layer 2 stands between B1–B4 and forced motion in a post.

---

## Question 4: the GitHub Pages refusal step holds

Verified at `.github/workflows/deploy-github-pages.yml`:
- `npm run build` runs `check-diagrams.mjs --write dist` (package.json `build`), which fails the job on any stray or refused file first.
- The refusal step comes after the build and before `upload-pages-artifact`.
- `find dist/diagrams -mindepth 1 -print -quit` treats any entry as non-empty, whether a file, a directory or a symlink.
- The `deploy` job consumes only the uploaded artifact.

A fork can delete the step, but a fork can delete anything. The refusal is correct.

## Refuted hypotheses

- **Cascade order across several `<style>` elements.** Document order equals `index` order, and an honest two-sheet file passes. Across sheets, only `type` (B3) breaks it.
- **Selector normalization: case, lists, `:is()`/`:where()`.** Stops are matched by identical normalized string, so specificity is identical by construction. `.a,.b` versus `.a, .b` is refused, which fails closed. Only token-splitting (B1) makes the checker's string differ from the browser's.
- **A later same-selector re-animation after the stop.** Refused (`lastStop > index`). **An animation inside the reduce block.** Refused. **`animation-name: none, spin`.** Treated as animating, and `none, none` is not accepted as a stop.
- **`!important` placement.** Refused outside the reduce block, and `! important` is normalized. `!important` inside `@keyframes` is exempt, which is harmless because browsers ignore it there.
- **Extra conditions on the no-preference prelude** (`screen and (…)`, `not (…)`). They do not match `MOTION_OK_QUERY`, so they need a stop, which fails closed. A no-preference prelude that is invalid in the browser only turns motion off.
- **Custom properties, `var()`, `env()`, nested at-rules, `@-webkit-keyframes`, `@import`.** All refused. (`@imp<!---->ort` is refused too, because `parseStylesheet` sees `@imp`.)
- **Linear time of the new code** (`parseStylesheet`, `parseDeclarations`, `urlProblem`, the `!important` and `DANGEROUS_VALUE`/`CSS_FUNCTIONS_REFUSED` regexes). The worst cases at about 199 kB ran in 6–36 ms: 66k rules, 66k `;`, `! ` runs, `url(#a)` runs, deep `(`, quotes, 3.6k media blocks, 2.6k animated rules with stops, and `expression`/`image` followed by spaces. B5 is parse5, not this code.
- **`strayProblems`:** case (`X.SVGZ`), `.svgz`, a directory named `diagrams` below the top level (`deep/diagrams/a.svg`), and symlinks are all flagged. A top-level `public/diagrams` symlink is flagged too.
- **SVGs that Astro or pagefind emit themselves.** None. The main checkout's existing `dist/` holds exactly the nine pinned files outside `diagrams/`, and the source imports no `.svg`. Honest builds are unaffected.
- **Finding 5's new refusals** do not reject honest text: `&amp;` still passes.

VERDICT: BLOCKED
