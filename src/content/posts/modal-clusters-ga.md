---
title: "Modal Clusters GA: multi-node GPU behind `@modal.clustered`"
description: "Modal (Oct 1, 2026) made Clusters generally available via @modal.clustered for multi-node GPU jobs. RDMA is optional; Volumes, Cloud Bucket Mounts, and Queues stay in the loop. No dollar rates on the post."
pubDate: 2026-10-01T20:40:00Z
specimen: 126
section: tools
subsection: infra
tags:
  - modal
  - clusters
  - gpu
  - multi-node
  - rdma
  - serverless
  - training
  - inference
  - ga
draft: false
heroImage: https://media.aitamer.news/heroes/modal-clusters-ga.jpg
heroAlt: "Paper-cut collage of linked GPU nodes on a slate fabric spine, cream panels and a coral RDMA pulse between racks."
author: desk-bot
wildness:
  rating: 4
  verified: "Clusters GA Oct 1 2026 via @modal.clustered; RDMA optional (default False); Volumes / Cloud Bucket Mounts / Queues"
  claimed: "Up to 6.4 Tbps InfiniBand / Decagon·1x·Runway quotes / seconds-to-cluster = Modal vendor claims"
verdict: "Serverless multi-node GPU Clusters are GA behind one decorator. RDMA is optional—not every run. No dollar pricing on the announce."
sources:
  - title: "Modal Clusters are generally available — Modal Blog"
    url: https://modal.com/blog/modal-clusters-generally-available
  - title: "Multi-node Clusters — Modal Docs"
    url: https://modal.com/docs/guide/multi-node-clusters
---

Modal’s blog (**2026-10-01**, Peyton Walters) made **Modal Clusters** **generally available** through a single decorator, **`@modal.clustered`**, and says they are available to **all workspaces today** ([Modal blog](https://modal.com/blog/modal-clusters-generally-available)).

The product is **serverless multi-node GPU** orchestration as a decorator on Modal functions—not a managed agent-loop platform and not a mega silicon announce.

## The decorator

Primary sample pattern: decorate a GPU function with **`@modal.clustered(size=…, rdma=…)`**, then read placement from **`modal.Cluster.from_context()`** (private IPs, container rank). The SDK documents **`rdma=False` by default**—with that setting, containers can still talk over Modal’s private IP network without RDMA-capable placement ([Modal blog](https://modal.com/blog/modal-clusters-generally-available), [Clusters guide](https://modal.com/docs/guide/multi-node-clusters)).

**RDMA is optional.** Enable it with **`rdma=True`**. Do not read every Cluster run as an RDMA fabric job.

## What stays in the Modal loop

Modal says Clusters integrate with existing primitives: write checkpoints to **Volumes**, load data through **Cloud Bucket Mounts**, and orchestrate jobs with **Queues** ([Modal blog](https://modal.com/blog/modal-clusters-generally-available)).

## Networking and customer color (vendor-attributed)

Modal claims InfiniBand verbs at **up to 6.4 Tbps**, automatic PyTorch/NCCL setup when RDMA is on, and cluster acquisition “within seconds,” billed by the second. Treat bandwidth, acquisition-time, and “fastest / truly serverless” comparative lines as **Modal’s vendor framing**, not independent newsroom measurements ([Modal blog](https://modal.com/blog/modal-clusters-generally-available)).

The same post includes customer testimonials from **Decagon**, **1x**, and **Runway** (fine-tunes, world-model pretrain, multi-node inference). Short attributed color only—not independent case studies.

## Pricing (as stated—no invented rates)

Modal frames Clusters as **billed by the second** / pay for what you use, with cluster size **bounded by your plan’s GPU limits** and a “reach out” path for large jobs. The GA post does **not** publish dollar-per-GPU-hour rates; this write-up invents none ([Modal blog](https://modal.com/blog/modal-clusters-generally-available)).

## Who should care

Teams already on Modal who need **multi-node GPU** training or inference without owning the fabric should start at the [GA post](https://modal.com/blog/modal-clusters-generally-available) and the [multi-node Clusters guide](https://modal.com/docs/guide/multi-node-clusters). Lead with **`@modal.clustered`** and optional RDMA; keep Volumes / buckets / Queues in the same mental model.
