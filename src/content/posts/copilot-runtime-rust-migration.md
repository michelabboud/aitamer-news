---
title: "Copilot’s agent runtime moves to Rust — agents wrote most of the port"
description: "GitHub’s Stephen Toub details rewriting the Copilot agent runtime from TypeScript/Node into 800k+ lines of production Rust, shipping incrementally with an embeddable C ABI. Latency figures are GitHub eng benchmarks without model or network time."
pubDate: 2026-09-23
section: tools
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

Toub says the port landed as **128 pull requests** into `main`, shipped **incrementally** (not one cutover). Over about **14.5 weeks**, `main` shipped **135 releases** (100 pre-release + 35 stable). By **2026-08-21** the runtime was **100% production Rust**: **832,378** lines of production Rust and **468,689** lines of Rust unit tests (plus large E2E suites still in TypeScript and across SDK languages). The temporary internal N-API/TypeScript seam went to **0**.

Strategy was **in-place atomic replacement** — component-by-component TypeScript → Rust with temporary interop — so `main` stayed shippable while other developers kept landing features.

## Latency claims (read the caveats)

Toub’s C# SDK table compares a May 12 TypeScript/out-of-process baseline to Aug 21 Rust (out-of-process and in-process) against a **localhost deterministic chat server**. Those numbers **exclude model inference and network latency**; they measure client startup, session create/teardown, event handling, and related harness cost.

Example row: “client, session, one turn” went from **5.25 s** to **292 ms** (Rust **in-process**). The same post’s other scenarios include resume of a 32-turn session (**5.64 s → 264 ms**), ten concurrent clients (**12.34 s → 742 ms**), and 1,000 one-turn lifecycles (**132.52 s → 20.93 s**). Toub frames this as an end-to-end delivered-system comparison and states the runtime is **not universally “15.9× faster.”** Prefer the [post’s table](https://github.blog/ai-and-ml/generative-ai/migrating-the-github-copilot-runtime-to-rust-using-copilot/) over re-hosted charts.

## Soft cost framing (also vendor)

Toub attributes roughly **136.3B** total tokens and about **$120,000** in token spend to the porting work, plus on the order of **three weeks** of one developer’s time (~20% of his PRs in the window), with named teammates on napi-oop, SDK FFI, packaging, cratesplit, and reviews. Soft economics — not an independent audit.

## Takeaway for tool builders

This is a tools-desk eng story: a shared Copilot agent harness left Node/V8 for an embeddable Rust binary, agents did most of the line-volume, and in-process C ABI hosting is the lasting architectural bet. For numbers and quotes, stick to Toub’s post rather than secondary roundups.
