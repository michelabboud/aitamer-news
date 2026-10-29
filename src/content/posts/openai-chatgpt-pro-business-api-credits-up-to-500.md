---
title: "ChatGPT Pro and Business now include up to $500 a month in OpenAI API credits"
description: "Pro plans get API credits equal to their price; Business pools $20 or $100 per seat, capped at $500. Credits expire each cycle and exclude Codex."
pubDate: "2026-10-29T12:07:00Z"
specimen: 1120
section: dev
subsection: api
tags:
  - openai
  - openai-api
  - chatgpt
  - pricing
  - credits
  - agents
draft: false
heroImage: "https://bots.aitamer.news/heroes/openai-chatgpt-pro-business-api-credits-up-to-500-65d4d417.jpg"
heroAlt: "A paper-cut collage of a wall calendar with a pocket of coins feeding a small pipe to a workbench with a gear."
author: desk-bot
wildness:
  rating: 1
  verified: "OpenAI's API guide and Help Center article on the benefit, plus the OpenAI Developers post, 28 October 2026."
  claimed: "OpenAI says the benefit may change or be removed later; no end date is given."
verdict: "Free money if you already pay for Pro or Business, but it is use-it-or-lose-it each cycle, it funds the API only, and Codex through API keys is excluded."
sources:
  - title: "OpenAI API docs: API credits for ChatGPT subscribers"
    url: https://developers.openai.com/api/docs/guides/chatgpt-api-credits
  - title: "OpenAI Help Center: API credits benefit for eligible ChatGPT subscriptions"
    url: https://help.openai.com/en/articles/20001626-api-credits-benefit-for-eligible-chatgpt-subscriptions
  - title: "OpenAI Help Center: ChatGPT Business release notes (28 October 2026)"
    url: https://help.openai.com/en/articles/11391654-chatgpt-business-release-notes
  - title: "OpenAI Developers on X (28 October 2026)"
    url: https://x.com/OpenAIDevs/status/2115583698074755078
---

OpenAI now gives eligible ChatGPT Pro and Business subscribers free OpenAI API credits every billing cycle. [OpenAI Developers announced it](https://x.com/OpenAIDevs/status/2115583698074755078) late on 28 October, and the [API guide](https://developers.openai.com/api/docs/guides/chatgpt-api-credits) spells out the terms. If you pay for ChatGPT and have been meaning to try the API, this is the cheapest way in.

## How much you get

| Subscription | Monthly API credits |
| --- | --- |
| Pro ($100 tier) | $100 |
| Pro ($200 tier) | $200 |
| Pro ($500 tier) | $500 |
| Business Standard | $20 per paid seat, pooled |
| Business Premium | $100 per paid seat, pooled |

Business credits are pooled across the workspace and capped at $500 a month. Workspaces that pay annually upfront get the whole year's grant at once, capped at $6,000. Your first grant is prorated for the time left in the current billing cycle.

## Who qualifies

The subscription must be paid, active and at least seven days old. Free trials and complimentary subscriptions do not count, and the [Help Center article](https://help.openai.com/en/articles/20001626-api-credits-benefit-for-eligible-chatgpt-subscriptions) says Plus does not qualify, and does not list Enterprise, Edu or legacy Codex seats as eligible. You must own both the ChatGPT subscription (or Business workspace) and the API organization that receives the credits, with the same email address on both. You link the subscription to the API organization from ChatGPT billing settings (or the Admin Console for Business) or from the API Platform. After that, credits arrive automatically at each renewal while the benefit lasts.

## What the credits cover, and what they don't

They cover paid API Platform usage for the linked organization: the Responses, Agents, Decisions, Realtime and Images APIs, GPT-Live, and built-in tools such as web search, file search and Code Interpreter, including their storage charges.

The limits matter more:

- **No Codex.** OpenAI says Codex usage through API keys is not covered, and the credits do not raise your ChatGPT or signed-in Codex limits.
- **No rollover.** Monthly grants expire at the end of the billing cycle.
- **Normal rate limits.** The credits are subject to your organization's usual API rate limits.
- **Free credits go first.** Your organization spends them before purchased credits. When they run out and you have no purchased balance, requests fail with HTTP 429 and the error code `credit_balance_exhausted`.

Downgrading to Plus, Go or Free removes the link at the end of the cycle, and so does moving a Business workspace to Enterprise. OpenAI says the benefit "may change or be removed in the future".

## What to do

If you are on Pro or Business, link an API organization now; a partial first month is better than none. If you build scripts or agents that must not fail on a 429, either keep a small purchased balance behind the free credits or handle `credit_balance_exhausted` explicitly.
