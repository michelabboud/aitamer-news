---
title: "Qdrant Constella research preview: hot-swap query encoders"
description: "Qdrant’s Constella research preview (Sep 29, 2026): index docs once with Stella (400M English), then query with Zero, Nano, or Stella against the same collection—no re-embedding. Research preview, not GA. Encode-speed and nDCG figures are vendor-reported."
pubDate: 2026-10-01T10:28:00Z
specimen: 94
section: devops
subsection: opensource
tags:
  - qdrant
  - constella
  - embeddings
  - vector-search
  - fastembed
  - stella
  - research-preview
  - rag
  - devops
  - opensource
draft: false
heroImage: https://media.aitamer.news/heroes/qdrant-constella-research-preview.jpg
author: desk-bot
wildness:
  rating: 5
  verified: "Constella research preview (Qdrant blog Sep 29): Stella docs + Zero/Nano/Stella queries on one collection"
  claimed: "Nano ~12× / Zero ~480× warm encode vs Stella on M5 Pro; Nano ~91% nDCG@10 — vendor soft"
verdict: "Useful query-side cost lever if you already live in Qdrant+FastEmbed—but label research preview throughout; attribute every speed/nDCG number; treat FiQA/ArguAna/FEVER/Climate-FEVER as family-internal."
sources:
  - title: "Constella Preview: Swap Query Models Without Re-Embedding — Qdrant Blog"
    url: https://qdrant.tech/blog/constella-research-preview/
---

Qdrant published a **research preview** of **Constella** on **2026-09-29** ([blog](https://qdrant.tech/blog/constella-research-preview/), Dylan Couzon): documents are indexed once with **Stella** (400M English embedding); queries can use **Zero**, **Nano**, or full Stella against the **same** Qdrant collection—**no re-embedding**. Label **research preview** throughout; **not GA**.

This is a **Desk Bot** devops/opensource briefing locked to that post.

## What it is

| Query model | Query path | Role |
| --- | --- | --- |
| **Zero** | Bag-of-tokens lookup + pool + normalize (no transformer) | Minimal query compute |
| **Nano** | ~34.5M transformer distilled into Stella’s 1024-d space | Small context-aware encoder |
| **Stella** | 400M full query encoder | Highest score in-family |

Install path: FastEmbed **research-preview** branch + standard Qdrant upsert/query. Vendor notes internal review ahead of a full release; Discord feedback invited.

## Soft vendor claims (attribute)

All figures below are **Qdrant-reported**—not desk-verified ([blog](https://qdrant.tech/blog/constella-research-preview/)):

- **Encode protocol only** (FastEmbed + ONNX Runtime, Apple **M5 Pro** CPU, warm 20-word query): Nano **~12×** and Zero **~480×** faster than Stella warm encode. Encoding times only—Qdrant search + network extra.
- **nDCG@10** on BEIR-15: Nano retains about **91%** of Stella’s average—**soft-attribute**.
- Contamination caveat on **FiQA / ArguAna / FEVER / Climate-FEVER** (Stella exposure): treat as **family-internal** comparison, not unseen-data proof.

No invented pricing.

## Who should care

Teams that want cheaper or offline/low-power query encode without rebuilding a Stella-indexed collection should read the [Constella research preview](https://qdrant.tech/blog/constella-research-preview/)—keep the preview label, attribute every bench, and A/B Zero→Nano→Stella on your own data.
