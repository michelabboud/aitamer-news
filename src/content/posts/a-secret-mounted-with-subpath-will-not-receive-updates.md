---
title: A Secret Mounted With SubPath Will Not Receive Updates
description: Kubernetes refreshes ordinary Secret volume files eventually, but a subPath mount stays on its old content. Credential rotation also needs an application reload or a Pod rollout.
pubDate: "2026-10-08T19:30:00Z"
specimen: 502
section: devops
tags:
  - kubernetes
  - secrets
  - credential-rotation
draft: false
heroImage: https://media.aitamer.news/heroes/a-secret-mounted-with-subpath-will-not-receive-updates-708ad5a0.jpg
heroAlt: A rust credential tag stays pinned in a narrow blue frame while fresh teal tags circulate beside it.
author: ari
wildness:
  rating: 1
  verified: Ordinary Secret volumes update eventually; subPath mounts do not receive automated updates.
  claimed: Application reload and provider overlap are deployment responsibilities, not kubelet guarantees.
verdict: Use a directory Secret volume for projected updates, then provide a real credential reload path. If the gateway reads credentials only at startup, roll Pods as part of rotation.
sources:
  - title: "Kubernetes documentation: Secrets, using Secrets as files from a Pod"
    url: https://kubernetes.io/docs/concepts/configuration/secret/#using-secrets-as-files-from-a-pod
---

An AI voice gateway may accept provider requests until its credential rotates, then fail while the Kubernetes Secret already shows the new value. The difference can be in the mount, before the application even gets a chance to reload.

A [Secret mounted as a volume](https://kubernetes.io/docs/concepts/configuration/secret/#using-secrets-as-files-from-a-pod) exposes each selected key as a file. When a mutable Secret changes, Kubernetes eventually projects the new data into an ordinary Secret volume. The kubelet keeps a local cache of the Secrets used by Pods on its node. Its default change detection uses an API watch; clusters can instead configure a time-to-live cache or polling. The documentation describes the potential propagation delay as the kubelet sync period plus the delay of that detection strategy. Updating the Secret object therefore does not promise an immediate file change in every Pod.

Consider a Pod that takes only the `provider-token` key and mounts it at `/app/config/token` using `subPath`. That layout avoids mounting a whole directory over `/app/config`, but it has a decisive cost: Kubernetes says a container using a Secret through `subPath` receives no automated Secret updates. A successful Secret edit leaves that running container's mounted token stale. Waiting for another kubelet sync does not fix this exception.

If live rotation is required, mount the Secret as a directory dedicated to credentials, such as `/run/provider-credentials`, and have the gateway read `/run/provider-credentials/provider-token`. This lets Kubernetes project updates into the volume. It still leaves an application decision: a process that reads the token once during startup can keep the old value in memory after the file changes. Give the gateway a defined reload path that reopens the file, or roll the Pods when the credential changes. For active voice sessions, decide whether existing sessions finish under the old credential while new connections use the new one; coordinate the provider's overlap window accordingly.

There is another boundary: an immutable Secret cannot be edited in place. Kubernetes advises recreating Pods after replacing one because existing Pods can retain the old mount. For a rotation procedure, record whether the Secret is mutable, whether the Pod uses `subPath`, and whether the application reloads credentials. Then rehearse a rotation with a disposable credential and check successful authentication after the expected propagation and reload, without printing the token.
