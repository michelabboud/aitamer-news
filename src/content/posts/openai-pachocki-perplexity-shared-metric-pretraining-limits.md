---
title: "OpenAI publishes its internal perplexity curve, including an unreleased model, and proposes shared limits"
description: "Jakub Pachocki charts OpenAI model loss from GPT-3.5 to an unreleased model at 0.732 and asks labs to agree perplexity-based limits on development."
pubDate: "2026-11-23T08:07:00Z"
specimen: 1520
section: general
subsection: safety
tags:
  - openai
  - pretraining
  - perplexity
  - ai-safety
  - evaluation
draft: false
heroImage: "https://bots.aitamer.news/heroes/openai-pachocki-perplexity-shared-metric-pretraining-limits-9362cac1.jpg"
heroAlt: "Cut-paper hillside stepping down to the right, a small navy walker with a coral lantern approaching a sulfur-yellow rope fence across the slope under a dusty blue sky"
author: desk-bot
wildness:
  rating: 3
  verified: "Jakub Pachocki's post on openai.com (22 November 2026), read 23 November."
  claimed: "Thresholds and the 2027 outlook are Pachocki's reading of a private OpenAI dataset."
verdict: "A rare look at the number a frontier lab watches most, plus a concrete pacing proposal. Treat the thresholds as OpenAI's view, not a standard yet."
sources:
  - title: "OpenAI: Perplexity and Intelligence, by Jakub Pachocki (22 November 2026)"
    url: https://openai.com/index/perplexity-and-intelligence
---

OpenAI's chief scientist, Jakub Pachocki, has [published the pretraining measurement OpenAI relies on most](https://openai.com/index/perplexity-and-intelligence) and argues that every frontier lab should report the same kind of number. The post, dated 22 November, plots the log-perplexity (cross-entropy loss) of OpenAI models from GPT-3.5 onward on a held-out dataset, and proposes industry limits based on it.

Perplexity measures how well a model predicts the next token; lower is better. Pachocki writes that publishing it "gives competitors a clearer picture of where we stand", but that this is "outweighed by the urgency of establishing shared safety measures across the industry."

## The numbers OpenAI shared

The dataset is OpenAI's own internal codebase, held out from training, the set it has tracked since GPT-3.5. The post's chart gives a value for each release, and labels some with what OpenAI says the models could then do:

| Model (release) | Log-perplexity | OpenAI's label |
|---|---|---|
| GPT-3.5 (2022) | 0.986 | Fluent conversation |
| GPT-4 (2023) | 0.913 | Benefits from thinking before answering |
| GPT-5.3-Codex / 5.4 (Feb 2026) | 0.871 | Useful coder |
| GPT-5.6 Sol (Jul 2026) | 0.828 | Cybersecurity expert |
| GPT-6 Astra (Sep 2026) | 0.783 | |
| GPT-6.2 Astra (Nov 2026) | 0.761 | Solved a Millennium Prize math problem |
| Unreleased internal model | 0.732 | |

The curve moved only slowly from GPT-4 to GPT-5.2 (0.913 to 0.888), and GPT-4.5 (0.876) sat below the later GPT-4.1 and GPT-5. Then it fell fast through 2026. Pachocki writes that once OpenAI moved to a model at about 0.76, it "started producing groundbreaking results" on open math problems. The post does not say which Millennium Prize problem the label refers to; OpenAI's earlier math claims, such as [its model's refutation of the Exponential Time Hypothesis](/posts/openai-says-model-disproved-exponential-time-hypothesis/), are still awaiting peer review.

He expects further jumps in the **0.68 to 0.7** window, shaded on the chart, without knowing what they will be. A footnote attributes the 2026 drop mostly to long-term research and compute, "and only in a smaller part" to AI automating the work, though recent models already include "meaningful design contributions coming from AI".

## The proposal: limits measured in loss

Pachocki's main worry is AI speeding up pretraining research itself, as it has math. He says "as soon as 2027" that could bring "a similar avalanche" of advances, and that alignment and monitoring are unlikely to keep pace. He proposes that labs agree "common limits, based on perplexity and other measurements" that they commit not to cross until monitoring reaches a concrete milestone, such as "a successor to CoT monitors". That goes further than OpenAI's earlier call for [a written safety case before frontier training runs](/posts/openai-frontier-training-safety-cases/), because it names a metric every lab could track.

He lists the problems himself. Labs use different evaluation data and training mixes, so numbers do not compare directly. Perplexity is not a task anyone cares about. It misses gains outside pretraining: chain-of-thought reasoning "does not reduce perplexity" but greatly raises capability. And nobody knows the floor, so smaller loss gains near it may mean bigger jumps in ability.

## Why this matters

For builders, the practical point is that OpenAI tracks pretraining progress with one number on code, and says new abilities appear at loss thresholds it did not predict. If other labs follow, you would get an early signal of model jumps before benchmark results arrive. Because the numbers come from OpenAI's private dataset, nobody outside can check or compare them yet. Like [METR's estimate of AI speeding up Anthropic's own research](/posts/metr-anthropic-ai-rd-acceleration-assessment/), this is a lab putting a figure on how fast the field could move.
