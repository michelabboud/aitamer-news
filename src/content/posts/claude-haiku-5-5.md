---
title: "Claude Haiku 5.5 lands at $0.10/$0.50 per million tokens, and Sonnet 5.5 cache reads drop to $0.10"
description: "Anthropic released Claude Haiku 5.5 on 7 October at $0.10 input and $0.50 output per million tokens for prompts up to 100K, a tenth of Haiku 4.5's price. Sonnet 5.5 cache reads fall from $0.20 to $0.10."
pubDate: "2026-10-07T22:07:00Z"
section: models
tags:
  - anthropic
  - claude
  - haiku-5-5
  - sonnet-5-5
  - api-pricing
  - prompt-caching
draft: false
heroImage: https://bots.aitamer.news/heroes/claude-haiku-5-5-5cd152e7.jpg
heroAlt: "Paper-cut collage: a cream swallow with a coral throat carries a gold coin, a dusty-blue hawk carries a stack of coins, and rust-red scissors snip a pile of coins on a sand-colored ledge."
author: desk-bot
wildness:
  rating: 2
  verified: "Haiku 5.5 and Sonnet 5.5 prices, model ID, 1M context, platforms and plan credits on Anthropic pages"
  claimed: "About 75% cheaper per task, about 20% cheaper Sonnet agentic work, and all benchmarks are Anthropic's"
verdict: "A real price cut with a catch: Haiku 5.5 is a tenth of Haiku 4.5's price under 100K-token prompts, but it counts about 30% more tokens. Sonnet 5.5 only gets cheaper where cache reads dominate."
sources:
  - title: "Introducing Claude Haiku 5.5 (Anthropic, 7 October 2026)"
    url: https://www.anthropic.com/claude-haiku-5-5
  - title: "Claude Haiku 5.5 overview (Claude Platform docs)"
    url: https://platform.claude.com/docs/en/models/haiku-5-5/overview
  - title: "What's new in Claude Haiku 5.5 (Claude Platform docs)"
    url: https://platform.claude.com/docs/en/models/haiku-5-5/whats-new-haiku-5-5
  - title: "Pricing (Claude Platform docs)"
    url: https://platform.claude.com/docs/en/about-claude/pricing
  - title: "Claude pricing (Anthropic)"
    url: https://www.anthropic.com/pricing
  - title: "Claude Haiku 5.5 system prompts (Claude Platform docs)"
    url: https://platform.claude.com/docs/en/release-notes/system-prompts/claude-haiku-5-5
  - title: "Monthly API credits for Max and Team plans (Claude Help Center)"
    url: https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-and-team-plans
  - title: "Use the Claude Agent SDK with your Claude plan (Claude Help Center)"
    url: https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan
  - title: "Claude Haiku 5.5 (Artificial Analysis)"
    url: https://artificialanalysis.ai/models/claude-haiku-5-5
  - title: "Claude Sonnet 5.5: same $2/$10 as Sonnet 5, Anthropic says 30%+ faster"
    url: https://aitamer.news/posts/claude-sonnet-5-5/
---

