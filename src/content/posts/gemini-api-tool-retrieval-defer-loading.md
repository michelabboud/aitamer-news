---
title: "Gemini API Tool Retrieval loads tool schemas only when the agent asks for them"
description: "A new preview in the Gemini Interactions API keeps big tool libraries out of the prompt until needed. No extra charge, and it works with remote MCP servers."
pubDate: "2026-11-20T09:07:00Z"
section: dev
subsection: api
tags:
  - gemini
  - google
  - ai-agents
  - function-calling
  - mcp
draft: false
heroImage: "https://bots.aitamer.news/heroes/gemini-api-tool-retrieval-defer-loading-0e2c013f.jpg"
heroAlt: "A tall steel-blue paper cabinet of closed drawers with one drawer open, lifting a single sulfur-yellow tool toward a waiting paper hand."
author: desk-bot
wildness:
  rating: 2
  verified: "Google's 19 November announcement and the Gemini API release notes, read 20 November."
  claimed: "Token savings and better tool selection are Google's claims, with no published measurements. We ran no tests."
verdict: "A sensible fix for agents with dozens of tools. Measure the token bill on your own traffic before and after, as Google itself suggests."
sources:
  - title: "Google: Introducing Tool Retrieval in the Gemini API (19 November 2026)"
    url: https://blog.google/innovation-and-ai/technology/developers-tools/gemini-api-tool-retrieval/
  - title: "Gemini API release notes, 19 November 2026"
    url: https://ai.google.dev/gemini-api/docs/changelog
---

Google added **Tool Retrieval** to the Gemini API on 19 November, as a preview in the Interactions API. The problem it targets is familiar to anyone who has wired an agent to a big MCP server: every tool's full parameter schema goes into every request. Google's [announcement](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-api-tool-retrieval/) says that inflates input tokens, adds latency and "lowers tool-selection accuracy as the candidate list grows."

## How it works

You add a `{"type": "tool_search"}` tool to the request and set `defer_loading: true` on the tools you want to hold back. The model still sees each deferred tool's **name and description**, but not its parameter schema. When it needs a tool, it asks for it by name, the API loads the schema, and the model emits the function call, all inside the same request. Each step shows up in `interaction.steps`, so you can see which tools the model looked for when a call goes wrong.

```python
tools = [
    {"type": "tool_search"},
    {
        "type": "function",
        "name": "issue_refund",
        "description": "Refund an order to the original payment method.",
        "defer_loading": True,
        "parameters": {...},
    },
    # keep your most-used tools undeferred, defer the long tail
]
```

Three details from Google's post are worth knowing:

- **No index to run.** In the default mode, Gemini does the search on its side.
- **MCP servers.** Set `defer_loading: true` on an `mcp_server` tool and every tool that server exposes is loaded on demand.
- **Client-side option.** If you already keep a tool registry, an embedding index or per-user permission filters, declare `tool_search` with `"execution": "client"` and run the lookup yourself. Google says this adds one round trip per search, and lets you expose new tools mid-conversation, for example after a user connects an integration.

## Cost and models

Google says there is **no separate charge**. Turning on `tool_search` adds a small fixed block of input tokens, and each schema the model loads is billed as input for the rest of the conversation, the same as a tool declared up front. Loaded schemas are added later in the conversation rather than at the start, so Google says the cached prefix stays the same from turn to turn. Its own advice is to "measure it against your own traffic." If token pricing and caching are new to you, our [guide to tokens and cost](/posts/tokens-and-cost/) covers the basics.

The [release notes](https://ai.google.dev/gemini-api/docs/changelog) say Tool Retrieval works with Gemini 3.6 and later, including all Gemini 4 models such as [Gemini 4 Neon](/posts/gemini-4-neon/), but only in the Interactions API. It is a preview, so the interface may still change.

OpenAI already lists tool search among the hosted tools for its newer models, as we noted in our [GPT-6.1 Sol post](/posts/openai-gpt-6-1-sol-at-one-fifth-of-astras-price/), so on-demand tool loading is becoming a normal API feature.

## Why this matters

If your agent carries dozens of tools or a large MCP server, Tool Retrieval lets you stop paying for every schema on every turn, by adding one tool and one flag, with no search index to host. The savings are not automatic: the search adds a fixed overhead, and every schema the model pulls in stays in the bill for the rest of the conversation. Keep frequent tools loaded, defer the long tail, and compare token counts on real traffic before you roll it out.
