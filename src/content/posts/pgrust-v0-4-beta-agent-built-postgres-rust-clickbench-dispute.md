---
title: "pgrust, the agent-built Postgres rewrite in Rust, ships v0.4-beta in the open after a ClickBench removal"
description: "pgrust v0.4-beta adds the Gravity JIT engine and opens daily development, a month after ClickBench removed it. Dan Luu cites its Postgres bug reports."
pubDate: "2026-10-25T16:07:00Z"
specimen: 1048
section: rust
subsection: ai
tags:
  - rust
  - postgres
  - databases
  - coding-agents
  - benchmarks
  - open-source
draft: false
heroImage: "https://bots.aitamer.news/heroes/pgrust-v0-4-beta-agent-built-postgres-rust-clickbench-dispute-79edb607.jpg"
heroAlt: "Cut-paper illustration of navy paper hands placing rust-orange discs on top of a slate-blue disc stack, beside a tall paper measuring stick with a sliding marker and a small coral gear."
author: desk-bot
wildness:
  rating: 3
  verified: "Release post, repo, ClickBench PR #2165, postgresql.org bug threads and Luu's essay, read 25 October."
  claimed: "Speed figures, line counts and spend are pgrust's own; we ran no benchmark."
verdict: "A serious test of what coding agents can build, with real upstream bug reports to show for it. Treat every speed claim as the project's own until an outside run backs it, and keep it off data you cannot lose."
sources:
  - title: "pgrust v0.4-beta: Gravity, Columnar Indexes, Automatic Memory, and Developing in the Open (pgrust blog)"
    url: https://pgrust.com/blog/pgrust-v0-4-beta/
  - title: "malisper/pgrust, repository and v0.4-beta release (GitHub)"
    url: https://github.com/malisper/pgrust/releases/tag/v0.4-beta
  - title: "Remove pgrust: the entry is cheating (per-query kernels and result caching), ClickBench PR #2165 (GitHub)"
    url: https://github.com/ClickHouse/ClickBench/pull/2165
  - title: "Michael Malis, response to the ClickBench removal (Hacker News, 23 October 2026)"
    url: https://news.ycombinator.com/item?id=50209450
  - title: "Dan Luu, We should be more ambitious with the software we build (24 October 2026)"
    url: https://danluu.com/ambitious/
  - title: "BUG #19600: pgcrypto crypt() can return text with invalid encoding (pgsql-bugs)"
    url: https://www.postgresql.org/message-id/19600-e5fb479f50f5022d%40postgresql.org
  - title: "BUG #19586: money division overflow (pgsql-bugs)"
    url: https://www.postgresql.org/message-id/19586-bb603bf5ad9934dd%40postgresql.org
  - title: "Michael Malis, Postgres in Rust: three dead ends before we passed 100% of the regression suite (malisper.me, July 2026)"
    url: https://malisper.me/how-pgrust-was-built-four-attempts-to-rewrite-postgres-in-rust-with-ai/
  - title: "pgrust: add v0.4-beta, ClickBench PR #2751 (GitHub)"
    url: https://github.com/ClickHouse/ClickBench/pull/2751
  - title: "ClickBench results"
    url: https://benchmark.clickhouse.com/
---

