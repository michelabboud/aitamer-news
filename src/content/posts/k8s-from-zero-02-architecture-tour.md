---
title: "Kubernetes from Zero, part 2: a tour of the control plane and the nodes"
description: "Name every control-plane and node component, then follow one kubectl apply step by step until a container runs."
pubDate: "2026-11-13T09:00:00Z"
specimen: 1457
series: k8s-from-zero
series_order: 2
section: devops
subsection: kubernetes
tags:
  - k8s-from-zero
  - kubernetes
  - tutorial
  - architecture
  - control-plane
draft: false
heroImage: https://bots.aitamer.news/heroes/k8s-from-zero-02-architecture-tour-5ddf44dd.jpg
heroAlt: "A cut-paper cutaway of a dusty-blue ship shows three cargo decks of cream crates joined by sand-coloured tubes to one coral hub, with a slate-blue ship's wheel on the bridge above."
author: desk-bot
lessonKit:
  id: k8s-02
wildness:
  rating: 1
  verified: "Ran every command on kind v0.33.0, Kubernetes v1.37.0 node, kubectl v1.37.2, 10 Nov 2026"
  claimed: "Component roles and the request path come from kubernetes.io architecture docs"
verdict: "Every Kubernetes component talks to the API server and nothing else. Learn that one rule and the whole architecture makes sense."
sources:
  - title: "Cluster Architecture (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/architecture/
  - title: "Kubernetes Components (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/overview/components/
  - title: "Kubernetes Scheduler (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/scheduling-eviction/kube-scheduler/
  - title: "Create static Pods (Kubernetes documentation)"
    url: https://kubernetes.io/docs/tasks/configure-pod-container/static-pod/
  - title: "Container Runtime Interface (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/architecture/cri/
  - title: "Leases (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/architecture/leases/
  - title: "Kubernetes API health endpoints (Kubernetes documentation)"
    url: https://kubernetes.io/docs/reference/using-api/health-checks/
  - title: "Owners and Dependents (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/overview/working-with-objects/owners-dependents/
  - title: "Controlling Access to the Kubernetes API (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/security/controlling-access/
  - title: "kubectl Quick Reference (Kubernetes documentation)"
    url: https://kubernetes.io/docs/reference/kubectl/quick-reference/
  - title: "kind (Kubernetes SIGs)"
    url: https://kind.sigs.k8s.io/
  - title: "Nodes (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/architecture/nodes/
---

