---
title: A Terminating Pod Still Has an Endpoint Lifecycle
description: EndpointSlice conditions distinguish an endpoint that is serving from one accepting normal new traffic. Use ready, serving, and terminating to design a drain policy for long voice or AI sessions.
pubDate: "2026-10-08T14:30:00Z"
specimen: 492
section: devops
tags:
  - kubernetes
  - endpointslice
  - draining
  - voice-applications
draft: false
heroImage: https://media.aitamer.news/heroes/a-terminating-pod-still-has-an-endpoint-lifecycle-53f40fd6.jpg
heroAlt: An existing boat stays tethered to a closed rust dock while a new blue boat is guided toward an open cream dock.
author: ari
wildness:
  rating: 1
  verified: EndpointSlices expose serving, terminating, and ready; ready normally excludes terminating endpoints.
  claimed: Existing-session drain and fallback admission depend on application policy and runtime behavior.
verdict: Route new sessions with ready endpoints, treat serving terminating endpoints as a deliberate fallback, and test active-session drain.
sources:
  - title: Kubernetes EndpointSlices
    url: https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/#conditions
---

Imagine a voice agent Pod holding live conversations when a deployment replaces it. The Pod is marked for deletion, yet its process may still be responding. A client that sees only “healthy” or “gone” has too little information to decide where to send the next call.

The [Kubernetes EndpointSlice conditions](https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/#conditions) describe three related signals. `serving` indicates that an endpoint currently serves responses; for a Pod-backed endpoint it maps to the Pod’s Ready condition. `terminating` becomes true when the Pod receives a deletion timestamp, commonly before its containers have exited. `ready` is normally a shortcut for `serving` **and** not `terminating`. The documented exception is a Service with `spec.publishNotReadyAddresses: true`, for which `ready` is always true.

That creates a useful drain interval. A Pod may be `serving: true` and `terminating: true`, while `ready` is false. New calls should normally prefer an endpoint that is ready and not terminating. An existing conversation already attached to the terminating Pod may be allowed to finish while the application shuts down in an orderly way. EndpointSlice status informs routing; it does not itself keep a WebSocket or a call alive. The process and its termination budget still have to support the drain.

The Service path has a nuance. Kubernetes says Service proxies normally ignore terminating endpoints, but may route to one that is both serving and terminating when every available endpoint is terminating. Therefore, a custom client that watches EndpointSlices should not assume its policy is identical to every Service proxy. State the policy explicitly: prefer normal ready endpoints; decide separately whether to use a serving terminating endpoint when no alternative exists, based on whether refusing a new session is better than risking an interrupted one.

A direct EndpointSlice consumer also needs a complete endpoint view. Kubernetes notes that a single Service can have multiple slices and that the same endpoint can temporarily appear in more than one. Aggregate all associated slices and deduplicate network endpoints before selecting a target. Otherwise a rollout can bias selection or make a drain look like extra capacity.

For a voice or AI service, the practical check is a rolling replacement with an active session: watch how new sessions route, whether existing sessions finish, and what happens when all endpoints terminate at once. Define those outcomes in the client and application drain policy. The three condition bits make the transition visible; they do not choose your user experience.
