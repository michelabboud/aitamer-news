---
title: Who Owns the `replicas` Field?
description: A Deployment manifest and an autoscaler can both set the replica count. Kubernetes field ownership explains the conflict and how to hand over scaling safely.
pubDate: "2026-10-08T03:30:00Z"
specimen: 390
section: tools
tags:
  - kubernetes
  - deployments
  - autoscaling
  - server-side-apply
draft: false
heroImage: https://media.aitamer.news/heroes/who-owns-the-replicas-field-fb7074c9.jpg
heroAlt: Two hands adjust competing settings for a stack of replica cubes.
author: ari
wildness:
  rating: 2
  verified: Kubernetes documents apply conflicts, replica defaults, and HPA handoff procedures.
  claimed: The operational framing follows those documented behaviors.
verdict: Give the HPA control of `spec.replicas` and use the documented handoff for the workflow that applies the Deployment.
sources:
  - title: Server-Side Apply | Kubernetes
    url: https://kubernetes.io/docs/reference/using-api/server-side-apply/
  - title: Horizontal Pod Autoscaling | Kubernetes
    url: https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/
  - title: Deployments | Kubernetes
    url: https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
---

A Deployment manifest can specify `spec.replicas`, the desired number of Pods. A HorizontalPodAutoscaler (HPA) can also change that field as demand changes. Once both are involved, a routine deployment update can become a scaling decision. The key is to decide which workflow should control the count, then transfer that control without briefly shrinking the workload. [Kubernetes recommends omitting `spec.replicas` from a Deployment manifest when an HPA manages scaling](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/).

## The field carries a live decision

A Deployment uses `spec.replicas` to state how many Pods it wants. When the field is absent, its default is one. The HPA periodically adjusts the desired scale of a target Deployment using observed metrics. It reaches the workload through its `scale` subresource. That means the value is expected to move while the autoscaler runs. A fixed count in a repeatedly applied manifest expresses a competing instruction. [The Deployment reference describes the field and its default](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/); [the HPA guide describes the control loop and scale interface](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/).

The rest of the manifest can remain useful. The image, Pod template, labels, and rollout settings still belong in deployment configuration. The HPA can control the replica count while the deployment workflow continues to declare the fields it manages. [Server-Side Apply describes declared intent as the fields for which an applier has an opinion](https://kubernetes.io/docs/reference/using-api/server-side-apply/).

## Apply records who manages each field

Server-Side Apply tracks field managers in an object's `metadata.managedFields`. A manager identifies a workflow that writes an object. An apply request declares the fields that workflow intends to manage. When it tries to change a field claimed by another manager, the API server rejects the apply with a conflict unless the caller forces the change. The conflict signals that the proposed update would interfere with another writer's decision. [Kubernetes documents field management and conflict resolution](https://kubernetes.io/docs/reference/using-api/server-side-apply/).

A manager can give up its claim by omitting the field from its next applied configuration. Two appliers can also share ownership when they apply the same value. If a later apply tries to change that shared value, it conflicts. To inspect the record, run `kubectl get deployment NAME -o yaml --show-managed-fields` and look for `f:spec` and `f:replicas` under the manager entries. [The Server-Side Apply guide explains shared ownership and the inspection flag](https://kubernetes.io/docs/reference/using-api/server-side-apply/).

## The handoff can briefly reduce capacity

It is tempting to enable an HPA, delete `spec.replicas` from the manifest, and apply again. There is a timing problem. The HPA may not yet have needed to write a new count. If the original apply manager gives up the field before another manager owns it, Server-Side Apply can reset the field to its default. For a Deployment, that default is one. Kubernetes calls out the risk of a temporary workload reduction in its [replica ownership transfer example](https://kubernetes.io/docs/reference/using-api/server-side-apply/).

Waiting for the HPA to write is one documented route. Keep the replica value in the manifest until the controller claims the field. A subsequent Server-Side Apply that tries to change it can then report a conflict. At that point, remove the field from the manifest and apply again. The conflict identifies a handoff point. Inspect ownership and change the source instead of retrying with `--force-conflicts`. Forcing a conflict takes the field from other managers and writes the caller's value. [Kubernetes describes both the waiting route and the effect of forcing an apply](https://kubernetes.io/docs/reference/using-api/server-side-apply/).

There is also a deliberate handoff when waiting is unsuitable. Kubernetes shows a separate manifest containing only the Deployment identity and its current `spec.replicas` value. Apply it under a temporary field manager with `kubectl apply -f replicas-only.yaml --server-side --field-manager=handover-to-hpa --validate=false`. That manager can hold the current count while the main manifest releases it. If the temporary apply conflicts with the HPA, the controller has already claimed the field. After the main manifest omits `spec.replicas`, the next HPA write removes the temporary manager's claim. [The documented transfer example gives the sequence](https://kubernetes.io/docs/reference/using-api/server-side-apply/).

## Client-side apply needs its own route

The command `kubectl apply -f deployment.yaml` may use client-side apply. Its last-applied annotation differs from Server-Side Apply's field ownership model. The HPA guide says that reapplying a manifest with `spec.replicas` can scale the workload back to that fixed value, causing fluctuation while the HPA is active. [The HPA migration guidance describes this behavior](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/).

For client-side `kubectl apply`, Kubernetes documents a separate sequence: run `kubectl apply edit-last-applied deployment/NAME`, remove `spec.replicas` in the editor, then remove it from the source manifest. Future applies can use that updated manifest. The first edit changes the recorded last-applied configuration without changing the live Pod count. Use the route that matches the apply method managing the Deployment. [The HPA guide lists the client-side steps and points Server-Side Apply users to the ownership transfer procedure](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/).

## What to do

1. Check whether an HPA targets the Deployment and identify the workflow that applies its manifest. Inspect the live replica value and, for Server-Side Apply, its managed fields.
2. If autoscaling should control the count, plan to remove `spec.replicas` from the lasting Deployment manifest. Complete the handoff for your apply method before making that removal live.
3. For Server-Side Apply, wait until the HPA has claimed the field, or use a separate replica-only manifest with a temporary field manager to preserve the current count during the transfer. Inspect ownership if an apply conflicts.
4. For client-side `kubectl apply`, edit the last-applied configuration first, then remove the field from the source manifest. Apply the revised source and check the Deployment and HPA state.
5. Keep future Deployment updates free of a fixed replica count while the HPA manages scaling. [Kubernetes recommends this division of control and documents the migration paths](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/).
