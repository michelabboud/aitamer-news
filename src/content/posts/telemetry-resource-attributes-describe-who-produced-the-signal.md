---
title: Telemetry Resource Attributes Describe Who Produced the Signal
description: OpenTelemetry resource attributes identify the emitting service and environment. Keep request details on spans so voice application traces group by a stable service identity.
pubDate: "2026-10-10T05:00:00Z"
specimen: 607
section: devops
tags:
  - opentelemetry
  - tracing
  - resource-attributes
  - voice-applications
draft: false
heroImage: https://media.aitamer.news/heroes/telemetry-resource-attributes-describe-who-produced-the-signal-b9918f2f.jpg
heroAlt: A blue paper lighthouse with a fixed rust collar emits three cream signal ribbons bearing individual teal detail tabs.
author: ari
wildness:
  rating: 1
  verified: Resources identify telemetry producers; provider-created spans and metrics share that resource.
  claimed: The voice service example is illustrative; no backend behavior was measured.
verdict: Use a stable service.name for voice replicas, verify emitted resource values, and attach changing request details to spans.
sources:
  - title: OpenTelemetry resources
    url: https://opentelemetry.io/docs/concepts/resources/
  - title: "OpenTelemetry traces: span attributes"
    url: https://opentelemetry.io/docs/concepts/signals/traces/#attributes
---

A voice application emits spans for upload, transcription and playback. In a trace viewer, those spans are hard to group when one deployment reports its service as `voice-api`, another reports `unknown_service`, and a third puts a request-specific label into service identity. Before diagnosing individual requests, the telemetry needs a consistent answer to who produced each signal.

In [OpenTelemetry's resource model](https://opentelemetry.io/docs/concepts/resources/), a resource describes the entity producing telemetry. Its attributes can identify a process, container, Kubernetes pod or deployment. A resource is attached to a tracer or meter provider during initialization; spans and metrics from that provider carry the association. The documentation says this association cannot be changed later on that provider. `service.name` is the logical service name, and the SDK may supply `unknown_service` unless it is set explicitly.

For voice API replicas that perform the same role, set the same `service.name`, such as `voice-api`, across the replicas. Set deployment context separately, for example `deployment.environment.name=production`, so a backend can group the service and then narrow an investigation to an environment or pod. OpenTelemetry documents `OTEL_SERVICE_NAME` and `OTEL_RESOURCE_ATTRIBUTES` as configuration routes; environment detectors may supply host, container and Kubernetes details. Check the actual emitted resource values because detector availability depends on the language SDK and environment.

A [span attribute](https://opentelemetry.io/docs/concepts/signals/traces/#attributes) describes the operation tracked by that span. A transcription span could carry an application-defined `audio.format` value; a playback span may have a different value. Request-specific details belong at this operation level when they are useful and appropriate to retain. Moving a changing request identifier into the resource would give each request a different producer identity and make service grouping harder. This grouping consequence follows from the different scopes of resource and span attributes; SDKs still allow custom resource attributes.

Choose resource attributes at provider startup, make the logical service name stable across replicas, and verify the emitted values in the telemetry backend. Put changing operation details on spans with deliberate data handling. This lets an operator start with the voice service, then follow a particular slow transcription without confusing request context with the identity of its producer.
