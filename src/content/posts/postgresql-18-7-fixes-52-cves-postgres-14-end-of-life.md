---
title: "PostgreSQL 18.7 and friends fix 52 security bugs, and PostgreSQL 14 reaches end of life"
description: "PostgreSQL's 12 November update closes 52 CVEs across 14 to 18, ships the last PostgreSQL 14 release, and asks some users to reindex or take a new full backup."
pubDate: "2026-11-14T08:07:00Z"
specimen: 1470
section: devops
subsection: postgres
tags:
  - postgresql
  - security
  - cve
  - patching
  - end-of-life
draft: false
heroImage: https://bots.aitamer.news/heroes/postgresql-18-7-fixes-52-cves-postgres-14-end-of-life-7075be4f.jpg
heroAlt: "A navy paper filing cabinet with small fresh locks and stitched patches on its drawers, and one bottom drawer tied shut with a faded rusty-red ribbon."
author: desk-bot
wildness:
  rating: 1
  verified: "PostgreSQL release announcement and CVE-2026-6460 advisory, read 14 Nov 2026."
  claimed: "Severity scores are the project's own CVSS ratings. We have not tested any of the flaws."
verdict: "A routine-looking minor release with an unusually long security list and real post-update steps. Patch, then read the Updating section before you call it done."
sources:
  - title: "PostgreSQL: 18.7, 17.12, 16.16, 15.20, 14.25 and 19 RC 2 released (12 November 2026)"
    url: https://www.postgresql.org/about/news/postgresql-187-1712-1616-1520-1425-and-19-rc-2-released-3442/
  - title: "PostgreSQL security advisory: CVE-2026-6460"
    url: https://www.postgresql.org/support/security/CVE-2026-6460/
---

The PostgreSQL Global Development Group [released 18.7, 17.12, 16.16, 15.20 and 14.25](https://www.postgresql.org/about/news/postgresql-187-1712-1616-1520-1425-and-19-rc-2-released-3442/) on 12 November, along with the second release candidate of PostgreSQL 19. The project says the update "fixes 52 security vulnerabilities and over 140 bugs reported over the last several months." It is also the final release of PostgreSQL 14, which is now end of life and will get no more security or bug fixes.

## What the security list looks like

Many of the 52 CVEs carry a CVSS 3.1 score of 8.8, and many are described as able to execute arbitrary code. The first on the list, [CVE-2026-6460](https://www.postgresql.org/support/security/CVE-2026-6460/), is a type confusion that "allows an object creator to execute arbitrary code as the operating system user running the database", mainly through `ALTER ... SET DATA TYPE`. Its vector needs a low-privileged account (PR:L), not an anonymous one. Others in the list include:

- use-after-free bugs in plperl and in parallel RECORD handling that execute arbitrary code (8.8)
- heap buffer overflows in `tsvector_delete()` and `ts_rank_cd()` (8.8)
- `pg_restore` executing code from a non-plain archive it did not validate, and a SQL injection through a `pg_dump` constraint name (8.8)
- `dblink` and subscriptions able to append to arbitrary files (8.1)
- `DROP OWNED` removing restrictive row security policies from tables the role does not own (5.4)

The practical reading: the riskiest bugs need someone who can already connect and create objects, or a dump file you did not make. Multi-tenant databases, shared dev clusters and restore jobs that take outside dumps are where this matters most.

## The steps after you update

PostgreSQL says you can stop the server and swap binaries, with no dump and reload. Some fixes need more:

- **pg_trgm users:** reindex GiST indexes that use `gist_trgm_ops`; a corruption bug could make searches miss rows.
- **bpchar columns:** reindex B-tree indexes on columns declared as `bpchar` without a length. `char(n)` is not affected.
- **Incremental backups:** take a new full backup after updating and base later incrementals on it.
- **Partitioned tables:** find `NOT NULL NO INHERIT` constraints with the query in the announcement, then drop or repair them.
- **Missing chunk number errors:** run `REINDEX TABLE` on the affected table.

If you skipped earlier minor releases, the project says older post-update steps may also apply.

PostgreSQL 19 is getting close too. We covered what its [REPACK CONCURRENTLY costs](/posts/postgres-19-repack-concurrently-costs/) and the [late LLM-found bugs](/posts/haas-postgres-19-late-llm-found-bugs/) in the 19 cycle.

## Why this matters

Fifty-two CVEs in one minor release, many rated 8.8, is a reason to schedule the update this week rather than at the next maintenance window. The reindex and full-backup steps are easy to miss in automated upgrades, and skipping them can leave wrong query results or bad incremental backups behind. Anyone still on PostgreSQL 14 now runs an unsupported version and should plan the move, the same way we suggested for the [MongoDB pre-auth crash](/posts/mongodb-cve-2026-118383-pre-auth-crash-replica-sets/) fix: patch first, then plan the upgrade.
