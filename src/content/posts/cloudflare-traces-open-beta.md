---
title: Cloudflare Traces follows one request across the platform, in open beta
description: "Cloudflare's 2 October 2026 post opens Cloudflare Traces in beta: one OpenTelemetry timeline for supported security, cache, routing, Worker, and origin steps, exported over OTLP. New ingest pricing starts 1 December."
pubDate: "2026-10-05T11:30:00Z"
section: devops
subsection: observability
tags:
  - cloudflare
  - opentelemetry
  - tracing
  - open-beta
draft: false
heroImage: https://bots.aitamer.news/heroes/cloudflare-traces-open-beta-841edf6b.jpg
heroAlt: Wavy blue-gray paper ribbon with five arched gates on ivory ground, marked by one small rusty-red paper stitch.
author: desk-bot
wildness:
  rating: 4
  verified: "2 Oct post: open beta, sampling, Trace Rules, traceparent, OTLP, pricing change on 1 Dec 2026"
  claimed: The 527 ms example is an illustration in the post, and the MCP query path is Cloudflare's description
verdict: Turn on sampling before you turn on every request. The December bill is based on ingest and retention, and several Cloudflare products are still on the roadmap.
sources:
  - title: Introducing Cloudflare Traces (Cloudflare blog, 2 October 2026)
    url: https://blog.cloudflare.com/cloudflare-tracing/
---

Cloudflare's [2 October 2026 post](https://blog.cloudflare.com/cloudflare-tracing/) introduces Cloudflare Traces in open beta. It extends the automatic tracing Cloudflare already offered for Workers so a single request timeline can include supported security rules, transformations, cache decisions, routing, Worker execution, and origin handling. You can then continue that trace into services on Cloudflare or elsewhere. The post is explicit that this does not yet cover every product: later spans for DDoS rules, Access, Workflows, Queues, and Pipelines are listed as future work.

## What you turn on

Once tracing is enabled for a domain, Cloudflare says it writes the spans without extra instrumentation in your application. You set a baseline sample rate. The post's example is 1% in normal operation. Trace Rules, written in the same rules language as other Cloudflare rules, can raise that to 100% for a hostname, a source IP, a header, a path, a method, or a geography while everyone else stays at the baseline. A span for a custom or managed rule includes how long evaluation took and the action. A transform span can name the request component and the rule. Nested cache, upstream, and origin spans show where the time went. One illustration in the post is a cache miss that spent 527 ms of a 539 ms request at the origin. That pair of numbers is the post's example, not a published benchmark.

## Joining traces you already have

Cloudflare says it will accept an incoming W3C `traceparent` so its spans join a trace that started before the request, subject to an incoming propagation policy. It can also send a new `traceparent` to your origin. Export is OTLP to an account-level destination, and you choose which domains use it. The post says an Observability MCP server can query traces through Cloudflare's SQL API so a coding agent can compare a failed trace with a successful one. That is Cloudflare's description of the MCP server.

## Pricing date

Traces will use the unified Cloudflare Observability price: you pay for how much data you ingest and how long you keep it, not for a count of spans. Cloudflare says the new price applies to Cloudflare Tracing and to Workers Tracing starting 1 December 2026. Until then, the post does not quote a dollar rate.

## Practical takeaway

Enable it on one domain, start with a low sample, and add a Trace Rule when you are chasing a single customer or a debug header. Point the OTLP destination at the same backend as the rest of your spans if you want one trace view. Plan on the December pricing change for both this beta and existing Workers traces, and do not assume every Cloudflare product is already a span.
