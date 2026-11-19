---
title: "Prime Intellect's Model Factory puts RL, fine-tuning and inference on one platform"
description: "Prime Intellect's Model Factory beta runs RL, SFT, pre-training and one-click endpoints for open-weight models, per GPU-hour or on dedicated clusters."
pubDate: "2026-11-19T09:07:00Z"
section: models
subsection: training
tags:
  - prime-intellect
  - reinforcement-learning
  - fine-tuning
  - open-weights
  - training-infra
draft: false
heroImage: "https://bots.aitamer.news/heroes/prime-intellect-model-factory-rl-sft-inference-89e560e1.jpg"
heroAlt: "A coral origami bird inside a layered oval track, with an anvil and hammer above it and a magnifying glass resting on the rim."
author: desk-bot
wildness:
  rating: 2
  verified: "Prime Intellect's 18 November launch post and Model Factory docs, and Palo Alto Networks' 18 November press release, read 19 November."
  claimed: "The 48% MFU figure and the case for owning your weights are Prime Intellect's. We have not run a job."
verdict: "Worth a look if you already post-train open models and are tired of stitching trainer, sandboxes and serving together. It is beta, and the rates live in the CLI, not the launch post."
sources:
  - title: "Prime Intellect: Introducing Model Factory (18 November 2026)"
    url: https://www.primeintellect.ai/blog/introducing-model-factory
  - title: "Prime Intellect docs: Model Factory overview"
    url: https://docs.primeintellect.ai/model-factory/overview
  - title: "Palo Alto Networks to acquire Applied Compute (18 November 2026)"
    url: https://www.paloaltonetworks.com/company/press/2026/palo-alto-networks-to-acquire-applied-compute--bringing-secure-open-weight-ai-to-the-enterprise
---

Prime Intellect launched **Model Factory** on 18 November, the successor to its earlier Lab product. It puts reinforcement learning, supervised fine-tuning, pre-training and inference on one control plane, so a checkpoint from one step is ready for the next. The docs mark it as beta.

## Two ways in

- **On demand:** you submit a training config and Prime Intellect runs it on GPUs it operates. Billing is per GPU-hour, prorated to the second, and it is self-serve.
- **Dedicated:** a reserved cluster with managed training and inference plus direct Slurm and Kubernetes access, for teams that need to change the framework itself. That route goes through sales.

Hosted runs are launched with `prime train` and a TOML config. The docs say `prime train models` lists which models start warm and what each GPU type costs, and the launch post gives no prices of its own.

## What is in the box

The loop is train, evaluate, deploy, improve. Training is built on Prime Intellect's open-source `prime-rl`, and environments and evals on its `verifiers` library, with Environments Hub and Harbor support. For coding and tool-use agents, the company says a run can use up to tens of thousands of concurrent microVM sandboxes. A trained checkpoint becomes an inference endpoint in one click, and **Prime Traces** records what an agent did in production, which tools it called and where it failed, to feed the next run.

Dedicated deployments add a `prime factory` CLI with health checks, automatic node replacement and restart from the latest checkpoint. Prime Intellect also says its Prime Mega MoE kernels reached 48% model FLOPs utilisation on H200s with Qwen's 235B MoE architecture, its own figure.

## The pitch, and the same-day deal

Prime Intellect's argument is that renting a closed model means you can't train it on your own reward signal, you hand your prompts to the provider, and the provider can retire the version you depend on. Owning open weights, it says, fixes all three. That is the same post-training-as-a-service idea behind Thinking Machines' [Tinker](/posts/thinking-machines-tinker-one-year-serving/), which now serves its own [Inkling 2 Small](/posts/thinking-machines-inkling-2-small/).

The same day, Palo Alto Networks agreed to buy Applied Compute, which sells a post-training and inference platform for open-weight models, in an all-stock deal valued at $4.5 billion. Palo Alto expects it to close in its fiscal third quarter of 2027, subject to regulatory clearance.

## Why this matters

If you already fine-tune or run RL on open models, Model Factory bundles the trainer, sandboxes, evals and serving you would otherwise wire together yourself, and the dedicated tier keeps Slurm and Kubernetes access for custom work. It is beta and the launch post has no price list, so check `prime train models` for current rates before planning a budget. A $4.5 billion bid for Applied Compute on the same day shows that hosted post-training for open weights is now a product category large buyers are paying for.
