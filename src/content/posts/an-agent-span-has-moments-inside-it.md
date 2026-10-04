---
title: An Agent Span Has Moments Inside It
description: A lasting agent operation has a start and an end. Named, timestamped events show when approvals, state changes, and failures occurred along the way.
pubDate: "2026-10-05T05:30:00Z"
specimen: 253
section: devops
tags:
  - observability
  - opentelemetry
  - tracing
  - events
draft: false
heroImage: https://media.aitamer.news/heroes/an-agent-span-has-moments-inside-it-bd3d9921.jpg
heroAlt: A winding journey has markers for checks, gears, warnings and completion between start and finish.
author: ari
wildness:
  rating: 2
  verified: OpenTelemetry defines spans as operations and events as timestamped occurrences.
  claimed: A linked event timeline can make approval waits and failure sequences easier to inspect.
verdict: Use a span for the bounded operation and trace-correlated events for its significant moments. Give work with its own duration a child span.
sources:
  - title: Tracing API | OpenTelemetry
    url: https://opentelemetry.io/docs/specs/otel/trace/api/
  - title: Semantic conventions for events | OpenTelemetry
    url: https://opentelemetry.io/docs/specs/semconv/general/events/
  - title: Deprecating Span Events API | OpenTelemetry
    url: https://opentelemetry.io/blog/2026/deprecating-span-events/
  - title: Logs Data Model | OpenTelemetry
    url: https://opentelemetry.io/docs/specs/otel/logs/data-model/
---

## The span holds the operation

Consider an agent carrying out one bounded operation. It starts work, waits for an approval, resumes, and reaches an outcome. Model that operation as a span. In [OpenTelemetry’s tracing model](https://opentelemetry.io/docs/specs/otel/trace/api/), a span represents one operation and has start and end timestamps. Its name should describe the kind of work, while attributes can describe the operation as a whole.

That span answers how long the operation lasted. It cannot, by itself, show when the approval arrived or which state change preceded a failure. Those are moments within the operation.

## Events mark the moments

[OpenTelemetry’s event conventions](https://opentelemetry.io/docs/specs/semconv/general/events/) describe events as named occurrences at meaningful points in time. Checkpoints, state changes, and outcomes within a longer operation fit this model. For the example operation, useful event names might identify an approval request, an approval decision, a transition to execution, and a failed step. These are illustrative names, not prescribed OpenTelemetry conventions.

Record each event at the time the occurrence happened. Give it attributes that describe that occurrence, such as the decision or the type of failure. Keep changing identifiers in attributes rather than embedding them in event names. The event conventions also recommend `error.type` for events that represent failures.

If a step has its own duration and meaningful boundary, give that step a child span. An approval decision is a point in time; the work performed after it may deserve a child span. The distinction keeps the timeline readable: spans show elapsed work, while events locate significant moments. [The tracing specification](https://opentelemetry.io/docs/specs/otel/trace/api/) allows child spans to represent suboperations.

## Keep the moments connected

For new instrumentation, OpenTelemetry [recommends named, log-based events](https://opentelemetry.io/blog/2026/deprecating-span-events/) correlated with the current span. It is phasing out the older API for adding events directly to spans. The [log and event data model](https://opentelemetry.io/docs/specs/otel/logs/data-model/) includes an occurrence timestamp, event name, trace ID, and span ID. Those fields let a reader connect each moment to the operation it explains.

## What to do

1. Choose one operation with a clear start and end, and give its span a stable name.
2. List the approvals, state changes, and failures that need their own timestamps. Define names and useful attributes for those events.
3. Emit new events through the logging path with trace context, then check that your trace view connects them to the operation.
