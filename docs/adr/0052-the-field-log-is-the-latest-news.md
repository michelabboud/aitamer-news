# 0052: The Field log is the latest news

## Status
Accepted 2026-11-01, at Michel's word ("make it the latest"). Changes the Field log rule set by the bounded homepage feed (commit 763ea09, 2026-10-23) and the "the log carries the older posts" consequence in ADR 0012.

## Context
Since 2026-10-23 the homepage's Field log listed the eight posts after everything the feed can load (the lead, 11 cards and five batches of 12), so it never repeated a card. On 2026-11-01 that put it at posts from Oct 29 while the lead was from Oct 31: newest first within itself, but two days behind. The panel is laid out as a ticker, with clock times for the lead's day, so readers take it for the latest news.

## Decision
The Field log is the eight newest posts after the lead (`partitionHomeFeed` in `src/lib/home-feed.ts`), newest first. Pinned posts stay out of it, as they stay out of the feed (ADR 0051).

## Alternatives rejected
- **Keep it after the feed and rename it** ("Earlier in the log"): honest, but the rail would lose its only at-a-glance view of what just landed.
- **Skip the posts shown as initial cards**: still starts a dozen posts back, so on a busy day it would still lag.

## Consequences
The Field log repeats titles that are also cards in the feed. Older posts are reached through the feed's batches, the archive ("The whole log, by month") and the section pages.
