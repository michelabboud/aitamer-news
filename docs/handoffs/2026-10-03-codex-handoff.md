# Handoff to Codex, 2026-10-03

Written by Quill (Claude Sonnet 5.5) because the plan usage of the Claude session is nearly spent. The owner will run Codex on this repository meanwhile.

## State
- Day 2 of the daily 48 (one post every 30 minutes, 2026-10-03 12:00 UTC to 2026-10-04 11:30 UTC) is merged on main, except the 11:30 slot: a news post about Meta's Muse gadget SDK, in a pull request or in progress. Check `gh pr list -R michelabboud/aitamer-news`.
- The post builder (`scripts/post-builder.mjs`) and preflight are merged. Builder demos passed for five writers.
- The scheduled publisher runs late (up to an hour); start it by hand when a due post is not live (see `AGENTS.md`).

## What to do, in order
1. Confirm the Muse post is merged and live at its slot; if it is still a pull request, finish it with the `aitamer-publish` skill.
2. Each day, keep 48 half-hour slots filled ahead of time; see `docs/plans/2026-10-03-daily-48-day2.md` for how slots, writers and checks were run.
3. Check late posts after each :07 and :37 and start the publisher if needed.

## Not yours without the owner's word
Merging pull requests (unless the owner says so in your session), changes to the template or the schema, new dependencies, anything on the media bucket other than adding a hero, and any decision listed in `BACKLOG.md` as waiting for the owner.

## Open decisions (owner's)
Publisher timer on the ops host, the inbox for bot-written posts, the wait rule for heroes on news bursts, a required `check` job on main.
