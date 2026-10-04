---
title: You Cannot Average P95s
description: Averaging latency percentiles across replicas can misstate an endpoint’s performance. Histograms let you combine observations before calculating p95.
pubDate: "2026-10-06T03:30:00Z"
specimen: 296
section: devops
tags:
  - latency
  - percentiles
  - prometheus
  - histograms
draft: false
heroImage: https://media.aitamer.news/heroes/you-cannot-average-p95s-5744db81.jpg
heroAlt: Separate latency histograms feed a misleading average beside a combined distribution.
author: ari
wildness:
  rating: 1
  verified: Prometheus rejects averaged quantiles and shows how to aggregate histograms.
  claimed: Averaging replica p95 readings misstates combined endpoint latency.
verdict: Calculate endpoint p95 from aggregated histogram data. Never present an average of replica p95 readings as the combined percentile.
sources:
  - title: Histograms and summaries | Prometheus
    url: https://prometheus.io/docs/practices/histograms/
---

## The percentile belongs to requests

A p95 latency is a request duration at or below which 95% of observed requests fall. When several replicas serve an endpoint, each replica’s p95 summarizes its own requests. The combined endpoint p95 must come from the combined requests.

[Prometheus warns](https://prometheus.io/docs/practices/histograms/) that averaging precomputed quantiles across replicas yields statistically nonsensical values. An ordinary average gives each replica’s reported p95 equal influence, regardless of how much traffic it handled. Weighting those readings by request count still cannot recover the combined latency distribution. Each p95 leaves out where the other requests fell.

## Histograms support aggregation

A histogram counts observations in latency buckets. Bucket counts can be combined across replicas before calculating a percentile. Prometheus then estimates p95 from the combined histogram with `histogram_quantile()`. The order matters: combine the histogram data first, then calculate the percentile once.

[Prometheus’s guide](https://prometheus.io/docs/practices/histograms/) distinguishes native histograms from classic histograms. For native histograms, its example sums the rates of histogram samples and passes the result to `histogram_quantile(0.95, ...)`. For classic histograms, it sums bucket rates while retaining the `le` bucket boundary label. A summary exposes a percentile calculated in the instrumented program. That percentile cannot be aggregated into a valid service-wide percentile.

Histogram percentiles are estimates. With classic histograms, the width of the bucket containing p95 limits the accuracy of the reported latency. Native histograms use a configured resolution. [Prometheus recommends](https://prometheus.io/docs/practices/histograms/) native histograms where available, and suitable classic buckets when aggregation is needed but native histograms are unavailable.

## What to do

Identify the endpoint and the replicas whose requests should count. Check whether their duration metric is a native histogram, a classic histogram, or a summary. For a histogram, filter to that endpoint, aggregate its data across replicas over the chosen time window, and calculate p95 from the result. For classic buckets, retain `le` during aggregation. If you only have summary percentiles, do not label their average as the endpoint p95. Add a histogram when you need that combined view.
