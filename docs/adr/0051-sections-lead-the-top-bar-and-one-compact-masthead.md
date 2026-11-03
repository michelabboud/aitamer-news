# 0051: Sections lead the top bar, one compact masthead, and a desk pin card

## Status
Accepted 2026-10-31, as part of the approved plan `docs/plans/2026-10-31-top-nav-and-pinning.md`. **Supersedes** ADR 0032's navigation rule (featured writers lead the top bar in homepage order); the rest of 0032 (who is featured, own-name pages, homepage cards, signoffs) stands. **Amends** ADR 0013's navigation order: News still leads, the five topics follow, Voices closes the row, and Columns moves into the More menu.

## Context
The top bar opened with the featured writers' names (Michel, Mai, Aviram), and a second row under the masthead repeated the sections with per-section counts. The homepage masthead was a 148px wordmark, about 295px tall, so the first story started well below the fold on a laptop. The desk also needed a way to put up to two posts above the lead without changing the lead story itself.

## Decision
1. **One section row.** The top bar carries the sections: News, Models, Dev, Tools, DevOps & IT, Rust, Voices, then a More menu holding Columns, General, Extinction Watch, Archive and All habitats. The old row under the masthead and its homepage counts are removed, so no link appears twice. The navigation lives in one module, `src/lib/site-nav.ts`, with tests; `BaseLayout.astro` only renders it.
2. **Utility links.** Authors and Search stay small at the right of the top bar. About, Campfire, Report a sighting, Contact and RSS live in the phone menu and the footer, which already listed them.
3. **Marking the current page.** A link carries `aria-current="page"` on its own page and `aria-current="true"` on a page inside it (a story in a habitat, page 2 of News). Anchored links (the contact form) are never current. The More button is marked when its menu holds the current page.
4. **More menu.** The site's `details`/`summary` pattern, so it works with the keyboard and a screen reader without script; a small inline script closes it on Escape (focus returns to the button) and on a click outside.
5. **Phones.** The top bar dissolves (`display: contents`): the masthead comes first and the sections scroll sideways under it as chips, above the content and apart from the bottom tab bar. More has no drop-down there, because a scrolling row would clip it; its links are in the phone menu. The current chip is scrolled into view on load.
6. **One compact masthead.** Every page, the homepage included, uses the inner pages' compact wordmark (64px). The homepage keeps the wordmark as its `h1`.
7. **Pin card.** Up to two pinned posts sit in a text-only card above the lead (`src/lib/home-pins.ts`, from `src/data/pins.json` through `src/lib/pins.ts`). The lead is always the newest post; a pinned post that is the lead is not repeated in the card; a post in the card leaves the homepage feed, the Field log and the browser-loaded batches, and stays in every other list. The card has no image, so the lead's hero stays the largest paint and is still the one loaded eagerly.

## Alternatives rejected
- **Keep both rows.** Two navigations with the same links cost height and make the reader choose between identical lists.
- **Writers in the top bar beside the sections.** Too wide for one row, and readers navigate by subject more than by writer; writers stay one click away (Authors, the homepage cards, the footer).
- **A drop-down inside the phone scroller.** It would be clipped by the scrolling row, or need a portal and more script.
- **An image in the pin card.** It would push the lead's hero down and compete with it for the largest paint.
- **Compact masthead on the homepage only.** Inner pages were already near the compact height; one height everywhere is simpler and keeps the brand consistent.

## Consequences
Content starts higher on every page, most on the homepage. Featured writers lose their top-bar links; ADR 0032's other effects are unchanged. A pinned post appears once on the homepage. Changing the sections means editing `site-nav.ts` and its tests, not the layout.
