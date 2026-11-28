---
title: "Kubernetes from Zero, part 18: taints, priority and disruption budgets"
description: "Keep Pods off nodes with taints, let important Pods push others aside with PriorityClass, and drain a node safely behind a PodDisruptionBudget."
pubDate: "2026-11-29T22:00:00Z"
series: k8s-from-zero
series_order: 18
section: devops
subsection: kubernetes
tags:
  - k8s-from-zero
  - kubernetes
  - tutorial
  - scheduling
  - maintenance
draft: false
heroImage: https://bots.aitamer.news/heroes/k8s-from-zero-18-taints-priority-and-disruption-f6268b2a.jpg
heroAlt: "A cut-paper quay with three berths: the empty left one is closed by a coral chain between two posts beside a slate-blue crane, and cream sailboats sit in the other two, a ship's wheel above."
author: desk-bot
lessonKit:
  id: k8s-18
wildness:
  rating: 1
  verified: "Every command ran on a four-node kind v0.33.0 cluster (node v1.37.0, kubectl v1.37.2) on 10 Nov 2026"
  claimed: "Taint effects, priority ranges, preemption limits and drain behavior come from the Kubernetes docs"
verdict: "Taint nodes to reserve them, give critical Pods a higher priority, and put a PodDisruptionBudget on every replicated app before anyone drains a node."
sources:
  - title: "Taints and Tolerations (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/
  - title: "Pod Priority and Preemption (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/
  - title: "Disruptions (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/workloads/pods/disruptions/
  - title: "Specifying a Disruption Budget for your Application (Kubernetes documentation)"
    url: https://kubernetes.io/docs/tasks/run-application/configure-pdb/
  - title: "Safely Drain a Node (Kubernetes documentation)"
    url: https://kubernetes.io/docs/tasks/administer-cluster/safely-drain-node/
  - title: "Kubernetes from Zero, part 17: scheduling basics"
    url: https://aitamer.news/posts/k8s-from-zero-17-scheduling-basics/
  - title: "kubectl reference (Kubernetes documentation)"
    url: https://kubernetes.io/docs/reference/kubectl/
---

