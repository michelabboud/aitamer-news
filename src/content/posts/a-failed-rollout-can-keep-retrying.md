---
title: A Failed Rollout Can Keep Retrying
description: A Kubernetes progress deadline reports a stalled rollout. The Deployment can still complete after the underlying problem is fixed.
pubDate: "2026-10-04T23:30:00Z"
specimen: 241
section: devops
tags:
  - kubernetes
  - deployments
  - rollouts
  - operations
draft: false
heroImage: https://media.aitamer.news/heroes/a-failed-rollout-can-keep-retrying-441f7e7e.jpg
heroAlt: A damaged wagon blocks one part of a mountain route while two loaded wagons remain behind it.
author: ari
wildness:
  rating: 2
  verified: A missed progress deadline sets a failure condition; the rollout can later complete.
  claimed: A failed rollout can keep retrying after the deadline.
verdict: Treat the deadline as a failure signal. Inspect the cause and current availability, then fix the rollout or deliberately roll it back.
sources:
  - title: Deployments | Kubernetes
    url: https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
---

## What the deadline reports

A Deployment can stall while bringing up its newest ReplicaSet. Image pull errors, failed readiness probes, insufficient quota, and application misconfiguration are among the possible causes. The `.spec.progressDeadlineSeconds` field tells the Deployment controller how long to wait without progress before reporting the stall. When the deadline is exceeded, the Deployment gets a `Progressing` condition with status `False` and reason `ProgressDeadlineExceeded`. [Kubernetes documents the condition and its causes](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/).

The condition describes rollout progress. It does not, by itself, tell you whether every old Pod has stopped serving. The documentation shows a Deployment with `Available: True` and `Progressing: False` at the same time. Check both conditions before judging the service's current state. [See the failed Deployment example](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/).

## What happens afterward

Kubernetes reports the missed deadline without automatically rolling back the Deployment. The rollout can still finish if the problem is resolved. In the documentation's quota example, satisfying the quota allows the controller to complete the rollout. The `Progressing` condition then changes to `True` with reason `NewReplicaSetAvailable`. A higher-level orchestrator may use the failure condition to trigger a rollback, so its behavior also matters. [See the controller behavior and recovery example](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/).

This distinction matters for automation. `kubectl rollout status` returns an error when the progress deadline is exceeded. That error is a useful signal to investigate. It is not evidence that Kubernetes has frozen the Deployment or restored the previous revision. [Kubernetes describes the command's result](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/).

## What to do

1. Run `kubectl describe deployment NAME` and read the conditions and events. Check the new Pods and ReplicaSet for the cause, such as an image pull error or a quota failure.
2. Fix the cause, then check `kubectl rollout status deployment/NAME` and the Deployment conditions again. A rollout that completes reports `NewReplicaSetAvailable`.
3. If the new revision needs to be withdrawn, inspect the rollout history and choose a known stable revision. Kubernetes supports `kubectl rollout undo deployment/NAME` for that action. [The Deployment guide shows these checks and the rollback command](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/).
