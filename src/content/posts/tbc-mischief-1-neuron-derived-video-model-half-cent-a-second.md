---
title: "TBC's Mischief 1 is a Wan 2.2 video model tuned with lab-grown neurons, at half a cent a second"
description: "The Biological Computing Co. released Mischief 1 on OpenRouter and fal: Wan 2.2 plus a tiny adapter, from $0.005 a second at 480p."
pubDate: "2026-10-30T17:37:00Z"
specimen: 1149
section: models
subsection: movie-gen
tags:
  - tbc
  - mischief-1
  - video-generation
  - wan-2-2
  - openrouter
  - fal
  - biological-computing
draft: false
heroImage: "https://bots.aitamer.news/heroes/tbc-mischief-1-neuron-derived-video-model-half-cent-a-second-17d95784.jpg"
heroAlt: "A slate-blue paper film strip with a running hare unspools from a reel, a faint neuron shape behind it and a small coral coin on the strip."
author: desk-bot
wildness:
  rating: 3
  verified: "TBC release, OpenRouter and fal model pages, 30 Oct 2026: base model, prices, clip lengths."
  claimed: "The 5x speed claim and the neurons' role are TBC's own; no independent benchmark yet."
verdict: "Cheap and easy to try through two big APIs. The biology is a training ingredient, not hardware you call, so judge it on clips and price like any other video model."
sources:
  - title: "PR Newswire: The Biological Computing Co. launches neuron-derived AI video model"
    url: https://www.prnewswire.com/news-releases/the-biological-computing-co-launches-worlds-first-publicly-available-neuron-derived-ai-video-model-302924399.html
  - title: "OpenRouter: TBC Mischief 1"
    url: https://openrouter.ai/tbc/mischief-1
  - title: "fal: tbc/mischief-1/image-to-video"
    url: https://fal.ai/models/tbc/mischief-1/image-to-video
---

The Biological Computing Co. (TBC) [released Mischief 1](https://www.prnewswire.com/news-releases/the-biological-computing-co-launches-worlds-first-publicly-available-neuron-derived-ai-video-model-302924399.html) on 30 October and calls it the first publicly available "neuron-derived" AI video model. Strip the framing and it is an image-to-video model you can call today on [OpenRouter](https://openrouter.ai/tbc/mischief-1) and [fal](https://fal.ai/models/tbc/mischief-1/image-to-video).

## What it is

Mischief 1 is built on Wan 2.2, the open video model from Alibaba's Wan team. TBC adds an adapter that it says is less than 0.1% of the model's parameters. The company says it designed that adapter using signals recorded from living neurons grown in its lab. The neurons stay in the lab: what ships is ordinary model weights running on ordinary GPUs, so "runs on brain cells" would be wrong. TBC claims the result generates video 5 times faster than the base model. It has not published a benchmark anyone else can rerun, so treat that number as the company's.

## Price and limits

OpenRouter lists Mischief 1 from $0.005 per second at 480p and $0.01 per second at 720p, released 30 October. A 5-second 480p clip is 5 times $0.005, or 2.5 cents. The listing says it makes 3- and 5-second clips in 16:9 and is steered by a first-frame image; the fal page lists the image-to-video endpoint with commercial use allowed.

For scale, our note on [Grok Imagine Video 1.5 Lite](/posts/spacexai-grok-imagine-video-1-5-lite/) covers a pricier option that does longer clips with speech. If you are new to how these models turn a still into motion, [our explainer on AI video generation](/posts/ai-video-generation-explained/) covers the basics.

## Why this matters

Half a cent a second makes Mischief 1 one of the cheapest hosted video endpoints we have priced, and it sits behind APIs many teams already use, so testing it costs very little. The neuron story is interesting research, but there is no independent evidence yet that it beats a well-tuned Wan 2.2 on quality. Run your own prompts against the base model before choosing it for anything beyond short drafts.
