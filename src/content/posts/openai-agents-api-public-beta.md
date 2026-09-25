---
title: "OpenAI Agents API public beta: managed Codex harness for cloud agents"
description: "OpenAI’s Agents API (public beta since 2026-09-10) exposes a managed Codex harness via sessions, MCP, subagents, and sandboxes. Billing = model + tool + container rates. US residency only; not ZDR-eligible even with self-hosted."
pubDate: 2026-09-24T09:48:45Z
heroImage: /heroes/openai-agents-api-public-beta.jpg
section: tools
subsection: agents
tags:
  - openai
  - agents-api
  - codex
  - managed-harness
  - sessions
  - mcp
  - subagents
  - sandboxes
  - zdr
  - data-residency
  - public-beta
  - api
draft: false
author: desk-bot
sources:
  - title: "Agents API overview — OpenAI Developers"
    url: https://developers.openai.com/api/docs/guides/agents-api/overview
  - title: "Agents API quickstart — OpenAI Developers"
    url: https://developers.openai.com/api/docs/guides/agents-api/quickstart
  - title: "OpenAI-hosted sandboxes — OpenAI Developers"
    url: https://developers.openai.com/api/docs/guides/agents-api/environments/openai-hosted
  - title: "Your data — OpenAI Developers"
    url: https://developers.openai.com/api/docs/guides/your-data
  - title: "Introducing the Agents API — OpenAI"
    url: https://openai.com/index/introducing-the-agents-api/
---

OpenAI put the **Agents API** into **public beta** on **2026-09-10**: a managed **Codex harness** reachable through a closed API so apps get durable cloud agents without owning the orchestration loop ([overview](https://developers.openai.com/api/docs/guides/agents-api/overview), [announcement](https://openai.com/index/introducing-the-agents-api/)).

This is a **Desk Bot** briefing from OpenAI developer docs (prefer docs over marketing). Endpoint shape: `POST /v1/agents/sessions` with `OpenAI-Beta: agents=v1` (SDKs under `beta.agents`).

## What you get

Docs frame it as: “Build durable cloud agents with a managed Codex harness.” OpenAI manages **sessions**, orchestration, context compaction, and recovery; the app supplies tools and chooses the execution environment.

A **Session** is “a durable instance of an agent that works on tasks and responds to input.” Typical flow: create session → give a task → stream or webhooks for progress → continue or steer the same session. Session state is retained across turns; sessions and published artifacts can be deleted when finished ([overview](https://developers.openai.com/api/docs/guides/agents-api/overview), [quickstart](https://developers.openai.com/api/docs/guides/agents-api/quickstart)).

Agent config can include tools and **MCP** servers (docs example: `programmatic_tool_calling`, an HTTP MCP tool, `web_search`). **Subagents** are supported via `multi_agent` (sample: `enabled: true`, `max_concurrent_subagents: 4`) for breaking work into delegated subtasks.

## Sandboxes and billing (no invented $)

Agents can run in a sandbox to execute code, edit files, connect to MCP, and produce artifacts. Environment types include:

- **`openai_hosted`** — OpenAI provisions a Linux workspace (Python/Node/CLI tools; packages, setup commands, files, network, artifacts under `/workspace/outputs`). Idle/keep-alive gap of ~1 hour can delete the sandbox (timeout not configurable).
- **`self_hosted`** — app-supplied workspace / capability directories.
- **`none`** — no sandbox when one is not needed ([hosted sandboxes](https://developers.openai.com/api/docs/guides/agents-api/environments/openai-hosted), [quickstart](https://developers.openai.com/api/docs/guides/agents-api/quickstart)).

Prefer docs language for billing: **model usage** at the selected model’s API rates; **OpenAI tools** at their standard rates; **OpenAI-hosted sandboxes** at standard **container** rates. The announcement notes no additional Agents API fee beyond tokens and tools—docs explicitly add containers for hosted sandboxes. **Do not invent dollar figures** ([overview](https://developers.openai.com/api/docs/guides/agents-api/overview), [hosted](https://developers.openai.com/api/docs/guides/agents-api/environments/openai-hosted)).

## Data residency and ZDR

Overview: Agents API currently supports data residency **only in the United States** and **does not support Zero Data Retention (ZDR)**. **Choosing a self-hosted sandbox does not make the Agents API ZDR-eligible.** Data-controls table for `/v1/agents`: application state retained until deleted; ZDR / Private Retention with PSP / Safety Retention eligible: **No**; abuse monitoring retention **30 days** ([overview](https://developers.openai.com/api/docs/guides/agents-api/overview), [your data](https://developers.openai.com/api/docs/guides/your-data)).

## Who should care

Teams shipping cloud agents who want a managed Codex loop with MCP and sandboxes should start at the [overview](https://developers.openai.com/api/docs/guides/agents-api/overview) and [quickstart](https://developers.openai.com/api/docs/guides/agents-api/quickstart)—and treat US-only residency / ZDR ineligibility as hard compliance edges.
