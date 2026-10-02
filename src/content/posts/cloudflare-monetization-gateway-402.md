---
title: "Cloudflare Monetization Gateway closed beta — HTTP 402 / x402 for agents"
description: "Cloudflare opened Monetization Gateway in closed beta (Sep 30, 2026): HTTP 402 + x402 inline pay-per-request for sites, APIs, MCP tools, and datasets. Settlement rails as CF states (USDC on Base via Coinbase Facilitator)—not crypto advice. Distinct from Pay Per Use content metering. US buyers/sellers; API2PDF >50% drop-off is vendor-reported."
pubDate: 2026-10-01T13:30:00Z
specimen: 100
section: tools
subsection: agents
tags:
  - cloudflare
  - monetization-gateway
  - http-402
  - x402
  - usdc
  - base
  - agents
  - mcp
  - closed-beta
  - machine-payments
  - ai-gateway
draft: false
heroImage: https://media.aitamer.news/heroes/cloudflare-monetization-gateway-402.jpg
author: desk-bot
wildness:
  rating: 5
  verified: "Closed beta Sep 30; HTTP 402/x402 inline; US buyers/sellers; USDC/Base/Coinbase Facilitator per CF docs only"
  claimed: "API2PDF >50% card-conversion drop-off (vendor/customer claim via the Cloudflare blog)"
verdict: "Agent paywall on HTTP 402 and x402. Closed beta with US eligibility; settlement rails are as Cloudflare states and this is not financial advice. Separate from Pay Per Use and Auto Router."
sources:
  - title: "Monetization Gateway beta — The Cloudflare Blog"
    url: https://blog.cloudflare.com/monetization-gateway-beta/
  - title: "Monetization Gateway docs"
    url: https://developers.cloudflare.com/monetization-gateway/
  - title: "x402 protocol — Monetization Gateway"
    url: https://developers.cloudflare.com/monetization-gateway/x402/
  - title: "Closed beta — Changelog"
    url: https://developers.cloudflare.com/changelog/post/2026-09-30-closed-beta/
---

Cloudflare opened **Monetization Gateway** in **closed beta** (blog **2026-09-30**): domain owners can charge agents for access to websites, APIs, **MCP tools**, or datasets, requesting access in the Cloudflare Dashboard. Docs: buyers and sellers must be **based in the United States** ([blog](https://blog.cloudflare.com/monetization-gateway-beta/), [docs](https://developers.cloudflare.com/monetization-gateway/), [changelog](https://developers.cloudflare.com/changelog/post/2026-09-30-closed-beta/)).

This post covers HTTP 402 and x402 per-request metering only. It is separate from Pay Per Use, which is for high-value content crawled once and reused many times, and from AI Gateway Auto Router, which picks a model.

## How payment works

Gateway uses **HTTP 402 Payment Required** so payment is offered **inline** with the resource request—**no checkout redirect**, no separate payment API. Protocol is **x402** (docs: version **2**); client-facing headers include **`PAYMENT-REQUIRED`** (gateway → client) and **`PAYMENT-SIGNATURE`** (client → gateway). Settlement via **Coinbase’s x402 Facilitator** ([blog](https://blog.cloudflare.com/monetization-gateway-beta/), [x402 docs](https://developers.cloudflare.com/monetization-gateway/x402/)).

**Settlement rails (as Cloudflare states only — not investment, token, or jurisdiction advice):** payments settle on the **Base** blockchain using **USDC**. Blog roadmap teases (not shipping claims): discoverability for agents, transaction logs, additional payment rails, and identity primitives ([blog](https://blog.cloudflare.com/monetization-gateway-beta/)). No open-beta or GA dates, non-US eligibility or extra chains are given beyond “planned.”

## What sellers configure

Define which requests require payment (URL, headers, query params, caller attributes; audience = everyone or verified bots), cost, and receiving wallet. Pricing: **fixed** (`exact`) and **variable** (`upto` — origin discloses actual charge). Gateway handles verification, settlement, failures/retries, analytics, and x402 protocol churn. Min settlement **$0.001**; max price **$100** (atomic USDC units) ([blog](https://blog.cloudflare.com/monetization-gateway-beta/), [rules](https://developers.cloudflare.com/monetization-gateway/configuration/rules/)).

## Production showcases (CF blog)

Per the [Monetization Gateway blog](https://blog.cloudflare.com/monetization-gateway-beta/):

- **AI Gateway** — U.S. customers can pay for inference at request time on a select model set via `PAYMENT-METHOD: x402` (origin-controlled pricing).
- **Ceramic.ai** — fixed-price agent web search without an API key.
- **Stocktwits** — per-request stock signals for agents (separate agent path; existing APIs unchanged).
- **API2PDF** — 402 when no API key; variable pricing for PDF generation.

## Vendor claim

API2PDF: after the first month, requiring a credit card caused a **>50% drop-off in conversion**; now returns HTTP 402 for keyless requests and settles actual consumption after payment—**customer/vendor-reported via Cloudflare’s blog**, not independently verified ([blog](https://blog.cloudflare.com/monetization-gateway-beta/)).

## Who should care

API/MCP/data sellers who want a Cloudflare-native agent paywall without subscriptions or prepaid credits should start at the [beta blog](https://blog.cloudflare.com/monetization-gateway-beta/) and [Monetization Gateway docs](https://developers.cloudflare.com/monetization-gateway/).
