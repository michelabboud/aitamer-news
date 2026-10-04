---
title: Protect Inference Capacity During a Node Drain
description: A PodDisruptionBudget can limit how many inference pods a node drain evicts at once. Its allowed-disruptions count shows when the workload has room for another eviction.
pubDate: "2026-10-05T14:30:00Z"
specimen: 271
section: devops
tags:
  - kubernetes
  - inference
  - poddisruptionbudget
  - node-drain
draft: false
heroImage: https://media.aitamer.news/heroes/protect-inference-capacity-during-a-node-drain-703fde88.jpg
heroAlt: Inference pods move off a draining server while a shield marks the capacity kept available.
author: ari
wildness:
  rating: 2
  verified: Kubernetes documents the PDB fields, status, readiness rules, drain behavior, and bypasses.
  claimed: The inference capacity guidance applies those rules; it makes no measured performance claim.
verdict: Use a PDB to limit eviction during node maintenance. Read its allowed-disruptions count alongside readiness and serving metrics before each drain.
sources:
  - title: Specifying a Disruption Budget for your Application
    url: https://kubernetes.io/docs/tasks/run-application/configure-pdb/
  - title: Disruptions
    url: https://kubernetes.io/docs/concepts/workloads/pods/disruptions/
  - title: kubectl drain
    url: https://kubernetes.io/docs/reference/kubectl/generated/kubectl_drain/
---

A node drain can remove an inference server from service while requests are still arriving. If several replicas serve the same model, the useful question is how many can leave at once. Kubernetes addresses part of that question with a PodDisruptionBudget, or PDB. Its [disruption guide](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/) describes a PDB as a limit on simultaneous voluntary disruptions for a replicated application.

## A drain requests evictions

`kubectl drain` marks a node unschedulable and removes its pods in preparation for maintenance. When the API server supports eviction, drain uses the Eviction API. Kubernetes can reject an eviction temporarily, and drain retries failed requests until the pods are gone or the configured timeout is reached. The [drain reference](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_drain/) says to wait for the command to complete before working on the machine.

This matters for inference because a drain can affect several serving pods. A budget gives the eviction process a limit for the pods it selects. It does not promise that a whole node can be emptied immediately. If the next eviction would cross the limit, the drain waits while the workload recovers.

## A budget sets an availability floor

A PDB selects pods by label and sets either `minAvailable` or `maxUnavailable`. The [Kubernetes PDB guide](https://kubernetes.io/docs/tasks/run-application/configure-pdb/) says the selector should match the selector of the workload's controller. `minAvailable` is the number of selected pods that must remain available after an eviction. `maxUnavailable` is the number that may be unavailable after one. A PDB can specify only one of these fields.

Consider the guide's example with three replicas and `minAvailable: 2`. With all three healthy, one disruption is allowed. While that pod's replacement is unavailable, another eviction must wait. The guide also shows `maxUnavailable: 1` as equivalent for that three-replica case. It recommends that form when the controller's replica count changes, because the budget adjusts with the scale.

For an inference deployment, choose the availability floor from the capacity needed to serve requests during maintenance. The count of replicas is only a starting point for that decision. A PDB counts pods; it does not express the serving capacity of each pod. If replicas carry different traffic or have different capacity, check what the remaining set can handle before choosing the floor. This is an operational inference from the PDB's pod-based status, rather than a guarantee from Kubernetes.

## Allowed disruptions is the live signal

The PDB configuration states an intention. Its status shows what the controller currently permits. In the [PDB guide's status example](https://kubernetes.io/docs/tasks/run-application/configure-pdb/), `kubectl get poddisruptionbudgets` shows an `ALLOWED DISRUPTIONS` column. The detailed status includes `currentHealthy`, `desiredHealthy`, `expectedPods`, and `disruptionsAllowed`. The example has three healthy pods, a desired healthy count of two, and one allowed disruption.

Read this value just before a drain and during it. One allowed disruption means there is room for one budgeted eviction at that moment. It is not a reservation for every pod on a node. Once an eviction consumes the available margin, the next request may be rejected until a replacement becomes healthy. Kubernetes' [disruption example](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/) shows a second node drain blocked while only two of three replicas are available under a two-pod minimum.

A zero value needs investigation. It can be the expected result of a strict budget, or it can reflect a workload that lacks enough healthy pods. Check the selected pods and the detailed PDB status before changing the budget. The guide's example also shows zero allowed disruptions when no pods match its selector, so the number alone does not explain its cause.

## Ready pods determine health

The PDB guide says a pod counts as healthy when its `Ready` condition is `True`. Its `currentHealthy` status tracks those pods. For an inference service, that makes readiness an input to the drain decision. A running process that has not become Ready does not supply healthy margin to the budget. The PDB's status still cannot tell you how much request load the ready pods can carry. Use service metrics alongside it when deciding whether maintenance can proceed.

An unhealthy running pod can also hold up a drain. The guide says the default `IfHealthyBudget` policy may wait for such a pod to become healthy. Its `AlwaysAllow` policy permits eviction of unhealthy running pods even when the budget is disrupted, with the tradeoff that those pods lose their chance to recover in place. Choose this policy deliberately for the workload.

## The limit has boundaries

A PDB constrains voluntary evictions made through the Eviction API. The [disruption guide](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/) says direct deletion of a pod or deployment bypasses it. It also says involuntary failures cannot be prevented by a PDB, although they count against the budget. Pods unavailable during a rolling application update count against the budget too, while the workload controller's update behavior is governed by its own settings.

The [drain reference](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_drain/) has a `--disable-eviction` option that uses deletion and bypasses PDB checks. Keep the normal eviction path when the budget is meant to protect serving capacity. The reference also notes that drain falls back to deletion if the API server does not support eviction. Confirm that the cluster operator or provider respects PDBs, as the [PDB guide](https://kubernetes.io/docs/tasks/run-application/configure-pdb/) advises.

## What to do

1. Identify the replicated inference workload and copy its controller selector into a PDB. Set either `minAvailable` or `maxUnavailable` to reflect the serving margin you need. Review percentage rounding before using a percentage: the [PDB guide](https://kubernetes.io/docs/tasks/run-application/configure-pdb/) says Kubernetes rounds up.
2. Apply the budget, then inspect `kubectl get poddisruptionbudgets` and the PDB's detailed status. Confirm that `expectedPods` and `currentHealthy` describe the intended workload.
3. Before each node drain, check `ALLOWED DISRUPTIONS`, pod readiness, and serving metrics. If the value is zero, determine whether the restriction is intentional or the workload needs recovery.
4. Drain through the normal eviction path. Wait for the command to complete, and check that replacement pods become Ready before draining another node.
