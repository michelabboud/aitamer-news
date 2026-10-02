---
title: "Cloudflare AI Gateway User Insights: model overkill, tasks, and Potential Savings"
description: "Sep 30 User Insights update for AI Gateway: model-fit Overkill/Appropriate/Underpowered, task+turns analysis, Potential Savings. Free for Gateway users (inference still billed). Distinct from Auto Router. Async ~1 day lag; log classification opt-in per gateway."
pubDate: 2026-10-01T16:00:00Z
specimen: 111
section: tools
subsection: agents
tags:
  - cloudflare
  - ai-gateway
  - user-insights
  - model-fit
  - observability
  - log-classification
  - potential-savings
  - agents
  - cost-optimization
  - claude-code
draft: false
heroImage: https://media.aitamer.news/heroes/cloudflare-ai-gateway-user-insights.jpg
author: desk-bot
wildness:
  rating: 4
  verified: "Sep 30 User Insights: Overkill/Appropriate/Underpowered; task+turns; Potential Savings; free AIG; ~1d lag; opt-in class"
  claimed: "Overkill is not a leaderboard and does not auto-recommend replacement (Cloudflare’s own framing)"
verdict: "Gateway observability for model fit and task context. Insights are free and inference is still billed; log classification is opt-in; results lag by about a day. Not a routing product."
sources:
  - title: "Identify AI model overuse with User Insights — Cloudflare Blog"
    url: https://blog.cloudflare.com/ai-model-overuse-user-insights/
  - title: "User Insights — Cloudflare Docs"
    url: https://developers.cloudflare.com/ai-gateway/observability/user-insights/
  - title: "Log classification — Cloudflare Docs"
    url: https://developers.cloudflare.com/ai-gateway/observability/log-classification/
  - title: "User Insights task analysis — Cloudflare Changelog (2026-09-29)"
    url: https://developers.cloudflare.com/changelog/post/2026-09-29-user-insights-task-analysis/
---

Cloudflare’s **Sep 30, 2026** update to **AI Gateway User Insights** adds model-fit context on traffic already flowing through the gateway: when a selected model may be more capable than a task requires, which users/agents drive that pattern, and how task, cost, and conversation turns relate ([blog](https://blog.cloudflare.com/ai-model-overuse-user-insights/), [changelog](https://developers.cloudflare.com/changelog/post/2026-09-29-user-insights-task-analysis/)).

The story here is **observability and model fit**, not a separate routing product.

## Model overkill + Potential Savings

The **model overkill** view surfaces conversations where the selected model appears more capable than the task needs (e.g. simple formatting/summarization sent to a high-capability reasoning model). Cloudflare is explicit: the overkill view is **not a leaderboard** and **does not automatically recommend a replacement model**—it helps teams ask better questions before changing defaults or agent config ([blog](https://blog.cloudflare.com/ai-model-overuse-user-insights/)).

**Potential Savings** highlights requests that may work with a faster or less expensive model without compromising output quality—again as an Insights investigation surface, not an auto-swap ([blog](https://blog.cloudflare.com/ai-model-overuse-user-insights/), [changelog](https://developers.cloudflare.com/changelog/post/2026-09-29-user-insights-task-analysis/)).

Docs classify model fit as **Overkill**, **Appropriate**, **Underpowered**, or **Could not assess** ([log classification](https://developers.cloudflare.com/ai-gateway/observability/log-classification/)).

## Task analysis + turns

**Task analysis** groups conversations by kind of work. Initial blog categories: **coding, research, writing, summarization, data analysis** ([blog](https://blog.cloudflare.com/ai-model-overuse-user-insights/)).

**Turns analysis** shows how much back-and-forth different tasks take—so teams can compare time, tokens, and money before a task finishes, not just the first request ([blog](https://blog.cloudflare.com/ai-model-overuse-user-insights/)).

## Pricing + lag

Blog/docs: these insights are **available free to AI Gateway users**—no extra User Insights fee; **upstream inference is still billed** as usual ([blog](https://blog.cloudflare.com/ai-model-overuse-user-insights/), [User Insights](https://developers.cloudflare.com/ai-gateway/observability/user-insights/), [changelog](https://developers.cloudflare.com/changelog/post/2026-09-29-user-insights-task-analysis/)).

Classification is **asynchronous** (after the request path). Analysis may trail traffic by **approximately one day**—not a real-time live monitor ([blog](https://blog.cloudflare.com/ai-model-overuse-user-insights/)).

## Log classification (opt-in)

**Log classification** powers task and model-fit views. It is **off by default**, **per gateway**, and needs **Collect logs** on; only traffic while both are on is eligible ([log classification](https://developers.cloudflare.com/ai-gateway/observability/log-classification/)).

Pipeline (blog): a dedicated Worker processes eligible logs; metadata via **Durable Objects**, bodies in **R2**—User Insights exposes derived categories/aggregates, not a raw prompt browser ([blog](https://blog.cloudflare.com/ai-model-overuse-user-insights/)).

## Identity + harnesses

Attribute usage via **Cloudflare Access** in front of the gateway, or custom metadata with stable **`user_id`** / **`session_id`**. Blog calls out harnesses **Claude Code**, **Codex**, and **OpenCode** inheriting identity when Access is configured ([blog](https://blog.cloudflare.com/ai-model-overuse-user-insights/), [User Insights](https://developers.cloudflare.com/ai-gateway/observability/user-insights/)).

## Who should care

Teams already on AI Gateway who need model-fit and task context—not just token charts—should start at the [User Insights blog](https://blog.cloudflare.com/ai-model-overuse-user-insights/) and [docs](https://developers.cloudflare.com/ai-gateway/observability/user-insights/): keep free Insights / billed inference, opt-in log classification, and the ~1-day lag.
