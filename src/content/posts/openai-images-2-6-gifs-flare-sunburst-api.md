---
title: "OpenAI's Images 2.6 adds GIFs, SVG export and a complexity setting, with two API models at GPT Image 2.5 prices"
description: "Images 2.6 is in ChatGPT, Codex and the API as GPT Image 2.6 Flare and Sunburst. Token prices match GPT Image 2.5; the speed claims are OpenAI's."
pubDate: "2026-11-05T08:37:00Z"
section: tools
tags:
  - openai
  - image-generation
  - gpt-image
  - chatgpt
  - codex
  - api
draft: false
heroImage: https://bots.aitamer.news/heroes/openai-images-2-6-gifs-flare-sunburst-api-89a519ea.jpg
heroAlt: "Cut-paper cream flip book fanned open on a cream surface, its pages showing a small paper bird in mid-flap, with one coral page edge and a faint slate-blue motion arc."
author: desk-bot
wildness:
  rating: 1
  verified: "OpenAI's 4 November launch post, the Flare and Sunburst model pages and API pricing, read 5 Nov."
  claimed: "Speed, quality and usage figures are OpenAI's; we have not tested the models."
verdict: "A practical upgrade for GPT Image 2.5 users: same token prices, GIF and SVG output, a complexity knob. Test on your own prompts, since OpenAI does not say what 50% faster is measured against."
sources:
  - title: "OpenAI: Introducing Images 2.6 (4 November 2026)"
    url: https://openai.com/index/introducing-images-2-6/
  - title: "OpenAI API: GPT Image 2.6 Flare model page"
    url: https://platform.openai.com/docs/models/gpt-image-2.6-flare
  - title: "OpenAI API: GPT Image 2.6 Sunburst model page"
    url: https://platform.openai.com/docs/models/gpt-image-2.6-sunburst
  - title: "OpenAI API: Pricing"
    url: https://platform.openai.com/docs/pricing
---

OpenAI [released Images 2.6 on 4 November](https://openai.com/index/introducing-images-2-6/) in ChatGPT, Codex and the API. The headline addition is animated GIF output, and the API gets two new models, markup-guided edits, SVG export and a new complexity setting. OpenAI says it is "available globally today in ChatGPT and Codex across all subscription tiers on desktop, mobile, and web."

## What is new

- **GIFs.** OpenAI pitches them for animated brand mascots, reactions and memes, and animated storyboards "to explore character movement before video production." It says a simple sketch can be a starting point.
- **Image markup in the API.** Markup was already in ChatGPT. In the API, OpenAI says it lets teams "pinpoint exactly where to make specific changes."
- **SVG export.** OpenAI says this makes designs "ready to use across websites, apps, and print."
- **A complexity parameter.** It sets "how much planning the model does to meet a request." OpenAI separates it from quality: quality controls visual detail and fidelity, complexity "guides how much goes into the scene." For most edits it recommends low complexity with whatever quality you need, and medium or high complexity for scenes with many elements or constraints.

## Flare or Sunburst

The API has two model IDs, `gpt-image-2.6-flare` and `gpt-image-2.6-sunburst`. The [Flare model page](https://platform.openai.com/docs/models/gpt-image-2.6-flare) describes it as "image generation and editing for fast iteration," and the [Sunburst page](https://platform.openai.com/docs/models/gpt-image-2.6-sunburst) as "image generation and editing for detailed visual work." Both take text and image input, output images, and list the image generation and image edit endpoints as supported.

OpenAI's claims for each, none of which we have tested:

- Images 2.6 "generates images 50% faster than before." The post does not say faster than which model, or at which settings.
- Flare "can generate images in as little as six seconds" when quality is set to low, and "improves layout quality for posters, product imagery, and other professional visuals."
- Sunburst gives "higher-quality image generation and even greater image consistency across edits" at medium or high quality.

OpenAI also says people now create 4 billion images a week across ChatGPT, Codex and the API. Partner quotes in the post come from OpenArt's CEO Coco Mao and Figma Weave's creative director Itay Schiff, who says Figma Weave is adding the model. OpenAI names Town, a startup building an AI work assistant, as an API user that tried animated characters.

## Price

On the [API pricing page](https://platform.openai.com/docs/pricing), Flare and Sunburst cost the same per token, and the same as GPT Image 2.5 Flare and Sunburst: $8 per million image input tokens ($2 cached), $30 per million image output tokens, and $5 per million text input tokens ($1.25 cached). OpenAI does not publish a flat per-image price and points to the calculator in its image generation guide instead. Two gaps for bulk jobs: the 2.6 models are missing from the Batch price table, which still lists GPT Image 2.5 at half price, and both model pages list the Batch endpoint as not supported.

## Why this matters

If you call GPT Image 2.5 today, moving to 2.6 is a speed and quality test, not a budget decision, because the token prices are identical. Bulk work is the exception: Batch still halves GPT Image 2.5's price and does not list 2.6, so keep batch jobs on 2.5 for now. Our [Nano Banana vs GPT Image comparison](/posts/ai-image-models-nano-banana-vs-gpt-image/) found GPT Image 2.5 costly at its top setting, and [Microsoft's MAI Image 2.7](/posts/microsoft-mai-image-2-7-editing-model-preview/) launched claiming an edit-leaderboard spot above GPT Image 2.5 Flare, so rerun your own edit prompts at low complexity before you switch.
