---
title: "Particle-1 trims DeepSeek V4.1 Flash's coding output by about 45%, Particle says"
description: "Suhail's new company Particle tuned DeepSeek V4.1 Flash to use 28 to 52% fewer output tokens on coding benchmarks. It costs $0.25/$1 per million on OpenRouter."
pubDate: "2026-10-29T17:07:00Z"
section: models
tags:
  - particle
  - deepseek
  - coding-agents
  - token-efficiency
  - openrouter
  - reinforcement-learning
draft: false
heroImage: "https://bots.aitamer.news/heroes/particle-1-token-efficient-deepseek-v4-1-flash-853b417c.jpg"
heroAlt: "A paper-cut pair of scissors trims a long ivory paper ribbon short, with four small blank paper tiles in a row on the ribbon, on a muted teal background."
author: desk-bot
wildness:
  rating: 2
  verified: "Particle's launch post and OpenRouter's model page, read 29 October 2026; base-model licence on Hugging Face."
  claimed: "All token, cost and accuracy figures are Particle's own runs; no independent results yet."
verdict: "Worth a trial if DeepSeek V4.1 Flash already runs your agent loops: same price tier, shorter runs on Particle's tests. Measure pass rates on your own tasks before you switch."
sources:
  - title: "Particle: Introducing Particle-1 (28 October 2026)"
    url: https://particle.ai/blog/introducing-particle-1
  - title: "OpenRouter: Particle AI Particle-1"
    url: https://openrouter.ai/particle-ai/particle-1
  - title: "Suhail on X: launch thread (28 October 2026)"
    url: https://x.com/Suhail/status/2115497949421883648
  - title: "Hugging Face: deepseek-ai/DeepSeek-V4.1-Flash-1017 (MIT licence)"
    url: https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017
---

Particle, a new company [announced on X](https://x.com/Suhail/status/2115497949421883648) by its founder Suhail, launched on 28 October with one model: **Particle-1**, a post-trained version of DeepSeek V4.1 Flash built to finish coding tasks in fewer tokens. Particle's [launch post](https://particle.ai/blog/introducing-particle-1) says it uses "around ~45% fewer tokens on average" with accuracy close to the base model. It is available through Particle's own API and on [OpenRouter](https://openrouter.ai/particle-ai/particle-1).

## What Particle measured

Particle tested on four agent benchmarks: Terminal-Bench 2.1, ReactBench, ADE Bench (data engineering with dbt) and DeepSWE 1.1. Against DeepSeek V4.1 Flash, it reports:

- **28.4% to 52.2% fewer output tokens**, depending on the benchmark;
- **34.4% to 51.6% lower average cost per task**;
- pass@1 rates "within the confidence intervals of the base model".

The headline averages across the four, in Particle's table:

| | Particle-1 | DeepSeek V4.1 Flash | GLM 5.3 Flash |
|---|---|---|---|
| Pass rate | 72.57% | 71.15% | 66.82% |
| Output tokens per task | 59,580 | 83,246 | 98,155 |
| Cost per task | $0.2211 | $0.3368 | $0.6523 |

Outside coding, Particle says scores stay close to the base model: GPQA Diamond 90.40% (base 90.91%), Tau Airlines 86.00% (base 88.00%) and MMLU 86.08% (base 85.98%). These are all Particle's own runs. We found no independent results yet.

## Where the savings come from

Particle trained a rank-64 LoRA adapter, about 1.25% of the model's parameters, with reinforcement learning that rewards solving the task with fewer reasoning and tool-call tokens. It says reasoning accounts for roughly 90% of the savings on three of the four benchmarks. In its trace comparisons, the tuned model reasons less before the same actions, stops sooner once a check passes, and needs fewer rounds of trial and repair. Final confirmation messages shrink most.

Particle's own examples include a fair warning. In one data-engineering task, the token savings came partly from a different solution, with different key-generation behaviour, "rather than merely a shorter explanation of identical work". Shorter runs are only a win if the shorter run does the same job.

## Price and access

OpenRouter lists Particle-1 at **$0.25 per million input tokens, $1.00 per million output tokens** and $0.03 per million cached reads, with Particle as the only provider. The context window is 1,048,576 tokens with up to 131,072 output tokens. It takes text and images in, returns text, and supports tool calling and JSON-schema structured output. Note that Particle's cost math in the launch post uses different rates ($0.30 input and $1.20 output for both Particle-1 and DeepSeek V4.1 Flash), so the per-task dollar figures are a comparison, not your bill.

Particle has not published weights. The base model is open: DeepSeek posted [V4.1-Flash-1017](/posts/deepseek-v4-1-flash-1017-open-weights/) under the MIT licence, and Suhail says on X that Particle-1 builds on that 1017 checkpoint. Some X users questioned which DeepSeek version the comparison runs used, and the launch post's tables do not name a checkpoint.

## Who should try it

If your agents already run on DeepSeek V4.1 Flash, Particle-1 is a cheap experiment: point one workflow at it and compare pass rates, retries and total tokens per finished task. Watch for skipped checks, since a model trained to stop sooner can also stop too soon. For how coding agents compare more broadly, see Artificial Analysis's [Coding Agent Index 2.0](/posts/artificial-analysis-coding-agent-index-v2-frontiercode/).
