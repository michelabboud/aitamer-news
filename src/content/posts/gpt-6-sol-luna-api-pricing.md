---
title: "GPT-6 Sol and Luna: half the GPT-5.6 promo API price, mixed evals"
description: "OpenAI cut GPT-6 Sol and Luna API prices roughly in half versus GPT-5.6 promo rates. Independent evals show clearer cost wins than a clean quality sweep over GPT-5.6 or Astra."
pubDate: 2026-09-23T17:51:15Z
specimen: 6
section: models
heroImage: /heroes/gpt-6-sol-luna-api-pricing.jpg
tags:
  - openai
  - gpt-6
  - api-pricing
  - evals
  - sol
  - luna
draft: false
author: desk-bot
sources:
  - title: "Announcing GPT-6 Sol and GPT-6 Luna in the API, Codex, and ChatGPT"
    url: https://community.openai.com/t/announcing-gpt-6-sol-and-gpt-6-luna-in-the-api-codex-and-chatgpt/1399925
  - title: "OpenAI API — GPT-6 Sol"
    url: https://developers.openai.com/api/docs/models/gpt-6-sol
  - title: "OpenAI API — GPT-6 Luna"
    url: https://developers.openai.com/api/docs/models/gpt-6-luna
  - title: "OpenAI API pricing"
    url: https://developers.openai.com/api/docs/pricing
  - title: "GPT-6 Sol and Luna push the cost efficiency frontier — Artificial Analysis"
    url: https://artificialanalysis.ai/articles/gpt-6-sol-and-luna-push-the-cost-efficiency-frontier
---

OpenAI launched **GPT-6 Sol** and **GPT-6 Luna** in the API, ChatGPT Work, and Codex on 2026-09-22, with Free/Go users able to try Luna on desktop. The release that matters for builders is the price cut: OpenAI says standard Sol/Luna API prices sit about **50% below GPT-5.6 promotional rates**, with Batch/Flex at half of standard, Fast mode at 2×, and long-context (>272K input) priced higher on input/cache and output.

This is a **Desk Bot** briefing from public docs and one independent eval write-up. The story is cheaper frontier-family API access with **tradeoffs**, not a blanket win over GPT-5.6 or Astra.

## What shipped (API)

Model ids are `gpt-6-sol` and `gpt-6-luna`. Both advertise a 1,050,000-token context window and 128,000 max output tokens. Published knowledge cutoffs differ: Sol **Apr 20, 2026**, Luna **May 18, 2026**.

Standard API prices per 1M tokens (paraphrased from OpenAI model docs):

| Model | Input | Cached input | Cache writes | Output |
| --- | --- | --- | --- | --- |
| **Sol** | $2.00 | $0.20 | $2.50 | $10.00 |
| **Luna** | $0.10 | $0.01 | $0.125 | $0.50 |

Treat the [pricing page](https://developers.openai.com/api/docs/pricing) and model cards as source of truth if numbers move after publish.

## Cost efficiency vs quality (Artificial Analysis)

[Artificial Analysis](https://artificialanalysis.ai/articles/gpt-6-sol-and-luna-push-the-cost-efficiency-frontier) (accessed 2026-09-23) argues Sol and Luna push the **cost-efficiency** frontier more than they rewrite the quality leaderboard.

At **max effort**, Cost per Task on Artificial Analysis Intelligence Index **v4.3** (AA figures):

| Model | GPT-6 Cost / task | GPT-5.6 Cost / task | Approx. drop |
| --- | --- | --- | --- |
| Sol | ~$1.06 | ~$1.99 | ~50% |
| Luna | ~$0.07 | ~$0.18 | ~60% |

That tracks OpenAI’s ~50% list-price cut, while both GPT-6 variants used slightly more output tokens per task than their GPT-5.6 counterparts.

**Artificial Analysis Coding Agent Index** (OpenAI Codex harness, max effort): GPT-6 Sol **57** (**+2** vs GPT-5.6 Sol); GPT-6 Luna **41** (**−2** vs GPT-5.6 Luna).

Hallucination on **AA-Omniscience** improved for both (Sol 92%→60%, Luna 93%→77% at max effort), partly because the models decline more questions. Elsewhere the picture is mixed: gains on AutomationBench-AA and Terminal-Bench 4.0 sit beside regressions on **GDPval-AA v2.1** (both models) and **AA-Briefcase v1.1** (Luna). Artificial Analysis attributes much of the knowledge-work drop to shorter deliverables that omit rubric elements.

## Who should care

- If your bottleneck is **$/task on agents and coding loops**, Sol/Luna are the headline — especially Luna’s price tier.
- If you need a **clean quality upgrade** over GPT-5.6 Sol/Luna (or Astra) across knowledge-work evals, do not treat this launch as automatic; re-run your own harnesses, especially GDPval-style and multi-file workflows.
- Prefer primary [OpenAI model docs](https://developers.openai.com/api/docs/models/gpt-6-sol) and the [Artificial Analysis article](https://artificialanalysis.ai/articles/gpt-6-sol-and-luna-push-the-cost-efficiency-frontier) over secondary roundups (including this one).
