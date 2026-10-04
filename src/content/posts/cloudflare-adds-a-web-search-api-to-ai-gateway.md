---
title: Cloudflare adds a Web Search API to AI Gateway
description: Cloudflare has launched a Web Search API through AI Gateway with Ceramic.ai, Exa and Linkup. REST and Workers bindings are documented; billing depends on whether a provider key is stored.
pubDate: "2026-10-04T12:00:00Z"
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
heroAlt: A cream paper drawer sends layered index cards through a quiet blue archway, in a soft, tactile paper-cut collage.
author: quill
wildness:
  rating: 2
  verified: Cloudflare documents the endpoint, Workers binding, partners, prices and key-routing rules.
  claimed: Request-rate limits and Server Tools launch date are unstated in the reviewed pages.
verdict: Cloudflare documents a working web-search API for agents. Check provider-key routing, result fields and request-rate policy before production use.
sources:
  - title: Introducing Web Search API via AI Gateway - Cloudflare Blog
    url: https://blog.cloudflare.com/introducing-web-search-api/
  - title: How to use Web Search API - Cloudflare docs
    url: https://developers.cloudflare.com/web-search/how-to-use/
  - title: Providers - Cloudflare docs
    url: https://developers.cloudflare.com/web-search/providers/
  - title: About Web Search API - Cloudflare docs
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

The docs say `query` takes 1 to 1,024 characters, `limit` runs from 1 to 10 (default 10), and `provider` is `ceramic`, `exa` or `linkup`, with Ceramic as the default. The response holds an `items` array with a URL and title for each result, plus a `metadata` object. Fields such as description, image, favicon and last-modified date are optional and depend on the provider.

## Billing

Cloudflare says searches billed through AI Gateway credits use the provider's list API price without additional markup. Bring-your-own-key is also supported. If you set `byokAlias`, the gateway uses that stored provider key and returns a 400 error if it is missing. If you omit the alias, a stored key named `default` for that provider is used when present; otherwise the request draws down AI Gateway credits. With a stored provider key, the provider bills you directly.

The [providers page](https://developers.cloudflare.com/web-search/providers/) lists the prices per 1,000 requests: Ceramic.ai $0.25, Linkup $5.00 and Exa $7.00. It marks Ceramic.ai and Linkup as zero data retention and Exa as not. Cloudflare's about page says search requests flow through your gateway for unified observability.

## What Cloudflare does not say

The reviewed pages define query length and results-per-request limits, but publish no requests-per-minute limit or usage quota. The [about page](https://developers.cloudflare.com/web-search/about/) gives no beta or general-availability designation. The post describes native Server Tools as coming soon, without a date; today, the Web Search API can be called directly or wired into an agent tool workflow.

Cloudflare says partners must meet its verified bots requirements, which include identifying their crawlers, respecting robots.txt and providing the source of search results. The docs make no claim that results from the three providers match in quality or freshness.

## What to do

Try one provider with `limit: 5` in a test Worker and compare the results for your own queries. Since switching providers is one parameter, run the same queries against all three before you choose. Check the current request-rate policy and service status before you build production traffic on this.
