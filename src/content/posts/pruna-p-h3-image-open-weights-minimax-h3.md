---
title: "Pruna turns the MiniMax-H3 video model into P-H3-Image, an open-weights image model with a territorial license"
description: "P-H3-Image makes and edits images in 8 steps on MiniMax-H3. Pruna says the 4-bit set peaks at 21 GB of VRAM, but the license excludes the US, EU, UK and Korea."
pubDate: "2026-11-03T22:07:00Z"
section: models
tags:
  - pruna
  - p-h3-image
  - minimax-h3
  - open-weights
  - image-generation
  - licensing
draft: false
heroImage: https://bots.aitamer.news/heroes/pruna-p-h3-image-open-weights-minimax-h3-8821983e.jpg
heroAlt: "Cut-paper film strip on a cream table with one frame lifted out as a single paper photograph, a small coral dot in its corner and a faint slate-blue film reel behind."
author: desk-bot
wildness:
  rating: 2
  verified: "Pruna post (3 Nov), both Hugging Face cards and the MiniMax H3 Community License text, read 3 Nov."
  claimed: "All speed, size and quality comparisons are Pruna's own. We did not run the model."
verdict: "A practical trick, turning a large video model into a single-image model that fits a 24 GB card in its smallest form. The license is the real gate: it does not cover the US, EU, UK or South Korea at all without a separate MiniMax deal."
sources:
  - title: "Pruna: P-H3-Image, turning a SOTA video model into an efficient open image model (3 November 2026)"
    url: https://www.pruna.ai/blog/oss-p-h3-image-launch
  - title: "Hugging Face: PrunaAI/P-H3-Image (Diffusers pipeline)"
    url: https://huggingface.co/PrunaAI/P-H3-Image
  - title: "Hugging Face: PrunaAI/P-H3-Image-Comfy (ComfyUI files)"
    url: https://huggingface.co/PrunaAI/P-H3-Image-Comfy
  - title: "MiniMax H3 Community License Agreement (LICENSE in PrunaAI/P-H3-Image)"
    url: https://huggingface.co/PrunaAI/P-H3-Image/blob/main/LICENSE
---

Pruna has released P-H3-Image, an open-weights model for text-to-image generation and image editing built on MiniMax-H3, a video model. In its [launch post](https://www.pruna.ai/blog/oss-p-h3-image-launch) on 3 November, Pruna says H3 can already output single frames, but they "come out soft and blurry", and the model is too large and slow for most people to run. P-H3-Image is its attempt to fix both.

## What Pruna changed

Pruna says it reworked each stage of H3 for still images:

- **Prompt upsampler:** a small model based on Qwen3.5-9B rewrites a short request into the kind of prompt H3 handles well. It is on by default.
- **Text encoder:** distilled from 32B to 4B parameters (9 GB instead of 67 GB).
- **Sampling:** the diffusion schedule is retuned for fine detail, and distillation cuts the step count from 50 to 8, with no classifier-free guidance.
- **Backbone:** the timestep block, which Pruna says is 40% of H3's transformer, is replaced with a smaller one, taking the backbone from 33B to 20B parameters.
- **Decoder:** a new decoder turns one frame into one sharp image instead of decoding several video frames at once.
- **Quantization:** 8-bit and 4-bit versions of the components.

The model works best at 8 megapixels, according to the [model card](https://huggingface.co/PrunaAI/P-H3-Image), and editing takes one to eight input images: the first is edited and the others act as references. Pruna lists its own limitations: hands, small background figures and fine detail can distort, especially below 8 MP, and small or dense text is unreliable.

## Speed and memory, by Pruna's numbers

Pruna says the 8-step model renders a 4 MP image in 2.6 seconds on one NVIDIA B200, against 12.4 seconds for the 50-step H3, and that the smallest set is a 20 GB download against 143 GB for H3. The figures depend on which package you pick:

- The [ComfyUI files](https://huggingface.co/PrunaAI/P-H3-Image-Comfy) come in bf16, int8 and 4-bit. Pruna lists peak VRAM at 8 MP as about 56 GB, 31 GB and 21 GB respectively, so only the 4-bit set fits a 24 GB card. Pruna says the 4-bit version keeps the quality but can change small details and sometimes the composition.
- The Diffusers pipeline card lists a 33.1B-parameter transformer and says that at 8 MP in bf16 it needs about 101 GB of GPU memory, such as one H200 or B200, or 80 GB with offloading.

## What the license actually says

P-H3-Image is a derivative of MiniMax-H3, so it ships under the MiniMax H3 Community License, and we read the LICENSE file in the repository. Its scope is "expressly limited to the Applicable Territory", defined as worldwide excluding the "Excluded Territories": "the European Union, the United Kingdom, the Republic of Korea and the United States of America." Use, reproduction, distribution or display of the model or its outputs outside that territory "is not authorized by this Agreement". MiniMax invites anyone in those regions to contact it about a separate license.

Other terms worth knowing before you build on it:

- Commercial products and services earning more than $20 million a year need separate written authorization from MiniMax.
- A commercial product or service that uses the model must "prominently display" MiniMax H3 on its user interface. A "Powered by MiniMax H3" notice is listed as something licensees are "encouraged" to show.
- Outputs may not be used to improve any other AI model, apart from MiniMax H3 and its derivatives.
- Anyone offering generation to third parties must keep safeguards against uses that break the license's acceptable use policy.

Pruna's own code is more permissive: it says the Qwen-based text encoder parts and the prompt upsampler are Apache 2.0, and its ComfyUI nodes are MIT. This is the same base license we flagged when [Pika shipped H3 Flex](/posts/pika-h3-flex-open-weights-video-model-license-excludes-us-eu/) video adapters on MiniMax-H3.

## Why this matters

If you are outside the excluded regions and own a 24 GB GPU, the 4-bit ComfyUI set is a local open-weights image model with editing, per Pruna's own VRAM figures. Teams in the US, EU, UK or South Korea cannot use it under this license at all, so for them other open-weights image models, such as the 5.6B [FLUX 3 Image Klein](/posts/flux-3-image-klein-open-weights/) under its own Kommunity license, are the realistic comparison. Whatever your region, treat the speed and quality claims as Pruna's until you run your own prompts at 8 MP.
