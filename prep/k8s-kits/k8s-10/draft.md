---
title: "Kubernetes from Zero, part 10: probes and graceful shutdown"
description: "Add liveness, readiness and startup probes, watch each one fail on purpose, and shut Pods down cleanly with preStop hooks and SIGTERM."
pubDate: "2026-11-20T07:00:00Z"
section: devops
subsection: kubernetes
tags:
  - k8s-from-zero
  - kubernetes
  - tutorial
  - probes
  - pod-lifecycle
draft: true
heroImage: https://bots.aitamer.news/heroes/k8s-from-zero-10-probes-and-graceful-shutdown-0e6ed9c2.jpg
heroAlt: "A dusty-blue cut-paper boat carrying three cream crates floats on torn-paper waves while a large slate-blue paper stethoscope rests its coral chest piece against the hull, with a slate-blue ship's wheel in the upper left."
author: desk-bot
lessonKit:
  id: k8s-10
wildness:
  rating: 1
  verified: "Ran every probe and shutdown example on kind v0.33.0, node v1.37.0, kubectl v1.37.2, 10 Nov 2026"
  claimed: "Probe defaults, back-off timings and the termination order come from kubernetes.io docs"
verdict: "Readiness decides who gets traffic, liveness decides who gets restarted, and every container must exit cleanly on SIGTERM inside its grace period."
sources:
  - title: "Liveness, Readiness, and Startup Probes (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/
  - title: "Configure Liveness, Readiness and Startup Probes (Kubernetes documentation)"
    url: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/
  - title: "Pod Lifecycle (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/
  - title: "Container Lifecycle Hooks (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/
  - title: "EndpointSlices (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/
  - title: "Pod v1 API reference (Kubernetes documentation)"
    url: https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/
  - title: "pid_namespaces(7), Linux manual page (man7.org)"
    url: https://man7.org/linux/man-pages/man7/pid_namespaces.7.html
  - title: "Controlling nginx (nginx documentation)"
    url: https://nginx.org/en/docs/control.html
---

