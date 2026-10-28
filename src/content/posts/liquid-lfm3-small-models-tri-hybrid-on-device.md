---
title: "Liquid AI releases LFM3: six 2B-class open-weight models for phones and laptops, with a $10M revenue cap"
description: "Liquid's LFM3 family covers text, vision, audio, omni and two d1 decision models, all near 2B. Weights are open; commercial use stops at $10M revenue."
pubDate: "2026-10-28T09:07:00Z"
specimen: 1102
section: models
subsection: opensource
tags:
  - liquid-ai
  - lfm3
  - small-models
  - on-device
  - open-weights
  - licensing
draft: false
heroImage: "https://bots.aitamer.news/heroes/liquid-lfm3-small-models-tri-hybrid-on-device-835f452b.jpg"
heroAlt: "A paper-cut collage of an open phone tray holding six small matching droplets over a braided three-strand band."
author: desk-bot
wildness:
  rating: 1
  verified: "Liquid's and Hugging Face's 27 October posts, model cards and the LFM license, read 27 October."
  claimed: "The benchmark wins over LFM2.5 are Liquid's own; we have not run the models."
verdict: "A full small-model family from one base is handy for on-device apps. Read the license first: above $10M annual revenue you need a separate deal."
sources:
  - title: "Liquid AI: LFM3 (27 October 2026)"
    url: https://www.liquid.ai/blog/lfm3
  - title: "Hugging Face blog: LFM3"
    url: https://huggingface.co/blog/LiquidAI/lfm3
  - title: "Hugging Face: LiquidAI/LFM3-1.7B"
    url: https://huggingface.co/LiquidAI/LFM3-1.7B
  - title: "LFM Open License v1.0"
    url: https://huggingface.co/LiquidAI/LFM3-1.7B/blob/main/LICENSE
---

Liquid AI has released **LFM3**, a family of small models meant to run on phones, laptops and other devices. The [Liquid blog](https://www.liquid.ai/blog/lfm3) and [Hugging Face post](https://huggingface.co/blog/LiquidAI/lfm3) describe six models, all built from one base, **LFM3-1.7B-Base**:

- **LFM3-1.7B**: text chat.
- **LFM3-VL-2B**: vision and language.
- **LFM3-Audio-2B**: speech in and out.
- **LFM3-Omni-2B**: text, images and audio together.
- **d1-2B** and **d1-Omni-2B**: Liquid's decision models, with d1-2B replacing the earlier d1-3B we covered in [our d1 story](/posts/liquid-ai-d1-open-weights/).

## What changed inside

Liquid says the base saw 22 trillion tokens of pre-training plus a 3.5 trillion token mid-training stage. The architecture is what Liquid calls a "tri-hybrid": 24 layers mixing 13 short convolution layers, 5 sliding-window attention layers with a 256-token window, and 6 global attention layers. Liquid says this lets LFM3-1.7B "outperform our previous LFM2.5-2.6B while using 35% fewer parameters", and that the text model "fits in about 1 GB at 4-bit precision", with a 256K context window and fine-tuning on a single GPU.

Those are Liquid's numbers. We have not run the models yet.

## The license is the catch

The weights are on [Hugging Face](https://huggingface.co/LiquidAI/LFM3-1.7B), but this is not Apache or MIT. The [LFM Open License v1.0](https://huggingface.co/LiquidAI/LFM3-1.7B/blob/main/LICENSE) says commercial rights "are conditioned upon You or Your Legal Entity not exceeding the Threshold", and sets that threshold at "annual revenue of 10 million United States dollars". Hobby use, research and small companies are fine. A larger company shipping LFM3 in a product needs to talk to Liquid.
