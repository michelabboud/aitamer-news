---
title: "Copilot’s agent runtime moves to Rust — agents wrote most of the port"
description: "GitHub’s Stephen Toub details rewriting the Copilot agent runtime from TypeScript/Node into 800k+ lines of production Rust, shipping incrementally with an embeddable C ABI. Latency figures are GitHub eng benchmarks without model or network time."
pubDate: 2026-09-23
section: tools
heroImage: /heroes/copilot-runtime-rust-migration.jpg
subsection: agents
tags:
  - github-copilot
  - rust
  - agent-runtime
  - copilot-cli
  - copilot-sdk
  - rewrite
  - performance
  - ffi
draft: false
author: desk-bot
sources:
  - title: "Migrating the GitHub Copilot runtime to Rust, using Copilot — Stephen Toub"
    url: https://github.blog/ai-and-ml/generative-ai/migrating-the-github-copilot-runtime-to-rust-using-copilot/
---

Stephen Toub’s GitHub Blog post (**2026-09-16**) is a primary engineering write-up of how the **Copilot agent runtime** — the harness behind Copilot CLI, the Copilot app, and the Copilot SDK — left TypeScript on Node/V8 for **more than 800,000 lines of production Rust**, with **AI agents writing most of the code**. As Toub put it, a rewrite of this size “wasn’t affordable before agents.”

This is a **Desk Bot** briefing from that post. Treat LoC, latency, token, and dollar figures below as **GitHub primary / vendor eng claims**.

## What changed

The shared agent loop backs CLI and app surfaces and, per Toub, a widening set of hosts (VS Code, Visual Studio, CCA, Code Review, Cowork, Studio, and several Office surfaces) via the SDK. The old shape forced many consumers into an **out-of-process** Node/V8 host over JSON-RPC. The rewrite targeted a clean runtime layer plus an **embeddable C ABI** for **in-process** FFI across the six SDK languages (C#, Go, Java, Python, Rust, TypeScript), while keeping out-of-process JSON-RPC available.

Toub says the port landed **incrementally** (not one cutover). Selected ship metrics from the post:

| Metric | Figure (Toub / GitHub eng) |
| --- | --- |
| PRs into `main` | **128** |
| Window | ~**14.5** weeks |
| Releases on `main` | **135** (100 pre-release + 35 stable) |
| Production Rust by 2026-08-21 | **832,378** LoC (+ **468,689** Rust unit-test LoC) |
| Temporary N-API/TypeScript seam | **0** |

Strategy was **in-place atomic replacement** — component-by-component TypeScript → Rust with temporary interop — so `main` stayed shippable while other developers kept landing features.

## Latency claims (read the caveats)

Toub’s C# SDK table compares a May 12 TypeScript/out-of-process baseline to Aug 21 Rust (out-of-process and in-process) against a **localhost deterministic chat server**. Those numbers **exclude model inference and network latency**; they measure client startup, session create/teardown, event handling, and related harness cost. Example rows (Rust **in-process**):

| Scenario | TypeScript baseline | Rust in-process |
| --- | --- | --- |
| Client, session, one turn | **5.25 s** | **292 ms** |
| Resume 32-turn session | **5.64 s** | **264 ms** |
| Ten concurrent clients | **12.34 s** | **742 ms** |
| 1,000 one-turn lifecycles | **132.52 s** | **20.93 s** |

Toub frames this as an end-to-end delivered-system comparison and states the runtime is **not universally “15.9× faster.”** Prefer the [post’s table](https://github.blog/ai-and-ml/generative-ai/migrating-the-github-copilot-runtime-to-rust-using-copilot/) over re-hosted charts.

## Soft cost framing (also vendor)

Toub attributes roughly **136.3B** total tokens and about **$120,000** in token spend to the porting work, plus on the order of **three weeks** of one developer’s time (~20% of his PRs in the window), with named teammates on napi-oop, SDK FFI, packaging, cratesplit, and reviews. Soft economics — not an independent audit.

## Who should care

This is a tools-desk eng story: a shared Copilot agent harness left Node/V8 for an embeddable Rust binary, agents did most of the line-volume, and in-process C ABI hosting is the lasting architectural bet. For numbers and quotes, stick to Toub’s post rather than secondary roundups.
