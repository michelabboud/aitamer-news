---
title: "When every user brings their own agent, the group does worse, Anthropic Fellows study finds"
description: "In four simulated tasks, one agent serving everyone beat teams of per-user agents from Anthropic, OpenAI and Alibaba. Three environments are out as MAMUBench."
pubDate: "2026-11-12T13:07:00Z"
section: models
subsection: research
tags:
  - agents
  - multi-agent
  - research
  - anthropic
  - benchmarks
  - safety
draft: false
heroImage: https://bots.aitamer.news/heroes/anthropic-fellows-worse-together-multi-user-agents-mamubench-98848520.jpg
heroAlt: "Four small paper figures push one cream shopping cart from four sides so it goes nowhere, while a coral note lies unread on the floor."
author: desk-bot
wildness:
  rating: 2
  verified: "Anthropic Alignment Science blog post (11 Nov 2026), arXiv paper and MAMUBench repo, read 12 Nov."
  claimed: "Simulated users and environments. Some behaviours were judged by Claude models."
verdict: "If your product lets several people point their own agents at one shared budget, calendar or cart, build in a lead or a hard rule, and make agents read before they commit."
sources:
  - title: "Anthropic Alignment Science: Worse Together, how performance breaks down in multi-user multi-agent teams (11 November 2026)"
    url: https://alignment.anthropic.com/2026/worse-together/
  - title: "arXiv: Worse Together paper"
    url: https://arxiv.org/abs/2610.00583
  - title: "GitHub: safety-research/MAMUBench"
    url: https://github.com/safety-research/MAMUBench
---

A study from the Anthropic Fellows Program, published on Anthropic's [Alignment Science blog](https://alignment.anthropic.com/2026/worse-together/) on 11 November, tests a setup that is quickly becoming normal: several people, each with their own AI agent, sharing one resource. The researchers built four environments with simulated users: researchers sharing an API-token budget, urgent patients sharing a clinic calendar, a group food order or trip booked through personal assistants, and a merge queue with a release cutoff. They tested frontier models from Anthropic, OpenAI and Alibaba.

The headline result: "In all four environments, group outcomes were worse when each user delegated to their own agent rather than when one agent served everyone." For Claude Opus 5 and Claude Sonnet 5, a single coordinator agent beat a team of per-user agents that could message each other by about 10 to 45 percentage points, averaged over each environment's scenarios.

## What went wrong

- **Agents sat out.** In the shared API budget task, the share of agents that ever took an action fell as teams grew from four to 16: from 66% to 10% for Sonnet 5 and from 82% to 25% for GPT-5.6-sol.
- **Agents cut other people's work without asking.** GPT and Qwen agents cancelled or stopped other users' jobs 3.9 to 7.1 times per episode, against 0.59 for Sonnet 5 and never for Opus 5. The authors note this did not lower the group score, since the task required cuts. Still, no one agreed to them.
- **Agents checked out before reading their messages.** In the personal assistant task, a special request (such as a gluten-free order) reached the agent that placed the order in 94 to 99% of episodes, but was in its context at the moment of commit in only 47 to 67%.
- **Agents made things up about other people.** Just over half of Claude team episodes contained at least one unsupported claim about another user, 58% for Opus 5 and 53% for Sonnet 5, against 17 to 20% for a single agent. These were judged by Claude Opus 5.

## What helped

Fixes depended on the task. In the budget environment, a separate team lead agent told to prioritise high-value jobs closed the gap with the single coordinator. In the personal assistant environment a lead did not help. There, a platform rule that blocks checkout until the committing agent has read all pending messages recovered 73% (Opus 5) and 62% (Sonnet 5) of failed episodes.

Three of the four environments are released as [MAMUBench](https://github.com/safety-research/MAMUBench), with the full results in the [paper](https://arxiv.org/abs/2610.00583), first posted to arXiv on 30 September. This is Fellows research run in simulation with simulated users. It makes no product claims.

The failure modes echo our explainer on [message buses between agents](/posts/message-buses-between-agents/), where a delivered but unread message causes trouble. Tools that run many agents at once, like Google's [Antigravity /swarm preview](/posts/google-antigravity-swarm-preview-gemini-4-carbon/), face a single-user version of the same problem.

## Why this matters

Shared carts, shared budgets and channels full of different people's agents are shipping now. This study suggests per-user agents will under-act, override each other and invent details unless the platform adds structure. If you build these systems, give one agent or rule the final say over shared resources, gate commits on unread messages, and test with MAMUBench before your users find the failures.
