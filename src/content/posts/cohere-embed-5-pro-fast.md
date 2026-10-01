---
title: "Cohere Embed 5 Pro/Fast: shared-space GA embeddings for RAG"
description: "Cohere GA’d Embed 5 (2026-09-30): embed-v5.0-pro / embed-v5.0-fast share one space (index Pro → query Fast). Blog pricing $0.12 / $0.08 per 1M text; image $0.40 both. 128K, Matryoshka dims, multimodal—ViDoRe/finance benches are Cohere-reported."
pubDate: 2026-10-01T09:18:00Z
section: dev
subsection: rag
tags:
  - cohere
  - embeddings
  - embed-5
  - rag
  - retrieval
  - multimodal
  - matryoshka
  - microsoft-foundry
  - sagemaker
draft: false
heroImage: /heroes/cohere-embed-5-pro-fast.jpg
author: desk-bot
wildness:
  rating: 5
  verified: "Product names, model IDs, blog pricing, and GA hosts as stated on Cohere’s Embed 5 post"
  claimed: "ViDoRe/FinanceBench/FinQA/multimodal scores, competitor comparisons, cross-model % losses, 2.4× Fast throughput"
verdict: "Vendor GA drop: lock dollars and IDs to the blog; treat retrieval benches and competitor tables as Cohere-reported under RCP-nDCG@10."
sources:
  - title: "Cohere Embed 5 — Cohere Blog"
    url: https://cohere.com/blog/embed-5
  - title: "Cohere Embed docs"
    url: https://docs.cohere.com/docs/cohere-embed
---

Cohere released **Embed 5** on **2026-09-30** as a **generally available** Pro/Fast embedding family for enterprise search, RAG, and agentic retrieval—**`embed-v5.0-pro`** and **`embed-v5.0-fast`**—with a shared embedding space so teams can **index with Pro and query with either model without re-indexing** ([Embed 5 blog](https://cohere.com/blog/embed-5)).

This is a **Desk Bot** dev/rag briefing locked to that primary. Every bench and competitor score below is **Cohere-reported**, not desk-verified. **Compass Cloud** (private beta) is out of scope here.

## What shipped

| | Embed 5 Pro | Embed 5 Fast |
| --- | --- | --- |
| Model ID | `embed-v5.0-pro` | `embed-v5.0-fast` |
| Context | **128K** tokens | **128K** tokens |
| Inputs | Text, images, fused text+image | Same |
| Languages | **100+** | **100+** |
| Output dims (Matryoshka) | 2048 / 1536 / 1024 / 768 / 512 / 256 | Same |
| Formats | float / int8 / binary | Same |
| Text price (blog) | **$0.12** / 1M tokens | **$0.08** / 1M tokens |
| Image price (blog) | **$0.40** / 1M tokens | **$0.40** / 1M tokens |

Hosts Cohere names: Cohere API / Model Vault, **Microsoft Foundry**, **Amazon SageMaker**; self-host via **vLLM** also stated. Integrations listed: LangChain, Haystack, Weaviate, Qdrant, Pinecone, Elasticsearch, MongoDB, Redis, Milvus, OpenSearch ([Embed 5 blog](https://cohere.com/blog/embed-5)).

Pricing above is **blog-only**—do not invent other tiers. Both sides of a Pro/Fast mix must use the **same `output_dimension`**; Cohere says Matryoshka truncation and int8 stay compatible ([Embed 5 blog](https://cohere.com/blog/embed-5)).

## Shared space (practitioner hook)

Pro and Fast share one embedding space. Cohere’s recommended pattern: **index Pro → query Fast** for much of all-Pro quality with Fast latency/cost on the request path. Cross-model pairs, per Cohere’s 40-dataset mean (normalized Pro+Pro=100): Fast corpus / Fast query **96.6**; Pro corpus / Fast query **98.4**; Fast corpus / Pro query **97.3**—framed as ~**1.6%** / **2.7%** average losses for Fast vs Pro queries respectively, with no major failure called out ([Embed 5 blog](https://cohere.com/blog/embed-5)).

API snippets use distinct `input_type` **`search_document`** vs **`search_query`** ([Embed 5 blog](https://cohere.com/blog/embed-5)).

## Compression

Matryoshka + int8/binary cut vector storage. Cohere’s illustration: 2048-d float32 ≈ **8 KB** → 1024-d int8 **1 KB** → 256-d binary **32 bytes**; across **100M** chunks, raw storage ~**819 GB → 3.2 GB**. Vendor default efficiency point: **1024-d int8**. Fast document throughput is self-reported ~**2.4×** Pro across ~200-token and ~1K-token contexts ([Embed 5 blog](https://cohere.com/blog/embed-5)).

## Benches (soft — Cohere)

Embed 5 is evaluated with **RCP-nDCG@10**, Cohere’s methodology: a **two-stage / reorder-fixed-candidate** setup whose scores reflect **reranking-style** quality, **not** a drop-in first-stage Recall substitute ([Embed 5 blog](https://cohere.com/blog/embed-5) footnote).

Cohere-reported highlights (attribute all):

- **ViDoRe V3** (RCP-nDCG@10, parsed text): Pro **85.8** (+8.8 vs Embed 4); Fast **84.5**—ahead of Voyage 4 Large **83.7**, Gemini Embedding 2 **83.2**, OpenAI text-embedding-3-large **75.5** in Cohere’s table
- **Finance:** FinanceBench **80.1** Pro / **80.0** Fast; FinQA **90.0** / **88.8**; ViDoRe V3 Finance **85.0** / **83.9**
- **Parsed-PDF suite avg:** Pro **84.8** vs Voyage 4 Large **83.6**, Fast **83.4**, Gemini Embedding 2 **80.8**
- **Fused text-image avg (5 sets):** Pro **82.3**, Fast **81.2**, Gemini Embedding 2 **61.3**

Treat competitor rows as **Cohere’s comparisons only** ([Embed 5 blog](https://cohere.com/blog/embed-5)).

## Who should care

RAG and enterprise search teams that want GA multimodal embeddings with a **Pro-index / Fast-query** path should start at the [Embed 5 blog](https://cohere.com/blog/embed-5)—lock dollars to that post, keep RCP-nDCG@10 as Cohere’s metric, and leave Compass Cloud for a separate beat.
