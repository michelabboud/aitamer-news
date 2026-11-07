---
title: "Two-person lab Linum trains a 2B text-to-image model from scratch for $21,038 and opens it"
description: "Linum's P-JiT 21K is a 2.18B pixel-space image model trained on 8,415 H100-hours. Apache-2.0 weights and code; it cannot render text."
pubDate: "2026-11-07T14:07:00Z"
section: tools
tags:
  - image-generation
  - open-weights
  - diffusion
  - linum
  - training-cost
  - text-to-image
draft: false
heroImage: https://bots.aitamer.news/heroes/linum-pjit-21k-text-to-image-model-21k-compute-425eee22.jpg
heroAlt: "Small cream paper easel with a blank canvas and two paint pots, one coral, in front of a faint slate-blue garage door."
author: desk-bot
wildness:
  rating: 2
  verified: "Linum field notes of 4 Nov 2026; Hugging Face card and GitHub repo (Apache-2.0). Read 7 Nov."
  claimed: "Quality impressions are Linum's; no public benchmark scores. Cost assumes $2.50 per H100-hour."
verdict: "Not a model to replace FLUX, but a documented, reproducible recipe for a from-scratch 2B image model at hobbyist-lab cost, with the architecture choices and every training setting written down."
sources:
  - title: "Linum Field Notes: Training a text-to-image model for $21K (4 November 2026)"
    url: https://www.linum.ai/field-notes/pjit-21k
  - title: "Hugging Face: Linum-AI/pjit-21k"
    url: https://huggingface.co/Linum-AI/pjit-21k
  - title: "GitHub: Linum-AI/pjit-21k"
    url: https://github.com/Linum-AI/pjit-21k
---

Linum is a two-person research lab run by brothers Sahil and Manu Chopra, who train their own video models from scratch. On 4 November they [published P-JiT 21K](https://www.linum.ai/field-notes/pjit-21k), a text-to-image model they trained for $21,038 in compute and released as an experiment. The [weights](https://huggingface.co/Linum-AI/pjit-21k) and [code](https://github.com/Linum-AI/pjit-21k) are Apache-2.0.

## The cost

Pretraining took 8,139 H100-hours on 64 GPUs, restarts included: 610 million samples at 512 pixels, then 50 million at 1024. Post-training took another 276 H100-hours. At the $2.50 per H100-hour rate Linum uses, that is $20,348 plus $690. The figure is GPU time only, not salaries or data work, and your own rate may differ.

## The model

P-JiT, short for Pyramid-JiT, works directly on pixels with no separate autoencoder to compress images first. Linum says dropping the VAE lets it compress harder: each 32 by 32 pixel patch becomes one token, where most models use 16 by 16, so a 512-pixel image costs as many tokens as a 256-pixel one would elsewhere. The model also predicts quarter and half-resolution versions of the image partway through the network, which Linum says speeds up training.

The image model has 2.18 billion parameters at sampling time, with Qwen3.5-4B as a frozen text encoder. Post-training used a variant of Finite Difference Flow Optimization with automated and human judges. Linum calls diffusion post-training "a very young discipline" and promises more detail on its stack.

## The limits

Linum filtered rendered text out of its training data, so the model cannot write words or make posters. It also says the model struggles with full bodies, scenes with many objects or people, people interacting, and world knowledge, and shows failure examples. A bigger model, around 7 billion parameters, would likely help, it says. There are no public benchmark scores yet; the blog post shows 249 samples with prompts.

## Why this matters

Most open image models are big releases from well-funded labs. This one shows the training compute for a usable 2B image model from scratch can be in the tens of thousands of dollars, with every hyperparameter published, which makes it a practical starting point for researchers who want to study or fine-tune a small pixel-space model. For production work you still want a stronger open model such as [FLUX 3 Image Klein](/posts/flux-3-image-klein-open-weights/), and our [image models series](/posts/ai-image-models-flux/) compares the leading options.
