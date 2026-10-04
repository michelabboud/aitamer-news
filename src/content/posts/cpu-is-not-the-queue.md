---
title: CPU Is Not the Queue
description: Inference requests can wait while CPU utilization stays below its scaling target. Measure pending work and queue delay to decide when more workers are useful.
pubDate: "2026-10-05T09:30:00Z"
specimen: 261
section: devops
tags:
  - inference
  - autoscaling
  - kubernetes
  - queues
  - observability
draft: false
heroImage: https://media.aitamer.news/heroes/cpu-is-not-the-queue-225a8ed2.jpg
heroAlt: A line of request cards waits outside a machine while another card passes through its processor.
author: ari
wildness:
  rating: 2
  verified: Kubernetes supports custom and external metrics; vLLM exposes waiting and queue-time metrics.
  claimed: Pending-work metrics can reveal demand that a CPU scaling target misses.
verdict: Scale on pending work when growing queue delay shows that CPU is an inadequate demand signal. Set targets from observed worker capacity and latency, and account for startup time.
sources:
  - title: Horizontal Pod Autoscaling | Kubernetes
    url: https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/
  - title: Production Metrics | vLLM
    url: https://docs.vllm.ai/en/latest/usage/metrics/
  - title: Scale Workloads to Zero with HorizontalPodAutoscaler | Kubernetes
    url: https://kubernetes.io/blog/2026/09/02/kubernetes-v1-37-hpa-scale-to-zero-beta/
---

A worker can have requests waiting even when its CPU metric gives an autoscaler no reason to add capacity. Kubernetes calculates CPU utilization against a Pod’s requested CPU. An inference server can report a separate count of requests waiting to be processed. Those signals describe different parts of the system. If queue delay grows while CPU stays below its scaling target, a CPU-based policy may leave requests waiting. This is the case for examining a pending-work metric, rather than assuming every inference deployment needs one. [Kubernetes explains the CPU calculation](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/), and [vLLM documents its waiting-request metric](https://docs.vllm.ai/en/latest/usage/metrics/).

## Find where requests wait

First locate the queue that holds the work you want additional workers to take. For an inference server using vLLM, `vllm:num_requests_waiting` counts requests waiting inside the engine, while `vllm:num_requests_running` counts requests in execution batches. Its queue-time histogram measures time spent waiting. These metrics let an operator check whether an internal backlog is accompanied by a longer wait. [The vLLM metric definitions](https://docs.vllm.ai/en/latest/usage/metrics/) also distinguish requests waiting for capacity from requests deferred by other constraints. Treat that distinction as diagnostic evidence: another replica is a more plausible response to a capacity backlog than to a transfer or scheduling constraint that needs investigation.

An internal engine metric covers requests that reached that engine. If an application holds work in a shared queue before assigning it to a worker, measure that queue too. Kubernetes describes queue length as an external signal that remains available even when workers have stopped. That makes it suitable for a queue consumer whose pending jobs exist independently of its Pods. For direct HTTP inference, identify any buffering layer before using its backlog as a scaling signal. [Kubernetes’s scale-to-zero explanation](https://kubernetes.io/blog/2026/09/02/kubernetes-v1-37-hpa-scale-to-zero-beta/) notes that a Kubernetes Service does not buffer requests while no Pods are ready.

## Turn backlog into a scaling target

Kubernetes Horizontal Pod Autoscaling can use custom metrics from Pods or external metrics. Its controller compares an observed value with a target and adjusts the desired replica count. For multiple configured metrics, it uses the largest replica recommendation, subject to the configured maximum. A queue metric therefore needs a target that reflects how much pending work a ready worker can handle while meeting the service’s latency goal. Choose that target from observations of the actual model and request mix. The [autoscaling documentation](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/) explains the metric paths, replica calculation, and maximum.

A request count is a useful starting signal, but equal counts need not mean equal work. vLLM exposes distributions for prompt tokens and generated tokens alongside queue time, time to first token, and end-to-end latency. Compare these during the workloads you serve. If backlog count looks steady while waiting time worsens, inspect request size and running work before raising the replica limit. If wait falls after additional workers become ready, the scaling signal is doing useful work. [These measurements are listed in vLLM’s production metrics](https://docs.vllm.ai/en/latest/usage/metrics/).

## Account for the delay before capacity arrives

A scaling decision does not complete a queued request. Kubernetes periodically evaluates metrics, and new Pods must become ready before they can serve work. Its autoscaling algorithm accounts for Pods that are not yet ready when calculating some scale-up decisions. For a service with a tight latency goal, keep enough ready capacity for the demand that arrives while more workers start. Then watch queue time and time to first token during bursts, rather than judging the policy only by its final replica count. [Kubernetes describes the controller and readiness behavior](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/); [vLLM exposes the latency measures](https://docs.vllm.ai/en/latest/usage/metrics/).

Also check that the metric reaches the autoscaler. Custom and external metrics require the corresponding Kubernetes metrics API to be available through an adapter. If a configured metric cannot be fetched, an autoscaler using multiple metrics can skip a proposed scale-down. A missing metric is therefore an operational fault to surface, not a zero backlog to assume. [Kubernetes documents both behaviors](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/).

## Decide whether zero workers are acceptable

Scaling to zero is a separate decision. Where the cluster supports it, Kubernetes requires an object or external metric that can still be read with no running Pods. CPU cannot provide that signal at zero. A durable queue can hold asynchronous jobs until a worker starts, but a direct HTTP service needs a buffering layer if no Pod is ready. Starting a worker also adds delay. Keep a ready replica when that delay or the absence of buffering conflicts with the service’s requirements. [Kubernetes documents the metric requirement](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/) and [the buffering and startup trade-off](https://kubernetes.io/blog/2026/09/02/kubernetes-v1-37-hpa-scale-to-zero-beta/).

## What to do

1. Identify every place a request can wait: before assignment, inside the inference engine, and during execution. Pick the pending-work metric at the boundary where more workers can take work.
2. Plot that metric beside CPU utilization, queue time, time to first token, and ready replica count. Look for periods when waiting grows without a useful CPU scaling response.
3. Establish a per-worker backlog target from representative requests and the latency you need to meet. Include the observed variation in prompt and output length.
4. Expose the metric through the appropriate Kubernetes custom or external metrics API. Check that the autoscaler can read it, then observe its decisions during rising and falling demand. [Kubernetes describes these APIs and scaling behavior](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/).
5. Set the minimum ready capacity and scale-down behavior around startup delay and the service’s ability to buffer work. Recheck queue delay after changes to the model, routing, or request mix.
