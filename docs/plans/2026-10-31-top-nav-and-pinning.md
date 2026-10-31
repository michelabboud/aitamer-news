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
- Auto pinning: every four hours, alongside the ship run, the Editor-in-Chief reviews the fresh batch and pins one or two posts. Signals are source weight and unique coverage. This is editorial judgment, not a fixed score. **Early engagement is not a signal yet:** reactions are still off, and the site's analytics (Google Analytics, loaded in the base layout) are not readable by the build or the desk, so there is no engagement data the pinning can weigh. (Corrected 2026-10-31: the first version of this plan said the site had no analytics.) It is added only when a real data source exists, by a later plan.
- Mode toggle: `auto` (EIC pins directly) or `approve` (EIC proposes, Wiz Cat approves). Starts on `auto`. The toggle works from day one: in `approve` mode the EIC writes its pin with state `proposed`, the site ignores proposed pins, and Wiz Cat approves one by changing its state to `active` in the same file. The back-office desk can take over that edit later; no extra mechanism is needed now.
- Manual pins: Michel's GitHub account (by hand, or a Claude session working on his account) and the newsroom bots can pin any post until a set date or until unpinned. Manual pins sit outside the four-hour cycle and always take priority over auto pins for the two slots. With more than two manual pins, the two newest show.
- Storage: pins live in one desk-only data file, `src/data/pins.json`, not in post frontmatter: `mode` (`auto` or `approve`) and a list of pins, each with `slug`, `source` (`auto` or `manual`), `state` (`active` or `proposed`), `pinnedBy` (who asked for the pin: `michel`, `eic`, or a newsroom bot's name, for the record only), `pinnedAt`, and an optional `until`. Who may edit it, how a bad slug is handled, and how `until` is read are in "Pin file rules" below.
- Expiry: the site is static, so a pin's `until` takes effect at the first build after that moment. Ship runs rebuild every four hours, but a quiet day has no merge and no build, so the site-code PR adds a daily scheduled run of the Pages deploy (see "Daily scheduled deploy" below); an expired pin is then gone within a day at most.
- No further pinning features are in scope.

## Pin file rules

### Who may edit `src/data/pins.json`
- **The desk editor App** (`aitamer-desk-editor`, App id 5558957, bot account id 350852201, repository variable `EIC_ACTOR_ID`), created and installed on aitamer-news only on 2026-10-31 (report `docs/reports/2026-10-31-desk-editor-app.md`). Its pin PRs come from `eic/pins-*` branches. A live ruleset already lets only this App and admins create, update or delete `eic/*` branches, and the generic maintainer-branch rules exclude `eic/*`.
- A pin PR from the App changes `src/data/pins.json` and nothing else (added or modified, a plain file; no delete, no rename).
- **Michel's GitHub account** (the maintainer, numeric `MAINTAINER_ID`) edits the file freely, as it may any path today: by hand, or through a Claude session working on his account. Michel (Wiz Cat) and Claude may both pin and unpin posts directly; their pins are manual pins and take priority over the EIC's auto pins.
- **No other App may touch the file.** The Grok App, the posts App, the publisher App and the Cursor App all fail the path guard if their PR changes it. Grok bots that want a pin ask the desk, which holds the App's key; the bots pin through the desk, not through the Grok App. The Cursor App never publishes or pins on its own.
- Inside its lane the desk may write any pin, auto or manual, active or proposed; `pinnedBy` records who asked (`michel`, `eic`, or a newsroom bot's name).
- **One pin command for everyone.** The site-code PR adds `npm run pin -- <slug> [--until <date or timestamp>] [--proposed]` and `npm run unpin -- <slug>`. It edits `src/data/pins.json` with the same validation the build runs (the slug is a published post, `until` is valid, no duplicate pin), sets `source`, `pinnedBy` and `pinnedAt`, and prints what the homepage card will show. The EIC's four-hour auto pin uses the same code path with `source: auto`.
- **What this stops.** The check compares the App's numeric account id, which a bot cannot fake by naming a branch, so only a holder of the desk App's key (or Michel) can change pins. The key lives in the desk's credential store, never in a repository.

### Publisher-paths allowance
- `src/data/` is outside every bot lane today. The site-code PR adds a desk lane to `scripts/check-publisher-paths.mjs`: author and sender both `EIC_ACTOR_ID` by numeric id, `opened` or `synchronize`, a same-repository `eic/` branch, and the paths that lane allows (pins now; posts too, below). An unset or non-numeric `EIC_ACTOR_ID` closes the lane, as the Quill lane does. Tests cover the pass case and each refusal. Desk PRs then merge through the normal merge path, with no `--admin`.

### The desk publishes posts too
- Michel's word, 2026-10-31: the desk can publish as well as pin. The desk lane allows what the Grok lane allows today: added or modified plain `src/content/posts/<slug>.md` files and append-only entries in `src/content/specimen-ledger.txt`, from `eic/posts-*` branches. A desk PR carries either pins or posts, never both, so each kind keeps its own review.
- Publishing also needs the trusted admission workflow (specimen numbering, certification, the same-PR merge) to pick up `eic/*` PRs from `EIC_ACTOR_ID` the way it picks up `grok/*` PRs from the Grok App, and the main-update rule to let the workflow merge them. That is security-relevant workflow code, so it ships as **its own PR**, separate from the nav and pinning code, with its own review; the site-code PR only adds the pins half.

### GitHub is the interim route
- Michel's word, 2026-10-31: the desk will eventually run all of this on its own server, without GitHub. So the GitHub pieces (the desk App, its branch rule, the path-guard lane) are the route for now, not the design's centre. What must survive the move is kept independent of GitHub: the `pins.json` format, the pin command and its validation, and the build's handling of a bad pin. None of them reads a GitHub identity; only the path guard does, and it goes away with the move.

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
1a. One PR for desk publishing: the admission workflow and main-update rule learn the desk App's `eic/posts-*` PRs.
2. Series/featured list PR.
3. Related-posts PR.

## Later discussion (no work yet)
- A "more to read" section at the end of each post, to be discussed together with the related-posts PR.
- Early engagement as a pinning signal, once a data source exists.
