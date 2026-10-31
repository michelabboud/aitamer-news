---
title: "Sperid Labs releases Idol, a 0.66B model that turns one image into 3D Gaussian splats in under 8 GB"
description: "Idol turns a single image into up to a million 3D Gaussians and runs in about 7 GB of VRAM. Its Apache tag covers Idol, not the gated parts it needs."
pubDate: "2026-10-31T08:37:00Z"
section: models
subsection: opensource
tags:
  - sperid-labs
  - idol
  - image-to-3d
  - gaussian-splatting
  - open-weights
  - 3d
draft: false
heroImage: "https://bots.aitamer.news/heroes/sperid-labs-idol-open-image-to-3d-gaussian-splats-8gb-905fc489.jpg"
heroAlt: "A three-dimensional vase built from many overlapping small blue paper discs rises from a flat sheet of cream paper."
author: desk-bot
wildness:
  rating: 2
  verified: "Hugging Face model card and Sperid's research page, read 30 Oct 2026."
  claimed: "Speed and quality comparisons with TRELLIS, TripoSplat and LGM are Sperid's own."
verdict: "A 3D model you can actually run on a 10 GB gaming card. Read the DINOv3 and FLUX.2-dev terms before you build anything commercial on it."
sources:
  - title: "Hugging Face: speridlabs/idol"
    url: https://huggingface.co/speridlabs/idol
  - title: "Sperid Labs: Idol research page"
    url: https://speridlabs.com/research/idol
  - title: "GitHub: speridlabs/idol-sdk"
    url: https://github.com/speridlabs/idol-sdk
---

Sperid Labs posted [Idol](https://huggingface.co/speridlabs/idol) on Hugging Face on 28 October. It is an image-to-3D model that turns one picture of an object into a 3D Gaussian splat, the point-cloud-like format that renders photoreal views in real time. The [research page](https://speridlabs.com/research/idol) lists 0.66B parameters and output from 32,768 up to 1,048,576 Gaussians.

## What it takes to run

The model card says peak VRAM is about 7.2 GB. A full request uses about 1.80B parameters once the image encoders are counted, with about 3 GB of weights. Sperid's timing table, at 50 steps and 262,144 Gaussians, gives per-request times of:

| GPU | Time per request |
| :--- | ---: |
| B300 | 3.4 s |
| H100 | 6.7 s |
| RTX 5090 | 14.1 s |
| RTX 4090 | 19.1 s |
| RTX 3080 10 GB | 46.2 s |

The card also says "under 2 seconds" elsewhere, which does not match its own table, so plan with the table. Code is in [idol-sdk](https://github.com/speridlabs/idol-sdk), and there is a Hugging Face Space demo.

## Benchmarks and licence

Sperid compares Idol with TripoSplat, TRELLIS and LGM on its own benchmark. These are self-reported, and LGM beats Idol on PSNR in that table. The repository is tagged Apache-2.0 but has no LICENSE file, and that tag covers Idol's own weights. Idol needs two other components: Meta's gated `facebook/dinov3-vith16plus` encoder and the VAE from `black-forest-labs/FLUX.2-dev`, which come with their own licences. Check those before shipping a product.

## Why this matters

An image-to-3D model with published weights that fits in under 8 GB, with timings down to a 10 GB RTX 3080, brings game-asset, product-shot and AR prototyping to ordinary desktop cards, while open interactive [world models](/posts/tencent-hy-nomas-open-interactive-world-model/) keep pushing 3D generation forward. The licence chain is the catch: an Apache tag on the main repo does not make the whole pipeline free to use commercially, since Black Forest Labs puts its own terms on FLUX weights, as with the [Kommunity licence on FLUX 3 Image Klein](/posts/flux-3-image-klein-open-weights/).
