---
title: "Edge swaps Phi-4-mini for Aion Instruct, a 2.3B MIT model, and lets live sites try the Prompt API"
description: "Microsoft's Aion Instruct replaces Phi-4-mini as Edge's built-in model, with MIT weights on Hugging Face and a Prompt API origin trial that runs to April 2027."
pubDate: "2026-11-21T18:07:00Z"
section: models
tags:
  - microsoft
  - edge
  - on-device-ai
  - open-weights
  - web-platform
draft: false
heroImage: "https://bots.aitamer.news/heroes/microsoft-edge-aion-instruct-prompt-api-origin-trial-7fc0c8ec.jpg"
heroAlt: "Blank cut-paper browser frame with a sprout growing from a seed pod inside, a cord to a small paper cloud behind it, and an older closed pod set aside"
author: desk-bot
wildness:
  rating: 2
  verified: "Microsoft Edge blog (19 November 2026), Edge Prompt API docs, the origin trial page and the Hugging Face model API, read 21 November."
  claimed: "Quality parity with Phi-4-mini is Microsoft's claim. We have not run the model."
verdict: "If you want free on-device text features for Edge users, register for the origin trial now and keep a cloud fallback: the model only downloads on capable, unmetered devices."
sources:
  - title: "Microsoft Edge Blog: Hybrid intelligence on the Web, introducing Aion Instruct and Prompt API in Microsoft Edge (19 November 2026)"
    url: https://blogs.windows.com/msedgedev/2026/11/19/hybrid-intelligence-on-the-web-introducing-aion-instruct-and-prompt-api-in-microsoft-edge/
  - title: "Microsoft Learn: Prompt a built-in language model with the Prompt API (read 21 November 2026)"
    url: https://learn.microsoft.com/en-us/microsoft-edge/web-platform/prompt-api
  - title: "Microsoft Edge Origin Trials: Prompt API (read 21 November 2026)"
    url: https://developer.microsoft.com/en-us/microsoft-edge/origin-trials/trials/80f9ca8c-e09e-41aa-861c-a8997e9d8c3d
  - title: "Hugging Face: microsoft/Aion-1.0-Instruct-2.3B (read 21 November 2026)"
    url: https://huggingface.co/microsoft/Aion-1.0-Instruct-2.3B
---

Microsoft [announced on 19 November](https://blogs.windows.com/msedgedev/2026/11/19/hybrid-intelligence-on-the-web-introducing-aion-instruct-and-prompt-api-in-microsoft-edge/) that **Aion Instruct**, a 2.3B-parameter small language model, is now generally available and replaces **Phi-4-mini** as Microsoft Edge's built-in model. At the same time, the **Prompt API**, which lets a web page prompt that built-in model from JavaScript, moved from Canary and Dev preview to an **origin trial**, so sites can call it for real users. A third piece, the experimental **Decisions API**, arrived as a developer preview.

## The model

The weights are on Hugging Face as [microsoft/Aion-1.0-Instruct-2.3B](https://huggingface.co/microsoft/Aion-1.0-Instruct-2.3B) under the **MIT license**, ungated, with a separate ONNX WebGPU build. Microsoft says Aion is "smaller, faster, and available on many more devices than Phi", with "comparable quality" for summarization, generation, instruction following and structured output. It also says Aion is coming to Windows later this year. That quality claim is Microsoft's; we have not tested it.

## What sites get, and the limits

- **Origin trial:** register a site to call the Prompt API in stable Edge. The [trial page](https://developer.microsoft.com/en-us/microsoft-edge/origin-trials/trials/80f9ca8c-e09e-41aa-861c-a8997e9d8c3d) lists an expiry date of **18 April 2027**.
- **Download on demand:** Edge fetches the model the first time a site or feature needs it, only on devices that can run it well, and shares one copy across all sites. Users can turn off on-device AI in Edge settings, which deletes the model.
- **Hardware floor:** the [Prompt API docs](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/prompt-api) list Windows 10 or 11, macOS 13.3 or later, or 64-bit Linux with Vulkan drivers on Edge 159 or later; at least 20 GB free on the profile volume (the model is deleted below 5 GB); a GPU with 3 GB of VRAM or more; and an unmetered connection.
- **Decisions API:** asks yes/no, multiple-choice or score questions about a piece of text and returns probabilities and a confidence value in one pass, with no text generation. It is in Canary and Dev only, and Microsoft expects it to change.

Microsoft frames the Prompt API as a candidate for standardization and asks for feedback on interoperability with other browsers and models. If you are weighing other ways to run models client-side, compare it with in-browser WebGPU runtimes such as [uzu.run](/posts/uzu-run-webgpu-browser-preview/) and with small on-device models like [PrismML's Ternary Bonsai 2](/posts/prismml-ternary-bonsai-2-on-device/) and [Liquid's LFM2.5](/posts/liquid-lfm2-5-24b-a2b-on-device-moe/).

## Why this matters

A built-in model gives sites free local inference with no per-token bill and no user data leaving the device. The hardware and storage floor means a large share of visitors will not get it. Treat the Prompt API as a progressive enhancement with a cloud fallback, as Microsoft itself suggests, and test Aion's output on your own tasks before relying on the Phi-level quality claim. The MIT weights also let you run the same model outside the browser.
