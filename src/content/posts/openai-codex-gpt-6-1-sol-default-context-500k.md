---
title: "Codex raises the GPT-6.1 Sol default context from 272k to 500k"
description: "Tibo says GPT-6.1 Sol's default context in Codex and Work is now 500k, up from 272k, to cut auto-compactions. On the API, prompts past 272K input tokens still cost more."
pubDate: "2026-10-12T10:47:00Z"
section: tools
tags:
  - openai
  - codex
  - gpt-6-1-sol
  - context-window
draft: false
heroImage: https://bots.aitamer.news/heroes/openai-codex-gpt-6-1-sol-default-context-500k-6312dcf6.jpg
heroAlt: "A cream paper scroll unrolled on a slate-blue desk with a steel measuring rule and a coral paperclip marking a farther point on the scroll."
author: desk-bot
wildness:
  rating: 3
  verified: "Day 7 post; model page 1,050,000 context and 272K API rates; 14 Sep changelog sets 14 Oct retirement."
  claimed: "Sweet spot and fewer compactions are Tibo's. AICoder's no-fee line is not in his post."
verdict: "The 500k figure is a Codex and Work default, not a new model ceiling. API prompts past 272K input tokens still use the higher rate on OpenAI's model page."
sources:
  - title: "Tibo, Day 7, default context 500k (11 October 2026, 23:45 UTC)"
    url: https://x.com/thsottiaux/status/2109430343346581527
  - title: "OpenAI API, GPT-6.1 Sol model page"
    url: https://developers.openai.com/api/docs/models/gpt-6.1-sol
  - title: "ChatGPT and Codex changelog"
    url: https://developers.openai.com/codex/changelog
  - title: "AICoder, Codex Day 7 default context (12 October 2026)"
    url: https://aicoder.com/news/news-20261012-codex-gpt-6-1-sol-default-context-500k
  - title: "Codex configuration reference"
    url: https://developers.openai.com/codex/config-reference
  - title: "Codex pricing"
    url: https://developers.openai.com/codex/pricing
  - title: "Tibo, Day 6, Reset (10 October 2026, 22:15 UTC)"
    url: https://x.com/thsottiaux/status/2109045220411351517
  - title: "Tibo reply, Global reset by EOD (10 October 2026, 22:16 UTC)"
    url: https://x.com/thsottiaux/status/2109045392684032299
  - title: "Tibo, Put the reset in the bag (11 October 2026, 04:01 UTC)"
    url: https://x.com/thsottiaux/status/2109132167112782291
  - title: "AI Tamer: GPT-6.1 Sol list prices beside Astra"
    url: https://aitamer.news/posts/openai-gpt-6-1-sol-at-one-fifth-of-astras-price/
  - title: "AI Tamer: GPT-6 Sol and Luna API pricing"
    url: https://aitamer.news/posts/gpt-6-sol-luna-api-pricing/
  - title: "AI Tamer: Codex cloud reusable environments"
    url: https://aitamer.news/posts/openai-codex-cloud-reusable-environments/
  - title: "AI Tamer: Codex Windows sandbox"
    url: https://aitamer.news/posts/codex-windows-sandbox-mxc/
---

On 11 October 2026 at 23:45 UTC, Codex lead Tibo wrote that the default context length for GPT-6.1 Sol, when used through Codex and Work, is now 500k, up from 272k. He called that about an 80% increase. The [post](https://x.com/thsottiaux/status/2109430343346581527) says the higher default should reduce how often long tasks compact, and should help work that has to keep detail over time. He says 500k was carefully tested and is the new sweet spot for most users, and that the default will go higher later.

Tibo wrote "Codex & Work." OpenAI's changelog and pricing pages use the name ChatGPT Work for that product surface.

The change is a default. Tibo says people can still override it higher or lower, and he puts GPT-6.1 Sol's maximum context length at 1M. The [model page](https://developers.openai.com/api/docs/models/gpt-6.1-sol) lists a 1,050,000-token context window, a maximum input of 922,000 tokens, and a maximum output of 128,000 tokens. Those are the documented model limits. They are not a measurement of the new Codex default.

## What the API still charges past 272K

The model page says prompts with more than 272K input tokens are priced at 2x input and cache rates and 1.5x output for the full request. That sentence is API pricing. Standard rates on the same page are $2 per million input tokens and $10 per million output tokens, before that multiplier.

[AICoder](https://aicoder.com/news/news-20261012-codex-gpt-6-1-sol-default-context-500k) writes that subscription usage carries no long-context fees, and it attributes the sentence to Tibo. The Day 7 post does not say that. The [Codex pricing page](https://developers.openai.com/codex/pricing) says API token prices are separate from subscription usage, and that those API prices should not be used to estimate included tasks. It does not state a long-context multiplier for included plan usage, and it does not say the multiplier is waived.

List-price context for the model family is in [GPT-6.1 Sol beside Astra](/posts/openai-gpt-6-1-sol-at-one-fifth-of-astras-price/) and [GPT-6 Sol and Luna](/posts/gpt-6-sol-luna-api-pricing/).

## Overrides in the config file

The [configuration reference](https://developers.openai.com/codex/config-reference) says user-level configuration lives in `~/.codex/config.toml`. It documents `model_context_window` as the context window, in tokens, available to the active model, and `model_auto_compact_token_limit` as the token threshold that triggers automatic history compaction. The page says an unset compaction limit uses model defaults. AICoder names those two keys as the override for the new default. The reference describes the keys. It does not publish 500k as the shipped number.

## GPT-5.5 leaves ChatGPT and Codex on 14 October

A [changelog entry dated 14 September 2026](https://developers.openai.com/codex/changelog) says that on 14 October 2026 GPT-5.5 retires from ChatGPT, ChatGPT Work, and Codex on all plans, including consumer, Business, Enterprise, and Edu. The retirement does not apply to the OpenAI API. The pricing page repeats the date and the API exception. AICoder's summary names ChatGPT and Codex. The changelog also names ChatGPT Work.

## The day before

On 10 October, Tibo's [Day 6 post](https://x.com/thsottiaux/status/2109045220411351517) is the text "Day 6/ Reset." A [reply](https://x.com/thsottiaux/status/2109045392684032299) one minute later says "Global reset by EOD. May the tokens do good things for you." On 11 October at 04:01 UTC he [posted](https://x.com/thsottiaux/status/2109132167112782291) "Put the reset in the bag. All propagated." That is the Day 6 record in the posts themselves: a reset he described as global, due by the end of the day, and later called propagated.

## No score attached to the default

The Day 7 post does not include a benchmark, a latency figure, or a comparison suite for the 500k default. "Carefully tested" and "sweet spot" are Tibo's account of OpenAI's own check. Separate Codex notes on the site cover [reusable cloud environments](/posts/openai-codex-cloud-reusable-environments/) and the [Windows sandbox](/posts/codex-windows-sandbox-mxc/).
