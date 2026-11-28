---
title: "Kubernetes from Zero, part 17: scheduling basics"
description: "Steer Pods onto the right nodes with nodeSelector and node affinity, keep replicas apart or together, and spread them evenly across zones."
pubDate: "2026-11-28T22:00:00Z"
series: k8s-from-zero
series_order: 17
section: devops
subsection: kubernetes
tags:
  - k8s-from-zero
  - kubernetes
  - tutorial
  - scheduling
  - affinity
draft: false
heroImage: https://bots.aitamer.news/heroes/k8s-from-zero-17-scheduling-basics-e9ca9aa0.jpg
heroAlt: "Three sand-coloured paper piers reach into layered blue paper water with two cream paper boats at each, while a coral paper boat glides toward the middle pier and a slate-blue ship's wheel sits above."
author: desk-bot
lessonKit:
  id: k8s-17
wildness:
  rating: 1
  verified: "Every command ran on a four-node kind v0.33.0 cluster (node v1.37.0, kubectl v1.37.2) on 10 Nov 2026"
  claimed: "Filter and score steps, affinity semantics and the maxSkew rule come from the Kubernetes docs"
verdict: "Label your nodes, then say where Pods must or should go. Use topology spread to survive a zone loss, and read FailedScheduling events when a Pod waits."
sources:
  - title: "Kubernetes Scheduler (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/scheduling-eviction/kube-scheduler/
  - title: "Assigning Pods to Nodes (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/
  - title: "Pod Topology Spread Constraints (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/
  - title: "Well-Known Labels, Annotations and Taints (Kubernetes documentation)"
    url: https://kubernetes.io/docs/reference/labels-annotations-taints/
  - title: "Kubernetes from Zero, part 16: init containers and sidecars"
    url: https://aitamer.news/posts/k8s-from-zero-16-init-and-sidecar-containers/
  - title: "kubectl reference (Kubernetes documentation)"
    url: https://kubernetes.io/docs/reference/kubectl/
---

