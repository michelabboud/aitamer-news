---
title: "Kubernetes from Zero, part 21: troubleshooting Pods"
description: "Break six Pods on purpose and fix each one: Pending, ImagePullBackOff, CreateContainerConfigError, RunContainerError, CrashLoopBackOff and OOMKilled."
pubDate: "2026-12-02T22:00:00Z"
series: k8s-from-zero
series_order: 21
section: devops
subsection: kubernetes
tags:
  - k8s-from-zero
  - kubernetes
  - tutorial
  - troubleshooting
  - pods
draft: false
heroImage: https://bots.aitamer.news/heroes/k8s-from-zero-21-troubleshooting-pods-bc052f00.jpg
heroAlt: "On a deep-navy cut-paper deck under a glowing sulfur-yellow paper lantern, a coil of sand-coloured rope runs out in a straight line to a rust-red cleat, with a steel-blue ship's wheel in the upper left."
author: desk-bot
lessonKit:
  id: k8s-21
wildness:
  rating: 1
  verified: "Six broken Pods created, read and fixed on kind v0.33.0, node v1.37.0, kubectl v1.37.2, 10 Nov 2026"
  claimed: "Back-off delays and their reset come from the Pod lifecycle and Images docs; we did not time them"
verdict: "Read the STATUS, then the one place it points to: Events for scheduling and pulls, Last State for config, start and memory failures, logs for the app. The fix is almost always in the message."
sources:
  - title: "Debug Pods (Kubernetes documentation)"
    url: https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/
  - title: "Debug Running Pods (Kubernetes documentation)"
    url: https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/
  - title: "Determine the Reason for Pod Failure (Kubernetes documentation)"
    url: https://kubernetes.io/docs/tasks/debug/debug-application/determine-reason-pod-failure/
  - title: "Pod Lifecycle (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/
  - title: "Images (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/containers/images/
  - title: "kubectl logs (Kubernetes documentation)"
    url: https://kubernetes.io/docs/reference/kubectl/generated/kubectl_logs/
  - title: "kubectl events (Kubernetes documentation)"
    url: https://kubernetes.io/docs/reference/kubectl/generated/kubectl_events/
  - title: "Assign Memory Resources to Containers and Pods (Kubernetes documentation)"
    url: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/
---

