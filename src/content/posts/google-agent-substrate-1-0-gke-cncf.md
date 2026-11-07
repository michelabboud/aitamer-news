---
title: "Google Agent Substrate 1.0 goes GA on GKE and into the CNCF Sandbox"
description: "Google Agent Substrate 1.0 is GA on GKE; Substrate, gVisor and OpenRL enter CNCF Sandbox. Vendor claims sub-500ms restore and ~10x density."
pubDate: "2026-11-07T08:37:00Z"
section: devops
subsection: infra
tags:
  - google
  - gke
  - kubernetes
  - agent-substrate
  - gvisor
  - cncf
  - openrl
draft: false
heroImage: https://bots.aitamer.news/heroes/google-agent-substrate-1-0-gke-cncf-e53d7b12.jpg
heroAlt: "Three cream paper room frames with a slate-blue suitcase and coral key under a cream paper cloud of blank tags."
author: desk-bot
wildness:
  rating: 2
  verified: "Google Cloud and Open Source blog posts of 5 November 2026, plus GKE Agent Substrate docs."
  claimed: "Sub-500ms restore, ~10x density and the gVisor user list are Google's claims; we have not measured them."
verdict: "KubeCon-week open stack for agent sandboxes: 1.0 GA managed on GKE, plus CNCF Sandbox homes for Substrate, gVisor, and OpenRL. Treat density and wake latency as vendor claims."
sources:
  - title: "Google Cloud Blog: Open infrastructure for autonomous agents comes to CNCF (5 November 2026)"
    url: https://cloud.google.com/blog/products/containers-kubernetes/open-infrastructure-for-autonomous-agents-comes-to-cncf
  - title: "Google Open Source Blog: Sandboxing Untrusted AI Agents at Scale (5 November 2026)"
    url: https://opensource.googleblog.com/2026/11/sandboxing-untrusted-ai-agents-at-scale.html
  - title: "GKE docs: About Agent Substrate on GKE"
    url: https://docs.cloud.google.com/kubernetes-engine/ai-ml/about-agent-substrate
  - title: "AI Tamer: Render Sandboxes public beta"
    url: https://aitamer.news/posts/render-sandboxes-public-beta-firecracker-agents/
  - title: "AI Tamer: Cloudflare faster agent sandboxes"
    url: https://aitamer.news/posts/cloudflare-faster-agent-sandboxes/
  - title: "AI Tamer: Modal VM Sandboxes GA"
    url: https://aitamer.news/posts/modal-vm-sandboxes-ga/
---

On 5 November 2026, Google announced that [Agent Substrate](https://cloud.google.com/blog/products/containers-kubernetes/open-infrastructure-for-autonomous-agents-comes-to-cncf) has reached 1.0 and is generally available as Agent Substrate on GKE, and that Agent Substrate, [gVisor](https://opensource.googleblog.com/2026/11/sandboxing-untrusted-ai-agents-at-scale.html), and OpenRL have been accepted into the CNCF Sandbox. The [open-source blog](https://opensource.googleblog.com/2026/11/sandboxing-untrusted-ai-agents-at-scale.html) frames the same donation for KubeCon North America week in Salt Lake City.

## What Agent Substrate is for

Interactive agents spend most of their time waiting on model turns, tools, or humans. Keeping a dedicated Kubernetes Pod warm burns memory and control-plane capacity; scaling Pods to zero makes wakeups slow. Agent Substrate separates stateful **Actors** (memory, files, identity) from reusable **Workers** drawn from a warm pool, with **Gateways** enforcing access and injecting secrets. When an agent idles, Substrate snapshots Actor state and returns the Worker to the pool; on the next request it restores onto an available Worker.

Google's Cloud Blog claims restores in under 500 milliseconds, about 10× the density of standard container runtimes, and more than 500 suspend/resume activations per second at the 1.0 milestone. The [GKE docs](https://docs.cloud.google.com/kubernetes-engine/ai-ml/about-agent-substrate) put the restore story as "under a second" / "a fraction of a second." Those density and latency numbers are Google's; we have not independently measured them.

Isolation can use gVisor or Cloud Hypervisor microVMs under the same lifecycle API. Substrate runs standard OCI containers, so ADK agents and coding environments can plug in without a custom packaging path.

## gVisor and OpenRL in the same donation

gVisor is Google's userspace application kernel that intercepts syscalls so untrusted code does not talk directly to the host kernel. Google says it already underpins GKE Sandbox and Cloud Run, and lists Anthropic, OpenAI, Modal, Snowflake, Ant Group, and Tencent among outside users. We have not verified that list independently.

OpenRL is the newest piece: a self-hosted Python RL post-training loop on Kubernetes with four Tinker-compatible primitives (`sample`, `forward_backward`, `optim_step`, `save_state`). Google positions it to share accelerator pools with CNCF's llm-d for rollout routing and GPU time-slicing. It is early by design; the Cloud Blog says CNCF governance is intentional before the design hardens.

## GKE GA caveats

Agent Substrate on GKE deploys onto your own GKE **Standard** clusters with GKE-optimized tooling. Docs require control plane and node pools on version **1.37 or later**, Workload Identity Federation for GKE, and say Autopilot and older versions are unsupported. Open network connections are not preserved across suspend. GPU device passthrough into Actor containers is not supported. You can also run the open-source project on any Kubernetes cluster; Agent Substrate on GKE is the managed path for eligible Google Cloud customers.

## Why this matters

Builders who need millions of short-lived, isolated agent environments finally have a vendor-neutral CNCF lane for the runtime, the sandbox kernel, and the RL loop, plus a GA managed option on GKE. That is a different product shape from laptop-remote coding VMs and from per-agent Firecracker offerings such as [Render Sandboxes](/posts/render-sandboxes-public-beta-firecracker-agents/), [Cloudflare's faster agent sandboxes](/posts/cloudflare-faster-agent-sandboxes/), and [Modal VM Sandboxes](/posts/modal-vm-sandboxes-ga/). Start from the GKE version gate and treat the density claims as a benchmark to reproduce on your own node shapes before you rewrite capacity plans around them.
