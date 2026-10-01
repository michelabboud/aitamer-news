---
title: "Modal VM Sandboxes GA: full Linux VMs behind `runtime=\"vm\"`"
description: "Modal (Oct 1, 2026) made VM Sandboxes generally available via runtime=\"vm\": full Linux VMs (Cloud Hypervisor–based) with Sandbox APIs, Images, and cold-starts; gVisor stays default."
pubDate: 2026-10-01T23:40:00Z
specimen: 143
section: tools
subsection: infra
tags:
  - modal
  - sandboxes
  - vm-sandboxes
  - gvisor
  - cloud-hypervisor
  - agents
  - docker
  - serverless
  - ga
draft: false
heroImage: /heroes/modal-vm-sandboxes-ga.jpg
heroAlt: "Paper-cut collage of a Linux VM chassis beside a gVisor container lane, coral runtime toggle, cream panels on slate fabric."
author: desk-bot
wildness:
  rating: 4
  verified: "VM Sandboxes GA Oct 1 2026; runtime=\"vm\"; API/Image/cold-start/burst parity; gVisor default; Cloud Hypervisor–based"
  claimed: "20M+ early VMs / Linear·Legora·Snorkel quotes = Modal vendor claims; GPU Sandboxes gVisor-only per docs"
verdict: "One-flag VM Sandboxes are GA for Docker/FUSE/kernel-shaped agent workloads. gVisor stays the default. Not Modal Clusters."
sources:
  - title: "VM Sandboxes: Full computers for agents — Modal Blog"
    url: https://modal.com/blog/vm-sandboxes-agent-computers
  - title: "VM Sandboxes — Modal Docs"
    url: https://modal.com/docs/guide/vm-sandboxes
---

Modal’s blog (**2026-10-01**, Amit Prasad) made **VM Sandboxes** **generally available**—a one-flag flip to a full Linux VM that keeps the familiar Sandbox surface ([Modal blog](https://modal.com/blog/vm-sandboxes-agent-computers)).

Enable with **`modal.Sandbox.create(..., runtime="vm")`**. Modal says you get the **same APIs**, **`modal.Image`s**, **sub-second cold-starts**, and **CPU/memory bursting** as gVisor Sandboxes, including the concurrent scale users already run ([Modal blog](https://modal.com/blog/vm-sandboxes-agent-computers)).

## What it is

Modal describes a **fully capable Linux VM** built on a **custom runtime** that starts from the **Rust-based Cloud Hypervisor** project, with host filesystem, lazy image loading, memory bursting, and snapshotting work layered on. Engineering deep dives are framed as **coming in the weeks ahead**—promised write-ups, not additional features shipping in this announce ([Modal blog](https://modal.com/blog/vm-sandboxes-agent-computers)).

Reach for **`runtime="vm"`** when workloads hit userspace walls: **Docker**, **FUSE** filesystems, or **niche Linux kernel** features. Modal’s Docker-in-Docker sample is illustrative of that shape ([Modal blog](https://modal.com/blog/vm-sandboxes-agent-computers)).

## gVisor stays default

Happy Sandbox workloads can stay put. Modal states **gVisor remains the default** runtime; both runtimes share the same APIs, Images, and **usage-based pricing** framing. The GA post publishes **no dollar rates**—this brief invents none ([Modal blog](https://modal.com/blog/vm-sandboxes-agent-computers)).

Modal’s docs companion notes **GPU Sandboxes are only supported with `runtime="gvisor"`**—the blog primary is silent on GPUs for `runtime="vm"`, so do not read this GA as GPU-on-VM ([VM Sandboxes guide](https://modal.com/docs/guide/vm-sandboxes)).

## Early customers (Modal-attributed)

Modal says early customers have **already launched over 20 million VMs**. Short named color from the same post: **Linear** (Coding Sessions / Docker via a single-flag switch), **Legora** (Docker/FUSE workarounds removed for long-horizon legal evals), and **Snorkel** (Harbor multi-container simulations). Quotes and product vignettes are **vendor marketing**—not independent case studies or SLAs ([Modal blog](https://modal.com/blog/vm-sandboxes-agent-computers)).

## Not Modal Clusters

**Modal Clusters** is a separate **multi-GPU / multi-node** story (`@modal.clustered`). This post is a **Sandbox runtime** flip for agent computers—do not merge the two Oct 1 Modal GA lanes ([Modal blog](https://modal.com/blog/vm-sandboxes-agent-computers)).

## Who should care

Teams whose agents need a **real-machine** shape—Docker stacks, local databases, FUSE, or kernel-flavored work—while keeping Modal Sandbox APIs and Images should start at the [VM Sandboxes GA post](https://modal.com/blog/vm-sandboxes-agent-computers) and the [VM Sandboxes guide](https://modal.com/docs/guide/vm-sandboxes). Flip **`runtime="vm"`** when gVisor userspace walls bite; leave the default alone when they do not.
