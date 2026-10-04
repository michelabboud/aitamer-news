---
title: Stage Model Assets Before the Server Starts
description: Use a Kubernetes init container and a shared volume to put model files in place before an inference server starts. Plan for retries, storage use, and model loading.
pubDate: "2026-10-05T16:30:00Z"
specimen: 274
section: devops
tags:
  - kubernetes
  - init-containers
  - inference
  - model-assets
  - storage
draft: false
heroImage: https://media.aitamer.news/heroes/stage-model-assets-before-the-server-starts-12d37ed3.jpg
heroAlt: A cart loaded with model files stands beside server racks before startup.
author: ari
wildness:
  rating: 2
  verified: Kubernetes supports ordered init containers and shared Pod volumes.
  claimed: The example applies that documented pattern to model asset staging.
verdict: Use an init container when the server must receive prepared model files at startup. Make staging retry-safe, budget the shared storage, and check serving readiness separately.
sources:
  - title: Init Containers | Kubernetes
    url: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/
  - title: Volumes | Kubernetes
    url: https://kubernetes.io/docs/concepts/storage/volumes/
  - title: Images | Kubernetes
    url: https://kubernetes.io/docs/concepts/containers/images/
  - title: Resource Management for Pods and Containers | Kubernetes
    url: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
  - title: Liveness, Readiness, and Startup Probes | Kubernetes
    url: https://kubernetes.io/docs/concepts/workloads/pods/probes/
  - title: Secrets | Kubernetes
    url: https://kubernetes.io/docs/concepts/configuration/secret/
  - title: Debug Init Containers | Kubernetes
    url: https://kubernetes.io/docs/tasks/debug/debug-application/debug-init-containers/
---

An inference server needs its model files before it can load them. One way to arrange that startup is to give the file preparation work to an init container. It runs first, writes the files into a volume shared by the Pod, and exits. Kubernetes starts the application container after the init container succeeds. The two containers can use different images, so the server image does not need to include the preparation tools. [Kubernetes describes this startup order and shared-volume pattern in its init container documentation](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/).

## How the handoff works

Put an `initContainers` entry and an application `containers` entry in the same Pod template. Mount one volume in both. The init container writes to its mount path; the server reads from its own mount path. Those paths can differ because both mounts refer to the same volume. For temporary files needed only by this Pod, `emptyDir` provides a volume that starts empty when the Pod is assigned to a node. Every container in the Pod can access its contents through a mount. [Kubernetes documents the lifecycle and sharing rules for `emptyDir`](https://kubernetes.io/docs/concepts/storage/volumes/).

The ordering is the useful guarantee. Kubernetes runs regular init containers to completion before starting application containers. If preparation fails, the server does not start with a missing model. Under the usual retry behavior, the kubelet tries the failed init container again; a Pod with `restartPolicy: Never` follows a different failure path. [The init container documentation explains both cases](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/).

## A Pod template to adapt

This example assumes a model asset image contains `/bundle/model.bin`. The serving image reads `MODEL_PATH`. Both image names and that environment variable are placeholders for your images and server. The shared volume is writable during preparation and mounted read-only by the server.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: model-server
spec:
  volumes:
    - name: model-files
      emptyDir: {}
  initContainers:
    - name: stage-model
      image: registry.example.com/model-assets:chosen-release
      command:
        - sh
        - -ec
        - |
          cp /bundle/model.bin /models/model.bin.tmp
          test -s /models/model.bin.tmp
          mv -f /models/model.bin.tmp /models/model.bin
      volumeMounts:
        - name: model-files
          mountPath: /models
  containers:
    - name: inference
      image: registry.example.com/inference-server:chosen-release
      env:
        - name: MODEL_PATH
          value: /models/model.bin
      volumeMounts:
        - name: model-files
          mountPath: /models
          readOnly: true
```

The init container writes a temporary file, checks that it contains data, then moves it to the path the server will read. Adapt the check to the real artifact: a nonempty file check cannot establish that model weights are complete or correct. If the asset comes from a remote store instead of an image, verify its expected digest before putting it at the final path. Treat the expected digest as part of the release input, alongside the server configuration.

Choose fixed image digests when you need the same asset and server images on every new Pod. Kubernetes explains that tags can move while image digests identify fixed image content. A digest pins the image; you still need a release process that chooses the correct model for the server. [See the Kubernetes image naming guidance](https://kubernetes.io/docs/concepts/containers/images/).

## Retries and storage need a plan

Preparation may run again. Kubernetes advises making init container work idempotent because an init container can be retried or re-executed, including when output already exists in an `emptyDir`. Write the staging command so it can handle an old temporary file and an existing final file. The example replaces both. For a remote download, decide how to handle interrupted transfers and verification failures before deploying it. [The retry and idempotence guidance is in the init container documentation](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/).

An `emptyDir` lasts through container crashes while the Pod remains on its node. Its contents are deleted when the Pod is removed from that node. A replacement Pod therefore needs its own preparation run. The default medium uses storage backed by the node; selecting the memory medium changes how usage is charged. A configured `sizeLimit` also cannot create free space when the node is full. [Kubernetes spells out these `emptyDir` limits](https://kubernetes.io/docs/concepts/storage/volumes/).

Budget for the files that staging writes and for the resources the init container needs. Kubernetes tracks writes to local `emptyDir` volumes as local ephemeral storage when that accounting is enabled. It also uses init container resource requests when calculating the Pod's effective request for scheduling. [The resource management documentation covers local storage accounting](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/), and [the init container documentation covers effective requests](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/). Check the artifact size and the temporary space required by your staging command before setting requests and limits.

## Keep startup and serving health separate

A successful init container means its preparation command finished. The server may still need time to load files and become able to answer requests. Give the application container a readiness probe that reflects its ability to serve inference. Kubernetes uses readiness results to decide whether a matching Service should route traffic to that Pod. Init containers themselves cannot use readiness probes. [The probe documentation explains readiness](https://kubernetes.io/docs/concepts/workloads/pods/probes/), and [the init container documentation describes the probe restriction](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/).

If remote storage requires credentials, expose them only to the container that needs them. Kubernetes allows Secrets to be mounted as volumes, and init and application containers can have different volume mounts. Keep credential material out of the shared model directory. [See the Kubernetes Secret documentation](https://kubernetes.io/docs/concepts/configuration/secret/) and [init container guidance](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/).

## What to do

1. Identify the exact model files and the path your server reads. Choose an asset image or a remote source, and record the artifact digest.
2. Add a shared volume, an init container that stages and verifies the files, and an application mount at the server's model path. Make the staging command safe to retry.
3. Set storage and resource budgets from the real artifact and staging needs. Add a server readiness probe that succeeds only when inference can accept traffic.
4. Inspect a new Pod as it starts. `kubectl describe pod <pod-name>` shows init container state, and `kubectl logs <pod-name> -c stage-model` shows its logs. [Kubernetes provides both commands in its init container debugging guide](https://kubernetes.io/docs/tasks/debug/debug-application/debug-init-containers/).
