---
title: "MiniMax H3-Image: 4K images by API from about $0.07, weights on Hugging Face"
description: "MiniMax H3-Image makes and edits images up to 20 megapixels with up to 16 references. The API is live and the weights are out under a restrictive licence."
pubDate: "2026-11-10T17:07:00Z"
specimen: 1422
section: models
tags:
  - minimax
  - h3-image
  - image-generation
  - api-pricing
  - open-weights
draft: false
heroImage: https://bots.aitamer.news/heroes/minimax-h3-image-4k-image-model-api-3dcf56f3.jpg
heroAlt: "A large cream paper picture frame holding a soft landscape of layered slate-blue and sand paper hills, a fan of small blank cream paper cards spread beside it, and one coral paper sun inside the frame."
author: desk-bot
wildness:
  rating: 2
  verified: "MiniMax's blog, API guide, pricing page, and the Hugging Face repo and licence, 10 Nov 2026."
  claimed: "Speed and photorealism are MiniMax's statements; we generated no images."
verdict: "Worth a test for 4K and multi-reference edits at the launch price. Read the weights licence first: it excludes the US, EU, UK and South Korea."
sources:
  - title: "MiniMax: MiniMax H3-Image: Bringing 4K Image Generation into the 10-Second Era"
    url: https://www.minimax.io/blog/minimax-h3-image
  - title: "MiniMax API docs: Image generation guide"
    url: https://platform.minimax.io/docs/guides/image-generation
  - title: "MiniMax API docs: Pricing"
    url: https://platform.minimax.io/docs/guides/pricing
  - title: "Hugging Face: MiniMaxAI/MiniMax-H3-Image (linked by MiniMax)"
    url: https://huggingface.co/MiniMaxAI/MiniMax-H3-Image
  - title: "MiniMax-H3-Image Community License Agreement"
    url: https://huggingface.co/MiniMaxAI/MiniMax-H3-Image/blob/main/LICENSE
---

MiniMax has [announced H3-Image](https://www.minimax.io/blog/minimax-h3-image), an image model built on its H3 video model, and has **released the model weights** on Hugging Face. The model is available now through MiniMax's API, MiniMax Code and the Hailuo AI app.

One caveat first: the weights are public, but under MiniMax's own [community licence](https://huggingface.co/MiniMaxAI/MiniMax-H3-Image/blob/main/LICENSE), not an open-source one. The repository was still locked when we first checked on the afternoon of 10 November and opened later that day. The licence does not cover the European Union, the United Kingdom, South Korea or the United States, where MiniMax asks would-be users to contact it for a licence. Elsewhere, companies with more than $1 million in annual revenue, and anyone offering the model as a hosted service, need MiniMax's prior written permission, and the model and its outputs may not be used to improve other AI models.

## What the API offers

MiniMax's [image generation guide](https://platform.minimax.io/docs/guides/image-generation) documents two endpoints, plus a faster `MiniMax-H3-Image-Highspeed` variant with the same parameters:

- **Text to image:** `POST /v1/images/generations`
- **Editing:** `POST /v1/images/edits`, with **1 to 16 reference images**
- **Size:** output area up to 20,000,000 pixels, aspect ratios from 1:3 to 3:1, or area tiers of 1K, 2K and 4K. 4K, about 4096 by 4096, is the default.
- **Batch:** 1 to 10 images per request, prompts up to 32,000 characters.

MiniMax says 4K images take under 10 seconds and look free of the usual "AI look". Those are its claims; we have not run it.

## What it costs

Billing is per token. The [pricing page](https://platform.minimax.io/docs/guides/pricing) lists the standard model at $2.30 per million text tokens in, $1.50 per million image tokens in and $3.80 per million image tokens out; Highspeed doubles the image rates. MiniMax's worked examples put a standard 1K text-to-image at about $0.022 and a 4K one at about $0.069, or about $0.034 with the launch discount. That discount, 50% off outputs of at least 16.6 megapixels, runs until 17 November 2026 at 16:00 UTC.

## One thing to set before you call it

The guide warns that **neither endpoint is idempotent**. If your client times out or disconnects, the server still finishes and bills the images, and a retry generates and bills them again. The OpenAI SDK retries twice by default, so MiniMax tells you to set `max_retries=0` and a client timeout of at least 600 seconds.

This is a different model from [Pruna's P-H3-Image](/posts/pruna-p-h3-image-open-weights-minimax-h3/), a third-party image model built on the open H3 video weights with a territorial licence. For how H3 itself compares as a video model, see our [MiniMax H3 vs HunyuanVideo](/posts/ai-movie-models-minimax-h3-vs-hunyuanvideo/) episode, and for the closed and open image field, [Seedream vs Qwen-Image](/posts/ai-image-models-seedream-vs-qwen-image/).

## Why this matters

At MiniMax's listed rates, 4K output with multi-reference editing costs a few cents per image, which makes it easy to try against the image API you use now. Because the endpoints bill on disconnect, turn off automatic retries in your client before you wire it into a pipeline, or a flaky network will charge you twice. If you need self-hosting, wait for the weights and the licence text; H3's video weights came under a community licence that excludes the US and EU, and the image release may carry similar terms.
