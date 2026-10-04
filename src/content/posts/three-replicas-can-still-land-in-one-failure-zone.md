---
title: Three Replicas Can Still Land in One Failure Zone
description: A replica count alone does not spread Pods across failure zones. Kubernetes topology spread constraints let you define the placement you need and the tradeoff when a zone is unavailable.
pubDate: "2026-10-05T23:30:00Z"
specimen: 288
section: devops
tags:
  - kubernetes
  - scheduling
  - availability
  - topology
  - devops
draft: false
heroImage: https://media.aitamer.news/heroes/three-replicas-can-still-land-in-one-failure-zone-f20785be.jpg
heroAlt: Three server replicas crowd onto one failing island while neighboring zones remain empty.
author: ari
wildness:
  rating: 2
  verified: Kubernetes documents zone and node spread, maximum skew, minimum domains, and scheduling behavior.
  claimed: Three replicas may share a zone unless placement rules and eligible domains produce the intended spread.
verdict: Replica count is a capacity setting, not proof of failure-zone coverage. Set a spread policy, verify eligible node labels, and inspect the placement after the workload changes.
sources:
  - title: "Kubernetes Documentation: Pod Topology Spread Constraints"
    url: https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/
---

Three replicas can all be running while one zone holds every Pod. A replica count tells a workload controller how many Pods to maintain. It does not, by itself, say where the scheduler should place them. If a zone fails, replicas sharing that zone share its fate. Kubernetes provides [topology spread constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) to control placement across failure domains such as zones and nodes.

## Replica count and placement are separate settings

The distinction matters even when a cluster has several zones. The Kubernetes documentation describes built-in spread defaults that *prefer* a balance across hostnames and zones. Both use `ScheduleAnyway`, so they allow a Pod to be scheduled when the preferred balance cannot be achieved. A cluster can also have its own scheduler defaults. Read the workload and cluster configuration before treating a replica count as evidence of zone coverage. [Kubernetes documents the defaults and their limits](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

Placement starts with node labels. Nodes with the same value for `topology.kubernetes.io/zone` belong to the same zone domain for that key. Use `kubernetes.io/hostname` to spread across nodes instead. Node spread protects against placing every matching Pod on one node. Zone spread addresses a wider failure domain. You can set both constraints when both forms of separation matter; the scheduler must then find a placement that satisfies both. [Kubernetes shows how the two constraints combine](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

## Maximum skew measures the imbalance

A spread constraint counts Pods selected by `labelSelector` in each eligible domain. With `whenUnsatisfiable: DoNotSchedule`, `maxSkew` sets the largest permitted difference between the count in a candidate domain and the global minimum. Suppose two zones hold two and one matching Pods. With `maxSkew: 1`, placing the next Pod in the fuller zone would produce counts of three and one. The difference would exceed one, so that placement is rejected. The less populated zone remains a possible choice if its nodes meet the other scheduling requirements. [The Kubernetes example walks through this calculation](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

`ScheduleAnyway` changes the meaning of the constraint in practice. The scheduler favors domains that reduce skew, while placement can still exceed the requested balance. Choose it when getting the Pod scheduled matters more than preserving the spread. Choose `DoNotSchedule` when violating the spread would defeat the workload's availability goal. The latter can leave a Pod Pending until a suitable domain is available. [Kubernetes defines both behaviors](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

## A workload can require three eligible zones

For a Deployment with three replicas, this fragment belongs under the Deployment's `spec`. Its Pod template labels match the spread selector. With three eligible zones and no other matching Pods, the constraint permits one of these replicas in each zone. If fewer than three zones are eligible, `minDomains: 3` makes the global minimum zero. Together with `maxSkew: 1`, that prevents a second matching Pod from being placed in one of the remaining zones. The extra Pod can stay Pending. [These are the documented `minDomains` rules](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

```yaml
replicas: 3
template:
  metadata:
    labels:
      app: checkout
  spec:
    topologySpreadConstraints:
      - maxSkew: 1
        minDomains: 3
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: checkout
```

This is a placement policy, so check it against the cluster's actual zones and workload capacity. `minDomains` is available only with `DoNotSchedule`. Clusters with older Kubernetes releases may need a feature gate or may lack the field; check the documentation for the version you run. The selector also needs care. If the Pod does not match its own spread selector, it does not count itself in later spread calculations. [Kubernetes calls out both conditions](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

## Labels and changing clusters affect the result

A zone label has to exist on the nodes you expect the scheduler to consider. Nodes missing a required topology key are bypassed for that constraint. Node selectors, affinity and taints can narrow the eligible set further. A zone shown on an infrastructure diagram may therefore contribute no eligible node to a particular workload. Check the labels and scheduling rules on the nodes that can actually run it. [Kubernetes explains which nodes enter the calculation](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

Spread constraints guide placement of incoming Pods. They do not promise that an existing distribution stays balanced after Pods are removed. Scaling down a Deployment, for example, can leave an imbalance. The scheduler also discovers topology domains from nodes that exist in the cluster. A zone whose node pool has scaled to zero may be absent from its view unless the autoscaler understands the spread policy and the full set of domains. [Both limitations appear in the Kubernetes documentation](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

## What to do

1. List the nodes that can run the workload and inspect their `topology.kubernetes.io/zone` and `kubernetes.io/hostname` labels. Confirm that the intended failure domains have eligible capacity.
2. Put a spread constraint in the workload's Pod template. Make its `labelSelector` match the template labels. Use the zone key for zone separation and add a hostname constraint if node separation is also required.
3. Decide what should happen when the target spread is impossible. Use `DoNotSchedule` for a hard placement limit, and set `minDomains` if the workload needs a minimum number of eligible zones. Expect Pending Pods when that limit cannot be met.
4. Check the placed Pods and their nodes after rollout, scaling and zone changes. The configured constraint describes scheduling decisions; the current Pod distribution shows the availability you actually have. [Kubernetes documents the fields, examples and limits](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).
