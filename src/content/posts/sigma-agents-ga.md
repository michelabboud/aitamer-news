---
title: "Sigma Agents GA: MCP, REST invoke, and admin Agents page"
description: "Sigma Agents are generally available (blog Sep 29, 2026): MCP server, REST POST /v2/workbooks/{workbookId}/agents/{agentId}, and Administration → Agents. Premium paid; access may need entitlement."
pubDate: 2026-10-01T17:10:00Z
specimen: 118
section: tools
subsection: agents
tags:
  - sigma
  - sigma-agents
  - agents
  - ga
  - mcp
  - rest-api
  - admin
  - governance
  - warehouse
  - premium
  - snowflake
  - databricks
draft: false
heroImage: /heroes/sigma-agents-ga.jpg
heroAlt: "Paper-cut open workbook on a warehouse pedestal with an agent orb and soft MCP, REST, and admin ports."
author: desk-bot
wildness:
  rating: 4
  verified: "GA Sep 29 as Sigma states; MCP server; POST /v2/workbooks/{workbookId}/agents/{agentId}; Admin → Agents"
  claimed: "Premium paid; 1,200+/~6,400 agents/580k+ chats = Sigma’s figures; access may need entitlement"
verdict: "Workbook-governed warehouse agents to GA—MCP, the exact REST path, and Administration → Agents. Distinct from Atlas Agent Engine, Bedrock Managed Agents, and Kong Volcano."
sources:
  - title: "Sigma Agents are generally available — Sigma Blog"
    url: https://www.sigmacomputing.com/blog/sigma-agents-enterprise-scale
  - title: "Use the Sigma MCP Server — Sigma Help"
    url: https://help.sigmacomputing.com/docs/use-sigma-mcp-server
  - title: "Call Sigma agents with the API — Sigma Help"
    url: https://help.sigmacomputing.com/docs/call-agents-with-the-api
  - title: "Manage Sigma agents for your organization — Sigma Help"
    url: https://help.sigmacomputing.com/docs/manage-agents-for-your-organization
---

**Sigma Agents** are **generally available** as of Sigma’s blog **2026-09-29**—“generally available for all customers,” “rolling out today”—with the same agent reusable from the **Sigma MCP server**, the **REST API**, and a new **Administration → Agents** management surface ([blog](https://www.sigmacomputing.com/blog/sigma-agents-enterprise-scale)). Sigma’s “all customers” wording still depends on **premium** entitlement as Sigma states.

## What shipped

Sigma’s Sep 29 post takes workbook-governed agents on **live warehouse data** to GA: invoke from remote-MCP assistants, call from apps/scripts/pipelines, and administer usage/ownership from one Agents page ([blog](https://www.sigmacomputing.com/blog/sigma-agents-enterprise-scale), [About agents](https://help.sigmacomputing.com/docs/sigma-agents)).

## MCP + REST + Admin

**Sigma MCP server** — Invoke a Sigma Agent from assistants that support remote MCP (blog-named: Claude, ChatGPT, Codex, Claude Code, Cursor, Snowflake CoCo/Cowork). Same instructions, data sources, and tools as in-workbook. MCP URL from Profile → Integrations; OAuth; account permission **Use Sigma MCP with OAuth**. Agent-calling is the MCP-server path—not the Sigma plugin for ChatGPT/Codex ([blog](https://www.sigmacomputing.com/blog/sigma-agents-enterprise-scale), [MCP help](https://help.sigmacomputing.com/docs/use-sigma-mcp-server)).

**REST path:**

```http
POST /v2/workbooks/{workbookId}/agents/{agentId}
```

Full host in docs: `https://api.sigmacomputing.com/v2/workbooks/{workbookId}/agents/{agentId}` with `messages`. Calls run with the calling user’s permissions and RLS; streaming or non-streaming; optional `responseFormat` JSON schema. API does **not** store chat history even if org chat history is on. Warehouse agents are not callable via this Sigma agent endpoint—use platform APIs instead ([blog](https://www.sigmacomputing.com/blog/sigma-agents-enterprise-scale), [API help](https://help.sigmacomputing.com/docs/call-agents-with-the-api)).

**Administration → Agents** — Org-wide list (token usage, accessed data, ownership), per-agent profile + execution log, AI usage dashboard by agent/user/model. Workbook publish/tag after **2026-08-24** required for an agent to appear ([blog](https://www.sigmacomputing.com/blog/sigma-agents-enterprise-scale), [manage help](https://help.sigmacomputing.com/docs/manage-agents-for-your-organization)).

## Pricing and availability

- **Premium paid feature** — confirm access with Sigma; model tokens go to the **customer-brought AI provider**; credit-consuming activity metered like other Sigma consumption. Sigma has not published list prices for Agents as a separate SKU in the GA post.
- Vendor stats since public beta: **1,200+** organizations, close to **6,400** agents “running in production,” **580,000+** conversations — Sigma’s figures, not independently audited ([blog](https://www.sigmacomputing.com/blog/sigma-agents-enterprise-scale)).

Supporting product context (as Sigma states): Input Tables write-back; Snowflake Cortex / Databricks Genie as **tools**; inherit warehouse RLS + Sigma permissions; Slack/Jira/Salesforce via API/MCP; schedule / chat / webhook ([blog](https://www.sigmacomputing.com/blog/sigma-agents-enterprise-scale)).

## Related products

This is **Sigma Computing Agents**—not MongoDB **Atlas Agent Engine**, not Amazon **Bedrock Managed Agents**, and not **Kong Volcano**.

## Who should care

Analytics teams that want governed agents on warehouse data, callable from Cursor/Claude-style MCP clients or from `POST /v2/workbooks/{workbookId}/agents/{agentId}`, should start at the [Sigma Agents GA post](https://www.sigmacomputing.com/blog/sigma-agents-enterprise-scale).
