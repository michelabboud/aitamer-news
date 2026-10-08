---
title: A Counter Reset Changes How a Monitoring Query Reads the Line
description: A restarted voice worker can make a cumulative request counter fall. Use Prometheus rate on each series before summing replicas, and keep gauges for values that fall normally.
pubDate: "2026-10-09T19:00:00Z"
section: devops
tags:
  - prometheus
  - promql
  - metrics
  - voice-applications
draft: false
heroImage: https://media.aitamer.news/heroes/a-counter-reset-changes-how-a-monitoring-query-reads-the-line-69c357aa.jpg
heroAlt: Two rising paper staircase ribbons remain separate, one restarting low beside a cream collecting trough.
author: ari
wildness:
  rating: 1
  verified: rate adjusts counter resets per series; Prometheus recommends rate before sum.
  claimed: The two-replica values are illustrative, not observed production data.
verdict: Apply rate to each voice worker counter before summing replicas; use gauges for live values that can fall normally.
sources:
  - title: "Prometheus query functions: rate and resets"
    url: https://prometheus.io/docs/prometheus/latest/querying/functions/#rate
  - title: Prometheus metric types
    url: https://prometheus.io/docs/concepts/metric_types/
  - title: "Prometheus query functions: resets"
    url: https://prometheus.io/docs/prometheus/latest/querying/functions/#resets
---

A voice API has two replicas. At one scrape, their completed-transcription counters read 120 and 80. One replica restarts; at the next scrape its counter reads 5, while the other reads 90. A dashboard that simply subtracts the combined values sees a fall from 200 to 95, even though requests continued to complete.

A [Prometheus counter](https://prometheus.io/docs/concepts/metric_types/) represents a cumulative value that increases until it resets. A gauge represents a value that can move in either direction, such as the number of active transcription sessions. The distinction tells you which query function to choose. Prometheus treats ordinary floating-point series as untyped; functions such as `rate()` and `resets()` interpret decreases as counter resets. Applying a counter function to active sessions would mistake ordinary departures for resets.

Prometheus's [`rate()` function](https://prometheus.io/docs/prometheus/latest/querying/functions/#rate) estimates the average per-second increase over a range and adjusts for counter resets within each input series. It also extrapolates toward the window boundaries to handle scrape timing and missed scrapes. For a request counter exposed by each replica, a useful service-level query is:

```promql
sum by (job) (rate(voice_transcriptions_completed_total[5m]))
```

The order matters. `rate()` sees each replica's samples and can identify its reset; `sum` then combines the resulting rates. If raw replica counters are combined first, a reset in one can be hidden by growth in another, or the combined fall can be mistaken for a reset of the whole service. Prometheus explicitly recommends calculating `rate()` before aggregation for this reason. The expression reports a rate, so its unit here is completed transcriptions per second, averaged over the selected window. It does not reconstruct an exact count of every completion between scrapes.

When an alert looks implausible after a rollout, inspect the per-replica counter lines and use `resets(voice_transcriptions_completed_total[5m])` to see which series decreased in that window. The [function documentation](https://prometheus.io/docs/prometheus/latest/querying/functions/#resets) counts a decrease between consecutive float samples as a reset. Keep active-session gauges on their own panels, and review alert windows against expected scrape frequency and traffic. Query order is part of the monitoring design, especially when voice workers restart independently.
