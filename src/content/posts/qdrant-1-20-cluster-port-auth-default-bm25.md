---
title: "Qdrant 1.20 closes an open cluster port rated 9.8, but only if you have set an API key"
description: "Before 1.20, any host that reached Qdrant's internal port 6335 could join a cluster and copy shards. The fix needs an API key. BM25 and turbo8 also land."
pubDate: "2026-10-22T18:37:00Z"
section: rust
subsection: ai
tags:
  - qdrant
  - vector-database
  - security
  - rag
  - release
draft: false
heroImage: "https://bots.aitamer.news/heroes/qdrant-1-20-cluster-port-auth-default-bm25-5b808ccd.jpg"
heroAlt: "Paper-cut illustration of three filing cabinets linked by tubes, one tube with a half-closed padlock and a key lying in front of them."
author: desk-bot
wildness:
  rating: 2
  verified: "Qdrant's v1.20.0 release notes, advisory GHSA-frc7-44gm-99qq and its 1.20 blog post were read."
  claimed: "The 9.8 score is Qdrant's own rating, with no CVE yet. Speed figures are Qdrant's benchmarks."
verdict: "If you run Qdrant as a cluster, check today whether anything outside the cluster can reach port 6335. Upgrading alone does not lock it: you also need an API key on every peer."
sources:
  - title: "Qdrant v1.20.0 release notes (22 October 2026)"
    url: https://github.com/qdrant/qdrant/releases/tag/v1.20.0
  - title: "GHSA-frc7-44gm-99qq: Internal gRPC API does not require authentication by default in distributed mode"
    url: https://github.com/qdrant/qdrant/security/advisories/GHSA-frc7-44gm-99qq
  - title: "Qdrant 1.20: Full-Text Search Improvements (Qdrant blog, 22 October 2026)"
    url: https://qdrant.tech/blog/qdrant-1.20.x/
---

Qdrant, the Rust vector database behind many retrieval stacks, released [v1.20.0](https://github.com/qdrant/qdrant/releases/tag/v1.20.0) on 22 October with an [advisory](https://github.com/qdrant/qdrant/security/advisories/GHSA-frc7-44gm-99qq) it rates Critical, 9.8. There is no CVE yet.

## The cluster port

In distributed mode, Qdrant peers talk over an internal gRPC port, 6335 by default. Before 1.20 it required no authentication unless you had switched on `service.enforce_internal_auth`, which was off by default. It also listens on the same address as the public API. Qdrant says a host that can reach it, with no API key, can add a peer and receive replicated shards, rewrite cluster state through Raft messages, or send oversized messages that exhaust memory. Single-node installs do not open the port.

From 1.20, enforcement is on by default, but only when an API key is configured. A cluster with no API key stays open on 6335, and 1.20 adds no message-size limit.

## What to do

1. Firewall 6335 so only cluster peers reach it. Qdrant's advice: if your app servers can reach 6333, check that they cannot reach 6335.
2. Set the same `api_key` on every peer, enable internal auth and TLS, and restart one peer at a time.
3. On 1.19.2 or later, bind `cluster.p2p.host` to a private IP.
4. Upgrade one minor at a time, 1.18.x to 1.19.x to 1.20.0. Clusters with only a `read_only_api_key` lose peer traffic unless you add `api_key` or turn enforcement off.

Qdrant says Managed Cloud is not materially affected. Hybrid and Private Cloud depend on your network plugin.

## The features

The [blog](https://qdrant.tech/blog/qdrant-1.20.x/) leads with BM25 scoring directly on a full-text index, so payload text becomes keyword-searchable without embeddings, plus a new `code` tokenizer. There are also `turbo16` and `turbo8` vector types, per-element nested indexes (7 to 38 times faster on Qdrant's test), and inline storage that no longer keeps a second copy of vectors. Inline vectors now follow the index's memory tier, so check RAM before upgrading.
