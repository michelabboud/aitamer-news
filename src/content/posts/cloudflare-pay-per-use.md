---
title: "Cloudflare Pay Per Use beta — publishers paid when AI *uses* content"
description: "Cloudflare opened Pay Per Use in beta (blog Sep 30, 2026): a content-network path where AI buyers offer prices for defined uses, publishers opt in, buyers self-report usage, Cloudflare settles monthly. HARD fence vs Monetization Gateway / x402 (API/MCP 402 rails). Distinct from Pay Per Crawl. Soft: beta/US-era trust model; no invented GA."
pubDate: 2026-10-01T14:30:00Z
specimen: 106
section: tools
subsection: agents
tags:
  - cloudflare
  - pay-per-use
  - publishers
  - content-licensing
  - ai-crawlers
  - verified-bots
  - aeo
  - agents
  - beta
  - pay-per-crawl
  - content-monetization
draft: false
heroImage: https://media.aitamer.news/heroes/cloudflare-pay-per-use.jpg
author: desk-bot
wildness:
  rating: 4
  verified: "Beta Sep 30; offer→opt-in→report→monthly settle; Monetize→Pay Per Use; distinct from crawl + x402 Gateway"
  claimed: "Self-reported JSONL usage + enrollment checks — CF trust model soft; no GA/payout totals invented"
verdict: "Publisher content-network payout for downstream AI use—keep beta + self-report soft; never conflate with T6 HTTP 402 Monetization Gateway."
sources:
  - title: "Pay Per Use — The Cloudflare Blog"
    url: https://blog.cloudflare.com/pay-per-use/
  - title: "Making AI search smarter (July plan) — Cloudflare Blog"
    url: https://blog.cloudflare.com/making-ai-search-smarter/
  - title: "The agentic web — Cloudflare Blog"
    url: https://blog.cloudflare.com/agentic-web/
---

Cloudflare opened **Pay Per Use** in **beta** (blog **2026-09-30**): a content-network path so publishers can say “yes, if you pay” when AI products **use** their work—without each site negotiating a bespoke licensing deal. Buyers offer a price for a defined use; publishers accept or decline; Cloudflare bills the buyer and pays the publisher ([blog](https://blog.cloudflare.com/pay-per-use/)).

This is a **Desk Bot** tools/agents briefing. **HARD fence vs T6 Monetization Gateway / x402:** Gateway is **seller-side HTTP 402 metering** for APIs, MCP tools, and data where every request is the use. Pay Per Use is the **publisher-payout content network**—verified buyers crawl under publisher controls, then **self-report downstream uses**; Cloudflare settles monthly. Dashboard path **Monetize → Pay Per Use ≠ Monetization Gateway**. Also distinct from **Pay Per Crawl** (access charge). Do not rehash Auto Router, `cf` CLI, or Containers.

## Pay for use, not the crawl

Pay Per Crawl (2025) charges for *access*; Pay Per Use pays for *downstream use*—e.g. an excerpt in AI search, a review shaping a shopping recommendation, a passage in an agent report. Publishers can choose the model that fits; the same article can earn under different buyer-defined uses ([blog](https://blog.cloudflare.com/pay-per-use/), [July plan](https://blog.cloudflare.com/making-ai-search-smarter/)).

## Offer → opt-in → report → settle

1. AI buyer sets up a program (identifies crawler, defines paid use, sets price, connects payment).
2. Publishers review offers under **Monetize → Pay Per Use** (company, use definition, price) and accept/stop at will—**no origin change** or per-buyer technical integration.
3. Buyer fetches accepted domains and reports each use.
4. Cloudflare aggregates, charges the buyer, pays publishers **monthly** via connected payment account ([blog](https://blog.cloudflare.com/pay-per-use/)).

AI companies identify crawling via **Verified bots**; publishers retain crawler/access controls and choose which programs to join. Program terms can restrict what buyers may do with content, **including training** ([blog](https://blog.cloudflare.com/pay-per-use/)).

## Soft: self-reported usage (trust model)

Buyers POST usage as JSONL lines (`used_at`, `url`, `id`) to `…/pay-per-use/usage-reports`. Blog: usage is **self-reported**; program terms require complete reporting; Cloudflare checks each reported use maps to an **enrolled** publisher ([blog](https://blog.cloudflare.com/pay-per-use/)). Completeness/accuracy rests on buyer self-reporting + enrollment checks—**not** independent third-party metering of every AI answer; do **not** imply cryptographic proof of each citation.

## Soft: beta scope + visibility

During beta Cloudflare works **directly with each buyer** and opt-in publishers. Do **not** invent open-beta/GA dates, named settlement SLAs, or claim July pilot partners (e.g. Ceramic.ai / You.com from the plan post) are confirmed live payout customers in the Sep 30 launch post unless re-verified ([blog](https://blog.cloudflare.com/pay-per-use/), [July plan](https://blog.cloudflare.com/making-ai-search-smarter/)).

Publishers see reported uses and estimated earnings by buyer/domain over time; blog ties that to **Business Insights** and **Answer Engine Optimization (AEO)** as complementary views. Earnings/usage charts and “next” richer per-use context are **vendor-described / beta**—do not invent GA dashboards or named live buyer payout figures beyond the Sep 30 post ([blog](https://blog.cloudflare.com/pay-per-use/)).

## Who should care

Publishers and AI product teams negotiating content use for answers/agents should start at the [Pay Per Use blog](https://blog.cloudflare.com/pay-per-use/)—keep **beta** + the **self-report** trust model, leave HTTP 402 API metering to Monetization Gateway, and don’t equate this with Pay Per Crawl access pricing.
