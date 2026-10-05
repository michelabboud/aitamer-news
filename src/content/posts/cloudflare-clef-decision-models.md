---
title: Cloudflare ships Clef and Clef-flash, open models that score typed options
description: "Cloudflare posted Clef and Clef-flash on 1 October 2026: Apache 2.0 decision models on Workers AI that return a probability for every allowed answer, plus a hands-on fine-tuning offer."
pubDate: "2026-10-05T10:50:00Z"
section: models
subsection: workers-ai
tags:
  - clef
  - workers-ai
  - decision-models
  - open-weights
  - cloudflare
  - qwen
draft: false
heroImage: https://bots.aitamer.news/heroes/cloudflare-clef-decision-models-e0689d3e.jpg
heroAlt: Cream paper tuning fork stands between a card with a mustard check and a blank card on a dusty blue paper ground.
author: desk-bot
wildness:
  rating: 3
  verified: 1 Oct changelog, 30 Sep HF repos, Apache 2.0, 27B and 9B Qwen bases
  claimed: Latency, benchmark wins, and the 2.2s demo are Cloudflare's own runs
verdict: Open weights you can call on Workers AI today for typed decisions. The speed tables are Cloudflare's, and self-serve fine-tuning is still a later step.
sources:
  - title: Introducing Clef (Cloudflare blog, 1 October 2026)
    url: https://blog.cloudflare.com/clef-decision-models/
  - title: Clef on Workers AI (Cloudflare changelog, 1 October 2026)
    url: https://developers.cloudflare.com/changelog/post/2026-10-01-clef-workers-ai/
  - title: Cloudflare/clef model card (Hugging Face)
    url: https://huggingface.co/Cloudflare/clef
  - title: Cloudflare/clef-flash model card (Hugging Face)
    url: https://huggingface.co/Cloudflare/clef-flash
---

Cloudflare's [1 October 2026 changelog](https://developers.cloudflare.com/changelog/post/2026-10-01-clef-workers-ai/) and [launch post](https://blog.cloudflare.com/clef-decision-models/) introduce Clef and Clef-flash, the first models the Workers AI team says it trained. They are decision models in the same family as Typesafe's Jev: you pass a state and typed questions, and the model returns a probability for every allowed answer. There is no free-form text to parse. Both are hosted on Workers AI as `@cf/cloudflare/clef` and `@cf/cloudflare/clef-flash`, and the weights are on Hugging Face under Apache 2.0.

## What the cards and the changelog agree on

The [Clef card](https://huggingface.co/Cloudflare/clef) calls it a 27B multimodal model post-trained from Qwen/Qwen3.8-27B. The [Clef-flash card](https://huggingface.co/Cloudflare/clef-flash) calls it a 9B model post-trained from Qwen/Qwen3.5-9B. Both cards say the model reads text, JSON, images, or video and scores every allowed option in one forward pass, with a joint schema head beside the backbone. Hugging Face lists both repositories as created on 30 September 2026, Apache 2.0, ungated. The changelog, dated the next day, says each has a 64,000-token context window and accepts up to 64 questions per request, of three types: `noul` (a yes/no probability), `choice` (one option, a probability per option, and a confidence), and `score` (a probability-weighted point on an ordered rubric). It also says you can pass up to four images. The cards' mention of video is broader than that image limit; the changelog is the one that states the four-image cap.

The blog says inference freezes the Qwen backbone, runs a prefill-only pass, and scores valid schema choices in parallel, so the decision step is not token-by-token generation. Training used rank-256 adapters, label-smoothed cross-entropy, a Brier loss, and a method Cloudflare names Reinforcement Learning for Calibrated Decisions. Those training details are Cloudflare's account.

## Cloudflare's speed and quality tables

All benchmark figures below are Cloudflare's. The changelog says that across 43 runs, median latency was 209.3 ms for Clef, 38.8 ms for Clef-flash, and 524.1 ms for Jev, which it summarises as about 2.5 times and 13 times faster than Jev at the median. The same table lists p95 latency of 238.6 ms, 122.4 ms, and 536.0 ms. On BFCL case-exact, Cloudflare lists 98.47 for Clef, 98.76 for Clef-flash, and 95.75 for Jev. It says a Clef model scores highest on 7 of 10 decision benchmarks in that comparison, and that on Typesafe's workflow evals Clef beats Jev in 3 of 4 areas. A threat-intelligence example in both posts says Clef, paired with Browser Run, fetched, rendered, and classified a domain in 2.2 seconds, against 4.7 seconds for gpt-oss-120b in the same workflow. No independent evaluation is cited.

## Fine-tuning is a design partnership

The posts also announce a reinforcement-learning fine-tuning offer. Cloudflare says customers can work with its forward-deployed engineers to tune Clef, and that a self-serve platform for capturing data, training, and redeploying on Workers AI comes later. The changelog's call to action is a design-partner signup. The blog says hosted requests are not read, stored, or used for training unless you use that fine-tuning product. That is Cloudflare's policy statement.

## Practical takeaway

If you already call Jev's System One API, the changelog says a switch is an endpoint and model change. Clef is the precision model and Clef-flash is the latency model, on Cloudflare's numbers. Treat the leaderboard as the vendor's own table, confirm the four-image limit against the card's video wording before you depend on video, and treat self-serve fine-tuning as not available yet.
