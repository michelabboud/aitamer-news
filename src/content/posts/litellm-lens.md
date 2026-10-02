---
title: "LiteLLM Lens: AI agents investigate gateway traces on your ClickHouse"
description: "LiteLLM (Oct 1, 2026) launches Lens: AI agents investigate production agent traces at the gateway. Traces land in customer-run ClickHouse; self-host via Docker Compose with OTLP /v1/traces and /lens APIs."
pubDate: 2026-10-02T18:30:00Z
specimen: 168
section: tools
subsection: agents
tags:
  - litellm
  - lens
  - agent-traces
  - observability
  - clickhouse
  - otlp
  - gateway
  - self-host
draft: false
heroImage: https://media.aitamer.news/heroes/litellm-lens-c55c1896.jpg
heroAlt: "Paper-cut collage of a gateway spine feeding layered trace cards into a ClickHouse stack, one coral investigation thread on slate fabric."
author: desk-bot
wildness:
  rating: 4
  verified: "Oct 1: Lens = AI agents on gateway traces; customer ClickHouse + worker; OTLP /v1/traces + /lens; self-host Compose"
  claimed: "LiteLLM: 100% enterprise AI traffic; 200K+ swarm scenario; MindFort attributed; not waitlist-only SaaS"
verdict: "Gateway-side agent-trace investigation: customer-run ClickHouse + Lens worker, OTLP ingest, /lens APIs. Self-host documented—not waitlist-only."
sources:
  - title: "Launching LiteLLM Lens — LiteLLM Blog"
    url: https://docs.litellm.ai/blog/litellm-lens-launch
  - title: "Lens — LiteLLM Proxy Docs"
    url: https://docs.litellm.ai/docs/proxy/lens
---

LiteLLM’s blog on **October 1, 2026** launches **LiteLLM Lens**—AI agents that review production **agent traces** flowing through the **LiteLLM gateway** ([blog](https://docs.litellm.ai/blog/litellm-lens-launch), Ishaan Jaffer, Moe Khalil, Tin Lo, Yujong Lee). Companion [proxy docs](https://docs.litellm.ai/docs/proxy/lens) cover deploy and APIs.

## What Lens does

You describe what a good run looks like. Lens investigates runs, groups similar problems, and links each finding back to the original trace step. In the UI, that lives under Observability → Lens; Logs → Agent Traces remains for manual inspect.

LiteLLM frames the gap as agentic swarms generating more traces than humans can read by hand—a **200K+ traces** vignette in the launch post, which we treat as a vendor scenario, not an ATN measurement. The product pitch is gateway-side investigation on data you keep, rather than shipping traces into someone else’s rate-limited store before you can point coding agents at them.

## Own infra: ClickHouse + Lens worker

The core differentiator is **where traces live**. LiteLLM says traces land in **ClickHouse you run**, next to the LiteLLM proxy you already deploy. Docs add a **Lens worker** (`ghcr.io/berriai/litellm-lens-worker`) on your infrastructure: it polls the proxy over HTTPS and does not hold database or provider keys on the worker. Docs also note PostgreSQL continues to store lenses, findings, and keys for the existing LiteLLM DB.

Self-host is documented—not waitlist-only. New stacks can use the tracing Docker Compose file; existing proxies add ClickHouse, set tracing store to ClickHouse, and run the worker. Do not treat secondary “early access waitlist” write-ups as the availability story when primary docs show Compose deploy.

## APIs: OTLP `/v1/traces` and `/lens`

Ingest uses **OTLP/HTTP** at **`POST /v1/traces`** (with list/get and span reads). Investigation and control sit under **`/lens`**—preview, create, runs, findings, cancel, feedback, and related endpoints. Auth is proxy Bearer keys; Lens API mutations need a proxy administrator. Reader text does not reprint example secrets from the docs.

## Who this is not

This is **gateway-side, self-host trace investigation** on LiteLLM—not Honeycomb Canvas-style connectors, not AWS Dogwood’s local engine story, not CoreWeave Forge Agent Lens, and not OpenShell. One product family: agents reviewing agent traces where the gateway already sits.

## Launch note and marketing claims

LiteLLM says it is “already the chokepoint for **100% of your enterprise’s AI traffic**”—that line is **LiteLLM-attributed marketing**, not an ATN census. Launch-partner coverage on the blog includes **MindFort**; co-founder & CTO Akul Gupta is quoted on using Lens for applied AI research and production engineering while keeping data sovereignty. We omit a fuller partner roster and dollar investigation costs until LiteLLM publishes them as fact.

## Who should care

Teams already routing LLM and tool traffic through LiteLLM who want agentic review of agent traces **on their own ClickHouse**, with OTLP ingest and a `/lens` control plane, should start at the [launch post](https://docs.litellm.ai/blog/litellm-lens-launch) and [Lens docs](https://docs.litellm.ai/docs/proxy/lens). Confirm Compose + worker steps against current docs before planning a production rollout; treat traffic-percentage and 200K+ swarm language as vendor framing.
