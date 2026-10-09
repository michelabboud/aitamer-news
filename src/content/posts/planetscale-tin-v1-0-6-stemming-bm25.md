---
title: "PlanetScale TIN 1.0.6 speeds tied BM25 top-k queries, and 1.0.4 added stemming"
description: "PlanetScale says TIN 1.0.6, rolling out over the next week, uses a block-max plan for BM25 top-k queries that also sort by a heap column. Stemming for 18 languages arrived in 1.0.4 and needs a rebuild."
pubDate: "2026-10-09T07:37:00Z"
specimen: 664
section: devops
subsection: postgres
tags:
  - planetscale
  - tin
  - postgres
  - bm25
  - paradedb
draft: false
heroImage: https://bots.aitamer.news/heroes/planetscale-tin-v1-0-6-stemming-bm25-dbc775fd.jpg
heroAlt: "Paper-cut illustration of an open card-catalogue drawer with a yellow-leaved paper tree growing from its index cards and a blue arrow pointing out of the drawer."
author: desk-bot
wildness:
  rating: 4
  verified: "PlanetScale published the 8 October post, the 30 September 1.0.4 note, and the method"
  claimed: "The QPS and p99 multiples are PlanetScale's own benchmark against ParadeDB 0.26.0"
verdict: "Stemming is a real index option, and it costs a rebuild. Treat the 3.1 to 5.0 times throughput claim as PlanetScale's read-only benchmark, and compare tin.score with tin.full_score before you trust the ranking."
sources:
  - title: "TIN v1.0.6: 2-3x faster, with support for stemming (PlanetScale, 8 October 2026)"
    url: https://planetscale.com/blog/tin-v106
  - title: "Corpus and test environment (PlanetScale TIN v1.0.6)"
    url: https://planetscale.com/blog/tin-v106#corpus-and-test-environment
  - title: "TIN 1.0.4: word stemming and score tie-breaking (PlanetScale changelog, 30 September 2026)"
    url: https://planetscale.com/changelog/tin-1-0-4
  - title: "PlanetScale fork of the ParadeDB benchmarker"
    url: https://github.com/planetscale/paradedb-benchmarker
  - title: "rust-stemmers supported algorithms"
    url: https://github.com/CurrySoftware/rust-stemmers
  - title: "Snowball stemming"
    url: https://snowballstem.org/
  - title: "PlanetScale Released Text Search and We Have a Lot to Say, Part I (ParadeDB, 1 October 2026)"
    url: https://www.paradedb.com/blog/opening-a-closed-tin
  - title: "ParadeDB 0.26.0 ships vector pushdown for RRF and a vector tie-break"
    url: https://aitamer.news/posts/paradedb-0-26-vector-rrf/
---

PlanetScale says its Postgres full-text extension, TIN, is faster again on a query a rival had briefly won. On 8 October 2026, Patrick Reynolds and Eric Ridge published [TIN v1.0.6](https://planetscale.com/blog/tin-v106). v1.0.4 shipped the week before. v1.0.6 is rolling out to all customers over the next week. The speed numbers are PlanetScale's own benchmark. The title says "2-3x faster." The summary states a wider range: 3.1 to 5.0 times higher throughput for the default score on x86-64.

BM25 ranks keyword matches from term frequency, document length, and how rare each term is in the corpus. A top-k query asks for the best rows, often ten.

Stemming stores related words as one term. PlanetScale maps `running`, `runs`, and `run` to `run`, and says the stem of `database` is `databas`. TIN uses [rust_stemmers](https://github.com/CurrySoftware/rust-stemmers) and [Snowball](https://snowballstem.org/) for 18 languages: Arabic, Armenian, Danish, Dutch, English, French, German, Greek, Hungarian, Italian, Norwegian, Portuguese, Romanian, Russian, Spanish, Swedish, Tamil, and Turkish. An existing index must be rebuilt. The [30 September v1.0.4 changelog](https://planetscale.com/changelog/tin-1-0-4) says to `REINDEX` after a stemming change. The October post shows `ALTER EXTENSION tin UPDATE`, then `CREATE INDEX CONCURRENTLY` with `stemmer = 'en'`, then `DROP INDEX CONCURRENTLY`. The cluster needs at least v1.0.4.

A heap-attribute tiebreaker is an extra `ORDER BY` column from the table row, used when scores tie. The post's example is `ORDER BY tin.score(ctid) DESC, created_at DESC, id`. Block-max skips work during top-k. [ParadeDB's 1 October post](https://www.paradedb.com/blog/opening-a-closed-tin) says postings are split into blocks, each block stores the highest score a term in that block could add, and a block is skipped when that maximum cannot beat the current top-k threshold. PlanetScale says general-availability TIN already used block-max for a plain score sort, and that a tiebreaker query had to score every match. v1.0.6 uses the block-max plan for both. The v1.0.4 note also says extra `ORDER BY` keys can keep a bounded top-k scan. The October post is the one that assigns the block-max tiebreaker path to v1.0.6, and it says the index format did not change, so the speed path does not need a rebuild.

## PlanetScale's own benchmark

Method and hardware are in [Corpus and test environment](https://planetscale.com/blog/tin-v106#corpus-and-test-environment). The harness is [PlanetScale's benchmarker fork](https://github.com/planetscale/paradedb-benchmarker). The corpus is 85 GB of Stack Exchange posts, 150 million documents, and 1,254 queries as disjunctions, conjunctions, and phrases, on an i7i.8xlarge and an i8g, in 8-vCPU containers with 64 GB of RAM. ParadeDB is 0.26.0. TIN is v1.0.6. That tag's vector pushdown is covered in [ParadeDB 0.26.0 ships vector pushdown for RRF](https://aitamer.news/posts/paradedb-0-26-vector-rrf/).

For default `tin.score` versus ParadeDB on x86-64, PlanetScale reports 3.1 to 5.0 times higher throughput and 2.7 to 4.4 times lower p99. On ARM64 those ranges are 3.1 to 4.2 times and 2.1 to 3.0 times. For `tin.full_score`, which scores every term, x86-64 is 1.3 to 3.0 times the throughput and 1.6 to 2.2 times lower p99. ARM64 full-score ranges are 1.3 to 2.4 times and 1.2 to 1.7 times. PlanetScale calls this a best case: a frozen table, one-shot index build, and a clean `VACUUM`.

`tin.score` omits terms that appear in more than 10 percent of documents from the BM25 sum. Those terms still match. They drop out of the score only. ParadeDB says the same cutoff means the two engines are not computing the same ranking under TIN's default. PlanetScale says `tin.full_score(ctid)` includes every term, and `tin.score(ctid, dense_ratio => F)` moves the cutoff. ParadeDB says the 0.26 changes it measured on 0.26.0-rc.2 need a reindex to inherit all of its optimizations. PlanetScale says it reran against final 0.26.0.

## Practical takeaway

Stemming needs a rebuild, on v1.0.4 or newer. The v1.0.6 speed change is a one-week rollout and, on PlanetScale's account, does not need a new index. Read the multiples as PlanetScale's read-only benchmark. If common words should affect rank order, compare `tin.score` with `tin.full_score` on your queries.
