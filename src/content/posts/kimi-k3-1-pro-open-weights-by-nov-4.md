---
title: "Kimi K3.1 Pro is live in Kimi's apps and API, with open weights promised by 4 November"
description: "Moonshot's Kimi K3.1 Pro and a 2-3x faster Highspeed variant are out today. The full weights are promised by 4 November, and the K2 models are being retired."
pubDate: "2026-10-23T21:37:00Z"
section: models
tags:
  - kimi
  - moonshot-ai
  - open-weights
  - coding-agents
  - benchmarks
draft: false
heroImage: "https://bots.aitamer.news/heroes/kimi-k3-1-pro-open-weights-by-nov-4-e66522cc.jpg"
heroAlt: "Paper collage of a closed cream crate tied with red string and a blank tag, beside an open hatch in a blue wall spilling paper cards."
author: desk-bot
wildness:
  rating: 3
  verified: "Kimi's K3.1 Pro tech blog, API pricing page and launch posts on X, read 23 October."
  claimed: "Every benchmark is Moonshot's own run or citation. The weights are not on Hugging Face yet."
verdict: "You can call kimi-k3.1-pro today, but the open-weight part is a promise until the files land. Treat the coding and finance scores as Moonshot's, and run your own tasks before you switch."
sources:
  - title: "Kimi K3.1 Pro Tech Blog: Advancing Open Intelligence (Moonshot AI)"
    url: https://kimi.ai/blog/kimi-k3-1-pro
  - title: "Kimi API pricing and model notes"
    url: https://platform.kimi.ai/docs/pricing/chat
  - title: "Kimi launch thread on X, 23 October 2026"
    url: https://x.com/Kimi_Moonshot/status/2113680701770068067
  - title: "Kimi on X: K3.1 Pro API and K3.1 Pro Highspeed available now"
    url: https://x.com/Kimi_Moonshot/status/2113680718249500786
  - title: "moonshotai models on Hugging Face"
    url: https://huggingface.co/moonshotai
---

Moonshot AI launched [Kimi K3.1 Pro](https://kimi.ai/blog/kimi-k3-1-pro) on 23 October. The tech blog calls it "the first model in our new K3.1 series and our most capable 3T-class open-weight model to date," with a 1-million-token context window. A second model, **Kimi K3.1 Pro Highspeed**, runs at 2 to 3 times the speed of K3.1 Pro, per Moonshot.

The word "open-weight" needs a date next to it. The blog says: "The full model weights will be released by Nov 4." When we checked the [moonshotai page on Hugging Face](https://huggingface.co/moonshotai) on 23 October, Kimi-K3 was still the newest model there.

## Where you can use it today

Per the blog, both models roll out today on Kimi.ai and the mobile apps, the Kimi Work desktop app (version 3.1.0 or later), Kimi Code (pick it with `/model`) and the Kimi API, as `kimi-k3.1-pro` and `kimi-k3.1-pro-highspeed`. Zero Data Retention is available to API customers. For Kimi Enterprise, access is off by default until an administrator turns it on.

Moonshot's [launch post on X](https://x.com/Kimi_Moonshot/status/2113680701770068067) gives the size as 2.8T total and 104B active parameters in a mixture-of-experts design, and says the model is multimodal. The [API pricing page](https://platform.kimi.ai/docs/pricing/chat) lists K3.1 Pro under the K3 series, where every model gets a 1,048,576-token context window. The per-token prices did not show in the page text we could read, so check them there before you budget.

## What changed from K3

The blog says K3.1 Pro is a post-trained version of Kimi K3 "with substantially larger post-training compute," using large-scale reinforcement learning across hundreds of domains. It pitches three areas:

- **Coding.** Full-project builds, including games in Unity, Unreal Engine and Godot, plus Three.js scenes and front-end pages.
- **3D.** Parametric models in Blender and CAD, written as scripts the model runs itself. A "3D Make" feature is now live on kimi.ai and the app.
- **Finance.** Spreadsheet models, investment analysis and source-grounded research.

## Moonshot's numbers

All of these are Moonshot's own runs or its citations of other labs' reports:

- **Terminal-Bench 4.0:** 65.7%, against 58.2% for GPT-6 Astra and 66.4% for Claude Opus 5.5. Moonshot ran K3.1 Pro with the Claude Code harness.
- **Kimi Code Bench 3.0 Long-horizon** (internal): 61.2%, up from 55.95% for K3.
- **BenchCAD with tools:** 92.7%, against 96.2% for Claude Opus 5.5 and 95.9% for GPT-6 Astra.
- **OfficeQA Pro v2:** 64.4, which Moonshot calls state of the art.
- **Kimi Hallu Bench Hard** (internal): the claim-level hallucination rate fell from 23.4% for K3 to 8.3%. Moonshot adds that the set is a deliberate stress test and "the reported rates do not represent overall error rates in daily use."

The blog also describes one internal long-horizon run: building a human walking simulator, where the model found and fixed 36 errors in shoulder-muscle calculations. That is a single example from Moonshot, not a benchmark.

## The cyber section

Moonshot says it removed cyber-related data from mid-training and from the reinforcement-learning mix for the open-weight release. On its in-house exploit benchmark, xdev-bench-hard, a checkpoint without those cuts solved 90.5% of tasks at pass@3, and the shipped K3.1 Pro solved 81.0%. Moonshot says the model's cyber capability "remains behind that of frontier proprietary models that have been publicly available for at least three months," and that it aims not to release open weights that "extend the absolute frontier of cyber capability." These are Moonshot's own measurements, and nobody outside the company has checked them yet.

## If you are on K2

The pricing page says K2 series models will not be available to newly registered users from 31 October 2026, and that Moonshot plans to retire all K2 models by the end of December 2026. Existing users keep access until then. If you pin a K2 model in an app, plan the move now.
