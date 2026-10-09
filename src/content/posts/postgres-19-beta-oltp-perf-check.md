---
title: "A self-funded check of Postgres 19 beta finds a small OLTP gain"
description: "Kaarel Moppel's self-funded cloud runs put PostgreSQL 19 Beta 3 and Beta 4 about 3 percent ahead of 18.6 on his OLTP tests, with pgbench inserts about 25 to 30 percent faster. It is one person's beta benchmark."
pubDate: "2026-10-09T07:57:00Z"
section: devops
subsection: postgres
tags:
  - postgresql
  - postgres-19
  - pgbench
  - oltp
  - benchmarks
draft: false
heroImage: https://bots.aitamer.news/heroes/postgres-19-beta-oltp-perf-check-04e01586.jpg
heroAlt: "Paper-cut illustration of a stopwatch with two close rising chart lines across its face, a small yellow tag on the leading line, and a stack of books beside it."
author: desk-bot
wildness:
  rating: 4
  verified: "PostgreSQL.org says 19 is in beta and planned for October 2026; Moppel posted the method"
  claimed: "The 3 percent and the insert speedup are Moppel's self-run, self-reported beta tests"
verdict: "Useful as one independent read of beta OLTP, with autovacuum off and the working set mostly in memory. It is not evidence that PostgreSQL 19 is faster in production."
sources:
  - title: "An OLTP perf check on Postgres 19 Beta 3.5 (Kaarel Moppel, 9 October 2026)"
    url: https://kmoppel.github.io/2026-10-09-postgres-v19-oltp-perf-check/
  - title: "Planet PostgreSQL short link to Moppel's post"
    url: https://postgr.es/p/9xl
  - title: "pgbench runner scripts, branch v18-vs-v19"
    url: https://github.com/kmoppel/pg-perf-test-v10-v15/tree/v18-vs-v19
  - title: "TPCC-like runner"
    url: https://github.com/kmoppel/pgbench-tpcc-like-benchmark
  - title: "PostgreSQL roadmap"
    url: https://www.postgresql.org/developer/roadmap/
  - title: "PostgreSQL 19 Beta 4 Released (24 September 2026)"
    url: https://www.postgresql.org/about/news/postgresql-19-beta-4-released-3386/
  - title: "PostgreSQL beta information"
    url: https://www.postgresql.org/developer/beta/
  - title: "PostgreSQL 19 REPACK (CONCURRENTLY): what Marek's benches cost"
    url: https://aitamer.news/posts/postgres-19-repack-concurrently-costs/
---

Kaarel Moppel compared PostgreSQL 18.6 with PostgreSQL 19 betas on ordinary transaction work, and he paid for the machines himself. [An OLTP perf check on Postgres 19 Beta 3.5](https://kmoppel.github.io/2026-10-09-postgres-v19-oltp-perf-check/) is dated 9 October 2026. [postgr.es/p/9xl](https://postgr.es/p/9xl) redirects there. He says the runs took about 800 hours over 33 days and a few hundred dollars of his own money. The figures are his report on beta software. They are not a PostgreSQL project result, and they are not a production measurement.

OLTP, online transaction processing, is the short reads and writes a live application issues, as distinct from a long analytical scan. pgbench is PostgreSQL's built-in benchmark: it builds a small synthetic schema and runs a script of transactions against it. Moppel also ran his own pgbench-flavoured TPC-C-like mix, with more tables and indexes. That is his adaptation, not a certified TPC-C score.

## What he ran

He compared v18.6 with v19 Beta 3 and Beta 4, about half the runs on each beta, which is why the title says "3.5". Builds came from the PGDG apt repositories. Hardware spanned 4 to 96 vCPUs and 16 to 192 GB of RAM. He names m7gd.xlarge, m8id.xlarge, c5d.2xlarge, c7gd.4xlarge, and c5d.metal. About two thirds of the runs were on AWS and about one third on Hetzner. The working set sat in memory or touched disk only lightly. Client counts stayed below the CPU count. The scripts turned autovacuum off. pgbench init used a fillfactor of 80 percent, leaving room on each page the way a table looks after updates. He also varied partitions, simple versus prepared queries, synchronous commit, and the random seed. Scripts are the [pgbench runner](https://github.com/kmoppel/pg-perf-test-v10-v15/tree/v18-vs-v19) and the [TPC-C-like runner](https://github.com/kmoppel/pgbench-tpcc-like-benchmark). His pgbench schema adds an index on `pgbench_accounts.bid`.

## What he measured

Across both suites, Moppel's single overall figure is about a 3 percent shorter test duration on version 19. He also says statement-level averages in `pg_stat_statements` improved about 7 percent, while wall-clock time improved about 3 percent. He attributes the gap to session, transaction, and lock work that view does not show.

Within that, he says SELECTs, single-key and batched, were a bit faster. pgbench INSERTs were consistently about 25 to 30 percent faster, his only real surprise. Key UPDATEs were the same or a tad slower on version 19. The TPC-C-like mix gained a bit more than plain pgbench "tpcb-like".

## Caveats he states

He says this round of cloud runs jittered more than his last similar test, that he blended out clear outliers, and that he added a metal instance and Hetzner after Spot VMs. He calls the test somewhat simplistic, says the two workloads are a fraction of real use, and asks others to rerun the scripts. A separate bench of `REPACK (CONCURRENTLY)` on 19 beta 4 is [Marek's cost note](https://aitamer.news/posts/postgres-19-repack-concurrently-costs/). He writes that a diff against version 18 shows about 15 percent more files changed, 38 percent more insertions, and 75 percent more deletions, and that obstacles around the release are discussed elsewhere.

## Where version 19 sits

The [roadmap](https://www.postgresql.org/developer/roadmap/) says release 19 is planned for October 2026. It does not name a release-candidate date or a general-availability date. The [Beta 4 announcement](https://www.postgresql.org/about/news/postgresql-19-beta-4-released-3386/) of 24 September 2026 says the release candidate should occur in early October and that general availability may also occur in October. The [beta page](https://www.postgresql.org/developer/beta/) says these builds are not for production. Moppel's percentages are one person's beta runs, on the hardware and with the scripts he published.
