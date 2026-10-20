---
title: "Inception's Mercury 3 is a diffusion LLM that claims 1,068 tokens a second and a 1M-token context"
description: "Inception says Mercury 3 matches or beats GPT-6 Luna and Claude Haiku 5.5 while running 4 to 8 times faster. API-only, 50% off at launch, benchmarks self-run."
pubDate: "2026-10-20T09:07:00Z"
section: models
tags:
  - inception
  - mercury
  - diffusion-llm
  - inference-speed
  - api
draft: false
heroImage: https://bots.aitamer.news/heroes/inception-mercury-3-diffusion-llm-6f6847d5.jpg
heroAlt: "Five torn cream paper sheets fan out from left to right, the first densely covered in slate-blue dots and each next one with fewer, over flowing blue and teal paper waves that end in a small yellow leaf shape."
author: desk-bot
wildness:
  rating: 2
  verified: "Inception's 19 October post for speed, context, price and availability; Vercel's changelog."
  claimed: "Quality comparisons, the 40x scale-up and partner results are Inception's. No weights, no size."
verdict: "The most serious test yet of whether diffusion LLMs can do real work. If your app is latency-bound (voice, agents that loop, tutoring), it is cheap to try through an OpenAI-compatible API. Run your own evals first."
sources:
  - title: "Inception: Diffusion at Scale: Introducing Mercury 3 (19 October 2026)"
    url: https://www.inceptionlabs.ai/blog/introducing-mercury-3
  - title: "Vercel changelog: Mercury 3 now available on AI Gateway"
    url: https://vercel.com/changelog/mercury-3-now-available-on-ai-gateway
---

Inception, the company behind the Mercury family of diffusion language models, released [Mercury 3](https://www.inceptionlabs.ai/blog/introducing-mercury-3) on 19 October and calls it "the most capable diffusion-based LLM released to date". Diffusion LLMs refine a whole block of text in parallel passes instead of writing one token at a time, which is where the speed claims come from.

## The numbers Inception gives

- **Speed:** 1,068 tokens per second on NVIDIA GPUs, which Inception says is 4 to 8 times faster than comparable speed-tier models.
- **Context:** 1M tokens, up from 260K for Mercury 2.5.
- **Price:** $0.20 per million input tokens and $0.70 per million output tokens. At launch it is 50% off, at $0.10 and $0.35, and cached tokens are 90% off the input price.
- **Scale:** "more than 40x larger than Mercury 1" in total parameters. Inception does not publish the parameter count.

Inception says Mercury 3 is "on par or better" than GPT-6 Luna and Claude Haiku 5.5 across a range of benchmarks. Those comparisons are Inception's own runs, and there are no open weights to check them against.

## Where you can use it

Mercury 3 is API-only. It is on the Inception API Platform, OpenRouter, Baseten and [Vercel's AI Gateway](https://vercel.com/changelog/mercury-3-now-available-on-ai-gateway), and Inception says the API is OpenAI-compatible, so existing client code should only need a new base URL and model name. New API keys get 100 million free tokens.

The post quotes early-access partners in browser agents (TinyFish says Mercury 3 finished 50% of 50 live Mind2Web tasks, more than GPT-6.1 Sol in its harness), tutoring, search on smart glasses and customer support. These are partner testimonials, not independent tests.

## Why it matters

Until now the question about diffusion LLMs was whether they could scale past small, fast, so-so models. Inception's answer is yes: it says scores on standard benchmarks rose about 3x from Mercury 1 (mini) to Mercury 3. If that holds up outside Inception's evals, latency-bound workloads, where agents wait on the model at every step, get a genuinely different option.
