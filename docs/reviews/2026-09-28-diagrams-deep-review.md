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
| Status | Re-check 1 (Opus) BLOCKED on `246551b`, fixed in `3f642d3`; re-check 2 (Opus) BLOCKED on `d7dd25f`, fixed in `3a3da8e`; re-check 3 (Opus) BLOCKED on `4b76e32`, fixed in `8ef160a`; re-check 4 owed before merge |

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

## Re-check 2: Opus, of `d7dd25f` (base `246551b`)

Verdict BLOCKED: all five earlier blockers resolved as reproduced; two new blocking findings, both confirmed here and fixed in `3a3da8e`.

| # | Finding | Ruling | Fix |
|---|---|---|---|
| C1 | JavaScript whitespace is not CSS whitespace (U+00A0, U+3000, U+FEFF in queries, selectors, property names) | **Confirmed, blocking**, reproduced for query, universal stop, property and selector | CSS outside quoted strings is printable ASCII plus tab, LF, CR, FF |
| C2 | `<style type=" text/css ">` trimmed by the check, not by browsers | **Confirmed, blocking**, reproduced | Compared exactly (case-insensitive, as browsers do) |
| I | `<g fill=a/>` flood: the pre-scan counts self-closing, parse5 does not; stack overflow at 3,999 levels | Confirmed (it failed closed) | The walk bounds its own depth at 64 |
| I | Tags inside comments counted by the pre-scan | Fails closed; kept | |
| I | `.rss`, `.atom`, `.mml` | Not measured on Cloudflare; the build makes its own feeds, and `public/` has none | BACKLOG if a writer lane ever lands files outside posts, heroes and diagrams |

### Re-check 2's report, verbatim

# Second re-check (Opus, Strong tier): fixes in 3f642d3

**Target:** `d7dd25f` · **Base:** `246551b` · **Date:** 2026-09-28
**Mode:** review only. Nothing in the repository was modified. The target's `scripts/`, `.github/`, `package.json` and pinned covers were extracted read-only with `git archive d7dd25f`, into `opus-probes/new/`, with `node_modules` symlinked. The cold read is `COLD-READ-opus-2.md`, written before any probe.

**Method:** as in the first report. Each payload goes through `checkSvg` at the target. The shipped rewrite is opened as a document in Chromium (`chromium_headless_shell-1243`) and Firefox (`firefox-1538`) with `reducedMotion: 'reduce'`. `matchMedia('(prefers-reduced-motion: reduce)')` was true in every run. "running" is the count of running animations. The same limit applies as before: emulation does not reach `<img>` mode.

**Test suite at the target** (`node --test scripts/check-diagrams.test.mjs` in the extracted tree): **tests 22, pass 22, fail 0.**

---

## 1. First-report reproductions against d7dd25f (`opus-probes/probe3.mjs`)

| Finding | Payload | Result at d7dd25f | Status |
|---|---|---|---|
| B1 | `ur<!---->l(https://…)`, `x:/<!---->*`, `x:/<g/>*`, `.<!---->a`, `ima<!---->ge(` | all refused: "`<style>` may hold only CSS text, no comments or elements" | **Resolved** |
| B2 | `-webkit-animation` in `<style>`; in `style="…"`; `-webkit-transition` | all refused: "not a property name" | **Resolved** |
| B3 | `<style type="text/plain">` holding the stop | refused | **Resolved as reproduced; bypassed by C2** |
| B4 | `(prefers-reduced-motion: re duce)` | refused (no valid stop) | **Resolved as reproduced; bypassed by C1** |
| B5 | parse5 floods | `</svg>`+39k `<div>`: refused by the pre-scan; unmatched `</q>`×3930 at depth 60: 19 ms; break-out `<div/>`×2000+`</q>`×1990: 34 ms; `<b id=i>`×3990, table nesting: refused in ≈0 ms | **Resolved.** No input under the 4,000-tag cap took more than about 115 ms (`<div/>`×3990 after a break-out) |
| I1 (crash) | deep nesting | still reachable: C3 | Informational |
| I2 (`.xml` SVG) | `covers/doc.xml` in `public/` | flagged in source mode | **Resolved** |
| I3 | `@media (prefers-reduced-motion)` | now accepted; both engines running 0 | **Resolved** |
| Controls | the POST.md example; the bare-query form | PASS; running 0 in both engines | as expected |

---

## BLOCKING

