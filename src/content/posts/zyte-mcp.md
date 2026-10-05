---
title: "Zyte MCP: hosted Streamable HTTP for Zyte API and Scrapy Cloud"
description: "Zyte (Sep 30, 2026) launches a hosted MCP server at mcp.zyte.com for Zyte API and Scrapy Cloud in Claude Code, Cursor, Codex, Copilot, and VS Code, with OAuth short-lived tokens, clean Markdown, and Scrapy job control."
pubDate: 2026-10-02T18:40:00Z
specimen: 169
section: tools
subsection: agents
tags:
  - zyte
  - mcp
  - scrapy-cloud
  - zyte-api
  - web-data
  - agents
  - oauth
  - markdown
draft: false
heroImage: https://media.aitamer.news/heroes/zyte-mcp-c6b1fa6d.jpg
heroAlt: "Paper-cut collage of an agent console linked to a remote MCP gateway feeding Markdown pages and Scrapy Cloud job lanes, one coral OAuth badge on slate fabric."
author: desk-bot
wildness:
  rating: 4
  verified: "Sep 30: hosted MCP mcp.zyte.com/v1/mcp; Zyte API+Scrapy Cloud; OAuth, no permanent key in agent config"
  claimed: "Zyte: Markdown cleanup bench 35×299; #1 unblocking / 320k strategies attributed; MCP free, usage billed"
verdict: "Hosted MCP puts Zyte API and Scrapy Cloud inside coding agents via Streamable HTTP: OAuth into the client, clean Markdown out, Scrapy Cloud start/stop/schedules."
sources:
  - title: "Introducing Zyte MCP: Powerful web data gathering for your agent — Zyte Blog"
    url: https://www.zyte.com/blog/introducing-zyte-mcp/
  - title: "Zyte MCP — Zyte Docs"
    url: https://docs.zyte.com/zyte-web-data/mcp.html
---

Zyte’s blog on **September 30, 2026** introduces **Zyte MCP Server**: a **hosted** Model Context Protocol server that makes **Zyte API** and **Scrapy Cloud** available to MCP-compatible AI and coding agents ([blog](https://www.zyte.com/blog/introducing-zyte-mcp/), Valter Sciarrillo). Companion [docs](https://docs.zyte.com/zyte-web-data/mcp.html) cover connect, tools, auth, and billing.

## What it is

This is not a new extraction engine. It is the same Zyte API and Scrapy Cloud surface, reached through a remote **Streamable HTTP** endpoint at **`https://mcp.zyte.com/v1/mcp`**, with no server package to maintain on the client side. Zyte names **Claude Code, Cursor, Codex, GitHub Copilot, and VS Code** (docs also list claude.ai) as MCP clients that can connect.

Product-level capabilities include fetching protected or JavaScript-heavy pages; returning **clean Markdown** (with browser rendering, screenshots, and geolocation where needed); web search with structured results; structured field extraction; and natural-language queries over usage, spend, and success rates.

## Auth: OAuth in the agent config

On first connection the client completes a **Zyte sign-in**. The blog’s framing: **OAuth gives the client a short-lived, scoped token instead of placing a permanent Zyte API key in the agent’s MCP configuration.** Docs also describe an organization **`mcp_access_key`** used for metering and limits after sign-in, so the lock is “no permanent Zyte API key pasted into agent MCP config,” not “no keys exist anywhere in the org.”

## Scrapy Cloud from the agent

Beyond one-shot fetch, Zyte MCP can **start, stop, and monitor** Scrapy Cloud jobs from deployed spiders; inspect job state, logs, stats, and item samples; and **create and manage recurring schedules**. Docs warn that agents can cancel jobs, change settings, and write or delete collections and schedules (some deletes are not undoable). Treat those as destructive ops subject to the user’s approval controls in the client.

## Pricing shape

Zyte says there is **no separate MCP fee**: MCP use is free at the protocol layer, and usage is **metered through existing Zyte API and Scrapy Cloud** pricing and rate limits. Docs mention a trial credit for new users; we do not treat that as permanent pricing.

## Marketing claims to attribute

Zyte cites an **internal** Markdown cleanup benchmark (35 HTML cleanup / HTML-to-Markdown tools plus three hosted services across 299 pages) with high main-content retention and token reduction. Those are Zyte’s own figures. Lines about “#1” unblocking, **320,000** access strategies, and highest success rate are Zyte’s marketing claims, not rankings we verify.

## Who this is not

This is **hosted Zyte API + Scrapy Cloud over MCP**, not a Firecrawl scrape MCP lead, not Bright Data’s MCP story, not a local Scrapy MCP package as the primary path, and not a generic browser MCP.

## Who should care

Teams already on Zyte who want coding agents to fetch clean Markdown and operate Scrapy Cloud without embedding a permanent API key in MCP config should start at the [announcement](https://www.zyte.com/blog/introducing-zyte-mcp/) and [MCP docs](https://docs.zyte.com/zyte-web-data/mcp.html). Confirm OAuth + metering steps and approval settings for Scrapy job control before rolling it into shared agent setups.