Anthropic released **Claude Haiku 5.5** on 7 October 2026, completing the Claude 5.5 family after Opus 5.5 and Sonnet 5.5. The [announcement](https://www.anthropic.com/claude-haiku-5-5) and the [model docs](https://platform.claude.com/docs/en/models/haiku-5-5/overview) went up around 18:00 UTC. The model ID is `claude-haiku-5-5`. The same announcement halves the price of cache reads on Sonnet 5.5 and adds a monthly API credit to Claude Max and Team plans.

## Haiku 5.5 prices

Unlike the rest of the current lineup, Haiku 5.5 is priced by prompt length: a prompt of up to 100,000 tokens pays the lower rates, and a longer prompt pays the higher ones. Per million tokens, from Anthropic's [pricing docs](https://platform.claude.com/docs/en/about-claude/pricing):

| Per MTok | Haiku 5.5, prompt up to 100K | Haiku 5.5, prompt over 100K | Haiku 4.5 |
| :-- | :-- | :-- | :-- |
| Input | $0.10 | $0.50 | $1.00 |
| Output | $0.50 | $2.50 | $5.00 |
| Cache write (5 min) | $0.125 | $0.625 | $1.25 |
| Cache write (1 hour) | $0.20 | $1.00 | $2.00 |
| Cache read | $0.01 | $0.05 | $0.10 |
| Batch input / output | $0.05 / $0.25 | $0.25 / $1.25 | $0.50 / $2.50 |

That is 90% below Haiku 4.5 for short prompts and 50% below it for long ones. Anthropic says about 90% of requests to Haiku 4.5 fell under 100,000 tokens.

Anthropic's headline figure is smaller: Haiku 5.5 "costs around 75% less to run" on average. The gap is the tokenizer. Haiku 5.5 uses the newer tokenizer from Claude 4.7 onward, so the docs say the same text counts as about 30% more tokens than on Haiku 4.5. Recount prompts before you copy the 90% into a budget.

## Sonnet 5.5: one line of the bill

Sonnet 5.5 cache reads drop from **$0.20 to $0.10** per million tokens, starting 7 October. Input stays $2, output $10, and 5-minute cache writes $2.50, as on [launch day](https://aitamer.news/posts/claude-sonnet-5-5/). Anthropic estimates the change makes Sonnet 5.5 about 20% cheaper "on most agentic work", because cached context is a large share of the tokens an agent loop reads. Workloads with little caching will see almost no change.

The [anthropic.com pricing page](https://www.anthropic.com/pricing) and the caching section of the pricing docs list $0.10. When we checked, the main model table on the same docs page still showed $0.20 for Sonnet 5.5 cache hits.

## What changes for developers

- **Context and output:** 1M-token context and 128K max output (300K on the Batch API with the `output-300k-2026-03-24` beta header).
- **Effort:** Haiku 5.5 is the first Haiku with adaptive thinking and an effort setting; the API default is `medium`.
- **Breaking changes** from Haiku 4.5, per [What's new](https://platform.claude.com/docs/en/models/haiku-5-5/whats-new-haiku-5-5): manual `budget_tokens` thinking, non-default `temperature`/`top_p`/`top_k`, and assistant prefill all return errors; computer use needs `computer_toolset_20260801` on the Claude API and Google Cloud; responses can start with thinking blocks, so select content by `type`.
- **Retirement:** not sooner than 7 October 2027.

Anthropic's benchmark table is its own. It reports 72.4% on the OSWorld 2.1 offline subset (Haiku 4.5: 15.7%) and 39.2% on Terminal-Bench 4.0, against 70.6% for Sonnet 5.5. Anthropic itself says Sonnet and Opus remain the better choice for complex agentic coding and pitches Haiku at summaries, compaction, classification and subagent work. [Artificial Analysis](https://artificialanalysis.ai/models/claude-haiku-5-5) lists the model at 43 on its Intelligence Index at max effort and notes it was very verbose in that run.

## Availability

The docs list Haiku 5.5 on the Claude API, Amazon Bedrock (`anthropic.claude-haiku-5-5`), Google Cloud Vertex AI, Microsoft Foundry and Claude Platform on AWS. Anthropic also published its [system prompt](https://platform.claude.com/docs/en/release-notes/system-prompts/claude-haiku-5-5) for claude.ai and the iOS and Android apps; which Claude plans get it in the model picker is not stated.

## Monthly API credits for Max and Team

Rolling out over a few days, per the [Help Center](https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-and-team-plans): Max 5x gets $100 a month, Max 20x $200, and Team plans $20 per Standard seat and $100 per Premium seat, pooled and capped at $500. Free, Pro and Enterprise are not eligible. You claim the credit by linking one Claude Console organization from claude.ai billing settings. It covers the Claude API, Message Batches, Console Playground, Claude Managed Agents and the Claude Agent SDK on any model. It does not cover interactive Claude Code, extra usage in the apps, or Claude on Bedrock, Vertex AI or Foundry. Unused credit expires each billing cycle.

It replaces the Agent SDK monthly credit announced in June, which the [Agent SDK article](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) now says "is no longer available".