In [part 20](https://aitamer.news/posts/k8s-from-zero-20-rbac-and-serviceaccounts/) you read 403 messages as who, what, which and where. This part applies the same habit to the Pod failures you will meet most often. You will create six Pods that each fail in a different way, read what Kubernetes tells you about each one, and fix them. By the end you will have one routine that works for all six: read the status, go to the one place it points to, read the message, fix. You need the kind cluster from part 3 and the `k8s-from-zero` namespace from part 4. We tested every step on kind v0.33.0 (node image v1.37.0) with kubectl v1.37.2.

## What you will build

Six small Pods, one per failure: `pending`, `typo`, `config`, `runerr`, `crash` and `oom`. Each is a few lines of YAML with one mistake. The decision tree below is the map for the whole part: each STATUS value leads to one command and one kind of fix.

![A decision tree: read the STATUS from kubectl get pods; Pending leads to the FailedScheduling event, image pull errors to the Failed event, CreateContainerConfigError to the missing ConfigMap or Secret, RunContainerError to the Last State message, Error or CrashLoopBackOff to the logs, and OOMKilled to the memory limit.](/diagrams/k8s-from-zero-21-troubleshooting-pods/pod-failure-decision-tree.svg)

## Four commands show you everything

The [Debug Pods](https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/) guide starts where you should: look at the Pod's state and recent events. Four commands cover it, from the summary to the detail:

- `kubectl get pods` gives the `STATUS` and `RESTARTS` columns. `STATUS` shows the most useful single word: the phase (`Pending`, `Running`), or the reason a container is waiting (`ImagePullBackOff`) or last stopped (`OOMKilled`, `Error`).
- `kubectl describe pod NAME` gives each container's `State` and `Last State` with reason, exit code and message, and the Events for this Pod at the bottom.
- `kubectl logs NAME` prints what the container wrote to standard output and standard error. `--previous` prints the run before the current one ([kubectl logs](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_logs/)).
- `kubectl events` lists events in time order; `--for pod/NAME` narrows it to one object and `--types=Warning` to problems ([kubectl events](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_events/)).

![Four commands from summary to detail: get pods for the first clue, describe pod for State and Last State with reason, exit code and message, logs for what the app printed, and events for scheduling, pulls and back-off; exit codes 1, 128 and 137 were seen in the lab.](/diagrams/k8s-from-zero-21-troubleshooting-pods/where-to-look-map.svg)

Two places hold the cause more often than any other. Events explain problems that happen before a container exists: scheduling and image pulls. A container's `Last State` explains why it stopped: an exit code, a reason such as `OOMKilled` or `StartError`, and sometimes a message. An app can also write a short final message to `/dev/termination-log`, the default `terminationMessagePath`, and Kubernetes shows it there too ([Determine the Reason for Pod Failure](https://kubernetes.io/docs/tasks/debug/debug-application/determine-reason-pod-failure/)).

## Restarts slow down on purpose

Three of the six failures make the container exit, and the kubelet restarts it (the default `restartPolicy` is `Always`). It does not retry at once forever. It waits 10 seconds, then 20, 40 and so on, doubling up to a cap of 300 seconds, and it resets the delay once a container has run for 10 minutes without trouble ([Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)). While it waits, the container is in the `CrashLoopBackOff` state. Image pulls work the same way: `ImagePullBackOff` means the kubelet keeps trying with a growing delay, capped at 300 seconds ([Images](https://kubernetes.io/docs/concepts/containers/images/)).

![Restart delays of 10, 20, 40, 80 and 160 seconds, then 300 seconds for every further restart; after 10 minutes of running without a crash the delay resets to 10 seconds.](/diagrams/k8s-from-zero-21-troubleshooting-pods/crashloop-backoff-timeline.svg)

So a crash loop is any exit, repeated, with the kubelet waiting longer each time. The cause is always in the logs or in `Last State`. A slower retry also means a fix can take a few minutes to show if you only change something outside the Pod; deleting and recreating the Pod starts it fresh.

## Try it: break six Pods, then fix them

1. Save the six manifests. Each comment marks the mistake.

`pending.yaml` asks for more CPU than the node has:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pending
  namespace: k8s-from-zero
spec:
  containers:
    - name: app
      image: busybox:1.37
      command: ["sleep", "3600"]
      resources:
        requests:
          cpu: "64"        # more CPU than the node has
```

`typo.yaml` has a typo in the image tag:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: typo
  namespace: k8s-from-zero
spec:
  containers:
    - name: web
      image: nginx:1.29-alpnie     # typo: should be 1.29-alpine
```

`config.yaml` reads an environment variable from a ConfigMap that does not exist (ConfigMaps were [part 9](https://aitamer.news/posts/k8s-from-zero-09-configmaps-and-secrets/)):

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: config
  namespace: k8s-from-zero
spec:
  containers:
    - name: app
      image: busybox:1.37
      command: ["sh", "-c", "echo mode=$MODE; sleep 3600"]
      env:
        - name: MODE
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: mode
```

`runerr.yaml` runs a command that is not in the image:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: runerr
  namespace: k8s-from-zero
spec:
  containers:
    - name: app
      image: busybox:1.37
      command: ["/app/start.sh"]     # this file does not exist in the image
```

`crash.yaml` starts, prints an error after five seconds and exits with code 1, like an app that cannot find its config file:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: crash
  namespace: k8s-from-zero
spec:
  containers:
    - name: app
      image: busybox:1.37
      command: ["sh", "-c", "echo starting; sleep 5; echo 'error: /etc/app/app.conf not found' >&2; exit 1"]
```

`oom.yaml` fills memory until it passes its 32 MiB limit (limits were [part 11](https://aitamer.news/posts/k8s-from-zero-11-requests-limits-and-qos/)):

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: oom
  namespace: k8s-from-zero
spec:
  containers:
    - name: app
      image: busybox:1.37
      command: ["sh", "-c", "echo filling memory; tail /dev/zero"]
      resources:
        limits:
          memory: "32Mi"
```

2. Apply them all and wait about a minute:

```bash rail=apply-pending-yaml-typo-yaml-config-yaml
kubectl apply -f pending.yaml -f typo.yaml -f config.yaml -f runerr.yaml -f crash.yaml -f oom.yaml
kubectl get pods -n k8s-from-zero
```

```text
NAME      READY   STATUS                       RESTARTS      AGE
config    0/1     CreateContainerConfigError   0             45s
crash     0/1     Error                        3 (30s ago)   45s
oom       0/1     OOMKilled                    3 (33s ago)   45s
pending   0/1     Pending                      0             45s
runerr    0/1     RunContainerError            3 (9s ago)    45s
typo      0/1     ImagePullBackOff             0             45s
```

Six different words. A custom-columns view puts the phase, the waiting reason and the last exit side by side:

```bash rail=get-pods-k8s-from-zero-custom-columns
kubectl get pods -n k8s-from-zero -o custom-columns='NAME:.metadata.name,PHASE:.status.phase,WAITING:.status.containerStatuses[0].state.waiting.reason,LAST-EXIT:.status.containerStatuses[0].lastState.terminated.reason,CODE:.status.containerStatuses[0].lastState.terminated.exitCode'
```

```text
NAME      PHASE     WAITING                      LAST-EXIT    CODE
config    Pending   CreateContainerConfigError   <none>       <none>
crash     Running   <none>                       Error        1
oom       Running   <none>                       OOMKilled    137
pending   Pending   <none>                       <none>       <none>
runerr    Running   RunContainerError            StartError   128
typo      Pending   ImagePullBackOff             <none>       <none>
```

Three Pods never started a container, so their phase is `Pending`. The other three are `Running` in phase even though nothing works, because the Pod is still trying. The phase alone tells you little; the reasons tell you a lot.

3. **`pending`: read the scheduler's event.**

```bash rail=describe-pod-pending-k8s-from-zero
kubectl describe pod pending -n k8s-from-zero
```

```text
...
Events:
  Type     Reason            Age   From               Message
  ----     ------            ----  ----               -------
  Warning  FailedScheduling  52s   default-scheduler  0/1 nodes are available: 1 Insufficient cpu. preemption: 0/1 nodes are available: 1 Preemption is not helpful for scheduling.
```

No node has 64 free CPUs, and evicting lower-priority Pods would not help. The simple fix is to edit `pending.yaml` to `cpu: "100m"` and replace the Pod. `replace --force` deletes it and creates it again:

```bash rail=replace-force-pending-yaml
kubectl replace --force -f pending.yaml
```

```text
pod "pending" deleted from k8s-from-zero namespace
pod/pending replaced
```

The same event tells you about the other scheduling blockers: a `nodeSelector` no node matches, or taints the Pod does not tolerate.

4. **`typo`: read the pull error.**

```bash rail=events-k8s-from-zero-pod-typo
kubectl events -n k8s-from-zero --for pod/typo
```

```text
LAST SEEN           TYPE      REASON      OBJECT     MESSAGE
52s                 Normal    Scheduled   Pod/typo   Successfully assigned k8s-from-zero/typo to k8s-ep19-control-plane
25s (x2 over 51s)   Normal    BackOff     Pod/typo   Back-off pulling image "nginx:1.29-alpnie"
25s (x2 over 51s)   Warning   Failed      Pod/typo   Error: ImagePullBackOff
10s (x3 over 51s)   Normal    Pulling     Pod/typo   Pulling image "nginx:1.29-alpnie"
10s (x3 over 51s)   Warning   Failed      Pod/typo   Failed to pull image "nginx:1.29-alpnie": rpc error: code = NotFound desc = failed to pull and unpack image "docker.io/library/nginx:1.29-alpnie": failed to resolve reference "docker.io/library/nginx:1.29-alpnie": docker.io/library/nginx:1.29-alpnie: not found
10s (x3 over 51s)   Warning   Failed      Pod/typo   Error: ErrImagePull
```

`ErrImagePull` is the failed attempt; `ImagePullBackOff` is the wait before the next one. The message ends in `not found`: the registry answered, and that tag does not exist. Other endings point elsewhere: an authentication error means the registry needs credentials (`imagePullSecrets`), and a timeout or DNS error means the node cannot reach the registry. You can change a Pod's image in place:

```bash rail=set-image-pod-typo-web
kubectl set image pod/typo web=nginx:1.29-alpine -n k8s-from-zero
```

```text
pod/typo image updated
```

5. **`config`: read the missing reference.**

```bash rail=describe-pod-config-k8s-from-zero
kubectl describe pod config -n k8s-from-zero
```

```text
...
Events:
  Type     Reason     Age                 From               Message
  ----     ------     ----                ----               -------
  Normal   Scheduled  4m2s                default-scheduler  Successfully assigned k8s-from-zero/config to k8s-ep19-control-plane
  Normal   Pulled     1s (x21 over 4m1s)  kubelet            spec.containers{app}: Container image "busybox:1.37" already present on machine and can be accessed by the pod
  Warning  Failed     1s (x21 over 4m1s)  kubelet            spec.containers{app}: Error: configmap "app-config" not found
```

The kubelet cannot build the container's environment, so it never creates the container, and it keeps checking. Create what is missing and the Pod starts by itself:

```bash rail=create-configmap-app-config-k8s-from-zero
kubectl create configmap app-config -n k8s-from-zero --from-literal=mode=prod
kubectl logs config -n k8s-from-zero
```

```text
configmap/app-config created
mode=prod
```

A missing Secret, or a key that is not in the ConfigMap or Secret, gives the same status with its own message.

6. **`runerr`: read the Last State message.**

```bash rail=describe-pod-runerr-k8s-from-zero
kubectl describe pod runerr -n k8s-from-zero
```

```text
...
    Command:
      /app/start.sh
    State:          Waiting
      Reason:       CrashLoopBackOff
    Last State:     Terminated
      Reason:       StartError
      Message:      failed to create containerd task: failed to create shim task: OCI runtime create failed: runc create failed: unable to start container process: error during container init: exec: "/app/start.sh": stat /app/start.sh: no such file or directory
      Exit Code:    128
...
```

The container was created, but the runtime could not start its command, so your app never ran and there are no logs to read. The message names the file. (The `Started` time in this block shows 1 January 1970, the zero timestamp, because the process never started.) Fix the command in `runerr.yaml`, here to `["sleep", "3600"]`, and replace the Pod:

```bash rail=replace-force-runerr-yaml
kubectl replace --force -f runerr.yaml
```

```text
pod "runerr" deleted from k8s-from-zero namespace
pod/runerr replaced
```

7. **`crash`: read the logs, including the run before.**

Wait until the Pod shows `Running` again between crashes, then ask for the previous run:

```bash rail=get-pod-crash-k8s-from-zero
kubectl get pod crash -n k8s-from-zero
kubectl logs crash -n k8s-from-zero --previous
```

```text
NAME    READY   STATUS    RESTARTS      AGE
crash   1/1     Running   4 (44s ago)   102s
starting
error: /etc/app/app.conf not found
```

`describe` shows the same exit in numbers:

```text
    Last State:     Terminated
      Reason:       Error
      Exit Code:    1
```

`Error` with a non-zero exit code means your app ran and chose to exit. Kubernetes cannot fix that; the log line tells you what to fix, here a missing config file, which you would mount from a ConfigMap. One trap we hit on the box: while the Pod showed `Error`, the newest container had already exited, and `kubectl logs crash --previous` answered `unable to retrieve container logs for containerd://...` because the run before it was already cleaned up. Plain `kubectl logs crash` showed the crashed run's output instead. If one of the two commands comes back empty, try the other.

8. **`oom`: read the reason and the limit.**

```bash rail=describe-pod-oom-k8s-from-zero
kubectl describe pod oom -n k8s-from-zero
```

```text
...
    Last State:     Terminated
      Reason:       OOMKilled
      Exit Code:    137
...
    Limits:
      memory:  32Mi
    Requests:
      memory:     32Mi
...
```

A container that keeps using more memory than its limit is terminated, and the reason is `OOMKilled` ([Assign Memory Resources](https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/)). The app gets no chance to write an error first, so do not expect one in its log. Either the limit is too low for what the app really needs, or the app uses more and more memory. Measure, then raise the limit or fix the leak. Here the app is built to fill memory, so leave it broken.

9. Check the result and clean up:

```bash rail=get-pods-k8s-from-zero
kubectl get pods -n k8s-from-zero
```

```text
NAME      READY   STATUS             RESTARTS       AGE
config    1/1     Running            0              4m41s
crash     0/1     Error              4 (83s ago)    2m21s
oom       0/1     CrashLoopBackOff   5 (114s ago)   4m41s
pending   1/1     Running            0              28s
runerr    1/1     Running            0              26s
typo      1/1     Running            0              4m41s
```

Four fixed; `crash` and `oom` are broken by design.

```bash rail=delete-pod-pending-crash
kubectl delete pod pending crash typo oom config runerr -n k8s-from-zero --grace-period=1
kubectl delete configmap app-config -n k8s-from-zero
```

## When it goes wrong

- **You fixed the problem and the Pod still shows the old error.** A Pod in back-off waits up to five minutes before the next try. Check the RESTARTS column and the latest event time with `kubectl events --for pod/NAME`. For fields you cannot change in place, `kubectl replace --force -f file.yaml` starts it fresh. For Pods owned by a Deployment, fix the Deployment, not the Pod: new Pods are made from the Deployment's template.

- **`kubectl logs` says `unable to retrieve container logs`.** Covered in step 7: the run you asked for is gone. Try without `--previous`, or wait until the container runs again. If the container never started (`CreateContainerConfigError`, `StartError`), there are no logs at all; read `describe` instead.

- **All six look fine in `get pods` but the app still fails.** `Running` and `1/1` only mean the container runs and its readiness probe passes. Requests that fail on the way in are a Service or routing problem. Part 22 covers Services with no endpoints, DNS failures and stuck deletions.

- **Too many events to read.** `kubectl events -n k8s-from-zero --types=Warning` keeps only the problems, in time order. In our lab its last eight lines named every Pod that had failed, each with its message, which is a quick inventory of a namespace in trouble.

## Cheat sheet

| Task | Command or field | Note |
|---|---|---|
| First look | `kubectl get pods -n NS` | read STATUS and RESTARTS |
| Reasons side by side | `kubectl get pods -o custom-columns=...state.waiting.reason...` | see step 2 |
| Container state and events | `kubectl describe pod NAME` | State, Last State, Events |
| Events for one Pod | `kubectl events --for pod/NAME` | time order |
| Only warnings | `kubectl events -n NS --types=Warning` | quick inventory |
| App output | `kubectl logs NAME` | current or last run |
| Output of the run before | `kubectl logs NAME --previous` | needs that run to still exist |
| `Pending` | FailedScheduling event | requests, nodeSelector, taints |
| `ErrImagePull` / `ImagePullBackOff` | Failed event message | not found, auth, network |
| `CreateContainerConfigError` | describe: missing ConfigMap or Secret | create it, the Pod starts |
| `RunContainerError` | Last State: StartError, message | command or file not in image |
| `Error` / `CrashLoopBackOff` | logs, exit code | the app exited |
| `OOMKilled` | exit code 137 | raise the limit or fix the leak |
| Fix an image in place | `kubectl set image pod/NAME c=image:tag` | most other fields need a new Pod |
| Recreate a Pod from a file | `kubectl replace --force -f pod.yaml` | delete and create |

## Recap and what is next

- Read `STATUS` first. Each value points to one place: Events for scheduling and pulls, `Last State` for config, start and memory failures, logs for app crashes.
- Three failures happen before your app runs (`Pending`, image pulls, missing config); three after (start errors, crashes, OOM kills). Only a crash leaves the app's own error in the logs.
- The kubelet retries with growing delays up to five minutes, so a crash loop is any exit, repeated; the cause is in the logs or `Last State`.
- Most fixes need a new Pod. Fix the manifest, or the Deployment that owns the Pod, and let it be replaced.

Next: part 22, troubleshooting the rest: Services with no endpoints, DNS failures, stuck Terminating, node problems and `kubectl debug`. Coming tomorrow.

```rail
id: "apply-pending-yaml-typo-yaml-config-yaml"
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
      - token: "pending.yaml"
        text: "The file this flag or redirection names."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "typo.yaml"
        text: "The file this flag or redirection names."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "config.yaml"
        text: "The file this flag or redirection names."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "runerr.yaml"
        text: "The file this flag or redirection names."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "crash.yaml"
        text: "The file this flag or redirection names."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "oom.yaml"
        text: "The file this flag or redirection names."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type."
      - token: "-n"
        text: "The object name."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
```

```rail
id: "get-pods-k8s-from-zero-custom-columns"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type."
      - token: "-n"
        text: "The object name."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "custom-columns='NAME:.metadata.name,PHASE:.status.phase,WAITING:.status.containerStatuses[0].state.waiting.reason,LAST-EXIT:.status.containerStatuses[0].lastState.terminated.reason,CODE:.status.containerStatuses[0].lastState.terminated.exitCode'"
        text: "An output format. A jsonpath template is JSONPath expressions in curly braces. This token is the template or the columns in the lesson command."
```

```rail
id: "describe-pod-pending-k8s-from-zero"
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
      - token: "pending"
        text: "The object name."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
```

```rail
id: "replace-force-pending-yaml"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "replace"
        text: "Replace a resource by file name or stdin."
      - token: "--force"
        text: "With replace, delete the object and create it again from the file."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "pending.yaml"
        text: "The file this flag or redirection names."
```

```rail
id: "events-k8s-from-zero-pod-typo"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "events"
        text: "List events."
      - token: "-n"
        text: "The object name."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "--for"
        text: "The condition to wait for."
      - token: "pod/typo"
        text: "The resource written as type/name: pod/typo."
```

```rail
id: "set-image-pod-typo-web"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "set"
        text: "The command group for setting values on a resource."
      - token: "image"
        text: "Update the image of a container."
      - token: "pod/typo"
        text: "The resource written as type/name: pod/typo."
      - token: "web=nginx:1.29-alpine"
        text: "A shell assignment, or a key=value argument, used by the command around it."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
```

```rail
id: "describe-pod-config-k8s-from-zero"
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
      - token: "config"
        text: "Modify kubeconfig files."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
```

```rail
id: "create-configmap-app-config-k8s-from-zero"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "create"
        text: "Create a resource from a file or from flags."
      - token: "configmap"
        text: "The resource type."
      - token: "app-config"
        text: "The object name."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "--from-literal=mode=prod"
        text: "A key and value for the ConfigMap being created. This token is the pair in the lesson command."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "logs"
        text: "Print the logs for a container in a pod. If the pod has only one container, the container name is optional."
      - token: "config"
        text: "Modify kubeconfig files."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
```

```rail
id: "describe-pod-runerr-k8s-from-zero"
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
      - token: "runerr"
        text: "The object name."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
```

```rail
id: "replace-force-runerr-yaml"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "replace"
        text: "Replace a resource by file name or stdin."
      - token: "--force"
        text: "With replace, delete the object and create it again from the file."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "runerr.yaml"
        text: "The file this flag or redirection names."
```

```rail
id: "get-pod-crash-k8s-from-zero"
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
      - token: "crash"
        text: "The object name."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "logs"
        text: "Print the logs for a container in a pod. If the pod has only one container, the container name is optional."
      - token: "crash"
        text: "An argument of the command in this lesson."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "--previous"
        text: "Print the logs of the previous container instance, when that instance is still available."
```

```rail
id: "describe-pod-oom-k8s-from-zero"
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
      - token: "oom"
        text: "The object name."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
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
        text: "The resource type."
      - token: "-n"
        text: "The object name."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
```

```rail
id: "delete-pod-pending-crash"
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
      - token: "pending"
        text: "The object name."
      - token: "crash"
        text: "An argument of the command in this lesson."
      - token: "typo"
        text: "An argument of the command in this lesson."
      - token: "oom"
        text: "An argument of the command in this lesson."
      - token: "config"
        text: "Modify kubeconfig files."
      - token: "runerr"
        text: "An argument of the command in this lesson."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "--grace-period=1"
        text: "Seconds to wait before the object is removed. This command passes 1."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "configmap"
        text: "The resource type."
      - token: "app-config"
        text: "The object name."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
```
