# Diagrams are SVG files any writer adds, shown as images, checked by an exact allowlist and rewritten before they ship

## Context

Michel wants posts to carry diagrams and light CSS and SVG animation, produced by the writers themselves, bots and AI writers included, with no person approving each one: "diagrams and svg must be automated, we need to minimize the Human gates, just add a security check" (2026-09-28).

An SVG is a document, not just a picture. Opened on its own at our address, it can run script with this site's authority. Put inline into a page, its `<style>` restyles the whole page. And machine-written text is already refused anything but a small HTML allowlist (ADR 0009), which has no SVG.

Prior art: DOMPurify's SVG profile, the web's standard sanitizer, allows a long element and attribute list, but refuses `script`, `foreignObject`, `use`, `animate`, `set` and a few others. `animate` and `set` can turn a link into `javascript:`.

## Decision

Three layers, all automatic:

1. **A diagram is a file shown as an image.** It lives at `public/diagrams/<post-slug>/<name>.svg`, and a post shows it with a Markdown image. The rendered-body gate admits an image source of exactly that shape (`DIAGRAM_SRC`, held equal to the checker's pattern by a test). A browser runs no script and loads nothing inside an SVG shown through `<img>`, and CSS animation still plays.
2. **An exact allowlist, then a rewrite** (`scripts/check-diagrams.mjs`, run by `check:posts`, the build and the deploy):
   - **Elements**: shapes, text, gradients, markers, clip paths, masks, patterns, `style` and a few blur and shadow filters.
   - **Attributes**: DOMPurify's list, minus anything that can name a resource. `href` is allowed only on gradients and patterns, and only as `#id`. `url()` only as `url(#id)`.
   - **CSS**: plain rules, `@keyframes` and `@media` only, with no comments, escapes, imports or functions that fetch (including `src()` and `image()`, which browsers do not ship yet). It is parsed, in one linear pass, into that grammar; a regular expression over the raw text is not a check.
   - **Animation**: CSS only (no SMIL: `animate` and `set` are the known link-rewriting tricks, and SMIL ignores the reader's reduced-motion setting). A file that animates must *provably* stop for a reader who asked for reduced motion: the animated rule sits inside `@media (prefers-reduced-motion: no-preference)`, or a later rule with the same selector in `@media (prefers-reduced-motion: reduce)` sets `animation: none`, or that block holds `* { animation: none !important }`. `!important` is refused anywhere else, and so are transitions, animation in `style` attributes and vendor-prefixed properties, so nothing can out-rank or side-step the stop. The media query is matched as tokens (`re duce` is not `reduce`). A `<style>` holds only text, its `type` is exactly `text/css` or absent, and CSS outside quoted strings is printable ASCII plus CSS's own whitespace, so the parse and a browser agree on every name, and the sheet checked is the sheet a browser applies. **Strings are the invariant that keeps the parse honest:** with backslashes, comments and line breaks inside strings all refused, a CSS string is exactly "quote to the next same quote", which is how every reader in the checker scans. Three review findings came from that assumption breaking; a change that loosens any of the three refusals must first replace the readers with one tokenizer that follows the CSS specification.
   - **Refused outright**: DOCTYPE, entity declarations (character references like `&amp;` are fine), CDATA, processing instructions, prefixed element names, and anything outside one root `<svg>`.
   - **Limits**: 200 kB, 4,000 elements and 64 levels of nesting per file, the last two found by a one-pass scan before parsing (parse5 is slow on floods of tags); 20 MB and 2,000 files per run, counted before reading.
   - **The rewrite must check clean and come back unchanged** when checked again, so any gap between what was checked and what ships fails the file.
   - **Nowhere else**: every other SVG (and, in `public/`, every HTML or XML document) in `public/` and in the build must be one of the site's own nine (favicon and covers), pinned by SHA-256 in `SITE_SVGS`, and no symbolic link may exist there. Otherwise a file dropped into another folder would skip this check and the lockdown below.
   - **The rewrite ships, not the writer's bytes.** parse5 reads SVG as HTML foreign content, and a browser reads an `.svg` file as XML; the two can disagree. So the build replaces every file in `dist/diagrams/` with the checker's own serialization of the checked tree (`--write`), and the deploy verifies the shipped bytes equal it (`check:diagrams:dist`). Measured in Chromium, 2026-09-28: the rewrite parses as `image/svg+xml` with no error and exactly the checked elements, and loads as an image.
3. **An enforced lockdown on the folder.** `dist/_headers` gives `/diagrams/*` `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox` and `X-Content-Type-Options: nosniff`, enforced whatever `CSP_ENFORCE` says, with the site-wide header detached. The deploy's smoke test fails a diagram without it, or one served as anything but `image/svg+xml`. `_headers` works only on Cloudflare, so the retired GitHub Pages workflow refuses to publish a build that holds any diagram.

## Alternatives rejected

- **Site-drawn diagrams from data** (a writer sends the steps of a flow, the site's own component draws them). This was my first proposal: safe by construction, and always in the house style. It is also narrower: it gives writers only the shapes we build. Michel chose writer-drawn SVG with a check. The two do not conflict, and components can be added later for common shapes.
- **Inline SVG in the post's HTML.** Its `<style>` would leak into the whole page, and every page's CSP would have to allow what a diagram needs. An image keeps each diagram in its own box.
- **Sanitize and ship the writer's file.** A sanitizer that parses differently from the browser can pass a file the browser reads another way. Shipping our own rewrite removes that gap.
- **DOMPurify itself.** It needs a DOM (jsdom in Node), a large dependency, and it is built to clean untrusted HTML for inline use, not to refuse. A refusal names the problem to the writer, and a silent clean-up would hide it. Our list is DOMPurify's, narrowed.
- **A human approving each diagram.** This is exactly the gate Michel asked to remove.

## Consequences

- Bots and AI writers can add diagrams with no person in the loop. A refused file fails `check:posts` with the reason, on the pull request.
- Diagrams cannot see the site's colours. A diagram brings its own background, or its own `@media (prefers-color-scheme: dark)` rules, which work inside an image. POST.md says so.
- Links, embedded images, external fonts and `use` are unavailable in diagrams. That is the price of the image boundary, and it is deliberate.
- The posts tool in atn-ops needs a way to submit a diagram with a draft (BACKLOG). Whatever lane lets a writer land files must stay narrow: this check guards SVG, and the path guard on writers' pull requests is what keeps them to posts, heroes and diagrams.
- A redrawn cover needs its new hash in `SITE_SVGS`, in the same change.
- The deep review of 2026-09-28 and its re-check (`docs/reviews/2026-09-28-diagrams-deep-review.md`) shaped the reduced-motion proof, the pinned SVGs, the GitHub Pages refusal and the linear parse.

## Status

Accepted 2026-09-28 (Michel's direction; the design is mine).
