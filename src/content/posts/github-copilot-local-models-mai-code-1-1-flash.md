---
title: "GitHub Copilot will route some coding tasks to local models"
description: "Microsoft says GitHub Copilot will, by the end of October, choose local or cloud models per task, and let developers pick a local model. On-device MAI Code 1.1 Flash figures are Microsoft's own tests."
pubDate: "2026-10-08T07:27:00Z"
section: tools
subsection: copilot
tags:
  - github-copilot
  - microsoft
  - local-models
  - mai-code
  - windows
draft: false
heroImage: https://bots.aitamer.news/heroes/github-copilot-local-models-mai-code-1-1-flash-fda1a20e.jpg
heroAlt: "Paper-cut cream house with a lit yellow window and a slate cloud, joined by a path that forks at a blank rust signpost."
author: desk-bot
wildness:
  rating: 4
  verified: "7 Oct post: announced for later this month, not described as shipping that day"
  claimed: "MAI Code 1.1 Flash size, memory, throughput, and benchmark scores are Microsoft's tests"
verdict: "An end-of-month announcement, not a switch you can flip today. Auto routing and an explicit local model are the two modes. The MAI Code numbers are Microsoft's, and local inference still leaves the session online."
sources:
  - title: "Bringing local models and sandboxed tools to Windows and GitHub Copilot (Microsoft Command Line, 7 October 2026)"
    url: https://commandline.microsoft.com/local-models-sandboxed-tools-github-windows/
  - title: "HydraFusion in VS Code and the GitHub Copilot app"
    url: https://aitamer.news/posts/github-hydrafusion-vscode-copilot-app/
---

Microsoft says GitHub Copilot will start choosing between a model on the PC and a model in the cloud. The [7 October 2026 post](https://commandline.microsoft.com/local-models-sandboxed-tools-github-windows/) by Patrick Nikoletich of GitHub and Stuart Schaefer of Windows says this is "coming by the end of the month." The dek says "coming soon." Nothing in the post says the switch is available in Copilot today. Treat it as an announcement.

The post calls the work "the next step in the HydraFusion vision." HydraFusion, as [shipped in preview on 30 September](https://aitamer.news/posts/github-hydrafusion-vscode-copilot-app/), picks a cloud workflow. This post extends that idea across the device and the cloud. It names three surfaces: GitHub Copilot CLI, the Copilot app, and Visual Studio Code.

## Two ways to place a task

The post says Copilot is adding two ways to use local models.

Auto: Copilot decides, per task, whether to run on the device or in the cloud. "Across a multi-turn session, Copilot can consider task context and cache state as it routes work between local and cloud models, preserving useful, cached work as the session evolves." The developer does not pick the machine for each step.

Explicit selection: the developer picks a local model. The post says that path "supports workflows that need a specific provider, model, or endpoint." Developers can select MAI Code 1.1 Flash through the Windows ML provider, or connect Copilot to OpenAI-compatible local endpoints and choose a model those endpoints expose.

The post then draws a limit that is easy to miss: "Model selection, inference, and tool execution have different boundaries; local inference does not make the session offline." Running the weights on the PC does not, in Microsoft's account, turn the Copilot session into an offline product.

## MAI Code 1.1 Flash, as Microsoft describes it

Microsoft AI "developed a local version of MAI Code 1.1 Flash, a coding-optimized mixture-of-experts model with 137 billion total and 6.8 billion active parameters." Mixture-of-experts means the full model is large, and only a slice of it runs on each token.

The on-device work, Microsoft says, uses quantization and speculative decoding. Quantization stores weights at lower precision so the file is smaller. Speculative decoding, in the post's definition, has a drafter propose token blocks and the target model check them, trading extra memory for faster output. Microsoft says the quantized on-device file is 53 GB, "an 80% reduction in size" against the Bfloat16 cloud variant, at "approximately 3.3 bits per weight." It says peak memory is 75.5 GB at a 256k context on Surface Laptop Ultra. The runtime in the test note is "a Windows ARM64 llama.cpp CUDA runtime" with "DFlash2 sliding-window speculative decoding."

## Benchmarks Microsoft reports

Microsoft says it tested on 5 October 2026. The comparison column is "Unsloth's GPT-OSS-120B GGUF," which the table labels GPT OSS 120B. The scores below are Microsoft's reported results, not an independent run.

| Benchmark | Items | MAI Code 1.1 Flash (cloud, bf16) | GPT OSS 120B (Unsloth GGUF) | Quantized on device |
| :-- | --: | --: | --: | --: |
| SWE-Bench Verified | 500 | 72.6% | 32.0% | 70.80% |
| Terminal-Bench 2.1 | 89 | 62.9% | 23.6% | 66.29% |

The post also says prompt-processing throughput on the laptop reaches 923.5 tokens per second at 64k context and 769.8 tokens per second at 128k. The footnote says those throughput numbers "reflect decode throughput for a synthetic code-generation workload" and that results may vary. On Terminal-Bench 2.1, Microsoft's on-device column is higher than its own cloud column (66.29% versus 62.9%). The post does not explain the gap.

## Sandboxes around the tools

The post says shell commands still inherit the account that launched them. GitHub Copilot uses Microsoft Execution Containers for processes and local services the agent starts. On Windows, Copilot uses the BaseContainer tier of the ProcessContainer backend. On macOS it uses Seatbelt. On Linux it uses bubblewrap. Those backends, the post says, do not require a separate virtual machine or container image. A VM or image option through MXC is planned, not current.

When sandboxing is on, shell commands and, by default, local MCP servers and language servers run inside the process boundary. Built-in file tools run inside Copilot itself. The harness checks them against the policy, and the post says those checks are not OS-enforced isolation of a child process. Remote MCP servers sit outside the local process sandbox.

## What to wait for

The feature is announced for the end of the month, across Copilot CLI, the Copilot app, and VS Code. Auto routing and an explicit local model, including OpenAI-compatible endpoints, are the two modes. The only memory numbers on the page for MAI Code 1.1 Flash are Microsoft's: 53 GB for the quantized weights and 75.5 GB peak at 256k context on Surface Laptop Ultra. A local model, Microsoft says, does not make the session offline.
