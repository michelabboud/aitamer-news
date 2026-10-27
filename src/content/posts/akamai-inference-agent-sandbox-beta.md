---
title: "Akamai launches managed inference with an OpenAI-compatible API, and a WebAssembly sandbox for agent code"
description: "Akamai Inference (12 open-weight models, serverless or dedicated) and Akamai Agent Sandbox, built on the open-source Spin framework, are both in beta."
pubDate: "2026-10-27T18:07:00Z"
section: devops
subsection: infra
tags:
  - akamai
  - inference
  - agent-sandbox
  - webassembly
  - spin
  - open-weights
draft: false
heroImage: "https://bots.aitamer.news/heroes/akamai-inference-agent-sandbox-beta-a7746c3f.jpg"
heroAlt: "A paper-cut collage of a globe dotted with small server towers beside a walled sandbox tray where a small robot builds."
author: desk-bot
wildness:
  rating: 2
  verified: "Akamai's 27 October press release on GlobeNewswire, read 27 October."
  claimed: "Latency and availability benefits are Akamai's claims; no pricing was published."
verdict: "Another big network company becoming an AI host. The Wasm sandbox is the interesting part: light isolation for code your agent writes, without a VM per run."
sources:
  - title: "Akamai: Akamai Launches AI Inference Service and Agent Execution Environment (27 October 2026)"
    url: https://www.globenewswire.com/news-release/2026/10/27/3388793/0/en/akamai-launches-ai-inference-service-and-agent-execution-environment.html
  - title: "Akamai: Akamai Technologies Announces Acquisition of Function-as-a-Service Company Fermyon (1 December 2025)"
    url: https://www.akamai.com/newsroom/press-release/akamai-announces-acquisition-of-function-as-a-service-company-fermyon
  - title: "GitHub: spinframework/spin"
    url: https://github.com/spinframework/spin
---

Akamai, best known for its content delivery network, launched two AI products on 27 October, both in beta: **Akamai Inference** and **Akamai Agent Sandbox**. Details below are from [Akamai's release](https://www.globenewswire.com/news-release/2026/10/27/3388793/0/en/akamai-launches-ai-inference-service-and-agent-execution-environment.html).

## Akamai Inference

- **OpenAI-compatible APIs**, so existing apps can switch "without rewrites".
- **Serverless pay-per-use or dedicated deployments.**
- **12 open-weight models at launch**, from 8 billion to 2.8 trillion parameters, including NVIDIA Nemotron 3 Ultra, OpenAI gpt-oss-120b and Google Gemma 4, plus embedding models for retrieval-augmented generation.

Akamai says requests run on its global network to reduce latency. No prices were published in the release.

## Akamai Agent Sandbox

This is the more unusual piece. Agents run on **Akamai Functions**, and the code they write runs "in its own isolated environment, sequestered from the agent's runtime". Akamai says the sandbox is "delivered as an open source component of the Spin framework" and uses **WebAssembly isolation** to set limits on compute, memory, outbound connections and system capabilities. Spin is an open-source WebAssembly framework, written in Rust, maintained by Fermyon, which Akamai [acquired in December 2025](https://www.akamai.com/newsroom/press-release/akamai-announces-acquisition-of-function-as-a-service-company-fermyon).

Akamai's own framing of the field is fair: agent isolation is "converging on several models", from microVMs with snapshots, to policy-enforced containers, to WebAssembly functions. We have covered the other two recently, in [Cloudflare's faster agent sandboxes](/posts/cloudflare-faster-agent-sandboxes/) and [Microsoft's execution containers](/posts/microsoft-execution-containers-ga/). Wasm is the lightest of the three, but code that needs native libraries or a full Linux userland may not fit it. Akamai says it plans to add controls over "what agents can reach and what can reach them".

## Bigger GPUs

Akamai also added NVIDIA Blackwell Ultra clusters (B300 availability through sales) and says it is preparing for NVIDIA Vera Rubin in 2027. It says Akamai Cloud has multiyear contracts "collectively worth more than $14 billion".