In [part 9](https://aitamer.news/posts/k8s-from-zero-09-configmaps-and-secrets/) you fed configuration into Pods with ConfigMaps and Secrets. Your app now starts with the right settings, but Kubernetes still knows almost nothing about whether it is healthy. So far "Running" has only meant "the main process has not exited". In this part you teach the cluster three questions to ask your containers: have you started, are you still alive, and are you ready for traffic. Then you look at the other end of a container's life: how Kubernetes stops it, and how your app can finish its work before it goes. You need the kind cluster and the `k8s-from-zero` namespace from part 4. We tested everything on kind v0.33.0 (node image v1.37.0) with kubectl v1.37.2; our cluster is called `k8s-ep10`, so node names below carry that name.

## What you will build

Five small workloads, each built to show one behaviour. A two-replica nginx Deployment with a Service, where you break one Pod's readiness and watch it drop out of the Service without being restarted. A Pod that "hangs" after 20 seconds, so its liveness probe restarts it. A slow starter that a startup probe protects, and an impatient copy that gets killed for being slow. Finally, two Pods that you delete: one that shuts down cleanly in eight seconds, and one that ignores the stop signal and makes you wait thirty.

![A timeline for a container that takes about 25 seconds to start: the startup probe fails until 30 seconds, then succeeds once and stops, and only then do the liveness and readiness probes begin, every 5 seconds.](/diagrams/k8s-from-zero-10-probes-and-graceful-shutdown/three-probes-timeline.svg)

## Three probes, three questions

A **probe** is a check that the kubelet (the agent on each node, part 2) runs against one container, again and again. Each probe answers one question and triggers one kind of action, as described in the [probes concept page](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/):

- **Startup probe**: has the app finished starting? While it is configured and has not yet succeeded, the kubelet runs no liveness or readiness checks. When it succeeds once, it stops running. If it fails too often, the kubelet kills the container and the restart policy applies.
- **Liveness probe**: is the app still alive? If it fails `failureThreshold` times in a row, the kubelet restarts the container. Use it for states the app cannot leave on its own, such as a deadlock.
- **Readiness probe**: can the app take traffic right now? If it fails, the container is marked not ready, the Pod's `Ready` condition turns false, and the EndpointSlice controller marks that Pod's endpoint as not ready in every Service that selects it. Nothing is restarted. Readiness checks keep running for the container's whole life, so a Pod can leave and rejoin a Service many times.

If you configure no probe of a type, the kubelet treats that check as always passing. That is why every Pod you have run so far was "ready" the moment its process started.

Each probe uses one of four mechanisms: `exec` runs a command in the container and passes on exit code 0; `httpGet` passes on a status code from 200 to 399; `tcpSocket` passes if a TCP connection opens; `grpc` asks a gRPC health service. The timing fields are the same for all three probe types. These are the defaults from the docs, and `kubectl explain` confirms them on your cluster:

| Field | Default | Meaning |
|---|---|---|
| `initialDelaySeconds` | 0 | wait this long after the container starts |
| `periodSeconds` | 10 | run the check this often |
| `timeoutSeconds` | 1 | a check that takes longer counts as failed |
| `failureThreshold` | 3 | this many failures in a row trip the probe |
| `successThreshold` | 1 | must be 1 for liveness and startup probes |

```bash rail=explain
kubectl explain pod.spec.containers.readinessProbe.periodSeconds
```

```text
FIELD: periodSeconds <integer>

DESCRIPTION:
    How often (in seconds) to perform the probe. Default to 10 seconds. Minimum
    value is 1.
```

A rule of thumb follows from the table: a liveness probe with defaults restarts a container about 30 seconds (3 x 10) after it stops answering. A startup probe gives a slow app `failureThreshold x periodSeconds` seconds to start.

## Readiness decides who gets traffic

In part 8 you saw that a Service sends traffic to the Pods listed in its EndpointSlices. Each endpoint in a slice carries [conditions](https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/): `ready`, `serving` and `terminating`. A failing readiness probe sets `ready` to false, and Service proxies such as kube-proxy stop sending regular traffic there. The Pod keeps running; it simply stops getting new requests until the probe passes again.

![The Service web has an EndpointSlice with two endpoints: web-b44cbc97c-dtv9n is ready=true and gets traffic, while web-b44cbc97c-8ptgj fails its readiness probe with HTTP 404, is marked ready=false, gets no traffic and keeps running.](/diagrams/k8s-from-zero-10-probes-and-graceful-shutdown/readiness-removes-from-endpoints.svg)

The nginx Deployment you build next uses two different probes: readiness asks for the page `/index.html` over HTTP, and liveness only checks that port 80 accepts connections. That split matters. If the page disappears, the Pod should stop getting traffic, but restarting nginx would not bring the file back.

## Try it: probes that fail on purpose

1. Save this as `web.yaml`. It is the Deployment and Service pattern from parts 7 and 8, plus probes, a grace period and a `preStop` hook that the shutdown section explains.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app.kubernetes.io/name: web
  template:
    metadata:
      labels:
        app.kubernetes.io/name: web
    spec:
      terminationGracePeriodSeconds: 30
      containers:
        - name: nginx
          image: nginx:1.29-alpine
          ports:
            - containerPort: 80
          readinessProbe:
            httpGet:
              path: /index.html
              port: 80
            periodSeconds: 5
            failureThreshold: 2
          livenessProbe:
            tcpSocket:
              port: 80
            periodSeconds: 10
            failureThreshold: 3
          lifecycle:
            preStop:
              sleep:
                seconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: web
  namespace: k8s-from-zero
spec:
  selector:
    app.kubernetes.io/name: web
  ports:
    - port: 80
      targetPort: 80
```

2. Apply it and wait for the rollout.

```bash rail=apply-web-yaml-rollout
kubectl apply -f web.yaml
kubectl rollout status deployment/web -n k8s-from-zero
kubectl get pods -n k8s-from-zero
```

```text
deployment.apps/web created
service/web created
deployment "web" successfully rolled out
NAME                  READY   STATUS    RESTARTS   AGE
web-b44cbc97c-8ptgj   1/1     Running   0          6s
web-b44cbc97c-dtv9n   1/1     Running   0          6s
```

3. Break readiness in one Pod by deleting the page the probe asks for. Use your own Pod name.

```bash rail=exec-k8s-from-zero-web-b44cbc97c-8ptgj
kubectl exec -n k8s-from-zero web-b44cbc97c-8ptgj -- rm /usr/share/nginx/html/index.html
```

After about ten seconds (two failures, five seconds apart) the Pod shows `0/1` but `Running`, with no restarts:

```bash rail=get-pods-k8s-from-zero
kubectl get pods -n k8s-from-zero
```

```text
NAME                  READY   STATUS    RESTARTS   AGE
web-b44cbc97c-8ptgj   0/1     Running   0          25s
web-b44cbc97c-dtv9n   1/1     Running   0          25s
```

4. Look at the EndpointSlice conditions. The default table view still lists both addresses, so print the `ready` condition per endpoint with jsonpath (part 5):

```bash rail=get-endpointslice-k8s-from-zero
kubectl get endpointslice -n k8s-from-zero -l kubernetes.io/service-name=web \
  -o jsonpath='{range .items[*].endpoints[*]}{.addresses[0]}{"  "}{.targetRef.name}{"  ready="}{.conditions.ready}{"\n"}{end}'
```

```text
10.244.0.5  web-b44cbc97c-dtv9n  ready=true
10.244.0.6  web-b44cbc97c-8ptgj  ready=false
```

The events tell the whole story, including one honest failure right at startup, when nginx had not opened its port yet:

```bash rail=describe-pod-k8s-from-zero
kubectl describe pod -n k8s-from-zero web-b44cbc97c-8ptgj
```

```text
...
  Warning  Unhealthy  24s              kubelet            spec.containers{nginx}: Readiness probe failed: Get "http://10.244.0.6:80/index.html": dial tcp 10.244.0.6:80: connect: connection refused
  Warning  Unhealthy  4s (x3 over 9s)  kubelet            spec.containers{nginx}: Readiness probe failed: HTTP probe failed with statuscode: 404
```

5. Put the page back. Within one probe period the Pod is `1/1` again and back in the Service.

```bash rail=exec-k8s-from-zero-web-b44cbc97c-8ptgj-7
kubectl exec -n k8s-from-zero web-b44cbc97c-8ptgj -- sh -c 'echo back > /usr/share/nginx/html/index.html'
kubectl get pods -n k8s-from-zero
```

```text
NAME                  READY   STATUS    RESTARTS   AGE
web-b44cbc97c-8ptgj   1/1     Running   0          32s
web-b44cbc97c-dtv9n   1/1     Running   0          32s
```

6. Now a liveness restart. Save this as `stuck.yaml`. The container is healthy for 20 seconds, then removes the file its probe reads, while the process carries on: a stand-in for an app that hangs.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: stuck
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: stuck
spec:
  containers:
    - name: app
      image: busybox:1.37
      # Healthy for 20 seconds, then "hangs": the file disappears but the process keeps running.
      command: ["sh", "-c", "touch /tmp/alive; sleep 20; rm /tmp/alive; sleep 3600"]
      livenessProbe:
        exec:
          command: ["cat", "/tmp/alive"]
        periodSeconds: 5
        failureThreshold: 2
```

```bash rail=apply-stuck-yaml-get
kubectl apply -f stuck.yaml
kubectl get pod stuck -n k8s-from-zero --watch
```

```text
NAME    READY   STATUS              RESTARTS   AGE
stuck   0/1     ContainerCreating   0          0s
stuck   0/1     ContainerCreating   0          0s
stuck   1/1     Running             0          0s
stuck   1/1     Running             1 (0s ago)   60s
```

Press Ctrl+C, then read the events:

```bash rail=describe-pod-stuck
kubectl describe pod stuck -n k8s-from-zero
```

```text
...
  Warning  Unhealthy  40s (x2 over 45s)  kubelet            spec.containers{app}: Liveness probe failed: cat: can't open '/tmp/alive': No such file or directory
  Normal   Killing    40s                kubelet            spec.containers{app}: Container app failed liveness probe, will be restarted
  Normal   Started    10s (x2 over 70s)  kubelet            spec.containers{app}: Container started
```

Look at the times. The probe tripped at 30 seconds (20 healthy, then two failures five seconds apart), yet the restart happened at 60 seconds. The kubelet asked the container to stop and then waited out the default 30-second grace period, because this container ignored the request. Its last state confirms the hard kill, exit code 137 (128 + 9, SIGKILL):

```bash rail=get-pod-stuck
kubectl get pod stuck -n k8s-from-zero -o jsonpath='{.status.containerStatuses[0].lastState}'
```

```text
{"terminated":{"containerID":"containerd://6d2c57f4...","exitCode":137,"finishedAt":"2026-11-10T20:40:10Z","reason":"Error","startedAt":"2026-11-10T20:39:10Z"}}
```

Keep that 30-second gap in mind; the shutdown section explains it.

7. A startup probe for a slow starter. Save this as `slow.yaml`: the app needs 25 seconds before it is usable, and the startup probe allows up to 60.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: slow
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: slow
spec:
  containers:
    - name: app
      image: busybox:1.37
      # Takes 25 seconds to "start", then stays healthy.
      command: ["sh", "-c", "sleep 25; touch /tmp/started; sleep 3600"]
      startupProbe:
        exec:
          command: ["cat", "/tmp/started"]
        periodSeconds: 5
        failureThreshold: 12   # up to 60 seconds to start
      livenessProbe:
        exec:
          command: ["cat", "/tmp/started"]
        periodSeconds: 5
        failureThreshold: 2
```

```bash rail=apply-slow-yaml-get
kubectl apply -f slow.yaml
kubectl get pod slow -n k8s-from-zero     # at about 15 seconds
kubectl get pod slow -n k8s-from-zero     # at about 30 seconds
```

```text
NAME   READY   STATUS    RESTARTS   AGE
slow   0/1     Running   0          15s
NAME   READY   STATUS    RESTARTS   AGE
slow   1/1     Running   0          32s
```

The startup probe failed five times (`Startup probe failed: cat: can't open '/tmp/started'` in the events, `x5 over 26s`), which is fine: it had twelve tries. The strict liveness probe never ran during startup, so there were no restarts.

8. The same Pod with `failureThreshold: 3` gives the app only 15 seconds. Copy `slow.yaml` to `impatient.yaml`, change the name to `impatient` and the threshold to 3, apply it and wait a minute:

```bash rail=apply-impatient-yaml-describe
kubectl apply -f impatient.yaml
kubectl describe pod impatient -n k8s-from-zero
```

```text
...
  Warning  Unhealthy  34s (x3 over 44s)  kubelet            spec.containers{app}: Startup probe failed: cat: can't open '/tmp/started': No such file or directory
  Normal   Killing    34s                kubelet            spec.containers{app}: Container app failed startup probe, will be restarted
```

This Pod will never start: each attempt is killed before the app is ready, and the restarts slow down under back-off (10, 20, 40 seconds and so on, capped at five minutes, per the [Pod lifecycle page](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)). Delete both Pods and `stuck`:

```bash rail=delete-pod-stuck
kubectl delete pod stuck slow impatient -n k8s-from-zero
```

## Graceful shutdown: preStop, SIGTERM, then SIGKILL

Pods are deleted all the time: rolling updates, scale-downs, node maintenance. The [termination flow](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination) gives your app a chance to finish:

1. You (or a controller) delete the Pod. The API server records a deadline, the **grace period**, set by `terminationGracePeriodSeconds` (default 30 seconds). kubectl shows the Pod as `Terminating`.
2. At the same time, the control plane marks the Pod's endpoints as `terminating=true` and `ready=false`, so Services stop sending it new traffic. These two things are not ordered with respect to each other.
3. If the container has a **preStop hook**, the kubelet runs it first. The hook must finish before the container gets a stop signal. The grace period clock is already running during the hook, per the [lifecycle hooks page](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/).
4. The runtime sends **SIGTERM** to process 1 in each container (or the image's `STOPSIGNAL`; the official nginx image sets `SIGQUIT`, which nginx treats as a [graceful shutdown](https://nginx.org/en/docs/control.html)).
5. If anything is still running when the grace period ends, the runtime sends **SIGKILL**, and the Pod is removed from the API.

![A timeline after deleting the Pod graceful with a 20-second grace period: at 0 seconds the Pod is Terminating and its endpoint turns ready=false; the preStop hook sleeps 4 seconds; SIGTERM arrives at 4.8 seconds; the app cleans up and exits at 7.8 seconds; SIGKILL would come at 20 seconds if anything were still running.](/diagrams/k8s-from-zero-10-probes-and-graceful-shutdown/pod-termination-sequence.svg)

A preStop hook can be a command (`exec`), an HTTP call (`httpGet`) or a plain `sleep`. The short sleep in `web.yaml` is a common pattern: it keeps the Pod serving for a few seconds while the endpoint change spreads to every proxy, so in-flight and late-arriving requests are not refused.

## Try it: a clean exit and a deaf one

1. Save this as `graceful.yaml`. Its shell traps SIGTERM, "finishes work" for three seconds and exits 0. The preStop hook writes to the container's log and sleeps four seconds.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: graceful
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: graceful
spec:
  terminationGracePeriodSeconds: 20
  containers:
    - name: app
      image: busybox:1.37
      command:
        - sh
        - -c
        - |
          trap 'echo "got SIGTERM, finishing work"; sleep 3; echo "clean exit"; exit 0' TERM
          echo "started"
          while true; do sleep 1; done
      lifecycle:
        preStop:
          exec:
            command: ["sh", "-c", "echo 'preStop hook running' > /proc/1/fd/1; sleep 4"]
```

2. Save this as `deaf.yaml`. It runs the same loop with no trap. Linux delivers a signal to the first process of a PID namespace, which is what process 1 in a container is, only if that process has installed a handler for it ([pid_namespaces(7)](https://man7.org/linux/man-pages/man7/pid_namespaces.7.html)); SIGKILL is the exception. This shell has no handler, so it never hears the stop request.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: deaf
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: deaf
spec:
  containers:
    - name: app
      image: busybox:1.37
      # sh runs as PID 1 and has no SIGTERM handler, so it ignores the signal.
      command: ["sh", "-c", "while true; do sleep 1; done"]
```

3. Apply both. In a second terminal, follow the logs of `graceful` with timestamps; in the first, time the delete.

```bash rail=apply-graceful-yaml-deaf-yaml
kubectl apply -f graceful.yaml -f deaf.yaml
kubectl logs -f graceful -n k8s-from-zero --timestamps    # second terminal
time kubectl delete pod graceful -n k8s-from-zero
```

```text
pod "graceful" deleted from k8s-from-zero namespace

real	0m8.345s
```

```text
2026-11-10T20:42:03.345218862Z started
2026-11-10T20:42:05.521187129Z preStop hook running
2026-11-10T20:42:10.354779725Z got SIGTERM, finishing work
2026-11-10T20:42:13.356002777Z clean exit
```

The order is exactly the flow above: the hook first, SIGTERM about five seconds later, a clean exit three seconds after that, and the Pod gone well inside its 20-second budget.

4. Now the deaf one:

```bash rail=time-delete-pod
time kubectl delete pod deaf -n k8s-from-zero
```

```text
pod "deaf" deleted from k8s-from-zero namespace

real	0m31.062s
```

Thirty seconds of nothing, then SIGKILL. This is the same gap you saw with `stuck`. In production it means slow rollouts, and work that is cut off rather than finished.

5. Finally, watch endpoints during a real deletion. Delete one `web` Pod without waiting, and look at the slice a second later:

```bash rail=delete-pod-web-b44cbc97c-8ptgj
kubectl delete pod web-b44cbc97c-8ptgj -n k8s-from-zero --wait=false
kubectl get endpointslice -n k8s-from-zero -l kubernetes.io/service-name=web \
  -o jsonpath='{range .items[*].endpoints[*]}{.targetRef.name}{"  "}{.conditions}{"\n"}{end}'
```

```text
web-b44cbc97c-dtv9n  {"ready":true,"serving":true,"terminating":false}
web-b44cbc97c-8ptgj  {"ready":false,"serving":true,"terminating":true}
web-b44cbc97c-m78kg  {"ready":false,"serving":false,"terminating":false}
```

Three Pods in one view: the survivor serving normally, the deleted Pod still serving during its preStop sleep but marked `terminating` so it gets no new regular traffic, and its replacement from the ReplicaSet, not ready yet. Eight seconds later the old Pod is gone and both remaining endpoints are `ready:true`.

## When it goes wrong

- **A rollout that never finishes.** A typo in a readiness probe means new Pods never become ready. We pointed the probe at port 8080, where nginx does not listen: `kubectl rollout status` waited and then printed `error: timed out waiting for the condition`, the new Pod sat at `0/1` with `Readiness probe failed: ... connect: connection refused`, and the two old Pods kept serving. That is the readiness probe protecting you: the Deployment would not replace working Pods with broken ones. Fix the manifest and `kubectl apply` it again, or roll back with `kubectl rollout undo` (part 7).
- **A restart loop from a liveness probe.** If `RESTARTS` climbs and the events say `failed liveness probe, will be restarted`, the probe may be too strict (a 1-second `timeoutSeconds` on a slow endpoint) or the app may need longer to start. Use a startup probe for start time; do not inflate the liveness delay.
- **Liveness that checks dependencies.** If a liveness probe calls the database and the database blips, every replica restarts at once. Keep liveness about the process itself; put dependency checks in readiness, if anywhere. The probes concept page warns that a careless liveness probe can cause cascading failures.
- **Deletes that always take 30 seconds.** The process ignores SIGTERM. Common causes: a shell script as process 1 without `trap`, or a shell wrapper that starts the real app as a child, so the signal never reaches it. Use `exec` in wrapper scripts, or handle the signal.
- **A preStop hook longer than the grace period.** The hook and the shutdown share one budget. If the hook needs 55 seconds and the app 10 to stop, a 60-second grace period kills the app mid-shutdown. Raise `terminationGracePeriodSeconds` to cover both.

## Cheat sheet

| Task | Command or field | Note |
|---|---|---|
| Restart on hang | `livenessProbe` | trips after `failureThreshold` failures in a row |
| Gate traffic | `readinessProbe` | failing removes the Pod from Service traffic, no restart |
| Protect slow starts | `startupProbe` | allows `failureThreshold x periodSeconds` to start |
| HTTP check | `httpGet: {path: /index.html, port: 80}` | 200 to 399 passes |
| Port check | `tcpSocket: {port: 80}` | passes if the port accepts a connection |
| Command check | `exec: {command: ["cat", "/tmp/ok"]}` | exit 0 passes |
| Probe timing | `periodSeconds`, `timeoutSeconds`, `failureThreshold` | defaults 10, 1, 3 |
| See probe failures | `kubectl describe pod <name>` | look for `Unhealthy` and `Killing` events |
| See endpoint readiness | `kubectl get endpointslice -l kubernetes.io/service-name=<svc> -o jsonpath=...` | read `.conditions.ready` |
| Why it restarted | `kubectl get pod <name> -o jsonpath='{.status.containerStatuses[0].lastState}'` | exit 137 means SIGKILL |
| Time to shut down | `terminationGracePeriodSeconds` | default 30, covers preStop plus SIGTERM handling |
| Run before SIGTERM | `lifecycle.preStop` | `sleep`, `exec` or `httpGet` |
| Field help | `kubectl explain pod.spec.containers.livenessProbe` | defaults straight from the API |
| Force delete | `kubectl delete pod <name> --grace-period=0 --force` | skips the wait; use with care |

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: probed
  namespace: k8s-from-zero
spec:
  terminationGracePeriodSeconds: 30
  containers:
    - name: app
      image: nginx:1.29-alpine
      startupProbe:
        httpGet: {path: /index.html, port: 80}
        failureThreshold: 30
        periodSeconds: 2
      readinessProbe:
        httpGet: {path: /index.html, port: 80}
        periodSeconds: 5
      livenessProbe:
        tcpSocket: {port: 80}
      lifecycle:
        preStop:
          sleep: {seconds: 5}
```

## Recap and what is next

- Startup probes cover start time, liveness probes restart a stuck container, readiness probes decide whether a Pod gets Service traffic.
- A failing readiness probe sets the endpoint's `ready` condition to false; the Pod keeps running.
- Deleting a Pod runs the preStop hook, then sends SIGTERM, then SIGKILL when the grace period ends; the clock starts before the hook.
- A process that ignores SIGTERM turns every delete and every liveness restart into a 30-second wait.
- Keep liveness checks about the process itself, and give slow starters a startup probe.

Next: part 11, requests, limits and QoS, where you give each container a CPU and memory budget and watch what happens when it goes over. Coming tomorrow.

```rail
id: "explain"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "explain"
        text: "Get documentation for a resource or a field. The explain docs say fields are named as TYPE.FIELDNAME.FIELDNAME and the text comes from the API server OpenAPI schema."
      - token: "pod.spec.containers.readinessProbe.periodSeconds"
        text: "An argument of this command: pod.spec.containers.readinessProbe.periodSeconds."
```

```rail
id: "apply-web-yaml-rollout"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "apply"
        text: "Apply a configuration to a resource by file name or stdin. The apply docs say the resource is created if it does not exist yet. JSON and YAML are accepted."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "web.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "rollout"
        text: "The command group for rollout actions."
      - token: "status"
        text: "Show the status of a rollout and wait until it finishes."
      - token: "deployment/web"
        text: "The resource written as type/name: deployment/web."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
```

```rail
id: "exec-k8s-from-zero-web-b44cbc97c-8ptgj"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "web-b44cbc97c-8ptgj"
        text: "An argument of this command: web-b44cbc97c-8ptgj."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "rm"
        text: "Removes the named files."
      - token: "/usr/share/nginx/html/index.html"
        text: "A path inside the container: /usr/share/nginx/html/index.html."
```

```rail
id: "get-pods-k8s-from-zero"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
```

```rail
id: "get-endpointslice-k8s-from-zero"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "endpointslice"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "kubernetes.io/service-name=web"
        text: "The label query passed to --selector: kubernetes.io/service-name=web."
      - token: "\\"
        text: "Shell. Continues the command on the next line."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{range .items[*].endpoints[*]}{.addresses[0]}{\"  \"}{.targetRef.name}{\"  ready=\"}{.conditions.ready}{\"\\n\"}{end}'"
        text: "jsonpath is an output format. A template is JSONPath expressions in curly braces. The JSONPath page says a double-quoted string inserts text, and its example uses a quoted backslash-n for a newline. This token is the template in the lesson command."
```

```rail
id: "describe-pod-k8s-from-zero"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "describe"
        text: "Show details of a specific resource or group of resources. The describe docs say this includes related resources such as events or controllers."
      - token: "pod"
        text: "The resource type."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "web-b44cbc97c-8ptgj"
        text: "An argument of this command: web-b44cbc97c-8ptgj."
```

```rail
id: "exec-k8s-from-zero-web-b44cbc97c-8ptgj-7"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "web-b44cbc97c-8ptgj"
        text: "An argument of this command: web-b44cbc97c-8ptgj."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "sh"
        text: "An argument of the command inside the container: sh."
      - token: "-c"
        text: "Short form of --container. It names which container in the Pod receives this request."
      - token: "'echo back > /usr/share/nginx/html/index.html'"
        text: "A quoted command string run inside the container."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
```

```rail
id: "apply-stuck-yaml-get"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "apply"
        text: "Apply a configuration to a resource by file name or stdin. The apply docs say the resource is created if it does not exist yet. JSON and YAML are accepted."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "stuck.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "stuck"
        text: "The object name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "--watch"
        text: "After listing the requested object, watch for changes."
```

```rail
id: "describe-pod-stuck"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "describe"
        text: "Show details of a specific resource or group of resources. The describe docs say this includes related resources such as events or controllers."
      - token: "pod"
        text: "The resource type."
      - token: "stuck"
        text: "The object name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
```

```rail
id: "get-pod-stuck"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "stuck"
        text: "The object name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{.status.containerStatuses[0].lastState}'"
        text: "jsonpath is an output format. A template is JSONPath expressions in curly braces. The JSONPath page says a double-quoted string inserts text, and its example uses a quoted backslash-n for a newline. This token is the template in the lesson command."
```

```rail
id: "apply-slow-yaml-get"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "apply"
        text: "Apply a configuration to a resource by file name or stdin. The apply docs say the resource is created if it does not exist yet. JSON and YAML are accepted."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "slow.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "slow"
        text: "The object name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "#"
        text: "An argument of this command: #."
      - token: "at"
        text: "An argument of this command: at."
      - token: "about"
        text: "An argument of this command: about."
      - token: "15"
        text: "A numeric argument in this command."
      - token: "seconds"
        text: "An argument of this command: seconds."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "slow"
        text: "The object name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "#"
        text: "An argument of this command: #."
      - token: "at"
        text: "An argument of this command: at."
      - token: "about"
        text: "An argument of this command: about."
      - token: "30"
        text: "A numeric argument in this command."
      - token: "seconds"
        text: "An argument of this command: seconds."
```

```rail
id: "apply-impatient-yaml-describe"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "apply"
        text: "Apply a configuration to a resource by file name or stdin. The apply docs say the resource is created if it does not exist yet. JSON and YAML are accepted."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "impatient.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "describe"
        text: "Show details of a specific resource or group of resources. The describe docs say this includes related resources such as events or controllers."
      - token: "pod"
        text: "The resource type."
      - token: "impatient"
        text: "The object name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
```

```rail
id: "delete-pod-stuck"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "pod"
        text: "The resource type."
      - token: "stuck"
        text: "The object name."
      - token: "slow"
        text: "The object name."
      - token: "impatient"
        text: "The object name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
```

```rail
id: "apply-graceful-yaml-deaf-yaml"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "apply"
        text: "Apply a configuration to a resource by file name or stdin. The apply docs say the resource is created if it does not exist yet. JSON and YAML are accepted."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "graceful.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "deaf.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "logs"
        text: "Print the logs for a container in a pod or specified resource. If the pod has only one container, the container name is optional."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration."
      - token: "graceful"
        text: "The file named by --filename."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "--timestamps"
        text: "Include timestamps on each log line."
      - token: "#"
        text: "An argument of this command: #."
      - token: "second"
        text: "An argument of this command: second."
      - token: "terminal"
        text: "An argument of this command: terminal."
      - token: "time"
        text: "An argument of this command: time."
      - token: "kubectl"
        text: "An argument of this command: kubectl."
      - token: "delete"
        text: "An argument of this command: delete."
      - token: "pod"
        text: "An argument of this command: pod."
      - token: "graceful"
        text: "An argument of this command: graceful."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "An argument of this command: k8s-from-zero."
```

```rail
id: "time-delete-pod"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "time"
        text: "An argument of this command: time."
      - token: "kubectl"
        text: "An argument of this command: kubectl."
      - token: "delete"
        text: "An argument of this command: delete."
      - token: "pod"
        text: "An argument of this command: pod."
      - token: "deaf"
        text: "An argument of this command: deaf."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "An argument of this command: k8s-from-zero."
```

```rail
id: "delete-pod-web-b44cbc97c-8ptgj"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "pod"
        text: "The resource type."
      - token: "web-b44cbc97c-8ptgj"
        text: "The object name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "--wait=false"
        text: "Do not wait for the objects to finish deleting. The delete docs say --wait defaults to true."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "endpointslice"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "kubernetes.io/service-name=web"
        text: "The label query passed to --selector: kubernetes.io/service-name=web."
      - token: "\\"
        text: "Shell. Continues the command on the next line."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{range .items[*].endpoints[*]}{.targetRef.name}{\"  \"}{.conditions}{\"\\n\"}{end}'"
        text: "jsonpath is an output format. A template is JSONPath expressions in curly braces. The JSONPath page says a double-quoted string inserts text, and its example uses a quoted backslash-n for a newline. This token is the template in the lesson command."
```
