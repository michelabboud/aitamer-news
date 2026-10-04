---
title: First Token and Next Token Need Separate Charts
description: A response can be slow to start or slow to continue. vLLM exposes separate metrics for those delays, making each easier to investigate.
pubDate: "2026-10-05T12:30:00Z"
specimen: 267
section: devops
tags:
  - vllm
  - latency
  - observability
  - prometheus
draft: false
heroImage: https://media.aitamer.news/heroes/first-token-and-next-token-need-separate-charts-6ca0e2c0.jpg
heroAlt: A closed water gate and a flowing channel illustrate the wait before output and the pace afterward.
author: ari
wildness:
  rating: 2
  verified: vLLM exposes separate first-token and inter-output latency histograms.
  claimed: Separate charts help narrow diagnosis; that is an operational recommendation.
verdict: Chart the wait for the first token and the gaps between later outputs separately. Use queue, phase, and workload metrics to investigate changes.
sources:
  - title: vLLM Production Metrics
    url: https://docs.vllm.ai/en/latest/usage/metrics/
  - title: vLLM Metrics Design
    url: https://docs.vllm.ai/en/latest/design/metrics/
  - title: Prometheus Histograms and Summaries
    url: https://prometheus.io/docs/practices/histograms/
---

A streaming answer has two noticeable delays. First, the reader waits for it to begin. Then, the reader waits as more text arrives. A single request latency chart blends those experiences. It can show that a request was slow, while hiding which part needs attention.

[vLLM exposes](https://docs.vllm.ai/en/latest/usage/metrics/) separate histograms for time to first token and inter-token latency. Put them on separate charts. Keep total request latency nearby for context, but use the two phase charts to decide where to investigate.

## The first chart shows the wait to begin

`vllm:time_to_first_token_seconds` records the time to the first token. This is the chart to open when a request seems to pause before any answer appears. It describes the start of a response, so a fast stream after that first token will not erase a slow start from this view. [vLLM lists it as a histogram](https://docs.vllm.ai/en/latest/usage/metrics/).

A high value does not identify one cause by itself. vLLM also exposes `vllm:request_queue_time_seconds` for time in the waiting phase and `vllm:request_prefill_time_seconds` for time in the prefill phase. Its gauges include the number of requests waiting and running. Read those alongside the first-token chart before changing capacity or model settings. A rising queue is a different lead from a long prefill phase. These are diagnostic comparisons, not a promise that any one metric explains every slow request. [The metric definitions give each measure its scope](https://docs.vllm.ai/en/latest/usage/metrics/).

## The second chart shows the gaps during output

`vllm:inter_token_latency_seconds` is the histogram to use when an answer starts promptly but arrives in uneven bursts. Its name suggests a gap between tokens. [vLLM's metric design explains](https://docs.vllm.ai/en/latest/design/metrics/) the important detail: it records the wall-clock gap between successive streamed output events. An event can contain more than one token. Treat this chart as a view of inter-output gaps, especially when output events bundle tokens.

vLLM also provides `vllm:request_time_per_output_token_seconds`. That histogram records one value for each finished request, based on the time after the first token divided by the remaining output-token count. It gives each request a different weight from the inter-output histogram. The design documentation says requests with at most one output token receive a zero value in this request-level measure. Keep that edge case in mind when comparing it with a benchmark or a chart of streamed gaps. [vLLM documents the calculation and distinction](https://docs.vllm.ai/en/latest/design/metrics/).

## Use the same view for both charts

Both primary measures are histograms measured in seconds. For a Prometheus dashboard using their classic histogram buckets, these illustrative queries plot the 95th percentile over the same five-minute window, grouped by model:

```promql
histogram_quantile(0.95, sum by (le, model_name) (rate(vllm:time_to_first_token_seconds_bucket[5m])))
```

```promql
histogram_quantile(0.95, sum by (le, model_name) (rate(vllm:inter_token_latency_seconds_bucket[5m])))
```

[Prometheus documents](https://prometheus.io/docs/practices/histograms/) this pattern: calculate a rate from histogram buckets, combine compatible buckets, then calculate the quantile. Change the percentile and window to fit the service's objective. Use the same window on both charts when comparing a period of trouble. Label them clearly: first-token latency and inter-output latency.

The two percentile lines are separate distributions. A high first-token percentile and a low inter-output percentile do not describe the same requests unless you also have request-level evidence. Histograms summarize observations across a window. They are useful for spotting a pattern; they do not reconstruct each response. [Prometheus explains how bucketed histograms estimate quantiles](https://prometheus.io/docs/practices/histograms/).

## Read the split before acting

When first-token latency rises while inter-output latency stays steady, inspect waiting requests, queue time, and prefill time. That sequence narrows the search to work before the first output. When inter-output latency rises while first-token latency stays steady, inspect the running workload and decode time. [vLLM exposes](https://docs.vllm.ai/en/latest/usage/metrics/) running-request and decode-phase metrics for that comparison.

Also look at output length and total request latency. vLLM exposes histograms for generated-token counts and end-to-end latency. A longer answer can increase total completion time even when its streamed gaps remain consistent. This is an inference from measuring output length alongside the two latency phases, so check the workload before treating a total-latency change as a serving regression. [The relevant histograms appear in vLLM's metric list](https://docs.vllm.ai/en/latest/usage/metrics/).

If the server charts look healthy while readers still report pauses, record first-output and later-output timestamps at the client or gateway. Compare those observations with the server charts. That gives you evidence about delays outside the phases reported by vLLM, without asking a server histogram to explain the whole delivery path.

## What to do

1. Scrape the vLLM server's `/metrics` endpoint and confirm that both latency histograms appear. [vLLM documents the endpoint](https://docs.vllm.ai/en/latest/usage/metrics/).
2. Put first-token and inter-output percentiles on separate, clearly named charts. Give them the same time window and model grouping.
3. Add queue time, prefill time, decode time, waiting requests, running requests, output-token counts, and total latency as supporting views. [Each is defined in the production metrics list](https://docs.vllm.ai/en/latest/usage/metrics/).
4. Check whether the histogram buckets give useful resolution around your chosen latency objective. vLLM allows custom bucket families, and its documentation warns that extra buckets increase series count and query cost. [Choose boundaries deliberately](https://docs.vllm.ai/en/latest/usage/metrics/).
5. During the next slow period, identify which chart changed first. Investigate that phase, then compare a few affected requests with timestamps from the delivery path.
