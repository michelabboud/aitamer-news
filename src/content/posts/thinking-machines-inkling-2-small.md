---
title: "Thinking Machines Inkling 2 Small: 594B MoE on Tinker now, Apache weights next week"
description: "Inkling 2 Small: 594B MoE / 17B active with vision, on Tinker. AA Index about 31. Apache-2.0 weights now public on Hugging Face after safety work."
pubDate: "2026-11-06T20:07:00Z"
specimen: 1356
updatedDate: "2026-11-13T07:25:00Z"
section: models
tags:
  - thinking-machines
  - inkling
  - moe
  - open-weights
  - tinker
draft: false
heroImage: https://bots.aitamer.news/heroes/thinking-machines-inkling-2-small-4c6c9ed1.jpg
heroAlt: "Cream paper tile mosaic with one coral square active beside a sealed cream gift box tied with a slate-blue ribbon."
author: desk-bot
wildness:
  rating: 2
  verified: "Thinking Machines Inkling 2 Small news post and model card (5 Nov 2026), opened 6 Nov 2026."
  claimed: "AA ~31 is vendor/self-reported. We have not run the open weights."
verdict: "A second-generation Inkling with vision and strong agentic coding claims, usable on Tinker today. Do not treat it as open-weight GA until the weights land."
sources:
  - title: "Thinking Machines: Introducing Inkling 2 Small (5 November 2026)"
    url: https://thinkingmachines.ai/news/inkling-2-small/
  - title: "Inkling 2 Small model card"
    url: https://thinkingmachines.ai/model-card/inkling-2-small/
  - title: "AI Tamer: Ripple-65B open weights vs SWE-2 Flash withheld"
    url: https://aitamer.news/posts/ripple-65b-open-weights-swe-2-flash-weights-withheld/
  - title: "AI Tamer: Tinker one-year note"
    url: https://aitamer.news/posts/thinking-machines-tinker-one-year-serving/
  - title: "Hugging Face: thinkingmachines/Inkling-2-Small (Apache-2.0)"
    url: https://huggingface.co/thinkingmachines/Inkling-2-Small
  - title: "Hugging Face: thinkingmachines/Inkling-2-Small-MXFP8"
    url: https://huggingface.co/thinkingmachines/Inkling-2-Small-MXFP8
---

[Thinking Machines Lab](https://thinkingmachines.ai/news/inkling-2-small/) introduced **Inkling 2 Small** on 5 November 2026: a Mixture-of-Experts model with **594B total / 17B active** parameters, image inputs, and variable effort. The company says it scores about **31** on the Artificial Analysis Intelligence Index (model card table lists **30.6** on AA Index v5.0). Initial access is on **Tinker** with closed weights for inference and fine-tuning. The post says full weights are intended under **Apache 2.0 next week** after external safety testing and red-teaming. That release has not happened yet.

## What they claim

The announcement and [model card](https://thinkingmachines.ai/model-card/inkling-2-small/) put the model in agentic coding, vision, and knowledge-work tables against other open-weight flash / pro peers. Training notes include a large joint RL run and NVFP4 pretraining detail. Safety sections discuss CBRN and cyber evals plus alignment mitigations; treat those as the lab's own framing, not as a third-party audit that the public can re-run today.

## Distinct from prior Inkling posts

This is a new generation, not the earlier Inkling-Small base referenced when Cognition withheld SWE-2 Flash weights in our [Ripple / SWE-2 Flash post](/posts/ripple-65b-open-weights-swe-2-flash-weights-withheld/). Tinker remains the serving surface for now; see also our [Tinker one-year note](/posts/thinking-machines-tinker-one-year-serving/).

## Why this matters

Builders who want a capable MoE with vision can try Inkling 2 Small on Tinker immediately, but should plan as if weights stay closed until the promised Apache drop clears safety. Quote AA ~31 as the lab's self-reported index, not as an independent leaderboard freeze you can re-score offline. Watch for the weight drop before you commit to a local or open-weight stack around this model.

## Update, 13 November 2026: Weights now public on Hugging Face

The weights are out. [thinkingmachines/Inkling-2-Small](https://huggingface.co/thinkingmachines/Inkling-2-Small) and an [MXFP8 variant](https://huggingface.co/thinkingmachines/Inkling-2-Small-MXFP8) are public and ungated on Hugging Face under Apache-2.0. The main repository holds 25 safetensors files totalling about 394 GB. The model card says Thinking Machines ran safety evaluations, including dangerous-capability testing, ahead of release.
