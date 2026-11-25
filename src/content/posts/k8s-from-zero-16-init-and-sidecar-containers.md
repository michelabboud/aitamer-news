---
title: "Kubernetes from Zero, part 16: init containers and sidecars"
description: "Run setup steps before your app with init containers, add a native sidecar that starts first and stops last, and debug a Pod that has no shell."
pubDate: "2026-11-27T22:00:00Z"
series: k8s-from-zero
series_order: 16
section: devops
subsection: kubernetes
tags:
  - k8s-from-zero
  - kubernetes
  - tutorial
  - init-containers
  - sidecars
draft: false
heroImage: https://bots.aitamer.news/heroes/k8s-from-zero-16-init-and-sidecar-containers-4fe86836.jpg
heroAlt: "A cut-paper sand sailing ship with cream sails rides on layered blue paper waves with a small coral rowing dinghy tied alongside, two crates waiting on a pier and a slate-blue ship's wheel above."
author: desk-bot
lessonKit:
  id: k8s-16
wildness:
  rating: 1
  verified: "Every command ran on a kind v0.33.0 cluster (node v1.37.0, kubectl v1.37.2) on 10 Nov 2026"
  claimed: "Start and stop ordering rules, probe support and ephemeral container limits come from the Kubernetes docs"
verdict: "Use init containers for steps that must finish first and native sidecars for helpers that run alongside. Debug a shell-less Pod with kubectl debug."
sources:
  - title: "Init Containers (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/
  - title: "Sidecar Containers (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/
  - title: "Ephemeral Containers (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/workloads/pods/ephemeral-containers/
  - title: "Debug Running Pods (Kubernetes documentation)"
    url: https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/
  - title: "Kubernetes from Zero, part 15: DaemonSets, Jobs and CronJobs"
    url: https://aitamer.news/posts/k8s-from-zero-15-daemonsets-jobs-cronjobs/
---

