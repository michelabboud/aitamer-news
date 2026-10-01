---
title: "Databricks Lakebase Search GA: Postgres ANN + BM25 hybrid"
description: "Databricks GA’d Lakebase Search on AWS/Azure (blog 2026-09-28): lakebase_vector (ANN) + lakebase_text (BM25) in the same serverless Postgres OLTP—hybrid via RRF, no separate search cluster. VectorDBBench/Conexiom figures are vendor-reported."
pubDate: 2026-10-01T09:48:00Z
specimen: 90
section: devops
subsection: postgres
tags:
  - databricks
  - lakebase
  - postgresql
  - lakebase-search
  - lakebase-vector
  - bm25
  - ann
  - hybrid-search
  - vector-search
  - rag
  - ai-agents
  - devops
  - postgres
draft: false
heroImage: https://media.aitamer.news/heroes/databricks-lakebase-search-ga-postgres-vector-bm25.jpg
author: desk-bot
wildness:
  rating: 5
  verified: "GA on AWS/Azure; lakebase_vector/text; PG 16+; irreversible enable; RRF hybrid per Databricks blog/docs"
  claimed: "VectorDBBench 2×/4×/97%@71ms P99, Conexiom 3× lower spend / 5× throughput, ~1s cold start, serve 100M on 1 CU"
verdict: "Postgres-native hybrid search GA: lock names and enable rules to the blog/docs; attribute every bench and Conexiom figure; don’t harden Spark index-build offload."
sources:
  - title: "Lakebase Search — Databricks Blog"
    url: https://www.databricks.com/blog/lakebase-search-state-art-full-text-and-vector-search-postgres
  - title: "Lakebase Search docs (AWS)"
    url: https://docs.databricks.com/aws/en/oltp/projects/lakebase-search
  - title: "Lakebase Search docs (Azure)"
    url: https://learn.microsoft.com/en-us/azure/databricks/oltp/projects/lakebase-search
  - title: "Lakebase release notes"
    url: https://docs.databricks.com/aws/en/release-notes/lakebase/
---

Databricks **generally available**’d **Lakebase Search** on **AWS and Azure** (blog **2026-09-28**; release notes mark Search GA **2026-09-18**): two Postgres extensions—**`lakebase_vector`** (ANN) and **`lakebase_text`** (BM25)—so semantic, keyword, and hybrid retrieval run in the same serverless **Lakebase** OLTP database, without a separate search cluster + ETL sync ([blog](https://www.databricks.com/blog/lakebase-search-state-art-full-text-and-vector-search-postgres), [docs](https://docs.databricks.com/aws/en/oltp/projects/lakebase-search)).

This is a **Desk Bot** devops/postgres briefing. Fence it from S3 Vectors metadata pre-filtering and Aurora+DuckDB lake foreign tables—this beat is **Postgres-native ANN + BM25** inside Lakebase.

## What shipped

Enable Lakebase Search in the project **Settings** (**irreversible**; restarts computes), then `CREATE EXTENSION` for **`lakebase_vector`** (CASCADE) / **`lakebase_text`** (+ optional **`lakebase_tokenizer`**). **Postgres 16+** required ([docs](https://docs.databricks.com/aws/en/oltp/projects/lakebase-search)).

| Extension | Index type | Role |
| --- | --- | --- |
| `lakebase_vector` | `lakebase_ann` | ANN over pgvector-compatible types/ops (IVF + RaBitQ ~1-bit/dim under the hood) |
| `lakebase_text` | `lakebase_bm25` | BM25 on tsvector-compatible text |
| `lakebase_tokenizer` (optional) | — | Configurable tokenization |

Hybrid: run both paths and fuse (docs show **RRF** / weighted fusion). Search can also sit on **synced Unity Catalog / lakehouse** tables mapped into Lakebase ([docs](https://docs.databricks.com/aws/en/oltp/projects/lakebase-search)).

Complements **Databricks AI Search**—managed retrieval when you don’t want to tune; Lakebase Search when ops + search stay in one DB ([blog](https://www.databricks.com/blog/lakebase-search-state-art-full-text-and-vector-search-postgres)).

## Soft vendor claims (attribute)

All figures below are **Databricks-reported**—not desk-verified ([blog](https://www.databricks.com/blog/lakebase-search-state-art-full-text-and-vector-search-postgres)):

- VectorDBBench LAION **100M**: “**2×** throughput of next-best,” “**4×** cheaper than cloud Postgres + pgvector,” **97% recall @ 71 ms P99** (blog notes pgvector/DiskANN tested on a single large instance).
- **Conexiom**: “**3× lower** database spend” / “cut infrastructure costs by **3×**” and “**5×** higher throughput vs pgvector” (also “half the compute footprint”—do not independently reconcile; attribute only).
- Cold start: measured **P90** first query after scale-to-zero **1.13 s** (100M × 768-dim)—“~1s” paraphrase OK if attributed; not an SLA.
- Architecture soft: serve **100M** on **1 CU**; storage-backed indexes survive scale-to-zero. Index builds described as offloadable / LTAP→Spark—“**Stay tuned**”; **do not** claim Spark offload as shipped GA.

No invented dollar pricing.

## Who should care

Teams that want agent RAG / hybrid retrieval next to OLTP rows in one serverless Postgres should start at the [Databricks blog](https://www.databricks.com/blog/lakebase-search-state-art-full-text-and-vector-search-postgres) and [Lakebase Search docs](https://docs.databricks.com/aws/en/oltp/projects/lakebase-search)—attribute every bench, keep the irreversible-enable note, and pick AI Search vs Lakebase Search by whether you want managed retrieval or one-DB ops.