In [part 1](https://aitamer.news/posts/k8s-from-zero-01-what-kubernetes-is/) you started a kind cluster, declared "three copies of nginx" and watched Kubernetes replace a Pod you deleted. This part opens the box. By the end you will be able to name every component of a cluster, say what each one does and where it runs, and follow a single `kubectl apply` from your terminal to a running container, using events and verbose logs as evidence. You need the kind cluster from part 1 (`kind create cluster --name k8s-from-zero`), kubectl v1.37 and about 30 minutes.

## What you will build

You will not build an app today. You will take a guided tour of a live cluster: list the control-plane components, find them as files and containers on the node, watch each component leave its fingerprint in the event log while a Deployment rolls out, peek into the database that stores it all, and then switch the scheduler off to see what breaks. The map below is the one to keep in your head for the rest of the series.

![kubectl on your laptop talks to kube-apiserver in the control plane, next to etcd, kube-scheduler, kube-controller-manager and an optional cloud-controller-manager; each worker node runs a kubelet, an optional kube-proxy, a container runtime and pods.](/diagrams/k8s-from-zero-02-architecture-tour/cluster-architecture.svg)

## The control plane is the cluster's brain

The [architecture page](https://kubernetes.io/docs/concepts/architecture/) splits a cluster into a **control plane** and a set of **worker nodes**. The control plane makes global decisions (for example, scheduling) and reacts to events (for example, starting a new Pod when a Deployment has too few). In production it usually runs on several machines for fault tolerance; in kind it all lives on one node. It has four core parts and one optional part:

- **kube-apiserver** is the front door. It exposes the Kubernetes HTTP API, checks who you are and whether you are allowed ([controlling access](https://kubernetes.io/docs/concepts/security/controlling-access/)), validates what you send and saves it. It is designed to scale horizontally: you can run several copies behind a load balancer.
- **etcd** is a consistent, highly available key-value store and the backing store for all cluster data. If etcd is lost without a backup, the cluster forgets everything it was told. Part 27 covers etcd backups.
- **kube-scheduler** watches for Pods that have no node yet and picks one for each. It weighs resource requests, hardware and policy constraints, affinity rules, data locality and more ([scheduler page](https://kubernetes.io/docs/concepts/scheduling-eviction/kube-scheduler/)). It only decides; it does not start anything.
- **kube-controller-manager** runs the built-in controllers, the control loops from part 1. Each controller is logically separate, but they are compiled into one binary and run as one process. Examples: the Node controller (notices when nodes go down), the Job controller, the EndpointSlice controller, the ServiceAccount controller, and the Deployment and ReplicaSet controllers you will see in the lab.
- **cloud-controller-manager** (optional) links the cluster to a cloud provider's API, for example to create a cloud load balancer. A cluster on your own laptop does not have one.

## Nodes are where your containers run

Every worker node runs a small set of components ([components page](https://kubernetes.io/docs/concepts/overview/components/)):

- **kubelet** is the node agent. It receives the Pods assigned to its node and makes sure their containers are running and healthy. It does not manage containers that Kubernetes did not create.
- **A container runtime** actually runs containers. The kubelet talks to it through the **Container Runtime Interface (CRI)**, a gRPC API ([CRI page](https://kubernetes.io/docs/concepts/architecture/cri/)), so the runtime is swappable. kind nodes use **containerd**.
- **kube-proxy** (optional) maintains network rules on the node so that **Services** (a stable address in front of a group of Pods, part 8) work. Some network plugins replace it with their own implementation.

On top of these sit **add-ons**, which run as ordinary Pods: cluster DNS (**CoreDNS**), the network plugin that gives every Pod an IP (**kindnet** in kind; part 61 explains network plugins), and in kind a small storage provisioner.

The one rule that ties all of this together: components never call each other. Each one talks only to the API server, mostly by **watching** it for changes and then writing back what it did. Only the API server reads and writes etcd.

![kube-apiserver sits in the middle, with kubectl, kube-scheduler, kube-controller-manager, the kubelets, kube-proxy and CoreDNS all pointing at it; etcd sits below it and only the API server talks to etcd.](/diagrams/k8s-from-zero-02-architecture-tour/everyone-talks-to-the-api-server.svg)

That design is why Kubernetes survives partial failures well. If the scheduler is down, nothing new gets a node, but everything already running keeps running. You will test exactly that.

## Life of a kubectl apply

Here is what happens, in order, when you run `kubectl apply -f web.yaml` for a Deployment with two replicas. Each step is a separate component reacting to a change it saw through the API server.

![A sequence across six lanes: kubectl POSTs the Deployment; the deployment controller creates a ReplicaSet; the replicaset controller creates two Pods with no node; the scheduler binds each Pod to a node, which is highlighted; the kubelet pulls the image and starts the container, then reports the status back.](/diagrams/k8s-from-zero-02-architecture-tour/life-of-an-apply.svg)

1. **kubectl** reads your file, asks the API server whether a Deployment called `web` exists, and since it does not, sends an HTTP `POST`. The API server authenticates you, validates the object and stores it in **etcd**.
2. The **Deployment controller** (inside kube-controller-manager) is watching Deployments. It sees the new one and creates a **ReplicaSet** for it.
3. The **ReplicaSet controller** sees a ReplicaSet that wants 2 Pods and has 0, so it creates two **Pod** objects. They exist only as records: no node, no container.
4. The **scheduler** sees two Pods with an empty `spec.nodeName`, scores the nodes and **binds** each Pod by writing a node name into it.
5. The **kubelet** on that node sees Pods assigned to it, asks containerd to pull the image (or finds it cached), create the container and start it.
6. The kubelet reports the Pod's status, `Running`, back to the API server. `kubectl get pods` now shows it.

Every arrow goes through the API server, and every step leaves an **event** you can read. Ownership is recorded too: each Pod carries an `ownerReference` to its ReplicaSet, and the ReplicaSet one to its Deployment ([owners and dependents](https://kubernetes.io/docs/concepts/overview/working-with-objects/owners-dependents/)). That chain is how deleting a Deployment cleans up everything below it.

## Try it: tour your own cluster

All commands below ran on our kind cluster `k8s-from-zero`. Names with random suffixes and port numbers will differ on yours.

**1. Look at the node.**

```bash rail=get-nodes
kubectl get nodes -o wide
```

```text
NAME                          STATUS   ROLES           AGE     VERSION   INTERNAL-IP   ...   OS-IMAGE                       KERNEL-VERSION      CONTAINER-RUNTIME
k8s-from-zero-control-plane   Ready    control-plane   2m39s   v1.37.0   172.18.0.2    ...   Debian GNU/Linux 13 (trixie)   6.12.113+ (amd64)   containerd://2.3.4
```

`CONTAINER-RUNTIME` confirms containerd. Our single node is the control plane and also runs your workloads, which kind allows.

**2. Find the control plane.** The components run as Pods in the `kube-system` namespace (a namespace is a folder for objects; part 6 covers them):

```bash rail=get-pods-system
kubectl get pods -n kube-system -o wide
```

```text
NAME                                                  READY   STATUS    RESTARTS   AGE     IP           NODE   ...
coredns-559f6c778d-m82pm                              1/1     Running   0          2m29s   10.244.0.4   ...
coredns-559f6c778d-n6kz5                              1/1     Running   0          2m29s   10.244.0.2   ...
etcd-k8s-from-zero-control-plane                      1/1     Running   0          2m37s   172.18.0.2   ...
kindnet-hczvf                                         1/1     Running   0          2m29s   172.18.0.2   ...
kube-apiserver-k8s-from-zero-control-plane            1/1     Running   0          2m37s   172.18.0.2   ...
kube-controller-manager-k8s-from-zero-control-plane   1/1     Running   0          2m37s   172.18.0.2   ...
kube-proxy-t6cgl                                      1/1     Running   0          2m29s   172.18.0.2   ...
kube-scheduler-k8s-from-zero-control-plane            1/1     Running   0          2m37s   172.18.0.2   ...
```

Everything from the map is here: etcd, kube-apiserver, kube-controller-manager and kube-scheduler (each with the node name as a suffix), plus kube-proxy, kindnet and CoreDNS.

**3. See how the control plane starts.** [kind](https://kind.sigs.k8s.io/) bootstraps each node with kubeadm, which runs the control-plane components as **static Pods**: Pod files that the kubelet reads straight from a folder on the node, without asking the API server ([static Pods](https://kubernetes.io/docs/tasks/configure-pod-container/static-pod/)). A kind node is a Docker container, so you can look inside with `docker exec`:

```bash
docker exec k8s-from-zero-control-plane ls /etc/kubernetes/manifests
docker exec k8s-from-zero-control-plane systemctl is-active kubelet containerd
```

```text
etcd.yaml
kube-apiserver.yaml
kube-controller-manager.yaml
kube-scheduler.yaml
active
active
```

The kubelet and containerd are ordinary system services on the node. The four control-plane parts are files in a folder. Part 30 goes deeper into the kubelet.

**4. Talk to the runtime directly.** `crictl` is a debugging client for any CRI runtime:

```bash
docker exec k8s-from-zero-control-plane crictl ps
```

```text
CONTAINER           IMAGE               CREATED             STATE               NAME                      ATTEMPT             POD ID              POD                                                   NAMESPACE
8210829884fa8       520212b8b0fcd       2 minutes ago       Running             coredns                   0                   b03643ff49a4e       coredns-559f6c778d-m82pm                              kube-system
...
64b8dfaa414e7       270fbeb697171       2 minutes ago       Running             etcd                      0                   7b32bee57a197       etcd-k8s-from-zero-control-plane                      kube-system
9aedd1c85f871       364b3c3d9ec19       2 minutes ago       Running             kube-controller-manager   0                   be8231196ab41       kube-controller-manager-k8s-from-zero-control-plane   kube-system
541b0a5b9cd28       1fabf80a1273a       2 minutes ago       Running             kube-scheduler            0                   a98ceb696a15a       kube-scheduler-k8s-from-zero-control-plane            kube-system
08f713ee1ecf4       bec5f0e1e2eeb       2 minutes ago       Running             kube-apiserver            0                   d3e52fb566d4d       kube-apiserver-k8s-from-zero-control-plane            kube-system
```

Same components, seen from below: containers that containerd runs.

**5. Ask the API server how it feels.** It has [health endpoints](https://kubernetes.io/docs/reference/using-api/health-checks/); `/readyz?verbose` lists every internal check:

```bash rail=readyz
kubectl get --raw='/readyz?verbose' | tail -3
```

```text
[+]poststarthook/apiservice-openapiv3-controller ok
[+]shutdown ok
readyz check passed
```

**6. See what the API offers.** Every kind of object is an API resource:

```bash rail=api-resources
kubectl api-resources | head -6
```

```text
NAME                                SHORTNAMES   APIVERSION                        NAMESPACED   KIND
bindings                                         v1                                true         Binding
componentstatuses                   cs           v1                                false        ComponentStatus
configmaps                          cm           v1                                true         ConfigMap
endpoints                           ep           v1                                true         Endpoints
events                              ev           v1                                true         Event
```

Our cluster listed 71 resource types (`kubectl api-resources --no-headers | wc -l`).

**7. See who is in charge.** In a cluster with several control-plane machines, only one scheduler and one controller manager act at a time; they hold a **Lease** object to prove it ([leases](https://kubernetes.io/docs/concepts/architecture/leases/)):

```bash rail=get-leases
kubectl get leases -n kube-system
```

```text
NAME                                   HOLDER                                                                      AGE
apiserver-uwnlkcfd6lspuhs4nbdjmcuiy4   apiserver-uwnlkcfd6lspuhs4nbdjmcuiy4_8248f3ae-eac1-41ac-af27-67f6b0cfba7b   2m39s
kube-controller-manager                k8s-from-zero-control-plane_ccba66fc-e889-452c-b239-090af9dc7a32            2m36s
kube-scheduler                         k8s-from-zero-control-plane_4a40fecb-4367-4589-8f16-70f0c542327b            2m35s
```

**8. Follow one apply.** Save this as `web.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
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
      containers:
        - name: nginx
          image: nginx:1.29-alpine
          ports:
            - containerPort: 80
```

In a second terminal, start watching events before you apply, so you see them in the order they happen:

```bash rail=watch-events
kubectl get events --watch-only -o custom-columns=FROM:.source.component,REASON:.reason,KIND:.involvedObject.kind,NAME:.involvedObject.name
```

Then, in the first terminal, apply with `-v=6`, which makes kubectl log every API request it sends with its response code (we cut the log prefix from each line):

```bash rail=apply-verbose
kubectl apply -f web.yaml -v=6 2>&1 | grep 'verb='
```

```text
"Response" verb="GET" url="https://127.0.0.1:45267/openapi/v3?timeout=32s" status="200 OK" milliseconds=4
"Response" verb="GET" url="https://127.0.0.1:45267/openapi/v3/apis/apps/v1?...&timeout=32s" status="200 OK" milliseconds=1
"Response" verb="GET" url="https://127.0.0.1:45267/apis/apps/v1/namespaces/default/deployments/web" status="404 Not Found" milliseconds=2
"Response" verb="POST" url="https://127.0.0.1:45267/apis/apps/v1/namespaces/default/deployments?fieldManager=kubectl-client-side-apply&fieldValidation=Strict" status="201 Created" milliseconds=4
```

That is step 1 of the sequence in plain HTTP: kubectl fetched the API schema, checked for an existing `web` (404), then created it (`201 Created`). The second terminal shows steps 2 to 6:

```text
FROM      REASON   KIND   NAME
deployment-controller   ScalingReplicaSet   Deployment   web
replicaset-controller   SuccessfulCreate    ReplicaSet   web-69977c9c79
replicaset-controller   SuccessfulCreate    ReplicaSet   web-69977c9c79
default-scheduler       Scheduled           Pod          web-69977c9c79-pwjwm
default-scheduler       Scheduled           Pod          web-69977c9c79-vfjt9
kubelet                 Pulled              Pod          web-69977c9c79-vfjt9
kubelet                 Pulled              Pod          web-69977c9c79-pwjwm
kubelet                 Created             Pod          web-69977c9c79-vfjt9
kubelet                 Created             Pod          web-69977c9c79-pwjwm
kubelet                 Started             Pod          web-69977c9c79-vfjt9
kubelet                 Started             Pod          web-69977c9c79-pwjwm
```

Read it top to bottom: the Deployment controller scaled up a ReplicaSet, the ReplicaSet controller created two Pods, the scheduler placed them, and the kubelet pulled, created and started each container. Press Ctrl+C to stop the watch.

**9. Check the ownership chain and the binding.** Use one of your Pod names:

```bash rail=ownership
kubectl get pod web-69977c9c79-sv68d -o jsonpath='{.spec.nodeName}{"\n"}{.metadata.ownerReferences[0].kind}/{.metadata.ownerReferences[0].name}{"\n"}'
kubectl get replicaset -l app.kubernetes.io/name=web -o jsonpath='{.items[0].metadata.ownerReferences[0].kind}/{.items[0].metadata.ownerReferences[0].name}{"\n"}'
```

```text
k8s-from-zero-control-plane
ReplicaSet/web-69977c9c79
Deployment/web
```

`spec.nodeName` is the field the scheduler wrote. The Pod is owned by the ReplicaSet, which is owned by the Deployment.

**10. Peek into etcd.** This is for learning only; in real life you never touch etcd by hand. The etcd Pod includes `etcdctl`, and the certificate paths are kubeadm's defaults:

```bash rail=etcd-get
kubectl -n kube-system exec etcd-k8s-from-zero-control-plane -- etcdctl \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key \
  get /registry/deployments/default/web --keys-only
```

```text
/registry/deployments/default/web
```

Your Deployment is a key in etcd, written there by the API server.

**11. Switch the scheduler off.** Because the scheduler is a static Pod, moving its file out of the manifests folder makes the kubelet stop it. Then ask for two more replicas:

```bash rail=scheduler-off
docker exec k8s-from-zero-control-plane mv /etc/kubernetes/manifests/kube-scheduler.yaml /root/
kubectl get pods -n kube-system -l component=kube-scheduler
kubectl scale deployment web --replicas=4
kubectl get pods -l app.kubernetes.io/name=web
```

```text
No resources found in kube-system namespace.
deployment.apps/web scaled
NAME                   READY   STATUS    RESTARTS   AGE
web-69977c9c79-pjmll   0/1     Pending   0          10s
web-69977c9c79-pwjwm   1/1     Running   0          50s
web-69977c9c79-qd4cv   0/1     Pending   0          10s
web-69977c9c79-vfjt9   1/1     Running   0          50s
```

The controllers still did their part: the two new Pods exist. Nobody gave them a node, so they wait in `Pending`, and the two old Pods keep serving. `kubectl describe` on a new Pod shows `Node: <none>` and no events at all. Put the file back and the scheduler catches up:

```bash rail=scheduler-on
docker exec k8s-from-zero-control-plane mv /root/kube-scheduler.yaml /etc/kubernetes/manifests/
kubectl get pods -l app.kubernetes.io/name=web
```

```text
NAME                   READY   STATUS    RESTARTS   AGE
web-69977c9c79-pjmll   1/1     Running   0          35s
web-69977c9c79-pwjwm   1/1     Running   0          75s
web-69977c9c79-qd4cv   1/1     Running   0          35s
web-69977c9c79-vfjt9   1/1     Running   0          75s
```

**12. Clean up.**

```bash rail=delete-web
kubectl delete -f web.yaml
```

Keep the cluster for part 3, or remove it with `kind delete cluster --name k8s-from-zero`. As in part 1, our lab had no internet route inside the cluster, so we preloaded `nginx:1.29-alpine` with `kind load docker-image`; you do not need to.

## When it goes wrong

**Pods stay `Pending` with no events.** Nothing scheduled them. Check that the scheduler runs: `kubectl get pods -n kube-system -l component=kube-scheduler`. If it does, `kubectl describe pod` usually shows a `FailedScheduling` event with the reason, such as not enough CPU; part 17 covers scheduling.

**A node turns `NotReady`.** Its kubelet stopped reporting. We stopped the kubelet with `docker exec k8s-from-zero-control-plane systemctl stop kubelet`; 47 seconds later:

```text
NAME                          STATUS     ROLES           AGE   VERSION
k8s-from-zero-control-plane   NotReady   control-plane   28m   v1.37.0
```

`kubectl describe node` showed every condition as `Unknown` with the message `Kubelet stopped posting node status.` Containers that were already running kept running, which is why kubectl still worked. `systemctl start kubelet` brought the node back to `Ready` within 15 seconds. On a real node, check the kubelet's service and logs (`journalctl -u kubelet`) and the machine itself. The [nodes page](https://kubernetes.io/docs/concepts/architecture/nodes/) explains heartbeats.

**`The connection to the server ... was refused`.** kubectl cannot reach the API server: the cluster is stopped, or kubectl points at the wrong cluster. Part 3 shows how kubectl decides where to connect.

**You want to know what kubectl is really doing.** Add `-v=6` to any command to see each request and its response code; `-v=8` also shows the request contents ([kubectl quick reference](https://kubernetes.io/docs/reference/kubectl/quick-reference/)).

## Cheat sheet

| Task | Command or field | Note |
|---|---|---|
| Nodes with runtime and IP | `kubectl get nodes -o wide` | `CONTAINER-RUNTIME` column |
| Control-plane and add-on Pods | `kubectl get pods -n kube-system` | names end in the node name for static Pods |
| Static Pod files on a kubeadm node | `/etc/kubernetes/manifests/` | the kubelet runs whatever is here |
| Containers as the runtime sees them | `crictl ps` (on the node) | in kind: `docker exec <node> crictl ps` |
| API server health | `kubectl get --raw='/readyz?verbose'` | also `/livez` |
| All resource types | `kubectl api-resources` | shows short names and API groups |
| Who leads the scheduler and controllers | `kubectl get leases -n kube-system` | one holder at a time |
| Watch events as they happen | `kubectl get events --watch-only` | add `-o custom-columns=...` |
| See kubectl's HTTP calls | `kubectl <command> -v=6` | `-v=8` adds request contents |
| Which node a Pod landed on | `.spec.nodeName` | written by the scheduler |
| Who owns an object | `.metadata.ownerReferences` | Pod to ReplicaSet to Deployment |
| Why a node is unhappy | `kubectl describe node <name>` | read `Conditions` |

```yaml
# The fields each component writes on a running Pod (trimmed)
apiVersion: v1
kind: Pod
metadata:
  name: web-69977c9c79-sv68d
  ownerReferences:                 # set by the replicaset controller
    - kind: ReplicaSet
      name: web-69977c9c79
spec:
  nodeName: k8s-from-zero-control-plane   # set by the scheduler
status:
  phase: Running                   # reported by the kubelet
```

## Recap and what is next

- The control plane is kube-apiserver, etcd, kube-scheduler, kube-controller-manager and, in clouds, cloud-controller-manager.
- Every node runs a kubelet and a container runtime (containerd here), and usually kube-proxy; DNS and networking come as add-ons.
- Every component talks only to the API server, and only the API server talks to etcd.
- One `kubectl apply` becomes a chain: Deployment, ReplicaSet, Pods, a scheduler binding, a kubelet start. Events and `-v=6` let you watch it.
- When one component stops, only its job stops: no scheduler means new Pods wait, and running Pods keep running.

Next: part 3, your local lab, where you install kubectl and kind properly, compare them with minikube, k3d and Docker Desktop, and learn how kubeconfig and contexts decide which cluster you are talking to. Coming tomorrow.

```rail
id: "get-nodes"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "nodes"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "wide"
        text: "An output format. The get examples describe -o wide as a table with more information than the default. The pod example names the node name as one extra column."
```

```rail
id: "get-pods-system"
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
        text: "Short form of --namespace. When you set it, this request is limited to that namespace."
      - token: "kube-system"
        text: "The namespace name passed to --namespace."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "wide"
        text: "An output format. The get examples describe -o wide as a table with more information than the default. The pod example names the node name as one extra column."
```

```rail
id: "readyz"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "--raw"
        text: "Requests a raw URI from the API server, using the transport from the kubeconfig file."
      - token: "'/readyz?verbose'"
        text: "The URI. The API health endpoints page says /readyz reports whether the API server is ready to accept traffic, and that the verbose parameter prints each check and its status for a human operator. That page shows this kubectl command."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "tail"
        text: "Shell. Prints the end of its input."
      - token: "-3"
        text: "Shell. How many lines tail prints. Here, the last 3."
```

```rail
id: "api-resources"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "api-resources"
        text: "Print the supported API resources on the server."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "head"
        text: "Shell. Prints the beginning of its input."
      - token: "-6"
        text: "Shell. How many lines head prints. Here, the first 6."
```

```rail
id: "get-leases"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "leases"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-n"
        text: "Short form of --namespace. When you set it, this request is limited to that namespace."
      - token: "kube-system"
        text: "The namespace name passed to --namespace."
```

```rail
id: "watch-events"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "events"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "--watch-only"
        text: "Watch for changes to the requested objects. The get docs say this flag skips the initial list."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "custom-columns=FROM:.source.component,REASON:.reason,KIND:.involvedObject.kind,NAME:.involvedObject.name"
        text: "custom-columns is an output format. The get examples write each column as a heading, a colon, and a JSONPath. The headings here are FROM, REASON, KIND and NAME. The paths are .source.component, .reason, .involvedObject.kind and .involvedObject.name."
```

```rail
id: "apply-verbose"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "apply"
        text: "Apply a configuration to a resource by file name or stdin. JSON and YAML are accepted. The apply docs say the resource is created if it does not exist yet."
      - token: "-f"
        text: "Short form of --filename. For apply, the file, directory or URL that contains the configuration."
      - token: "web.yaml"
        text: "The file named by --filename."
      - token: "-v=6"
        text: "Sets kubectl's log level. The quick reference says level 6 displays requested resources. The same table says level 8 displays HTTP request contents."
      - token: "2>&1"
        text: "Shell. Sends standard error to the same place as standard output, so the next command can read kubectl's log lines."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "grep"
        text: "Shell. Prints input lines that match a pattern."
      - token: "'verb='"
        text: "Shell. The pattern grep looks for."
```

```rail
id: "ownership"
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
      - token: "web-69977c9c79-sv68d"
        text: "The object name. kubectl get lists resources by type and name."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{.spec.nodeName}{\"\\n\"}{.metadata.ownerReferences[0].kind}/{.metadata.ownerReferences[0].name}{\"\\n\"}'"
        text: "jsonpath is an output format. A template is JSONPath expressions in curly braces. {.spec.nodeName} reads that field. The JSONPath page says a double-quoted string inserts text, and its example uses {\"\\n\"} for a newline. The slash between the owner-reference expressions is text outside the braces, which that page prints as plain text. [0] is the first item, the same subscript the page uses in {.users[0].name}. The two fields are the owner reference kind and name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "replicaset"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "app.kubernetes.io/name=web"
        text: "The label query. It asks for objects whose app.kubernetes.io/name label equals web."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{.items[0].metadata.ownerReferences[0].kind}/{.items[0].metadata.ownerReferences[0].name}{\"\\n\"}'"
        text: "jsonpath output for the first list item. {.items[0]} is the subscript the JSONPath page shows. The template prints that item's first owner-reference kind, a slash, its name, and a newline from {\"\\n\"}."
```

```rail
id: "etcd-get"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "-n"
        text: "Short form of --namespace. When you set it, this request is limited to that namespace."
      - token: "kube-system"
        text: "The namespace name passed to --namespace."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) -- COMMAND."
      - token: "etcd-k8s-from-zero-control-plane"
        text: "The Pod name passed to exec."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "etcdctl"
        text: "The command run in the container. The etcdctl README calls it a command line client for etcd."
      - token: "\\"
        text: "Shell. Continues the command on the next line."
      - token: "--endpoints=https://127.0.0.1:2379"
        text: "etcdctl flag. The etcdctl README uses --endpoints to name the etcd members a command talks to. The address here is https://127.0.0.1:2379."
      - token: "--cacert=/etc/kubernetes/pki/etcd/ca.crt"
        text: "etcdctl global flag for the TLS certificate authority file. The README lists --cacert among global flags and shows ETCDCTL_CACERT pointing at a certificate file. The path is the one in this command."
      - token: "--cert=/etc/kubernetes/pki/etcd/server.crt"
        text: "etcdctl global flag for the client certificate. The README lists --cert and ETCDCTL_CERT."
      - token: "--key=/etc/kubernetes/pki/etcd/server.key"
        text: "etcdctl global flag for the client key. The README lists --key and ETCDCTL_KEY."
      - token: "get"
        text: "etcdctl GET gets the key, or a range of keys when a range end is given."
      - token: "/registry/deployments/default/web"
        text: "The key get reads."
      - token: "--keys-only"
        text: "etcdctl GET option. The README says it gets only the keys."
```

```rail
id: "scheduler-off"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker"
        text: "The docker client. The lesson uses it because a kind node is a Docker container."
      - token: "exec"
        text: "docker exec runs the rest of the line in the named container. This line has no docker flags."
      - token: "k8s-from-zero-control-plane"
        text: "The container name."
      - token: "mv"
        text: "The command inside the container. It moves the first path to the second."
      - token: "/etc/kubernetes/manifests/kube-scheduler.yaml"
        text: "The source path."
      - token: "/root/"
        text: "The destination path."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-n"
        text: "Short form of --namespace. When you set it, this request is limited to that namespace."
      - token: "kube-system"
        text: "The namespace name passed to --namespace."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "component=kube-scheduler"
        text: "The label query. It asks for objects whose component label equals kube-scheduler."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "scale"
        text: "Set a new size for a deployment, replica set, replication controller, or stateful set."
      - token: "deployment"
        text: "The resource type, the TYPE in the scale synopsis TYPE NAME."
      - token: "web"
        text: "The object name."
      - token: "--replicas=4"
        text: "The new desired number of replicas. The scale command says --replicas is required."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "app.kubernetes.io/name=web"
        text: "The label query. It asks for objects whose app.kubernetes.io/name label equals web."
```

```rail
id: "scheduler-on"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker"
        text: "The docker client. The lesson uses it because a kind node is a Docker container."
      - token: "exec"
        text: "docker exec runs the rest of the line in the named container. This line has no docker flags."
      - token: "k8s-from-zero-control-plane"
        text: "The container name."
      - token: "mv"
        text: "The command inside the container. It moves the first path to the second."
      - token: "/root/kube-scheduler.yaml"
        text: "The source path."
      - token: "/etc/kubernetes/manifests/"
        text: "The destination path."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "app.kubernetes.io/name=web"
        text: "The label query. It asks for objects whose app.kubernetes.io/name label equals web."
```

```rail
id: "delete-web"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete. The delete examples include kubectl delete -f ./pod.json."
      - token: "web.yaml"
        text: "The file named by --filename."
```
