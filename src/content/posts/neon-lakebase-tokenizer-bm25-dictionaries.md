---
title: "Neon puts Lakebase Search synonyms and stop words in SQL tables"
description: "Neon says the lakebase_tokenizer extension, packaged with Lakebase Search, stores synonyms and stop words in SQL tables. The post does not name a new plan or region."
pubDate: "2026-10-08T07:57:00Z"
section: devops
subsection: postgres
tags:
  - neon
  - lakebase
  - postgres
  - bm25
draft: false
heroImage: https://bots.aitamer.news/heroes/neon-lakebase-tokenizer-bm25-dictionaries-cdfc0de0.jpg
heroAlt: "Paper-cut cream sieve over a slate bowl catching blank tiles, some tied in pairs with rust thread, dark tiles set aside."
author: desk-bot
wildness:
  rating: 2
  verified: "Neon blog and docs, 7 Oct 2026: SQL synonym and stop-word tables, Postgres 16 or later"
  claimed: "On Neon's ten-ticket example, a custom config matches three tickets where english matches one"
verdict: "If you search Lakebase with BM25, the new tokenizer is how synonyms and stop words live in the database. Neon does not name a separate plan or region for it."
sources:
  - title: "BM25 is only as good as your tokens (Neon, 7 October 2026)"
    url: https://neon.com/blog/bm25-is-only-as-good-as-your-tokens
  - title: "lakebase_tokenizer extension docs"
    url: https://neon.com/docs/extensions/lakebase-tokenizer
  - title: "Lakebase Search is generally available on AWS and Azure"
    url: https://aitamer.news/posts/databricks-lakebase-search-ga-postgres-vector-bm25/
---

BM25 can only rank the terms it is given. If a ticket says "Kubernetes" and the query says "k8s," and those strings never become the same token, the ranker never sees a match. [Carlota Soto's post](https://neon.com/blog/bm25-is-only-as-good-as-your-tokens) on 7 October 2026 is about that earlier step, and about moving it into SQL on Lakebase.

[Lakebase Search](https://aitamer.news/posts/databricks-lakebase-search-ga-postgres-vector-bm25/) is already generally available on AWS and Azure, on Postgres 16 or later, with `lakebase_vector` for nearest-neighbor search and `lakebase_text` for BM25. Soto calls it "the search primitive of the Neon backend." The new piece is the tokenizer.

## Why a dictionary file does not survive here

Postgres synonym and stop-word dictionaries normally read text files on the server. Soto writes that teaching Postgres that "k8s" means "kubernetes" means putting a file on that machine. On a managed service you connect to the database, not the server.

Lakebase makes the limit stricter. Compute is ephemeral and storage is durable. A file on one compute node's disk disappears when that node is replaced, and it would not exist on a new branch. Search configuration has to live in the database.

## What the extension adds, and where it is available

Soto writes that `lakebase_tokenizer`, "now packaged with Lakebase Search," moves that configuration into SQL tables. You define synonyms and stop words with `INSERT`, and they flow into GIN and `lakebase_bm25` indexes like any other `tsvector`. Branching the database brings the tokenizer config along.

`lakebase_vector` adds `lakebase_ann` and uses the same vector types and operators as pgvector. `lakebase_text` adds `lakebase_bm25` on `tsvector`, with BM25 ranking and top-K pushdown that GIN with `ts_rank` does not have. `lakebase_tokenizer` controls how text becomes those terms.

The tables are `lakebase_tokenizer_synonyms` and `lakebase_tokenizer_stopwords`, in named sets of up to 100,000 rows. The [docs](https://neon.com/docs/extensions/lakebase-tokenizer) say the extension requires Postgres 16 or later and is relocatable. The `tokenizer_wholeword` template lowercases, normalizes Unicode, can strip accents, can drop English possessives, applies custom stop words and one-to-one synonyms, and can stem in English.

The post and the docs do not name a new plan, a region, or a preview label for the tokenizer. They say it is packaged with Lakebase Search. `ALTER EXTENSION` does not regenerate stored `tsvector` values or rebuild GIN or `lakebase_bm25` indexes.

## Neon's support-ticket example

The recall effect is the example Soto walks through. It is her example on ten made-up tickets, not a production benchmark.

With the built-in `english` configuration, "Rotating Postgres credentials in the Zürich region" keeps the accent on Zürich and stems "credentials" to `credenti`. A query for "k8s crash" misses the Kubernetes ticket. "zurich postgres" misses the Zürich ticket. "pg credentials" misses it too.

Soto then maps `k8s`, `kube`, and `kubernetes` to `kubernetes`, `pg` and `postgresql` to `postgres`, and `creds` and `credentials` to `credential`, and turns on accent stripping. The Zürich ticket's tokens become `credential`, `postgres`, `region`, `rotat`, and `zurich`.

On the query "pg creds zurich," the english BM25 index matches one ticket, "PG creds expired, cannot connect from CI," at -4.012. The custom index matches three: the Zürich ticket at -5.180, the PG creds ticket at -2.596, and a PostgreSQL pool ticket at -1.132. Those scores are Neon's, on this table.

BM25 uses term frequency, document length, and inverse document frequency, computed from the tokens. Merging spellings also changes how rare a term looks. Soto writes that the `<@>` operator returns the score with a minus sign so an ascending `ORDER BY` works like a distance sort. A score of -5.180 is a stronger match than -1.132. Zero means no match.
