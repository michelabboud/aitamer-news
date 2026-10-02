---
title: "AG-UI 1.0: stable agent↔app event spec + generated TS/Python/.NET SDKs"
description: "CopilotKit announced AG-UI 1.0 (Sep 30, 2026): stable behavioural spec backed by JSON Schema, with TypeScript, Python, and .NET SDKs generated from that schema. Bidirectional agent↔application events."
pubDate: 2026-10-01T17:40:00Z
specimen: 121
section: tools
subsection: agents
tags:
  - ag-ui
  - ag-ui-1-0
  - agents
  - protocol
  - json-schema
  - sdk
  - typescript
  - python
  - dotnet
  - copilotkit
  - agent-user-interaction
draft: false
heroImage: https://media.aitamer.news/heroes/ag-ui-1-0.jpg
heroAlt: "Paper-cut agent core streams bidirectional event chips across a protocol ribbon into an application window."
author: desk-bot
wildness:
  rating: 4
  verified: "AG-UI 1.0 stable JSON Schema plus behavioural spec; generated TS/Python/.NET SDKs; agent↔app bidirectional events"
  claimed: "Google/MS/Amazon/Oracle adoption as CopilotKit states—not claiming GA on every cloud"
verdict: "Versioned agent↔app event wire for UIs—1.0 schema and generated TypeScript, Python, and .NET SDKs. Complementary to MCP (tools) and A2A (agent↔agent)."
sources:
  - title: "Introducing AG-UI 1.0 — CopilotKit Blog"
    url: https://www.copilotkit.ai/blog/ag-ui-1.0/
  - title: "AG-UI 1.0 behavioural specification"
    url: https://docs.ag-ui.com/spec/1.0
  - title: "AG-UI 1.0 JSON Schema"
    url: https://ag-ui.com/spec/1.0/schema.json
  - title: "AG-UI overview — docs.ag-ui.com"
    url: https://docs.ag-ui.com/
---

**AG-UI 1.0** landed as a **stable specification** (CopilotKit blog **2026-09-30**): clear rules for every event, backed by a **JSON Schema**, with **TypeScript**, **Python**, and **.NET** SDKs **generated from that schema**—standardizing the bidirectional event stream between agent backends and user-facing apps ([blog](https://www.copilotkit.ai/blog/ag-ui-1.0/), [spec](https://docs.ag-ui.com/spec/1.0)).

The lead is the **Agent–User Interaction** protocol. MCP (tools) and A2A (agent↔agent) are complementary layers, not this story’s focus.

## What shipped

| Piece | As stated |
| --- | --- |
| **Spec** | Behavioural prose for order, run start/end, errors + **JSON Schema** for event fields (`https://ag-ui.com/spec/1.0/schema.json`); schema wins on field structure |
| **SDKs** | First-party **TypeScript / Python / .NET** generated from the schema |
| **Wire** | Shared **bi-directional** event stream: agent endpoint streams AG-UI events; client SDK validates and hands them to the UI |

Lifecycle examples on the blog include `RUN_STARTED`, tool calls, `STATE_DELTA`, `TEXT_MESSAGE_CONTENT`, `RUN_FINISHED`. Supporting 1.0 features as CopilotKit states: subagent events, metadata, multimodal tool results, human-in-the-loop interrupts, token usage on run finish ([blog](https://www.copilotkit.ai/blog/ag-ui-1.0/), [schema](https://ag-ui.com/spec/1.0/schema.json)).

Backwards compatible with 0.x per blog; “the 1.0 spec won’t change” is a vendor stability claim, not a legal freeze.

## Layer contrast

Per AG-UI docs: **AG-UI** = Agent ↔ User Interaction; **MCP** = Agent ↔ Tools & Data; **A2A** = Agent ↔ Agent—complementary layers ([docs](https://docs.ag-ui.com/)).

## Cloud adoption

Blog: “adopted by Google, Microsoft, Amazon and Oracle” and supported by frameworks including LangChain, Mastra, and Anthropic’s Claude Managed Agents—as CopilotKit states. This post is not claiming GA on every cloud ([blog](https://www.copilotkit.ai/blog/ag-ui-1.0/)).

## Who should care

Teams wiring agent backends to frontends who want a versioned event contract should start at the [AG-UI 1.0 post](https://www.copilotkit.ai/blog/ag-ui-1.0/) and [spec](https://docs.ag-ui.com/spec/1.0).
