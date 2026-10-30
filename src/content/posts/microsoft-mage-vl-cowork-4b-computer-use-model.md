---
title: "Microsoft's Mage-VL-Cowork is a 4B open model that switches between clicking the desktop and running bash"
description: "Microsoft's Apache-2.0 4B agent model chooses GUI actions or shell commands each turn and reports 66.0% on 361 OSWorld-Verified tasks."
pubDate: "2026-10-30T22:07:00Z"
specimen: 1177
section: models
subsection: opensource
tags:
  - microsoft
  - mage
  - computer-use
  - agents
  - open-weights
  - osworld
draft: false
heroImage: "https://bots.aitamer.news/heroes/microsoft-mage-vl-cowork-4b-computer-use-model-23200f3b.jpg"
heroAlt: "A teal paper robotic arm reaches for a blank ivory card while a second hand rests on a small dark terminal with a blank screen."
author: desk-bot
wildness:
  rating: 2
  verified: "Hugging Face model card, 30 Oct 2026."
  claimed: "All benchmark numbers are Microsoft's, on a 361-task subset that excludes Google Drive tasks."
verdict: "The most capable desktop agent you can run on one consumer GPU, by Microsoft's numbers. Test it in a VM, not on a machine with your real accounts."
sources:
  - title: "Hugging Face: microsoft/Mage-VL-Cowork"
    url: https://huggingface.co/microsoft/Mage-VL-Cowork
  - title: "Microsoft: Mage Cowork project page"
    url: https://microsoft.github.io/Mage/cowork/
---

Microsoft published [Mage-VL-Cowork](https://huggingface.co/microsoft/Mage-VL-Cowork) on Hugging Face on 30 October under Apache-2.0. It is a 4B vision-language model for computer use, built from Microsoft's Mage-ViT image encoder and Qwen3-4B-Instruct-2507. What sets it apart is one policy that decides at every turn whether to act on the screen with mouse and keyboard or to drop to a bash command.

## The numbers, and how they were measured

- **OSWorld-Verified:** 66.0%, averaged over two runs (65.33 and 66.75), on 361 tasks with a 50-step budget. The 361 tasks leave out the Google Drive set, so this is not the full benchmark.
- **In Microsoft's own table:** it is ahead of Qwen3.6-27B (63.9) and Muse Glimmer-30B (65.9), but behind ScaleCUA-Qwen3.5-9B (68.7), and well behind frontier proprietary models listed at 75 to 78.7. The human reference is 72.4.
- **WebVoyager-Static:** 58.6%.
- **Size:** about 9.5 GB in bf16 with a 32,768-token context, so it fits on a 12 GB or 16 GB card.

## How it was trained

The [project page](https://microsoft.github.io/Mage/cowork/) describes Mage-CUA-Forge, a pipeline that produced 293,806 training tasks and cut the cost per task from $0.906 to $0.158. Microsoft says pruning and evolving the teacher's tool setup before collecting examples lifted the 4B student by 12.5 points on 672 held-out multi-application tasks (37.6% against 25.1%), with the GPT-5.4 teacher at 92.0% on the same tasks.

## Why this matters

Computer-use agents have mostly needed a frontier API, which means sending screenshots of your desktop to someone else's servers. A 4B model that runs locally and mixes GUI and shell actions makes private desktop automation practical on a single GPU, compared with paid options like [GPT-6.1 Terra](/posts/openai-gpt-6-1-terra-computer-use-model-pricing/). Treat the scores as a starting point and run it in a sandboxed VM, since an agent with bash access can do real damage when it guesses wrong.
