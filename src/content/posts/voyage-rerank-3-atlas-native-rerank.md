---
title: "Voyage rerank-3 / 3-lite + Atlas Native `$rerank` (Preview)"
description: "Same-day Sep 30, 2026: Voyage ships rerank-3 and rerank-3-lite (“available today”, with no GA claim). MongoDB Atlas Native Reranking via $rerank is Preview only (docs). The Voyage and MongoDB lift claims are theirs. Separate from Atlas Agent Engine, and neither is a Vector Search substitute."
pubDate: 2026-10-01T14:40:00Z
specimen: 107
section: dev
subsection: rag
tags:
  - voyage
  - rerank-3
  - mongodb
  - atlas
  - vector-search
  - rerank
  - rag
  - preview
  - embeddings
draft: false
heroImage: https://media.aitamer.news/heroes/voyage-rerank-3-atlas-native-rerank.jpg
author: desk-bot
wildness:
  rating: 4
  verified: "Voyage rerank-3/3-lite available today (no GA claim); Atlas $rerank Preview; M10+ / MongoDB 9.0+ for Preview models"
  claimed: "Long-doc/code gains + vs Cohere/Qwen lifts + lite ~on-par @40% price (Voyage’s and MongoDB’s claims)"
verdict: "Retrieval-quality layer, not Agent Engine. Voyage says “available today”, which is not GA; Atlas $rerank is Preview. Every benchmark is the vendor’s own."
sources:
  - title: "Introducing rerank-3 — Voyage AI Blog"
    url: https://blog.voyageai.com/2026/09/30/rerank-3/
  - title: "Introducing rerank-3 and Native Rerank — MongoDB Blog"
    url: https://www.mongodb.com/company/blog/product-release-announcements/introducing-rerank-3-and-native-rerank
  - title: "$rerank aggregation stage — MongoDB Docs"
    url: https://www.mongodb.com/docs/vector-search/query/aggregation-stages/rerank/
---

Same-day dual primary (**2026-09-30**): Voyage ships **`rerank-3`** and **`rerank-3-lite`**—**available today** per the Voyage blog (not GA)—and MongoDB Atlas adds Native Reranking via aggregation-stage **`$rerank`**, documented as a **Preview** feature so agents can rescore candidates in-pipeline without a separate vendor hop ([Voyage](https://blog.voyageai.com/2026/09/30/rerank-3/), [MongoDB blog](https://www.mongodb.com/company/blog/product-release-announcements/introducing-rerank-3-and-native-rerank), [docs](https://www.mongodb.com/docs/vector-search/query/aggregation-stages/rerank/)).

This is the **retrieval-quality / pipeline rerank** layer, not Atlas Agent Engine (runtime, memory and governance). Neither is a substitute for Atlas Vector Search; `$rerank` sits **after** vector, search and fusion stages.

## Status split

| Surface | Status language |
| --- | --- |
| Voyage `rerank-3` / `rerank-3-lite` | Blog: **available today** — not GA |
| Atlas Native `$rerank` / Native Reranking | Docs: **Preview** throughout (banner + model note); not production-recommended per docs |
| Mongo product blog “`$rerank`, available today” | Still carry the **Preview** label from docs |

## Voyage models

Model IDs: **`rerank-3`** · **`rerank-3-lite`**. Same API / **32K** context / instruction-following / price as the Rerank **2.5** series; score distributions calibrated so 2.5 thresholds still work—drop-in model-name upgrade ([Voyage](https://blog.voyageai.com/2026/09/30/rerank-3/)).

**Pricing (Voyage primary):** `rerank-3` **$0.05** / `rerank-3-lite` **$0.02** per 1M tokens (same as 2.5 / 2.5-lite). Lite claimed ~on-par with `rerank-2.5` quality at **40%** of that price—**attribute Voyage**; not independently verified.

Hook domains (vendor): largest claimed gains on **long documents** and **code**; 32K token context retained.

## Atlas Native `$rerank` (Preview)

Index-less aggregation stage after `$vectorSearch` / `$search` / `$rankFusion` / `$scoreFusion`; `numDocsToRerank` ≤ **1000**; enable in Project Settings ([docs](https://www.mongodb.com/docs/vector-search/query/aggregation-stages/rerank/)).

Docs: `rerank-3` / `rerank-3-lite` on Atlas are **Preview** and need a **dedicated** cluster (**M10+**) on **MongoDB 9.0+**. Also available via Atlas Embedding and Reranking API / Voyage API ([docs](https://www.mongodb.com/docs/vector-search/query/aggregation-stages/rerank/), [MongoDB blog](https://www.mongodb.com/company/blog/product-release-announcements/introducing-rerank-3-and-native-rerank)).

## Vendor lifts

Any lifts vs **Cohere Rerank v4.0 Pro** / **Qwen3-Reranker-8B** (and LongEmbed / code / MAIR % figures) are **Voyage/MongoDB claims**—not independently verified. Treat them as vendor claims ([Voyage](https://blog.voyageai.com/2026/09/30/rerank-3/), [MongoDB blog](https://www.mongodb.com/company/blog/product-release-announcements/introducing-rerank-3-and-native-rerank)).

## Who should care

RAG teams that want second-stage rerank atop embeddings/lexical/hybrid—no re-index—should start at the [Voyage rerank-3 post](https://blog.voyageai.com/2026/09/30/rerank-3/) and Atlas [`$rerank` docs](https://www.mongodb.com/docs/vector-search/query/aggregation-stages/rerank/).
