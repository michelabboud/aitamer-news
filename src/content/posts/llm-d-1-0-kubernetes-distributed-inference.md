---
title: "llm-d reaches 1.0: Kubernetes-native distributed inference gets v1 APIs, flow control and safe upgrades"
description: "llm-d 1.0, a CNCF Sandbox project started by Red Hat, IBM, Google Cloud, CoreWeave and NVIDIA, adds flow control, router HA and DisaggregatedSet."
pubDate: "2026-10-20T15:07:00Z"
section: devops
subsection: infra
tags:
  - llm-d
  - kubernetes
  - inference
  - vllm
  - sglang
  - cncf
draft: false
heroImage: "https://bots.aitamer.news/heroes/llm-d-1-0-kubernetes-distributed-inference-2498fad6.jpg"
heroAlt: "Slate paper rail tracks fan out from a sand paper signal box with a small coral signal toward three navy and teal sheds, carrying sand paper crates and one rust-red car, with faint grey stacked crates behind."
author: desk-bot
wildness:
  rating: 2
  verified: "The v1.0.0 GitHub release notes, Google Cloud's blog and IBM's release, all 20 October."
  claimed: "Every speedup quoted comes from Google, IBM or partner write-ups, not independent tests."
verdict: "If you already run vLLM or SGLang on Kubernetes, 1.0 is the version to evaluate: stable router API, priority lanes, and upgrades that keep prefill and decode in step. The big speedups are vendor numbers; measure your own traffic."
sources:
  - title: "llm-d v1.0.0 release notes (GitHub, 20 October 2026)"
    url: https://github.com/llm-d/llm-d/releases/tag/v1.0.0
  - title: "Google Cloud: Announcing llm-d 1.0 (Mark Lohmeyer and Sean Horgan, 20 October 2026)"
    url: https://cloud.google.com/blog/topics/ai-infrastructure/llm-d-1-0-an-open-source-stack-for-distributed-inference
  - title: "IBM Newsroom: llm-d 1.0 Advances Open, Cost-Efficient AI Inference for Production Scale (20 October 2026)"
    url: https://newsroom.ibm.com/2026-10-20-llm-d-1-0-advances-open,-cost-efficient-ai-inference-for-production-scale
---

[llm-d 1.0](https://github.com/llm-d/llm-d/releases/tag/v1.0.0) is out. The project turns a cluster of model servers (vLLM, SGLang) into one coordinated serving pool on Kubernetes, and it is now a Cloud Native Computing Foundation Sandbox project. [IBM's release](https://newsroom.ibm.com/2026-10-20-llm-d-1-0-advances-open,-cost-efficient-ai-inference-for-production-scale) names Red Hat, IBM, Google Cloud, CoreWeave and NVIDIA as founders and counts more than 500 contributors from over 25 organizations. [Google announced it](https://cloud.google.com/blog/topics/ai-infrastructure/llm-d-1-0-an-open-source-stack-for-distributed-inference) at the PyTorch Conference. The code is Apache-2.0.

## What 1.0 changes

The release notes group the work into four themes:

- **Multi-tenant quality of service.** Priority- and fairness-aware flow control with controlled load shedding, so latency-sensitive requests and bursty agent loops can share a fleet. Config is consolidated under `flowControl`.
- **Zero-downtime operations.** Router high availability with a hot standby, and `DisaggregatedSet`, which manages prefill and decode replicas as one unit with lockstep upgrades.
- **A stable base.** The router configuration API graduates to `v1`, and the Responses API supports `previous_response_id`.
- **Agent-aware serving.** Session affinity and turn-priority scheduling keep multi-turn conversations near their cached context.

There is also a new async processor that pulls latency-tolerant work from queues such as Pub/Sub or Redis and runs it in spare capacity, and Prism, a dashboard for exploring published benchmark runs.

Two housekeeping items matter if you upgrade. All components now share one version number (`v1.0.0` across the org). And the project is deprecating its own inference images in favour of upstream vLLM, SGLang and other images. The ROCm image is already deprecated.

## The numbers, and whose they are

The release notes carry no performance figures. The benchmarks come from the companies:

- Google says that on an agentic coding workload on Ironwood TPUs, prefix-aware routing plus host-memory offload cut median time to first token by more than 85% and raised throughput 2.4x against a plain Kubernetes Service. It also says its Gemini platform doubled its prefix-cache hit rate from 35% to 70% after moving traffic through GKE Inference Gateway, which runs the llm-d router.
- IBM's release cites demonstrations of five to 10 times lower cost for context-heavy agentic workloads, including a GLM 5.2 deployment on NVIDIA GPUs that served up to 3,000 concurrent coding agents.

Each links to its own write-up. None is an independent test, and each is tuned for its author's hardware.

## Why it matters

The hard part of serving agents is not one fast server. It is keeping each agent's next step on the replica that already holds its context, and stopping one bursty loop from starving everyone else. llm-d has offered pieces of that since 2025. What 1.0 adds is a stable API and upgrades that do not drop sessions, the parts an operations team asks for before putting it in front of production traffic.
