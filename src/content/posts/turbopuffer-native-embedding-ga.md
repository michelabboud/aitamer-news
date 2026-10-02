---
title: "turbopuffer native embedding GA: embed on write, query, or keep BYOE"
description: "turbopuffer made native embedding generally available (Sep 29, 2026): embed on write, on query, or keep BYOE. Systems overlap with index metadata fetch; Linear/Readwise beta color is vendor-stated."
pubDate: 2026-10-01T20:10:00Z
specimen: 152
section: dev
subsection: rag
tags:
  - turbopuffer
  - native-embedding
  - embeddings
  - rag
  - vector-search
  - byoe
  - search
  - ga
draft: false
heroImage: https://media.aitamer.news/heroes/turbopuffer-native-embedding-ga.jpg
heroAlt: "Paper-cut collage of a search engine block overlapping an embedding ribbon with an S3 metadata shelf, coral accent on the parallel path."
author: desk-bot
wildness:
  rating: 4
  verified: "Native embedding GA per turbopuffer eng blog Sep 29 2026; embed write/query/off; BYOE still supported"
  claimed: "Linear −150ms / Readwise −8× median embed latency = vendor beta customer color only"
verdict: "Native embedding GA inside turbopuffer; write, query and off are still optional. Statements from Linear and Readwise are attributed to them; no pricing or model catalog is given."
sources:
  - title: "Why moving embedding inside turbopuffer drops search latency — turbopuffer"
    url: https://turbopuffer.com/blog/native-embedding
---

turbopuffer announced **native embedding** as **generally available** in an engineering blog dated **2026-09-29** (Ben Linsay): you can offload embedding into the engine instead of always bringing your own ([eng blog](https://turbopuffer.com/blog/native-embedding)).

Historically turbopuffer was **BYOE** (bring your own embeddings). That path remains: native embedding can run **only for writes**, **only for queries**, or **not at all**—so teams that reuse embeddings across reads or namespaces are not forced to re-embed ([eng blog](https://turbopuffer.com/blog/native-embedding)).

## Systems angle (as turbopuffer states)

When embedding happens outside the engine, the query planner cannot overlap it with early query work. With native embedding, turbopuffer says the planner can run embedding in parallel with fetching namespace / index metadata (e.g. from S3) before the scan needs a query vector—still waiting on the vector before cluster pick and score ([eng blog](https://turbopuffer.com/blog/native-embedding)).

That is a **systems latency** story about where embedding runs, not a new named encoder model or a published model catalog. The post does not list embedding models or prices; this brief invents neither.

## Customer color (vendor beta)

During beta, turbopuffer says **Linear** shaved **150ms** off its embedding pipeline and **Readwise** reduced median embedding latency by **8×**. Treat those as **vendor-reported customer results**, not independent newsroom measurements. turbopuffer adds that it is seeing similar gains now that native embedding is generally available ([eng blog](https://turbopuffer.com/blog/native-embedding)).

## Roadmap (not this GA)

Still **coming soon / stay tuned** per the same post: native reranking, better document parsing and chunking, search agents, and async re-embedding of an entire namespace. Future automatic caching of repeated embeds is also framed as a later version—not current GA ([eng blog](https://turbopuffer.com/blog/native-embedding)).

## Who should care

Teams on turbopuffer who want embedding inside the engine—for write, query, or neither—should start at the [native embedding post](https://turbopuffer.com/blog/native-embedding). Keep BYOE available where reuse wins, attribute Linear/Readwise figures to turbopuffer, and leave pricing and embedder catalogs to docs the vendor has not put in this announcement.
