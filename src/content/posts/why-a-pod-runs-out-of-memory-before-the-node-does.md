---
title: Why a Pod Runs Out of Memory Before the Node Does
description: Memory requests place a Pod. Limits constrain its containers. Learn how to tell a container out-of-memory kill from node-pressure eviction and size inference workloads accordingly.
pubDate: "2026-10-06T02:30:00Z"
specimen: 294
section: devops
tags:
  - kubernetes
  - memory
  - pods
  - inference
  - devops
draft: false
heroImage: https://media.aitamer.news/heroes/why-a-pod-runs-out-of-memory-before-the-node-does-d3a5aff2.jpg
heroAlt: A container overflows with memory blocks beside a server with unused capacity.
author: ari
wildness:
  rating: 2
  verified: Kubernetes documents request-based placement, memory-limit kills, and node-pressure eviction.
  claimed: Inference startup and request load are sizing scenarios, not measured results.
verdict: A Pod can hit its container memory limit while the node has spare RAM. Check the termination reason before changing requests, limits, or node capacity.
sources:
  - title: Resource Management for Pods and Containers | Kubernetes
    url: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
  - title: Node-pressure Eviction | Kubernetes
    url: https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/
  - title: Assign Memory Resources to Containers and Pods | Kubernetes
    url: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/
---

A node can have unused RAM while an inference container is killed for memory. Kubernetes makes placement and runtime decisions at different boundaries. The scheduler checks a Pod's requests against the node's resources available to Pods. The Linux kernel enforces a running container's memory limit. A node's spare capacity therefore does not raise that container's ceiling. The [Kubernetes resource guide](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/) describes both paths.

## Requests decide where the Pod can start

A memory request tells the scheduler how much memory to account for when placing a Pod. It is a planning value, not a cap on use. Kubernetes can place the Pod when its requests fit alongside requests already assigned to a node. It can decline placement even while the node's current memory use looks low. The scheduler is protecting room for the workloads it has already admitted. [Kubernetes explains the scheduling check](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/).

For a Pod with multiple containers, include each container's request when you assess the Pod's demand. That includes a proxy or other sidecar if one is present. Compare the total with the node's **allocatable** memory, which is the amount available to Pods. Allocatable can be lower than the node's physical capacity because system processes also need memory. The resource guide shows both fields in the output of `kubectl describe nodes`.

An inference service may have different memory demand while it starts and while it serves requests. Treat the memory used to load a model, run a chosen level of concurrency, and keep temporary data as parts of the workload you need to size. A request that covers only a quiet period can still allow the Pod to start, while leaving it dependent on spare node memory during busier periods. Kubernetes permits a container to use more than its request when memory is available. [Its request and limit rules](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/) make that distinction explicit.

## Limits decide when the container can be killed

A memory limit is the boundary passed to the container runtime. On Linux, the runtime typically uses a control group to enforce it. If a container tries to allocate beyond its limit, the kernel's out-of-memory handling can stop a process in that container. Enforcement is reactive, so a brief reading above the limit does not guarantee an immediate kill. A terminated main process can be restarted according to the container's restart settings. These behaviors are described in the [Kubernetes resource guide](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/).

Consider a Pod on a node with unused RAM. If its inference container reaches its own limit during model loading or a burst of requests, the container can still be killed. Adding RAM to the node alone does not change that configured limit. Raising the limit may be appropriate after checking actual demand, but the new setting must still fit the placement and capacity plan. If only a limit is set, Kubernetes normally copies that value into the request unless an admission rule supplies a default request. This can also change where the Pod is eligible to run.

Memory-backed `emptyDir` volumes deserve the same attention as process memory. Kubernetes accounts their pages as container memory, and the Pod or container memory limit can apply to them. A cache or temporary model file stored there can consume the same constrained resource. Set an explicit volume `sizeLimit` when using this form of `emptyDir`, and include its expected use in sizing. [Kubernetes warns](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/) that an unbounded memory-backed volume can consume available node memory when no memory limit is set.

## Node pressure is a separate failure path

A node can also run short of memory overall. The kubelet watches a memory availability signal against eviction thresholds. If it cannot recover enough resources, it evicts Pods to protect the node. Its selection considers whether a Pod uses more than its request, Pod priority, and usage relative to the request. An inference Pod that routinely exceeds a small request can therefore be more exposed during node pressure. See the [node-pressure eviction guide](https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/).

There is also a node out-of-memory path if memory runs out before the kubelet can reclaim it. The kernel then chooses a process to kill. An eviction, a node out-of-memory kill, and a container hitting its own limit call for different fixes. The symptom matters more than the node's free-memory snapshot taken later. The [node-pressure guide](https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/) describes these separate decisions.

## What to do

1. Run `kubectl describe pod <pod-name>` and inspect each container's last state, reason, limits, requests, and restart count. The [Kubernetes memory walkthrough](https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/) shows an `OOMKilled` reason in a terminated container's last state. Also inspect Pod events for eviction or scheduling failures.
2. Run `kubectl describe nodes` for the assigned node. Compare allocatable memory, assigned requests, and the node's pressure conditions. If the Pod is pending, examine scheduling events before changing a limit. The [resource guide](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/) shows where these fields appear.
3. Observe memory use through startup and representative request load. Include every container and any memory-backed `emptyDir`. Kubernetes reports Pod use through status, and optional monitoring tools can expose metrics. Size the request for the demand you expect the node to accommodate, and choose a limit that covers legitimate peaks without letting one container consume an unsafe share of node memory.
4. If the container hits its limit, reduce its demand or adjust that limit and its request. If the Pod is evicted under node pressure, revisit requests, node capacity, and competing workloads. Confirm the new settings with the same workload pattern and watch for repeat kills or evictions.
