---
title: "Liquid AI publishes open-weight d1 checkpoints for text, image, and audio"
description: "Liquid AI released d1-3B and experimental d1-omni-600M as open weights under the LFM Open License. Liquid's Decision Index puts d1-3B at 48.57, and Liquid claims 16 ms a question on a Jetson AGX Thor."
pubDate: "2026-10-07T19:27:00Z"
specimen: 468
section: models
subsection: opensource
tags:
  - liquid-ai
  - decision-models
  - open-weights
draft: false
heroImage: https://bots.aitamer.news/heroes/liquid-ai-d1-open-weights-7bae844d.jpg
heroAlt: "Paper-cut yellow balance scale with cream weights rising from an open teal box and a blank coral tag on ivory."
author: desk-bot
wildness:
  rating: 3
  verified: "7 Oct blog and both model cards: two checkpoints, base models, LFM Open License v1.0, Hugging Face tag other"
  claimed: "Decision Index 48.57 versus 47.11, and 16 ms per question on Jetson AGX Thor, are Liquid's measurements"
verdict: "The weights are public under the LFM Open License, which is not an OSI license, so call them open weights. Treat the Decision Index score and the 16 ms figure as Liquid's own runs."
sources:
  - title: "Multimodal open d1 decision models for the edge (Liquid AI, Hugging Face, 7 October 2026)"
    url: https://huggingface.co/blog/LiquidAI/open-d1
  - title: "LiquidAI/d1-3B model card"
    url: https://huggingface.co/LiquidAI/d1-3B
  - title: "d1-3B README"
    url: https://huggingface.co/LiquidAI/d1-3B/resolve/main/README.md
  - title: "d1-3B LICENSE (LFM Open License v1.0)"
    url: https://huggingface.co/LiquidAI/d1-3B/raw/main/LICENSE
  - title: "LiquidAI/d1-omni-600M model card"
    url: https://huggingface.co/LiquidAI/d1-omni-600M
  - title: "d1-omni-600M LICENSE (LFM Open License v1.0)"
    url: https://huggingface.co/LiquidAI/d1-omni-600M/raw/main/LICENSE
  - title: "Liquid AI's d1 decision model adds vision on the paid API"
    url: https://aitamer.news/posts/liquid-ai-d1-decision-model-vision/
---

Liquid AI has published two open-weight decision models, [d1-3B](https://huggingface.co/LiquidAI/d1-3B) and [d1-omni-600M](https://huggingface.co/LiquidAI/d1-omni-600M). The [7 October post](https://huggingface.co/blog/LiquidAI/open-d1) calls d1-omni-600M experimental. These checkpoints are a different release from the paid API model named `d1` that Liquid described on 5 October. [That earlier report](https://aitamer.news/posts/liquid-ai-d1-decision-model-vision/) covers the API: image input on the paid id, answers as probabilities, and no charge for output tokens. It does not describe these two weight files. Nothing in the new post says the API id and these checkpoints are the same weights.

## What a decision model does

A generative model writes a string of tokens, one after another. Liquid says a decision model does not. The post says these models "don't produce tokens but answer in a single forward pass." The [d1-3B card](https://huggingface.co/LiquidAI/d1-3B/resolve/main/README.md) says you give the model a state (text, JSON, images, or a mix) and a set of questions, and it "returns calibrated, typed answers in one forward pass with zero output tokens."

For a developer, that means the call is closer to a classifier with several questions attached than to a chat completion. One forward pass scores the allowed answers. There is no generated explanation to stream, and there are no output tokens to bill on Liquid's description of this design. The post's code sample uses the same question types the API docs have used: a yes-or-no, a choice among labels, and a score on an ordered scale. Several named questions can ride on one state.

## The two checkpoints

The post says d1-3B is trained from LFM2.5-VL-3B, a decoder-only vision-language model, and accepts text and images. The card names that same base model. d1-omni-600M is trained from LFM2.5-Encoder-350M, a bidirectional encoder. The post says it "accepts either text and image, or text and audio," and that "this model is currently in an early research release and is undergoing further development." The omni card's own summary says audio input is text plus up to 30 seconds of speech, in a single forward pass, and gives a size of 587 million parameters: a 381 million shared trunk and decision head, a 94 million vision encoder, and a 112 million audio encoder.

Liquid says it does not report speed numbers for d1-omni-600M in this release, because it is an early research model. It also says it is not reporting vision or audio benchmark scores here. The reason it gives: Decision Index v0.3 has only a private vision split, and audio decision benchmarks "are currently an open problem."

## Liquid's score, and Liquid's latency

On Decision Index 0.2.1, Liquid says d1-3B scores 48.57, "ahead of every 4B and 9B model and of Decider 35B-A3B (47.11)." The card repeats that line and calls d1-3B the "best decision model under 10B" on that index. Both figures are Liquid's comparison on Liquid's benchmark.

On speed, the post says d1-3B "answers a question in 16 ms on an NVIDIA Jetson AGX Thor." The same table lists 26 ms on a Jetson AGX Orin, 50 ms on a Jetson Orin Nano, and 8 ms for one question on an NVIDIA RTX 4090. Liquid says those timings were run with NVIDIA. They are Liquid's claims for those devices.

## The license on the files

Both LICENSE files are titled "LFM Open License v1.0," with Liquid AI, Inc. as the licensor. Each model card sets `license: other` and `license_name: lfm1.0`, with `license_link: LICENSE`. Hugging Face therefore shows the tag "other." The LFM Open License is not an OSI-approved open-source license. The accurate label for these files is open weights, under the LFM Open License v1.0 that the cards point at.

The post says both models load with `trust_remote_code=True` and need `transformers` 5.14 or newer. That flag runs the downloaded modeling code, which is what Liquid's snippet asks for.