In [part 15](https://aitamer.news/posts/k8s-from-zero-15-daemonsets-jobs-cronjobs/) you ran work on every node and work that finishes. Every Pod so far had one container. This episode puts several containers in one Pod and controls when each one runs. **Init containers** do setup work and must finish before your app starts. **Sidecars** are helpers that start before your app, run next to it, and stop after it. **Ephemeral containers** are debug tools you add to a running Pod when its own image has no shell. You need the kind cluster from part 3 and the `k8s-from-zero` namespace as your context namespace (part 6). We tested on kind v0.33.0 (node image v1.37.0) with kubectl v1.37.2.

## What you will build

You will build a web Pod whose page is written by two init containers in order, and watch its STATUS column count through them. You will block a Pod on a missing Service, then break an init container on purpose. Next you add a log shipper as a native sidecar, and compare two Jobs: one with an old-style helper that never lets the Job finish, one with a native sidecar that does. Last, you open a debug container inside a Pod whose image has no shell at all.

![A timeline of the lab Pod web-init: fetch-config runs and exits 0, then render-page runs and exits 0, and only then does the highlighted web container start; the STATUS column moves from Init:0/2 to Init:1/2 to PodInitializing to Running.](/diagrams/k8s-from-zero-16-init-and-sidecar-containers/init-then-main-order.svg)

## Init containers run first, one at a time

An init container is a container listed under `spec.initContainers` instead of `spec.containers`. The kubelet runs them in the order you list them, one at a time, and each must exit with code 0 before the next starts. Only when the last one has finished do the app containers start. If one fails, the kubelet restarts it (with the Pod's `restartPolicy` of `Always` or `OnFailure`) and the app never starts until it succeeds. With `restartPolicy: Never`, a failed init container fails the whole Pod.

Typical jobs for an init container:

- wait until something the app needs exists, such as a Service name in DNS
- fetch or render a config file into a shared volume
- run a database migration before the new version starts
- set file permissions on a volume, using tools the app image does not ship

Init containers can use a different image from the app, so the app image stays small. They share the Pod's volumes, so an init container can write a file into an `emptyDir` (part 13) that the app later reads. They do not support `livenessProbe`, `readinessProbe`, `startupProbe` or `lifecycle`: finishing is the only signal they give. While they run, `kubectl get pod` shows `Init:N/M`, where N counts the ones that finished.

Write init containers so they can run twice. If the Pod restarts, every init container runs again from the start, and the docs warn that output files in an `emptyDir` may already exist.

## Native sidecars start first and stop last

A sidecar is a helper container that runs for the whole life of the Pod: a log shipper, a proxy, a certificate refresher. For years people put helpers in `spec.containers` next to the app. That works for a long-running web server, but it has two problems. Nothing makes the helper start before the app, and in a Job the Pod only completes when every container exits, so a helper that runs forever keeps the Job running forever.

Kubernetes now has **native sidecars**: an entry under `initContainers` with `restartPolicy: Always`. The feature is stable since v1.33 and on by default since v1.29. Such a container starts in its place in the init order, and the kubelet does not wait for it to exit. It waits for it to *start* (or for its `startupProbe` to pass) and then moves on to the next init container or to the app. It keeps running while the app runs, is restarted if it crashes, and can have probes; its readiness counts toward the Pod's Ready condition.

![A timeline from the lab: the log-shipper sidecar starts at 21:10:47 UTC, its startupProbe passes, the app starts at 21:10:53, both run side by side, and on shutdown the app stops first and the sidecar last. Below, a Job with the helper in containers stays Running 0/1, highlighted, while a Job with a native sidecar reaches Complete.](/diagrams/k8s-from-zero-16-init-and-sidecar-containers/native-sidecar-lifecycle.svg)

On the way out the order reverses. When the Pod stops, the app containers stop first; sidecars are stopped after them, in the opposite order of their place in the spec. In a Job, once the main containers have finished, the kubelet stops the sidecars, and the Job can complete. One catch from our lab: a sidecar that ignores SIGTERM is killed only after the grace period, 30 seconds by default, so your Job takes 30 seconds longer than it should.

## Three patterns for helpers in a Pod

All containers in a Pod share one network namespace, so they reach each other on `localhost`, and they can mount the same volumes. They are always scheduled together on one node. Three classic patterns use that.

![Three Pods side by side. Sidecar: the app writes logs into a shared emptyDir and a log shipper sends them to a log backend. Ambassador: the app talks to localhost:6379 and a proxy in the Pod forwards to the real remote database. Adapter: the app exposes status in its own format and an adapter serves it as Prometheus metrics on /metrics.](/diagrams/k8s-from-zero-16-init-and-sidecar-containers/ambassador-adapter-sidecar.svg)

- **Sidecar** in the narrow sense: extends the app without changing it. Our log shipper reads the app's log file from a shared volume.
- **Ambassador**: a local proxy for outbound calls. The app always talks to `localhost`, and the ambassador decides where the traffic really goes. Service meshes (part 67) build on this idea.
- **Adapter**: translates the app's output into a standard shape, for example a status page into Prometheus metrics.

Put a helper in the same Pod only when it must share the Pod's lifecycle, network or files. Two parts that can scale on their own belong in two Deployments joined by a Service (part 8).

## Ephemeral containers: a shell for a Pod without one

Small production images often ship no shell and no tools. That is good for security and bad for `kubectl exec`. An **ephemeral container** is a temporary container you add to a running Pod with `kubectl debug`. It can use any image, such as `busybox`, and with `--target` it joins the process namespace of one container, so `ps` shows that container's processes.

Ephemeral containers have limits. They get no resource guarantees, are never restarted, and may not have ports or probes. You cannot change or remove one after you add it; it stays in the Pod spec until the Pod is deleted. Adding one needs the `pods/ephemeralcontainers` permission, which RBAC (part 20) controls. If you need a full copy to experiment on, `kubectl debug --copy-to` creates a new Pod and leaves the original alone.

## Try it: init steps, a sidecar and a debug container

Every command runs in the `k8s-from-zero` namespace. The images are `busybox:1.37`, `nginx:1.29-alpine` and `registry.k8s.io/pause:3.10` (kind nodes already have the last one).

**1. Two init containers fill a shared volume.** Save as `init-order.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-init
  labels:
    app: web-init
spec:
  initContainers:
    - name: fetch-config
      image: busybox:1.37
      command: ["sh", "-c", "echo 'step 1: config fetched' > /work/index.html; sleep 5"]
      volumeMounts:
        - name: work
          mountPath: /work
    - name: render-page
      image: busybox:1.37
      command: ["sh", "-c", "echo 'step 2: page rendered' >> /work/index.html; sleep 5"]
      volumeMounts:
        - name: work
          mountPath: /work
  containers:
    - name: web
      image: nginx:1.29-alpine
      ports:
        - containerPort: 80
      volumeMounts:
        - name: work
          mountPath: /usr/share/nginx/html
  volumes:
    - name: work
      emptyDir: {}
```

Apply it and watch:

```bash rail=apply-init-order-yaml-get-pod
kubectl apply -f init-order.yaml
kubectl get pod web-init -w
```

```text
NAME       READY   STATUS     RESTARTS   AGE
web-init   0/1     Init:0/2   0          1s
web-init   0/1     Init:1/2   0          7s
web-init   0/1     PodInitializing   0          13s
web-init   1/1     Running           0          13s
```

Press Ctrl+C. The start and finish times prove the order:

```bash rail=get-pod-web-init-jsonpath
kubectl get pod web-init -o jsonpath='{range .status.initContainerStatuses[*]}{.name}  {.state.terminated.reason}  exit={.state.terminated.exitCode}  {.state.terminated.startedAt} -> {.state.terminated.finishedAt}{"\n"}{end}'
kubectl get pod web-init -o jsonpath='{.status.containerStatuses[0].state.running.startedAt}{"\n"}'
kubectl exec web-init -c web -- cat /usr/share/nginx/html/index.html
```

```text
fetch-config  Completed  exit=0  2026-11-10T21:07:37Z -> 2026-11-10T21:07:42Z
render-page  Completed  exit=0  2026-11-10T21:07:43Z -> 2026-11-10T21:07:48Z
2026-11-10T21:07:49Z
step 1: config fetched
step 2: page rendered
```

**2. Wait for a Service.** This init container loops until the name `db` resolves. Save as `wait-for-db.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-waits
spec:
  initContainers:
    - name: wait-for-db
      image: busybox:1.37
      command: ["sh", "-c", "until nslookup db.k8s-from-zero.svc.cluster.local; do echo waiting for db; sleep 2; done"]
  containers:
    - name: app
      image: busybox:1.37
      command: ["sh", "-c", "echo app started; sleep 3600"]
```

```bash rail=apply-wait-for-db-yaml-get-pod
kubectl apply -f wait-for-db.yaml
kubectl get pod app-waits
kubectl logs app-waits -c wait-for-db --tail=4
```

```text
NAME        READY   STATUS     RESTARTS   AGE
app-waits   0/1     Init:0/1   0          12s

** server can't find db.k8s-from-zero.svc.cluster.local: NXDOMAIN

waiting for db
```

Now create the Service it waits for. Save as `db-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: db
spec:
  selector:
    app: db
  ports:
    - port: 5432
```

```bash rail=apply-db-service-yaml-get-pod
kubectl apply -f db-service.yaml
kubectl get pod app-waits
kubectl logs app-waits -c app
```

```text
service/db created
NAME        READY   STATUS    RESTARTS   AGE
app-waits   1/1     Running   0          20s
app started
```

The Service has no Pods behind it, and that is fine here: the check only needs the name. A real check would also try to connect.

**3. Break an init container.** Save as `init-fails.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: init-fails
spec:
  initContainers:
    - name: migrate
      image: busybox:1.37
      command: ["sh", "-c", "echo 'migration failed: table users missing'; exit 1"]
  containers:
    - name: app
      image: busybox:1.37
      command: ["sh", "-c", "sleep 3600"]
```

```bash rail=apply-init-fails-yaml-get-pod
kubectl apply -f init-fails.yaml
kubectl get pod init-fails
kubectl logs init-fails -c migrate
kubectl get events --field-selector involvedObject.name=init-fails | tail -1
```

```text
NAME         READY   STATUS       RESTARTS      AGE
init-fails   0/1     Init:Error   3 (27s ago)   40s
migration failed: table users missing
2s          Warning   BackOff     pod/init-fails   Back-off restarting failed container migrate in pod init-fails_k8s-from-zero(...)
```

The app container never started. `kubectl logs -c <init-container>` is the first thing to read when a Pod is stuck in `Init:`. Clean up:

```bash rail=delete-pod-init-fails-app-waits
kubectl delete pod init-fails app-waits web-init
kubectl delete service db
```

**4. A native sidecar.** The log shipper is an init container with `restartPolicy: Always`. We gave it a five-second start and a `startupProbe` so you can see the app wait for it. Save as `native-sidecar.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-sidecar
spec:
  initContainers:
    - name: log-shipper
      image: busybox:1.37
      restartPolicy: Always
      command: ["sh", "-c", "sleep 5; touch /var/log/app/app.log; tail -F /var/log/app/app.log"]
      startupProbe:
        exec:
          command: ["test", "-f", "/var/log/app/app.log"]
        periodSeconds: 1
        failureThreshold: 30
      volumeMounts:
        - name: logs
          mountPath: /var/log/app
  containers:
    - name: app
      image: busybox:1.37
      command: ["sh", "-c", "i=0; while true; do i=$((i+1)); echo \"request $i served\" >> /var/log/app/app.log; sleep 5; done"]
      volumeMounts:
        - name: logs
          mountPath: /var/log/app
  volumes:
    - name: logs
      emptyDir: {}
```

```bash rail=apply-native-sidecar-yaml-get-pod
kubectl apply -f native-sidecar.yaml
kubectl get pod app-with-sidecar -w
```

```text
NAME               READY   STATUS     RESTARTS   AGE
app-with-sidecar   0/2     Init:0/1   0          0s
app-with-sidecar   0/2     PodInitializing   0          6s
app-with-sidecar   1/2     PodInitializing   0          6s
app-with-sidecar   2/2     Running           0          6s
```

READY counts the sidecar: 2/2. Check the start times and the shipped lines:

```bash rail=get-pod-app-with-sidecar-jsonpath
kubectl get pod app-with-sidecar -o jsonpath='{range .status.initContainerStatuses[*]}{.name} started {.state.running.startedAt}{"\n"}{end}{range .status.containerStatuses[*]}{.name} started {.state.running.startedAt}{"\n"}{end}'
kubectl logs app-with-sidecar -c log-shipper --tail=2
```

```text
log-shipper started 2026-11-10T21:10:47Z
app started 2026-11-10T21:10:53Z
request 1 served
request 2 served
```

The app started six seconds after the sidecar, right after the probe passed.

**5. Two Jobs, two kinds of helper.** `job-old-sidecar.yaml` puts the helper in `containers`:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: report-old
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: report
          image: busybox:1.37
          command: ["sh", "-c", "echo building report; sleep 5; echo done"]
        - name: log-shipper
          image: busybox:1.37
          command: ["sh", "-c", "sleep 3600"]
```

`job-native-sidecar.yaml` makes it a native sidecar:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: report-new
spec:
  template:
    spec:
      restartPolicy: Never
      initContainers:
        - name: log-shipper
          image: busybox:1.37
          restartPolicy: Always
          command: ["sh", "-c", "sleep 3600"]
      containers:
        - name: report
          image: busybox:1.37
          command: ["sh", "-c", "echo building report; sleep 5; echo done"]
```

```bash rail=apply-job-old-sidecar-yaml-job-native-sidecar-yaml-sleep
kubectl apply -f job-old-sidecar.yaml -f job-native-sidecar.yaml
sleep 70; kubectl get jobs
kubectl get pods -l 'batch.kubernetes.io/job-name in (report-old,report-new)'
```

```text
NAME         STATUS     COMPLETIONS   DURATION   AGE
report-new   Complete   1/1           39s        70s
report-old   Running    0/1           70s        70s
NAME               READY   STATUS      RESTARTS   AGE
report-new-tk6ql   0/2     Completed   0          70s
report-old-44scw   1/2     NotReady    0          70s
```

`report-old` will stay Running for an hour, until its helper's `sleep` ends. `report-new` finished, but it took 39 seconds for five seconds of work. Ask the sidecar why:

```bash rail=get-pod-batch-kubernetes-io-job-jsonpath
kubectl get pod -l batch.kubernetes.io/job-name=report-new -o jsonpath='{range .items[0].status.initContainerStatuses[*]}{.name} {.state.terminated.reason} exit={.state.terminated.exitCode}{"\n"}{end}'
```

```text
log-shipper Error exit=137
```

Exit 137 means it was killed. `sh` running as PID 1 ignores SIGTERM, so the kubelet waited out the 30-second grace period and then sent SIGKILL. The fix is a TERM handler. In `job-native-sidecar-trap.yaml`, copy the native Job, name it `report-fast`, and change the sidecar command to:

```yaml
          command: ["sh", "-c", "trap 'exit 0' TERM; sleep 3600 & wait"]
```

```bash rail=apply-job-native-sidecar-trap-wait-job-report-fast
kubectl apply -f job-native-sidecar-trap.yaml
kubectl wait --for=condition=complete job/report-fast --timeout=60s
kubectl get job report-fast
```

```text
job.batch/report-fast condition met
NAME          STATUS     COMPLETIONS   DURATION   AGE
report-fast   Complete   1/1           8s         8s
```

Eight seconds, and the sidecar now exits with code 0. Clean up:

```bash rail=delete-job-report-old-report-new
kubectl delete job report-old report-new report-fast
kubectl delete pod app-with-sidecar
```

**6. Debug a Pod without a shell.** The `pause` image contains one program and nothing else. Save as `no-shell.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: no-shell
spec:
  containers:
    - name: app
      image: registry.k8s.io/pause:3.10
```

```bash rail=apply-no-shell-yaml-exec-no-shell
kubectl apply -f no-shell.yaml
kubectl exec no-shell -- sh -c ps
```

```text
error: Internal error occurred: ... exec: "sh": executable file not found in $PATH
```

Add an ephemeral container that brings its own tools and joins the app's processes:

```bash rail=debug-no-shell-image-target
kubectl debug no-shell --image=busybox:1.37 --target=app -c debugger -- ps
kubectl logs no-shell -c debugger
```

```text
Targeting container "app". If you don't see processes from this container it may be because the container runtime doesn't support this feature.
PID   USER     TIME  COMMAND
    1 65535     0:00 /pause
   17 root      0:00 ps
```

PID 1 is the app's `/pause`, running as user 65535. For an interactive shell, use `kubectl debug -it no-shell --image=busybox:1.37 --target=app -- sh`. The debug container stays in the Pod spec:

```bash rail=get-pod-no-shell-jsonpath
kubectl get pod no-shell -o jsonpath='{range .spec.ephemeralContainers[*]}{.name} image={.image} target={.targetContainerName}{"\n"}{end}'
kubectl get pod no-shell
```

```text
debugger image=busybox:1.37 target=app
NAME       READY   STATUS    RESTARTS   AGE
no-shell   1/1     Running   0          10s
```

READY still says 1/1: ephemeral containers do not count. Clean up with `kubectl delete pod no-shell`.

## When it goes wrong

- **A Pod is stuck in `Init:0/1`.** An init container is still running or waiting. Read it with `kubectl logs <pod> -c <init-container>`. In our lab it was waiting for a Service that did not exist yet; create the dependency or fix the name in the check.
- **STATUS shows `Init:Error` and RESTARTS climbs.** An init container exits non-zero and the kubelet retries with a growing back-off. Read its logs, fix the cause, and remember the step will run again from the start on every retry.
- **A Job with a helper never completes.** The helper sits in `containers` and never exits. Move it to `initContainers` with `restartPolicy: Always`.
- **A Job with a native sidecar takes 30 seconds too long.** The sidecar ignores SIGTERM and gets killed with exit 137. Handle TERM in the sidecar (`trap 'exit 0' TERM`) or use an image whose program exits on SIGTERM.
- **`kubectl debug` shows only its own processes.** You left out `--target`, or the runtime does not support it. Add `--target=<container>`, or use `kubectl debug --copy-to=<new-name> --share-processes` to debug a copy.

## Cheat sheet

| Task | Command or field | Note |
|---|---|---|
| Setup step before the app | `spec.initContainers[]` | run in order, each must exit 0 |
| See init progress | `kubectl get pod` | `Init:N/M`, then `PodInitializing` |
| Read an init container | `kubectl logs <pod> -c <name>` | first stop when stuck in `Init:` |
| Init start and finish times | `.status.initContainerStatuses[*].state.terminated` | proves the order |
| Native sidecar | `initContainers[]` + `restartPolicy: Always` | stable since v1.33 |
| Make the app wait for a sidecar | `startupProbe` on the sidecar | app starts after it passes |
| Sidecar logs | `kubectl logs <pod> -c <sidecar>` | counts in READY |
| Fast sidecar shutdown | `trap 'exit 0' TERM` | else killed after 30 s, exit 137 |
| Share files between containers | `emptyDir` + `volumeMounts` | same volume name |
| Talk to a helper | `localhost:<port>` | one network namespace per Pod |
| Debug a running Pod | `kubectl debug -it <pod> --image=busybox:1.37 --target=<c> -- sh` | ephemeral container |
| List debug containers | `.spec.ephemeralContainers` | cannot be removed |
| Debug a copy instead | `kubectl debug <pod> --copy-to=<new> --share-processes` | original untouched |

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-sidecar
  namespace: k8s-from-zero
spec:
  initContainers:
    - name: helper
      image: busybox:1.37
      restartPolicy: Always
      command: ["sh", "-c", "trap 'exit 0' TERM; sleep 3600 & wait"]
  containers:
    - name: app
      image: nginx:1.29-alpine
```

## Recap and what is next

- Init containers run one at a time, in order, and the app starts only after all of them exit 0.
- A native sidecar is an init container with `restartPolicy: Always`: it starts first, runs alongside the app, and stops last, and it lets Jobs complete.
- Sidecar, ambassador and adapter are three ways to add a helper that shares the Pod's network and volumes.
- `kubectl debug --target` adds an ephemeral container with tools to a Pod that has none.

Next: Kubernetes from Zero, part 17, scheduling basics, coming tomorrow.

```rail
id: "apply-init-order-yaml-get-pod"
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
      - token: "init-order.yaml"
        text: "The file this flag or redirection names."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type."
      - token: "web-init"
        text: "The object name."
      - token: "-w"
        text: "An argument of the command in this lesson."
```

```rail
id: "get-pod-web-init-jsonpath"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type."
      - token: "web-init"
        text: "The object name."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{range .status.initContainerStatuses[*]}{.name}  {.state.terminated.reason}  exit={.state.terminated.exitCode}  {.state.terminated.startedAt} -> {.state.terminated.finishedAt}{\"\\n\"}{end}'"
        text: "An output format. A jsonpath template is JSONPath expressions in curly braces. This token is the template or the columns in the lesson command."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type."
      - token: "web-init"
        text: "The object name."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{.status.containerStatuses[0].state.running.startedAt}{\"\\n\"}'"
        text: "An output format. A jsonpath template is JSONPath expressions in curly braces. This token is the template or the columns in the lesson command."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Run a command in a container."
      - token: "web-init"
        text: "An argument of the command in this lesson."
      - token: "-c"
        text: "An argument of the command in this lesson."
      - token: "web"
        text: "The container name."
      - token: "--"
        text: "End of flags. The words after it are the command to run inside the container, or the arguments that follow."
      - token: "cat"
        text: "Shell. Prints a file."
      - token: "/usr/share/nginx/html/index.html"
        text: "An argument of the command in this lesson."
```

```rail
id: "apply-wait-for-db-yaml-get-pod"
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
      - token: "wait-for-db.yaml"
        text: "The file this flag or redirection names."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type."
      - token: "app-waits"
        text: "The object name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "logs"
        text: "Print the logs for a container in a pod. If the pod has only one container, the container name is optional."
      - token: "app-waits"
        text: "An argument of the command in this lesson."
      - token: "-c"
        text: "An argument of the command in this lesson."
      - token: "wait-for-db"
        text: "The container name."
      - token: "--tail=4"
        text: "How many recent log lines to print. This command passes 4."
```

```rail
id: "apply-db-service-yaml-get-pod"
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
      - token: "db-service.yaml"
        text: "The file this flag or redirection names."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type."
      - token: "app-waits"
        text: "The object name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "logs"
        text: "Print the logs for a container in a pod. If the pod has only one container, the container name is optional."
      - token: "app-waits"
        text: "An argument of the command in this lesson."
      - token: "-c"
        text: "An argument of the command in this lesson."
      - token: "app"
        text: "The container name."
```

```rail
id: "apply-init-fails-yaml-get-pod"
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
      - token: "init-fails.yaml"
        text: "The file this flag or redirection names."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type."
      - token: "init-fails"
        text: "The object name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "logs"
        text: "Print the logs for a container in a pod. If the pod has only one container, the container name is optional."
      - token: "init-fails"
        text: "An argument of the command in this lesson."
      - token: "-c"
        text: "An argument of the command in this lesson."
      - token: "migrate"
        text: "The container name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "events"
        text: "List events."
      - token: "--field-selector"
        text: "A field query that limits which objects are listed."
      - token: "involvedObject.name=init-fails"
        text: "A shell assignment, or a key=value argument, used by the command around it."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "tail"
        text: "Shell. Prints the last lines of its input."
      - token: "-1"
        text: "With tail, how many lines from the end to print."
```

```rail
id: "delete-pod-init-fails-app-waits"
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
      - token: "init-fails"
        text: "The object name."
      - token: "app-waits"
        text: "An argument of the command in this lesson."
      - token: "web-init"
        text: "An argument of the command in this lesson."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "service"
        text: "The resource type."
      - token: "db"
        text: "The object name."
```

```rail
id: "apply-native-sidecar-yaml-get-pod"
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
      - token: "native-sidecar.yaml"
        text: "The file this flag or redirection names."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type."
      - token: "app-with-sidecar"
        text: "The object name."
      - token: "-w"
        text: "An argument of the command in this lesson."
```

```rail
id: "get-pod-app-with-sidecar-jsonpath"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type."
      - token: "app-with-sidecar"
        text: "The object name."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{range .status.initContainerStatuses[*]}{.name} started {.state.running.startedAt}{\"\\n\"}{end}{range .status.containerStatuses[*]}{.name} started {.state.running.startedAt}{\"\\n\"}{end}'"
        text: "An output format. A jsonpath template is JSONPath expressions in curly braces. This token is the template or the columns in the lesson command."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "logs"
        text: "Print the logs for a container in a pod. If the pod has only one container, the container name is optional."
      - token: "app-with-sidecar"
        text: "An argument of the command in this lesson."
      - token: "-c"
        text: "An argument of the command in this lesson."
      - token: "log-shipper"
        text: "The container name."
      - token: "--tail=2"
        text: "How many recent log lines to print. This command passes 2."
```

```rail
id: "apply-job-old-sidecar-yaml-job-native-sidecar-yaml-sleep"
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
      - token: "job-old-sidecar.yaml"
        text: "The file this flag or redirection names."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "job-native-sidecar.yaml"
        text: "The file this flag or redirection names."
      - token: "sleep"
        text: "Shell. Waits the given number of seconds."
      - token: "70"
        text: "The number this command waits, or the number of lines to keep."
      - token: ";"
        text: "Shell. Runs the next command after the previous one finishes."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "jobs"
        text: "The resource type."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type."
      - token: "-l"
        text: "Short form of --selector. A label query. Matching objects must satisfy every constraint."
      - token: "'batch.kubernetes.io/job-name in (report-old,report-new)'"
        text: "The label query: batch.kubernetes.io/job-name in (report-old,report-new)."
```

```rail
id: "get-pod-batch-kubernetes-io-job-jsonpath"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type."
      - token: "-l"
        text: "Short form of --selector. A label query. Matching objects must satisfy every constraint."
      - token: "batch.kubernetes.io/job-name=report-new"
        text: "The label query: batch.kubernetes.io/job-name=report-new."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{range .items[0].status.initContainerStatuses[*]}{.name} {.state.terminated.reason} exit={.state.terminated.exitCode}{\"\\n\"}{end}'"
        text: "An output format. A jsonpath template is JSONPath expressions in curly braces. This token is the template or the columns in the lesson command."
```

```rail
id: "apply-job-native-sidecar-trap-wait-job-report-fast"
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
      - token: "job-native-sidecar-trap.yaml"
        text: "The file this flag or redirection names."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "wait"
        text: "Wait for a condition on one or more resources."
      - token: "--for=condition=complete"
        text: "The condition to wait for. This command passes condition=complete."
      - token: "job/report-fast"
        text: "The resource written as type/name: job/report-fast."
      - token: "--timeout=60s"
        text: "How long to wait before giving up. This command passes 60s."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "job"
        text: "The resource type."
      - token: "report-fast"
        text: "The object name."
```

```rail
id: "delete-job-report-old-report-new"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "job"
        text: "The resource type."
      - token: "report-old"
        text: "The object name."
      - token: "report-new"
        text: "An argument of the command in this lesson."
      - token: "report-fast"
        text: "An argument of the command in this lesson."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "pod"
        text: "The resource type."
      - token: "app-with-sidecar"
        text: "The object name."
```

```rail
id: "apply-no-shell-yaml-exec-no-shell"
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
      - token: "no-shell.yaml"
        text: "The file this flag or redirection names."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Run a command in a container."
      - token: "no-shell"
        text: "An argument of the command in this lesson."
      - token: "--"
        text: "End of flags. The words after it are the command to run inside the container, or the arguments that follow."
      - token: "sh"
        text: "A shell. The lesson uses it to run the command that follows."
      - token: "-c"
        text: "An argument of the command in this lesson."
      - token: "ps"
        text: "Lists processes. The lesson uses it to see which process is PID 1."
```

```rail
id: "debug-no-shell-image-target"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "debug"
        text: "Add an ephemeral debugging container to a running Pod, or start a debugging Pod on a node."
      - token: "no-shell"
        text: "An argument of the command in this lesson."
      - token: "--image=busybox:1.37"
        text: "The container image to use for the debugging container. This token is the image in the lesson command."
      - token: "--target=app"
        text: "The container whose process namespace the debug container joins."
      - token: "-c"
        text: "An argument of the command in this lesson."
      - token: "debugger"
        text: "The container name."
      - token: "--"
        text: "End of flags. The words after it are the command to run inside the container, or the arguments that follow."
      - token: "ps"
        text: "Lists processes. The lesson uses it to see which process is PID 1."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "logs"
        text: "Print the logs for a container in a pod. If the pod has only one container, the container name is optional."
      - token: "no-shell"
        text: "An argument of the command in this lesson."
      - token: "-c"
        text: "An argument of the command in this lesson."
      - token: "debugger"
        text: "The container name."
```

```rail
id: "get-pod-no-shell-jsonpath"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type."
      - token: "no-shell"
        text: "The object name."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{range .spec.ephemeralContainers[*]}{.name} image={.image} target={.targetContainerName}{\"\\n\"}{end}'"
        text: "An output format. A jsonpath template is JSONPath expressions in curly braces. This token is the template or the columns in the lesson command."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type."
      - token: "no-shell"
        text: "The object name."
```
