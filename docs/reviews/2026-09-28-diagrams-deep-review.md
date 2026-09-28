# Deep review: diagrams (untrusted SVG), 2026-09-28

| | |
|---|---|
| Kind | Deep, at task grain (security risk class) |
| Target / base | `72d4e9445c2afedf44cd1e6cc0d414db9fea3c4e` / `ffe1e2d34bf433212d1411f67a7400044081c92e` |
| Reviewer | Ari, hexe profile `ari-sol-deep`: `gpt-6-sol` at effort `xhigh`, a separate process in a detached worktree of the target |
| Receipt | exit success; 5,349,193 tokens in (5,212,160 cached), 38,340 out; 40 min |
| Isolation | Blind to the implementation discussion; the brief and the commit only. Cold-read note written before probes. Single reviewer, not a dual-blind pair. |
| Verdict | BLOCKED (4 blocking, 2 informational, 1 minor) |
| Fixes | `7d349f1` (all seven findings) |
| Status | Rulings below; the focused re-check of the fix commit is owed before the pull request merges |

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
