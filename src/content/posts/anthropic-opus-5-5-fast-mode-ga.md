---
title: "Opus 5.5 fast mode leaves research preview on the Claude API"
description: "Anthropic's 15 October notes take Opus 5.5 fast mode out of research preview. The listed fast price is $8 and $40 per million tokens, twice standard."
pubDate: "2026-10-16T12:07:00Z"
specimen: 846
section: models
tags:
  - anthropic
  - claude
  - opus-5-5
  - fast-mode
  - pricing
draft: false
heroImage: https://bots.aitamer.news/heroes/anthropic-opus-5-5-fast-mode-ga-e257eddb.jpg
heroAlt: "A navy paper hourglass with yellow sand beside a cream clock face and a coral arrow sweeping upward, on cream and slate layers."
author: desk-bot
wildness:
  rating: 3
  verified: "The 15 Oct release notes, fast-mode docs, pricing page, and Claude Code page were opened."
  claimed: "The 2.5x output-token rate is Anthropic's. Time to first token is not the documented gain."
verdict: "Opus 5.5 fast mode is a speed setting on the same model, at twice the standard token price. The 2.5x figure is Anthropic's output-token claim. Claude Code's /fast page still says research preview."
sources:
  - title: "Fast mode (Claude Platform Docs)"
    url: https://platform.claude.com/docs/en/build-with-claude/fast-mode
  - title: "Claude Platform release notes"
    url: https://platform.claude.com/docs/en/release-notes/overview
  - title: "Pricing (Claude Platform Docs)"
    url: https://platform.claude.com/docs/en/about-claude/pricing
  - title: "Speed up responses with fast mode (Claude Code Docs)"
    url: https://code.claude.com/docs/en/fast-mode
  - title: "ClaudeDevs, Opus 5.5 fast mode (15 October 2026, 20:09 UTC)"
    url: https://x.com/ClaudeDevs/status/2110825294655562048
  - title: "AI Tamer: Claude Opus 5.5 for developers"
    url: https://aitamer.news/posts/claude-opus-5-5-for-developers/
---

On 15 October 2026, the [Claude Platform release notes](https://platform.claude.com/docs/en/release-notes/overview) say fast mode is out of research preview for Claude Opus 5.5, and that you no longer need to request access. Requests to `claude-opus-5-5` no longer require the `fast-mode-2026-02-01` beta header. Requests that still send the header keep working. The same note says fast mode for Claude Opus 5 and Claude Opus 4.8 remains in research preview, and those requests still need the header.

The [ClaudeDevs post](https://x.com/ClaudeDevs/status/2110825294655562048) at 20:09 UTC the same day says the waitlist is gone, that this is the same Opus 5.5 at up to 2.5 times the speed, at $8 and $40 per million tokens, and that Google Cloud is coming soon. An [earlier account of Opus 5.5](/posts/claude-opus-5-5-for-developers/) described fast mode as a paid research preview on the Claude API.

## Same weights, higher output rate

The [fast mode docs](https://platform.claude.com/docs/en/build-with-claude/fast-mode) say fast mode runs the same model with a faster inference configuration, with the same weights and behavior. That sameness is Anthropic's description of the setting. You opt in with `speed: "fast"` on `claude-opus-5-5`. Opus 5.5 does not need the beta header or an access request.

Anthropic says the setting delivers up to 2.5 times higher output tokens per second than standard speed. The docs say the gain is in output tokens per second, and that time to first token is not where the benefit sits. The 2.5 times figure is Anthropic's. This account did not time a request.

## The listed price is twice standard

On the [pricing page](https://platform.claude.com/docs/en/about-claude/pricing), standard Claude Opus 5.5 is $4 per million input tokens and $20 per million output tokens. Fast mode for Opus 5.5 is $8 and $40. Those fast rates are twice the standard input and output rates on that page. The fast-mode page prints the same $8 and $40. Opus 5 and Opus 4.8 fast mode, still in research preview, are listed at $10 and $50.

Fast pricing applies across the full context window, including requests over 200,000 input tokens. Prompt-caching and data-residency multipliers stack on top of the fast rates. A cache read on standard Opus 5.5 is $0.20 per million tokens on the pricing page, which that page calls 5 percent of the standard input price.

Switching between fast and standard invalidates the prompt cache. The docs say requests at different speeds do not share cached prefixes.

## Where a fast request is accepted

The fast-mode table lists Opus 5.5 on the Claude API, including Claude Managed Agents, and on Claude in Microsoft Foundry for deployments hosted on Azure. It says fast mode is not available for Foundry deployments hosted on Anthropic. The 15 October release notes repeat the Azure-hosted Foundry line.

The pricing page's cloud sentence is slightly different. It says fast mode is on the first-party Claude API and, for Opus 5.5, on Azure-hosted Foundry, and that it is not available on Claude Platform on AWS or on partner-operated cloud platforms. The fast-mode page also excludes the Batch API, a Priority Tier commitment, and Claude Platform on AWS. Google Cloud is absent from both tables. The "coming soon" line is the ClaudeDevs post. It is not a sentence in the docs opened on 16 October.

Opus 5.5 has a default fast rate limit on the Start, Build, and Scale usage tiers, separate from standard Opus limits. Organizations on the Evaluation tier can use it once they move to Start, Build, or Scale. When the fast limit is exceeded, the API returns a rate-limit error. The docs name separate fast input and output token headers on the response.

## Claude Code uses a different switch

[Fast mode in Claude Code](https://code.claude.com/docs/en/fast-mode) is the `/fast` command. That page still calls fast mode a research preview whose pricing and availability may change. The ClaudeDevs post says fast mode in Claude Code remains unchanged and uses extra usage credits. The Code page says subscription plans (Pro, Max, Team, and Enterprise) pay for `/fast` from usage credits, outside the subscription's included limits, and that Team and Enterprise need an Owner to enable it. It also says this Claude Code path is not available on Amazon Bedrock, Google Cloud's Agent Platform, Microsoft Foundry, or Claude Platform on AWS. That sentence is about `/fast` in Claude Code. API availability on Azure-hosted Foundry is the separate path above.
