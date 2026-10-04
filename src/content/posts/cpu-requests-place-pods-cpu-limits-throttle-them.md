---
title: CPU Requests Place Pods; CPU Limits Throttle Them
description: CPU requests guide Pod placement. CPU limits cap a running container's CPU time.
pubDate: "2026-10-05T10:30:00Z"
specimen: 263
section: devops
tags:
  - kubernetes
  - cpu
  - scheduling
  - containers
draft: false
heroImage: https://media.aitamer.news/heroes/cpu-requests-place-pods-cpu-limits-throttle-them-6a1e2145.jpg
heroAlt: A processor feeds several pods; a narrow gauge on one pod suggests a separate running limit.
author: ari
wildness:
  rating: 1
  verified: Kubernetes documents request-based placement and kernel-enforced CPU throttling.
  claimed: A Pod can fit at placement and later be throttled by its container's CPU limit.
verdict: Size requests for placement, then assess limits against the CPU time the running workload needs.
sources:
  - title: Resource Management for Pods and Containers | Kubernetes
    url: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
---

A Pod can fit on a node and still have its CPU use slowed later. The two decisions happen at different times. Kubernetes uses [CPU requests when scheduling a Pod](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/). On Linux, the kernel [enforces CPU limits by throttling](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/) after a container starts.

## Requests decide where a Pod can run

A CPU request tells the scheduler how much CPU to account for when placing a Pod. The scheduler compares the requests of Pods already assigned to a node with the CPU available to Pods there. It can reject a placement even when current CPU use is low. For a Pod with several containers, their CPU requests contribute to the Pod's total [request](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/).

A request is also relevant after placement. On a contended Linux node, a larger CPU request typically gives a container a larger share of CPU time. When spare capacity exists, a container can use more CPU than it requested. The request alone does not set a runtime ceiling. These behaviors are described in the [Kubernetes resource guide](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/).

## Limits cap CPU time during execution

A CPU limit sets a hard ceiling for a running container. The kubelet passes the limit to the container runtime. On Linux, the runtime typically configures a control group, and the kernel delays further execution when the container uses its allowed CPU time within a scheduling interval. That delay is CPU throttling. A node can have spare CPU while a container is throttled by its own limit. See the [Kubernetes explanation of enforcement](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/).

Consider a container with a request of `250m` and a limit of `500m`. The request accounts for one quarter of a CPU unit at placement. The container may use more while CPU is available, but the limit caps it at half a CPU unit. Kubernetes uses these same quantities in its [container example](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/). If you set only a CPU limit, Kubernetes copies it into the request unless an admission mechanism has already supplied a default request.

## What to do

1. Set a CPU request for each container based on the CPU it needs during normal operation. Check the sum against node allocatable CPU and existing requests with `kubectl describe nodes`.
2. If a Pod stays pending, inspect its events with `kubectl describe pod`. An insufficient CPU event points to a placement problem, even if current use looks low.
3. Decide whether each container needs a CPU limit. If it does, test the workload under its expected bursts and watch for throttling. Adjust the limit when it restricts useful work.

The [Kubernetes troubleshooting guide](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/) shows the node and Pod checks.
