---
title: Liveness and readiness probes answer different questions
description: Liveness decides whether Kubernetes restarts a container. Readiness decides whether it gets traffic. Wiring one health check to both turns a slow dependency into a restart storm.
pubDate: "2026-10-14T06:00:00Z"
specimen: 764
section: devops
tags:
  - kubernetes
  - probes
  - health-checks
  - reliability
draft: false
heroImage: https://media.aitamer.news/heroes/liveness-readiness-probes-1506ab39.jpg
heroAlt: A blue paper server stands beside a lowered red-and-cream traffic barrier holding cream request cards on a road.
author: quill
wildness:
  rating: 1
  verified: Probe semantics, the cascading-failure warning and HTTP success codes from Kubernetes docs
  claimed: Whether readiness should check shared dependencies is left open; the docs do not settle it
verdict: Long-standing Kubernetes guidance, stated plainly in the official docs. The open question is dependency checks in readiness, which stays a per-service judgment.
sources:
  - title: "Kubernetes: Liveness, Readiness, and Startup Probes"
    url: https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/
  - title: "Kubernetes: Pod Lifecycle"
    url: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/
  - title: "Kubernetes: Configure Liveness, Readiness and Startup Probes"
    url: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/
---

A common Kubernetes setup has one `/healthz` endpoint that checks the database, wired to both the liveness probe and the readiness probe. It works until the database has a slow minute. Then every replica fails its health check at the same moment, and the kubelet restarts all of them. When the database recovers, the whole service is still cold-starting.

The probes ask different questions, and each answer triggers a different action. A single endpoint gives one answer to both.

## What each probe asks and what Kubernetes does with the answer

The [Kubernetes probe documentation](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/) defines three probes.

- **Liveness decides whether the container is restarted.** "Liveness probes determine when to restart a container." The documentation's example is a deadlock, where the application is running but cannot make progress. If a container fails its liveness probe more times than the configured tolerance, the kubelet restarts it.
- **Readiness decides whether the container gets traffic right now.** "Readiness probes determine when a container is ready to accept traffic." On failure, the EndpointSlice controller removes the Pod's IP address from the EndpointSlices of every Service that matches the Pod. The container keeps running. Readiness probes run during the container's whole lifecycle.
- **Startup decides whether the application has finished starting.** While a startup probe is configured and has not yet succeeded, Kubernetes runs neither liveness nor readiness probes. If the startup probe fails, the kubelet kills the container and its restart policy applies.

So a liveness failure costs a restart, and a readiness failure costs a share of traffic. The [pod lifecycle page](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/) adds that readiness probes help later in a container's life too, "when recovering from temporary faults or overloads."

## Why a shared endpoint fails under load

The probes page warns about this case directly. Liveness probes "must be configured carefully to ensure that they truly indicate unrecoverable application failure, for example a deadlock." It continues: "Incorrect implementation of liveness probes can lead to cascading failures." The results it lists are containers restarting under high load, failed client requests, and more work landing on the pods that remain.

A database timeout gives no reason to restart a web process. A restart does not fix the database, and it throws away warm caches and open connections. That signal belongs to readiness, which removes the pod from rotation and puts it back when the check passes again.

## Two endpoints with two jobs

Give each probe its own endpoint.

- `/livez` checks only things a restart would fix: the process can still accept a request and its main loop is not stuck. It calls no external dependency.
- `/readyz` checks whether this instance can serve a request now: startup work finished, configuration loaded, caches warm, and the instance is not shutting down.

A minimal version in Go:

```go
var ready atomic.Bool // set to true after startup work completes

http.HandleFunc("/livez", func(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
})

http.HandleFunc("/readyz", func(w http.ResponseWriter, r *http.Request) {
	if !ready.Load() {
		http.Error(w, "not ready", http.StatusServiceUnavailable)
		return
	}
	w.WriteHeader(http.StatusOK)
})
```

The [probe configuration guide](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) says that for an HTTP probe, any status code from 200 up to but not including 400 counts as success, and any other code is a failure. The `503` above fails readiness without touching liveness.

The matching container spec:

```yaml
startupProbe:
  httpGet: { path: /livez, port: 8080 }
  failureThreshold: 30
  periodSeconds: 10
livenessProbe:
  httpGet: { path: /livez, port: 8080 }
  periodSeconds: 10
readinessProbe:
  httpGet: { path: /readyz, port: 8080 }
  periodSeconds: 5
```

The startup probe matters because, in the documentation's words, "Liveness probes do not wait for readiness probes to succeed." Without it, a slow-starting service can be restarted before it ever becomes ready. The startup probe here allows 30 checks 10 seconds apart, so up to 300 seconds to start. The probes page gives the rule of thumb: if a container usually takes longer to start than `initialDelaySeconds + failureThreshold × periodSeconds`, add a startup probe that checks the same endpoint as the liveness probe.

## Where the advice gets harder

- **A liveness check that always passes catches nothing.** The handler above runs on the HTTP server's own goroutine. If the deadlock that matters is in a worker pool, `/livez` keeps answering 200 while the work stalls. A useful liveness check touches the part that can hang, cheaply, and still calls nothing outside the process.
- **Dependencies in readiness are a judgment call.** The configuration guide gives depending on external services after startup as one reason an application may be temporarily unable to serve traffic. When a dependency every replica shares goes down, though, every pod becomes unready together and the Service is left with no endpoints. Some services are better off staying in rotation and returning fast, clear errors. The Kubernetes documentation does not decide this for you.
- **Thresholds are part of the design.** A low `failureThreshold` on liveness turns a short pause, such as a long garbage-collection cycle, into a restart. Set liveness tolerances for real hangs and readiness tolerances for how fast traffic should move away.

The rule underneath all of this: a liveness probe should fail only when a restart is the right fix.
