# 0050: The desk editor App's pins lane

## Status
Accepted 2026-10-31, as part of the approved plan `docs/plans/2026-10-31-top-nav-and-pinning.md` (sections "Who may edit `src/data/pins.json`" and "Publisher-paths allowance"). The App, its repository variable `EIC_ACTOR_ID` and the `eic/*` branch ruleset were created the same day (`docs/reports/2026-10-31-desk-editor-app.md`). Adds a lane beside 0018, 0030 and 0036; changes nothing for them.

## Context
The homepage pin card reads `src/data/pins.json`. The desk's editor in chief (EIC) pins and unpins posts, automatically every four hours and on request, and holds the key of a dedicated GitHub App, `aitamer-desk-editor` (bot account id 350852201). `src/data/` is outside every bot lane, so without a lane each pin pull request fails the required `publisher-paths` check. The maintainer's account stays free to edit the file by hand. No other App, Grok, Quill, the posts App, the publisher or Cursor, may change pins: a pin moves the front page, and the plan routes every bot's pin request through the desk.

## Decision
Add a pins lane to `scripts/check-publisher-paths.mjs`, shaped like the Quill lane and failing closed in the same ways.

1. **Identity.** The lane applies only to a pull request whose author and this event's sender both equal the repository variable `EIC_ACTOR_ID`, a positive numeric account id; on `opened` or `synchronize`; with the head repository equal to this repository. No login fallback. Unset, empty or non-numeric `EIC_ACTOR_ID` gives the lane to nobody, so unsetting it closes the lane at once.
2. **Branch.** `eic/pins-<suffix>`, the suffix lowercase letters and digits in hyphen-joined runs (no slash, dot, underscore, doubled, leading or trailing hyphen), at most 64 characters: the author id rule the authors lane's branch already uses. It is stricter than the `grok/` and `quill/` git-ref rule because the desk generates the name, so nothing legitimate needs more. The `eic/*` ruleset (only the App and admins write those branches) is defence in depth; the numeric identity is the rule.
3. **Paths.** Exactly one changed path, `src/data/pins.json`, added (the first pin) or modified; never deleted, renamed or copied (copies are detected); a plain file, mode `100644`, never a symlink, submodule or executable. A pull request that changes the file and anything else is refused whole. Every refusal names the path and what was wrong with it.
4. **Nothing else.** The lane is judged instead of the publisher's empty rule and gains no other path; it never applies to the deploy's push mode. It reads only paths and modes, so the workflow installs nothing for it. What the file says (its schema, that each pin names a published post) is the required check `check`'s, as the plan sets out.
5. **Routing.** `eic/` is deliberately not an observation prefix in `.github/workflows/check-publisher-pr.yml`, so `eic/` pull requests keep the required `publisher-paths` name and this script's verdict, and with them the variable kill switch (the Quill review found an observation route that skipped it).

## Alternatives rejected
- **Let the Grok or posts App write pins.** Either would hand front-page control to an identity that also writes posts or profiles, and closing one lane would close the other's work. The plan routes every bot's pin through the desk.
- **The ruleset alone.** Branch rules say who may push a branch, not what a pull request may change; a required check is what blocks the merge.
- **A `src/data/` directory lane.** `topics.json` and `prepared-heroes.json` feed topic pages and hero delivery; the desk has no reason to touch them.
- **The `grok/` style ref rule for the branch.** It accepts slashes, dots and capitals the desk never produces; a narrower pattern refuses more for free.
- **Pin the id in code as admission does.** Admission pins ids because it grants merge authority with no owner review. Pins merge through the normal merge path with the required checks; the variable is the kill switch, as for the publisher guard's other lanes.

## Consequences
A holder of the desk editor App's key can change which posts are pinned, and nothing else, through a pull request that still needs every required check. The maintainer remains exempt. Anyone with the right to change repository variables could point `EIC_ACTOR_ID` at another account and give it the pins lane (only pins); that is the same exposure the Grok and Quill variables carry. The later desk posts lane (`eic/posts-*`, plan section "The desk publishes posts too") is a separate reviewed change, together with the trusted admission workflow; this lane does not admit posts. When the desk moves off GitHub, this lane goes with it; the pins format and its validation do not depend on it.
