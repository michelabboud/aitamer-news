# Plan: section top nav, compact masthead, and desk pinning

Status: plan agreed with Wiz Cat on 2026-10-31; revised the same day after review (gaps closed below). Plan only. Code ships later as a separate site-code PR that Wiz Cat reviews and merges.
Based on the homepage mockup reviewed on 2026-10-31. The site-code PR attaches that mockup (an image under `docs/plans/assets/` or a link in its description), so the result can be checked against it.

## Top bar
- Remove author names (Michel, Mai, Aviram) from the top bar.
- Replace them with sections: News, Models, Dev, Tools, DevOps & IT, Rust, Voices, and a More menu.
- More holds Columns, General, Extinction Watch, Archive, and All habitats.
- **One section row, not two.** Today a sections row (All, News, Columns, Voices, the five topics, Extinction Watch) already sits under the masthead. The new top-bar sections replace it: that row is removed, so no link appears twice. Its per-section post counts on the homepage go with it.
- **The other top-bar links today** (Search, About, Campfire, Report a sighting, Contact, RSS): Search stays in the top bar, as a link or an icon with an accessible name. The rest stay in the phone menu and in the footer, which already lists all of them.
- On phones, the section list scrolls sideways under the masthead, above the content, and does not overlap the bottom tab bar the site already has.
- The More menu works with the keyboard and a screen reader (the site's existing `details`/`summary` menu pattern), and the current section is marked with `aria-current`.

## Where authors go
- A small "Authors" link in the top bar opens the authors page.
- Every author is listed in the footer.
- Writer cards on posts keep linking to each author page.
- No author URLs change.

## Masthead
- Homepage desktop masthead shrinks from about 295px to about 123px, so content starts about 218px higher. Inner pages already use a smaller masthead; "compact on every page" (the default below) means every page uses the new compact height, not a second shrink of the inner pages.

## Pinned by the desk
- Capacity: one card above the lead story, holding up to two posts, newest first. Pinned posts also stay in their normal lists, except on the homepage, where a pinned post is not repeated in the feed directly below the card. If a pinned post is already the lead story, it is not shown in the pin card. The lead story slot is separate from pinning.
- Auto pinning: every four hours, alongside the ship run, the Editor-in-Chief reviews the fresh batch and pins one or two posts. Signals are source weight and unique coverage. This is editorial judgment, not a fixed score. **Early engagement is not a signal yet:** the site has no analytics and reactions are still off, so there is no engagement data to weigh. It is added only when a real data source exists, by a later plan.
- Mode toggle: `auto` (EIC pins directly) or `approve` (EIC proposes, Wiz Cat approves). Starts on `auto`. The toggle works from day one: in `approve` mode the EIC writes its pin with state `proposed`, the site ignores proposed pins, and Wiz Cat approves one by changing its state to `active` in the same file. The back-office desk can take over that edit later; no extra mechanism is needed now.
- Manual pins: Wiz Cat can pin any post until a set date or until unpinned. Manual pins sit outside the four-hour cycle and always take priority over auto pins for the two slots. With more than two manual pins, the two newest show.
- Storage: pins live in one desk-only data file, `src/data/pins.json`, not in post frontmatter: `mode` (`auto` or `approve`) and a list of pins, each with `slug`, `source` (`auto` or `manual`), `state` (`active` or `proposed`), `pinnedAt`, and an optional `until` date. Only EIC newsroom PRs and Wiz Cat may edit it. Bot PR checks reject any other bot change to it, the same way specimen numbers are protected. The build validates the file and fails on a slug that is not a published post.
- Expiry: the site is static, so a pin's `until` takes effect at the first build after that date. Ship runs rebuild every four hours, but a quiet day has no merge and no build, so the site-code PR adds a daily scheduled run of the Pages deploy; an expired pin is then gone within a day at most.
- No further pinning features are in scope.

## Records
- The site-code PR adds a decision record that supersedes ADR 0032's rule that featured writers lead the top bar in homepage order, and amends ADR 0013's navigation order (News and Columns leading the row; Columns now sits in More). The ADR index is updated with it.

## Performance and accessibility checks for the code PR
- The pin card above the lead pushes the lead's hero image down. The PR keeps the right image prioritised (the first visible hero is the one loaded eagerly) and reports page-speed numbers for the homepage before and after: Largest Contentful Paint and Cumulative Layout Shift, on a phone profile and a desktop profile.
- Keyboard and screen-reader pass over the top bar, the More menu and the pin card.

## Open choices (defaults if not picked)
- 7th nav item: Voices (default) or Columns.
- Compact masthead: every page (default) or homepage only.

## Delivery order
1. One site-code PR for nav, masthead, and pinning (Wiz Cat reviews and merges).
2. Series/featured list PR.
3. Related-posts PR.

## Later discussion (no work yet)
- A "more to read" section at the end of each post, to be discussed together with the related-posts PR.
- Early engagement as a pinning signal, once a data source exists.
