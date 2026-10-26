---
title: "Mirendil's first model, Fern 0.1, reads 10M tokens but trails GLM-5.3 and Kimi K3 on its own agentic chart"
description: "Fern 0.1 is pretrained from scratch with a 10M-token window. Mirendil's own table puts it behind open models on coding agents. Access is coming soon."
pubDate: "2026-10-26T22:07:00Z"
section: models
tags:
  - mirendil
  - fern
  - long-context
  - pretraining
  - coding-agents
  - benchmarks
draft: false
heroImage: "https://bots.aitamer.news/heroes/mirendil-fern-0-1-10m-context-trails-open-models-agentic-b85cafd4.jpg"
heroAlt: "Cut-paper illustration of a young fern whose frond unrolls into a very long looping paper scroll, with two larger unfinished trees behind it."
author: desk-bot
wildness:
  rating: 3
  verified: "Mirendil's Fern launch page and its embedded chart data (26 October); its 21 October pretraining post."
  claimed: "Fern's scores are Mirendil's own single-attempt runs in OpenCode; no weights, API or price yet."
verdict: "A credible long-context result and an honest chart, but not a coding model you can use yet. Watch the larger bases still in pretraining, and wait for the promised long-context results beyond one RULER grid."
sources:
  - title: "Mirendil: Introducing Fern (26 October 2026)"
    url: https://mirendil.com/news/introducing-fern/
  - title: "Mirendil: Pretraining at scale without a pretraining team (21 October 2026)"
    url: https://mirendil.com/news/pretraining-at-scale-without-a-pretraining-team/
---

Mirendil [released](https://mirendil.com/news/introducing-fern/) its first model on Monday. Fern 0.1 is Mirendil-Base, a model the lab pretrained from scratch, after "a short round of post-training". Its headline is context: the architecture, training and serving support up to 10M tokens, which Mirendil puts at about 23 MB or half a million lines of code, roughly the Megatron-LM codebase. It is aimed at the work of people building AI: auditing training data, debugging a run from its logs, and reading whole agent traces.

## What is on the page

- **Size.** Fern sits on a base listed at 0.1 to 0.5T parameters. Two bigger bases are still pretraining: Mirendil-Base-Large (0.5 to 2T, shown as 80%+ done) and Mirendil-Base-XL (2 to 10T, 20%+).
- **Access.** "Coming soon", with an early-access request form. No weights, API or pricing are listed.
- **How it was built.** Mirendil's [21 October post](https://mirendil.com/news/pretraining-at-scale-without-a-pretraining-team/) says one researcher built the base in 3.5 months with under $10M of compute, all-in, with AI agents writing over 99% of the code.

## The benchmark table cuts both ways

The launch page's comparison data is unusually candid. Fern was run by Mirendil in OpenCode with one attempt per benchmark, and other models' scores come from their model cards or leaderboards:

| Benchmark (pass rate %) | Fern 0.1 | GLM-5.3 | Kimi K3 | Claude Opus 5.5 |
|---|---|---|---|---|
| SWE-Bench Verified | 73.4 | 95.4 | 93.4 | 98.2 |
| DeepSWE v1.1 | 44.2 | 66.9 | 67.3 | 74.2 |
| SWE Atlas Codebase QnA | 53.2 | 59.4 | 66.1 | 66.4 |
| Terminal Bench 4.0 | 6.1 | 41.9 | 12.6 | 66.4 |

So on agentic coding, Fern is behind the leading open models today. Harness choice also moves these numbers, as the [harness-swap paper](/posts/harness-swap-flips-as-many-swe-bench-tasks-as-a-rerun/) we covered showed.

## The long-context result

On five RULER tasks, the base model scored 100% on single-needle retrieval at every length up to 10M tokens, and 90% on multi-key retrieval at 10M. Multi-hop question answering (HotpotQA) fell to 45% at 10M. Each cell averages 100 examples, but only 20 at 10M. A separate chart shows prediction loss on Mirendil's own repositories still improving as the window grows past what other models were tested at. Mirendil says "more comprehensive long-context results are coming soon".
