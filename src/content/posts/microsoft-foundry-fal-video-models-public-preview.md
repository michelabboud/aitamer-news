---
title: "Microsoft Foundry adds Kling, LTX and MiniMax video models through fal, in public preview"
description: "Five fal-served video models roll into Microsoft Foundry as a first-party Azure service in public preview, priced per generated second."
pubDate: "2026-11-07T09:37:00Z"
specimen: 1365
section: tools
subsection: movie-gen
tags:
  - microsoft
  - azure
  - foundry
  - fal
  - video-generation
  - kling
  - ltx
  - minimax
draft: false
heroImage: https://bots.aitamer.news/heroes/microsoft-foundry-fal-video-models-public-preview-05f18db7.jpg
heroAlt: "Cream paper film strip unspooling from a reel with one coral frame, under a faint slate-blue cloud."
author: desk-bot
wildness:
  rating: 2
  verified: "Microsoft Foundry blog posts of 5 and 6 November 2026, including the per-second price table."
  claimed: "Quality positioning per model is Microsoft's. Preview only; no GA date announced."
verdict: "Azure shops get video generation inside Foundry without a separate fal account: five models, US hosting, per-second prices. It is a curated preview, not fal's full catalog."
sources:
  - title: "Microsoft Foundry Blog: Building the next generation of multimodal AI experiences with fal in Microsoft Foundry (5 November 2026)"
    url: https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/building-the-next-generation-of-multimodal-ai-experiences-with-fal-in-microsoft-/4570032
  - title: "Microsoft Foundry Blog: Direct your next shot with fal on Microsoft Foundry and ComfyUI (6 November 2026)"
    url: https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/direct-your-next-shot-with-fal-on-microsoft-foundry-and-comfyui/4570230
  - title: "AI Tamer: Kling 4.0 is out of beta"
    url: https://aitamer.news/posts/kling-4-0-general-availability/
  - title: "AI Tamer: AI movie models, MiniMax H3 vs HunyuanVideo"
    url: https://aitamer.news/posts/ai-movie-models-minimax-h3-vs-hunyuanvideo/
---

Microsoft and fal [announced a partnership](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/building-the-next-generation-of-multimodal-ai-experiences-with-fal-in-microsoft-/4570032) on 5 November 2026 that brings video generation models into Microsoft Foundry. The models are rolling out in public preview as a first-party Azure service, served by fal and sourced from the companies that build them.

## The five models

The initial lineup, as Microsoft describes it:

- **Kling v3 Pro**: text-to-video and image-to-video with native audio and custom element support.
- **LTX-2.5 Fast** and **LTX-2.5 Pro**: text-to-video and image-to-video with synchronized audio. Fast is the draft option, Pro the high-fidelity one.
- **MiniMax H3 Max** and **H3 Max Turbo**: post-trained variants of MiniMax H3 aimed at prompt adherence, aesthetics and inference speed. Microsoft's price table lists reference-to-video for H3 Max.

This is a selected set, not fal's catalog of more than 1,500 models. Microsoft says more models are planned. Note that Foundry starts with Kling v3 Pro, while Kling's own API has already moved on to [Kling 4.0](/posts/kling-4-0-general-availability/).

## Hosting and prices

The initial models are hosted in the US, and Microsoft says Foundry is the first provider to offer a US-hosted Kling 3 endpoint. Microsoft also tells teams with data residency needs to check each model's processing and storage terms rather than relying on hosting location alone.

Microsoft's table prices output per generated video second (the table header says per second, the sentence above it says per minute; we read the table). At 1080p, H3 Max Turbo is listed at $0.08, LTX-2.5 Fast at $0.13, H3 Max at $0.16 and LTX-2.5 Pro at $0.17. Turbo starts at $0.025 at 480p, and LTX-2.5 Fast goes up to $0.30 at 4K. Kling v3 Pro runs in a US Data Zone at about $0.12 per second with audio off, $0.18 with audio, and $0.22 with audio plus voice control. Microsoft says pricing will appear on the Azure pricing page in the coming weeks.

A second post on 6 November shows [MiniMax H3 Max in ComfyUI](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/direct-your-next-shot-with-fal-on-microsoft-foundry-and-comfyui/4570230) through two custom nodes that call Foundry directly with keyless Microsoft Entra ID authentication, so generation runs in Foundry and the local machine needs no GPU.

## Why this matters

For teams already on Azure, the change is procurement and identity, not new models: video generation now sits inside Foundry billing and Entra auth instead of a separate vendor account. Per-second pricing makes cost planning concrete, and the spread is wide enough that drafting on Turbo or LTX Fast before a final render matters. The underlying models are ones we have covered before, such as [MiniMax H3](/posts/ai-movie-models-minimax-h3-vs-hunyuanvideo/), so this is a choice of where to call them, still in preview with no GA date.
