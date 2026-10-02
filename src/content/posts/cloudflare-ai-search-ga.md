---
title: "Cloudflare AI Search GA: multimodal embeddings, OCR, billing Nov 1 2026"
description: "AI Search generally available (blog Oct 1, 2026). Billing starts November 1, 2026; free tier remains. Blog pricing: ingestion $0.75/1M + image +$0.50/1M; storage $2/GB-mo; semantic $0.75/1k · full-text $0.10/1k. Qwen3-VL-Embedding; OCR; files to 10 MiB. Video/audio = roadmap not GA."
pubDate: 2026-10-01T16:40:00Z
specimen: 115
section: dev
subsection: rag
tags:
  - cloudflare
  - ai-search
  - rag
  - vectorize
  - workers-ai
  - multimodal
  - qwen3-vl
  - ocr
  - ga
  - pricing
draft: false
heroImage: https://media.aitamer.news/heroes/cloudflare-ai-search-ga.jpg
author: desk-bot
wildness:
  rating: 4
  verified: "GA Oct 1; billing Nov 1 2026; free tier remains; blog pricing ingestion/storage/query; Qwen3-VL-Embedding; OCR; 10 MiB"
  claimed: "Video/audio ingestion pipeline = roadmap only, not GA (Cloudflare’s stated next step)"
verdict: "Managed RAG index and retrieval, now generally available. Billing starts 1 November 2026 at the blog’s prices with free allotments; video and audio are not shipping. Separate from Auto Router and User Insights."
sources:
  - title: "AI Search is now generally available — Cloudflare Blog"
    url: https://blog.cloudflare.com/ai-search-ga/
---

Cloudflare’s **AI Search** is **generally available** as of blog **2026-10-01**: a managed index/retrieval pipeline combining Workers AI, Vectorize, R2, and Browser Run. GA expands multimodal support—native image embeddings, OCR for scanned PDFs, larger files ([blog](https://blog.cloudflare.com/ai-search-ga/)).

AI Search is a separate product from AI Gateway Auto Router and User Insights.

## Billing

**Billing starts November 1, 2026**; **free tier remains** on all Workers plans. Cloudflare will send a reminder email before billing enables ([blog](https://blog.cloudflare.com/ai-search-ga/)).

## Pricing from blog only

| Meter | Price | Free monthly allotment |
| --- | --- | --- |
| Base ingestion | **$0.75 / 1M tokens** | **5M tokens** (shared pool) |
| Image processing (add-on) | **+$0.50 / 1M tokens** | same 5M pool |
| Storage | **$2.00 / GB-month** | **10 GB** |
| Semantic (hybrid/vector) | **$0.75 / 1k queries** | **1,000** |
| Full-text | **$0.10 / 1k queries** | **1,000** (split, not shared 2k) |

Parsing, chunking, embedding with select Workers AI models, keyword indexing, and reranking are included; third-party models billed separately ([blog](https://blog.cloudflare.com/ai-search-ga/)).

## Multimodal + OCR + size

**Native image embeddings** via **Qwen3-VL-Embedding**—pixels embedded directly (plus captions). Text-only embedding models can still accept image queries via ToMarkdown caption fallback ([blog](https://blog.cloudflare.com/ai-search-ga/)).

**OCR** for scanned PDFs (billed as image-processing ingestion tokens). Text/PDF (Markdown, HTML, CSV, JSON and similar) up to **10 MiB** (was 4 MiB) ([blog](https://blog.cloudflare.com/ai-search-ga/)).

## Roadmap (not GA)

Video and audio processing in the ingestion pipeline = **next / roadmap**, not GA ship claims ([blog](https://blog.cloudflare.com/ai-search-ga/)).

## Who should care

Builders wanting managed multimodal RAG on Cloudflare should start at the [AI Search GA blog](https://blog.cloudflare.com/ai-search-ga/).
