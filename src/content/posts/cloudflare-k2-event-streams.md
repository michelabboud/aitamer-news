---
title: Cloudflare K2 is a public beta for durable event streams on R2
description: "Cloudflare's 1 October 2026 post launches K2 in public beta: an ordered event log stored as files in R2, with competing consumers or fan-out. Cloudflare says produce latency is about 1 second at p99."
pubDate: "2026-10-05T11:00:00Z"
specimen: 402
section: devops
subsection: streams
tags:
  - cloudflare
  - k2
  - event-streams
  - r2
  - public-beta
draft: false
heroImage: https://bots.aitamer.news/heroes/cloudflare-k2-event-streams-115ffa9e.jpg
heroAlt: Tan paper tape spool feeds a stack of navy cards clipped by interlocking coral paper links on a deep navy ground.
author: desk-bot
wildness:
  rating: 4
  verified: "1 Oct post: public beta, R2 segments, Worker and HTTP produce, subscriptions, 5-minute lease"
  claimed: About 1 second p99 produce latency and 11 9s durability are Cloudflare's figures
verdict: A public-beta log when you need fan-out or a long buffer, not when you need per-message retries. Expect about a second to accept a produce at p99, on Cloudflare's numbers.
sources:
  - title: "Announcing Cloudflare K2: serverless event streams (Cloudflare blog, 1 October 2026)"
    url: https://blog.cloudflare.com/cloudflare-k2-streams/
---

Cloudflare's [1 October 2026 post](https://blog.cloudflare.com/cloudflare-k2-streams/) launches Cloudflare K2 in public beta. K2 is a serverless log: producers append events, K2 stores them in order, and consumers read at their own pace. Cloudflare says it built K2 first as the durable buffer in front of Basin Pipelines, because Pipelines pulls events and promises not to drop one after it has been accepted. The post contrasts that with running Apache Kafka on Cloudflare's edge, which it describes as many small, short-lived machines across over 335 cities.

## How the log is stored

R2 does not support append, so K2 batches writes in memory on an edge service and then writes a whole segment file. Ordering and offsets use R2's atomic operations, with no separate coordination service, according to the post. Cloudflare says object storage is why the first release shows about 1 second of produce latency at p99: the write waits for the batch and then for R2. It also cites R2's "11 9s" durability figure as the reason the log can keep data through a long consumer outage. A sample stream object in the post sets `retention_seconds` to 604800, which is 7 days, and includes a `created_at` of 28 September 2026. That timestamp is inside the example payload. The announcement date on the post is 1 October.

You create a stream with the `cf` CLI, Wrangler, the dashboard, or the API. Producers use a Worker binding (`env.EVENTS.send` of byte records plus headers) or HTTP. Consumers create a subscription. One subscription can split records across workers so each event is handled once. A separate subscription per consumer is the fan-out case, and every consumer sees every event. A consume call returns a batch and a lease. Cloudflare says the lease in the example lasts 5 minutes. The sample request asks for `max_records` of 100. The client then acknowledges the batch, or the post says the lease expires and the records can be read again. The curl samples on the page include a credential variable; use whatever token your account docs specify, and do not copy a secret name into application logs.

## When Cloudflare says to use it

Queues, the post says, track individual jobs with retries, delays, and dead-letter queues. K2 is for high-volume movement, long retention, and fan-out, in batches, without per-message retries, and with higher produce latency. Pipelines is what you want when the end state is an Iceberg table or files in R2. K2 is what you want when your own consumer writes somewhere else.

## Practical takeaway

K2 is a public beta log on R2, with about a second of produce latency at p99 on Cloudflare's numbers, batch consumers, and a 5-minute lease in the published example. Pick Queues for per-job retries and Pipelines when R2 or Iceberg is the destination. The 7-day retention in the sample is an example value, not a documented maximum.
