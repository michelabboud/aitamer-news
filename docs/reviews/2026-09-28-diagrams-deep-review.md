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
| Status | Re-check 1 (Opus) BLOCKED on `246551b`, fixed in `3f642d3`; re-check 2 (Opus) BLOCKED on `d7dd25f`, fixed in `3a3da8e`; re-check 3 (Opus) BLOCKED on `4b76e32`, fixed in `8ef160a`; re-check 4 (Opus) BLOCKED on `52ebdd3`, fixed in `d27d965`; re-check 5 (Opus) BLOCKED on `7a39184`, fixed in `86d92fb`; Ari's re-check BLOCKED on `d7dd25f`, new findings fixed in `8aa6f04`; re-check 6 owed before merge |

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

## Re-check 4: Opus, of `52ebdd3` (base `4b76e32`)

Verdict BLOCKED: every earlier reproduction resolved; the string invariant held within one sheet under every attack tried (unquoted url with a quote, CDO/CDC, attribute-selector quotes, EOF in a string, NUL). One new blocking finding, confirmed and fixed in `d27d965`.

| # | Finding | Ruling | Fix |
|---|---|---|---|
| E1 | Several `<style>` elements are separate sheets to a browser and one joined text to the parse, so a string or block can span the join | **Confirmed, blocking**, both payloads reproduced | At most one `<style>` per diagram (the reviewer's simpler alternative); ADR 0016's string rule now says "within one stylesheet" |

### Re-check 4's report, verbatim

# Fourth re-check (Opus, Strong tier): fix in 8ef160a

**Target:** `52ebdd3` · **Base:** `4b76e32` · **Date:** 2026-09-28
**Mode:** review only. Nothing in the repository was modified. The target's `scripts/`, `.github/`, `package.json` and pinned covers were extracted read-only with `git archive 52ebdd3` into `opus-probes/new4/`. The cold read is `COLD-READ-opus-4.md`, written before any probe.

**Method:** as before. Each payload goes through `checkSvg` at the target. The shipped rewrite is opened as a document in Chromium (`chromium_headless_shell-1243`) and Firefox (`firefox-1538`) with `reducedMotion: 'reduce'`, and the running animations are counted. `matchMedia` confirmed reduce in every run. The `<img>` emulation limit is unchanged.

**Test suite at the target:** `node --test scripts/check-diagrams.test.mjs` gives **tests 26, pass 26, fail 0.**

---

## 1. Reports 1–3 against 52ebdd3 (`opus-probes/probe6.mjs`)

**Controls**, in both engines:
- the POST.md example: PASS, running 0;
- the bare `(prefers-reduced-motion)` form: PASS, running 0;
- an honest two-sheet file (animation in one `<style>`, stop in the next): PASS, running 0;
- `TEXT/CSS`: PASS, running 0.

| Report | Cases | Result |
|---|---|---|
| 1 | original finding 3 (fill-only stop); B1 comment and element splits (×5); B2 `-webkit-` in a sheet and in an attribute; B3 `type="text/plain"`; B4 `re duce` | all refused |
| 2 | C1 NBSP / U+3000 / U+FEFF (×8); C2 `type` with spaces or NBSP | all refused |
| 2 | C3 walk depth, `<g fill=a/>`×3,999 | refused with a finding, no crash (re-run in report 3; the code is unchanged) |
| 3 | D1 LF, single-quote and CR variants; a line break in a `style` attribute and in an attribute selector | all refused: "line break inside a quoted string" |

**All earlier reproductions are resolved.**

---

## BLOCKING

### E1. BLOCKING: every `<style>` is its own stylesheet to a browser, but the checker parses them joined into one

**Where:** `scripts/check-diagrams.mjs`:
- `:479-481`: each `<style>` is checked on its own by `cssProblem` / `cssCharacterProblem` and pushed to `sheets`;
- `:497`: `parseStylesheet(sheets.join('\n'))`.

The ADR's invariant ("a CSS string is exactly quote to the next same quote") is checked **per sheet**. The parse the motion proof reads spans **the join**. In a browser, each `<style>` element is a separate stylesheet (CSSOM: one `CSSStyleSheet` per element), and EOF closes whatever is open in it: a string, a declaration block, an `@media` block. The next sheet then starts fresh at the top level.

A sheet that ends with something still open is legal to the checker's per-sheet checks:
- the newline refusal never sees the join;
- an open quote at a sheet's end is not refused by `cssCharacterProblem`;
- the parse only ever sees the joined text, where the next sheet closes it.

`verifyRewrite` cannot see this, because the rewrite keeps the same `<style>` boundaries and the re-check joins them the same way.

**Reproduction** (`probe6.mjs`). Both cases pass `checkSvg`:

| Case | Sheets as written | What the checker parses | What a browser applies | Chromium | Firefox |
|---|---|---|---|---|---|
| **A string across the join** | `<style>@keyframes spin{…}.a{x:"</style><style>;}.x{}.a{animation:spin 1s infinite}.z{y:"}</style>` | one rule `.a` with a single declaration `x`, whose string runs across the join through `.z{y:"`. No animation, so no stop is required | sheet 1: `.a{x:"…EOF` (the string ends at EOF). Sheet 2: `;}.x{}` is one invalid rule and is dropped; **`.a{animation:spin 1s infinite}` is live**; `.z{y:"…EOF` | **running 1** | **running 1** |
| **A block across the join** | `<style>.a{animation:spin 1s infinite}@keyframes spin{…}.z{</style><style>}@media (prefers-reduced-motion: reduce){.a{animation:none}}</style>` | `.z{` is closed by the leading `}` of sheet 2, so the stop is valid | sheet 1: `.z{` is auto-closed at EOF. Sheet 2: the leading `}` starts a qualified-rule prelude, `}@media (…)`, whose `{…}` block becomes that invalid rule's body. **The stop is dropped** | **running 1** | **running 1** |
| *(refuted)* an `@media` block across the join | `…@media (…reduce){</style><style>.a{animation:none}}` | a valid stop inside reduce | the stop lands at the **top level** of sheet 2 and applies to every reader | running 0 | running 0 |

**Impact:** motion is forced on a reader who asked for reduced motion, and the first case needs no stop at all. This is the same class as B1 and D1: the checker's view of the sheet differs from a browser's.

**Fix** (either one closes it; the first is smaller):
1. **Parse each `<style>` on its own.** Call `parseStylesheet(styleText)` per element, require it to succeed (so every sheet must end at the top level with no string or block open), and concatenate the rule lists with a running `index`, so source order across sheets is kept for the motion proof. Make `cssCharacterProblem` also refuse a quote still open at the end of its text.
2. **Allow one `<style>` per diagram**, which is all an honest diagram needs.

Add both reproductions as tests. The ADR's string invariant should say "per stylesheet, and each `<style>` is a whole stylesheet".

---

## 2. Attacks on the invariant inside one sheet (all refuted)

| Probe | Result | Why it holds |
|---|---|---|
| Unquoted `url(` holding a quote: `url(#a"b)` | refused | `urlProblem` reads to the first `)`, ignoring quotes, and `FRAGMENT` admits no quote. A browser's bad-url token never reaches a shipped file |
| `url("#a)")` | refused | same reason; it fails closed |
| CDO/CDC `<!-- … -->` in a sheet | refused (parse5 makes a comment node; `<` and `>` are also in `DANGEROUS_VALUE`) | |
| A quote inside an attribute selector, `.a[x="}"]` with the matching stop | PASS; running 0 in both engines | a quoted `}` is a string to both readers, and it agrees |
| An unquoted value holding a quote, `[x=a"b"]` | PASS; harmless (running 0) | a quote starts a string token in CSS too |
| EOF inside a string within one sheet | refused ("does not close") | fails closed; a browser would accept it |
| NUL inside a string | PASS; running 0 | parse5 turns NUL into U+FFFD before the check, so the checker, the rewrite and the browser all see U+FFFD |
| U+FFFD inside a string | PASS, harmless | |
| `animation:NONE` as the stop | PASS; running 0 | case-insensitive in both the checker and the browser |
| `)` inside a string before an animation, `.a{x:")";animation:…}` with a stop | PASS; running 0 | `parseDeclarations` tracks quotes before parentheses, the same as CSS |
| Escapes and comments | refused anywhere, strings included, by the raw regexes | fails closed |

So **within one stylesheet** the invariant holds against every token class I tried: strings, url tokens, CDO/CDC, escapes, comments, NUL and EOF. E1 is the invariant's scope, not its content.

## 3. Honest diagrams

These pass, as before:
- a multi-line sheet;
- CRLF line ends;
- a quoted CJK font family;
- two sheets, each complete;
- `TEXT/CSS`.

These fail and are new at this target:
- **a multi-line string**, e.g. a `content` or `font-family` string broken across lines. The message says to keep strings on one line. No diagram needs one.

After fix 1 for E1, a diagram whose rule is split across two `<style>` elements would fail too. No honest tool writes that.

VERDICT: BLOCKED

## Re-check 5: Opus, of `7a39184` (base `52ebdd3`)

Verdict BLOCKED: every earlier reproduction resolved; other routes for CSS (a `<style>` inside a group or `<text>`, `style` attributes, presentation attributes) hold. One new blocking finding, confirmed and fixed in `86d92fb`. The reviewer: "With that fix, I know of no remaining way for the checker's reading to differ from a browser's."

| # | Finding | Ruling | Fix |
|---|---|---|---|
| F1 | An unclosed `(` or `[` swallows the rest of the sheet in a browser, the stop included; the parse kept going | **Confirmed, blocking**, all six fragments reproduced | Brackets balance and nest; `{`, `}`, `;` refused inside an open `(` or `[`; ADR 0016's invariant is now "strings and blocks" |

### Re-check 5's report, verbatim

# Fifth re-check (Opus, Strong tier): fix in d27d965

**Target:** `7a39184` · **Base:** `52ebdd3` · **Date:** 2026-09-28
**Mode:** review only. Nothing in the repository was modified. The target's `scripts/`, `.github/`, `package.json` and pinned covers were extracted read-only with `git archive 7a39184` into `opus-probes/new5/`. The cold read is `COLD-READ-opus-5.md`, written before any probe.

**Method:** as before. Each payload goes through `checkSvg` at the target. The shipped rewrite is opened as a document in Chromium (`chromium_headless_shell-1243`) and Firefox (`firefox-1538`) with `reducedMotion: 'reduce'`, and the running animations are counted. `matchMedia` confirmed reduce in every run. The `<img>` emulation limit is unchanged.

**Test suite at the target:** `node --test scripts/check-diagrams.test.mjs` gives **tests 27, pass 27, fail 0.**

---

## 1. Reports 1–4 against 7a39184 (`opus-probes/probe7.mjs`)

| Report | Cases | Result |
|---|---|---|
| Controls | the POST.md example; the bare-query form; `TEXT/CSS`; a quoted non-ASCII font name | PASS; running 0 in both engines |
| 1 | original finding 3; B1 (×5); B2 (×2); B3; B4 | all refused |
| 2 | C1 (×8); C2 (×2) | all refused |
| 3 | D1: LF, single quote and CR variants; a line break in a `style` attribute and in an attribute selector | all refused |
| 4 | E1: a string across sheets; a block across sheets; `@media` across sheets | all refused: "2 `<style>` elements; a diagram has at most one" |
| 4 | the report-4 token probes: `url(#a"b)`, `url("#a)")`, CDO/CDC, EOF in a string | refused |
| 4 | the report-4 token probes: attribute-selector quotes, NUL, U+FFFD, `NONE` | pass and harmless (running 0) |

**All earlier reproductions are resolved.**

---

## BLOCKING

### F1. BLOCKING: `[` and `(` are blocks in CSS, and the checker's readers do not nest them, so an open bracket swallows the stop for a browser only

**Where:** `scripts/check-diagrams.mjs`:
- `:255-263`: `parseStylesheet.readUntil` tracks quotes only. It is used for the selector, the `@media` prelude and the rule body.
- `:200-225`: `parseDeclarations` tracks quotes and `()`, but not `[]`.
- `:166`: `cssCharacterProblem` tracks quotes only.

In CSS Syntax 3, `(`, `[` and `{` each open a simple block that consumes every token, including `}`, `{` and `;`, up to **its own** closing token, and EOF closes it. The checker ends a selector, a prelude or a rule body at the first `{`, `}` or `;`, whatever is open. So one unbalanced `[` (or a `(` outside a declaration value) makes a browser read the rest of the sheet as the inside of a block, while the checker keeps parsing rules, **including the reduced-motion stop**. `verifyRewrite` does not see it: the rewrite keeps the text as it is (for the first row, the shipped `<style>` is `….z{x:[}@media (prefers-reduced-motion: reduce){.a{animation:none}}`).

**Reproduction** (`probe7.mjs`). Every row is `.a{animation:spin 1s infinite}@keyframes spin{to{opacity:0}}`, then the fragment, then `@media (prefers-reduced-motion: reduce){.a{animation:none}}`. **All pass `checkSvg`**:

| Fragment before the stop | Where the bracket sits | Chromium | Firefox |
|---|---|---|---|
| `.z{x:[}` | a declaration value | **running 1** | **running 1** |
| `.z[{x:y}` | a selector | **running 1** | **running 1** |
| `.z({x:y}` | a selector | **running 1** | **running 1** |
| `@media (x{}` | a media prelude | **running 1** | **running 1** |
| `@media [x{}` | a media prelude | **running 1** | **running 1** |
| `@keyframes spin{to{opacity:[}}` (in place of the keyframes) | a keyframe value | **running 1** | **running 1** |

Refuted in the same family:
- `.a{x:(]}`: refused, because `parseDeclarations` counts `(`.
- `style="x:[;animation:…]"`: the checker splits where a browser merges, so it sees the animation and refuses the attribute, which fails closed.

**Impact:** motion is forced on a reader who asked for reduced motion. This is the same class as B1, D1 and E1: the checker's structure differs from a browser's.

**Fix:** make bracket structure part of the invariant, in the one function that runs before both parsers.
1. In `cssCharacterProblem`, outside quotes, keep a stack of `(` `[` `{`.
2. Refuse a closer that does not match the top of the stack, and refuse anything left open at the end.
3. Refuse `{`, `}` and `;` while a `(` or `[` is open.

With (1)–(3), every `{`, `}` and `;` the readers stop at is also a structural token for a browser, so "stop at the first `{}`;`" becomes exact, just as refusing line breaks made "quote to the next quote" exact. None of this is needed by honest CSS: `rect[class~="a"]`, `:not(.b)`, `calc(1px + 2px)` and `rgb(1 2 3)` all pass today and would still pass. Add the six rows as tests, and extend the ADR's invariant to say "strings **and blocks**".

Structurally, this is the fourth time a reader of CSS in the checker has disagreed with a CSS tokenizer (quotes, line breaks, sheets, blocks). With (1)–(3) I know of no remaining token-level gap, because strings, comments, escapes, url tokens and blocks are then all pinned. But the coordinator's ADR condition ("a change that loosens a refusal must first bring in a tokenizer that follows the specification") should now name brackets too.

---

## 2. Other routes by which CSS reaches a browser (refuted)

| Route | Probe | Result |
|---|---|---|
| `<style>` inside `<g>` | the honest sheet with its stop | PASS; running 0. It is counted by the one-`<style>` rule, and browsers apply it the same as at the root |
| `<style>` inside `<text>` | same | PASS; running 0 |
| A second `<style>` anywhere | the report-4 payloads | refused |
| `style` attribute against the sheet | `style="fill:red!important"` on the animated element, with the sheet's stop | PASS; running 0. `!important` in an attribute cannot start motion, and `animation*`/`transition*` there are refused, prefixed forms included |
| `style` attribute with brackets | `x:[;animation:…]` | refused (fails closed) |
| Presentation attributes | — | none can start or re-enable animation (SVG 2's presentation attributes have no `animation*`/`transition*`); their values pass `urlProblem` and `DANGEROUS_VALUE`. The CSS parse is not involved |
| Line breaks in attributes | — | XML attribute normalization turns them into spaces, and D1's refusal covers the `style` attribute anyway |

## 3. Honest diagrams

These pass:
- attribute selectors with quotes;
- `:not()`;
- `calc()`;
- `rgb()`;
- a quoted non-ASCII font name;
- `<style>` inside a group;
- `TEXT/CSS`.

These fail and are new at this target:
- **two `<style>` elements**, even when each is complete (`x_honest_two_sheets` is refused). POST.md says "at most one", so this is intended.

The fix proposed for F1 refuses only unbalanced brackets and `{`/`}`/`;` inside `()`/`[]`, which honest CSS does not write.

VERDICT: BLOCKED

## Re-check by Ari, of `d7dd25f` (base `72d4e94`)

| | |
|---|---|
| Reviewer | Ari, hexe `ari-sol-deep`: `gpt-6-sol` at `xhigh`, separate process, detached worktree of `d7dd25f`. Receipt: success, 6,268,415 tokens in, 46,310 out, 18 min. |
| Isolation | Told to read the record only up to "Re-check 1" before its cold-read note. The note lists "CSS cascade across separate style elements" among its first targets, so B1 is independent corroboration of Opus's E1. Its B3 matches Opus's C1 on the same commit (both reviewers ran in parallel). |
| Target note | Ran on `d7dd25f`, three fix commits behind the tip when it returned; every finding was re-checked against the tip (`86d92fb`) before ruling. |
| Verdict | BLOCKED: five blocking, three informational |

| # | Finding | Ruling at the tip | Fix |
|---|---|---|---|
| B1 | A stop assembled across separate stylesheets | Same as Opus E1; already fixed | `d27d965` |
| B2 | Selector whitespace normalization rewrites quoted values | **Confirmed at the tip, blocking** | `8aa6f04`: normalize only outside strings |
| B3 | JavaScript `\s` admits non-CSS whitespace | Same as Opus C1; already fixed | `3a3da8e` |
| B4 | `--write` leaves unchecked documents in the build | **Confirmed**: not reachable through the deploy workflows (both run `check:posts` first, and the diagrams build check), but the build output alone was not safe | `8aa6f04`: `--write` runs the source check and verifies `dist/diagrams` |
| B5 | A symlink in `diagrams/` bypasses the size budget (`/dev/zero`) | **Confirmed at the tip, blocking** | `8aa6f04`: links and devices refused, never followed; size checked before reading |
| I1 | The pre-scan counts tags inside comments | Accepted: it fails closed, and 4,000 tags in a comment is not an honest diagram | |
| I2 | Some valid no-motion CSS refused | Accepted: fails closed | |
| I3 | Rendering cost unbounded | Already in BACKLOG (browser profiling) | |

### Ari's report, verbatim

# Focused security re-check — SVG diagrams

**Target:** `d7dd25fa04891ff17b67e2ec5c66a82b64ce90dc`  
**Base:** `72d4e9445c2afedf44cd1e6cc0d414db9fea3c4e`  
**Mode:** review only; no repository file, package, commit, or deployment was changed. The pre-probe note is `../COLD-READ.md`.

I read the prior review only through the line before **“Re-check 1”** before writing the cold-read note. I reached findings **B1, B2, and B3 below before reading the later re-check**. B4, B5, and the informational findings were established afterwards. In particular, the earlier re-check had *refuted* selector normalization as a bypass; B2 supplies a counterexample involving whitespace inside a quoted selector string.

## 1. Status of the original seven findings

I ran the original payloads against the `7d349f1` script loaded from its Git object into an isolated in-memory module, then against the checked-out target. Results below distinguish the exact reproduction from the broader safeguard.

| # | Finding | `7d349f1` result | Status at `d7dd25f` |
|---|---|---|---|
| 1 | SVG in another `public/` folder | `strayProblems` refused `covers/payload.svg`. | The named `.svg`/`.svgz` path is closed. Case variants, symlinks **outside the root `diagrams/` folder**, and a `diagrams` directory at another depth are also refused. See B4 and B5 for remaining path gaps. |
| 2 | GitHub Pages lacks the diagram headers | Refusal is after build and before artifact upload. | Closed for this workflow; see section 4. |
| 3 | Reduced-motion decoy | Fill-only media rule and a marker inside a string were refused. | The exact decoys are closed; the guarantee is still bypassed by B1–B3. |
| 4 | Quadratic incomplete `url(` | 16,000 `url(` tokens, 64,079 bytes: refused in **11.37 ms** in the isolated `7d349f1` run. | That path is closed. The subsequent fix added the markup pre-scan; a 195 kB stray-tag probe took **1.04 ms** here. The first re-check records a separate parse5 quadratic case still present in `7d349f1`, fixed by `3f642d3`. B5 is a different unbounded build-time path. |
| 5 | Malformed XML rewrite | Duplicate `href`/`xlink:href` and U+0001 reference were refused. | Closed for those payloads; U+FFFE/U+FFFF are covered by the target tests. |
| 6 | `src()`/`image()` and rendering cost | Both URL-bearing functions were refused. | Function probes closed. Extreme filter geometry and a self-referencing pattern still pass; no browser slowdown was measured, so that part remains informational. |
| 7 | “All entities” documentation | ADR and SECURITY now say **entity declarations**; `&amp;` in a title passed. | Closed. |

## 2. Findings in the current target

### B1 — BLOCKING: a reduced-motion stop can be assembled across separate stylesheets

**Target:** `scripts/check-diagrams.mjs:402-403,448-463`.

`sheets.join('\n')` treats multiple `<style>` elements as one stylesheet. SVG gives each element its own stylesheet; malformed syntax at the end of one cannot be completed by the next ([SVG 2 styling](https://svgwg.org/svg2-draft/styling.html), [CSS Syntax](https://drafts.csswg.org/css-syntax/)). This complete diagram passed `checkSvg` with `output !== null` and no findings:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1">
  <style>.a{animation:spin 1s infinite}@keyframes spin{to{opacity:0}}</style>
  <style>@media (prefers-reduced-motion:</style>
  <style> reduce){.a{animation:none}}</style>
  <rect class="a"/>
</svg>
```

The checker sees one valid `@media (prefers-reduced-motion: reduce)` stop. The CSS in the second and third elements is invalid when parsed separately; Lightning CSS rejected each piece (`Unexpected token Colon`, `Unexpected token CloseParenthesis`). The shipped rewrite retains the separate `<style>` elements, and the rewrite re-check still passes because it joins them again. Under the separate-stylesheet parsing rule, the first animation remains active for a reduced-motion reader. A live browser run was unavailable in this lane, so this last step is a standards-based conclusion, not a measured browser trace.

**Fix:** Parse and validate each `<style>` independently. Preserve an ordered list of rules across sheets for the cascade, and reject incomplete or invalid individual sheets before evaluating motion.

### B2 — BLOCKING: selector whitespace normalization invents a matching stop

**Target:** `scripts/check-diagrams.mjs:241,321-332`.

`replace(/\s+/g, ' ')` rewrites spaces **inside a quoted attribute value**. The two rules below become the same string to `lastStop`, but `[class="a  b"]` and `[class="a b"]` are different exact-value selectors by [Selectors Level 4](https://drafts.csswg.org/selectors/#attribute-representation). This diagram passed `checkSvg` and its rewrite check:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1">
  <style>.a[class="a  b"]{animation:spin 1s infinite}
  @keyframes spin{to{opacity:0}}
  @media (prefers-reduced-motion: reduce){.a[class="a b"]{animation:none}}</style>
  <rect class="a  b"/>
</svg>
```

The rect matches the animation rule and not the stop. Lightning CSS preserved the two distinct selector values. The same normalization risks misreading strings within `:is()` and `:where()` arguments. The proof's same-selector premise therefore does not hold.

**Fix:** Compare selectors without rewriting their tokens, or use a CSS selector parser to canonicalize only syntax that is genuinely equivalent. A conservative raw-string comparison may reject some honest formatting but closes this bypass.

### B3 — BLOCKING: JavaScript `\s` admits non-CSS whitespace in the motion proof

**Target:** `scripts/check-diagrams.mjs:118-120,184-186,289,321-332`.

CSS whitespace is a restricted set of ASCII characters; U+00A0 NO-BREAK SPACE is an identifier character, not CSS whitespace ([CSS Syntax](https://drafts.csswg.org/css-syntax/#typedef-whitespace-token)). `prefers-reduced-motion` accepts the value `reduce`, not an identifier beginning with U+00A0 ([Media Queries Level 5](https://drafts.csswg.org/mediaqueries-5/#prefers-reduced-motion)). JavaScript `\s` matches U+00A0. With `const NBSP = '\u00a0'`, the checker accepted both of these complete stylesheet forms when wrapped in the normal `<svg><style>…</style><rect class="a"/></svg>`:

```js
`.a{animation:spin 1s infinite}@keyframes spin{to{opacity:0}}
 @media (prefers-reduced-motion:${NBSP}reduce){.a{animation:none}}`

`@media (prefers-reduced-motion: reduce){*{animation:none !${NBSP}important}}
 .a{animation:spin 1s infinite}@keyframes spin{to{opacity:0}}`
```

In the first case, the checker calls the invalid media query `reduce` and counts its stop. In the second, `parseDeclarations` calls `none !<NBSP>important` important and `motionProblem` accepts a universal stop; Lightning CSS rejected that declaration with `Unexpected token Delim('!')`. Both accepted SVGs retain the non-CSS whitespace in their rewrite. The stop is ineffective under CSS parsing, so the normal animation applies to a reduced-motion reader. Browser execution of these precise files was unavailable.

**Fix:** Use an explicit CSS whitespace class (`[\t\n\f\r ]`) in media-prelude and `!important` parsing, and tokenize CSS according to its grammar. Test U+00A0, U+2003, and U+2028 in both positions.

### B4 — BLOCKING for standalone build artifacts: `--write` leaves unchecked documents in `dist`

**Target:** `scripts/check-diagrams.mjs:554-568,608-630`; `package.json:10,21,27`.

`npm run build` calls `--write dist` but does not call the source-mode check in `check:posts`. In build mode, `strayProblems` checks `.svg`/`.svgz` outside `diagrams/` but ignores `.xml`/`.html`, and it skips all of `dist/diagrams`. It also does not remove extra files there. Two temporary-output reproductions, with the real `public/` left untouched:

1. Place `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>` at `TMP/payload.xml`; `node scripts/check-diagrams.mjs --write TMP` and `--check-dist TMP` both exited **0** and left the file. Astro copies `public/` assets unchanged into a build ([Astro configuration reference](https://docs.astro.build/en/reference/configuration-reference/#publicdir)), so a standalone build of a source tree with that file would produce this artifact.
2. Place the same SVG at `TMP/diagrams/post/x.svg`; `--write TMP` exited **0** and left it. `--check-dist TMP` correctly exited **1** (`ships, but no checked source makes it`). An Astro-generated SVG route could therefore leave an unchecked diagram in a standalone build.

The **current Cloudflare and GitHub Pages workflows provide additional gates**: both run `check:posts` before build; Cloudflare then runs `check:diagrams:dist`, and GitHub Pages refuses a nonempty diagram directory. I found no SVG-producing Astro route in this target. Thus this is a real hole in the build artifact and in callers that publish `npm run build` output alone, not a demonstrated bypass of the current official deploy workflow. The source routes found here were `rss.xml.ts` and `news-sitemap.xml.ts`; generated HTML and XML cannot simply be blanket-rejected.

**Fix:** Run the source document guard as part of `npm run build` or `--write`, and make `--write` verify every final `dist/diagrams` entry against checked source before returning success. For generated XML, distinguish known Astro outputs from copied public documents with a manifest or source-to-output inventory; keep the final deploy check as an independent gate.

### B5 — BLOCKING: a diagram symlink bypasses size budgets and can exhaust the build

**Target:** `scripts/check-diagrams.mjs:506-517,558-565,585-597`.

`strayProblems` skips the whole root `diagrams/` folder, including its symlinks. `filesUnder` treats a symlink as a file; `checkAll` calls `statSync` and `readFileSync`, both of which follow it. In a temporary source tree, `diagrams/post/x.svg -> /dev/zero` produced `strayProblems(..., {source:true}) === []`; `statSync` reported **size 0** and a character device. A bounded read of that device returned **1,048,576 bytes without EOF** while its reported size stayed zero. The valid `post/x.svg` name reaches `readFileSync` after the input-budget sum has charged zero bytes. Linux `/dev/zero` yields zero bytes indefinitely ([Linux `null(4)` manual](https://man7.org/linux/man-pages/man4/null.4.html)); a whole-file read waits for end of file or exhausts memory. I did not run that deliberately unbounded read. A symlink to an ordinary external SVG was accepted by `checkAll` in a separate safe probe, confirming that this path is followed.

The 200 kB per-file and 20 MB per-run limits therefore do not protect this path. A Git symlink can carry this entry into the Linux CI checkout, so this is a build-time denial of service even when the SVG content checks are otherwise correct.

**Fix:** Reject symlinks within `public/diagrams` and `dist/diagrams` before following them; require regular files and enforce the byte limit on bytes actually read, not only `statSync().size`. Use a no-follow open plus descriptor checks where supported to close link-swap races.

### I1 — INFORMATIONAL: the new markup pre-scan rejects inert comments

**Target:** `scripts/check-diagrams.mjs:485-500`.

`checkSvg` accepts and removes ordinary comments, but the pre-scan counts tag-shaped text inside them. A 16,077-byte SVG containing only `<!-- ${'<g/>'.repeat(4001)} -->` returned `more than 4000 tags`, though parse5 would produce one SVG element. This is an honest input that passed before the pre-scan and has no rendered cost. **Fix:** tokenize comments (and quoted attributes) as inert while counting markup, or count the parsed elements after a separate cheap limit on raw `<` occurrences.

### I2 — INFORMATIONAL: valid no-motion CSS is refused

**Target:** `scripts/check-diagrams.mjs:241,289-295,329-332`.

The checker refused `@media screen and (prefers-reduced-motion: no-preference){.a{animation:spin 1s}}` even though it cannot animate for a reduced-motion reader. It also refused `animation:none 1s` (a shorthand with no animation name), and a same-selector stop written `.a, .b` after an animation selector `.a,.b`. Equivalent `:is(.a,.b)`/`:is(.a, .b)` selectors are similarly refused. These fail closed; the strict accepted forms are documented, but this affects honest writers. **Fix:** parse supported media-query conjunctions and animation shorthand values, or explicitly document the deliberately narrow grammar; a raw exact selector comparison for B2 would make the formatting constraint clearer.

### I3 — INFORMATIONAL: source-size limits do not bound rendering cost

**Target:** `scripts/check-diagrams.mjs:79-94,377-389`.

The checker accepted a `1×1` viewBox with a filter region of `2e300` and `stdDeviation="1e300"`, and a self-referencing pattern. This is the unmeasured half of original finding 6. I did not demonstrate a slow browser render, so it is not classified as a denial of service. **Fix:** profile these cases in a browser, then set measured geometry/filter/reference budgets.

## 3. Path, parser, and performance probes that did not become blockers

- `strayProblems` refused `Diagrams/X.SVGZ`, `deep/diagrams/x.svg`, a symlink **outside** the root diagram folder, and `covers/payload.svg`; the pinned existing nine site SVGs pass. A regular-file symlink inside `diagrams/` can pass the content check, but B5 shows why following arbitrary targets is unsafe.
- `@media` with extra conditions is **not** mistaken for the exact `reduce` or `no-preference` proof; it is treated as `other` and usually fails closed. Later same-selector re-animation, animation inside an exact reduce block, prefixed animation properties, transitions, and `style` attributes were refused by the target tests. A stop in a `text/plain` style element is refused.
- `src()` and `image()` are refused in CSS. A comment or child element inside `<style>` is refused, closing the previous re-check's token-joining fetch payload. I found no script or external-resource loading payload accepted by `checkSvg` in the current target.
- No new quadratic CSS or markup path was demonstrated below 200 kB. Measurements on this machine: 64 kB incomplete `url(`, **10.14 ms**; 147 kB / 49,000 short CSS rules, **106.90 ms**; 192 kB / 48,000 declarations, **62.71 ms**; 198 kB nested parentheses, **30.91 ms**; 195 kB stray tags, **1.04 ms**. These measurements are samples, not a proof of worst-case linear complexity. Per-run input limits are 20 MB and 2,000 files.

## 4. GitHub Pages refusal

The refusal step is at `.github/workflows/deploy-github-pages.yml:75-86`, after `npm run build` and before artifact upload. Its `find dist/diagrams -mindepth 1 -print -quit` expression allowed an absent/empty directory and refused both a child directory and an SVG in a temporary reproduction. The deploy job consumes only the uploaded artifact. **This step holds for a build containing a diagram.**

## Checks and limits

- `node --test scripts/check-diagrams.test.mjs`: exit **0**, one file-level pass in this runtime.
- `node scripts/check-diagrams.test.mjs`: exit **0**, **22 tests passed, 0 failed**.
- `node scripts/check-diagrams.mjs`: exit **0**, `0 diagram(s), all allowed` for the target source tree.
- Chrome and the installed headless shell could not start under this lane's sandbox (`Failed to create a unique user data directory`, then sandbox-host `Operation not permitted`); the Playwright MCP required approval unavailable to this lane. I did not claim measured browser execution for B1–B3. Their browser effects follow the cited SVG/CSS parsing rules, supported by Lightning CSS parsing of the separate-sheet and invalid-`!important` examples. No live deploy was attempted.
- `git status --short` showed only the pre-existing linked `node_modules` entry as untracked. All probe files and both review documents were outside the repository.

VERDICT: BLOCKED