### C1. BLOCKING: JavaScript whitespace is not CSS whitespace, so the checker and the browser read a different stop

**Where:**
- `scripts/check-diagrams.mjs:118` and `:120`: `\s` in `REDUCED_MOTION_PRELUDE` and `MOTION_OK_PRELUDE`.
- `:278`: `prelude.trim()`.
- `:241`: `selector.trim().replace(/\s+/g, ' ')`.
- `:181` and `:183`: `.trim()` on the property name and the value.
- `:222`: `skipSpace` uses `/\s/`.

JavaScript's `\s` and `String.prototype.trim` treat U+00A0, U+1680, U+2000–200A, U+2028/9, U+202F, U+205F, U+3000 and U+FEFF as whitespace. CSS whitespace is only space, tab, LF, CR and FF (CSS Syntax 3, §4.2). Every other one of those code points is an ordinary identifier character in CSS.

So the checker strips or collapses characters that the browser treats as part of the token:
- the media query stops matching;
- the stop's selector stops matching the animated element;
- the stop's property name becomes invalid.

`verifyRewrite` cannot see this, because both of its passes use the same JavaScript whitespace. `DANGEROUS_VALUE` and `NOT_XML_CHAR` do not refuse these characters.

**Reproduction** (`probe3.mjs`, `probe4.mjs`). Every case uses `.a{animation:spin 1s infinite}@keyframes spin{…}`, followed by a stop that **passes `checkSvg`**:

| Case | Stop as written | Chromium | Firefox |
|---|---|---|---|
| NBSP in the query value | `@media (prefers-reduced-motion:\u00a0reduce){.a{animation:none}}` | running 1 | running 1 |
| NBSP before the query | `@media \u00a0(prefers-reduced-motion: reduce){…}` | running 1 | running 1 |
| U+3000 in the query | `(prefers-reduced-motion:\u3000reduce)` | running 1 | running 1 |
| NBSP after the stop selector | `.a\u00a0{animation:none}` (checker: `.a`; browser: class `a\u00a0`) | running 1 | running 1 |
| NBSP after `*` in the universal stop | `*\u00a0{animation:none !important}`. The checker sets `universal = true` and waives **every** animation in the file | running 1 | running 1 |
| U+FEFF before the selector | `\ufeff.a{animation:none}` | running 1 | running 1 |
| NBSP inside a compound selector | `svg .a` animated, stop `svg\u00a0.a` | running 1 | running 1 |
| NBSP after the property | `.a{animation\u00a0:none}` (the browser drops the declaration) | running 1 | not run |
| *(refuted)* NBSP after `none` | `animation:none\u00a0` | running 0: the browser reads an unknown keyframes name, so nothing plays | |

**Impact:** motion is forced on a reader who asked for reduced motion. No other layer covers that. This is the same class as B4, reached through a different character set.

**Fix:**
1. Define CSS whitespace once, as `const CSS_WS = '[ \\t\\n\\r\\f]'`, and use it in both prelude regexes, `skipSpace`, the selector normalization and the declaration trimming. Never use `\s` or `.trim()` in CSS code.
2. Refuse, anywhere in CSS text, any character outside printable ASCII plus the CSS whitespace set, **except** inside quoted strings (so `content`/`font-family` strings stay possible). One linear regex does it: `/[^\x20-\x7e\t\n\r\f]/` applied outside quotes.
3. Point 2 alone closes the whole class, including characters not listed here. Add one test per row above.

### C2. BLOCKING: `<style type>` is compared after trimming; browsers do not trim

**Where:** `:341` (`value.trim().toLowerCase() === 'text/css'`).

**Reproduction** (`probe3.mjs`, case `B3_style_type_css_ws`): `<style type=" text/css ">` holding the stop passes the check. Both Chromium and Firefox ignore that sheet: **running 1** in both. `type="text/css\u00a0"` also passes the check (`opus-probes`, one-liner). It fails in the browser the same way, since browsers do not trim.

**Fix:** compare without trimming, ASCII case-insensitively: `value.toLowerCase() === 'text/css'`. Better still, refuse every attribute on `<style>`; `text/css` is the default anyway. Test with surrounding spaces.

---

## INFORMATIONAL

### C3. The pre-scan's self-closing test disagrees with parse5; the crash is still reachable, and fails closed

**Where:** `:495` (`rest.endsWith('/')`) and `:405`/`:446` (the recursive `visit`).

