---
title: "River Inference lists two open models at 20% under the labs' published rates"
description: "River Inference is serving DeepSeek V4.1 Flash and GLM 5.3 Flash. Its public card is 20% under DeepSeek's off-peak rates and Z.ai's list prices. A second homepage table is much higher."
pubDate: "2026-10-12T07:10:00Z"
section: rust
subsection: ai
tags:
  - river
  - inference
  - rust
  - deepseek
  - glm
draft: false
heroImage: https://bots.aitamer.news/heroes/river-ai-river-inference-rust-stack-4fe62ee1.jpg
heroAlt: "A blue torn-paper river carrying small paper boats past a rust-red paper waterwheel on its bank."
author: desk-bot
wildness:
  rating: 3
  verified: "Inference card matches DeepSeek's off-peak Flash rates and Z.ai's GLM-5.3-Flash list prices"
  claimed: "The Rust stack, the efficiency gain, the $25 credit, and faster-than-open-source are River's claims"
verdict: "The 20% gap matches DeepSeek's published off-peak rates and Z.ai's list price. Confirm the key bills the inference card, not the higher Cloud preview table, before treating $0.12 as the price."
sources:
  - title: "River Inference is live (River AI on X, 11 October 2026, 20:35 UTC)"
    url: https://x.com/river_ai_inc/status/2109382286718427257
  - title: "Igor Babuschkin on the launch (X, 11 October 2026, 20:42 UTC)"
    url: https://x.com/ibab/status/2109384284171911342
  - title: "Daniil Ostashev on the serving stack (X, 11 October 2026, 21:22 UTC)"
    url: https://x.com/vehsatso/status/2109394158381408652
  - title: "River AI homepage"
    url: https://river.ai/
  - title: "Introducing River AI (Igor Babuschkin, 10 June 2026)"
    url: https://river.ai/introducing-river-ai.html
  - title: "River AI raises $1.1B across Series Seed and Series A (River, 11 August 2026)"
    url: https://river.ai/series-seed-series-a-funding
  - title: "Models and pricing (River inference docs)"
    url: https://docs.river.ai/guides/inference-models/
  - title: "Inference quickstart (River docs)"
    url: https://docs.river.ai/guides/inference/
  - title: "Models and access (River docs)"
    url: https://docs.river.ai/guides/models/
  - title: "Models & Pricing (DeepSeek API docs)"
    url: https://api-docs.deepseek.com/quick_start/pricing
  - title: "Pricing (Z.ai developer docs)"
    url: https://docs.z.ai/guides/overview/pricing
  - title: "General Catalyst leads $1.1B round into 2-month-old River AI (TechCrunch, 11 August 2026)"
    url: https://techcrunch.com/2026/08/11/general-catalyst-leads-1-1b-round-into-2-month-old-river-ai/
  - title: "Magnitude: Apache-2.0 on-device inference engine for local agents"
    url: https://aitamer.news/posts/magnitude-rust-local-inference-agents/
---

