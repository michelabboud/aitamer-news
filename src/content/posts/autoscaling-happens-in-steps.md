---
title: Autoscaling Happens in Steps
description: A sudden inference surge meets several gates before new Pods serve traffic. Follow the autoscaler's measurement loop, replica rules, Node capacity, and readiness.
pubDate: "2026-10-05T07:30:00Z"
specimen: 257
section: devops
tags:
  - kubernetes
  - autoscaling
  - inference
  - capacity
draft: false
heroImage: https://media.aitamer.news/heroes/autoscaling-happens-in-steps-6a672234.jpg
heroAlt: A stream of demand passes through a gauge and controls before servers emerge in measured stages.
author: ari
wildness:
  rating: 2
  verified: Kubernetes documents the periodic loop, metric calculation, and default scaling policies.
  claimed: A surge reaches useful inference capacity after metric, scheduling, and readiness steps.
verdict: Track the metric, desired replicas, scheduling, and readiness as separate events to find where a surge response slows.
sources:
  - title: Horizontal Pod Autoscaling | Kubernetes
    url: https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/
  - title: Node Autoscaling | Kubernetes
    url: https://kubernetes.io/docs/concepts/cluster-administration/node-autoscaling/
  - title: Liveness, Readiness, and Startup Probes | Kubernetes
    url: https://kubernetes.io/docs/concepts/workloads/pods/probes/
---

An inference service can receive a burst of requests in a moment. Kubernetes responds through a sequence of observations and decisions. The HorizontalPodAutoscaler (HPA) reads a chosen metric, calculates a desired replica count, and updates a scalable workload such as a Deployment. More replicas still need a place to run and a way to become ready. A valid decision to add Pods can therefore precede usable serving capacity. [Kubernetes describes this control loop](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/).

## The controller checks on a schedule

The HPA runs an intermittent control loop. Its default sync period is 15 seconds, and cluster operators can change that period. On each pass, the controller finds the target workload and its selected Pods. It then requests the metrics named in the HPA specification. Resource metrics such as CPU come through the resource metrics API. Custom and external metrics use their corresponding APIs. The controller acts on those observations during a pass, so a surge that begins just after one pass must wait for another decision. The sync period describes the controller's schedule. It does not describe the time until a new Pod can serve a request. [Kubernetes documents the loop and metric sources](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/).

## A measurement becomes a replica target

The basic calculation multiplies the current replica count by the ratio of the observed metric to its target, then rounds up. Kubernetes gives an example: an observed value of 200m against a target of 100m calls for twice as many replicas. That calculation describes a recommendation, which the controller can adjust before changing the workload. It also ignores a small band of variation around the target. The documented default tolerance is 10%. A rise that stays within the band produces no scale action. For a sudden inference surge, the chosen metric must cross the threshold before this step can request more capacity. [See the HPA algorithm](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/).

## Missing data changes the calculation

The controller takes extra care when some Pods lack metrics. For a scale-up calculation, it treats missing Pods as using zero percent of the target. For scale-down, it treats them as using the full target. Those assumptions reduce the size of a proposed change. CPU scaling also sets aside certain Pods whose readiness or metric history makes their startup measurements unreliable. When an upward recommendation exists, those Pods can dampen it further. If the recalculated ratio reverses direction or falls within the tolerance, the controller makes no change. The utilization shown in HPA status can still reflect the original average, rather than the adjusted ratio used for the decision. That distinction matters when an operator compares a visible metric with a smaller than expected replica increase. [Kubernetes explains the conservative recalculation](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/).

## Scaling rules control each step

An HPA can cap replicas with its configured maximum. Its behavior settings can also limit how quickly the count changes. The documented default scale-up behavior has no stabilization window and allows the larger of four Pods or 100% of current replicas to be added in each 15-second policy period. A large recommendation can therefore take several steps to reach its target. Scale-down has a different shape: by default, the controller considers earlier recommendations over a five-minute window and favors the highest one. This helps avoid removing capacity after a short dip, only to add it back. These are defaults, and the HPA behavior field can change them. [Kubernetes lists the default policies](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/).

## New Pods still have to become useful

A higher desired replica count does not itself provide running workers. If existing Nodes cannot schedule the new Pods, a configured Node autoscaler can provision more Nodes. Kubernetes says that provisioning can be limited by configuration, scheduling constraints, or available cloud capacity. This is a separate capacity step after the workload asks for more Pods. [Kubernetes explains Node provisioning](https://kubernetes.io/docs/concepts/cluster-administration/node-autoscaling/).

The application has another gate. A readiness probe determines when a container can accept traffic. A failed readiness probe keeps its Pod out of matching Services. If an inference worker must load files or warm a cache first, the probe should succeed only when that worker is ready to handle requests. The time between a replica recommendation and a useful replica therefore depends on scheduling and startup as well as the HPA loop. [Kubernetes describes readiness probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/).

## The metric must reflect demand

CPU utilization is measured against resource requests. If the relevant request is absent from a Pod container, Kubernetes says the HPA cannot act on that CPU utilization metric. CPU may also describe a different pressure from the one users feel. If requests are piling up while CPU remains near its target, an operator can expose an appropriate workload or external metric and use the HPA's custom metric support. The service must choose that metric and expose it to Kubernetes. An HPA can evaluate multiple metrics and use the largest resulting replica count, subject to its configured maximum. [Kubernetes covers resource, custom, and multiple metrics](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/).

## What to do

1. Choose a scaling signal that rises when this inference service approaches its useful capacity. If using CPU utilization, set resource requests for the relevant containers and confirm that the resource metrics API is available.
2. Read the HPA's minimum, maximum, target, and behavior settings together. Check whether the default tolerance and scale-up policy match the surge the service needs to handle.
3. Check whether new Pods can schedule on existing Nodes. If the workload needs Node autoscaling, verify that its provisioning rules allow the required Pod requests.
4. Make readiness reflect the worker's ability to accept traffic after startup work. Treat a higher desired replica count and a ready serving replica as separate milestones.
5. During a controlled surge, inspect the chosen metric, desired replicas, scheduled Pods, and ready endpoints in order. Find the step that lags, then change the signal or capacity setting responsible for that step.
