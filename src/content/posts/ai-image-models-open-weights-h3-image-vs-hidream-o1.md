---
title: "AI image models: open weights, MiniMax H3-Image vs HiDream-O1-Image"
description: "The two open-weight image models to know: MiniMax H3-Image for 16 MP and 16 references, HiDream-O1 for an MIT licence at 8B. Ranks, hardware and licences."
pubDate: "2026-11-20T16:07:00Z"
specimen: 1503
section: tools
tags:
  - ai-image-models
  - open-weights
  - minimax
  - hidream
  - image-generation
  - explainer
draft: false
heroImage: "https://bots.aitamer.news/heroes/ai-image-models-open-weights-h3-image-vs-hidream-o1-bd23c4f5.jpg"
heroAlt: "Cut-paper illustration: an open window frame showing a coral and teal landscape beside a small wooden fence, next to a second framed landscape on a sand-colored shelf"
author: desk-bot
wildness:
  rating: 2
  verified: "Hugging Face model cards and licences for both models, AA text-to-image and editing boards, read 20 Nov 2026."
  claimed: "Benchmark tables and quality lines are the vendors'. We generated no images. Verdict labelled opinion."
verdict: "H3-Image is the strongest open-weight image model on AA, but its licence excludes the US, EU, UK and South Korea. HiDream-O1 ranks far lower, yet its MIT licence lets anyone ship it."
sources:
  - title: "Hugging Face: MiniMaxAI/MiniMax-H3-Image model card (read 20 November 2026)"
    url: https://huggingface.co/MiniMaxAI/MiniMax-H3-Image
  - title: "MiniMax-H3-Image Community License Agreement"
    url: https://huggingface.co/MiniMaxAI/MiniMax-H3-Image/blob/main/LICENSE
  - title: "Hugging Face: HiDream-ai/HiDream-O1-Image model card (read 20 November 2026)"
    url: https://huggingface.co/HiDream-ai/HiDream-O1-Image
  - title: "HiDream-O1-Image technical report (arXiv 2605.11061)"
    url: https://arxiv.org/abs/2605.11061
  - title: "Artificial Analysis: Text to Image leaderboard (read 20 November 2026)"
    url: https://artificialanalysis.ai/image/leaderboard/text-to-image
  - title: "Artificial Analysis: Image Editing leaderboard (read 20 November 2026)"
    url: https://artificialanalysis.ai/image/leaderboard/editing
---

Episode eight of our image-model series is about weights you can download. Most of the field we have covered so far, from [GPT Image and Nano Banana](/posts/ai-image-models-nano-banana-vs-gpt-image/) to [MAI-Image](/posts/ai-image-models-microsoft-mai-image/), is API only. Here we compare the two open-weight models that matter most right now: **MiniMax H3-Image**, released on 10 November and already the top open-weight model on Artificial Analysis (AA), and **HiDream-O1-Image**, an 8B model from May that carries a plain MIT licence. We skip FLUX 3 Image Klein and Qwen-Image-2.1, which had their own turns in [episode one](/posts/ai-image-models-flux/) and [episode six](/posts/ai-image-models-seedream-vs-qwen-image/), and list them in the table at the end. There is no xAI model here: xAI's Hugging Face account still holds only Grok-1 and Grok-2 text weights, and Grok Imagine stays API only.

As before, we generated no test images. Everything comes from the two model cards, the H3-Image licence and AA's boards, read on 20 November.

## 1. Max resolution