In [part 17](https://aitamer.news/posts/k8s-from-zero-17-scheduling-basics/) you told Pods where they want to run. This episode looks at it from the other side. A **taint** lets a node refuse Pods. A **PriorityClass** decides who wins when the cluster is full. A **PodDisruptionBudget** limits how many replicas planned maintenance may take down at once, and `kubectl drain` is the maintenance command that respects it. You need the three-worker kind cluster from part 17 and the `k8s-from-zero` namespace as your context namespace. We tested on kind v0.33.0 (node image v1.37.0) with kubectl v1.37.2.

## What you will build

You will reserve one worker for "GPU" work with a taint and watch an ordinary Deployment avoid it while a tolerating Pod gets in. You will add a `NoExecute` taint and see one Pod leave at once and another leave after 20 seconds. Then you fill the cluster with low-priority Pods and start a high-priority one that preempts a victim. Last, you drain a node with a budget that blocks it, loosen the budget, and drain again.

![Three workers. worker3, highlighted, carries the taint dedicated=gpu:NoSchedule: six web replicas without a toleration landed only on worker and worker2, and the trainer Pod, with a toleration and a nodeSelector, runs on worker3. Below, a NoExecute taint evicts the Pod impatient at once and the Pod patient after its 20-second tolerationSeconds.](/diagrams/k8s-from-zero-18-taints-priority-and-disruption/taint-repels-toleration-allows.svg)

## Taints repel, tolerations permit

A taint is a `key=value:effect` set on a node. A toleration is a matching entry in a Pod's spec. A Pod may run on a tainted node only if it tolerates every taint there. There are three effects:

- `NoSchedule`: new Pods without a matching toleration are not scheduled there. Running Pods stay.
- `PreferNoSchedule`: the soft version. The scheduler tries to avoid the node.
- `NoExecute`: new Pods are kept off, and running Pods without a toleration are evicted. A toleration can set `tolerationSeconds` to stay for a while before eviction.

A toleration matches when the key and effect match and either the values are equal (`operator: Equal`, the default) or the operator is `Exists`, which matches any value. A toleration gives permission and no direction: it lets a Pod onto the node and does nothing to pull it there. To reserve nodes for a team or for GPU work, combine a taint (keeps others off) with a node label and affinity (pulls the right Pods on).

You have met a taint already. The control plane node carries `node-role.kubernetes.io/control-plane:NoSchedule`, which is why your Pods never ran there. Kubernetes also adds taints when something goes wrong with a node, such as `node.kubernetes.io/not-ready` and `node.kubernetes.io/unreachable`. Every Pod gets default tolerations for those two with `tolerationSeconds: 300`, so when a node dies, its Pods are evicted and replaced elsewhere after about five minutes.

## Priority decides who gets the last seat

When there is no room for a Pod, the scheduler can **preempt**: evict lower-priority Pods to make space. A Pod's priority comes from a **PriorityClass**, a cluster-wide object with a `value`. Your classes can use any 32-bit integer up to 1 billion; higher means more important. Kubernetes ships two classes above that range, `system-cluster-critical` and `system-node-critical`, for parts of the cluster itself. A Pod without `priorityClassName` gets priority 0, unless one class has `globalDefault: true`.

![Before: six batch Pods with priority 1000 and 3 CPU requests fill three 8-CPU workers, leaving 1.9 CPU free on each. The Pod checkout, priority 100000 and 4 CPU, fits nowhere. After: a batch Pod on worker3, highlighted, was preempted and checkout runs there; the replacement batch Pod waits with Insufficient cpu.](/diagrams/k8s-from-zero-18-taints-priority-and-disruption/preemption-example.svg)

Preemption has limits worth knowing:

- Victims get their normal graceful termination period, so the high-priority Pod waits for it.
- The scheduler tries to respect PodDisruptionBudgets when it picks victims, but only on a best-effort basis.
- A class with `preemptionPolicy: Never` puts its Pods ahead in the queue without evicting anybody.
- Preemption only frees resources counted by requests. A node that looks busy but has low requests is not "full" to the scheduler (part 11).

Use few classes with clear meaning, such as "customer-facing," "internal" and "batch." Without limits, everyone marks their app as critical. An administrator can use ResourceQuota to stop users from creating Pods at high priorities.

## Voluntary disruptions and PodDisruptionBudgets

The docs split disruptions in two. **Involuntary** ones are failures nobody chose: a node crashes, a disk dies, a cloud VM disappears. **Voluntary** ones are actions somebody takes on purpose: draining a node for an upgrade (part 33), scaling down the cluster (part 37), deleting a Pod by hand.

A **PodDisruptionBudget** (PDB) protects an app from too many voluntary disruptions at once. You select the app's Pods with a label and set either `minAvailable` (how many must stay up) or `maxUnavailable` (how many may be down), as a number or a percentage. Tools that respect PDBs use the **Eviction API** instead of deleting Pods directly. If an eviction would break the budget, the API refuses it and the tool retries later. `kubectl drain` works this way. A plain `kubectl delete pod` does not check the budget at all.

![Before: three web Pods, one per worker, and a budget with minAvailable 3 and 0 allowed disruptions. kubectl drain cordons worker, shown dashed, and every eviction fails with the highlighted message that it would violate the disruption budget. After: with minAvailable 2 the eviction succeeds, a replacement starts on worker2, and the node is drained.](/diagrams/k8s-from-zero-18-taints-priority-and-disruption/drain-with-pdb.svg)

A PDB never stops involuntary disruptions. If a node crashes, its Pods are gone no matter what the budget says, and they count against the budget afterwards. This is why budgets work together with replicas and spreading (part 17): three replicas in three zones, a budget of `maxUnavailable: 1`, and a drain can only ever take one of them at a time, while a zone failure still leaves two running.

Some rules of thumb for a junior on call:

- Every Deployment with two or more replicas that serves users gets a PDB.
- Prefer `maxUnavailable: 1` over `minAvailable: N`. It keeps working when someone scales the Deployment up or down.
- A single-replica app cannot have a useful budget. Either accept downtime during maintenance or run two replicas.
- Check `kubectl get pdb -A` before an upgrade. Any row with `ALLOWED DISRUPTIONS 0` will block it.

## cordon, drain and uncordon

Three commands handle node maintenance:

- `kubectl cordon <node>` marks the node unschedulable. New Pods stay off; running Pods keep running. `kubectl get nodes` shows `SchedulingDisabled`.
- `kubectl drain <node> --ignore-daemonsets` cordons the node and then evicts its Pods through the Eviction API, respecting PDBs and grace periods. DaemonSet Pods (part 15) are skipped because their controller would put them straight back; without the flag, drain refuses to start. Pods that use `emptyDir` need `--delete-emptydir-data`, because that data is lost. Bare Pods with no controller need `--force`, because nothing will recreate them anywhere else.
- `kubectl uncordon <node>` allows scheduling again. Pods that moved away do not come back on their own.

A PDB that allows zero disruptions blocks a drain forever, and that is a common reason upgrades stall. A budget like `minAvailable: 3` for a three-replica app reads as safe but means "never evict anything." Set the budget below the replica count, or use `maxUnavailable: 1`.

## Try it: taint, preempt and drain

Use the cluster from part 17. Node names start with `k8s-ep16-` in our output.

**1. Reserve a node with a taint.**

```bash rail=get-control-plane-taints
kubectl get node k8s-ep16-control-plane -o jsonpath='{.spec.taints}{"\n"}'
kubectl taint nodes k8s-ep16-worker3 dedicated=gpu:NoSchedule
kubectl describe node k8s-ep16-worker3 | grep -A1 Taints
```

```text
[{"effect":"NoSchedule","key":"node-role.kubernetes.io/control-plane"}]
node/k8s-ep16-worker3 tainted
Taints:             dedicated=gpu:NoSchedule
Unschedulable:      false
```

Save a plain six-replica Deployment as `spread-web.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 6
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:1.29-alpine
```

```bash rail=apply-spread-web
kubectl apply -f spread-web.yaml
kubectl rollout status deploy/web
kubectl get pods -l app=web -o jsonpath='{range .items[*]}{.spec.nodeName}{"\n"}{end}' | sort | uniq -c
```

```text
      3 k8s-ep16-worker
      3 k8s-ep16-worker2
```

Nothing on worker3. Now a Pod that tolerates the taint and asks for that node. Save as `gpu-job-pod.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: trainer
spec:
  nodeSelector:
    kubernetes.io/hostname: k8s-ep16-worker3
  tolerations:
    - key: dedicated
      operator: Equal
      value: gpu
      effect: NoSchedule
  containers:
    - name: trainer
      image: nginx:1.29-alpine
```

Change the hostname to your node's name before you apply it.

```bash rail=apply-gpu-job-pod
kubectl apply -f gpu-job-pod.yaml
kubectl get pod trainer -o wide
```

```text
NAME      READY   STATUS    RESTARTS   AGE   IP            NODE               ...
trainer   1/1     Running   0          5s    10.244.2.17   k8s-ep16-worker3   ...
```

Clean up and remove the taint (the trailing `-` deletes it):

```bash rail=delete-deploy-web
kubectl delete deploy web
kubectl delete pod trainer
kubectl taint nodes k8s-ep16-worker3 dedicated=gpu:NoSchedule-
```

**2. NoExecute evicts running Pods.** Save as `tolerate-briefly.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: patient
spec:
  nodeSelector:
    kubernetes.io/hostname: k8s-ep16-worker
  tolerations:
    - key: maintenance
      operator: Exists
      effect: NoExecute
      tolerationSeconds: 20
  containers:
    - name: app
      image: nginx:1.29-alpine
---
apiVersion: v1
kind: Pod
metadata:
  name: impatient
spec:
  nodeSelector:
    kubernetes.io/hostname: k8s-ep16-worker
  containers:
    - name: app
      image: nginx:1.29-alpine
```

```bash rail=apply-tolerate-briefly
kubectl apply -f tolerate-briefly.yaml
kubectl wait --for=condition=Ready pod/patient pod/impatient
kubectl get pod impatient -o jsonpath='{range .spec.tolerations[*]}{.key} {.effect} {.tolerationSeconds}{"\n"}{end}'
```

```text
pod/patient condition met
pod/impatient condition met
node.kubernetes.io/not-ready NoExecute 300
node.kubernetes.io/unreachable NoExecute 300
```

Those two tolerations were added for you. Now taint the node, check after 5 seconds and again 20 seconds later:

```bash rail=taint-worker-noexecute
kubectl taint nodes k8s-ep16-worker maintenance=true:NoExecute
sleep 5; kubectl get pods patient impatient
sleep 20; kubectl get pods patient impatient
kubectl get events --field-selector reason=TaintManagerEviction -o custom-columns=OBJECT:.involvedObject.name,MESSAGE:.message
```

```text
node/k8s-ep16-worker tainted
NAME      READY   STATUS    RESTARTS   AGE
patient   1/1     Running   0          6s
Error from server (NotFound): pods "impatient" not found
Error from server (NotFound): pods "patient" not found
Error from server (NotFound): pods "impatient" not found
OBJECT      MESSAGE
impatient   Marking for deletion Pod k8s-from-zero/impatient
patient     Marking for deletion Pod k8s-from-zero/patient
```

These were bare Pods, so nothing replaced them. Pods of a Deployment would be recreated on other nodes. Remove the taint:

```bash rail=untaint-worker-noexecute
kubectl taint nodes k8s-ep16-worker maintenance=true:NoExecute-
```

**3. Preemption.** Save two classes as `priorityclasses.yaml`:

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: batch-low
value: 1000
globalDefault: false
description: "Batch work that may be preempted."
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: checkout-high
value: 100000
globalDefault: false
description: "Customer-facing services."
```

Our kind nodes report 8 allocatable CPUs each; check yours with `kubectl get nodes -o custom-columns=NAME:.metadata.name,CPU:.status.allocatable.cpu` and scale the requests below so two batch Pods fill most of a node. Save as `batch.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: batch
spec:
  replicas: 6
  selector:
    matchLabels:
      app: batch
  template:
    metadata:
      labels:
        app: batch
    spec:
      priorityClassName: batch-low
      containers:
        - name: batch
          image: nginx:1.29-alpine
          resources:
            requests:
              cpu: "3"
```

```bash rail=apply-priorityclasses
kubectl apply -f priorityclasses.yaml
kubectl apply -f batch.yaml
kubectl get pods -l app=batch -o wide
kubectl describe node k8s-ep16-worker | grep -E "^  cpu"
```

```text
NAME                     READY   STATUS    RESTARTS   AGE   IP            NODE               ...
batch-5bd8dd9495-cv74v   1/1     Running   0          0s    10.244.3.27   k8s-ep16-worker2   ...
batch-5bd8dd9495-gtnks   1/1     Running   0          0s    10.244.1.20   k8s-ep16-worker    ...
batch-5bd8dd9495-l57cb   1/1     Running   0          0s    10.244.3.26   k8s-ep16-worker2   ...
batch-5bd8dd9495-mw2hl   1/1     Running   0          0s    10.244.2.18   k8s-ep16-worker3   ...
batch-5bd8dd9495-pf4d9   1/1     Running   0          0s    10.244.2.19   k8s-ep16-worker3   ...
batch-5bd8dd9495-sntn5   1/1     Running   0          0s    10.244.1.21   k8s-ep16-worker    ...
  cpu                6100m (76%)  0 (0%)
```

Each worker has 1.9 CPUs left. Save as `checkout.yaml`, a Pod that needs 4:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: checkout
spec:
  priorityClassName: checkout-high
  containers:
    - name: checkout
      image: nginx:1.29-alpine
      resources:
        requests:
          cpu: "4"
```

```bash rail=apply-checkout
kubectl apply -f checkout.yaml
sleep 10; kubectl get pod checkout -o wide
kubectl get pods -l app=batch
kubectl get events --field-selector reason=Preempted -o custom-columns=OBJECT:.involvedObject.name,MESSAGE:.message
```

```text
NAME       READY   STATUS    RESTARTS   AGE   IP            NODE               ...
checkout   1/1     Running   0          10s   10.244.2.20   k8s-ep16-worker3   ...
NAME                     READY   STATUS    RESTARTS   AGE
batch-5bd8dd9495-cv74v   1/1     Running   0          11s
batch-5bd8dd9495-gtnks   1/1     Running   0          11s
batch-5bd8dd9495-l57cb   1/1     Running   0          11s
batch-5bd8dd9495-m9k7l   0/1     Pending   0          10s
batch-5bd8dd9495-pf4d9   1/1     Running   0          11s
batch-5bd8dd9495-sntn5   1/1     Running   0          11s
OBJECT                   MESSAGE
batch-5bd8dd9495-mw2hl   Preempted by pod dd0352a2-39d8-4fe7-be1f-b94c22d3a148 on node k8s-ep16-worker3
```

The batch Pod `mw2hl` was evicted and checkout took its place. The Deployment made a replacement, `m9k7l` here (yours has another suffix), which now waits. Describe the Pending batch Pod:

```bash rail=describe-batch-failedscheduling
kubectl describe $(kubectl get pods -l app=batch --field-selector=status.phase=Pending -o name) | grep FailedScheduling
```

```text
  Warning  FailedScheduling  10s (x2 over 10s)  default-scheduler  0/4 nodes are available: 1 node(s) had untolerated taint(s), 3 Insufficient cpu. preemption: 0/4 nodes are available: 1 Preemption is not helpful for scheduling, 3 No preemption victims found for incoming pod.
```

It cannot preempt anything, because every other Pod has the same or higher priority. Clean up and wait until the Pods are gone, so they do not show up in the next step:

```bash rail=delete-pod-checkout
kubectl delete pod checkout
kubectl delete deploy batch
kubectl delete -f priorityclasses.yaml
kubectl wait --for=delete pod --all --timeout=60s
```

**4. A budget that blocks a drain.** Save `web3.yaml` (the Deployment from step 1 with `replicas: 3`) and `pdb.yaml`:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-pdb
spec:
  minAvailable: 3
  selector:
    matchLabels:
      app: web
```

```bash rail=apply-web3-pdb
kubectl apply -f web3.yaml -f pdb.yaml
kubectl get pods -o wide
kubectl get pdb web-pdb
```

```text
NAME                   READY   STATUS    RESTARTS   AGE   IP            NODE               ...
web-5b756874b6-jrmzf   1/1     Running   0          1s    10.244.2.23   k8s-ep16-worker3   ...
web-5b756874b6-s72bg   1/1     Running   0          1s    10.244.1.23   k8s-ep16-worker    ...
web-5b756874b6-wm9cz   1/1     Running   0          1s    10.244.3.29   k8s-ep16-worker2   ...
NAME      MIN AVAILABLE   MAX UNAVAILABLE   ALLOWED DISRUPTIONS   AGE
web-pdb   3               N/A               0                     1s
```

```bash rail=drain-worker
kubectl drain k8s-ep16-worker --ignore-daemonsets --timeout=20s
```

```text
node/k8s-ep16-worker cordoned
Warning: ignoring DaemonSet-managed Pods: kube-system/kindnet-kxjm7, kube-system/kube-proxy-2rgj6
evicting pod k8s-from-zero/web-5b756874b6-s72bg
error when evicting pods/"web-5b756874b6-s72bg" -n "k8s-from-zero" (will retry after 5s): Cannot evict pod as it would violate the pod's disruption budget.
...
error: unable to drain node "k8s-ep16-worker" due to error: error when evicting pods/"web-5b756874b6-s72bg" -n "k8s-from-zero": global timeout reached: 20s, continuing command...
```

Without `--timeout`, drain would retry forever. The node is still cordoned:

```bash rail=get-nodes
kubectl get nodes
```

```text
NAME                     STATUS                     ROLES           AGE   VERSION
k8s-ep16-control-plane   Ready                      control-plane   14m   v1.37.0
k8s-ep16-worker          Ready,SchedulingDisabled   <none>          11m   v1.37.0
k8s-ep16-worker2         Ready                      <none>          11m   v1.37.0
k8s-ep16-worker3         Ready                      <none>          11m   v1.37.0
```

**5. Loosen the budget and drain again.**

```bash rail=patch-pdb-web
kubectl patch pdb web-pdb --type=merge -p '{"spec":{"minAvailable":2}}'
kubectl get pdb web-pdb
kubectl drain k8s-ep16-worker --ignore-daemonsets --timeout=60s
kubectl get pods -o wide
```

```text
poddisruptionbudget.policy/web-pdb patched
NAME      MIN AVAILABLE   MAX UNAVAILABLE   ALLOWED DISRUPTIONS   AGE
web-pdb   2               N/A               1                     21s
node/k8s-ep16-worker already cordoned
Warning: ignoring DaemonSet-managed Pods: kube-system/kindnet-kxjm7, kube-system/kube-proxy-2rgj6
evicting pod k8s-from-zero/web-5b756874b6-s72bg
pod/web-5b756874b6-s72bg evicted
node/k8s-ep16-worker drained
NAME                   READY   STATUS    RESTARTS   AGE   IP            NODE               ...
web-5b756874b6-4jpzq   1/1     Running   0          2s    10.244.3.30   k8s-ep16-worker2   ...
web-5b756874b6-jrmzf   1/1     Running   0          23s   10.244.2.23   k8s-ep16-worker3   ...
web-5b756874b6-wm9cz   1/1     Running   0          23s   10.244.3.29   k8s-ep16-worker2   ...
```

The replacement landed on worker2, because worker is cordoned. Finish the maintenance with:

```bash rail=uncordon-worker
kubectl uncordon k8s-ep16-worker
kubectl get pods -o wide
```

The node is `Ready` again, and the three Pods stay where they are: uncordon does not move them back. Clean up with `kubectl delete -f web3.yaml -f pdb.yaml`. If you made the extra cluster in part 17 and are done with it, `kind delete cluster --name k8s-multi` removes it.

## When it goes wrong

- **Pods avoid a node and you do not know why.** `kubectl describe node <name> | grep -A3 Taints`. A forgotten `NoSchedule` taint, or a leftover `node.kubernetes.io/unschedulable` from a cordon, keeps Pods off.
- **A toleration "does nothing".** It only permits. Add node affinity or a `nodeSelector` to pull the Pod onto the tainted node.
- **A high-priority Pod is still Pending.** Preemption found no victims: other Pods have equal or higher priority, or removing them would still not free enough requested resources. Read the `FailedScheduling` event; the part after `preemption:` says why.
- **`kubectl drain` hangs on "Cannot evict pod".** A PDB allows zero disruptions. `kubectl get pdb -A` shows `ALLOWED DISRUPTIONS 0`. Scale the app up, or lower `minAvailable` (or use `maxUnavailable: 1`); do not delete the PDB in a hurry on a production app.
- **Drain refuses to start.** In our lab it printed `cannot delete DaemonSet-managed Pods (use --ignore-daemonsets to ignore)` and `cannot delete Pods with local storage (use --delete-emptydir-data to override)`. Add `--ignore-daemonsets`, and `--delete-emptydir-data` when losing that scratch data is fine.
- **Drain says `cannot delete Pods that declare no controller`.** A bare Pod (no Deployment, Job or other owner) would be gone for good. Recreate it under a controller, or use `--force` if you accept losing it.

## Cheat sheet

| Task | Command or field | Note |
|---|---|---|
| Taint a node | `kubectl taint nodes <n> key=value:NoSchedule` | effects: `NoSchedule`, `PreferNoSchedule`, `NoExecute` |
| Remove a taint | `kubectl taint nodes <n> key=value:NoSchedule-` | trailing `-` |
| See taints | `kubectl describe node <n> \| grep -A3 Taints` | or `.spec.taints` |
| Tolerate a taint | `spec.tolerations[]` key, operator, value, effect | permits, does not attract |
| Stay a while under NoExecute | `tolerationSeconds: 20` | default 300 for not-ready, unreachable |
| Define a priority | `kind: PriorityClass`, `value:` | up to 1 billion for your classes |
| Use it | `spec.priorityClassName` | no class: priority 0 |
| Queue first, no evictions | `preemptionPolicy: Never` | on the PriorityClass |
| See preemptions | `kubectl get events --field-selector reason=Preempted` | |
| Limit voluntary disruption | `kind: PodDisruptionBudget`, `minAvailable` or `maxUnavailable` | number or percent |
| Check a budget | `kubectl get pdb` | `ALLOWED DISRUPTIONS` |
| Stop new Pods on a node | `kubectl cordon <n>` | `SchedulingDisabled` |
| Empty a node safely | `kubectl drain <n> --ignore-daemonsets --timeout=5m` | uses the Eviction API |
| Back in service | `kubectl uncordon <n>` | Pods do not move back |

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-pdb
  namespace: k8s-from-zero
spec:
  maxUnavailable: 1
  selector:
    matchLabels:
      app: web
```

## Recap and what is next

- A taint keeps Pods off a node; a toleration lets a Pod in but does not pull it there. `NoExecute` also evicts running Pods.
- PriorityClass ranks Pods; when the cluster is full, the scheduler preempts lower-priority Pods to place a higher one.
- A PodDisruptionBudget limits voluntary disruptions, and only tools that use the Eviction API, such as `kubectl drain`, respect it.
- Maintenance is cordon, drain, work, uncordon, with budgets that allow at least one disruption.

Next: Kubernetes from Zero, part 19, Ingress and Gateway API basics, coming tomorrow.

*Command explanations and quoted passages in this lesson come from or adapt the [kubectl reference](https://kubernetes.io/docs/reference/kubectl/) and the [Kubernetes documentation](https://kubernetes.io/docs/), © The Kubernetes Authors, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). We shortened and edited some passages. Kubernetes® is a registered trademark of The Linux Foundation®.

```rail
id: "get-control-plane-taints"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "node"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "k8s-ep16-control-plane"
        text: "The node name from the lab cluster. The lesson says reader clusters named k8s-multi will use that prefix instead of k8s-ep16."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{.spec.taints}{\"\\n\"}'"
        text: "A jsonpath output format. The get docs say jsonpath prints the fields the expression selects. The lesson uses this path to print the fields named in the command."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "taint"
        text: "Update the taints on one or more nodes. The taint docs show kubectl taint nodes NODE KEY=VALUE:EFFECT, and a trailing hyphen removes that taint."
      - token: "nodes"
        text: "The resource type."
      - token: "k8s-ep16-worker3"
        text: "The node name from the lab cluster. The lesson says reader clusters named k8s-multi will use that prefix instead of k8s-ep16."
      - token: "dedicated=gpu:NoSchedule"
        text: "The taint, written as key=value:effect. A trailing hyphen removes that taint."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "describe"
        text: "Show details of a specific resource or group of resources. The describe docs say this includes related resources such as events or controllers."
      - token: "node"
        text: "The resource type."
      - token: "k8s-ep16-worker3"
        text: "The node name from the lab cluster. The lesson says reader clusters named k8s-multi will use that prefix instead of k8s-ep16."
      - token: "|"
        text: "A shell pipe. The output of the command on the left becomes the input of the command on the right."
      - token: "grep"
        text: "Shell. Prints input lines that match a pattern."
      - token: "-A1"
        text: "Also print 1 line after each matching line."
      - token: "Taints"
        text: "The pattern grep looks for. Lines that match it are printed."
```

```rail
id: "apply-spread-web"
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
      - token: "spread-web.yaml"
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
      - token: "deploy/web"
        text: "The resource written as type/name: deploy/web."
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
id: "apply-gpu-job-pod"
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
      - token: "gpu-job-pod.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "trainer"
        text: "The object name."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "wide"
        text: "An output format: the default table plus more columns. The get examples say it adds more information, such as the node name. The lesson's output adds IP and NODE."
```

```rail
id: "delete-deploy-web"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "deploy"
        text: "The resource type."
      - token: "web"
        text: "The object name."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "pod"
        text: "The resource type."
      - token: "trainer"
        text: "The object name."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "taint"
        text: "Update the taints on one or more nodes. The taint docs show kubectl taint nodes NODE KEY=VALUE:EFFECT, and a trailing hyphen removes that taint."
      - token: "nodes"
        text: "The resource type."
      - token: "k8s-ep16-worker3"
        text: "The node name from the lab cluster. The lesson says reader clusters named k8s-multi will use that prefix instead of k8s-ep16."
      - token: "dedicated=gpu:NoSchedule-"
        text: "The taint, written as key=value:effect. A trailing hyphen removes that taint."
```

```rail
id: "apply-tolerate-briefly"
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
      - token: "tolerate-briefly.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "wait"
        text: "Wait for a condition on one or more resources."
      - token: "--for=condition=Ready"
        text: "The condition to wait for. Here kubectl waits until the condition named after --for is met."
      - token: "pod/patient"
        text: "The resource written as type/name: pod/patient."
      - token: "pod/impatient"
        text: "The resource written as type/name: pod/impatient."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "impatient"
        text: "The object name."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{range .spec.tolerations[*]}{.key} {.effect} {.tolerationSeconds}{\"\\n\"}{end}'"
        text: "A jsonpath output format. The get docs say jsonpath prints the fields the expression selects. The lesson uses this path to print the fields named in the command."
```

```rail
id: "taint-worker-noexecute"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "taint"
        text: "Update the taints on one or more nodes. The taint docs show kubectl taint nodes NODE KEY=VALUE:EFFECT, and a trailing hyphen removes that taint."
      - token: "nodes"
        text: "The resource type."
      - token: "k8s-ep16-worker"
        text: "The node name from the lab cluster. The lesson says reader clusters named k8s-multi will use that prefix instead of k8s-ep16."
      - token: "maintenance=true:NoExecute"
        text: "The taint, written as key=value:effect. A trailing hyphen removes that taint."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "sleep"
        text: "Shell. Waits the given number of seconds."
      - token: "5"
        text: "How many seconds sleep waits before the next command runs."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "patient"
        text: "The object name."
      - token: "impatient"
        text: "The object name."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "sleep"
        text: "Shell. Waits the given number of seconds."
      - token: "20"
        text: "How many seconds sleep waits before the next command runs."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "patient"
        text: "The object name."
      - token: "impatient"
        text: "The object name."
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
      - token: "reason=TaintManagerEviction"
        text: "The field query passed to --field-selector: reason=TaintManagerEviction."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "custom-columns=OBJECT:.involvedObject.name,MESSAGE:.message"
        text: "A custom table. custom-columns is an output format. The get examples write each column as a heading, a colon, and a JSONPath."
```

```rail
id: "untaint-worker-noexecute"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "taint"
        text: "Update the taints on one or more nodes. The taint docs show kubectl taint nodes NODE KEY=VALUE:EFFECT, and a trailing hyphen removes that taint."
      - token: "nodes"
        text: "The resource type."
      - token: "k8s-ep16-worker"
        text: "The node name from the lab cluster. The lesson says reader clusters named k8s-multi will use that prefix instead of k8s-ep16."
      - token: "maintenance=true:NoExecute-"
        text: "The taint, written as key=value:effect. A trailing hyphen removes that taint."
```

```rail
id: "apply-priorityclasses"
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
      - token: "priorityclasses.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "apply"
        text: "Apply a configuration to a resource by file name or stdin. The apply docs say the resource is created if it does not exist yet. JSON and YAML are accepted."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "batch.yaml"
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
      - token: "app=batch"
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
      - token: "describe"
        text: "Show details of a specific resource or group of resources. The describe docs say this includes related resources such as events or controllers."
      - token: "node"
        text: "The resource type."
      - token: "k8s-ep16-worker"
        text: "The node name from the lab cluster. The lesson says reader clusters named k8s-multi will use that prefix instead of k8s-ep16."
      - token: "|"
        text: "A shell pipe. The output of the command on the left becomes the input of the command on the right."
      - token: "grep"
        text: "Shell. Prints input lines that match a pattern."
      - token: "-E"
        text: "Tell grep to treat the pattern as an extended regular expression."
      - token: "\"^  cpu\""
        text: "The extended regular expression grep looks for. Lines that match it are printed."
```

```rail
id: "apply-checkout"
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
      - token: "checkout.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "sleep"
        text: "Shell. Waits the given number of seconds."
      - token: "10"
        text: "How many seconds sleep waits before the next command runs."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "checkout"
        text: "The object name."
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
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "app=batch"
        text: "The label selector passed to -l. It keeps only the objects whose labels match this query."
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
      - token: "reason=Preempted"
        text: "The field query passed to --field-selector: reason=Preempted."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "custom-columns=OBJECT:.involvedObject.name,MESSAGE:.message"
        text: "A custom table. custom-columns is an output format. The get examples write each column as a heading, a colon, and a JSONPath."
```

```rail
id: "describe-batch-failedscheduling"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "describe"
        text: "Show details of a specific resource or group of resources. The describe docs say this includes related resources such as events or controllers."
      - token: "$(kubectl get pods -l app=batch --field-selector=status.phase=Pending -o name)"
        text: "A command substitution. The inner kubectl command prints the name of the Pending Pod, and describe uses that name."
      - token: "|"
        text: "A shell pipe. The output of the command on the left becomes the input of the command on the right."
      - token: "grep"
        text: "Shell. Prints input lines that match a pattern."
      - token: "FailedScheduling"
        text: "The pattern grep looks for. FailedScheduling is the event reason the scheduler writes when it cannot place a Pod."
```

```rail
id: "delete-pod-checkout"
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
      - token: "checkout"
        text: "The object name."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "deploy"
        text: "The resource type."
      - token: "batch"
        text: "The object name."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete."
      - token: "priorityclasses.yaml"
        text: "The file named by --filename. delete removes the resources that file describes."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "wait"
        text: "Wait for a condition on one or more resources."
      - token: "--for=delete"
        text: "The condition to wait for. Here kubectl waits until the condition named after --for is met."
      - token: "pod"
        text: "The resource type."
      - token: "--all"
        text: "Select every object of the given type in the namespace, instead of naming them."
      - token: "--timeout=60s"
        text: "How long to wait before giving up. This command passes 60s."
```

```rail
id: "apply-web3-pdb"
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
      - token: "web3.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "pdb.yaml"
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
      - token: "pdb"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "web-pdb"
        text: "The object name."
```

```rail
id: "drain-worker"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "drain"
        text: "Drain a node in preparation for maintenance. Safe evictions respect PodDisruptionBudgets. The drain docs say --ignore-daemonsets is needed when DaemonSet Pods are present."
      - token: "k8s-ep16-worker"
        text: "The node name from the lab cluster. The lesson says reader clusters named k8s-multi will use that prefix instead of k8s-ep16."
      - token: "--ignore-daemonsets"
        text: "Skip DaemonSet Pods so drain can finish. The drain docs say the DaemonSet controller would otherwise recreate them on the same node."
      - token: "--timeout=20s"
        text: "How long to wait before giving up. This command passes 20s."
```

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
```

```rail
id: "patch-pdb-web"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "patch"
        text: "Update fields of a resource using a strategic merge patch, a JSON merge patch, or a JSON patch. The patch docs say JSON and YAML are accepted."
      - token: "pdb"
        text: "The resource type."
      - token: "web-pdb"
        text: "The object name."
      - token: "--type=merge"
        text: "The patch type. merge is a JSON merge patch."
      - token: "-p"
        text: "Short form of --patch. The patch to apply, written here as JSON."
      - token: "'{\"spec\":{\"minAvailable\":2}}'"
        text: "The patch document, written as JSON. Only the fields it names are changed."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pdb"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "web-pdb"
        text: "The object name."
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "drain"
        text: "Drain a node in preparation for maintenance. Safe evictions respect PodDisruptionBudgets. The drain docs say --ignore-daemonsets is needed when DaemonSet Pods are present."
      - token: "k8s-ep16-worker"
        text: "The node name from the lab cluster. The lesson says reader clusters named k8s-multi will use that prefix instead of k8s-ep16."
      - token: "--ignore-daemonsets"
        text: "Skip DaemonSet Pods so drain can finish. The drain docs say the DaemonSet controller would otherwise recreate them on the same node."
      - token: "--timeout=60s"
        text: "How long to wait before giving up. This command passes 60s."
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
```

```rail
id: "uncordon-worker"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "uncordon"
        text: "Mark a node as schedulable again, reversing kubectl cordon or the unschedulable mark left by drain."
      - token: "k8s-ep16-worker"
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
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "wide"
        text: "An output format: the default table plus more columns. The get examples say it adds more information, such as the node name. The lesson's output adds IP and NODE."
```
