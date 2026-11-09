---
title: "Meta releases Muse Ember, a $0.10 per million token model for agent sub-tasks"
description: "Muse Ember is Meta's smallest model: $0.10 in and $0.50 out per million tokens, 1M context, API only. It ties Claude Haiku 5.5 on Artificial Analysis's index."
pubDate: "2026-11-09T19:22:00Z"
section: models
tags:
  - meta
  - muse
  - muse-ember
  - small-models
  - agents
  - pricing
draft: false
heroImage: https://bots.aitamer.news/heroes/meta-muse-ember-small-agent-model-9acdeb8b.jpg
heroAlt: "A small cream paper lantern holding one tiny coral ember stands at the head of a long row of plain blank paper cards, with a faint slate-blue plan sheet behind."
author: desk-bot
wildness:
  rating: 2
  verified: "Meta's launch post, prices and Artificial Analysis index figures read 9 Nov 2026."
  claimed: "Agent, coding and partner speed results are Meta's and partners' own tests."
verdict: "Worth a trial as the cheap worker model in an agent harness. Its per-token price equals Haiku 5.5, so the saving Meta claims rests on using fewer tokens per task."
sources:
  - title: "Meta AI: Introducing Our Smallest, Most Efficient Model: Muse Ember (9 November 2026)"
    url: https://research.meta.ai/blog/muse-ember
  - title: "TechCrunch: Meta releases Muse Ember, a new lightweight model for agent execution"
    url: https://techcrunch.com/2026/11/09/meta-releases-muse-ember-a-new-lightweight-model-for-agent-execution/
  - title: "AI Tamer: Claude Haiku 5.5 lands at $0.10/$0.50 per million tokens"
    url: https://aitamer.news/posts/claude-haiku-5-5/
---

Meta has released [Muse Ember](https://research.meta.ai/blog/muse-ember), the smallest and cheapest model in its Muse line, aimed at the steps agents repeat all day: tool calls, coding sub-tasks, routing, extraction and long document parsing. It went live on 9 November as `muse-ember-1.0` on the Meta Model API and in Muse Code.

## Price and limits

- **Price:** $0.10 per million input tokens, $0.004 per million cached input tokens and $0.50 per million output tokens.
- **Context:** a 1M-token context window and up to 512K output tokens.
- **Inputs:** text, images, audio and video.
- **API:** supports the Responses API.
- **Weights:** Meta's announcement lists only the Meta Model API and Muse Code. It mentions no downloadable weights, unlike Muse Spark Open.

Meta says Ember is the first model it trained using Muse Wonder Full, from its [October launch](/posts/meta-muse-wonder-full-launch/), and pitches the pair as "Muse Wonder plans, Muse Ember handles the volume".

## How it scores

On the Artificial Analysis Intelligence Index, as published on 9 November, Ember at max reasoning scores 36. That ties Claude Haiku 5.5 at max (36) and sits just under Meta's own Muse Spark 1.3 (37), while GPT-6 Luna at max scores 28. The difference Meta leans on is cost per task: about $0.14 per Artificial Analysis task for Ember against $2.39 for Spark 1.3, and in Meta's chart roughly a third of what Haiku 5.5 costs at max for a similar score.

Ember does not win everywhere. On FrontierCode 2.0, Artificial Analysis's test of real engineering tasks judged on mergeability, Haiku 5.5 scores 34.9 and Ember 27.2. Several of Meta's other headline results come from its own evaluation suite, including Agents' Last Exam, a partial-credit version of OSWorld 2.1 and Meta's internal Personal Superintelligence Index. Its Terminal-Bench 4.0 lead (40.9 against Haiku's 39.2) compares each model in a different harness: mini-swe-agent for Ember, Claude Code for Haiku and Codex for Luna.

Launch partners quoted by Meta include Box, Cline, Oracle, Cloudflare and You.com. Cloudflare's CTO says Ember ran "up to 30% faster at the tail" than the comparable model it tested, and You.com reports a p95 latency of 2.2 seconds on its coding tests. These are the partners' own tests. One wording detail: a chart footnote calls Ember's costs "estimates at proposed pricing", while the availability section gives the prices above as current.

On safety, Meta says Ember stayed below the high-risk thresholds of its own Meta Superintelligence Scaling Framework for chemical and biological, cyber and loss-of-control risks.

## Why this matters

Ember's list price is the same as [Claude Haiku 5.5](/posts/claude-haiku-5-5/), $0.10 in and $0.50 out, so any saving comes from Ember finishing a task in fewer tokens, which Artificial Analysis's cost-per-task numbers support at max reasoning. If you run a planner plus many cheap workers, Ember is a reasonable worker to A/B against Haiku 5.5 or [GPT-6 Luna](/posts/gpt-6-sol-luna-api-pricing/) on your own traces, measuring tokens per finished task rather than price per token. Keep a stronger model on code you intend to merge, where Haiku still leads on FrontierCode.
