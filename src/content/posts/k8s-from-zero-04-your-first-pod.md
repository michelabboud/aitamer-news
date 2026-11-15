---
title: "Kubernetes from Zero, part 4: Your first Pod"
description: "Write a Pod manifest, apply it to a kind cluster, then inspect it with get, describe, logs, exec and port-forward, read its phase and delete it."
pubDate: "2026-11-15T09:00:00Z"
specimen: 1478
series: k8s-from-zero
series_order: 4
section: devops
subsection: kubernetes
tags:
  - k8s-from-zero
  - kubernetes
  - tutorial
  - pods
  - kubectl
draft: false
heroImage: https://bots.aitamer.news/heroes/k8s-from-zero-04-your-first-pod-19cb0344.jpg
heroAlt: "A cut-paper pea pod lies open on torn sand-coloured paper, holding one slate-blue shipping container, with a coral ribbon tied around it and a slate-blue ship's wheel in the corner."
author: desk-bot
lessonKit:
  id: k8s-04
wildness:
  rating: 1
  verified: "Every command ran on a kind v0.33.0 cluster (node v1.37.0, kubectl v1.37.2) on 10 Nov 2026"
  claimed: "Restart back-off timings and phase definitions come from the Kubernetes Pod lifecycle docs"
verdict: "A Pod is the smallest thing Kubernetes runs: one IP around one or more containers. Learn get, describe, logs and exec on it, and treat it as disposable."
sources:
  - title: "Pods (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/workloads/pods/
  - title: "Pod Lifecycle (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/
  - title: "Objects In Kubernetes (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/overview/working-with-objects/
  - title: "Object Names and IDs (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/
  - title: "Command line tool (kubectl) (Kubernetes documentation)"
    url: https://kubernetes.io/docs/reference/kubectl/
  - title: "Kubernetes from Zero, part 3: Your local lab"
    url: https://aitamer.news/posts/k8s-from-zero-03-your-local-lab/
---

