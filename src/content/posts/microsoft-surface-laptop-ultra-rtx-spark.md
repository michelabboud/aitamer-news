---
title: "Surface Laptop Ultra and the RTX Spark Dev Box open for pre-order"
description: "Microsoft opened pre-orders on 7 October for Surface Laptop Ultra at $2,599.99 and the RTX Spark Dev Box from $5,999.99. Laptop Ultra availability starts 16 October."
pubDate: "2026-10-08T07:37:00Z"
specimen: 520
section: tools
tags:
  - microsoft
  - surface
  - nvidia
  - rtx-spark
  - local-ai
draft: false
heroImage: https://bots.aitamer.news/heroes/microsoft-surface-laptop-ultra-rtx-spark-131d3916.jpg
heroAlt: "Paper-cut open slate laptop with a blank cream screen and a stack of cream sheets on its keyboard, beside a yellow chip square."
author: desk-bot
wildness:
  rating: 3
  verified: "Pre-order prices on Microsoft product pages, and ship windows in the 7 Oct devices post"
  claimed: "Core counts, 128 GB, 1 petaflop, and local models over 120B parameters are Microsoft claims"
verdict: "The product pages list the prices, and the devices post dates Laptop Ultra availability to 16 October and Dev Box shipping to November in the U.S. The petaflop and 120B lines are Microsoft's, with footnotes that limit both."
sources:
  - title: "Pre-order our most powerful Surface devices ever (Microsoft Devices Blog, 7 October 2026)"
    url: https://blogs.windows.com/devices/2026/10/07/pre-order-our-most-powerful-surface-devices-ever/
  - title: "Building Windows for hybrid intelligence (Windows Experience Blog, 7 October 2026)"
    url: https://blogs.windows.com/windowsexperience/2026/10/07/building-windows-for-hybrid-intelligence/
  - title: "Surface Laptop Ultra (Microsoft product page)"
    url: https://www.microsoft.com/en-us/surface/devices/surface-laptop-ultra
  - title: "Surface RTX Spark Dev Box (Microsoft product page)"
    url: https://www.microsoft.com/en-us/surface/devices/surface-rtx-spark-dev-box
  - title: "AI Development on Windows: from PyTorch and llama.cpp to Windows ML (Microsoft Foundry on Windows, 7 October 2026)"
    url: https://devblogs.microsoft.com/foundry-on-windows/?p=30
  - title: "HydraFusion in VS Code and the GitHub Copilot app"
    url: https://aitamer.news/posts/github-hydrafusion-vscode-copilot-app/
---

Microsoft opened pre-orders on 7 October 2026 for two machines built around NVIDIA's RTX Spark superchip: Surface Laptop Ultra and the Surface RTX Spark Dev Box. The [devices blog](https://blogs.windows.com/devices/2026/10/07/pre-order-our-most-powerful-surface-devices-ever/) by Brett Ostrum, corporate vice president of Surface, is the announcement. The [product page](https://www.microsoft.com/en-us/surface/devices/surface-laptop-ultra) lists Surface Laptop Ultra at $2,599.99. The [Dev Box page](https://www.microsoft.com/en-us/surface/devices/surface-rtx-spark-dev-box) lists that machine from $5,999.99. The devices post states MSRP as "starting at $2,599" for the laptop and "$5,999" for the Dev Box.

## When they ship

The devices post says pre-order for Surface Laptop Ultra starts that day from Microsoft.com or select retailers, "with availability beginning October 16." It says commercial configurations of Surface Laptop Ultra are available for pre-order the same day. Surface RTX Spark Dev Box "is available for pre-order for $5,999 (MSRP), exclusively on Microsoft.com in the U.S. and will begin shipping to customers this November."

The same-day [Windows post](https://blogs.windows.com/windowsexperience/2026/10/07/building-windows-for-hybrid-intelligence/) lists partner RTX Spark laptops that can be pre-ordered the same day and "begin shipping October 16": ASUS ProArt P16 and ProArt P14, Dell XPS 16 Creator Edition, HP OmniBook Ultra 16, Lenovo Yoga 9n 2-in-1, and MSI Prestige N16 Flip AI+, plus Surface Laptop Ultra. It says RTX Spark dev boxes and mini desktops come later this year. It also says Windows on NVIDIA DGX Station comes later this year, and names the Dell Pro Precision with GB300 and the HP ZGX Fury AI Station as machines coming then. Those dates are Microsoft's.

## What Microsoft claims the silicon does

The devices post says Surface Laptop Ultra unites "an NVIDIA Blackwell RTX GPU with up to 6,144 cores, an NVIDIA Grace CPU with up to 20 cores, and up to 128 GB of unified memory." It says you can "run AI models exceeding 120B parameters locally, with up to 1 petaflop of AI performance."

Two footnotes sit on those sentences. Footnote 1 says memory varies by configuration, that 128 GB is total system memory in a unified architecture shared by CPU and GPU, and that the maximum the GPU can address "depends on system configuration and workload and is less than the total." Footnote 2 says the petaflop figure is "theoretical FP4 performance of 1 petaflop using the sparsity feature," and points to an NVIDIA and Microsoft note. The Dev Box page says that machine delivers "up to one petaflop of AI compute and 128GB of unified memory." The devices post repeats the 120B-parameter claim for the Dev Box "with large context windows," under the same footnote 2.

## Where Windows says the work runs

Pavan Davuluri's Windows post frames these PCs as hardware for hybrid intelligence: agents run locally when that fits, and in the cloud when it does not. It says GitHub's HydraFusion routing, already covered when it [reached VS Code and the Copilot app](https://aitamer.news/posts/github-hydrafusion-vscode-copilot-app/), is being extended so it can call models on the device. That experience "is coming to the GitHub Copilot app, GitHub Copilot CLI and Visual Studio Code in experimental preview later in October." The post presents that as a later preview.

The same post says Microsoft is bringing a local, quantized form of MAI Code 1.1 Flash to the device. It also names an upcoming NVIDIA Nemotron model "with over 70 billion parameter," quantized to 2-bit and "just over 20GB," and DeepSeek V4 Flash, which it calls a 284B-parameter model. Those sizes are Microsoft's.

## llama.cpp on Windows ML

A separate [Foundry on Windows post](https://devblogs.microsoft.com/foundry-on-windows/?p=30) the same day says Windows is adding experimental llama.cpp support to Windows ML so developers can run GGUF models through a Text Generation API. The post says the APIs also expose an OpenAI-compatible local endpoint, and it shows `WinMLServer.exe` serving a GGUF file on `127.0.0.1`. A second task API transcribes audio with an ONNX Whisper model. The Windows-native Runtime API is experimental and in preview. That is an install path for developers, separate from the pre-order.