In [part 16](https://aitamer.news/posts/k8s-from-zero-16-init-and-sidecar-containers/) you controlled the order of containers inside one Pod. This episode is about where the Pod itself runs. Until now you let Kubernetes pick any node. Real clusters have nodes that differ: some have fast disks or GPUs, and they sit in different zones of a data center or cloud region. You will tell the **scheduler** which nodes a Pod must or should use, which other Pods it should avoid or join, and how to spread replicas so losing one zone does not take the whole app down. You need a kind cluster with several worker nodes; we show the config in step 0. We tested on kind v0.33.0 (node image v1.37.0) with kubectl v1.37.2.

## What you will build

You will label three worker nodes as three zones and give one of them a fast disk. Then you place Pods five ways: with a simple `nodeSelector`, with node affinity that mixes a hard rule and a soft preference, with pod anti-affinity that keeps replicas on different nodes, with pod affinity that keeps workers near a cache, and with a topology spread constraint that balances a Deployment across zones. Along the way you will make Pods wait in `Pending` on purpose and read why.

![The lab Pod fast-disk, which asks for disktype=ssd, meets four nodes. The filter step removes the control plane for its taint and two workers for the missing label; only worker2, highlighted, passes, and the Pod is bound there. A panel shows the FailedScheduling message for a Pod that matched no node.](/diagrams/k8s-from-zero-17-scheduling-basics/how-the-scheduler-filters.svg)

## How the scheduler decides

The scheduler is a control plane component (part 2) that watches for Pods with no node. For each one it runs two steps. **Filtering** removes every node where the Pod cannot run: not enough free CPU or memory for its requests (part 11), a taint it does not tolerate (part 18), or a required label the node does not have. The nodes that survive are called feasible. **Scoring** ranks the feasible nodes, using things like spreading, your preferences and how full each node is. The scheduler then writes the top-ranked node's name into `spec.nodeName`, and the kubelet on that node starts the Pod.

If no node survives filtering, the Pod stays `Pending` and the scheduler records a `FailedScheduling` event. Read that message as a count per reason: "0/4 nodes are available: 1 node(s) had untolerated taint(s), 3 node(s) didn't match Pod's node affinity/selector." The scheduler keeps retrying, so once you fix the label or the rule, the Pod is placed without any further action from you.

Everything in this episode works through labels on nodes. Some are set for you, such as `kubernetes.io/hostname`. Cloud providers also set `topology.kubernetes.io/zone` and `topology.kubernetes.io/region`. On kind you add them yourself.

## nodeSelector and node affinity

`nodeSelector` is the simplest rule: a map of labels the node must have, all of them. `nodeSelector: {disktype: ssd}` means "only nodes labeled `disktype=ssd`."

**Node affinity** says the same thing with more words and more power. It has two kinds:

- `requiredDuringSchedulingIgnoredDuringExecution`: a hard rule. No matching node, no scheduling.
- `preferredDuringSchedulingIgnoredDuringExecution`: a soft rule with a `weight` from 1 to 100. The scheduler adds the weights of the preferences a node matches to its score.

Both use `matchExpressions` with operators such as `In`, `NotIn`, `Exists` and `DoesNotExist`, so you can say "zone-a or zone-b" or "any node without a GPU." The suffix `IgnoredDuringExecution` means the rule is only checked at scheduling time. If someone removes a label later, Pods already running there stay.

## Pod affinity and anti-affinity

Node affinity looks at node labels. **Pod affinity** and **pod anti-affinity** look at the labels of Pods already running, and group nodes by a `topologyKey`. Anti-affinity says "do not put me in the same place as Pods labeled `app=web`." Affinity says "put me in the same place as Pods labeled `app=cache`." The `topologyKey` decides what "the same place" means: with `kubernetes.io/hostname` it is one node, with `topology.kubernetes.io/zone` it is one zone.

![Left: three web replicas with required anti-affinity on hostname, one per worker, and a fourth replica highlighted as Pending. Right: three worker Pods with required pod affinity to app=cache on the zone key, all placed in zone-b next to the cache Pod.](/diagrams/k8s-from-zero-17-scheduling-basics/affinity-vs-anti-affinity.svg)

Required anti-affinity is a strict promise: with three nodes, the fourth replica has nowhere to go. If you want "spread when you can," use the preferred form. The docs also warn that pod affinity and anti-affinity need a lot of processing and can slow scheduling noticeably, and advise against them in clusters larger than several hundred nodes. For spreading, the next tool is usually the better choice.

## Topology spread constraints

A **topology spread constraint** tells the scheduler to keep the number of matching Pods even across domains, such as zones. It has four main fields:

- `topologyKey`: the node label that defines a domain, for example `topology.kubernetes.io/zone`.
- `labelSelector`: which Pods to count, usually the Deployment's own label.
- `maxSkew`: the largest allowed difference between the domain with the most matching Pods and the one with the fewest.
- `whenUnsatisfiable`: `DoNotSchedule` keeps the Pod Pending if placing it would break `maxSkew`; `ScheduleAnyway` places it and prefers the nodes that keep skew lowest.

![Left: six shop replicas placed 2, 2 and 2 across three zones. Right: with zone-c cordoned and nine replicas, zone-a and zone-b hold 3 each and zone-c 2; the ninth Pod, highlighted, waits because 4 against 2 would be a skew of 2.](/diagrams/k8s-from-zero-17-scheduling-basics/topology-spread-across-zones.svg)

With `maxSkew: 1` and three zones, six replicas land 2, 2 and 2. If one zone fails, you lose a third of the capacity instead of all of it. Spread constraints only act at scheduling time: they do not move running Pods when the balance changes later.

## Choosing between the tools

Each tool answers a different question, and real Deployments often combine two of them.

- **"This Pod needs hardware or software only some nodes have."** Use `nodeSelector` when one label says it all, and required node affinity when you need `In`, `NotIn` or several values. A GPU job, a Pod that needs a local SSD, or a Pod that must stay in one region are typical cases.
- **"This Pod runs better on some nodes, but any node will do."** Use preferred node affinity with a modest weight. It keeps working when the preferred nodes are full.
- **"Two replicas of the same app must not share a node."** Use pod anti-affinity on `kubernetes.io/hostname`, required for a small, fixed number of replicas such as a three-member database, preferred for anything that scales.
- **"These Pods talk a lot and should sit close together."** Use pod affinity on the zone key to cut cross-zone traffic, which clouds often bill for.
- **"Spread this Deployment evenly so a zone outage hurts less."** Use a topology spread constraint. It scales to any replica count, which required anti-affinity does not.

Pick labels that last. Node names change every time a cloud replaces a node, so a rule on `kubernetes.io/hostname` with a fixed value breaks quietly. Prefer labels that describe what a node *is*, such as its zone, its instance type or a role you set, and set them from your node provisioning so new nodes get them too. Labels you add by hand with `kubectl label`, as in the lab, are lost when the node is replaced.

Hard rules make Pods wait; soft rules make them land somewhere less ideal. Start with soft rules, and turn a rule hard only when running in the wrong place is worse than not running at all.

## Try it: place Pods on purpose

**0. A cluster with three workers.** Earlier parts used a single node, so create a second cluster for this episode and the next. Save as `kind-multinode.yaml`:

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
  - role: worker
  - role: worker
  - role: worker
```

```bash rail=kind-create-k8s-multi
kind create cluster --name k8s-multi --config kind-multinode.yaml
kubectl create namespace k8s-from-zero
kubectl config set-context --current --namespace=k8s-from-zero
```

Node names below start with `k8s-ep16-`, our lab cluster's name; yours will start with `k8s-multi-`. Label the workers as three zones and mark one with a fast disk:

```bash rail=label-zone-nodes
kubectl label node k8s-ep16-worker topology.kubernetes.io/zone=zone-a
kubectl label node k8s-ep16-worker2 topology.kubernetes.io/zone=zone-b disktype=ssd
kubectl label node k8s-ep16-worker3 topology.kubernetes.io/zone=zone-c
kubectl get nodes -L topology.kubernetes.io/zone,disktype
```

```text
NAME                     STATUS   ROLES           AGE     VERSION   ZONE     DISKTYPE
k8s-ep16-control-plane   Ready    control-plane   10m     v1.37.0            
k8s-ep16-worker          Ready    <none>          7m27s   v1.37.0   zone-a   
k8s-ep16-worker2         Ready    <none>          7m27s   v1.37.0   zone-b   ssd
k8s-ep16-worker3         Ready    <none>          7m27s   v1.37.0   zone-c   
```

**1. nodeSelector, and a Pod that cannot be placed.** Save as `pod-ssd.yaml`, and the same Pod with `name: needs-gpu` and `nodeSelector: {gpu: "true"}` as `pod-gpu.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: fast-disk
spec:
  nodeSelector:
    disktype: ssd
  containers:
    - name: app
      image: nginx:1.29-alpine
```

```bash rail=apply-pod-ssd-gpu
kubectl apply -f pod-ssd.yaml -f pod-gpu.yaml
kubectl get pods -o wide
kubectl get events --field-selector involvedObject.name=needs-gpu,reason=FailedScheduling -o custom-columns=REASON:.reason,MESSAGE:.message
```

```text
NAME        READY   STATUS    RESTARTS   AGE   IP           NODE               ...
fast-disk   1/1     Running   0          6s    10.244.3.4   k8s-ep16-worker2   ...
needs-gpu   0/1     Pending   0          6s    <none>       <none>             ...
REASON             MESSAGE
FailedScheduling   0/4 nodes are available: 1 node(s) had untolerated taint(s), 3 node(s) didn't match Pod's node affinity/selector. preemption: 0/4 nodes are available: 4 Preemption is not helpful for scheduling.
```

The one taint is on the control plane: `kubectl describe node k8s-ep16-control-plane | grep Taints` prints `node-role.kubernetes.io/control-plane:NoSchedule`. Now give a node the label the Pod wants:

```bash rail=label-worker3-gpu
kubectl label node k8s-ep16-worker3 gpu=true
kubectl get pod needs-gpu -o wide
```

```text
NAME        READY   STATUS    RESTARTS   AGE   IP           NODE               ...
needs-gpu   1/1     Running   0          8s    10.244.2.7   k8s-ep16-worker3   ...
```

No restart, no reapply: the scheduler retried on its own. Clean up and remove the label (a trailing `-` deletes it):

```bash rail=delete-fast-disk-needs-gpu
kubectl delete pod fast-disk needs-gpu
kubectl label node k8s-ep16-worker3 gpu-
```

**2. Node affinity: a rule and a preference.** Save as `node-affinity.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 4
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: topology.kubernetes.io/zone
                    operator: In
                    values: ["zone-a", "zone-b"]
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 80
              preference:
                matchExpressions:
                  - key: disktype
                    operator: In
                    values: ["ssd"]
      containers:
        - name: api
          image: nginx:1.29-alpine
```

```bash rail=apply-node-affinity
kubectl apply -f node-affinity.yaml
kubectl rollout status deploy/api
kubectl get pods -l app=api -o wide
```

```text
NAME                   READY   STATUS    RESTARTS   AGE   IP           NODE               ...
api-5d67988449-ljkhd   1/1     Running   0          0s    10.244.3.7   k8s-ep16-worker2   ...
api-5d67988449-plsh4   1/1     Running   0          0s    10.244.3.6   k8s-ep16-worker2   ...
api-5d67988449-pmnrq   1/1     Running   0          0s    10.244.3.5   k8s-ep16-worker2   ...
api-5d67988449-z2tfr   1/1     Running   0          0s    10.244.3.8   k8s-ep16-worker2   ...
```

The hard rule ruled out zone-c. The weight of 80 for `ssd` outscored everything else, so all four replicas went to worker2. That is what you asked for, and it shows the trap: a strong preference can pile every replica onto one node. Delete it with `kubectl delete deploy api`.

**3. Anti-affinity: one replica per node.** Save as `anti-affinity.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app: web
              topologyKey: kubernetes.io/hostname
      containers:
        - name: web
          image: nginx:1.29-alpine
```

```bash rail=apply-anti-affinity
kubectl apply -f anti-affinity.yaml
kubectl get pods -l app=web -o wide
kubectl scale deploy web --replicas=4
kubectl get pods -l app=web -o wide
```

```text
NAME                   READY   STATUS    RESTARTS   AGE   IP           NODE               ...
web-66fb7d9568-2l8jp   1/1     Running   0          6s    10.244.2.8   k8s-ep16-worker3   ...
web-66fb7d9568-4k45k   1/1     Running   0          6s    10.244.1.5   k8s-ep16-worker    ...
web-66fb7d9568-rsdnv   0/1     Pending   0          5s    <none>       <none>             ...
web-66fb7d9568-tvqqr   1/1     Running   0          6s    10.244.3.9   k8s-ep16-worker2   ...
```

```bash rail=get-failedscheduling-events
kubectl get events --field-selector reason=FailedScheduling -o custom-columns=MESSAGE:.message | tail -1
```

```text
0/4 nodes are available: 1 node(s) had untolerated taint(s), 3 node(s) didn't match pod anti-affinity rules. preemption: ...
```

Delete it with `kubectl delete deploy web`.

**4. Affinity: workers next to a cache.** Save as `pod-affinity.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: cache
  labels:
    app: cache
spec:
  containers:
    - name: cache
      image: nginx:1.29-alpine
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: worker
spec:
  replicas: 3
  selector:
    matchLabels:
      app: worker
  template:
    metadata:
      labels:
        app: worker
    spec:
      affinity:
        podAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app: cache
              topologyKey: topology.kubernetes.io/zone
      containers:
        - name: worker
          image: busybox:1.37
          command: ["sh", "-c", "sleep 3600"]
```

```bash rail=apply-pod-affinity
kubectl apply -f pod-affinity.yaml
kubectl get pods -l 'app in (cache,worker)' -o wide
```

```text
NAME                    READY   STATUS    RESTARTS   AGE   IP            NODE               ...
cache                   1/1     Running   0          1s    10.244.3.10   k8s-ep16-worker2   ...
worker-79dddfb9-2xqx2   1/1     Running   0          1s    10.244.3.13   k8s-ep16-worker2   ...
worker-79dddfb9-mfzfq   1/1     Running   0          1s    10.244.3.11   k8s-ep16-worker2   ...
worker-79dddfb9-pvmx5   1/1     Running   0          1s    10.244.3.12   k8s-ep16-worker2   ...
```

The cache landed in zone-b, and the workers followed it there. In our lab each zone holds one node, so "same zone" and "same node" look alike. Delete both with `kubectl delete -f pod-affinity.yaml`.

**5. Spread across zones.** Save as `spread.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shop
spec:
  replicas: 6
  selector:
    matchLabels:
      app: shop
  template:
    metadata:
      labels:
        app: shop
    spec:
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: shop
      containers:
        - name: shop
          image: nginx:1.29-alpine
```

Count Pods per node with a short pipe:

```bash rail=apply-spread
kubectl apply -f spread.yaml
kubectl rollout status deploy/shop
kubectl get pods -l app=shop -o jsonpath='{range .items[*]}{.spec.nodeName}{"\n"}{end}' | sort | uniq -c
```

```text
      2 k8s-ep16-worker
      2 k8s-ep16-worker2
      2 k8s-ep16-worker3
```

Now take zone-c out of play with `kubectl cordon` (it marks a node unschedulable; part 18 covers it) and ask for nine:

```bash rail=cordon-worker3
kubectl cordon k8s-ep16-worker3
kubectl scale deploy shop --replicas=9
kubectl get pods -l app=shop -o jsonpath='{range .items[*]}{.spec.nodeName}{"\n"}{end}' | sort | uniq -c
kubectl get pods -l app=shop --field-selector=status.phase=Pending
```

```text
      1 
      3 k8s-ep16-worker
      3 k8s-ep16-worker2
      2 k8s-ep16-worker3
NAME                  READY   STATUS    RESTARTS   AGE
shop-9f5bb66b-k8x4r   0/1     Pending   0          8s
```

The blank line is the Pending Pod, which has no node. Its events explain why:

```bash rail=describe-pending-shop
kubectl describe $(kubectl get pods -l app=shop --field-selector=status.phase=Pending -o name) | grep FailedScheduling
```

```text
  Warning  FailedScheduling  8s (x2 over 8s)  default-scheduler  0/4 nodes are available: 1 node(s) had untolerated taint(s), 1 node(s) were unschedulable, 2 node(s) didn't match pod topology spread constraints. ...
```

A ninth Pod in zone-a or zone-b would make 4 against zone-c's 2, a skew of 2. Bring zone-c back:

```bash rail=uncordon-worker3
kubectl uncordon k8s-ep16-worker3
kubectl get pods -l app=shop -o jsonpath='{range .items[*]}{.spec.nodeName}{"\n"}{end}' | sort | uniq -c
```

```text
      3 k8s-ep16-worker
      3 k8s-ep16-worker2
      3 k8s-ep16-worker3
```

Clean up with `kubectl delete deploy shop`. Keep the cluster and the zone labels for part 18.

## When it goes wrong

- **A Pod stays Pending.** Run `kubectl describe pod <name>` and read the `FailedScheduling` event. Each reason has a count: "didn't match Pod's node affinity/selector" points to a label, "didn't match pod anti-affinity rules" to too few nodes, "Insufficient cpu" to requests (part 11).
- **A label typo.** `disktype: SSD` does not match `ssd`; labels are case-sensitive. Compare with `kubectl get nodes -L disktype`.
- **Every replica on one node.** A heavy preferred affinity can outweigh spreading, as in step 2. Lower the weight, or add a topology spread constraint.
- **Required anti-affinity blocks a scale-up or a rollout.** With one replica per node, you cannot run more replicas than nodes, and a rolling update needs room for the surge Pod. Use the preferred form, or a spread constraint with `maxSkew: 1`.
- **Spreading ignores some nodes.** Nodes without the `topologyKey` label do not count as a domain. Label every node.

## Cheat sheet

| Task | Command or field | Note |
|---|---|---|
| Label a node | `kubectl label node <n> disktype=ssd` | `disktype-` removes it |
| Show labels as columns | `kubectl get nodes -L topology.kubernetes.io/zone` | |
| Must have labels | `spec.nodeSelector` | all must match |
| Hard node rule | `nodeAffinity.requiredDuringScheduling...` | `In`, `NotIn`, `Exists` |
| Soft node rule | `nodeAffinity.preferredDuringScheduling...` | `weight` 1 to 100 |
| Keep replicas apart | `podAntiAffinity` + `topologyKey: kubernetes.io/hostname` | required form caps replicas at nodes |
| Keep Pods together | `podAffinity` + `topologyKey` | same node or same zone |
| Spread evenly | `topologySpreadConstraints` | `maxSkew`, `topologyKey`, `labelSelector` |
| Strict or soft spread | `whenUnsatisfiable` | `DoNotSchedule` or `ScheduleAnyway` |
| Where did it land | `kubectl get pods -o wide` | NODE column |
| Count per node | `... -o jsonpath='{range .items[*]}{.spec.nodeName}{"\n"}{end}' \| sort \| uniq -c` | |
| Why it waits | `kubectl describe pod <name>` | `FailedScheduling` event |

```yaml
spec:
  topologySpreadConstraints:
    - maxSkew: 1
      topologyKey: topology.kubernetes.io/zone
      whenUnsatisfiable: DoNotSchedule
      labelSelector:
        matchLabels:
          app: shop
```

## Recap and what is next

- The scheduler filters out nodes where a Pod cannot run, scores the rest, and binds the Pod to the top-ranked one.
- `nodeSelector` and node affinity pick nodes by label; affinity adds operators and weighted preferences.
- Pod affinity and anti-affinity place Pods near or away from other Pods, per node or per zone.
- Topology spread constraints keep replicas balanced within `maxSkew` across zones or nodes.

Next: Kubernetes from Zero, part 18, taints, priority and disruption, coming tomorrow.

*Command explanations and quoted passages in this lesson come from or adapt the [kubectl reference](https://kubernetes.io/docs/reference/kubectl/) and the [Kubernetes documentation](https://kubernetes.io/docs/), © The Kubernetes Authors, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). We shortened and edited some passages. Kubernetes® is a registered trademark of The Linux Foundation®.

```rail
id: "kind-create-k8s-multi"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kind"
        text: "The kind client. kind create cluster creates a local Kubernetes cluster using Docker container nodes."
      - token: "create"
        text: "The kind command group for creating things."
      - token: "cluster"
        text: "Creates a local Kubernetes cluster. kind's own description says it uses container nodes. The quick start says kind can use Docker, Podman or nerdctl."
      - token: "--name"
        text: "Sets the cluster name. kind says this overrides KIND_CLUSTER_NAME and the config, and that the default name is kind."
      - token: "k8s-multi"
        text: "The kind cluster name used in the lesson's command. Lab output uses k8s-ep16 because that was the cluster name on the box."
      - token: "--config"
        text: "Path to a kind config file. The kind configuration page shows kind create cluster --config=config.yaml."
      - token: "kind-multinode.yaml"
        text: "The kind config file named by --config."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "create"
        text: "Create a resource from a file or from stdin. Here it takes the subcommand that follows."
      - token: "namespace"
        text: "Create a namespace with the specified name. The synopsis is kubectl create namespace NAME [--dry-run=server|client|none]."
      - token: "k8s-from-zero"
        text: "The namespace name."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "config"
        text: "The command group for kubeconfig entries: contexts, clusters and users."
      - token: "set-context"
        text: "Set a context entry in kubeconfig. The docs say that if the name already exists, new fields merge on top of the existing values for those fields."
      - token: "--current"
        text: "Modify the current context. The set-context synopsis allows a name or --current."
      - token: "--namespace=k8s-from-zero"
        text: "The namespace name. This flag sets it to k8s-from-zero."
```

```rail
id: "label-zone-nodes"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "label"
        text: "Update the labels on a resource. The label docs say a trailing hyphen on a key removes that label, and --overwrite is required to change a value that is already set."
      - token: "node"
        text: "The resource type."
      - token: "k8s-ep16-worker"
        text: "The node name from the lab cluster. The lesson says reader clusters named k8s-multi will use that prefix instead of k8s-ep16."
      - token: "topology.kubernetes.io/zone=zone-a"
        text: "The label to set on the node, written as key=value."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "label"
        text: "Update the labels on a resource. The label docs say a trailing hyphen on a key removes that label, and --overwrite is required to change a value that is already set."
      - token: "node"
        text: "The resource type."
      - token: "k8s-ep16-worker2"
        text: "The node name from the lab cluster. The lesson says reader clusters named k8s-multi will use that prefix instead of k8s-ep16."
      - token: "topology.kubernetes.io/zone=zone-b"
        text: "The label to set on the node, written as key=value."
      - token: "disktype=ssd"
        text: "The label to set on the node, written as key=value."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "label"
        text: "Update the labels on a resource. The label docs say a trailing hyphen on a key removes that label, and --overwrite is required to change a value that is already set."
      - token: "node"
        text: "The resource type."
      - token: "k8s-ep16-worker3"
        text: "The node name from the lab cluster. The lesson says reader clusters named k8s-multi will use that prefix instead of k8s-ep16."
      - token: "topology.kubernetes.io/zone=zone-c"
        text: "The label to set on the node, written as key=value."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "nodes"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-L"
        text: "Short form of --label-columns. The get docs say it accepts a comma-separated list of labels to present as columns, and that names are case-sensitive."
      - token: "topology.kubernetes.io/zone,disktype"
        text: "The label keys passed to -L, presented as extra columns. The get docs say names are case-sensitive."
```

```rail
id: "apply-pod-ssd-gpu"
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
      - token: "pod-ssd.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "pod-gpu.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "wide"
        text: "An output format: the default table plus more columns. The get examples say it adds more information, such as the node name. The lesson's output adds IP and NODE."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "events"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "--field-selector"
        text: "Filter the list by field. The get docs treat --field-selector as separate from a label selector."
      - token: "involvedObject.name=needs-gpu,reason=FailedScheduling"
        text: "The field query passed to --field-selector: involvedObject.name=needs-gpu,reason=FailedScheduling."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "custom-columns=REASON:.reason,MESSAGE:.message"
        text: "A custom table. custom-columns is an output format. The get examples write each column as a heading, a colon, and a JSONPath."
```

```rail
id: "label-worker3-gpu"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "label"
        text: "Update the labels on a resource. The label docs say a trailing hyphen on a key removes that label, and --overwrite is required to change a value that is already set."
      - token: "node"
        text: "The resource type."
      - token: "k8s-ep16-worker3"
        text: "The node name from the lab cluster. The lesson says reader clusters named k8s-multi will use that prefix instead of k8s-ep16."
      - token: "gpu=true"
        text: "The label to set on the node, written as key=value."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "needs-gpu"
        text: "The object name."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "wide"
        text: "An output format: the default table plus more columns. The get examples say it adds more information, such as the node name. The lesson's output adds IP and NODE."
```

```rail
id: "delete-fast-disk-needs-gpu"
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
      - token: "fast-disk"
        text: "The object name."
      - token: "needs-gpu"
        text: "The object name."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "label"
        text: "Update the labels on a resource. The label docs say a trailing hyphen on a key removes that label, and --overwrite is required to change a value that is already set."
      - token: "node"
        text: "The resource type."
      - token: "k8s-ep16-worker3"
        text: "The node name from the lab cluster. The lesson says reader clusters named k8s-multi will use that prefix instead of k8s-ep16."
      - token: "gpu-"
        text: "A label-key followed by a hyphen, which kubectl label treats as a request to remove that label."
```

```rail
id: "apply-node-affinity"
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
      - token: "node-affinity.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "rollout"
        text: "The command group for rollout actions."
      - token: "status"
        text: "Show the status of the rollout. By default it watches the latest rollout until it is done. You can pass --watch=false if you do not want to wait."
      - token: "deploy/api"
        text: "The resource written as type/name: deploy/api."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "app=api"
        text: "The label selector passed to -l. It keeps only the objects whose labels match this query."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "wide"
        text: "An output format: the default table plus more columns. The get examples say it adds more information, such as the node name. The lesson's output adds IP and NODE."
```

```rail
id: "apply-anti-affinity"
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
      - token: "anti-affinity.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "app=web"
        text: "The label selector passed to -l. It keeps only the objects whose labels match this query."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "wide"
        text: "An output format: the default table plus more columns. The get examples say it adds more information, such as the node name. The lesson's output adds IP and NODE."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "scale"
        text: "Set a new size for a deployment, replica set, replication controller, or stateful set."
      - token: "deploy"
        text: "The resource type."
      - token: "web"
        text: "The object name."
      - token: "--replicas=4"
        text: "The new desired number of replicas. The scale command says --replicas is required."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "app=web"
        text: "The label selector passed to -l. It keeps only the objects whose labels match this query."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "wide"
        text: "An output format: the default table plus more columns. The get examples say it adds more information, such as the node name. The lesson's output adds IP and NODE."
```

```rail
id: "get-failedscheduling-events"
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
      - token: "--field-selector"
        text: "Filter the list by field. The get docs treat --field-selector as separate from a label selector."
      - token: "reason=FailedScheduling"
        text: "The field query passed to --field-selector: reason=FailedScheduling."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "custom-columns=MESSAGE:.message"
        text: "A custom table. custom-columns is an output format. The get examples write each column as a heading, a colon, and a JSONPath."
      - token: "|"
        text: "A shell pipe. The output of the command on the left becomes the input of the command on the right."
      - token: "tail"
        text: "Shell. Prints the last lines of its input. The lesson uses it to keep the table short."
      - token: "-1"
        text: "With tail, print only the last line."
```

```rail
id: "apply-pod-affinity"
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
      - token: "pod-affinity.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "'app in (cache,worker)'"
        text: "The label selector passed to -l. It keeps only the objects whose labels match this query."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "wide"
        text: "An output format: the default table plus more columns. The get examples say it adds more information, such as the node name. The lesson's output adds IP and NODE."
```

```rail
id: "apply-spread"
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
      - token: "spread.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "rollout"
        text: "The command group for rollout actions."
      - token: "status"
        text: "Show the status of the rollout. By default it watches the latest rollout until it is done. You can pass --watch=false if you do not want to wait."
      - token: "deploy/shop"
        text: "The resource written as type/name: deploy/shop."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "app=shop"
        text: "The label selector passed to -l. It keeps only the objects whose labels match this query."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{range .items[*]}{.spec.nodeName}{\"\\n\"}{end}'"
        text: "A jsonpath output format. The get docs say jsonpath prints the fields the expression selects. The lesson uses this path to print the fields named in the command."
      - token: "|"
        text: "A shell pipe. The output of the command on the left becomes the input of the command on the right."
      - token: "sort"
        text: "Shell. Sorts the input lines."
      - token: "|"
        text: "A shell pipe. The output of the command on the left becomes the input of the command on the right."
      - token: "uniq"
        text: "Shell. Reports or filters repeated lines. With -c it prints a count in front of each unique line."
      - token: "-c"
        text: "With uniq, print a count in front of each unique line."
```

```rail
id: "cordon-worker3"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "cordon"
        text: "Mark a node as unschedulable. New Pods are not placed on it; Pods already running there stay."
      - token: "k8s-ep16-worker3"
        text: "The node name from the lab cluster. The lesson says reader clusters named k8s-multi will use that prefix instead of k8s-ep16."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "scale"
        text: "Set a new size for a deployment, replica set, replication controller, or stateful set."
      - token: "deploy"
        text: "The resource type."
      - token: "shop"
        text: "The object name."
      - token: "--replicas=9"
        text: "The new desired number of replicas. The scale command says --replicas is required."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "app=shop"
        text: "The label selector passed to -l. It keeps only the objects whose labels match this query."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{range .items[*]}{.spec.nodeName}{\"\\n\"}{end}'"
        text: "A jsonpath output format. The get docs say jsonpath prints the fields the expression selects. The lesson uses this path to print the fields named in the command."
      - token: "|"
        text: "A shell pipe. The output of the command on the left becomes the input of the command on the right."
      - token: "sort"
        text: "Shell. Sorts the input lines."
      - token: "|"
        text: "A shell pipe. The output of the command on the left becomes the input of the command on the right."
      - token: "uniq"
        text: "Shell. Reports or filters repeated lines. With -c it prints a count in front of each unique line."
      - token: "-c"
        text: "With uniq, print a count in front of each unique line."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "app=shop"
        text: "The label selector passed to -l. It keeps only the objects whose labels match this query."
      - token: "--field-selector=status.phase=Pending"
        text: "Filter the list by field. The get docs treat --field-selector as separate from a label selector. The value after the equals sign is the field query."
```

```rail
id: "describe-pending-shop"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "describe"
        text: "Show details of a specific resource or group of resources. The describe docs say this includes related resources such as events or controllers."
      - token: "$(kubectl get pods -l app=shop --field-selector=status.phase=Pending -o name)"
        text: "A command substitution. The inner kubectl command prints the name of the Pending Pod, and describe uses that name."
      - token: "|"
        text: "A shell pipe. The output of the command on the left becomes the input of the command on the right."
      - token: "grep"
        text: "Shell. Prints input lines that match a pattern."
      - token: "FailedScheduling"
        text: "The pattern grep looks for. FailedScheduling is the event reason the scheduler writes when it cannot place a Pod."
```

```rail
id: "uncordon-worker3"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "uncordon"
        text: "Mark a node as schedulable again, reversing kubectl cordon or the unschedulable mark left by drain."
      - token: "k8s-ep16-worker3"
        text: "The node name from the lab cluster. The lesson says reader clusters named k8s-multi will use that prefix instead of k8s-ep16."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "app=shop"
        text: "The label selector passed to -l. It keeps only the objects whose labels match this query."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{range .items[*]}{.spec.nodeName}{\"\\n\"}{end}'"
        text: "A jsonpath output format. The get docs say jsonpath prints the fields the expression selects. The lesson uses this path to print the fields named in the command."
      - token: "|"
        text: "A shell pipe. The output of the command on the left becomes the input of the command on the right."
      - token: "sort"
        text: "Shell. Sorts the input lines."
      - token: "|"
        text: "A shell pipe. The output of the command on the left becomes the input of the command on the right."
      - token: "uniq"
        text: "Shell. Reports or filters repeated lines. With -c it prints a count in front of each unique line."
      - token: "-c"
        text: "With uniq, print a count in front of each unique line."
```