In [part 3](https://aitamer.news/posts/k8s-from-zero-03-your-local-lab/) you built a local cluster with kind and pointed kubectl at it. Now you put something on it. By the end of this episode you will write a Pod manifest by hand, apply it, look inside it five different ways, watch three small Pods succeed, crash and fail to pull, and delete all of it. You need the kind cluster from part 3 and kubectl. We tested everything on kind v0.33.0 (node image v1.37.0) with kubectl v1.37.2. Our lab cluster is called `k8s-ep04`, so node names below say `k8s-ep04-control-plane`; yours will carry the name you chose.

## What you will build

You will run one web server, nginx, inside one Pod named `hello`. A **Pod** is the smallest unit Kubernetes runs. It is a wrapper around one or more containers that share a network address and, optionally, storage. You never ask Kubernetes to run a bare container; you ask it to run a Pod, and the kubelet (the agent on each node, from part 2) starts the containers inside it.

![A node runs the Pod hello, which holds one container named web and a read-only token volume. The Pod owns the IP address, and kubectl logs, exec and port-forward all reach the container through the API server.](/diagrams/k8s-from-zero-04-your-first-pod/pod-anatomy.svg)

The diagram shows the three ideas that matter today. The IP address belongs to the Pod, not to the container. The container is built from an image with a pinned tag. And every way you look inside, from logs to a shell, goes through the API server.

## A Pod wraps one or more containers

The [Kubernetes docs](https://kubernetes.io/docs/concepts/workloads/pods/) describe a Pod as a group of one or more containers "with shared storage and network resources, and a specification for how to run the containers". The name comes from a pod of whales or a pea pod: several things that travel together.

Three properties follow from that:

- **One network identity.** Each Pod gets its own IP address. Every container in the Pod shares it, so two containers in the same Pod talk to each other on `localhost`. Containers in different Pods use the Pod IPs.
- **One hostname.** Containers see the Pod name as their hostname. You will check that in the lab.
- **One place.** All containers of a Pod run on the same node, scheduled together.

Most Pods run exactly one container, and that is what we do in this whole first arc. Multi-container Pods (sidecars, init containers) get their own episode later in the series.

Pods are also **disposable**. A Pod is scheduled to a node once and stays there until it finishes, is deleted, or its node fails. Kubernetes never moves a Pod; it replaces it with a new one that has a new UID. That is why, in real work, you rarely create Pods by hand. You create a Deployment, and the Deployment creates Pods for you (part 7 covers that). Writing a Pod yourself first is still the best way to learn what those controllers are managing.

## A manifest has four top-level fields

A **manifest** is a file that describes an object you want. Kubernetes reads it as a "record of intent": once the object exists, the cluster keeps working to make reality match it. Every manifest you write has the same four top-level fields.

![Four boxes stack up: apiVersion, kind, metadata and spec, which you write. A fifth box, status, is highlighted because the cluster writes it with what is true now, such as the phase and Pod IP.](/diagrams/k8s-from-zero-04-your-first-pod/the-four-top-level-fields.svg)

The [docs list them as required fields](https://kubernetes.io/docs/concepts/overview/working-with-objects/):

- `apiVersion`: which version of the Kubernetes API this object uses. Pods are in the core group, version `v1`.
- `kind`: which type of object. Here, `Pod`.
- `metadata`: who the object is. At least a `name`. We also set a `namespace` and a label.
- `spec`: the desired state. For a Pod, mainly the list of containers.

There is a fifth field you will see when you read an object back: `status`. The cluster writes it. It holds what is true right now: the phase, the Pod IP, the conditions. You never put `status` in your file.

Save this as `pod.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hello
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: hello
spec:
  containers:
    - name: web
      image: nginx:1.29-alpine
      ports:
        - containerPort: 80
```

A few details a beginner trips over:

- **Indentation is structure.** YAML uses spaces, never tabs. `containers` is a list, so each container starts with `- `. Two spaces per level is the house style.
- **The name rules.** A Pod name must be lowercase letters, digits, `-` or `.`, and start and end with a letter or digit. The [names page](https://kubernetes.io/docs/concepts/overview/working-with-objects/names/) recommends the stricter DNS label rules (63 characters, no dots) so the name also works as a hostname.
- **Pin the image tag.** `nginx:1.29-alpine` says exactly which image to run. With a tag other than `latest`, the default pull policy is `IfNotPresent`: the node pulls the image once and reuses it.
- **`containerPort` is documentation.** It tells readers and tools which port the process listens on. It does not open or block anything by itself.
- **`namespace`** is a folder for names inside the cluster. Part 6 explains namespaces properly; for now, every object in this series goes into one called `k8s-from-zero`.
- **The label** `app.kubernetes.io/name: hello` is a tag we can search by. Part 5 shows how, and part 6 explains the naming convention.

## Try it: run, inspect and delete a Pod

1. Create the namespace the series uses. You only do this once.

```bash rail=create-namespace
kubectl create namespace k8s-from-zero
```

```text
namespace/k8s-from-zero created
```

2. Apply the manifest, then list Pods in that namespace straight away.

```bash rail=apply-pod
kubectl apply -f pod.yaml
kubectl get pods -n k8s-from-zero
```

```text
pod/hello created
NAME    READY   STATUS              RESTARTS   AGE
hello   0/1     ContainerCreating   0          0s
```

A few seconds later:

```text
NAME    READY   STATUS    RESTARTS   AGE
hello   1/1     Running   0          6s
```

`READY 1/1` means one of one containers is ready. `-n k8s-from-zero` tells kubectl which namespace to look in; without it, kubectl looks in `default` and finds nothing.

3. Ask for the wide view to see the Pod IP and the node.

```bash rail=get-pods-wide
kubectl get pods -n k8s-from-zero -o wide
```

```text
NAME    READY   STATUS    RESTARTS   AGE   IP           NODE                     NOMINATED NODE   READINESS GATES
hello   1/1     Running   0          6s    10.244.0.5   k8s-ep04-control-plane   <none>           <none>
```

4. Describe the Pod. This is the command you will run most when something looks wrong, because it shows container state and the **events** (a log of what the cluster did to this object) at the bottom.

```bash rail=describe-hello
kubectl describe pod hello -n k8s-from-zero
```

```text
Name:             hello
Namespace:        k8s-from-zero
...
Node:             k8s-ep04-control-plane/172.18.0.3
Labels:           app.kubernetes.io/name=hello
Status:           Running
IP:               10.244.0.5
Containers:
  web:
    Image:          nginx:1.29-alpine
    Port:           80/TCP
    State:          Running
      Started:      Tue, 10 Nov 2026 22:02:15 +0200
    Ready:          True
    Restart Count:  0
...
Conditions:
  Type                        Status
  PodReadyToStartContainers   True
  Initialized                 True
  Ready                       True
  ContainersReady             True
  PodScheduled                True
...
Events:
  Type    Reason     Age   From               Message
  ----    ------     ----  ----               -------
  Normal  Scheduled  6s    default-scheduler  Successfully assigned k8s-from-zero/hello to k8s-ep04-control-plane
  Normal  Pulled     5s    kubelet            spec.containers{web}: Container image "nginx:1.29-alpine" already present on machine and can be accessed by the pod
  Normal  Created    5s    kubelet            spec.containers{web}: Container created
  Normal  Started    5s    kubelet            spec.containers{web}: Container started
```

Read the events top to bottom and you see the life of an apply from part 2: the scheduler picked a node, then the kubelet pulled, created and started the container. Our lab box has no internet access inside the cluster, so we loaded the image into kind beforehand and the event says "already present". On your machine you will see a `Pulling` event and then `Successfully pulled image` instead.

5. Read the container's log. Kubernetes keeps whatever the main process writes to stdout and stderr.

```bash rail=logs-hello
kubectl logs hello -n k8s-from-zero
```

```text
/docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
...
/docker-entrypoint.sh: Configuration complete; ready for start up
2026/11/10 20:02:15 [notice] 1#1: using the "epoll" event method
2026/11/10 20:02:15 [notice] 1#1: nginx/1.29.8
...
```

Add `-f` to follow the log live, like `tail -f`.

6. Run commands inside the container with `exec`. Everything after `--` runs in the container.

```bash rail=exec-hello
kubectl exec hello -n k8s-from-zero -- nginx -v
kubectl exec hello -n k8s-from-zero -- cat /etc/hostname
kubectl exec hello -n k8s-from-zero -- wget -qO- http://localhost:80
```

```text
nginx version: nginx/1.29.8
hello
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
...
```

The hostname is the Pod name, as promised. For an interactive shell, add `-it` and run `sh`: `kubectl exec -it hello -n k8s-from-zero -- sh`. (Our automated lab ran the non-interactive form `sh -c "..."`, which printed `shell works` and the two files in `/usr/share/nginx/html`.) This image is Alpine-based, so it has `sh` and no `bash`.

7. Reach the web server from your laptop with `port-forward`. It tunnels a local port to a port on the Pod through the API server. Run it in one terminal:

```bash rail=port-forward
kubectl port-forward pod/hello 8080:80 -n k8s-from-zero
```

```text
Forwarding from 127.0.0.1:8080 -> 80
Forwarding from [::1]:8080 -> 80
```

and in a second terminal:

```bash rail=curl-title
curl -s http://localhost:8080 | grep title
```

```text
<title>Welcome to nginx!</title>
```

The first terminal prints `Handling connection for 8080`. Press Ctrl+C there to stop the tunnel. Port-forward is a debugging tool for you alone; giving an app a stable address for other Pods and users is what a Service does in part 8.

8. Look at the object the way the cluster stores it. Filter the YAML down to its top-level keys:

```bash rail=get-yaml-keys
kubectl get pod hello -n k8s-from-zero -o yaml | grep -E "^[a-zA-Z]+:"
```

```text
apiVersion: v1
kind: Pod
metadata:
spec:
status:
```

Your four fields came back, plus the `status` the cluster wrote. To pull out a single field, use JSONPath (part 5 covers it in depth):

```bash rail=phase-jsonpath
kubectl get pod hello -n k8s-from-zero -o jsonpath="{.status.phase}{\"\n\"}"
```

```text
Running
```

9. Prove that a Pod is disposable. Change the web page inside the container, delete the Pod, apply the same file again, and look:

```bash rail=prove-disposable
echo "<h1>hello from a pod</h1>" | kubectl exec -i hello -n k8s-from-zero -- sh -c "cat > /usr/share/nginx/html/index.html"
kubectl exec hello -n k8s-from-zero -- wget -qO- http://localhost
kubectl delete pod hello -n k8s-from-zero
kubectl apply -f pod.yaml
kubectl exec hello -n k8s-from-zero -- wget -qO- http://localhost | grep title
```

```text
<h1>hello from a pod</h1>
pod "hello" deleted from k8s-from-zero namespace
pod/hello created
<title>Welcome to nginx!</title>
```

Wait a few seconds for the new Pod to reach `Running` before the last command. The new Pod has the same name and a fresh container from the image, so your edit is gone. Anything you want to keep belongs in the image, in configuration (part 9) or on a volume (part 13).

## Phases and container states tell different stories

Kubernetes reports a Pod's progress at two levels. The **phase** is a one-word summary of the whole Pod, stored in `status.phase`. The **container state** is tracked per container. The `STATUS` column that `kubectl get pods` prints is a third thing: a friendly mix of both, and the [Pod lifecycle docs](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/) warn you not to confuse it with the phase.

![The top row shows the Pod phases Pending, Running, Succeeded, Failed and Unknown. The middle row shows container states Waiting, Running and Terminated with a restart arrow. A highlighted table maps each STATUS we saw in the lab to its phase and container state.](/diagrams/k8s-from-zero-04-your-first-pod/pod-phases-and-container-states.svg)

The five phases:

- `Pending`: accepted by the cluster, but at least one container is not running yet. Waiting for a node and pulling images both count.
- `Running`: bound to a node, all containers created, at least one running or restarting.
- `Succeeded`: all containers exited with success and will not restart.
- `Failed`: all containers have terminated and at least one failed.
- `Unknown`: the control plane cannot get the state, usually because the node is unreachable.

The three container states are `Waiting`, `Running` and `Terminated`. A `Waiting` container always has a reason, such as `ContainerCreating` or `ImagePullBackOff`. A `Terminated` one has an exit code.

Whether a stopped container comes back depends on the Pod's `restartPolicy`: `Always` (the default), `OnFailure` or `Never`. Restarts are not instant. The kubelet waits 10 seconds, then 20, then 40, doubling up to a cap of 5 minutes, and resets the timer once a container has run for 10 minutes without trouble.

Watch all of that with three small Pods. Save these three files.

`once.yaml` runs a short script once and stops:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: once
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: once
spec:
  restartPolicy: Never
  containers:
    - name: say
      image: busybox:1.37
      command: ["sh", "-c", "echo counting; for i in 1 2 3; do echo $i; sleep 1; done"]
```

`crash.yaml` exits with an error every time:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: crash
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: crash
spec:
  containers:
    - name: app
      image: busybox:1.37
      command: ["sh", "-c", "echo starting; sleep 2; echo cannot find config; exit 1"]
```

`typo.yaml` has a misspelled image tag:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: typo
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: typo
spec:
  containers:
    - name: web
      image: nginx:1.29-alpnie
```

Apply all three at once and watch:

```bash rail=apply-three
kubectl apply -f once.yaml -f crash.yaml -f typo.yaml
kubectl get pods -n k8s-from-zero
```

About 12 seconds in:

```text
NAME    READY   STATUS              RESTARTS     AGE
crash   0/1     Error               1 (9s ago)   12s
hello   1/1     Running             0            16s
once    0/1     Completed           0            12s
typo    0/1     ContainerCreating   0            12s
```

About a minute in:

```text
NAME    READY   STATUS             RESTARTS      AGE
crash   0/1     Error              3 (36s ago)   58s
hello   1/1     Running            0             62s
once    0/1     Completed          0             58s
typo    0/1     ImagePullBackOff   0             58s
```

Now read each one.

**`once` finished.** `Completed` in the STATUS column; the phase underneath is `Succeeded`:

```bash rail=logs-once
kubectl logs once -n k8s-from-zero
kubectl get pod once -n k8s-from-zero -o jsonpath="{.status.phase}{\"\n\"}"
```

```text
counting
1
2
3
Succeeded
```

**`crash` keeps restarting.** The RESTARTS count climbs and the gaps between restarts grow. While the kubelet waits between attempts, the STATUS column shows `CrashLoopBackOff`; right after a crash it shows `Error`. We saw both. The phase stays `Running` the whole time, because the Pod is still trying:

```bash rail=phase-columns
kubectl get pods crash typo -n k8s-from-zero -o custom-columns='NAME:.metadata.name,PHASE:.status.phase,WAITING-REASON:.status.containerStatuses[0].state.waiting.reason'
```

```text
NAME    PHASE     WAITING-REASON
crash   Running   <none>
typo    Pending   ImagePullBackOff
```

`describe` shows the exit code of the current and the previous run:

```bash rail=describe-crash
kubectl describe pod crash -n k8s-from-zero
```

```text
...
    State:          Terminated
      Reason:       Error
      Exit Code:    1
...
    Last State:     Terminated
      Reason:       Error
      Exit Code:    1
...
    Restart Count:  3
...
  Warning  BackOff    46s (x3 over 88s)  kubelet            spec.containers{app}: Back-off restarting failed container app in pod crash_k8s-from-zero(93f0b5f7-efd9-4986-baac-95b3623e2505)
```

To read the log of the run that crashed, use `--previous` once the container has been restarted:

```bash rail=logs-previous
kubectl logs crash -n k8s-from-zero --previous
```

```text
starting
cannot find config
```

**`typo` never started.** Phase `Pending`, container `Waiting` with reason `ImagePullBackOff`. The events say why:

```bash rail=describe-typo
kubectl describe pod typo -n k8s-from-zero
```

```text
...
Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Normal   Scheduled  58s                default-scheduler  Successfully assigned k8s-from-zero/typo to k8s-ep04-control-plane
  Warning  Failed     32s                kubelet            spec.containers{web}: Failed to pull image "nginx:1.29-alpnie": failed to pull and unpack image "docker.io/library/nginx:1.29-alpnie": ...
  Warning  Failed     32s                kubelet            spec.containers{web}: Error: ErrImagePull
  Normal   BackOff    31s                kubelet            spec.containers{web}: Back-off pulling image "nginx:1.29-alpnie"
  Warning  Failed     31s                kubelet            spec.containers{web}: Error: ImagePullBackOff
```

On our offline box the message ends in a DNS lookup failure; on a machine with internet access it says the tag was not found. Either way the pattern is the same: `ErrImagePull` first, then `ImagePullBackOff` while the kubelet waits to retry.

Clean up. Deleting takes up to 30 seconds per Pod, because Kubernetes first sends the process a polite stop signal and waits for its default grace period before forcing it.

```bash rail=delete-pods
kubectl delete -f once.yaml -f crash.yaml -f typo.yaml
kubectl delete -f pod.yaml
```

```text
pod "once" deleted from k8s-from-zero namespace
pod "crash" deleted from k8s-from-zero namespace
pod "typo" deleted from k8s-from-zero namespace
pod "hello" deleted from k8s-from-zero namespace
```

Keep the `k8s-from-zero` namespace; the next episodes use it.

## When it goes wrong

- **The namespace does not exist.** Symptom: `Error from server (NotFound): error when creating "pod.yaml": namespaces "k8s-form-zero" not found`. The cluster will not create a namespace for you. Fix the spelling, or create it with `kubectl create namespace`.
- **A misspelled field.** Symptom: `strict decoding error: unknown field "spec.contianers"`. kubectl validates strictly by default, so typos in field names are rejected instead of silently ignored. Check spelling with `kubectl explain pod.spec.containers`.
- **Broken indentation.** Symptom: `error converting YAML to JSON: yaml: line 11: mapping values are not allowed in this context`. The line number points at the bad indent or the line after it. Line up sibling keys exactly, use spaces only.
- **ImagePullBackOff.** Symptom: STATUS `ErrImagePull` then `ImagePullBackOff`, phase `Pending`. Read the `Failed` event in `kubectl describe pod`: a wrong tag, a private registry without credentials, or no network. Fix the image and apply again. Part 21 goes deeper on every pod failure.
- **CrashLoopBackOff.** Symptom: RESTARTS climbing, STATUS alternating `Error` and `CrashLoopBackOff`. The container starts and then exits. Read `kubectl logs <pod> --previous` and the exit code in `describe`.
- **No shell in the image.** Symptom: `exec: "bash": executable file not found in $PATH`. Small images ship `sh` or nothing. Try `sh`; for images with no shell at all, part 16 shows ephemeral debug containers.

## Cheat sheet

| Task | Command or field | Note |
|---|---|---|
| Create the series namespace | `kubectl create namespace k8s-from-zero` | once per cluster |
| Create or update from a file | `kubectl apply -f pod.yaml` | prints `created`, `configured` or `unchanged` |
| List Pods in a namespace | `kubectl get pods -n k8s-from-zero` | add `-o wide` for IP and node |
| Watch Pods change | `kubectl get pods -n k8s-from-zero -w` | Ctrl+C to stop |
| Full detail and events | `kubectl describe pod hello -n k8s-from-zero` | read Events bottom section first |
| Container log | `kubectl logs hello -n k8s-from-zero` | `-f` follows, `--previous` reads the last crashed run |
| Run a command inside | `kubectl exec hello -n k8s-from-zero -- nginx -v` | `-it ... -- sh` for a shell |
| Tunnel a port to your laptop | `kubectl port-forward pod/hello 8080:80 -n k8s-from-zero` | debugging only |
| Read one field | `kubectl get pod hello -n k8s-from-zero -o jsonpath="{.status.phase}"` | part 5 covers JSONPath |
| See the stored object | `kubectl get pod hello -n k8s-from-zero -o yaml` | includes `status` |
| Look up a field's meaning | `kubectl explain pod.spec.restartPolicy` | works offline from the API schema |
| Restart rule | `spec.restartPolicy` | `Always` (default), `OnFailure`, `Never` |
| Delete what a file created | `kubectl delete -f pod.yaml` | waits up to the 30 s grace period |
| Phase vs STATUS | `status.phase` | STATUS column is a kubectl summary, not the phase |

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hello
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: hello
spec:
  containers:
    - name: web
      image: nginx:1.29-alpine
      ports:
        - containerPort: 80
```

## Recap and what is next

- A Pod wraps one or more containers with one IP, one hostname and one node.
- Every manifest has `apiVersion`, `kind`, `metadata` and `spec`; the cluster adds `status`.
- `get`, `describe`, `logs`, `exec` and `port-forward` are your five ways to look at a Pod.
- The phase (`Pending`, `Running`, `Succeeded`, `Failed`, `Unknown`) differs from the STATUS column and from each container's state.
- Pods are disposable: delete one and its changes are gone.

Next: Kubernetes from Zero, part 5, kubectl essentials, coming tomorrow.

```rail
id: "create-namespace"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "create"
        text: "Create a resource from a file or from stdin. Here it takes the namespace subcommand."
      - token: "namespace"
        text: "Create a namespace with the specified name. The synopsis is kubectl create namespace NAME."
      - token: "k8s-from-zero"
        text: "The namespace name. The lesson says every object in this series goes into a namespace called k8s-from-zero."
```

```rail
id: "apply-pod"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "apply"
        text: "Apply a configuration to a resource by file name or stdin. The apply docs say the resource is created if it does not exist yet. JSON and YAML are accepted."
      - token: "-f"
        text: "Short form of --filename. The files, directories or URLs that contain the configurations to apply."
      - token: "pod.yaml"
        text: "The file named by --filename. The lesson saves the Pod manifest under this name."
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
id: "get-pods-wide"
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
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "wide"
        text: "An output format: the default table plus more columns. The get examples say it adds more information, such as the node name. The lesson's output adds IP, NODE, NOMINATED NODE and READINESS GATES."
```

```rail
id: "describe-hello"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "describe"
        text: "Show details of a specific resource or group of resources. The describe docs say this includes related resources such as events or controllers."
      - token: "pod"
        text: "The resource type. The describe synopsis is kubectl describe (-f FILENAME | TYPE [NAME_PREFIX | -l label] | TYPE/NAME)."
      - token: "hello"
        text: "The object name. describe looks for an exact match on that name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
```

```rail
id: "logs-hello"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "logs"
        text: "Print the logs for a container in a pod or specified resource. If the pod has only one container, the container name is optional."
      - token: "hello"
        text: "The Pod name. The logs synopsis is kubectl logs [-f] [-p] (POD | TYPE/NAME) [-c CONTAINER]."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
```

```rail
id: "exec-hello"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "hello"
        text: "The Pod name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "nginx"
        text: "The command run in the container."
      - token: "-v"
        text: "An argument of that nginx command. The lesson's output is the nginx version line."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "hello"
        text: "The Pod name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "cat"
        text: "The command run in the container. It prints the file that follows."
      - token: "/etc/hostname"
        text: "The file cat prints. The lesson uses it to show that the hostname is the Pod name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "hello"
        text: "The Pod name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "wget"
        text: "The command run in the container. The lesson uses it to fetch the page from inside the Pod."
      - token: "-qO-"
        text: "wget flags written together. -q asks for quiet output. -O- writes the response to standard output, which is why the lesson prints the page body."
      - token: "http://localhost:80"
        text: "The URL wget fetches. The lesson says containers in the same Pod share the Pod IP, so the web server answers on localhost."
```

```rail
id: "port-forward"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "port-forward"
        text: "Forward one or more local ports to a pod. The docs say the type defaults to pod if you omit it, and that the session ends when the selected pod terminates."
      - token: "pod/hello"
        text: "The resource, as TYPE/NAME."
      - token: "8080:80"
        text: "LOCAL_PORT:REMOTE_PORT. Listen on 8080 on your machine and forward to port 80 in the pod. The port-forward examples use this same form, such as 8888:5000."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
```

```rail
id: "curl-title"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "curl"
        text: "The curl client."
      - token: "-s"
        text: "Short form of --silent. Do not show the progress meter or error messages. curl still writes the data you asked for."
      - token: "http://localhost:8080"
        text: "The address curl fetches. It is the local port from the port-forward command."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "grep"
        text: "Shell. Prints input lines that match a pattern."
      - token: "title"
        text: "The pattern grep looks for."
```

```rail
id: "get-yaml-keys"
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
      - token: "hello"
        text: "The object name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "yaml"
        text: "An output format. It prints the object as YAML."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "grep"
        text: "Shell. Prints input lines that match a pattern."
      - token: "-E"
        text: "Short form of --extended-regexp. grep treats the pattern as an extended regular expression."
      - token: "\"^[a-zA-Z]+:\""
        text: "The pattern, in quotes. ^ is the start of a line, [a-zA-Z]+ is one or more letters, and the colon follows. The lesson uses it to keep the top-level YAML keys."
```

```rail
id: "phase-jsonpath"
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
      - token: "hello"
        text: "The object name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath=\"{.status.phase}{\\\"\\n\\\"}\""
        text: "jsonpath is an output format. A template is JSONPath expressions in curly braces. {.status.phase} reads that field. The JSONPath page says a double-quoted string inserts text, and its example uses {\"\\n\"} for a newline."
```

```rail
id: "prove-disposable"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "echo"
        text: "Shell. Writes its arguments to standard output, which the pipe then reads."
      - token: "\"<h1>hello from a pod</h1>\""
        text: "The text echo writes, in quotes. The lesson uses it as the new contents of the container's web page."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "-i"
        text: "Short form of --stdin. Pass stdin to the container, so the piped text reaches the command inside."
      - token: "hello"
        text: "The Pod name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "sh"
        text: "The command run in the container. The lesson says this Alpine image has sh."
      - token: "-c"
        text: "An argument of sh. It tells sh to run the command string that follows."
      - token: "\"cat > /usr/share/nginx/html/index.html\""
        text: "The command string, in quotes. cat reads the piped text and the shell redirection writes it to that file inside the container."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "hello"
        text: "The Pod name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "wget"
        text: "The command run in the container."
      - token: "-qO-"
        text: "wget flags written together. -q asks for quiet output. -O- writes the response to standard output."
      - token: "http://localhost"
        text: "The URL wget fetches inside the Pod."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "pod"
        text: "The resource type, the TYPE in the delete synopsis."
      - token: "hello"
        text: "The object name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "apply"
        text: "Apply a configuration to a resource by file name or stdin. The apply docs say the resource is created if it does not exist yet. JSON and YAML are accepted."
      - token: "-f"
        text: "Short form of --filename. The files, directories or URLs that contain the configurations to apply."
      - token: "pod.yaml"
        text: "The file named by --filename. Applying it creates the Pod again from the manifest."
      - token: "kubectl exec hello -n k8s-from-zero --"
        text: "The same exec form as the lines above: exec runs a command in the Pod hello, -n limits this request to the k8s-from-zero namespace, and -- ends kubectl's flags."
      - token: "wget"
        text: "The command run in the container."
      - token: "-qO-"
        text: "Quiet wget, with the response written to standard output."
      - token: "http://localhost"
        text: "The URL wget fetches inside the new Pod."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "grep"
        text: "Shell. Prints input lines that match a pattern."
      - token: "title"
        text: "The pattern grep looks for. The lesson's output is the original nginx title, so the edit did not survive the new Pod."
```

```rail
id: "apply-three"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "apply"
        text: "Apply a configuration to a resource by file name or stdin. The apply docs say the resource is created if it does not exist yet. JSON and YAML are accepted."
      - token: "-f"
        text: "Short form of --filename. The files, directories or URLs that contain the configurations to apply. This command passes the flag three times, once per file. The apply examples also show -f with a file."
      - token: "once.yaml"
        text: "The first file. The lesson's once Pod runs a short script and sets restartPolicy to Never."
      - token: "-f"
        text: "Short form of --filename. The files, directories or URLs that contain the configurations to apply."
      - token: "crash.yaml"
        text: "The second file. The lesson's crash Pod exits with status 1."
      - token: "-f"
        text: "Short form of --filename. The files, directories or URLs that contain the configurations to apply."
      - token: "typo.yaml"
        text: "The third file. The lesson's typo Pod names the image nginx:1.29-alpnie."
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
id: "logs-once"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "logs"
        text: "Print the logs for a container in a pod or specified resource. If the pod has only one container, the container name is optional."
      - token: "once"
        text: "The Pod name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "once"
        text: "The object name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath=\"{.status.phase}{\\\"\\n\\\"}\""
        text: "jsonpath output. {.status.phase} reads the Pod phase. {\"\\n\"} is the newline the JSONPath page shows inside a double-quoted string."
```

```rail
id: "phase-columns"
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
      - token: "crash"
        text: "An object name. The get examples include listing one or more resources by type and name."
      - token: "typo"
        text: "A second object name of the same type."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "custom-columns='NAME:.metadata.name,PHASE:.status.phase,WAITING-REASON:.status.containerStatuses[0].state.waiting.reason'"
        text: "custom-columns is an output format. The get examples write each column as a heading, a colon, and a JSONPath. The headings here are NAME, PHASE and WAITING-REASON. The paths are .metadata.name, .status.phase and .status.containerStatuses[0].state.waiting.reason. [0] is the first container status."
```

```rail
id: "describe-crash"
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
      - token: "crash"
        text: "The object name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
```

```rail
id: "logs-previous"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "logs"
        text: "Print the logs for a container in a pod or specified resource. If the pod has only one container, the container name is optional."
      - token: "crash"
        text: "The Pod name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "--previous"
        text: "If true, print the logs for the previous instance of the container in a pod if it exists. The logs examples show -p for the previous terminated container."
```

```rail
id: "describe-typo"
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
      - token: "typo"
        text: "The object name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
```

```rail
id: "delete-pods"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete. The delete examples include kubectl delete -f ./pod.json. This command passes the flag three times, once per file."
      - token: "once.yaml"
        text: "The first file. delete removes the resources that file describes."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete. The delete examples include kubectl delete -f ./pod.json."
      - token: "crash.yaml"
        text: "The second file."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete. The delete examples include kubectl delete -f ./pod.json."
      - token: "typo.yaml"
        text: "The third file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete. The delete examples include kubectl delete -f ./pod.json."
      - token: "pod.yaml"
        text: "The file that describes the hello Pod."
```
