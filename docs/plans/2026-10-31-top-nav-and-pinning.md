# Plan: section top nav, compact masthead, and desk pinning

Status: plan agreed with Wiz Cat on 2026-10-31; revised the same day after review (gaps closed below), and again after the EIC's five points on pin edits, publisher paths, bad slugs, `until` time zone and the scheduled deploy. Plan only. Code ships later as a separate site-code PR that Wiz Cat reviews and merges.
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
- Storage: pins live in one desk-only data file, `src/data/pins.json`, not in post frontmatter: `mode` (`auto` or `approve`) and a list of pins, each with `slug`, `source` (`auto` or `manual`), `state` (`active` or `proposed`), `pinnedAt`, and an optional `until`. Who may edit it, how a bad slug is handled, and how `until` is read are in "Pin file rules" below.
- Expiry: the site is static, so a pin's `until` takes effect at the first build after that moment. Ship runs rebuild every four hours, but a quiet day has no merge and no build, so the site-code PR adds a daily scheduled run of the Pages deploy (see "Daily scheduled deploy" below); an expired pin is then gone within a day at most.
- No further pinning features are in scope.

## Pin file rules

### Who may edit `src/data/pins.json`
- Every newsroom bot pushes through the same GitHub App (the Grok App), so the check cannot tell the Editor-in-Chief from another bot by who pushed. The rule is therefore a lane rule on the pull request's shape:
  - A Grok App pull request may change `src/data/pins.json` only when its head branch starts with `grok/eic-pins-` **and** that file is the only path it changes (added or modified, a plain file; no delete, no rename).
  - Any other Grok App pull request that touches the file fails the path guard (`scripts/check-publisher-paths.mjs`), and so does any other bot's.
  - The maintainer (Wiz Cat's own account) edits it freely, as today. That includes Claude working from Wiz Cat's account: Wiz Cat and Claude may both pin and unpin posts directly, and their pins are manual pins that take priority over EIC auto pins.
- **What this does and does not stop.** It stops a ship run, a stray edit or a confused bot from changing pins as a side effect, which is the realistic failure. It does not authenticate the EIC: any bot holding the Grok App's key can name a branch `grok/eic-pins-…`. That is accepted because the harm is bounded: the file can only reorder up to two already-published posts on the homepage, the build validates its schema, and every change is a reviewable pull request with history. If pinning ever needs real separation, the EIC gets its own GitHub App with its own numeric actor id, and the guard checks that id the way it already checks the posts App and the Quill App; that is a later plan, not this one.

### Publisher-paths allowance
- `src/data/` is outside every bot lane today, so an EIC pin PR would fail the path guard the same way this plan PR did. The site-code PR adds a pins lane to the guard for exactly the rule above (author and sender the Grok App by numeric id, `opened` or `synchronize`, branch `grok/eic-pins-*`, the one file), with tests for the pass case and each refusal. EIC pin PRs then merge under EIC content authority through the normal merge path, with no `--admin`.

### A pin that names a post that is not published
- **The pull request check fails** when a pull request that changes `src/data/pins.json` names a slug that is not a published post, or breaks the file's schema.
- **Every deploy build drops that pin with a warning instead of failing**, the scheduled daily build and the push-to-main build alike. A post that is retracted, renamed or unpublished then cannot block every ship until someone edits the file.
- **Other pull requests are not failed by a dangling pin either.** A retraction PR cannot fix the pin itself, because only an EIC pin PR may touch the file, so failing it would deadlock the retraction. The check reports the dangling pin as a warning, and the EIC removes it in its next pin PR.
- A schema error (bad JSON, an unknown field, a bad `state`) still fails every build: that is a broken file, not a stale reference, and it only gets in through a pin PR whose own check already failed.

### How `until` is read
- `until` is either a full ISO 8601 timestamp with an offset (`2026-11-05T18:00:00+02:00`, or `Z`), or a bare date (`2026-11-05`).
- A bare date means the end of that day in Israel time (`Asia/Jerusalem`): the pin is shown through 23:59:59 local time and gone from the first build after it. The conversion uses the IANA time zone, so summer time (UTC+3) and winter time (UTC+2) are both right.
- A timestamp without an offset (`2026-11-05T18:00:00`) is rejected by the schema, because its meaning would depend on the build machine's clock.
- `pinnedAt` follows the same timestamp rule.

### Daily scheduled deploy
- It is a CI change, so it lands as **its own commit** inside the site-code PR, touching only `.github/workflows/deploy-pages.yml`, for Wiz Cat to review on its own.
- GitHub's schedule runs in UTC only, and Israel moves between UTC+2 and UTC+3. The cron is `10 22 * * *` (22:10 UTC), which is 00:10 Israel time in winter and 01:10 in summer, so it always runs after midnight Israel time and picks up every pin whose bare-date `until` ended that day. A fixed 21:10 UTC would run at 23:10 the previous evening in winter, before the pin ends.
- GitHub can start a scheduled run late under load, and turns off scheduled workflows in a repository with no activity for 60 days. Neither matters here: a late run still expires the pin, and the newsroom ships every four hours.

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