In HTML tokenization, `/` at the end of an **unquoted** attribute value is part of the value. So `<g fill=a/>` opens a `g` for parse5, while the pre-scan counts it as self-closing and never adds to the depth.

**Reproduction** (`probe4.mjs` and a one-liner):

| Input | Result |
|---|---|
| `<g fill=a/>`×60 | PASS, and nests 60 deep, correctly under the limit |
| `<g fill=a/>`×500–3,900 | refused by `verifyRewrite`, whose rewrite quotes the value, so the second scan sees the depth |
| `<g fill=a/>`×3,999 (44 kB) | **`RangeError: Maximum call stack size exceeded`** in the first pass's `visit` |

`verifyRewrite` catches the depth disagreement, but only after a full parse and walk, and the walk crashes near 4,000 levels. It fails closed, so this is not a bypass, but the crash is an uncaught stack trace that names no file. `<g aria-label="/>">` is refused for its value.

**Fix:** in the scan, treat a tag as self-closing only when the character before `>` is `/` **and** that `/` is not the end of an unquoted attribute value. It is simpler to make `visit` iterative, or to enforce `MAX_DEPTH` inside `visit` and stop descending.

### C4. The pre-scan counts tags inside comments and text

**Where:** `:490-499`.

A comment that holds 70 `<g>` is refused as "nested more than 64 deep" (`probe4.mjs`, `comment containing tags`). Text such as `a < b` and `I <3 it` passes. This fails closed and is rare in real diagrams, so no change is needed. It is worth one line in POST.md if a writer ever hits it.

### C5. Other script-capable XML names in `public/` (refuted under `file://`)

`.rss`, `.atom` and `.mml` holding an XHTML-namespaced `<script>` did not run in either engine over `file://`: one engine offered a download, the other an empty document. How Cloudflare serves them, with which `Content-Type`, was not measured. They are outside the writer path, so this is recorded only.

---

## Question 2: the new code, other attacks refuted

- **The pre-scan against parse5 on `<` inside attribute values or text, tags split by `<`, and CDATA-like text.** `<` in a value or text only adds to the scan's counts, which fails closed. `<g<g>` counts two tags where parse5 sees one. CDATA and DOCTYPE are refused earlier. The scan's regex is linear, and each tag stops at the next `<` or `>`. The only disagreement that lowers the count is C3.
- **`verifyRewrite`.** It does not recurse (the second pass has `verifyRewrite: false`), and it caught the C3 depth disagreement. It cannot catch disagreements where both passes are wrong the same way (C1). The size exemption on the rewrite is bounded by the input: a rewrite is at most a constant factor larger (closing tags and `&quot;`-style escapes), and the second pass's own pre-scan still caps tags and depth. No abuse found.
- **The `<style>` text-only rule with text in several nodes.** parse5 merges adjacent text, and the only ways to split it (a comment or an element) are now refused. Character references in `<style>` are decoded before `cssProblem` sees them: `&#x75;rl(` is checked as `url(` and ships as `url(`, the same. `&amp;`/`&lt;` decode to characters that `DANGEROUS_VALUE` refuses.
- **The property-name rule.** Every prefix is refused. Uppercase is lowercased before the test, which matches CSS, where property names are ASCII case-insensitive. `--custom` is refused. The one gap is C1's trailing NBSP.
- **`mediaKind`.** The exact-token regexes fix B4 for ASCII spaces. Extra conditions (`and`, `not`, a comma) fall to `other`, which fails closed. The gap is C1.
- **`strayProblems` `source` flag.** `main()` passes `'public'` in source mode, and `check:posts` runs it in both deploy workflows (`deploy-pages.yml:144`, `deploy-github-pages.yml:38`). The build runs it on `dist` with SVG names only, which is right: the build makes its own HTML and XML. `.XML`, `.xhtml`, `.htm`, `.xsl`, case and depth are all flagged.
- **Per-run limits.** They are now counted from `statSync` before any file is read, which fixes my earlier point that refused files were uncapped.

## Question 3: honest diagrams

These all pass:
- the POST.md example and the bare-query form;
- `type="text/css"`;
- `<rect … />` with a space before the slash;
- text with `<` followed by a space or a digit;
- `&amp;` in text;
- a dense 199 kB file with about 2,600 animated rules and their stops: PASS in 104 ms at the target, measured.

Honest files that now fail:
- **CSS comments were already refused**, but an **XML comment inside `<style>`** is now refused too. POST.md says so.
- **Vendor-prefixed properties** (for example `-webkit-font-smoothing`) are refused. POST.md says so.
- **Nesting deeper than 64**, and tags written inside comments (C4).

