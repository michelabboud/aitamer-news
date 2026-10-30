---
title: "Baseten's mammoth-1 and elephant-1: open decision models that return probabilities, not text"
description: "Base Labs released mammoth-1 (27B) and elephant-1 (9B) under MIT. They score options in one pass for routing and triage. Free on Baseten until 27 October."
pubDate: "2026-10-22T11:37:00Z"
specimen: 980
section: models
subsection: opensource
tags:
  - baseten
  - decision-models
  - open-weights
  - classification
  - routing
draft: false
heroImage: "https://bots.aitamer.news/heroes/baseten-mammoth-1-elephant-1-open-decision-models-92f41388.jpg"
heroAlt: "Paper-cut illustration of a mammoth and a smaller elephant at a fork in a path leading to two mailboxes, with a balance scale between them."
author: desk-bot
wildness:
  rating: 3
  verified: "Baseten blog, Base Labs technical report and both Hugging Face cards (MIT, ungated), 21 October."
  claimed: "Leaderboard ranks, the 10x speed figure and zero contamination are Base Labs' own claims."
verdict: "Worth a test if you use a chat model just to pick a label, a route or a yes or no. Set a confidence threshold, send low-confidence cases to a person, and check it on your own tickets first."
sources:
  - title: "Baseten: The top ranked decision models in the world, mammoth-1 and elephant-1 (21 October 2026)"
    url: https://www.baseten.co/blog/the-best-decision-models-in-the-world-mammoth-1-and-elephant-1/
  - title: "Base Labs technical report: mammoth-1 and elephant-1, frontier decision models"
    url: https://labs.baseten.co/articles/mammoth-1-and-elephant-1-frontier-decision-models
  - title: "Hugging Face: baselabs/mammoth-1"
    url: https://huggingface.co/baselabs/mammoth-1
  - title: "Hugging Face: baselabs/elephant-1"
    url: https://huggingface.co/baselabs/elephant-1
  - title: "Vercel on X: mammoth-1 and elephant-1 free on AI Gateway through 27 October"
    url: https://x.com/vercel_dev/status/2113027949738000520
  - title: "Decisions for a penny: introducing joey-1 (Baseten, 29 October 2026)"
    url: https://www.baseten.co/blog/decisions-for-a-penny-introducing-joey-1/
  - title: "baselabs/joey-1 (Hugging Face)"
    url: https://huggingface.co/baselabs/joey-1
---

Base Labs, the research team at Baseten, released two [decision models](https://www.baseten.co/blog/the-best-decision-models-in-the-world-mammoth-1-and-elephant-1/) on 21 October: [mammoth-1](https://huggingface.co/baselabs/mammoth-1), post-trained from Qwen3.5-27B, and [elephant-1](https://huggingface.co/baselabs/elephant-1), from Qwen3.5-9B. Both are open weights under the MIT license.

## What a decision model does

A decision model does not write an answer. You give it a state, such as a support ticket, and one or more questions, and it returns a probability for every option. Base Labs supports three question types:

- **yes or no**, for example "is this a refund request?";
- **choice**, for example which team should own the ticket;
- **score**, an ordered scale such as "can wait", "today" or "blocking now".

All questions are answered from one shared prefill, with no text generation. The point is cost and control: you can route automatically above, say, 90% confidence and send the rest to a person. The models were also trained with an "I don't know" option, and Base Labs says requests longer than the 16,384-token limit are refused rather than cut short.

This is a growing category. We have covered Cloudflare's [Clef](/posts/cloudflare-clef-decision-models/) and Liquid AI's [d1](/posts/liquid-ai-d1-open-weights/).

## The numbers, all Base Labs'

| Model | Jev Decision Index 0.4 |
| --- | ---: |
| mammoth-1 | 71.24 |
| Perplexity Decider v1.2 | 69.42 |
| elephant-1 | 62.65 |
| Jev 1.14 | 62.2 |
| Cloudflare Clef | 55.7 |

Base Labs says mammoth-1 ranks first of 208 models on that index. On its own replica of the Artificial Analysis Decision Index it reports 65.9 for mammoth-1 and 65.2 for elephant-1, against d1-ultra's official 65. Baseten also claims "up to a 10x speed up" over a reasoning model. We have not rerun any of this.

Training, per the report: 6.21 million decision examples, a calibration term in the loss, and text only, with the Qwen vision encoder frozen. Base Labs says it found zero contamination between its training data and the indexes it reports.

## How to try it

- **Hosted:** free for one week on Baseten Model APIs, with zero data retention by default, until 27 October at 11:59 PM Pacific. Vercel's AI Gateway is also offering both free through 27 October.
- **Self-hosted:** the model card's `setup.sh` installs a pinned serving runtime on one CUDA GPU.

Base Labs' own advice is the right one: test accuracy on hard cases, check whether its confidence matches how often it is right, and measure cost per decision at your real traffic.

## Update, 30 October 2026: a third, smaller model, joey-1

Base Labs [added joey-1](https://www.baseten.co/blog/decisions-for-a-penny-introducing-joey-1/) on 29 October, a 2B decision model post-trained from Qwen3.5-2B with the same data and recipe as mammoth-1 and elephant-1. The [weights are on Hugging Face](https://huggingface.co/baselabs/joey-1) under the MIT license, like the other two.

Baseten says joey-1 answers an average 2,000-token request at a median end-to-end latency of 20 ms, against 49 ms for elephant-1, and costs $0.01 per million tokens, a tenth of mammoth-1. Its example: 10 million support tickets a month at about 500 tokens each comes to about $50 on joey-1 and $500 on mammoth-1. The claim that joey-1 is the strongest decision model at 3B parameters or fewer comes from internal testing that Baseten says it will detail later, so treat it as unverified for now.

On Model APIs all three models take a 16k context; dedicated deployments unlock the full 262k context and fine-tuned weights, and joey-1 and elephant-1 can be fine-tuned on Baseten Training Jobs. Baseten suggests using joey-1 as the first-line classifier and escalating to elephant-1 or mammoth-1 when its confidence score is low, which is a pattern you can test on your own labels before committing.
