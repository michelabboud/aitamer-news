---
title: The Trace Pipeline Can Lose the Failure
description: A Collector can accept spans while its exporter falls behind. Its internal metrics show where delivery slows, where data is refused, and when loss becomes likely.
pubDate: "2026-10-05T21:30:00Z"
specimen: 284
section: devops
tags:
  - opentelemetry
  - observability
  - tracing
  - collector
  - reliability
draft: false
heroImage: https://media.aitamer.news/heroes/the-trace-pipeline-can-lose-the-failure-303898dc.jpg
heroAlt: Trace cards pass through a metrics pipeline while failure cards spill out at the end.
author: ari
wildness:
  rating: 2
  verified: Collector documentation identifies queue overflow, retry expiry, and restarts as loss paths.
  claimed: A receiver can keep accepting spans while downstream delivery falls behind.
verdict: Follow spans from acceptance through the queue to completed export. Queue growth calls for investigation; enqueue failures identify rejected data. Tune capacity and retries to the actual bottleneck.
sources:
  - title: Troubleshooting | OpenTelemetry
    url: https://opentelemetry.io/docs/collector/troubleshooting/
  - title: Internal telemetry | OpenTelemetry
    url: https://opentelemetry.io/docs/collector/internal-telemetry/
  - title: Scaling the Collector | OpenTelemetry
    url: https://opentelemetry.io/docs/collector/scaling/
  - title: Resiliency | OpenTelemetry
    url: https://opentelemetry.io/docs/collector/resiliency/
  - title: exporterhelper package | Go Packages
    url: https://pkg.go.dev/go.opentelemetry.io/collector/exporter/exporterhelper
---

A missing trace is especially costly when it belongs to the failure you need to investigate. The OpenTelemetry Collector receives, processes, and exports telemetry, but those steps do not always finish together. The Collector can accept spans while an exporter waits for a slow destination. If the delay lasts, a queue can fill and reject new data. OpenTelemetry lists an undersized Collector and an unavailable or slow exporter destination among the common causes of dropped data. [Collector troubleshooting](https://opentelemetry.io/docs/collector/troubleshooting/) explains both cases.

## Acceptance is the start of the path

The Collector exposes separate counters for spans accepted by a receiver and spans sent by an exporter. `otelcol_receiver_accepted_spans` counts spans ingested into the pipeline. `otelcol_exporter_sent_spans` counts spans successfully sent to the destination. Between those points, spans may wait in an exporter queue. A rise in accepted spans therefore establishes that data reached the Collector; it does not establish delivery to the backend. [Internal telemetry](https://opentelemetry.io/docs/collector/internal-telemetry/) defines these counters and the queue metrics.

This distinction matters during an outage. An application may continue to send traces, and the receiver may continue to accept them, while the exporter cannot keep pace. The queue can absorb a temporary delay. A growing queue also records a debt: data is arriving faster than the exporter can clear it. Watch the direction of that debt, rather than treating an active receiver as proof that traces are safe. This reading follows the queue behavior described in [Collector scaling guidance](https://opentelemetry.io/docs/collector/scaling/).

## A full queue rejects new spans

`otelcol_exporter_queue_size` shows current queue occupancy, and `otelcol_exporter_queue_capacity` shows its limit. The queue holds batches or requests, depending on its configuration. If the destination remains slow or unavailable, queued work accumulates. When the queue cannot accept more data, `otelcol_exporter_enqueue_failed_spans` counts spans that failed to enter it. Those rejected spans never reach the exporter’s retry logic. The Collector may also log `Dropping data because sending_queue is full`. These are more direct signs of a broken delivery path than queue growth alone. See [internal telemetry](https://opentelemetry.io/docs/collector/internal-telemetry/) and the [exporter helper documentation](https://pkg.go.dev/go.opentelemetry.io/collector/exporter/exporterhelper).

A larger queue can give a short outage more room, but it consumes resources and cannot make a persistently slow destination faster. OpenTelemetry’s [scaling guidance](https://opentelemetry.io/docs/collector/scaling/) says that a queue staying near capacity indicates export is slower than receipt. It also warns that adding Collectors or exporter workers can increase pressure on a backend that is already saturated. First locate the bottleneck. More capacity at the wrong hop can postpone the next rejection without clearing the cause.

## Retries and restarts create other loss paths

Queued data still needs a successful send. Exporters can retry failed attempts, subject to their retry settings. If the destination stays unavailable beyond the configured retry period, a batch can be dropped. An in-memory queue also loses its contents if its Collector instance crashes or is terminated. A persistent queue, configured with file storage, can resume pending exports after a restart, though a full or failed disk and exhausted retries remain loss risks. These cases are described in the Collector’s [resiliency guidance](https://opentelemetry.io/docs/collector/resiliency/).

`otelcol_exporter_send_failed_spans` deserves attention, but its increase alone does not prove permanent loss: retries may still succeed. By contrast, an enqueue failure identifies data that could not enter the sending queue. Treat the two counters differently when investigating an incident. The [internal telemetry guide](https://opentelemetry.io/docs/collector/internal-telemetry/) makes that distinction explicit.

## The signals locate the break

Read the Collector’s signals as a sequence. Accepted spans show what entered the pipeline. Queue size and capacity show whether export work is accumulating. Enqueue failures show that the queue could not take some spans. Send failures show trouble reaching the destination, while sent spans show completed exports. Sustained `otelcol_receiver_refused_spans` means the receiver returned errors to clients; whether those spans are lost depends on the clients’ retry behavior. If a memory limiter is configured, inspect its refusal signal for the Collector version in use; processor-specific metric names have changed across releases. OpenTelemetry documents these counters in [internal telemetry](https://opentelemetry.io/docs/collector/internal-telemetry/) and [scaling guidance](https://opentelemetry.io/docs/collector/scaling/).

Look at the Collector’s logs alongside the counters. They can report when dropping starts or stops, and the troubleshooting guide recommends logs when reception or export fails. If accepted spans stop rising, inspect the client, network path, receiver configuration, and whether the receiver is enabled in a pipeline. If the queue grows while sends stall, inspect the exporter, network path, and destination. These checks follow the [troubleshooting guide](https://opentelemetry.io/docs/collector/troubleshooting/) and [internal telemetry guide](https://opentelemetry.io/docs/collector/internal-telemetry/).

## What to do

1. Expose and monitor the Collector’s internal metrics and logs. Graph accepted and sent spans, queue size and capacity, enqueue failures, send failures, and receiver refusals for each relevant pipeline. The [internal telemetry guide](https://opentelemetry.io/docs/collector/internal-telemetry/) lists these signals.
2. Investigate a queue that keeps growing. Check destination availability and speed, exporter configuration, and network connectivity. Size the Collector for the incoming workload, then scale the component that is actually constrained. Follow the [troubleshooting](https://opentelemetry.io/docs/collector/troubleshooting/) and [scaling](https://opentelemetry.io/docs/collector/scaling/) guidance.
3. Configure a sending queue and retries for remote exporters. Choose queue capacity and retry limits against expected volume, available resources, and tolerable destination downtime. For critical paths that must survive Collector restarts, consider persistent file storage and monitor its disk. The [resiliency guide](https://opentelemetry.io/docs/collector/resiliency/) describes these choices.
4. After a change, confirm that the queue drains, enqueue failures stop increasing, and successful sends resume. Those observations test the delivery path described by the [Collector’s internal metrics](https://opentelemetry.io/docs/collector/internal-telemetry/).
