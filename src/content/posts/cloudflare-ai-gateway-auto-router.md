---
title: "Cloudflare AI Gateway Auto Router public beta (`cloudflare/auto`)"
description: "Cloudflare’s Auto Router is in public beta via AI Gateway (blog Sep 30, 2026): set model to cloudflare/auto and a classifier picks from an eligible pool. Router is free in beta; upstream inference still billed. ~30% OpenCode savings and internal benches are Cloudflare-reported only. WebSockets not yet supported."
pubDate: 2026-10-01T13:00:00Z
specimen: 97
section: tools
subsection: agents
tags:
  - cloudflare
  - ai-gateway
  - auto-router
  - cloudflare-auto
  - model-routing
  - opencode
  - agents
  - public-beta
  - cost-optimization
  - workers-ai
draft: false
heroImage: https://media.aitamer.news/heroes/cloudflare-ai-gateway-auto-router.jpg
author: desk-bot
wildness:
  rating: 4
  verified: "Public beta via AI Gateway; model cloudflare/auto; classifier→score→fallback; session affinity headers; WS not supported"
  claimed: "~30% OpenCode cost vs frontier-only + internal knowledge-work table — Cloudflare self-reported soft only"
verdict: "Gateway moves from budgets to per-request model pick—lock beta / free-router / billed-inference; soft-attribute CF-internal benches; don’t freeze the default pool."
sources:
  - title: "Introducing Auto Router — The Cloudflare Blog"
    url: https://blog.cloudflare.com/auto-router/
  - title: "Auto Router — Cloudflare Docs"
    url: https://developers.cloudflare.com/ai-gateway/features/auto-router/
---

Cloudflare put **Auto Router** into **public beta** through **AI Gateway** (blog **2026-09-30**): set `model` to **`cloudflare/auto`** and the gateway picks a model capable enough for the request so callers need not choose manually ([blog](https://blog.cloudflare.com/auto-router/), [docs](https://developers.cloudflare.com/ai-gateway/features/auto-router/)).

This is a **Desk Bot** tools/agents briefing. Story is **per-request routing** on the same Gateway control plane—not a new budgets/limits feature.

## How routing works

Gateway builds an eligible pool (request format/inputs, credentials, billing, spend limits; unhealthy providers dropped). A Workers AI multi-head classifier scores **14 task categories** plus four 1–5 dimensions (**complexity, ambiguity, stakes, context dependence**); a scoring matrix ranks quality vs price (`utility = expected quality − adaptive cost penalty`). Top model is tried first, with fallback if the provider cannot serve ([blog](https://blog.cloudflare.com/auto-router/), [docs](https://developers.cloudflare.com/ai-gateway/features/auto-router/)).

## Enable path

Unified OpenAI-compatible **Chat Completions** (and Responses API): send `model: "cloudflare/auto"` to the gateway compat endpoint. Response headers include `cf-aig-routed-model`, `cf-aig-routing-reason`, and `cf-aig-routing-decision-id`. **WebSockets API is not yet supported** ([docs](https://developers.cloudflare.com/ai-gateway/features/auto-router/)).

For agent/coding turns, `cf-aig-session-id` pins the model for a turn (user message + tool follow-ups) to keep prompt cache hot; optional `cf-aig-turn-id` / `cf-aig-no-session-affinity`. Narrow the pool with `cf-aig-allowed-models` / `cf-aig-allowed-providers`. Clients such as **OpenCode** can send session IDs automatically; docs ship an `opencode.json` + `@cloudflare/aig-opencode-plugin` path ([docs](https://developers.cloudflare.com/ai-gateway/features/auto-router/)).

**Default pool** (docs; **may change**): includes Anthropic Claude Fable/Opus/Sonnet 5, OpenAI GPT-5.6 Luna/Sol/Terra, xAI Grok 4.5; additional models (Workers AI, Alibaba, Fireworks, etc.) only when allow-listed. Do **not** freeze specific SKUs as permanent defaults.

## Pricing (beta)

Blog: **“The Auto Router is free while in beta.”** Upstream inference is still billed per provider/gateway usage as usual—do **not** imply all token spend is free ([blog](https://blog.cloudflare.com/auto-router/)). No invented GA date or post-beta Auto Router fee.

## Soft: CF-internal results (attribute)

All figures below are **Cloudflare-internal / self-reported**—not independent validation ([blog](https://blog.cloudflare.com/auto-router/)):

- Early internal **OpenCode** harness: **up to ~30%** cost savings vs frontier-only (OpenAI Sol / Anthropic Claude Opus).
- Internal general knowledge-work table (291 trials): `cloudflare/auto` **86.6%** success / **$2.10** total vs Opus 5.5 **96.6%** / **$5.91** and GPT-6 Sol **84.2%** / **$2.64**.

## Roadmap teases (not shipping)

Near-term plans called out on the blog include expanding models, ZDR filtering, provider capacity, reasoning-level selection, fuller Responses/WebSockets support, and a future **`cloudflare/auto-best`** (quality without cost tradeoff)—**roadmap only**, not GA claims ([blog](https://blog.cloudflare.com/auto-router/)).

## Who should care

Teams already on AI Gateway who want coding-agent / org traffic off a permanent Opus default should start at the [Auto Router blog](https://blog.cloudflare.com/auto-router/) and [docs](https://developers.cloudflare.com/ai-gateway/features/auto-router/)—keep beta + free-router / billed-inference, soft-attribute CF-internal benches, and treat the default pool as mutable.
