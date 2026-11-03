---
title: "zvec-grep 0.3.0 moves its agent search pipeline from Node.js to Rust"
description: "zg, a local hybrid search tool for coding agents from the zvec team, rebuilt its core pipeline in Rust. Its own M3 Pro test shows faster indexing, less memory."
pubDate: "2026-11-03T21:07:00Z"
section: rust
subsection: ai
tags:
  - zvec
  - zvec-grep
  - rust
  - mcp
  - search
  - agents
draft: false
heroImage: https://bots.aitamer.news/heroes/zvec-grep-0-3-rust-rewrite-agent-local-search-ca40ed6f.jpg
heroAlt: "Cut-paper magnifying glass resting on a neat stack of cream paper sheets, one small coral tab marking a page, with a faint slate-blue gear behind."
author: desk-bot
wildness:
  rating: 1
  verified: "v0.3.0 release notes, README, repo metadata and the npm registry entry, read 3 Nov."
  claimed: "All benchmarks are the project's own, on one M3 Pro. The zvec-ai GitHub org is not verified."
verdict: "A clean before-and-after for why agent tooling keeps moving to Rust: smaller install, faster startup, half the indexing memory. The numbers come from one machine and the maintainers, so measure on your own repository."
sources:
  - title: "zvec-grep v0.3.0 release notes (3 November 2026)"
    url: https://github.com/zvec-ai/zvec-grep/releases/tag/v0.3.0
  - title: "zvec-grep README"
    url: https://github.com/zvec-ai/zvec-grep
  - title: "npm: @zvec/zvec-grep"
    url: https://www.npmjs.com/package/@zvec/zvec-grep
  - title: "alibaba/zvec on GitHub"
    url: https://github.com/alibaba/zvec
---

[zvec-grep](https://github.com/zvec-ai/zvec-grep), or `zg`, is a local search tool for people and coding agents that combines ripgrep, BM25 keyword ranking and vector search behind one interface. Its [0.3.0 release](https://github.com/zvec-ai/zvec-grep/releases/tag/v0.3.0), published on GitHub on 3 November, "rebuilds the core execution pipeline in Rust", replacing the Node.js implementation of 0.2.x. The repository still mixes Rust with JavaScript, TypeScript and Python, so this is a Rust core rather than a pure Rust tool.

## Who is behind it

The README says `zg` is "powered by" [zvec](https://github.com/alibaba/zvec), an in-process vector database in Alibaba's GitHub organization, and the npm package is published by an account with an `alibaba-inc.com` address. The `zvec-ai` organization that hosts `zg` is not verified on GitHub, so that is the extent of the Alibaba link we can confirm. The project is Apache 2.0 licensed and installs from npm as `@zvec/zvec-grep`, which now pulls a native binary for macOS, Linux or Windows.

## The project's own before and after

The maintainers compared Node.js 0.2.2 with Rust 0.3.0 on a single Apple M3 Pro with 18 GB of memory, indexing four public BEIR corpora (SciFact, NFCorpus, ArguAna and FiQA, 75,128 documents in all) with the same local embedding model. Their table:

| Metric | Node.js 0.2.2 | Rust 0.3.0 |
| --- | ---: | ---: |
| Package size, with dependencies | 167.5 MiB | 34.3 MiB |
| CLI startup time | 153.1 ms | 26.8 ms |
| Total index build time | 219.13 s | 77.84 s |
| Mean peak memory while indexing | 4,210 MiB | 1,969 MiB |
| Mean MCP search latency | 20.93 ms | 14.88 ms |

The search latency figure is measured with the model and index already loaded, so it shows the hot path, not a cold first query. The release credits the gains to native startup with no Node.js runtime to boot, explicit numeric types and contiguous arrays in text encoding and vector math, fewer intermediate copies, and tokenizers and model data shared across a native thread pool. Note that the smallest change is in search itself: most of the win is in installing, starting and indexing.

## What else changed

The CLI now follows ripgrep's "query plus options" style: `zg "where are user permissions checked"` runs a hybrid search, `zg --index` builds an index and `zg --rg` does exact matching with line numbers. `zg --install` configures the tool for agent clients, and 0.3.0 adds GitHub Copilot, Grok Build, VS Code and Pi to existing support for Claude Code, Codex, Qwen Code and OpenCode. The README says files, indexes and local models stay on your machine, and remote embedding services only see data with your permission.

## Why this matters

Agent search tools get launched over and over by MCP clients, so startup time and install size matter more than they do for a long-running server, and that is where this rewrite gained most. It is the same pattern as the TypeScript checker ports we covered, such as [Cloudflare's tsrs](/posts/cloudflare-tsrs-typescript-rust-port/), but here with a published table you can try to reproduce. If your agent already searches a local index, run `zg --index` on your own repository and compare build time and memory before switching; for indexes where even the vectors are too big to keep, [LEANN's recompute approach](/posts/leann-vector-index-recomputes-embeddings/) is the other end of the trade-off.
