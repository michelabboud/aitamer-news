---
title: Mirror production traffic to a new model version before it serves users
description: Use an Istio VirtualService to copy live requests to a candidate model deployment, discard its responses, and compare its errors and latency with the stable version.
pubDate: "2026-10-14T06:30:00Z"
section: devops
tags:
  - istio
  - kubernetes
  - traffic-mirroring
  - model-serving
  - observability
draft: false
heroImage: https://media.aitamer.news/heroes/mirror-model-traffic-with-istio-200ae6cc.jpg
heroAlt: Cream paper envelopes follow a wide teal path through a blue server while a smaller branch carries envelopes into a coral server.
author: quill
wildness:
  rating: 1
  verified: Mirror, mirrorPercentage, discarded responses and -shadow Host suffix are in Istio's docs.
  claimed: Nothing speculative; side-effect and quality caveats are flagged as outside the docs.
verdict: A low-risk way to load-test a new model version on real traffic. Watch for duplicated side effects and the -shadow Host header before trusting the numbers.
sources:
  - title: "Istio: Mirroring task"
    url: https://istio.io/latest/docs/tasks/traffic-management/mirroring/
  - title: "Istio: VirtualService reference"
    url: https://istio.io/latest/docs/reference/config/networking/virtual-service/
  - title: "Istio: Standard metrics"
    url: https://istio.io/latest/docs/reference/config/metrics/
---

A new version of a model server can pass every offline evaluation and still behave differently under real traffic. Real requests are longer, stranger and burstier than a test set. Istio's traffic mirroring gives a candidate deployment a copy of live requests while the current version keeps answering users.

This guide follows the [Istio mirroring task](https://istio.io/latest/docs/tasks/traffic-management/mirroring/) and the [VirtualService reference](https://istio.io/latest/docs/reference/config/networking/virtual-service/).

## What mirroring does

You keep routing all traffic to the stable version and add a `mirror` destination next to the route. The Istio task describes mirrored requests as "fire and forget", which means the responses are discarded. The VirtualService reference adds that the sidecar or gateway "will not wait for the mirrored cluster to respond before returning the response from the original destination." It also states that statistics are generated for the mirrored destination. Those statistics are what you compare.

## Label the two versions

The example assumes two Deployments behind one Kubernetes Service called `model-server`, with pods labeled `version: stable` and `version: candidate`. A DestinationRule turns those labels into named subsets:

```yaml
apiVersion: networking.istio.io/v1
kind: DestinationRule
metadata:
  name: model-server
spec:
  host: model-server
  subsets:
  - name: stable
    labels:
      version: stable
  - name: candidate
    labels:
      version: candidate
```

## Copy a share of traffic to the candidate

```yaml
apiVersion: networking.istio.io/v1
kind: VirtualService
metadata:
  name: model-server
spec:
  hosts:
  - model-server
  http:
  - route:
    - destination:
        host: model-server
        subset: stable
      weight: 100
    mirror:
      host: model-server
      subset: candidate
    mirrorPercentage:
      value: 10.0
```

The `route` sends every request to `stable`. The `mirror` block sends a copy of 10% of them to `candidate`. The reference says that if `mirrorPercentage` is absent, all traffic (100%) is mirrored, and that the maximum value is 100. Starting low limits the load on the candidate before you know it can carry it. Raise the value once its pods hold up.

To shadow two candidates at once, the reference also defines a `mirrors` list. Each entry takes a `destination` and its own `percentage`. For clusters using the Kubernetes Gateway API, the Istio task shows an alternative: a `RequestMirror` filter on an HTTPRoute that copies all traffic to one backend. That example does not demonstrate two candidates with separate mirror percentages.

## Check that copies arrive

The Istio task verifies mirroring by sending a request and reading the logs of both versions. Before mirroring, only the first version logs the request. After, the task says, "you should see access logging for both". Adapted to this example:

```bash
kubectl logs deploy/model-server-stable -c model-server
kubectl logs deploy/model-server-candidate -c model-server
```

With a 10% mirror, expect roughly one candidate entry for every ten stable ones.

## Compare errors and latency

Istio's [standard metrics](https://istio.io/latest/docs/reference/config/metrics/) include `istio_requests_total`, a counter "incremented for every request handled by an Istio proxy", and `istio_request_duration_milliseconds`, a distribution of request durations. Both carry a `destination_version` label, a `response_code` label on HTTP metrics, and a `reporter` label whose value is `destination` for server-side proxies. Filtering on `reporter="destination"` selects reports from server-side Istio proxies. It avoids mixing those series with client-side and gateway reports, but it does not guarantee one observation per end-to-end request.

Error ratio per version:

```promql
sum by (destination_version) (rate(istio_requests_total{reporter="destination", destination_workload=~"model-server-.*", response_code=~"5.."}[5m]))
/
sum by (destination_version) (rate(istio_requests_total{reporter="destination", destination_workload=~"model-server-.*"}[5m]))
```

95th percentile latency per version:

```promql
histogram_quantile(0.95, sum by (le, destination_version) (rate(istio_request_duration_milliseconds_bucket{reporter="destination", destination_workload=~"model-server-.*"}[5m])))
```

Compare ratios and percentiles. Raw counts will differ by the mirror percentage.

## Failures to plan for

**Mirrored requests run for real.** Istio discards the candidate's response, yet the candidate still executes the request. If the handler writes to a database, calls a paid upstream model API, fires a webhook or appends to a user's conversation history, that happens twice. The Istio pages do not discuss side effects. Point the candidate at sandbox dependencies, or switch its writes off, before you mirror.

**The Host header changes.** The task states that mirrored requests reach the service "with their Host/Authority headers appended with `-shadow`", so `cluster-1` becomes `cluster-1-shadow`. A candidate that validates or routes on Host can reject every mirrored request. Those errors would never reach real users, so they distort the comparison. Confirm the candidate accepts the shadow host before reading error rates.

**Answer quality stays invisible.** Because responses are discarded, mirroring measures status codes, latency and resource use. To compare model outputs, have the candidate log its responses under the same privacy controls as production and compare them offline. The Istio documentation does not cover this.

**The candidate needs capacity.** At 100% it receives the full production load. Size its replicas for the percentage you set.

## Where this stops applying

The mirroring task covers HTTP traffic. It does not discuss streaming responses, long-lived connections or non-HTTP protocols, so test those cases yourself before trusting mirrored numbers. Mirroring also fits stateless requests best. If the server keeps session state between calls, the candidate sees isolated requests without that history.

Mirroring tells you whether the candidate can carry real load without errors. Once its numbers match or beat stable, the next step is a weighted route that sends a small share of real users to it.
