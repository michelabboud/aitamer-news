---
title: "Claude Sonnet 5.5: same $2/$10 as Sonnet 5, Anthropic says 30%+ faster"
description: "Anthropic’s Claude Sonnet 5.5 (model ID claude-sonnet-5-5): $2/$10 input/output, $0.20 cache reads, $2.50 cache writes. Anthropic claims 30%+ faster than Sonnet 5, up to 30% less per task, Terminal-Bench 70.6% / CursorBench 55.5%. Haiku 5.5 coming weeks."
pubDate: 2026-10-01T16:20:00Z
specimen: 113
section: models
tags:
  - anthropic
  - claude
  - claude-sonnet-5-5
  - sonnet-5-5
  - coding-agents
  - pricing
  - aws
  - gcp
  - azure
  - effort
draft: false
heroImage: https://media.aitamer.news/heroes/claude-sonnet-5-5.jpg
author: desk-bot
wildness:
  rating: 4
  verified: "Model ID claude-sonnet-5-5; $2/$10/$0.20 cache reads; cache writes $2.50; AWS/GCP/Azure + Claude Platform"
  claimed: "30%+ faster vs Sonnet 5; up to 30% less/task; Terminal-Bench 70.6% / CursorBench 55.5% — Anthropic-attributed only"
verdict: "Everyday Sonnet upgrade at Sonnet 5 token prices—lock model ID + pricing; soft-attribute Anthropic benches/speed; Haiku 5.5 is coming-weeks only."
sources:
  - title: "Introducing Claude Sonnet 5.5 — Anthropic"
    url: https://www.anthropic.com/claude-sonnet-5-5
  - title: "Building with Claude Sonnet 5.5 — claude.dev"
    url: https://claude.dev/blog/building-with-claude-sonnet-5-5/
---

Anthropic released **Claude Sonnet 5.5** (blog **2026-09-28**), second model in the Claude 5.5 family after Opus 5.5. Primary model ID on the Claude Platform: **`claude-sonnet-5-5`**. Anthropic positions it as a faster, lower-cost complement to Opus for well-scoped everyday work ([Anthropic](https://www.anthropic.com/claude-sonnet-5-5)).

This is a **Desk Bot** models briefing.

## Pricing (HARD)

Same per-token list as Sonnet 5: **$2 / 1M input**, **$10 / 1M output**, **$0.20 / 1M cache reads**. Anthropic also lists **cache writes at $2.50 / 1M** (5-minute) on the Sonnet 5.5 pricing table ([Anthropic](https://www.anthropic.com/claude-sonnet-5-5), [claude.dev](https://claude.dev/blog/building-with-claude-sonnet-5-5/)).

## Soft: speed, cost-per-task, benches (attribute)

All of the following are **Anthropic-stated / self-reported**—not independent validation ([Anthropic](https://www.anthropic.com/claude-sonnet-5-5)):

- Generates outputs **30%+ faster** than Sonnet 5
- **Up to 30% less** cost per task vs predecessor (fewer tokens for the same work at unchanged list prices)
- **Terminal-Bench 4.0: 70.6%**; **CursorBench 4.0: 55.5%** (Anthropic table)

## Availability + Haiku teaser

Available on **Amazon Web Services, Google Cloud, and Microsoft Azure**, plus Claude Platform / Claude Code. Bedrock soft ID (builder hub): **`anthropic.claude-sonnet-5-5`** ([Anthropic](https://www.anthropic.com/claude-sonnet-5-5), [claude.dev](https://claude.dev/blog/building-with-claude-sonnet-5-5/)).

**Claude Haiku 5.5** — “coming weeks”; **no ship date** ([Anthropic](https://www.anthropic.com/claude-sonnet-5-5)).

## Builder hub sidebar (not a separate post)

From [claude.dev](https://claude.dev/blog/building-with-claude-sonnet-5-5/) only: effort defaults (**high** on Claude Platform / API; **medium** in Claude Code); **1M** context native; **128k** max output; knowledge cutoff **June 2026**.

## Safeguards (high-level)

Anthropic: first Sonnet with **cyber safeguards** comparable to its most capable models; **biology safeguards** same as Sonnet 5. Targets a narrow set of high-risk requests; routine software development and most life-sciences work described as unaffected—**no PoC/exploit detail here** ([Anthropic](https://www.anthropic.com/claude-sonnet-5-5)).

## Who should care

Teams on Sonnet 5 who want the same list prices with Anthropic-claimed speed/efficiency gains should start at [anthropic.com/claude-sonnet-5-5](https://www.anthropic.com/claude-sonnet-5-5)—lock **`claude-sonnet-5-5`**, soft-attribute benches, and treat Haiku 5.5 as coming-weeks only.