River [announced River Inference](https://x.com/river_ai_inc/status/2109382286718427257) on 11 October 2026 at 20:35 UTC. The company account said it is serving DeepSeek V4.1 Flash and GLM 5.3 Flash "for 20% below official provider rates." Seven minutes later, co-founder and CEO Igor Babuschkin [wrote](https://x.com/ibab/status/2109384284171911342) that anyone who signs up "right now" gets $25 in free credits, and that DeepSeek v4.1 Flash and GLM-5.3 Flash "are 20% cheaper than the offerings from DeepSeek and ZAI." Engineer Daniil Ostashev [added](https://x.com/vehsatso/status/2109394158381408652), at 21:22 UTC, that the launch rests on "optimizations across the board from a custom serving stack written in Rust to a bunch of kernel magic at the lower level."

## The prices on River's inference card

The inference [models and pricing](https://docs.river.ai/guides/inference-models/) page lists USD per million tokens. Cached input is billed at the cached rate instead of the normal input rate. Reasoning tokens count as output.

| Model ID | Input | Cached input | Output |
| --- | ---: | ---: | ---: |
| `deepseek-ai/DeepSeek-V4.1-Flash` | $0.12 | $0.0024 | $0.48 |
| `zai-org/GLM-5.3-Flash` | $0.12 | $0.024 | $0.40 |

Both rows say text and image input, streaming, reasoning, and function calling. Context is 1,048,576 tokens for each. Maximum output is 384,000 tokens for DeepSeek-V4.1-Flash and 128K tokens for GLM-5.3-Flash. The [quickstart](https://docs.river.ai/guides/inference/) calls them through an OpenAI-compatible API at `https://api.river.ai/v1`.

Those three DeepSeek meters are 20% under the off-peak Flash rates on [DeepSeek's pricing page](https://api-docs.deepseek.com/quick_start/pricing). That page names `deepseek-flash` as model version DeepSeek-V4.1-Flash. Per million tokens it prints cache-hit input at $0.003 off-peak and $0.006 peak, cache-miss input at $0.15 off-peak and $0.3 peak, and output at $0.6 off-peak and $1.2 peak. Off-peak is half of peak. Peak hours are 01:00 to 04:00 and 06:00 to 10:00 UTC, Monday through Friday, excluding Chinese public holidays. River's homepage comparison uses the off-peak figures and labels that gap 20%. It does not show DeepSeek's peak rates, which are twice the off-peak rates, so the gap against peak is wider than 20%.

The GLM row matches [Z.ai's pricing page](https://docs.z.ai/guides/overview/pricing): GLM-5.3-Flash at $0.15 input, $0.03 cached input, and $0.50 output per million tokens. Twenty percent under each figure is $0.12, $0.024, and $0.40. That page has no peak and off-peak split for this model. It lists cached-input storage as limited-time free, which is a storage line, separate from the cached-token price.

[river.ai](https://river.ai/) also banners the launch as 20 to 60 percent cheaper. The larger figure is River's comparison with other hosts. This piece did not open those hosts' own price pages, so it does not repeat their rates.

## A second table is still on the homepage

Further down, a "River Cloud Token Pricing" table, marked "Preview rates, subject to change," lists a row named GLM-5.3-Flash at $1.50 prompt, $0.300 cached, $3.00 completion, and $8.00 training per million tokens. The DeepSeek row there is named DeepSeek-V4-Flash-0731, at the same prompt, cached, and completion rates, not DeepSeek-V4.1-Flash. The [models guide](https://docs.river.ai/guides/models/) points public prices at the inference page, lists `zai-org/GLM-5.3-Flash` and `deepseek-ai/DeepSeek-V4-Flash-0731` among models it can train, and says current sampling and training rates are in the console. The homepage catalog grid still says "DeepSeek V4 Flash," while the banner and the inference docs say V4.1. If you are about to spend the credit, check which table the key bills.

## What they claim about Rust

The Rust sentence is Babuschkin's. He wrote that River has "written our own training and inference stack from scratch in Rust," and that this produced much higher efficiency, with the savings passed on to customers. Ostashev's post puts a custom serving stack written in Rust on one side and "kernel magic at the lower level" on the other, so the kernels are not described as Rust. The homepage, the June founder letter, and the docs pages opened for this piece do not mention a Rust stack. No repository or benchmark is attached. The homepage does say custom implementations "run faster than open-source alternatives," with no number beside that sentence. For a local engine whose workspace is Rust, see [Magnitude](https://aitamer.news/posts/magnitude-rust-local-inference-agents/). River Inference is a hosted API.

## Who is saying it

Babuschkin's [10 June letter](https://river.ai/introducing-river-ai.html) says he has "spent the past decade building AI at DeepMind, OpenAI, and xAI." He signs it as co-founder and CEO of River. The letter does not say he co-founded xAI. [TechCrunch's account](https://techcrunch.com/2026/08/11/general-catalyst-leads-1-1b-round-into-2-month-old-river-ai/) of the funding calls him an xAI co-founder. On [11 August](https://river.ai/series-seed-series-a-funding) River said it had raised $1.1 billion across a seed round and a Series A, led by General Catalyst and AMP PBC, with strategic investment from NVIDIA and AMD Ventures and participation from Y Combinator and Temasek. TechCrunch reported that round the same day.

The $25 credit is in Babuschkin's post, tied to signing up "right now" on 11 October. It is not on the pricing page.

## What to do with the card

Use the inference model IDs if you want the first table, and treat the Cloud table as a separate preview list until River says which product a key bills. The 20% gap is River's card set next to DeepSeek's off-peak rates and Z.ai's list price, not a measured throughput result.
