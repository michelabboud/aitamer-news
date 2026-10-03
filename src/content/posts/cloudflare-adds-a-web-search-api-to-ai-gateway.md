---
title: "Cloudflare adds a Web Search API to AI Gateway"
description: "Cloudflare says AI Gateway now offers web search for agents through Ceramic.ai, Exa and Linkup. You call it over REST or from Workers with env.AI.websearch(), and it bills against AI Gateway credit."
pubDate: "2026-10-04T09:30:00Z"
specimen: 220
section: devops
tags:
  - cloudflare
  - ai-gateway
  - web-search
  - workers
  - agents
draft: false
heroImage: https://media.aitamer.news/heroes/cloudflare-adds-a-web-search-api-to-ai-gateway-b70d3d6c.jpg
heroAlt: "A cream paper drawer sends layered index cards through a quiet blue archway, in a soft, tactile paper-cut collage."
author: quill
wildness:
  rating: 2
  verified: "Endpoint, Workers binding, three partners and per-provider list prices appear in Cloudflare's post and docs"
  claimed: "No rate limits, quotas, availability status or Server Tools date given; provider prices are the providers' own"
verdict: "A real, documented way to give agents web search through one gateway. Check the rate limits and availability, which Cloudflare does not state, before you depend on it."
sources:
  - title: "Introducing Web Search API via AI Gateway - Cloudflare Blog"
    url: https://blog.cloudflare.com/introducing-web-search-api/
  - title: "How to use Web Search API - Cloudflare docs"
    url: https://developers.cloudflare.com/web-search/how-to-use/
  - title: "Providers - Cloudflare docs"
    url: https://developers.cloudflare.com/web-search/providers/
  - title: "About Web Search API - Cloudflare docs"
    url: https://developers.cloudflare.com/web-search/about/
---

Cloudflare announced a Web Search API in AI Gateway on October 2, 2026. According to [Cloudflare's post](https://blog.cloudflare.com/introducing-web-search-api/), it gives agents native web search through three partners: Ceramic.ai, Exa and Linkup.

## How you call it

Cloudflare documents a REST endpoint:

`POST https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/websearch/`

The [docs](https://developers.cloudflare.com/web-search/how-to-use/) say the API token needs Workers AI Read and AI Gateway Read permissions. From a Worker, the post shows this binding:

```ts
const response = await env.AI.websearch({
  gatewayId: "default",
  query: "your question",
  provider: "exa",
  limit: 5,
})
```

The docs say `query` takes 1 to 1,024 characters, `limit` runs from 1 to 10 (default 10), and `provider` is `ceramic`, `exa` or `linkup`, with Ceramic as the default. The response holds an `items` array of url, title and description, plus a `metadata` object.

## Billing

Cloudflare says searches draw down your AI Gateway credit balance, and that you pay each provider's list price with no additional markup. Bring-your-own-key is supported through a `byokAlias` field. The docs say a request that names an alias fails if that key is not configured. With your own key, the docs say the provider bills you directly.

The [providers page](https://developers.cloudflare.com/web-search/providers/) lists the prices per 1,000 requests: Ceramic.ai $0.25, Linkup $5.00 and Exa $7.00. It marks Ceramic.ai and Linkup as zero data retention and Exa as not. Cloudflare's about page says search requests flow through your gateway for unified observability.

## What Cloudflare does not say

The post and docs give no rate limits or usage quotas. They give no general availability date, and the [about page](https://developers.cloudflare.com/web-search/about/) states no beta or availability status. The post says Cloudflare is building native Server Tools into AI Gateway and gives no date.

Cloudflare says partners must meet its verified bots requirements, which include identifying their crawlers, respecting robots.txt and providing the source of search results. The docs make no claim that results from the three providers match in quality or freshness.

## What to do

Try one provider with `limit: 5` in a test Worker and compare the results for your own queries. Since switching providers is one parameter, run the same queries against all three before you choose. Ask Cloudflare or watch the docs for rate limits and availability before you build production traffic on this.
