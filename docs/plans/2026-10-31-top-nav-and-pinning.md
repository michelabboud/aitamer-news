# Plan: section top nav, compact masthead, and desk pinning

Status: plan agreed with Wiz Cat on 2026-10-31. Plan only. Code ships later as a separate site-code PR that Wiz Cat reviews and merges.
Based on the homepage mockup reviewed on 2026-10-31.

## Top bar
- Remove author names (Michel, Mai, Aviram) from the top bar.
- Replace them with sections: News, Models, Dev, Tools, DevOps & IT, Rust, Voices, and a More menu.
- More holds Columns, General, Extinction Watch, Archive, and All habitats.
- On phones, the section list scrolls sideways under the masthead.

## Where authors go
- A small "Authors" link in the top bar opens the authors page.
- Every author is listed in the footer.
- Writer cards on posts keep linking to each author page.
- No author URLs change.

## Masthead
- Desktop masthead shrinks from about 295px to about 123px, so content starts about 218px higher.

## Pinned by the desk
- Capacity: one card above the lead story, holding up to two posts, newest first. Pinned posts also stay in their normal lists. The lead story slot is separate from pinning.
- Auto pinning: every four hours, alongside the ship run, the Editor-in-Chief reviews the fresh batch and pins one or two posts. Signals are early engagement, source weight, and unique coverage. This is editorial judgment, not a fixed score.
- Mode toggle: `auto` (EIC pins directly) or `approve` (EIC proposes, Wiz Cat approves). Starts on `auto`. Approve mode is turned on later when the back-office desk is fully working, but the toggle exists from day one.
- Manual pins: Wiz Cat can pin any post until a set date or until unpinned. Manual pins sit outside the four-hour cycle and always take priority over auto pins for the two slots.
- Storage: pins live in one desk-only data file (mode, slug, auto or manual, end date), not in post frontmatter. Only EIC newsroom PRs and Wiz Cat may edit it. Bot PR checks reject any other bot change to it, the same way specimen numbers are protected. Expiry is checked at build time.
- No further pinning features are in scope.

## Open choices (defaults if not picked)
- 7th nav item: Voices (default) or Columns.
- Compact masthead: every page (default) or homepage only.

## Delivery order
1. One site-code PR for nav, masthead, and pinning (Wiz Cat reviews and merges).
2. Series/featured list PR.
3. Related-posts PR.

## Later discussion (no work yet)
- A "more to read" section at the end of each post, to be discussed together with the related-posts PR.
