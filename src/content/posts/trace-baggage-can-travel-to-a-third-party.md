---
title: Trace Baggage Can Travel to a Third Party
description: OpenTelemetry baggage can leave an AI service in outbound HTTP headers. Check what a model API receives and limit propagation at that boundary.
pubDate: "2026-10-06T00:30:00Z"
specimen: 290
section: devops
tags:
  - opentelemetry
  - observability
  - privacy
  - http
  - ai-infrastructure
draft: false
heroImage: https://media.aitamer.news/heroes/trace-baggage-can-travel-to-a-third-party-a2b205aa.jpg
heroAlt: Trace tags pass through a filter on their way from a user to an external service.
author: ari
wildness:
  rating: 3
  verified: OpenTelemetry warns that baggage in HTTP headers can reach third-party APIs.
  claimed: A model API could receive a tenant ID when its client injects baggage.
verdict: Keep sensitive identifiers out of baggage, inspect outbound model-API headers, and restrict propagation at third-party boundaries.
sources:
  - title: Baggage | OpenTelemetry
    url: https://opentelemetry.io/docs/concepts/signals/baggage/
  - title: Context propagation | OpenTelemetry
    url: https://opentelemetry.io/docs/concepts/context-propagation/
  - title: Handling sensitive data | OpenTelemetry
    url: https://opentelemetry.io/docs/security/handling-sensitive-data/
---

An AI service may carry a tenant or user identifier through internal calls by placing it in OpenTelemetry baggage. Baggage is a key-value store that travels with request context. The [OpenTelemetry baggage guide](https://opentelemetry.io/docs/concepts/signals/baggage/) lists account and user IDs among possible entries. The risk appears when that request also makes a call outside the service.

## How the value can leave

Consider a worker that receives baggage containing a tenant ID, then calls a hosted model API. OpenTelemetry says automatic instrumentation includes baggage in most network requests. It also says baggage travels in HTTP headers and warns that sensitive entries can reach third-party APIs. If the worker injects baggage into the model request, that provider receives the tenant ID in a header. Removing the ID from the request body would leave this path open. Whether a particular client injects baggage depends on its instrumentation and configuration. [The baggage guide](https://opentelemetry.io/docs/concepts/signals/baggage/) describes the underlying risk.

An internal call can carry the value onward too. A downstream service may later make its own external request. The guide warns that keeping one connection inside your network does not ensure baggage stays there.

## Why a clean trace is insufficient

Baggage is separate from span, metric, and log attributes. A service must explicitly copy a baggage entry into those records. Therefore, a trace without the tenant ID does not show whether an outgoing HTTP header carried it. [OpenTelemetry explains this distinction](https://opentelemetry.io/docs/concepts/signals/baggage/). Redacting exported telemetry alone cannot establish what an earlier external request contained.

## What to do

First, list the values your services put in baggage. Keep credentials, personal data, and other sensitive fields out of it. [OpenTelemetry's context propagation guidance](https://opentelemetry.io/docs/concepts/context-propagation/) recommends avoiding sensitive baggage and limiting propagation to external services.

Next, inspect the actual headers sent by a representative outbound model request in a safe test environment. Check clients and downstream services that can inject context. Configure outbound propagation so external endpoints receive only the context you intend to share. Test that boundary again when instrumentation changes.

Finally, collect only identifiers needed for observability and review them regularly. [OpenTelemetry's sensitive-data guidance](https://opentelemetry.io/docs/security/handling-sensitive-data/) recommends that approach. The transmitted header shows what left your service.