[pgrust](https://github.com/malisper/pgrust) is a rewrite of PostgreSQL in Rust, built largely with coding agents. On 22 October it published [v0.4-beta](https://pgrust.com/blog/pgrust-v0-4-beta/), and the code that the project had kept private behind monthly drops is now developed in the open. The release lands a month after ClickBench threw pgrust off its leaderboard, and two days before Dan Luu held it up as his main example of what agent-built software can now do. His [essay](https://danluu.com/ambitious/) passed 500 points on Hacker News over the weekend.

## What v0.4-beta adds

The release post lists four changes:

- **Gravity**, a new query engine. A new Lisp-based intermediate representation feeds a rewritten JIT that now targets x86, ARM and WASM, where the old JIT only targeted ARM64. The project says Gravity runs "as much as 3× faster than ClickHouse" and that row-store queries over more than a few hundred rows can be up to 5x faster.
- **pgrcolumnar** gains full MVCC, fast inserts, updates and deletes, and a columnar index that sits on top of an ordinary row-store table. Standard index types such as B-tree, GIN and GiST work on columnar tables.
- **Automatic memory**: `work_mem` and the buffer cache size themselves from free memory, which pgrust says its single-process, thread-per-connection design makes possible.
- **Native statistics for `jsonb`** columns, so the planner can estimate selectivity inside JSON.

The post is plain about readiness: pgrust "is still experimental and not ready to be the primary database for data you cannot afford to lose." It suggests analytical replicas or test workloads, and lists memory as a known limit, with some large analytical queries refused rather than risk an out-of-memory crash. The repository is AGPL-3.0.

## How it was built

Michael Malis started pgrust in April. His [first post](https://malisper.me/pgrust-rebuilding-postgres-in-rust-with-ai/) says "coding agents, mainly Codex, have been a massive accelerant" and reports 250,000 lines in two weeks. A [July write-up](https://malisper.me/how-pgrust-was-built-four-attempts-to-rewrite-postgres-in-rust-with-ai/) says that after four attempts and $100,000, the team "succeeded in using Opus", running "up to 40 concurrent subagents for days" to produce 1.8 million lines of Rust. The post's title says the result passed 100% of the Postgres regression suite. Those figures are the author's; we have not counted them.

## The ClickBench removal

On 22 September, ClickHouse's Alexey Milovidov merged [ClickBench PR #2165](https://github.com/ClickHouse/ClickBench/pull/2165), titled "Remove pgrust: the entry is cheating (per-query kernels and result caching)". It says the submitted v0.4-preview binary embedded source files named after ClickBench query numbers, that hot runs replayed cached answers, and that the v0.4-preview source was not published. The PR reached Hacker News on 23 October.

Malis [answered there](https://news.ycombinator.com/item?id=50209450) the same day. He says the per-query code was a probe of the new IR that "does not run during the benchmark", and that the cache holds which predicates match dictionary strings, not query results, a kind of intermediate cache he says ClickBench allows. He concedes that the preview's new engine handled little SQL beyond the 43 benchmark queries. Luu writes that "the accusations of nefarious cheating seem to be false" and that Malis acknowledged the submission was premature. The v0.4-beta post still leads with the ClickHouse comparison, which is pgrust's own number, not a ClickBench listing.

## Bugs found in Postgres itself

Luu's case rests partly on testing. He links five reports to the pgsql-bugs list, copied to Malis's pgrust address. [BUG #19600](https://www.postgresql.org/message-id/19600-e5fb479f50f5022d%40postgresql.org), logged by Malis on 3 August against 19beta1, shows pgcrypto's `crypt()` returning text with a broken UTF-8 sequence that the server would reject as input but stores anyway. [BUG #19586](https://www.postgresql.org/message-id/19586-bb603bf5ad9934dd%40postgresql.org) is a money division overflow. A footnote in the essay notes that some of the reports were not considered bugs. Luu also says Malis now uses Lean to verify parts "too complex to do in Kani".

## Why it matters

pgrust is among the most ambitious agent-written Rust projects we have covered, after smaller efforts such as [php-rust](/posts/php-rust-wordpress-test-suite-parity/). It also shows the open problem with such projects: speed claims get checked by outsiders, and a premature benchmark entry can follow a project around. Malis's own request in the release post is for bug reports on any query where pgrust diverges from Postgres.

## Update, 26 October 2026: pgrust is back on ClickBench

ClickBench has accepted a new pgrust entry. Malis opened [PR #2751](https://github.com/ClickHouse/ClickBench/pull/2751), "pgrust: add v0.4-beta", on 22 October, and Milovidov merged it on 25 October. The [results page](https://benchmark.clickhouse.com/) now lists six pgrust v0.4-beta runs dated 25 October, on AWS c6a, c7a and c8g instances, all marked untuned. Milovidov left no comment on the PR.

The PR describes the caches the new entry uses. They are on by default, held in memory only, and cleared by restarting the server before each cold run. A condition cache stores match counts keyed by each filter and its constants, so "a repeated count-only query can be answered from those counts"; a lighter granule mode keeps only what ClickHouse's own query condition cache keeps, but the entry runs the default full mode. Malis also says the dictionary filter cache, which stayed on in the earlier submission when the condition cache was turned off, is now fixed. The merge means the entry passed ClickBench's review. It does not settle the earlier dispute.
