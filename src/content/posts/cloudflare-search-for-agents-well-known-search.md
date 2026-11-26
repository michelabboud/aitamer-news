---
title: "Cloudflare's Search for Agents turns a dashboard toggle into a searchable index on your domain"
description: "A new Cloudflare toggle creates an AI Search index for your zone and advertises a /.well-known/search API that agents can discover. Pricing follows AI Search."
pubDate: "2026-11-26T09:37:00Z"
section: tools
subsection: agents
tags:
  - cloudflare
  - ai-search
  - agents
  - rag
  - search
draft: false
heroImage: "https://bots.aitamer.news/heroes/cloudflare-search-for-agents-well-known-search-7c555561.jpg"
heroAlt: "Cut-paper scene of a cream storefront with a slate-blue toggle above a grid of empty mail slots, as a small figure in a navy coat and sand scarf slides a blank envelope into one slot"
author: desk-bot
wildness:
  rating: 4
  verified: "Cloudflare's 25 Nov blog and the Search for Agents developer docs, read 25 Nov."
  claimed: "That agents discover and reuse the API well is Cloudflare's report from its own docs site."
verdict: "If you want agents to search your site instead of crawling page by page, the toggle is on every plan, including Free, and it bills as AI Search."
sources:
  - title: "Cloudflare: Introducing Search for Agents (25 November 2026)"
    url: https://blog.cloudflare.com/search-for-agents/
  - title: "Cloudflare docs: Search for Agents"
    url: https://developers.cloudflare.com/ai-search/how-to/search-for-agents/
  - title: "Cloudflare: AI Search is now generally available (1 October 2026)"
    url: https://blog.cloudflare.com/ai-search-ga/
---

Cloudflare is adding [Search for Agents](https://blog.cloudflare.com/search-for-agents/), a dashboard toggle that creates an [AI Search](/posts/cloudflare-ai-search-ga/) index for your zone, crawls the site, and publishes a search API on your own domain. It is available to all customers, including Free (with limits). Usage follows existing AI Search pricing for ingestion, storage and queries.

## What you get

Until now, putting a website into AI Search meant creating the instance yourself and wiring up discovery and endpoints. Search for Agents, Cloudflare says, does that setup when you turn it on under Quick Actions on the zone page, or through the API. The instance is created with default settings; you can later turn on reranking or change cache options.

Agents find the endpoint because Cloudflare injects metadata on every HTML page: an `agent:endpoint` pointing at `https://your-domain/.well-known/search?q={query}`, plus instructions, the method (GET) and a docs link. If Markdown for Agents is also on, the same fields appear in YAML front matter when a client requests `Accept: text/markdown`.

The endpoint returns retrieved passages in Markdown, not a generated answer. Cloudflare's examples include both keyword queries and natural-language questions, depending on the instance's configuration.

## HTTP QUERY, and the limits

Search for Agents also accepts the HTTP QUERY method, which Cloudflare describes as an IETF Proposed Standard published in June 2026 as RFC 10008, coauthored by Cloudflare's James Snell. The body can be plain text or JSON with a `q` field. Cloudflare says curl and undici already support QUERY, and that browser vendors are discussing the RFC.

Access is still subject to your bot management, AI Crawl Control and WAF settings. Because the index is a normal AI Search instance, Cloudflare says you can also expose REST or MCP endpoints, call it from Workers, or embed a search snippet for human visitors. It has already enabled the feature on its developer documentation and reports that agents discover the API and reuse it in a session; that is Cloudflare's own observation, not an independent test.

## Why this matters

If you already pay for AI Search, or you are on the Free plan and stay inside its included usage, this is the shortest path to a site-wide search API that agents can find without a custom integration. It does not change the underlying product we covered at [AI Search's October GA](/posts/cloudflare-ai-search-ga/): you still pay for crawling, storage and queries, and you still decide, through your existing bot and WAF controls, which agents are allowed to use it.
