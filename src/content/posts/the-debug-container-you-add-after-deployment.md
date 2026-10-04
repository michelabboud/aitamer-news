---
title: The Debug Container You Add After Deployment
description: An ephemeral container gives you a way to inspect a running Kubernetes pod when its application image lacks a shell or diagnostic tools.
pubDate: "2026-10-05T18:30:00Z"
specimen: 278
section: devops
tags:
  - kubernetes
  - pods
  - debugging
  - containers
draft: false
heroImage: https://media.aitamer.news/heroes/the-debug-container-you-add-after-deployment-4fa61888.jpg
heroAlt: A crane places a tool-filled debug container beside an already running server container.
author: ari
wildness:
  rating: 2
  verified: Kubernetes documents the debug command, process targeting, and container limits.
  claimed: A temporary debug container can make a tool-free application image inspectable.
verdict: Use an ephemeral container to inspect a running pod when the application image lacks diagnostic tools. Check process visibility and remember that the added container cannot be removed from that pod.
sources:
  - title: "Kubernetes: Ephemeral Containers"
    url: https://kubernetes.io/docs/concepts/workloads/pods/ephemeral-containers/
  - title: "Kubernetes: Debug Running Pods"
    url: https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/
---

A pod is running, but its application image has no shell. `kubectl exec` cannot open one, and the tools you need are absent. Kubernetes provides an [ephemeral container](https://kubernetes.io/docs/concepts/workloads/pods/ephemeral-containers/) for this case. It runs temporarily inside the existing pod so you can inspect it.

## How it helps

The debug container uses an image that contains the tools you need. You add it to the running pod with `kubectl debug`; you do not need to rebuild the application image to get a shell. Kubernetes specifically recommends ephemeral containers when `kubectl exec` is insufficient because an image lacks debugging utilities or a container has crashed. Its [debugging guide](https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/) shows the command and how to attach to the new container.

The `--target` option aims the debug container at the application container's process namespace. That can let you inspect its processes. This depends on container runtime support. If the runtime cannot provide that access, the debug container may fail to start or may see only its own processes. A missing process in `ps` therefore needs investigation before you treat it as evidence that the application stopped.

## What stays behind

“Ephemeral” describes the container's job, not a removable change to the pod. Kubernetes does not automatically restart the container, and you cannot change or remove its entry after adding it. It also cannot declare ports, probes, or resource allocations. Those limits make it a troubleshooting tool, not a way to extend an application's normal operation. The [ephemeral container overview](https://kubernetes.io/docs/concepts/workloads/pods/ephemeral-containers/) documents these constraints.

## What to do

1. Identify the pod and the application container you need to inspect. Choose a debug image with the required utilities and a suitable security profile.
2. Follow the [Kubernetes example](https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/) with your own names and image: `kubectl debug -it <pod> --image=<debug-image> --target=<app-container> --profile=general`.
3. Run the inspection commands inside the attached debug container. If target processes are absent, check whether the runtime supports `--target`.
4. Use `kubectl describe pod <pod>` to inspect the added container's state. Record what you found before leaving the session; the container will not restart automatically.