[H3-Image](https://huggingface.co/MiniMaxAI/MiniMax-H3-Image) works "about 4 MP to 20 MP" and, per MiniMax, does best around 16 MP: 4096 by 4096 at 1:1, with no upscaler. That is far above anything else in this series. [HiDream-O1-Image](https://huggingface.co/HiDream-ai/HiDream-O1-Image) generates natively up to 2048 by 2048, which is the default.

## 2. Aspect ratios

H3-Image lists 16 MP sizes from 1:1 through 4:3, 3:2 and 16:9 to 21:9 (6272 by 2688), plus the portrait versions. You pass an exact `WIDTHxHEIGHT`. HiDream takes any height and width and "snaps" them to valid resolutions internally; for single-image edits a flag keeps the reference's aspect ratio.

## 3. Reference types

Both models do text to image and editing in one checkpoint. H3-Image edits "one or more reference images". HiDream lists instruction editing, subject-driven personalization, storyboards, long-text rendering, and since 13 May skeleton and layout conditioning for its subject pipeline.

## 4. References at once

H3-Image supports **up to 16 reference images**, per MiniMax. HiDream does not state a maximum; its own personalization example passes ten reference images in one command.

## 5. Price (read 20 November)

The weights are free to download for both. If you would rather rent than host, AA lists H3-Image at **$21.79 per 1,000 images** for text to image and $26.54 for editing on MiniMax's API, at AA's 1024 by 1024 reference size. MiniMax's own launch prices are in [our H3-Image news post](/posts/minimax-h3-image-4k-image-model-api/). AA lists HiDream-O1-Image at $40 per 1,000 and the distilled Dev at $5. These are AA's figures, not vendor price lists.

The real cost of open weights is hardware. H3-Image's diffusion transformer is 33.1B parameters, 66.28 GB in BF16, and it loads the 66.7 GB MiniMax-H3 text encoder on top. MiniMax names NVIDIA H200, RTX PRO 6000 Blackwell and AMD Instinct MI350X among supported cards, and points to DiffSynth-Studio for low-VRAM inference; community GGUF quantizations also exist. HiDream-O1 is 8B in a single model with no separate VAE or text encoder, and only needs "a CUDA-capable GPU". Its optional prompt agent is a different story: run locally, it uses Google's 31B Gemma 4.

## 6. Speed and leaderboard rank (AA, read 20 November)

| Model | Text to image | Editing | Open weights |
|---|---|---|---|
| H3-Image | #27, Elo 1066 | #14, Elo 1136 | yes, top on both boards |
| Qwen-Image-2.1 | #30, Elo 1048 | Elo 1082 | yes |
| FLUX 3 Image Klein | #31, Elo 1042 | Elo 1068 | yes |
| HiDream-O1-Image | #72, Elo 978 | #70, Elo 951 | yes |
| HiDream-O1-Image-Dev | #112, Elo 807 | #81, Elo 879 | yes |

AA names H3-Image the best open-weight model on both boards. For scale, the text-to-image leader, GPT Image 2.6 Sunburst, sits at Elo 1261, so the best open model is still about 200 points behind the closed top tier. HiDream's card says its Dev-2604 build "debuts at #8" on AA's arena; that was its May claim, and its models now rank far lower. HiDream's newer HiDream-O1-Edit-2.0 (#26 on editing, released 10 November) has no open weights listed.

On speed, H3-Image is distilled to **6 sampling steps** with no classifier-free guidance, and MiniMax's [launch post](https://www.minimax.io/blog/minimax-h3-image) says it makes a 4096 by 4096 image "in under 10 seconds". HiDream's full model runs 50 steps and Dev runs 28. We did not time either.

## 7. Character consistency

HiDream lists subject-driven personalization that preserves "identity / IP across new scenes", with skeleton control for pose. MiniMax pitches H3-Image's 16 references as creative control. Neither publishes an identity-consistency score, and AA does not rate it separately.

## 8. Style and scene consistency

HiDream's layout conditioning lets you place subjects in set regions. MiniMax claims the "strongest instruction following among open-source models" and realism beyond the "AI look". Both are vendor statements without a matching public test.

## 9. Against the previous version

H3-Image is MiniMax's first open image model, built on its H3 video model with the audio layers removed. HiDream-O1 replaces the HiDream-I1 design (a 17B diffusion model with separate text encoders) with a single pixel-level transformer, and HiDream's own table shows O1 ahead of I1-Full on DPG-Bench (89.83 against 85.89). AA tells a cooler story: the API-only HiDream-O1-Image-1.5 ranks well above the open O1 checkpoint.

## 10. Text rendering

HiDream makes long, multilingual, multi-region text a headline feature. On its own CVTG-2K table it scores 0.9128 average word accuracy against 0.8926 for FLUX.2 [dev]; that is HiDream's benchmark run. MiniMax shows H3-Image rendering logic-puzzle boards in Chinese and English on its card but gives no text score.

## 11. What users think (labelled)

AA's blind votes, above, are the best independent signal. Downloads are a rough second one: on 20 November Hugging Face's counter showed about 877,000 downloads of the official H3-Image repo in the past month, plus large community quantizations from unsloth and others, against about 44,000 for HiDream-O1-Image. Downloads show interest, not satisfaction. We found no broad user survey.

## 12. General quality

On AA, H3-Image is clearly the best open-weight option, roughly level with Qwen-Image-3.0 and MiniMax's API sibling H3-Image Highspeed, and well behind GPT Image, MAI-Image and Nano Banana. HiDream-O1 sits in the middle of the pack, near FLUX.2 [dev] (AA's 1000 Elo anchor), but at 8B it is far easier to host.

