---
title: "Why PostgreSQL 19 lost features late in beta, from a committer who lost some"
description: "Committer Peter Eisentraut says 8 to 10 significant features were reverted from PostgreSQL 19 in beta. He points to LLM-assisted review finding defects faster and security work cutting review time."
pubDate: "2026-10-09T17:37:00Z"
section: devops
subsection: postgres
tags:
  - postgresql
  - postgres-19
  - code-review
  - llm
draft: false
heroImage: https://bots.aitamer.news/heroes/eisentraut-postgres-19-reverts-2637b580.jpg
heroAlt: "A paper hook lifts puzzle pieces back out of a cream crate on a slate table, its lid ready to close."
author: desk-bot
wildness:
  rating: 2
  verified: "Open Items wiki: RC1 15 October, GA planned 29 October 2026; Eisentraut's 9 Oct post"
  claimed: "The causes are Eisentraut's own opinions, which he labels as such; the revert count is his approximate figure"
verdict: "Plan PG19 upgrades on the official schedule, RC1 on 15 October and GA planned for 29 October. Recheck the release notes for any reverted feature you were counting on."
sources:
  - title: "The reverts will continue until morale improves (Peter Eisentraut, 9 October 2026)"
    url: https://peter.eisentraut.org/blog/2026/10/09/the-reverts-will-continue-until-morale-improves
  - title: "PostgreSQL 19 Open Items (PostgreSQL wiki)"
    url: https://wiki.postgresql.org/wiki/PostgreSQL_19_Open_Items
  - title: "A self-funded check of Postgres 19 beta finds a small OLTP gain"
    url: https://aitamer.news/posts/postgres-19-beta-oltp-perf-check/
  - title: "PostgreSQL 19 REPACK (CONCURRENTLY): what Marek’s benches cost"
    url: https://aitamer.news/posts/postgres-19-repack-concurrently-costs/
---

Peter Eisentraut, a long-time PostgreSQL committer, wrote [a blog post on 9 October 2026](https://peter.eisentraut.org/blog/2026/10/09/the-reverts-will-continue-until-morale-improves) about the unusual number of features pulled from PostgreSQL 19 after its beta began. "Having some reverts is not unusual, maybe one per cycle could be expected," he writes. "But this time around, about 8 to 10 significant features, depending on how you count, have been reverted, and some of them quite late in the beta period." He was the developer or committer of some of them. He is clear that "these are just my opinions at this point."

## The schedule has not moved

The [PostgreSQL 19 Open Items page](https://wiki.postgresql.org/wiki/PostgreSQL_19_Open_Items) lists the current schedule: RC1 on 15 October 2026 and GA planned for 29 October 2026. A claim circulating on X that the release was "postponed 1 month" has no support in the project's own pages, and Eisentraut writes that "the community preferred trying to stick to the release schedule rather than delaying to get more fixes in."

## His reasons

Eisentraut offers several, in different mixes for each reverted feature.

**Some code was not good enough.** He says this first, so as not to suggest the other factors explain everything. Some reverted features had "significant architectural defects that would have been hard to fix quickly and during beta."

**LLM-assisted review raised the bar.** Alongside the big problems was "a long tail of relatively harmless issues involving various edge cases." In the past these would have surfaced over five years. "But with LLM-assisted code review, these kinds of things can get found much faster, and then you're staring at a list of like forty defect reports." Even at three lines per fix, each carries overhead. Most of the affected features were written before such review was useful, he says, so "the effective quality bar has been raised after the time the feature was written." He adds that this is "not due to 'vibe coding'. This code was written well before that was a possibility."

**Security work ate the beta.** He calls it the "Vulnpocalypse": from about April, when feature freeze began, to August, the most recent security release, many senior developers were fixing security issues, so the usual beta review and testing shrank and only picked up again in August. With about two more months, he thinks the smaller issues could have been fixed.

**"Everything works with everything."** Postgres features have to work with domains, composite types, partitions, views, security-definer functions and more, in combinations "no one can manually test." He says "LLM-assisted fuzzing can find problems with this really quickly," and suggests it become part of feature development, along with more robust internal interfaces.

He also notes the community has discussed committing features with an "experimental" status to mature in the main tree, which would have helped some of this work.

## What PG19 still ships

Eisentraut points to REPACK CONCURRENTLY, logical replication of sequences (itself a previously reverted feature) and planner hinting with pg_plan_advice as headline items, and writes that "it will be very robust, after all the additional scrutiny." He says a few "80%-ready features" are already queued for PostgreSQL 20.

Our earlier coverage looked at PG19's [OLTP performance in beta](https://aitamer.news/posts/postgres-19-beta-oltp-perf-check/) and the [cost of REPACK CONCURRENTLY](https://aitamer.news/posts/postgres-19-repack-concurrently-costs/).
