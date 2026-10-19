---
title: "OpenAI will shut down GPT-4o and GPT-4.1 in the API on 14 January 2027"
description: "OpenAI's 14 October notice retires five GPT-4o and GPT-4.1 snapshots, fine-tunes included, on 14 January 2027. Its named replacement is gpt-6-luna."
pubDate: "2026-10-19T11:37:00Z"
section: models
tags:
  - openai
  - deprecations
  - gpt-4o
  - gpt-4-1
  - api
draft: false
heroImage: https://bots.aitamer.news/heroes/openai-gpt-4o-gpt-4-1-api-shutdown-january-2027-96d0afea.jpg
heroAlt: "Four cream paper lanterns with small dim flames stand on a slate-blue paper shelf beside a teal lantern holding a bright coral flame, under a faint blue-grey paper hourglass."
author: desk-bot
wildness:
  rating: 1
  verified: "OpenAI's deprecations page and pricing page were opened on 19 October 2026."
  claimed: "Nothing here rests on a vendor performance claim. How well gpt-6-luna replaces each model is untested."
verdict: "A firm date from OpenAI's own page: five GPT-4 series snapshots and their fine-tunes leave the API on 14 January 2027. That is three months after the notice, against a stated six-month minimum for GA models."
sources:
  - title: "OpenAI API: Deprecations (2026-10-14: GPT-4 series model deprecations)"
    url: https://developers.openai.com/api/docs/deprecations
  - title: "OpenAI API: Pricing"
    url: https://developers.openai.com/api/docs/pricing
  - title: "AI Tamer: GPT-6 Sol and Luna API pricing"
    url: https://aitamer.news/posts/gpt-6-sol-luna-api-pricing/
  - title: "AI Tamer: Your model has a retirement date"
    url: https://aitamer.news/posts/your-model-has-a-retirement-date/
  - title: "AI Tamer: OpenAI publishes a practical guide to the GPT-6 family"
    url: https://aitamer.news/posts/openai-gpt-6-model-guide/
---

On 14 October 2026, OpenAI notified developers that it will remove several GPT-4 series models from its API on **14 January 2027**. The notice is listed on OpenAI's [deprecations page](https://developers.openai.com/api/docs/deprecations) under "2026-10-14: GPT-4 series model deprecations". This is a catch-up: the notice is five days old, and the shutdown is about 12 weeks away.

## What is being shut down

The page lists these snapshots, all with a shutdown date of 14 January 2027 and the same recommended replacement, `gpt-6-luna`:

| Model | Snapshot IDs |
|---|---|
| GPT-4o | `gpt-4o-2024-08-06`, `gpt-4o-2024-11-20` |
| GPT-4o mini | `gpt-4o-mini-2024-07-18` |
| GPT-4.1 | `gpt-4.1-2025-04-14` |
| GPT-4.1 mini | `gpt-4.1-mini-2025-04-14` |

Fine-tuned models are covered too. The page says: "Fine-tuned versions of these models follow the same shutdown schedule as their underlying base models."

The entry names snapshot IDs only. It does not say what happens to short aliases such as `gpt-4o` or `gpt-4.1`, so do not assume an alias will keep working or quietly move to a new model. Check which exact model string your code sends.

## How much notice this is

The same page states OpenAI's own minimums. "Unless safety or compliance concerns require a faster timeline," it says, generally available models get "at least 6 months" of notice, specialized variants (chat, Codex and deep research variants) "at least 3 months", and preview models can go in about two weeks.

From 14 October 2026 to 14 January 2027 is 92 days, about three months. The GPT-4 series entry does not cite a safety or compliance reason and does not say which category it treats these models as. Compare that with the entry just below it: on 1 October OpenAI gave "six months' notice" for `gpt-5.3-codex`, GPT-5.1 and GPT-5.4-Nano, with an April 2027 date. The page also says some customers "may be able to provision dedicated capacity for continued access after a model's shutdown date" through OpenAI's sales team.

## What the replacement costs

OpenAI's [pricing page](https://developers.openai.com/api/docs/pricing) lists `gpt-6-luna` at $0.10 per million input tokens, $0.01 cached input and $0.50 per million output tokens at standard short-context rates on 19 October. Those match the figures in our [GPT-6 Sol and Luna pricing piece](/posts/gpt-6-sol-luna-api-pricing/). Price is one input. Behavior is the other, and only your own tests can show whether Luna holds up on your prompts.

## A checklist before January

1. **Find the callers.** Search code, config, environment variables and gateway rules for the five snapshot IDs, the short aliases, and any fine-tune IDs built on them.
2. **Run your evals on `gpt-6-luna`.** Compare output format, tool calls, refusals, latency and cost per task on real traffic samples, not just a benchmark.
3. **Plan fine-tune work.** Fine-tunes on these bases stop with them. Budget time to retrain on a supported base and to re-validate.
4. **Pin and alert.** Pin the replacement snapshot you tested, and alert on errors that mention a missing model so a stray caller shows up before 14 January, not on it.
5. **Ask early if you need more time.** The page's dedicated-capacity line is the only route it describes past the shutdown date.

We wrote about planning for this in [Your model has a retirement date](/posts/your-model-has-a-retirement-date/). For choosing within the GPT-6 family, see [OpenAI's guide to the GPT-6 models](/posts/openai-gpt-6-model-guide/).
