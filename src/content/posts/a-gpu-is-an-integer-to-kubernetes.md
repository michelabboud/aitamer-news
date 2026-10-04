---
title: A GPU Is an Integer to Kubernetes
description: Device plugins advertise GPUs as countable resources. That changes how Pods request them and how many workloads a node can schedule.
pubDate: "2026-10-05T00:30:00Z"
specimen: 243
section: devops
tags:
  - kubernetes
  - gpu
  - device-plugins
  - scheduling
draft: false
heroImage: https://media.aitamer.news/heroes/a-gpu-is-an-integer-to-kubernetes-ec32165b.jpg
heroAlt: A crane places whole square units beside four GPU cards in a server rack.
author: ari
wildness:
  rating: 2
  verified: Kubernetes device plugin resources use integer counts and cannot be overcommitted.
  claimed: The integer count shapes GPU Pod placement even when an application uses little GPU capacity.
verdict: Treat the plugin’s advertised GPU count as the scheduling budget. Put an integer GPU value in the container’s limits and match Pods to nodes that can satisfy it.
sources:
  - title: Device Plugins | Kubernetes
    url: https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/device-plugins/
  - title: Schedule GPUs | Kubernetes
    url: https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/
---

A GPU enters Kubernetes scheduling through a device plugin. The plugin reports the devices it manages to the kubelet, which advertises them in the node’s status. A plugin might expose a resource named `nvidia.com/gpu`; a Pod can then request that resource. [Kubernetes explains this registration path in its device plugin documentation](https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/device-plugins/).

## The scheduler counts units

Device plugin resources are extended resources. Kubernetes supports them only as integers and does not overcommit them. A container can request one advertised unit or two, but it cannot request half a unit. The device plugin documentation also says devices cannot be shared between containers through this allocation path.

Suppose a node advertises two healthy units of a GPU resource. A Pod requesting two needs a node that can satisfy both units. Once those units are allocated, scheduling another Pod that requests the same resource requires available units elsewhere. This is a count of the resource the plugin advertises. It is not a reading of how busy the GPU is. [The Kubernetes example shows how the advertised count constrains placement](https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/device-plugins/).

## A GPU limit is also its request

The word `limits` can be misleading here. For GPUs, Kubernetes says to put the resource in a container’s `limits`. If `requests` is omitted, Kubernetes uses the limit as the request. If both are present, their GPU values must match. A GPU request on its own is unsupported. The [GPU scheduling guide](https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/) shows a Pod with a GPU limit of `1`.

This matters when a workload appears small enough to share a GPU. A smaller application workload does not produce a fractional device plugin request. The schedulable unit remains the integer resource advertised by the plugin.

## What to do

1. Install the GPU driver and corresponding device plugin on the relevant nodes, as the [GPU scheduling guide](https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/) directs.
2. Check the resource name and available count advertised in each node’s status. Use that exact name in the container’s GPU `limits`.
3. Size the Pod’s integer GPU limit against the available count. If your nodes have different GPU types, use node labels and selectors to place workloads on suitable nodes, following the [Kubernetes guidance](https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/).