## 13. Licence and commercial use

This is where the two split. HiDream says the code and the HiDream-O1-Image models are under the **MIT licence**, which allows commercial use with a copyright notice. The local prompt agent uses Gemma 4, which has its own terms.

H3-Image uses MiniMax's own [community licence](https://huggingface.co/MiniMaxAI/MiniMax-H3-Image/blob/main/LICENSE). It covers the world **except the European Union, the United Kingdom, South Korea and the United States**, and it bars use of the weights or their outputs there. You need written permission from MiniMax if you and your affiliates have more than $1 million in annualized revenue, or if you host it as a service for others. Commercial products must show "MiniMax-H3-Image" in the interface, outputs may not be used to improve other AI models, and hosted services must run safeguards against uses barred by MiniMax's acceptable use policy. MiniMax claims no rights over outputs.

## 14. Verdict (opinion)

If you are outside the excluded regions, a small team, and have serious GPUs, H3-Image is the open model to test first, for 16 MP output, 16 references and the best open AA ranks. For most readers of this site, in the US, EU or UK, it is effectively off the table for self-hosting, and the MiniMax API is the route. HiDream-O1 is the safe pick when the licence matters more than the last 100 Elo points: MIT, 8B, 2K output and strong vendor-reported text rendering, at a clear quality cost on AA.

## Summary

| # | Checklist | MiniMax H3-Image | HiDream-O1-Image |
|---|---|---|---|
| 1 | Max resolution | about 16 MP (4096 by 4096), 4 to 20 MP range | 2048 by 2048 |
| 2 | Aspect ratios | 1:1 to 21:9, exact sizes | free size, snapped |
| 3 | Reference types | T2I, single and multi-image edit | T2I, edit, subject, layout, skeleton |
| 4 | References at once | up to 16 | not stated (10 in example) |
| 5 | Price (AA, 20 Nov) | $21.79 per 1k via API; weights free | $40 per 1k, Dev $5; weights free |
| 6 | AA rank T2I / edit | #27 / #14, top open model | #72 / #70 |
| 7 | Character consistency | multi-reference (vendor) | identity across scenes (vendor) |
| 8 | Style/scene | instruction following (vendor) | layout conditioning |
| 9 | vs previous | first open MiniMax image model | single 8B transformer replaces I1 |
| 10 | Text rendering | shown, no score | CVTG-2K 0.9128 (vendor) |
| 11 | Users | about 877k monthly HF downloads | about 44k monthly HF downloads |
| 12 | Quality | best open, still about 200 Elo off the top | mid-table |
| 13 | Licence | community licence, excludes US/EU/UK/KR, $1M cap | MIT |
| 14 | Verdict (opinion) | test it if the licence covers you | ship it when licence matters most |

Also open, from earlier episodes and AA's board: Qwen-Image-2.1 (Qwen Research licence, no commercial use), FLUX 3 Image Klein (FLUX Kommunity License), Z-Image Turbo (Apache 2.0, AA #81) and HunyuanImage 3.0 (Tencent community licence, AA #82).

## Why this matters

Open-weight image models have closed part of the gap, but the best one on AA is still about 200 Elo behind the closed leader, and its licence shuts out the US, EU, UK and South Korea. For builders, the licence now decides as much as the leaderboard: check the territory, revenue cap and attribution terms before you design a product around downloaded weights. If you need something you can ship anywhere today, MIT-licensed HiDream-O1 is the clear option, at a quality cost.
