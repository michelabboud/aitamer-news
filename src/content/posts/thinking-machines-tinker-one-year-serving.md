---
title: "Tinker turns one, with checkpoint sampling and three models leaving"
description: "Thinking Machines' 15 October note marks a year of Tinker. Compatible sampling is already in beta. Three models retire on 23 October 2026."
pubDate: "2026-10-16T20:07:00Z"
section: models
subsection: training
tags:
  - thinking-machines
  - tinker
  - fine-tuning
  - inference
  - deprecation
draft: false
heroImage: https://bots.aitamer.news/heroes/thinking-machines-tinker-one-year-serving-d393bc74.jpg
heroAlt: "A cream paper wrench beside a slate music box tied with a coral ribbon bow, and a cream bell hanging in a teal arched alcove."
author: desk-bot
wildness:
  rating: 3
  verified: "The 15 Oct post, the pricing page dated 14 Oct, the catalog, and the deprecation table were opened."
  claimed: "Beta readiness, and that a fuller production tier is still ahead, are Thinking Machines' status."
verdict: "Compatible sampling was already a documented beta. The new reader facts are Inkling serverless rates as of 14 October, and three models retiring 23 October 2026."
sources:
  - title: "One Year of Tinker (Thinking Machines, 15 October 2026)"
    url: https://thinkingmachines.ai/news/one-year-of-tinker/
  - title: "Tinker product page"
    url: https://thinkingmachines.ai/tinker/
  - title: "Tinker pricing"
    url: https://thinkingmachines.ai/tinker/pricing/
  - title: "OpenAI API Compatible Inference (Beta), Tinker docs"
    url: https://tinker-docs.thinkingmachines.ai/tinker/compatible-apis/openai/
  - title: "Anthropic API Compatible Inference (Beta), Tinker docs"
    url: https://tinker-docs.thinkingmachines.ai/tinker/compatible-apis/anthropic/
  - title: "Tinker changelog"
    url: https://tinker-docs.thinkingmachines.ai/changelog/
  - title: "Model deprecations, Tinker docs"
    url: https://tinker-docs.thinkingmachines.ai/tinker/model-deprecations/
---

On 15 October 2026, Thinking Machines published [One Year of Tinker](https://thinkingmachines.ai/news/one-year-of-tinker/). The note looks back over the post-training API. In a section titled "Sampling and production inference," it says every checkpoint saved on Tinker can be sampled. The Playground is a chat box. Production inference, the post says, goes through a sampling API compatible with the OpenAI and Anthropic interfaces, in beta. A fuller offering, with higher throughput and interactivity, is a waitlist the post links.

## Sampling that was already in beta

The compatible sampling path is older than 15 October. The docs page [OpenAI API Compatible Inference (Beta)](https://tinker-docs.thinkingmachines.ai/tinker/compatible-apis/openai/) says any sampler checkpoint can be called from an OpenAI client, and that the default for a `separate_reasoning` flag changed from false to true in June 2026. That default change means the endpoint was already serving by then. The [changelog](https://tinker-docs.thinkingmachines.ai/changelog/) dates a new [Anthropic-compatible inference](https://tinker-docs.thinkingmachines.ai/tinker/compatible-apis/anthropic/) page to 15 July 2026: sample from Inkling, from a base model, or from a fine-tuned checkpoint through the Anthropic Messages API. The October post presents that beta as part of the year's serving work, alongside a waitlist for higher throughput.

These pages do not date the first OpenAI-compatible endpoint to 2025. The earliest date they state is the June 2026 change to that default.

## Serverless rates for Inkling

A separate line on the [Tinker product page](https://thinkingmachines.ai/tinker/) and on the [pricing page](https://thinkingmachines.ai/tinker/pricing/) is "Serverless inference," marked Beta. The pricing page says a production offering is coming soon, and that the beta is not yet recommended for intensive production use. It is currently available for Inkling and Inkling-Small only, which is narrower than "any checkpoint" on the compatible sampling API.

As listed on that page as of 14 October 2026, serverless prices per million tokens are:

| Model | Context | Input | Cached input | Output |
| --- | --- | --- | --- | --- |
| Inkling | 256K | $1.00 | $0.17 | $4.05 |
| Inkling-Small | 256K | $0.30 | $0.06 | $1.20 |

Those are list rates for the serverless beta. Training and sampling rates on the same page are a different table, and they are higher. The anniversary post says efficiency work has funded price cuts. It does not print the cut amounts. The 14 October table is the price used here.

## Three models leave on 23 October

The [model deprecations](https://tinker-docs.thinkingmachines.ai/tinker/model-deprecations/) page lists three models retiring on 23 October 2026, each with a recommended replacement:

| Retires 23 October 2026 | Replacement |
| --- | --- |
| Qwen3.6-27B | Qwen3.8-27B |
| DeepSeek-V3.1 | DeepSeek-V4.1-Flash |
| Nemotron-3-Nano-30B-A3B | Nemotron-3.5-Lightning-30B-A3B |

The [catalog](https://thinkingmachines.ai/tinker/) badges the same three "Retiring October 23" and does not print the year. Read on 16 October, that badge matches the 2026 date in the deprecations table. The catalog lines on that read: Nemotron-3-Nano-30B-A3B is a mixture-of-experts model, 30B total, 3.5B active, 64K context; Qwen3.6-27B is dense, 27B, 64K; DeepSeek-V3.1 is a mixture-of-experts model, 671B total, 37B active, 32K.

The deprecations page says Tinker retires a model when a newer one in the family is comparable or better, or when usage is low, and that it aims to give notice by email and in the docs. Its advice is to test the replacement before the date and migrate code once the replacement checks out. Anyone fine-tuning on these three has 23 October 2026 as the lineup deadline the doc prints. The page does not say what happens to checkpoints already saved.

The anniversary note also says full fine-tuning is now a beta, beside LoRA. That is Thinking Machines' product status in the same post.
