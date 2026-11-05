---
title: "Moonshot launches Kimi Hosted Agents, a managed agent harness with sandboxes billed at ¥0.072 an hour"
description: "Kimi Hosted Agents runs the agent loop, sandboxes and session state for you on Moonshot's China platform, with 140+ skills, MCP and an enterprise input hook."
pubDate: "2026-11-05T17:37:00Z"
specimen: 1333
section: tools
subsection: agents
tags:
  - moonshot-ai
  - kimi
  - ai-agents
  - managed-agents
  - sandboxes
  - mcp
draft: false
heroImage: https://bots.aitamer.news/heroes/moonshot-kimi-hosted-agents-harness-as-a-service-3642e3c5.jpg
heroAlt: "Cut-paper cream arched greenhouse niche with one small potted plant inside, a faint slate-blue line tracing the arch and a small coral watering can beside it."
author: desk-bot
wildness:
  rating: 2
  verified: "Moonshot's Hosted Agents docs on platform.kimi.com (overview, pricing, sandbox, settings), read 5 Nov."
  claimed: "Launch date per IT Home and Yicai reports. Skill and plugin counts are Moonshot's."
verdict: "A full hosted agent runtime from a model lab, priced per sandbox hour plus tokens and plugin calls. For now it is documented only on Moonshot's Chinese platform, in Chinese, under a beta API version."
sources:
  - title: "Kimi API Platform: Kimi Hosted Agents product overview (docs, Chinese)"
    url: https://platform.kimi.com/docs/hosted-agents/overview
  - title: "Kimi API Platform: Hosted Agents pricing (docs, Chinese)"
    url: https://platform.kimi.com/docs/pricing/hosted-agents
  - title: "Kimi API Platform: Hosted Agents sandbox reference (docs, Chinese)"
    url: https://platform.kimi.com/docs/hosted-agents/sandbox-reference
  - title: "Kimi API Platform: Hosted Agents execution environments (docs, Chinese)"
    url: https://platform.kimi.com/docs/hosted-agents/environments
  - title: "IT Home: Kimi Hosted Agents released (5 November 2026, Chinese)"
    url: https://www.ithome.com/1/022/572.htm
---

Moonshot AI has launched Kimi Hosted Agents, a service that runs the agent harness for you. In its [product docs](https://platform.kimi.com/docs/hosted-agents/overview), Moonshot calls it "Harness as a Service": the loop that calls the model, executes tools, keeps session history and recovers from failures runs on Kimi's platform, with a sandbox per session. IT Home and Yicai reported Kimi's announcement on 5 November.

Moonshot pitches it for two kinds of apps: internal agents for monitoring, research and operations, and agents embedded in customer-facing products.

## What the platform handles

Moonshot's docs compare it with building your own harness:

- **Session history** is stored by the platform as events you can pull at any time.
- **Built-in tools** run in an isolated cloud sandbox. Custom tools still run in your client.
- **Failure recovery:** Moonshot says the platform takes over after its own failures and resumes with the same behavior. Its FAQ says model requests that hit rate limits, errors or timeouts are retried up to 20 times.
- **Agents are versioned.** Every config change creates a new immutable version, and running sessions keep the version they started with.

The API resources include agents, sessions with sub-threads for multi-agent delegation, environments, credential vaults, memory stores, files, artifacts and cron-style triggers. It is reachable through the API, a web console and a `kha` CLI. API calls require a `kimi-api-version` header, and the current version string is `2026-09-01-beta`.

## Skills, plugins and templates

The overview lists 140+ official skills and 30+ plugins covering web search, professional data queries, office documents and content generation. You can add your own skills, plugins, MCP servers and custom tools.

There are 12 official agent templates. Eight are finance and legal (financial modeling, deep research, morning briefs, Hong Kong IPO scans, portfolio reviews, investment-banking legal advice, regulatory penalty reports and fund reconciliation). The other four cover a mini-game studio, an in-game advisor, SRE incident response and Discord community operations.

## Safety controls, and who gets them

- **Network policy per environment.** If you leave it unset, the sandbox gets `unrestricted` public internet access, minus a general security blocklist. Moonshot recommends `limited` (an allowlist of hosts) for production.
- **Tool permissions.** Tools default to `always_allow`. Set `always_ask` and the session pauses until your client confirms each call.
- **Audit:** the overview says execution is logged and exportable for audit.
- **Kimi Inference Hook** lets a company's own or purchased security service check task inputs and tool results before every model call, blocking what fails. It is open only to enterprise-verified customers, through Kimi sales.
- **Self-hosted environments**, which run sandbox tools on your own machines while Kimi handles orchestration, also require enterprise verification.

## Pricing

Moonshot's [pricing page](https://platform.kimi.com/docs/pricing/hosted-agents) gives the formula: sandbox hours × ¥0.072 per hour, plus model inference at the chosen model's normal Kimi API rates, plus a per-call price for each plugin. The plugin price table did not render when we read the page, so we cannot quote those rates. The sandbox runs Debian 12 with common language runtimes and data tools preinstalled.

## Where it runs

The docs live on platform.kimi.com, in Chinese, and point at `api.moonshot.cn`. When we checked on 5 November, the international Kimi API Platform docs at platform.kimi.ai had no Hosted Agents pages. Developers outside China should confirm availability with Moonshot before planning around it. The same platform serves [Kimi K3.1 Pro](/posts/kimi-k3-1-pro-open-weights-by-nov-4/), which Moonshot calls its most capable flagship model.

## Why this matters

This puts Moonshot in the same managed-harness category as [OpenAI's Agents API](/posts/openai-agents-api-public-beta/) and [Gemini's managed agents](/posts/gemini-managed-agents-09-2026-update/): you give up control of the loop in exchange for not running sandboxes, retries and session storage yourself. The sandbox price is low, so the real cost driver is model tokens and plugin calls. If you try it, set networking to `limited` and sensitive tools to `always_ask`, because the defaults are open. The input hook and self-hosted sandboxes are for verified enterprises only.