None of these is a realistic diagram broken without notice.

VERDICT: BLOCKED

## Re-check 3: Opus, of `4b76e32` (base `d7dd25f`)

Verdict BLOCKED: every earlier reproduction resolved (browsers included); one new blocking finding, confirmed and fixed in `8ef160a`.

| # | Finding | Ruling | Fix |
|---|---|---|---|
| D1 | A line break inside a CSS string ends it in CSS, not in the checker, hiding a declaration | **Confirmed, blocking**, reproduced with LF and CR in both quote kinds | Refused once, before both parsers. The reviewer recommended one spec-following tokenizer plus an ADR; I chose the invariant instead (no backslash, no comment, no in-string line break makes "quote to next quote" exactly CSS's string rule) and recorded it in ADR 0016, with the rule that loosening it requires the tokenizer first. |
| I | An unquoted non-ASCII `font-family` fails | Accepted: the message says to quote it | |
| I | The child combinator `>` is refused | Accepted for now; BACKLOG idea | |

### Re-check 3's report, verbatim

# Third re-check (Opus, Strong tier): fixes in 3a3da8e

**Target:** `4b76e32` · **Base:** `d7dd25f` · **Date:** 2026-09-28
**Mode:** review only. Nothing in the repository was modified. The target's `scripts/`, `.github/`, `package.json` and pinned covers were extracted read-only with `git archive 4b76e32` into `opus-probes/new3/`. The cold read is `COLD-READ-opus-3.md`, written before any probe.

**Method:** as before. Each payload goes through `checkSvg` at the target. The shipped rewrite is opened as a document in Chromium (`chromium_headless_shell-1243`) and Firefox (`firefox-1538`) with `reducedMotion: 'reduce'`. `matchMedia` confirmed reduce in every run. The limit is unchanged: emulation does not reach `<img>` mode.

**Test suite at the target:** `node --test scripts/check-diagrams.test.mjs` gives **tests 25, pass 25, fail 0.**

---

## 1. Every earlier reproduction against 4b76e32 (`opus-probes/probe5.mjs`)

| Report | Cases | Result |
|---|---|---|
| Controls | the POST.md example; the bare `(prefers-reduced-motion)` form | PASS; running 0 in both engines |
| Control | no stop | refused |
| 1 · original finding 3 | fill-only stop | refused |
| 1 · B1 | comment or element splits: `url(`, `/*`, selector, `image(` | all refused (`<style>` text only) |
| 1 · B2 | `-webkit-animation` in a sheet and in `style="…"` | refused |
| 1 · B3 | `<style type="text/plain">` | refused |
| 1 · B4 | `re duce` | refused |
| 1 · B5 | parse5 floods | refused by the pre-scan (unchanged since `d7dd25f`); `</q>`×3,900 at depth 60: 28 ms |
| 2 · C1 | NBSP / U+3000 / U+FEFF in a query, selector, universal stop, compound selector or property | all refused: "CSS holds U+… outside a quoted string" |
| 2 · C2 | `type=" text/css "`, `type="text/css "` | refused ("must be exactly text/css") |
| 2 · C3 | `<g fill=a/>`×3,999 | **refused with a finding in 46 ms; no crash.** The walk's own bound holds. `<g fill=a/>`×63 (64 levels with the root) passes, which is correct |

**Every earlier finding is resolved.**

---

## BLOCKING

### D1. BLOCKING: a newline ends a CSS string, but the checker's strings run to the next quote

**Where:** `scripts/check-diagrams.mjs`. There are three quote trackers, and all three share the flaw:
- `:160-172` (`cssCharacterProblem`, the new ASCII rule)
- `:193-216` (`parseDeclarations`)
- `:248-254` (`parseStylesheet.readUntil`)

All three close a string only at the matching quote. CSS Syntax 3, §4.3.5 ("consume a string token") says: *newline: this is a parse error. Reconsume the current input code point, create a `<bad-string-token>`, and return it.* Tokenizing then continues **on the next line as ordinary CSS**. A CSS newline is LF, CR or FF, and the rewrite keeps LF (and CR, which XML turns into LF) inside `<style>` text.

So text after a newline inside an "open string" is live CSS to a browser, and a string to every check that reads the parse:
- the motion proof;
- the property-name rule (vendor prefixes);
- the ASCII rule;
- the `!important` rule;
- the transition rule.

Only the raw regexes still see it: `DANGEROUS_VALUE`, `url(`, `@`-names, CSS comments, and the refused functions.

**Reproduction** (`probe5.mjs`). Each case passes `checkSvg`:

| Case | `<style>` text | Chromium | Firefox |
|---|---|---|---|
| double quote, LF | `@keyframes spin{to{opacity:0}}.a{x:"`⏎`;animation:spin 1s infinite;y:"}` | **running 1** | **running 1** |
| single quote, LF | same with `'` | **running 1** | **running 1** |
| CR | `.a{x:"`␍`;animation:spin 1s infinite;y:"}` | **running 1** | **running 1** |

The checker reads one declaration, `x`, whose value is a string. It sees no animation and asks for no stop. The browser drops `x` (bad string) and applies `animation:spin 1s infinite`. The trailing `y:"}` is a string that runs to the end of the file, which is legal in CSS, and the block closes at the end of the sheet. The animation plays for a reader who asked for reduced motion, and **no stop exists at all**.

The same newline trick carries anything the parse-level checks would refuse: `-webkit-animation`, `transition`, and non-ASCII names. `!important` is the exception: `parseDeclarations` refuses any `!` in a value, strings included. It also re-opens C1: an NBSP placed after the newline is "inside a string" to the ASCII rule.

**Not affected** (refuted in the same probe):
- **the `style` attribute**: XML attribute-value normalization turns LF into a space, so the string never breaks (running 0 in both engines);
- **`url(…)` after the newline**: `urlProblem` ignores quotes, so it is still refused;
- **a newline in an attribute-selector value**: the selector then differs from its stop, which fails closed.

**Fix:** make all three trackers agree with CSS by refusing LF, CR and FF inside a quoted string (`if (quote && /[\n\r\f]/.test(c)) return 'CSS string spans a line'`). A diagram never needs a multi-line string. Doing it once, in `cssCharacterProblem`, is enough, because `cssProblem` runs before either parser sees the text. Test with LF, CR and single quotes.

The deeper remedy is a single tokenizer, following CSS Syntax 3, shared by the character rule and the parse, so the three cannot drift. Given this is the third quote-model disagreement across the reviews, that is worth recording as an ADR-level choice, but refusing newlines closes this one.

---

## 2. The other attacks the coordinator asked for (refuted)

- **Unterminated strings at the end of the sheet.** Refused ("CSS has a string with no closing quote" / "no { … } block"). A browser would accept it, but that only fails closed.
- **A quote inside `url()`.** `url("#a")` passes, correctly, and both engines agree. `urlProblem` is quote-blind by design, which is why a URL after the newline is still refused.
- **An attribute selector's value.** `.a[x="…"]` with a newline gives a selector string different from its stop, which fails closed. Without a newline, the quote model agrees with CSS.
- **Non-ASCII inside strings reaching a name.** Only through D1. Otherwise a string stays a string: `font-family:"Noto Sans"` passes and does nothing harmful (running 0).
- **The exact `type` compare.** `TEXT/CSS` passes and both engines apply it. Spaces and NBSP are refused. `toLowerCase` has no Unicode mapping onto `t`, `e`, `x`, `c` or `s` (unlike the Kelvin sign onto `k`), so no non-ASCII look-alike can pass.
- **The walk's depth bound.** Holds at 3,999 (above). Children past depth 64 are skipped with a finding, so nothing recurses further.
- **Cost of the ASCII scan.** Linear: a 199 kB sheet of 33k rules passes in 183 ms, including the rewrite re-check.

## 3. Honest diagrams

These pass:
- a multi-line sheet with indentation;
- CRLF line ends;
- a quoted CJK `font-family` (`"源ノ角ゴシック"`);
- NBSP in `<text>`;
- `TEXT/CSS`.

These fail and are new at this target:
- **An unquoted non-ASCII `font-family` name** (`font-family:源ノ角ゴシック`) is refused: "CSS holds U+6E90 outside a quoted string". The message says what to do (quote it), and POST.md's CSS rules mention ASCII. This is acceptable.
- The D1 fix would refuse a multi-line string, which no diagram needs.

Not new, but noted for honesty:
- The child combinator `g>rect` is refused by `DANGEROUS_VALUE`, because `>` is on its markup list. That has been true since the first commit. It is a writer surprise, not a risk, and `g rect` works.

VERDICT: BLOCKED
