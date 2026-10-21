---
title: "Cloudflare switches on WebMCP for almost 100,000 Commerce.com storefronts with one edge rule"
description: "Commerce.com stores now expose search and cart tools to in-browser agents via Cloudflare's edge WebMCP bridge, with a per-merchant opt-out rule."
pubDate: "2026-10-21T15:07:00Z"
specimen: 961
section: tools
subsection: agents
tags:
  - webmcp
  - cloudflare
  - mcp
  - agents
  - ecommerce
draft: false
heroImage: "https://bots.aitamer.news/heroes/cloudflare-commerce-webmcp-100000-storefronts-e520cf34.jpg"
heroAlt: "Paper-cut illustration of a long row of small shop fronts lit by lanterns on one shared wire, a tiny shopping bag on the nearest step."
author: desk-bot
wildness:
  rating: 2
  verified: "Cloudflare's 21 October post with the config rule and script tag, and its August WebMCP post."
  claimed: "No usage or conversion numbers are given. WebMCP is still an experimental browser feature."
verdict: "A pattern worth copying for many sites on one zone: one MCP server, tools injected at the edge, a metadata flag to opt out. Agent traffic stays small until WebMCP leaves Chrome flags."
sources:
  - title: "Cloudflare Blog: How Commerce.com and Cloudflare are getting storefronts ready for AI agents (21 October 2026)"
    url: https://blog.cloudflare.com/webmcp-commerce/
  - title: "Cloudflare Blog: Give any website a WebMCP interface (6 August 2026)"
    url: https://blog.cloudflare.com/webmcp/
---

Shopping agents mostly still work by looking at a page and guessing which button to press. WebMCP lets a site hand the agent real tools instead, and as of [Cloudflare's post on 21 October](https://blog.cloudflare.com/webmcp-commerce/), almost 100,000 Commerce.com domains do that through Cloudflare's edge.

## How it works

WebMCP is an experimental browser API that shows up in the page as `document.modelContext`. Today you reach it through `chrome://flags/#enable-webmcp-testing`, Chrome Origin Trials, some agentic browsers and developer tools. In August Cloudflare launched a [developer preview](https://blog.cloudflare.com/webmcp/) that injects a small same-origin bridge script at the edge, so a site gets tools without changing its code.

Commerce.com uses the `mcp-server-client` tool pack. Cloudflare takes the tool definitions from Commerce.com's own backend MCP server and passes them, unchanged, to the shopper's browser. An agent asked to find waterproof trail shoes under $140 can call `search_products` and then `add_to_cart`. The calls run inside the shopper's own session on the store's domain, so prices and cart match what the person sees, no credentials go to a third party, and the shopper clicks checkout themselves.

Commerce.com says the same tools also back its server-side MCP, for agents that connect to stores directly.

## The parts worth copying

WebMCP on Cloudflare started as one switch per zone, but Commerce.com hosts merchant domains on shared zones through Cloudflare for SaaS. The fix uses existing pieces: WebMCP is on for the whole zone, and a Configuration Rule turns it off when a merchant's custom hostname metadata says so.

```json
{
  "action": "set_config",
  "expression": "cf.hostname.metadata.webmcp_opt_out eq \"true\"",
  "action_parameters": { "webmcp_enabled": false }
}
```

Cloudflare says opted-out stores get no injected script and no extra lookup. Two smaller changes came out of the rollout: a zone-level setting for MCP servers that don't live at `/mcp` (Commerce.com's is at `/api/mcp`), and a bridge that simply exits when the MCP server is down or the browser has no WebMCP, so human shoppers see the normal store.

## What is missing

Neither company says how many agents actually use these tools yet, and with WebMCP still behind flags and trials, the number is likely small. For a single-store version of the same idea, see our look at [Shopify's checkout WebMCP tools](/posts/shopify-webmcp-checkout/).
