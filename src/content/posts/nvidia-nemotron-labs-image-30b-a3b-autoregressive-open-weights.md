---
title: "NVIDIA posts Nemotron-Labs-Image-30B-A3B, an autoregressive image model, under a non-commercial license"
description: "NVIDIA's Nemotron-Labs-Image-30B-A3B draws images token by token instead of by diffusion. Weights are out for research and evaluation use only."
pubDate: "2026-11-27T17:07:00Z"
section: models
subsection: opensource
tags:
  - nvidia
  - nemotron
  - image-generation
  - open-weights
  - text-to-image
draft: false
heroImage: "https://bots.aitamer.news/heroes/nvidia-nemotron-labs-image-30b-a3b-autoregressive-open-weights-5bbd73a7.jpg"
heroAlt: "Cut-paper scene of a hand placing a coral tile into a mountain and lake picture built row by row from square paper tiles, with a small padlock tag tied to the frame"
author: desk-bot
wildness:
  rating: 3
  verified: "Hugging Face model card, API metadata, commit history and LICENSE file, read 27 Nov 2026."
  claimed: "Scores are NVIDIA's, for its whole agent framework at best settings, not the model alone. We ran no images."
verdict: "An unusual design worth studying, not a model to ship: the license allows research and evaluation only, and the reference setup needs four 80GB GPUs."
sources:
  - title: "NVIDIA: Nemotron-Labs-Image-30B-A3B model card (Hugging Face)"
    url: https://huggingface.co/nvidia/Nemotron-Labs-Image-30B-A3B
  - title: "Nemotron-Labs-VisualCreation: Pixel as Code for Agentic Visual Creation (paper page)"
    url: https://huggingface.co/papers/2611.31358
  - title: "NVIDIA OneWay Noncommercial License (22 March 2022)"
    url: https://developer.download.nvidia.com/licenses/NVIDIA-OneWay-Noncommercial-License-22Mar2022.pdf
---

NVIDIA has published the weights for Nemotron-Labs-Image-30B-A3B, a text-to-image model that works more like a language model than a diffusion model. The [model card](https://huggingface.co/nvidia/Nemotron-Labs-Image-30B-A3B) describes it as an autoregressive raster generator initialized from Nemotron 3 Nano, with 30B total and 3B active parameters. The repository's public snapshot landed on 24 November, with documentation updates through 25 November.

## How it makes images

Instead of removing noise step by step, the model writes an image as a grid of discrete visual tokens, one 16 by 16 pixel patch at a time. A bundled tokenizer of about 642M parameters turns those tokens back into pixels. NVIDIA says it trained the model with progressive mid-training followed by GRPO, a reinforcement learning method, for prompt alignment and image quality.

The model is one part of a larger NVIDIA framework called Nemotron-Labs-VisualCreation. In that framework, [Nemotron 3.5 Super VL](/posts/nvidia-nemotron-3-5-super-vl-bolt-open-weights/) picks the best of several generated candidates, and other models write code for editable pages, slides and charts. Only the image model and its tokenizer are out; the card says the framework harness and the VisionCode models "will be released upon legal clearance". NVIDIA also released the [Dory looped model](/posts/nvidia-nemotron-labs-dory-4b-looped-model/) under the Nemotron Labs name in October.

## Read the scores carefully

The card's results table puts the framework ahead of GPT Image 2 and Nano Banana Pro on several benchmarks, including 92.86 on GenEval and 86.0 on BizGenEval. It also shows it behind on others, such as GenEval2 and Qwen-Image-Bench. Two caveats: NVIDIA says the table reports its best score per benchmark across the configurations in the paper, and the numbers describe the whole VisualCreation framework, not the image model running alone. We have not generated any images with it.

## Running it

The reference script uses vLLM with four 80GB H100 GPUs, CUDA 13.0 and Python 3.12. It is not a Diffusers pipeline, and loading runs repository code through `trust_remote_code=True`, so the card advises pinning and reviewing a specific revision. Recommended sizes include 1024 by 1024 and 1184 by 880.

## Why this matters

Most open image models we cover are diffusion models, so a token-by-token generator built from a language model is worth a look if you study how text and image models might merge. But it is not a production option: the NVIDIA license allows non-commercial research and evaluation only, while NVIDIA keeps commercial rights for itself. If you need an open image model you can ship, [Ming-Image-0.2-Design](/posts/ming-image-0-2-design-open-weights-ant-group/) is under MIT; treat this one as a research reference.
