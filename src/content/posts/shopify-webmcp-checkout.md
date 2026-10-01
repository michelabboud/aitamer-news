---
title: "Shopify Checkout WebMCP: browser agents can get, update, and complete checkout"
description: "Shopify (Sep 28, 2026): Checkout WebMCP tools let browser agents get, update, and complete eligible checkouts after buyer confirmation—no new card entry via tools; Web Bot Auth for verified bots."
pubDate: 2026-10-01T18:20:00Z
specimen: 124
section: tools
subsection: cli
tags:
  - shopify
  - webmcp
  - checkout
  - shop-pay
  - agents
  - agentic-commerce
  - web-bot-auth
  - mcp
  - tools
draft: false
heroImage: /heroes/shopify-webmcp-checkout.jpg
heroAlt: "Paper-cut collage of a browser checkout panel with tool ribbons linking cart cubes to a confirmed order shelf."
author: desk-bot
wildness:
  rating: 5
  verified: "Checkout WebMCP Sep 28 2026; four tools; buyer confirm before complete; eligible only; no new cards; WBA"
  claimed: "No merchant count or all-stores GA in Shopify primaries; Chromium agent support as storefront docs state"
verdict: "Browser agents get structured Shopify checkout tools on eligible sessions—place-order only after the buyer confirms; Shop Pay saved/approvals, not new card entry via tools."
sources:
  - title: "WebMCP support for checkout — Shopify.dev Changelog"
    url: https://shopify.dev/changelog/posts/webmcp-support-for-checkout
  - title: "Checkout WebMCP — Shopify.dev"
    url: https://shopify.dev/docs/agents/carts-and-checkout/checkout-webmcp
  - title: "Carts and checkout (agents) — Shopify.dev"
    url: https://shopify.dev/docs/agents/carts-and-checkout
---

Shopify shipped **Checkout WebMCP** on **2026-09-28**: browser agents can now read and update Shopify checkouts with structured tools through order confirmation, instead of scraping the page ([changelog](https://shopify.dev/changelog/posts/webmcp-support-for-checkout); [docs](https://shopify.dev/docs/agents/carts-and-checkout/checkout-webmcp)).

This is **merchant-side Shopify checkout** in the buyer’s browser—not a Cloudflare browser WebMCP surface, and not a Meta personal-agent Shopify connector story.

## The four tools

| Tool | Role (as Shopify states) |
| --- | --- |
| **`get_checkout`** | Read current checkout state, messages, and post-completion order details on the Thank you page |
| **`update_checkout`** | Replace supported fields (buyer contact, fulfillment, discounts, declared fields, payment); **PUT** semantics; ignores `line_items` and `attribution` (buyers still change items on the page) |
| **`complete_checkout`** | Place the order **after the buyer confirms** |
| **`navigate_to_storefront`** | Leave checkout / return to the storefront (registered only when the store has an online storefront) |

The tools run inside checkout-web and use the same state as the checkout UI. Shopify says they do not expose a new API or require merchant configuration—still limited to **eligible** checkouts below ([changelog](https://shopify.dev/changelog/posts/webmcp-support-for-checkout)).

## Buyer confirmation before place-order

Before calling **`complete_checkout`**, the agent must show the buyer the current order and total and get permission to place it. **Web Bot Auth (WBA), a Shop Pay approval, and `ready_for_complete` do not grant that permission.** If the total changes, ask again ([docs](https://shopify.dev/docs/agents/carts-and-checkout/checkout-webmcp)).

Shopify also expects page handoff for Shop Pay login, payment challenges (for example 3D Secure), blocking UI extensions, and configured review steps—the agent does not bypass those flows.

## Eligible checkouts only

Tools register on **eligible** checkouts. Shopify does **not** register them for:

- Standard **three-page checkout**, unless the buyer checks out with **Shop Pay**
- **B2B** checkout
- **Embedded** checkout and **mobile checkout SDKs**
- Merchandise from **another shop**
- **Draft orders**, **order edits**, and **payment collection**

Shopify has not published a merchant count or an “all stores” GA claim—stick to eligible checkouts as documented ([eligibility](https://shopify.dev/docs/agents/carts-and-checkout#checkout-webmcp-tools)).

## Payments and Web Bot Auth

**Checkout WebMCP does not accept new card details.** Allowed instrument paths via tools: a **saved Shop Pay card** (by `id` from `get_checkout`), a **Shop Pay approval**, or **billing address only**. Any other method stays on the checkout page ([docs](https://shopify.dev/docs/agents/carts-and-checkout/checkout-webmcp)).

**Web Bot Auth (WBA)** signs browser requests (not tool arguments). Shopify uses WBA to identify the agent; without it, bot detection may deprioritize or block requests. Only **registered** WBA keys verify.

For context, Shopify also documents hosted **Checkout MCP** (server-side JSON-RPC) alongside browser WebMCP—same checkout object family, different transport ([carts and checkout](https://shopify.dev/docs/agents/carts-and-checkout)).

## Who should care

Teams building browser shopping agents on Shopify should start at the [changelog](https://shopify.dev/changelog/posts/webmcp-support-for-checkout) and [Checkout WebMCP guide](https://shopify.dev/docs/agents/carts-and-checkout/checkout-webmcp)—lead with the four tools, keep **buyer confirmation** and **eligible checkouts** explicit, and treat **no new card entry** plus **WBA** as first-class constraints.
