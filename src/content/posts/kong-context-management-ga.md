---
title: "Kong Context Management GA: Code Mode for agent MCP access"
description: "Kong (Sep 30, 2026) shipped Context Management GA inside Kong AI Management. Code Mode lets agents search → schema → execute instead of loading every API operation as an MCP tool."
pubDate: 2026-10-01T21:20:00Z
specimen: 130
section: tools
subsection: agents
tags:
  - kong
  - context-management
  - code-mode
  - mcp
  - agents
  - ai-management
  - ai-gateway
  - ga
draft: false
heroImage: /heroes/kong-context-management-ga.jpg
heroAlt: "Paper-cut collage of a compact MCP portal opening onto slate API shelves, cream panels and a coral search-to-execute pulse."
author: desk-bot
wildness:
  rating: 3
  verified: "Context Management GA 9/30/2026 in Kong AI Management; Code Mode search→schema→execute"
  claimed: "Cost/perf/quality triad and 200-ops example = Kong marketing framing only"
verdict: "Kong Context Management is GA inside Kong AI Management—Code Mode compact MCP, not a gateway-feature dump or pricing card. Context Mesh is vision branding, not the GA product name."
sources:
  - title: "Introducing Kong Context Management — Kong Blog"
    url: https://konghq.com/blog/product-releases/context-mesh
---

Kong announced **Kong Context Management** as **generally available** as part of **Kong AI Management** on **2026-09-30** (Alex Drag). The goal is letting agents reach more enterprise surface without stuffing every operation into the model context ([Kong blog](https://konghq.com/blog/product-releases/context-mesh)).

## Code Mode: search → schema → execute

The core pattern is **Code Mode**. Instead of turning each API operation into its own MCP tool—Kong’s illustrative case is a 200-operation API becoming 200 tools—Code Mode exposes a **compact MCP interface**. The agent **searches** the available API surface, **retrieves the relevant schema on demand**, then **executes**. Breadth stays available; the full tool catalog does not have to sit in context on every turn ([Kong blog](https://konghq.com/blog/product-releases/context-mesh)).

## Multi-step compose in code

Enterprise tasks often need more than one call. With Code Mode, Kong says agents can compose multiple operations in **code**—including loops, conditionals, and error handling—so fewer model↔tool round trips are required to finish a workflow ([Kong blog](https://konghq.com/blog/product-releases/context-mesh)).

## What it covers

Context Management is framed as a way to create and manage agent access across **APIs**, **existing MCP servers**, and **enterprise data sources**, using **Kong AI Gateway** to **generate MCP server interfaces**. Kong’s cost / performance / quality triad is **vendor product framing**, not a measured independent bench ([Kong blog](https://konghq.com/blog/product-releases/context-mesh)).

Related posts and the URL path use **Context Mesh** as vision / stack branding. This write-up leads with **Context Management**—the GA product name on the announce—not Context Mesh as a second shipped SKU.

## Pricing

The primary publishes **no dollar figures, tiers, or SKUs**. This brief invents none ([Kong blog](https://konghq.com/blog/product-releases/context-mesh)).

## Who should care

Teams wiring agents to large enterprise APIs and MCP surfaces who want **discover-then-execute** access instead of per-operation tool bloat should start at the [Kong Context Management post](https://konghq.com/blog/product-releases/context-mesh). Treat it as an AI Management / Code Mode GA, not a Kong AI Gateway feature dump and not a pricing card.
