# Comments, batch A — review record (site side)

- **Batch:** batch A of the phase-2 plan (our own comments in place of Disqus). Site side only; the desk's side (the comments Worker, moderation and the publisher) lives in the private operations repository and is reviewed there.
- **Kind:** deep reviews at task grain for the risk-class tasks (public contract, untrusted text to HTML, the publisher check), a deep review at the batch boundary, and focused reviews of every fix round.
- **Reviewers:** Strong tier (Claude Opus), read-only reviewer agents, each in a fresh context with its own brief. In-process subagents of the coordinating session, so **not blind**; no dual review was run (none is required below milestone level). No reviewer had a shell: tests, builds and checks were run by the coordinator and the lanes, and are quoted in each CHANGELOG entry.
- **Status: ruled 2026-09-26.** Every blocker fixed and its fix reviewed; open minors are in `BACKLOG.md`.

## Reviews and rulings

| Target | Review | Blockers | Fixed in | Focused re-check |
|---|---|---|---|---|
| `252f540` comment data contract v1, ADR 0006 | deep, task grain | 2: the publisher guard ran after the push (a refused commit stayed on `main`); invisible and format characters (Unicode tags among them) passed the contract | `673ed2c` (0.2.9) | batch review of `bc4f21b`: fixed |
| `6db6a79` comment rendering | deep, task grain | 1: a link's visible text could name a different host from its target (userinfo, look-alike slash, `%2e`, truncation, backslash, homographs, IP hosts) | `06621f0` (0.2.12) | batch review: fixed |
| `0d681ef` comment form, `threads.json`, `publisher-paths` | deep, task grain | 1: the check keyed on the pull request's author only, so the publisher could push into someone else's pull request | `297e4e0` (0.2.11) | batch review: fixed |
| `bc4f21b` batch boundary (site, plus the interfaces between the repositories) | deep, batch | 3: a hand-removed comment came back on the next publish; the privacy page was silent on what stays stored after rejection or removal; the two repositories disagreed on the slug length | `84a5eab` (0.2.14), `60146bc` + `c95fe7d` (0.2.15) | `c95fe7d`: 1 new blocker, below |
| `c95fe7d` focused re-check of the batch fixes | deep, focused | 1: with Turnstile on, the contact Worker refused every note sent from `www.aitamer.news` | `0bfbcd4` (0.2.16) | fixed by inspection of a one-line change with tests; no further review owed below the milestone gate |

Minor findings from every review were fixed in the same rounds or recorded in `BACKLOG.md` (dated lines from "comments (lane …)", "batch A deep review" and "focused review" sources).

## What the batch delivers (site side)

- The comment file format v1, strict and frozen (`/contract/comments.schema.json`, `/contract/v1/`), revised once, deliberately, before any file was published.
- Comments baked into the story pages as escaped plain text, with safe links, structured data and per-thread incremental rebuilds.
- The comment form, closed until the Turnstile key, the comments Worker and the contact form are all live.
- `publisher-paths`, the check that confines the desk's publisher to `src/content/comments/<slug>.json`, and the deploy guard as a second line (ADR 0007).
- Disqus removed; the Campfire and the privacy page rebuilt on our own comments.

## Measured, for the review pipeline

Five deep reviews on the site side, nine blockers found, all fixed before any comment could be posted. The line never carried more than one unruled batch.
