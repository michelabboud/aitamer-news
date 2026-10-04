---
title: A User ID Is an Expensive Metric Label
description: A user ID on a Prometheus metric creates series across other label dimensions. Here is how that affects storage and queries, and how to keep useful operational detail.
pubDate: "2026-10-05T04:30:00Z"
specimen: 251
section: devops
tags:
  - prometheus
  - metrics
  - cardinality
  - observability
draft: false
heroImage: https://media.aitamer.news/heroes/a-user-id-is-an-expensive-metric-label-2bee5b46.jpg
heroAlt: One person-shaped tag multiplies into rows of tiny tags across several metrics beside a rising gauge.
author: ari
wildness:
  rating: 2
  verified: Prometheus documents the resource costs of each labelset and warns against user IDs.
  claimed: User IDs multiply request series across other observed label dimensions.
verdict: Keep identity out of general request metrics. Measure bounded operational categories and use event records for user-specific investigation.
sources:
  - title: Prometheus data model
    url: https://prometheus.io/docs/concepts/data_model/
  - title: The Zen of Prometheus
    url: https://prometheus.io/docs/practices/the_zen/
  - title: Metric and label naming
    url: https://prometheus.io/docs/practices/naming/
  - title: Instrumentation
    url: https://prometheus.io/docs/practices/instrumentation/
  - title: Storage
    url: https://prometheus.io/docs/prometheus/latest/storage/
  - title: Querying basics
    url: https://prometheus.io/docs/prometheus/latest/querying/basics/
  - title: Prometheus server options
    url: https://prometheus.io/docs/prometheus/latest/command-line/prometheus/
  - title: Prometheus HTTP API
    url: https://prometheus.io/docs/prometheus/latest/querying/api/
  - title: promtool reference
    url: https://prometheus.io/docs/prometheus/latest/command-line/promtool/
---

A user ID looks like a useful label on a request counter. It promises a direct answer when someone asks which account saw errors. In Prometheus, that choice changes the shape of the data. A time series is identified by its metric name and complete set of labels. Change a label value and Prometheus sees another series. The [data model](https://prometheus.io/docs/concepts/data_model/) makes that rule explicit.

## Each user adds combinations

Consider a counter split by route, method, and outcome. Those labels let an operator ask whether a route or method is seeing errors. Add `user_id`, and every distinct user who reaches a given combination creates another series for that metric. The total is the number of combinations actually observed. The possible total grows with the distinct values in each dimension. Labels multiply across dimensions, as the [Prometheus guidance](https://prometheus.io/docs/practices/the_zen/) warns.

This is why a single new label can have a large effect without changing request traffic. A service may already have several dimensions and several scrape targets. A user who moves through routes can create series under each route. New users create more values over time. Prometheus advises against high-cardinality labels such as user IDs and email addresses because every unique label combination increases stored data. Its [naming guide](https://prometheus.io/docs/practices/naming/) says so directly.

The [instrumentation guide](https://prometheus.io/docs/practices/instrumentation/) gives a concrete scale example. Filesystem metrics across 10,000 nodes are manageable in its scenario. Adding per-user quota with 10,000 users and 10,000 nodes pushes the example into tens of millions of series. The guide uses that scenario to illustrate multiplication, without setting a universal capacity limit. A dimension that seems modest alone can become expensive alongside the dimensions already present.

## The cost reaches storage

Each labelset has RAM, CPU, disk, and network costs, according to the [instrumentation guide](https://prometheus.io/docs/practices/instrumentation/). Prometheus stores samples in chunks and keeps an index that maps metric names and labels to series. It also keeps incoming data in memory with a write-ahead log for recovery. More series mean more entries for that storage path to track. The [storage documentation](https://prometheus.io/docs/prometheus/latest/storage/) explains that layout and recommends reducing the number of scraped series when lowering ingestion volume.

A longer scrape interval can reduce samples, but it does not remove the extra label combinations. Retention settings can shorten how long old blocks remain, but they do not make the live series free. Those are deductions from the series model and storage layout, and they matter when someone tries to solve a label problem only by tuning storage. The first design question is whether each user's identity belongs in a metric at all. The [Prometheus data model](https://prometheus.io/docs/concepts/data_model/) and [storage guide](https://prometheus.io/docs/prometheus/latest/storage/) describe the pieces behind that choice.

## Queries pay for the same detail

A metric name by itself selects all series with that name. A range query evaluates an expression at repeated steps, according to the [query language guide](https://prometheus.io/docs/prometheus/latest/querying/basics/). A dashboard that asks for an overall request rate still has to handle the selected per-user series before producing a grouped result. Prometheus also has limits on query time, concurrency, and samples loaded into memory; exceeding the sample limit makes a query fail. Those limits are documented in the [server options](https://prometheus.io/docs/prometheus/latest/command-line/prometheus/).

A per-user label may look attractive for a rare investigation. Every ordinary dashboard and alert using the same metric inherits the larger series set. Aggregating away `user_id` in a query changes the output, yet it does not undo the series created at ingestion. That follows from how [selectors](https://prometheus.io/docs/prometheus/latest/querying/basics/) read series and how the [data model](https://prometheus.io/docs/concepts/data_model/) identifies them.

## Keep the useful dimensions

Choose labels that describe bounded operational categories: a route template, request method, outcome, or service component. Keep the categories tied to a monitoring question. The [Prometheus naming guide](https://prometheus.io/docs/practices/naming/) uses operations and processing stages as examples of useful dimensions. Its warning about user IDs draws the boundary for open-ended values.

For a question about a particular user, send the identifying detail to an event record or another processing system suited to that analysis. Keep a counter for broad error categories so the monitoring system can show whether the problem is spreading. The [instrumentation guide](https://prometheus.io/docs/practices/instrumentation/) recommends counters alongside logs and points to general-purpose processing systems when a metric's cardinality can grow too large. Access and retention for identifying records still need deliberate design.

## What to do

Review new metric labels before adding them. Write down each label's possible values and whether the set can grow with users, requests, or other unbounded identifiers. Count combinations across the labels and targets that can actually occur. If a label is an individual ID, remove it from the metric design and keep the aggregate dimensions needed for alerts. The [Prometheus guidance](https://prometheus.io/docs/practices/instrumentation/) recommends starting without labels when uncertain, then adding them for concrete use cases.

For existing metrics, inspect series counts by metric and distinct values by label through the [TSDB status API](https://prometheus.io/docs/prometheus/latest/querying/api/). Use `promtool tsdb analyze` for churn and label-pair cardinality in stored data, as the [promtool reference](https://prometheus.io/docs/prometheus/latest/command-line/promtool/) describes. Compare those observations with the operational questions the metric must answer. Remove identity dimensions at the instrumentation source, then verify that the remaining route, method, and outcome views still support the dashboards and alerts.
