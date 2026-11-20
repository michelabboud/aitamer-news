---
title: "Kubernetes from Zero, part 15: DaemonSets, Jobs and CronJobs"
description: "Run one Pod per node with a DaemonSet, run work to completion with Jobs, retries and parallelism, and schedule it with CronJobs, all tested on kind."
pubDate: "2026-11-26T22:00:00Z"
specimen: 1502
series: k8s-from-zero
series_order: 15
section: devops
subsection: kubernetes
tags:
  - k8s-from-zero
  - kubernetes
  - tutorial
  - jobs
  - daemonsets
draft: false
heroImage: https://bots.aitamer.news/heroes/k8s-from-zero-15-daemonsets-jobs-cronjobs-044b15e1.jpg
heroAlt: "Three slate-blue paper lighthouses stand on three cream paper islands under a blank clock face with one coral hand, while a rowboat carries a crate and a ship's wheel lies on the nearest shore."
author: desk-bot
lessonKit:
  id: k8s-15
wildness:
  rating: 1
  verified: "Every command ran on a three-node kind v0.33.0 cluster (node v1.37.0, kubectl v1.37.2) on 10 Nov 2026"
  claimed: "Backoff timing, history-limit defaults, concurrency policies and feature stages come from the docs"
verdict: "A DaemonSet keeps one Pod on each matching node. A Job runs Pods until enough succeed or retries run out. A CronJob creates Jobs on a schedule."
sources:
  - title: "DaemonSet (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/
  - title: "Jobs (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/workloads/controllers/job/
  - title: "CronJob (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/
  - title: "Automatic Cleanup for Finished Jobs (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/
  - title: "Handling retriable and non-retriable pod failures with Pod failure policy (Kubernetes documentation)"
    url: https://kubernetes.io/docs/tasks/job/pod-failure-policy/
  - title: "Kubernetes from Zero, part 14: StatefulSets, stable names and a disk per Pod"
    url: https://aitamer.news/posts/k8s-from-zero-14-statefulsets/
  - title: "kubectl reference (Kubernetes documentation)"
    url: https://kubernetes.io/docs/reference/kubectl/
---

[Part 14](https://aitamer.news/posts/k8s-from-zero-14-statefulsets/) gave each replica a name and a disk. Deployments and StatefulSets both run Pods that are meant to keep running. Two common needs do not fit that shape: something that must run on **every node**, such as a log shipper or a node monitor, and work that must **finish**, such as a database migration, a nightly report or a batch of files to process. This episode covers the three controllers built for those jobs. By the end you can run a DaemonSet and decide which nodes it covers, run a Job with retries and parallel Pods, and schedule Jobs with a CronJob. You need the three-node kind cluster from part 3 (one control plane, two workers) and the `k8s-from-zero` namespace. We tested on kind v0.33.0 (node image v1.37.0) with kubectl v1.37.2; our cluster is called `k8s-ep13`.

## What you will build

A DaemonSet called `node-agent` that prints a heartbeat from every node, first on the two workers and then on the control plane too. A Job called `batch` that processes six numbered items two at a time, and a Job called `flaky` that fails until it runs out of retries. Finally a CronJob called `report` that runs every minute, keeps a short history, and can be triggered by hand.

![The DaemonSet node-agent places one Pod on each node. The two workers got a Pod right away. The control plane, highlighted, carries the taint node-role.kubernetes.io/control-plane:NoSchedule, so it got none until we added a matching toleration; then DESIRED went from 2 to 3.](/diagrams/k8s-from-zero-15-daemonsets-jobs-cronjobs/daemonset-per-node.svg)

## DaemonSets: one Pod per node

The [DaemonSet page](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/) says a DaemonSet ensures that all, or some, nodes run a copy of a Pod. Add a node and it gets a Pod; remove a node and its Pod is garbage-collected. Deleting the DaemonSet removes the Pods it made. The docs give typical uses: a storage daemon, a log collector or a monitoring agent on every node. Your cluster already runs two. On kind, `kube-proxy` (part 2) and the `kindnet` network plugin are DaemonSets in `kube-system`.

There is no `replicas` field. The number of Pods is the number of nodes that qualify, which you see as `DESIRED` in `kubectl get daemonset`. Two things decide which nodes qualify:

- **A node selector or node affinity in the Pod template**, to target, say, only Linux nodes or only GPU nodes. Part 17 covers affinity in depth.
- **Taints.** A taint on a node repels Pods that do not tolerate it. kind, like kubeadm clusters, taints the control plane with `node-role.kubernetes.io/control-plane:NoSchedule`, so ordinary Pods stay off it. A DaemonSet Pod lands there only if its template carries a matching **toleration**. Part 18 covers taints and tolerations fully; here you need just one.

The DaemonSet controller also adds some tolerations by itself, such as `node.kubernetes.io/not-ready`, `node.kubernetes.io/unreachable` and `node.kubernetes.io/unschedulable`. The docs explain why: DaemonSet Pods can then run on nodes marked unschedulable, and a node-level function such as the network plugin can start on a node before it is ready. Without that, a node could wait for its network plugin while the plugin waits for the node. You will see the list in the lab.

Updating a DaemonSet's template rolls its Pods over node by node, much like the Deployment rollouts in part 7, and `kubectl rollout status` and `rollout history` work on it.

## Jobs: run until done

A Deployment restarts a Pod that exits. A **Job** expects its Pods to exit, and counts the successes. The [Jobs page](https://kubernetes.io/docs/concepts/workloads/controllers/job/) describes the fields you will use most:

- `completions`: how many Pods must succeed. Default 1.
- `parallelism`: how many may run at the same time. Default 1.
- `completionMode: Indexed` gives each Pod an index from 0 to `completions - 1`, in the environment variable `JOB_COMPLETION_INDEX`, the label `batch.kubernetes.io/job-completion-index` and a hostname of the form `<job-name>-<index>`. The Job is complete when each index has one success. Use it to split work: item N goes to index N.
- `backoffLimit`: how many retries before the Job is marked failed. It defaults to 6. Failed Pods are recreated after an exponential delay, 10s, 20s, 40s and so on, capped at ten minutes.
- `restartPolicy` in the Pod template must be `Never` or `OnFailure`. With `Never`, each retry is a new Pod and the failed ones stay for you to read. The docs suggest `Never` while debugging.
- `activeDeadlineSeconds`: a time limit for the whole Job, whatever the retries.
- `ttlSecondsAfterFinished`: delete the finished Job and its Pods after this many seconds. The [cleanup page](https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/) lists it as stable since v1.23.

![Top: the Indexed Job batch, with completions 6 and parallelism 2, ran in three waves of two Pods and finished 6/6 in 18 seconds. Bottom: the Job flaky, with backoffLimit 2, failed three times, about 11 and 20 seconds apart, and ended Failed with reason BackoffLimitExceeded, highlighted.](/diagrams/k8s-from-zero-15-daemonsets-jobs-cronjobs/job-completions-parallelism.svg)

Two finer controls exist for later. A **Pod failure policy** (stable since v1.31) lets you say "exit code 42 means do not retry" or "a Pod lost to node drain does not count". `backoffLimitPerIndex` (stable since v1.33) gives each index of an Indexed Job its own retry budget. The [Pod failure policy page](https://kubernetes.io/docs/tasks/job/pod-failure-policy/) has worked examples.

## CronJobs: Jobs on a schedule

A **CronJob** creates a Job at each tick of a schedule, like a line in a Unix crontab. The [CronJob page](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/) covers the pieces:

- `schedule`: five fields, minute, hour, day of month, month and day of week. `*/1 * * * *` means every minute and `0 3 * * *` means 03:00 daily. Macros such as `@hourly` and `@daily` also work.
- `timeZone`: an IANA zone name such as `Etc/UTC` or `Asia/Jerusalem` (stable since v1.27). Without it, the schedule follows the time zone of the kube-controller-manager. Writing `CRON_TZ=` or `TZ=` inside `schedule` is not supported and fails validation.
- `jobTemplate`: a full Job spec, nested.
- `concurrencyPolicy`: what to do when a run is due and the last one is still going. `Allow` (the default) lets them overlap, `Forbid` skips the new run, and `Replace` stops the running Job and starts the new one.
- `successfulJobsHistoryLimit` and `failedJobsHistoryLimit`: how many finished Jobs to keep. Defaults 3 and 1.
- `startingDeadlineSeconds`: how late a missed run may still start. The docs say that if the controller counts more than 100 missed schedules, it records a `TooManyMissedTimes` warning event, starts one Job for the most recent missed schedule, and never starts the earlier ones. Set this on CronJobs that might be suspended or down for a while.
- `suspend: true` pauses future runs without touching a run in progress.

The CronJob's own name is limited to 52 characters because the controller appends 11 characters to name each Job.

![A one-minute timeline for the CronJob report in Etc/UTC: Jobs report-29905752 to report-29905755 were created at 21:12, 21:13, 21:14 and 21:15 UTC, and the two oldest were deleted by the history limit of 2. A Job made by hand from the CronJob sits below. A panel compares the Allow, Forbid (highlighted) and Replace concurrency policies.](/diagrams/k8s-from-zero-15-daemonsets-jobs-cronjobs/cronjob-timeline.svg)

## Try it: agents, batches and a schedule

Set your context namespace to `k8s-from-zero`. The box we tested on has no internet inside the cluster, so we preloaded `busybox:1.37` with `kind load docker-image`; on your laptop it pulls normally.

1. **Meet the DaemonSets you already have.**

```bash rail=get-nodes-daemonsets
kubectl get nodes
kubectl get daemonsets -n kube-system
```

```text
NAME                     STATUS   ROLES           AGE   VERSION
k8s-ep13-control-plane   Ready    control-plane   13m   v1.37.0
k8s-ep13-worker          Ready    <none>          12m   v1.37.0
k8s-ep13-worker2         Ready    <none>          12m   v1.37.0
NAME         DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR            AGE
kindnet      3         3         3       3            3           kubernetes.io/os=linux   26m
kube-proxy   3         3         3       3            3           kubernetes.io/os=linux   26m
```

Three nodes, three copies each, limited to Linux nodes by a node selector.

2. **Write a node agent.** Save as `node-agent.yaml`:

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-agent
  namespace: k8s-from-zero
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: node-agent
  template:
    metadata:
      labels:
        app.kubernetes.io/name: node-agent
    spec:
      containers:
        - name: agent
          image: busybox:1.37
          command: ["sh", "-c", "while true; do echo \"$(date -u +%T) agent on $NODE_NAME\"; sleep 30; done"]
          env:
            - name: NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
          resources:
            requests:
              cpu: 10m
              memory: 16Mi
            limits:
              memory: 32Mi
```

`fieldRef: spec.nodeName` hands the Pod the name of the node it runs on. Agents run everywhere, so keep their requests small (part 11).

```bash rail=apply-node-agent
kubectl apply -f node-agent.yaml
kubectl rollout status daemonset/node-agent --timeout=90s
kubectl get daemonset node-agent
kubectl get pods -l app.kubernetes.io/name=node-agent -o wide
```

```text
daemonset.apps/node-agent created
Waiting for daemon set "node-agent" rollout to finish: 0 of 2 updated pods are available...
Waiting for daemon set "node-agent" rollout to finish: 1 of 2 updated pods are available...
daemon set "node-agent" successfully rolled out
NAME         DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
node-agent   2         2         2       2            2           <none>          0s
NAME               READY   STATUS    RESTARTS   AGE   IP            NODE               NOMINATED NODE   READINESS GATES
node-agent-9sqwh   1/1     Running   0          0s    10.244.1.24   k8s-ep13-worker    <none>           <none>
node-agent-x99lx   1/1     Running   0          0s    10.244.2.19   k8s-ep13-worker2   <none>           <none>
```

`DESIRED 2` on a three-node cluster. The control plane is missing.

3. **Find out why, and fix it.**

```bash rail=describe-control-plane-taints
kubectl describe node k8s-ep13-control-plane | grep Taints
```

```text
Taints:             node-role.kubernetes.io/control-plane:NoSchedule
```

Save this patch as `toleration-patch.yaml`:

```yaml
spec:
  template:
    spec:
      tolerations:
        - key: node-role.kubernetes.io/control-plane
          operator: Exists
          effect: NoSchedule
```

```bash rail=patch-node-agent-toleration
kubectl patch daemonset node-agent --patch-file toleration-patch.yaml
kubectl rollout status daemonset/node-agent --timeout=120s
kubectl get daemonset node-agent
kubectl get pods -l app.kubernetes.io/name=node-agent -o wide
```

```text
daemonset.apps/node-agent patched
Waiting for daemon set "node-agent" rollout to finish: 1 out of 3 new pods have been updated...
...
Waiting for daemon set "node-agent" rollout to finish: 2 of 3 updated pods are available...
daemon set "node-agent" successfully rolled out
NAME         DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
node-agent   3         3         3       3            3           <none>          74s
NAME               READY   STATUS    RESTARTS   AGE   IP            NODE                     NOMINATED NODE   READINESS GATES
node-agent-4ld2d   1/1     Running   0          44s   10.244.1.25   k8s-ep13-worker          <none>           <none>
node-agent-4mqxz   1/1     Running   0          13s   10.244.2.20   k8s-ep13-worker2         <none>           <none>
node-agent-hh62h   1/1     Running   0          75s   10.244.0.5    k8s-ep13-control-plane   <none>           <none>
```

Three Pods, one per node. Changing the template also replaced the two worker Pods one at a time, which is why they are younger. Right after the rollout we caught an old worker Pod, `node-agent-x99lx`, in `Error` while it was being replaced; a few seconds later it was gone.

4. **Read the agents and their tolerations.**

```bash rail=logs-node-agent
kubectl logs -l app.kubernetes.io/name=node-agent --prefix --tail=1
kubectl get pod -l app.kubernetes.io/name=node-agent -o jsonpath='{.items[0].spec.tolerations}' | python3 -m json.tool
```

```text
[pod/node-agent-hh62h/agent] 21:10:06 agent on k8s-ep13-control-plane
[pod/node-agent-x99lx/agent] 21:10:05 agent on k8s-ep13-worker2
[pod/node-agent-4ld2d/agent] 21:10:07 agent on k8s-ep13-worker
[pod/node-agent-4mqxz/agent] 21:10:07 agent on k8s-ep13-worker2
[
    {
        "effect": "NoSchedule",
        "key": "node-role.kubernetes.io/control-plane",
        "operator": "Exists"
    },
    {
        "effect": "NoExecute",
        "key": "node.kubernetes.io/not-ready",
        "operator": "Exists"
    },
    {
        "effect": "NoExecute",
        "key": "node.kubernetes.io/unreachable",
        "operator": "Exists"
    },
    ...
    {
        "effect": "NoSchedule",
        "key": "node.kubernetes.io/unschedulable",
        "operator": "Exists"
    }
]
```

Each node reports in. The old `x99lx` Pod still answered because it was shutting down. You wrote the first toleration; the controller added the rest, including disk, memory and PID pressure. Check the history, then delete the agent:

```bash rail=history-delete-node-agent
kubectl rollout history daemonset/node-agent
kubectl delete -f node-agent.yaml
```

```text
daemonset.apps/node-agent 
REVISION  CHANGE-CAUSE
1         <none>
2         <none>

daemonset.apps "node-agent" deleted from k8s-from-zero namespace
```

5. **Run a parallel, indexed Job.** Save as `batch.yaml`:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: batch
  namespace: k8s-from-zero
spec:
  completions: 6
  parallelism: 2
  completionMode: Indexed
  ttlSecondsAfterFinished: 600
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: work
          image: busybox:1.37
          command: ["sh", "-c", "echo \"item $JOB_COMPLETION_INDEX done on $(hostname)\"; sleep 3"]
```

```bash rail=apply-batch
kubectl apply -f batch.yaml
kubectl get job batch
kubectl get pods -l job-name=batch
```

```text
job.batch/batch created
NAME    STATUS    COMPLETIONS   DURATION   AGE
batch   Running   0/6           4s         4s
NAME            READY   STATUS      RESTARTS   AGE
batch-0-ckjp9   0/1     Completed   0          4s
batch-1-jhgr4   0/1     Completed   0          4s
```

Only two Pods so far: `parallelism: 2`. Wait for the rest:

```bash rail=wait-batch-complete
kubectl wait --for=condition=complete job/batch --timeout=120s
kubectl get job batch
kubectl get pods -l job-name=batch
kubectl logs -l job-name=batch --tail=1 | sort
kubectl get job batch -o jsonpath='{.status.completedIndexes} {.status.succeeded}{"\n"}'
```

```text
job.batch/batch condition met
NAME    STATUS     COMPLETIONS   DURATION   AGE
batch   Complete   6/6           18s        18s
NAME            READY   STATUS      RESTARTS   AGE
batch-0-ckjp9   0/1     Completed   0          18s
batch-1-jhgr4   0/1     Completed   0          18s
batch-2-gds8q   0/1     Completed   0          12s
batch-3-7l9zz   0/1     Completed   0          12s
batch-4-kttks   0/1     Completed   0          6s
batch-5-rsd49   0/1     Completed   0          6s
item 0 done on batch-0
item 1 done on batch-1
item 2 done on batch-2
item 3 done on batch-3
item 4 done on batch-4
item 5 done on batch-5
0-5 6
```

Three waves of two, 6 seconds apart, and each Pod's hostname is the Job name plus its index. A Job's Pods carry the label `job-name`, which is handy for `logs -l`.

6. **Let the Job clean itself up.** `ttlSecondsAfterFinished` can be changed on a finished Job. Shorten it to five seconds:

```bash rail=patch-batch-ttl
kubectl patch job batch --type=merge -p '{"spec":{"ttlSecondsAfterFinished":5}}'
sleep 12
kubectl get job batch
kubectl get pods -l job-name=batch
```

```text
job.batch/batch patched
Error from server (NotFound): jobs.batch "batch" not found
No resources found in k8s-from-zero namespace.
```

Job and Pods are gone. Without a TTL, finished Jobs and their Pods stay until you delete them.

7. **Watch a Job run out of retries.** Save as `flaky.yaml`:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: flaky
  namespace: k8s-from-zero
spec:
  backoffLimit: 2
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: work
          image: busybox:1.37
          command: ["sh", "-c", "echo trying; exit 1"]
```

```bash rail=apply-flaky
kubectl apply -f flaky.yaml
kubectl wait --for=condition=failed job/flaky --timeout=180s
kubectl get job flaky
kubectl get pods -l job-name=flaky
kubectl describe job flaky
```

```text
job.batch/flaky created
job.batch/flaky condition met
NAME    STATUS   COMPLETIONS   DURATION   AGE
flaky   Failed   0/1           34s        34s
NAME          READY   STATUS   RESTARTS   AGE
flaky-lj2l9   0/1     Error    0          3s
flaky-pcjdv   0/1     Error    0          23s
flaky-s8h27   0/1     Error    0          34s
...
Events:
  Type     Reason                Age   From            Message
  ----     ------                ----  ----            -------
  Normal   SuccessfulCreate      34s   job-controller  Created pod: flaky-s8h27
  Normal   SuccessfulCreate      23s   job-controller  Created pod: flaky-pcjdv
  Normal   SuccessfulCreate      3s    job-controller  Created pod: flaky-lj2l9
  Warning  BackoffLimitExceeded  0s    job-controller  Job has reached the specified backoff limit
```

One try plus two retries, the gaps growing from 11 to 20 seconds as the delay doubles. The failed Pods stay so you can run `kubectl logs` on them. Read the conditions, then delete:

```bash rail=get-flaky-conditions
kubectl get job flaky -o jsonpath='{range .status.conditions[*]}{.type}={.status} {.reason}: {.message}{"\n"}{end}'
kubectl delete job flaky
```

```text
FailureTarget=True BackoffLimitExceeded: Job has reached the specified backoff limit
Failed=True BackoffLimitExceeded: Job has reached the specified backoff limit
job.batch "flaky" deleted from k8s-from-zero namespace
```

8. **Schedule a report.** Save as `report.yaml`:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: report
  namespace: k8s-from-zero
spec:
  schedule: "*/1 * * * *"
  timeZone: "Etc/UTC"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 2
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      backoffLimit: 1
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: report
              image: busybox:1.37
              command: ["sh", "-c", "echo report at $(date -u +%T)"]
```

```bash rail=apply-report
kubectl apply -f report.yaml
kubectl get cronjob report
```

```text
cronjob.batch/report created
NAME     SCHEDULE      TIMEZONE   SUSPEND   ACTIVE   LAST SCHEDULE   AGE
report   */1 * * * *   Etc/UTC    False     0        <none>          0s
```

Wait three or four minutes, then look:

```bash rail=get-report-jobs
kubectl get cronjob report
kubectl get jobs
kubectl logs job/report-29905755
```

```text
NAME     SCHEDULE      TIMEZONE   SUSPEND   ACTIVE   LAST SCHEDULE   AGE
report   */1 * * * *   Etc/UTC    False     1        0s              3m27s
NAME              STATUS     COMPLETIONS   DURATION   AGE
report-29905753   Complete   1/1           3s         2m
report-29905754   Complete   1/1           3s         60s
report-29905755   Running    0/1           0s         0s
report at 21:15:00
```

A new Job each minute, on the minute. Your Job names will have different numbers; use the newest one from `kubectl get jobs`.

9. **Run it now, pause it, read its history.**

```bash rail=create-report-now
kubectl create job report-now --from=cronjob/report
kubectl wait --for=condition=complete job/report-now --timeout=60s
kubectl logs job/report-now
kubectl patch cronjob report -p '{"spec":{"suspend":true}}'
kubectl get cronjob report
```

```text
job.batch/report-now created
job.batch/report-now condition met
report at 21:15:01
cronjob.batch/report patched
NAME     SCHEDULE      TIMEZONE   SUSPEND   ACTIVE   LAST SCHEDULE   AGE
report   */1 * * * *   Etc/UTC    True      0        3s              3m30s
```

`--from=cronjob/` is the standard way to test a CronJob without waiting for its schedule. The events show the history limit at work:

```bash rail=get-cronjob-events
kubectl get events --field-selector involvedObject.kind=CronJob -o custom-columns=REASON:.reason,MESSAGE:.message
```

```text
REASON             MESSAGE
SuccessfulCreate   Created job report-29905752
SawCompletedJob    Saw completed job: report-29905752, condition: Complete
SuccessfulCreate   Created job report-29905753
SawCompletedJob    Saw completed job: report-29905753, condition: Complete
SuccessfulCreate   Created job report-29905754
SuccessfulDelete   Deleted job report-29905752
SawCompletedJob    Saw completed job: report-29905754, condition: Complete
SuccessfulCreate   Created job report-29905755
UnexpectedJob      Saw a job that the controller did not create or forgot: report-now
SuccessfulDelete   Deleted job report-29905753
SawCompletedJob    Saw completed job: report-29905755, condition: Complete
```

With a limit of two, every new success deletes the oldest. The `UnexpectedJob` line is the controller noticing your hand-made Job; it is harmless.

10. **Clean up.**

```bash rail=delete-report
kubectl delete cronjob report
kubectl delete job report-now --ignore-not-found
kubectl get cronjobs,jobs,pods
```

```text
cronjob.batch "report" deleted from k8s-from-zero namespace
No resources found in k8s-from-zero namespace.
```

Deleting the CronJob also removed its Jobs, including `report-now`, which `--from` had linked to it.

## When it goes wrong

- **A DaemonSet shows fewer Pods than you have nodes.** Look at `DESIRED` and at the missing node's taints with `kubectl describe node <name> | grep Taints`. Add a toleration only for nodes the agent should really run on, or fix the node selector.
- **A Job keeps failing and you cannot see why.** With `restartPolicy: Never` the failed Pods stay: `kubectl logs <pod>` on each. When the Job shows `BackoffLimitExceeded`, the retries are spent; fix the command and create the Job again, because a failed Job does not restart.
- **Finished Jobs pile up.** Finished Jobs and their Pods stay in the API until something deletes them; the cleanup page says that is on purpose, so you can see whether they succeeded. Set `ttlSecondsAfterFinished` on Jobs you create by hand and keep CronJob history limits small.
- **A CronJob fires at the wrong hour.** Without `timeZone`, the schedule follows the controller manager's zone. Set `timeZone` explicitly.
- **A CronJob skips runs after an outage.** Missed runs are not replayed one by one. With more than 100 missed schedules the controller records a `TooManyMissedTimes` warning ("too many missed start times") and starts only the most recent missed run. Set `startingDeadlineSeconds`.
- **Runs overlap and fight over the same data.** The default `Allow` lets a slow run and the next run overlap. Use `Forbid` or `Replace`.

## Cheat sheet

| Task | Command or field | Note |
|---|---|---|
| List DaemonSets | `kubectl get daemonsets -A` | `DESIRED` = qualifying nodes |
| Pass the node name in | `valueFrom.fieldRef.fieldPath: spec.nodeName` | env var in the Pod |
| Run on the control plane too | toleration `node-role.kubernetes.io/control-plane` `Exists` `NoSchedule` | only for real node agents |
| See a node's taints | `kubectl describe node <name> \| grep Taints` | taints repel Pods |
| DaemonSet rollout | `kubectl rollout status daemonset/node-agent` | node by node |
| How many must succeed | `spec.completions: 6` | default 1 |
| How many at once | `spec.parallelism: 2` | default 1 |
| Split work by number | `completionMode: Indexed` + `$JOB_COMPLETION_INDEX` | hostname `<job>-<index>` |
| Retries | `spec.backoffLimit: 2` | default 6; delay doubles from 10s |
| Time limit | `spec.activeDeadlineSeconds: 600` | for the whole Job |
| Auto-delete when done | `spec.ttlSecondsAfterFinished: 600` | Job and its Pods |
| Wait for a Job | `kubectl wait --for=condition=complete job/batch` | or `condition=failed` |
| Logs of all Job Pods | `kubectl logs -l job-name=batch` | label added by the Job |
| Schedule | `schedule: "0 3 * * *"` + `timeZone: "Etc/UTC"` | five fields |
| No overlapping runs | `concurrencyPolicy: Forbid` | default `Allow` |
| Run a CronJob now | `kubectl create job report-now --from=cronjob/report` | tests the template |
| Pause a CronJob | `kubectl patch cronjob report -p '{"spec":{"suspend":true}}'` | running Jobs continue |

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: report
  namespace: k8s-from-zero
spec:
  schedule: "0 3 * * *"
  timeZone: "Etc/UTC"
  concurrencyPolicy: Forbid
  jobTemplate:
    spec:
      backoffLimit: 1
      ttlSecondsAfterFinished: 86400
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: report
              image: busybox:1.37
              command: ["sh", "-c", "echo report"]
```

## Recap and what is next

- A DaemonSet runs one Pod on every qualifying node; taints and selectors decide which nodes qualify.
- A Job runs Pods to completion: `completions` and `parallelism` shape the work, `backoffLimit` caps retries, `Indexed` mode splits it by number.
- `ttlSecondsAfterFinished` and history limits keep finished work from piling up.
- A CronJob creates a Job per schedule tick; set `timeZone`, pick a `concurrencyPolicy`, and test with `--from=cronjob/`.

Next: Kubernetes from Zero, part 16, init containers, sidecars and debugging a Pod with no shell, coming tomorrow.

*Command explanations and quoted passages in this lesson come from or adapt the [kubectl reference](https://kubernetes.io/docs/reference/kubectl/) and the [Kubernetes documentation](https://kubernetes.io/docs/), © The Kubernetes Authors, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). We shortened and edited some passages. Kubernetes® is a registered trademark of The Linux Foundation. aitamer.news is not affiliated with or endorsed by The Linux Foundation or the CNCF.*

```rail
id: "get-nodes-daemonsets"
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
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "daemonsets"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "kube-system"
        text: "The namespace passed to --namespace. kube-system holds kindnet and kube-proxy."
```

```rail
id: "apply-node-agent"
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
      - token: "node-agent.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "rollout"
        text: "The command group for rollout actions."
      - token: "status"
        text: "Show the status of a rollout and wait until it finishes."
      - token: "daemonset/node-agent"
        text: "The resource written as type/name: daemonset/node-agent."
      - token: "--timeout=90s"
        text: "How long to wait before giving up. This command passes 90s."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "daemonset"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "node-agent"
        text: "The object name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "app.kubernetes.io/name=node-agent"
        text: "The label query passed to --selector: app.kubernetes.io/name=node-agent."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "wide"
        text: "An output format. The get examples say wide adds more information, such as the node name. For Pods the lesson's table adds IP, NODE, NOMINATED NODE and READINESS GATES."
```

```rail
id: "describe-control-plane-taints"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "describe"
        text: "Show details of a specific resource or group of resources. The describe docs say this includes related resources such as events or controllers."
      - token: "node"
        text: "The resource type."
      - token: "k8s-ep13-control-plane"
        text: "The object name."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "grep"
        text: "Shell. Prints input lines that match a pattern."
      - token: "Taints"
        text: "The pattern grep looks for. The lesson uses it to show the control-plane taint."
```

```rail
id: "patch-node-agent-toleration"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "patch"
        text: "Update fields of a resource using a strategic merge patch, a JSON merge patch, or a JSON patch. The patch docs say JSON and YAML are accepted."
      - token: "daemonset"
        text: "The resource type."
      - token: "node-agent"
        text: "The object name."
      - token: "--patch-file"
        text: "Read the patch from a file. The lesson's file adds the control-plane toleration."
      - token: "toleration-patch.yaml"
        text: "The file this flag names."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "rollout"
        text: "The command group for rollout actions."
      - token: "status"
        text: "Show the status of a rollout and wait until it finishes."
      - token: "daemonset/node-agent"
        text: "The resource written as type/name: daemonset/node-agent."
      - token: "--timeout=120s"
        text: "How long to wait before giving up. This command passes 120s."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "daemonset"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "node-agent"
        text: "The object name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "app.kubernetes.io/name=node-agent"
        text: "The label query passed to --selector: app.kubernetes.io/name=node-agent."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "wide"
        text: "An output format. The get examples say wide adds more information, such as the node name. For Pods the lesson's table adds IP, NODE, NOMINATED NODE and READINESS GATES."
```

```rail
id: "logs-node-agent"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "logs"
        text: "Print the logs for a container in a pod or specified resource. If the pod has only one container, the container name is optional."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "app.kubernetes.io/name=node-agent"
        text: "The label query passed to --selector: app.kubernetes.io/name=node-agent."
      - token: "--prefix"
        text: "Prefix each log line with its Pod and container. The lesson's output starts with the Pod name."
      - token: "--tail=1"
        text: "How many recent log lines to print. This command passes 1, one heartbeat per Pod."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "app.kubernetes.io/name=node-agent"
        text: "The label query passed to --selector: app.kubernetes.io/name=node-agent."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{.items[0].spec.tolerations}'"
        text: "jsonpath is an output format. A template is JSONPath expressions in curly braces. This token is the template in the lesson command."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "python3"
        text: "The Python interpreter. The lesson uses it to pretty-print the tolerations JSON."
      - token: "-m"
        text: "Run a Python module as a script. This command runs json.tool."
      - token: "json.tool"
        text: "Python's JSON formatter. It prints the tolerations list with one field per line."
```

```rail
id: "history-delete-node-agent"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "rollout"
        text: "The command group for rollout actions."
      - token: "history"
        text: "Show previous revisions of a rollout. The lesson's DaemonSet history lists revision 1 and revision 2."
      - token: "daemonset/node-agent"
        text: "The resource written as type/name: daemonset/node-agent."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "node-agent.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
```

```rail
id: "apply-batch"
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
      - token: "batch.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "job"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "batch"
        text: "The object name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "job-name=batch"
        text: "The label query passed to --selector: job-name=batch."
```

```rail
id: "wait-batch-complete"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "wait"
        text: "Wait for a condition on one or more resources."
      - token: "--for=condition=complete"
        text: "The condition to wait for. The lesson waits for complete on the batch Job and failed on the flaky Job."
      - token: "job/batch"
        text: "The resource written as type/name: job/batch."
      - token: "--timeout=120s"
        text: "How long to wait before giving up. This command passes 120s."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "job"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "batch"
        text: "The object name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "job-name=batch"
        text: "The label query passed to --selector: job-name=batch."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "logs"
        text: "Print the logs for a container in a pod or specified resource. If the pod has only one container, the container name is optional."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "job-name=batch"
        text: "The label query passed to --selector: job-name=batch."
      - token: "--tail=1"
        text: "How many recent log lines to print. This command passes 1: each Job Pod's item line."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "sort"
        text: "Shell. Sorts lines. The lesson sorts the Job logs so the indexes read in order."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "job"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "batch"
        text: "The object name."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{.status.completedIndexes} {.status.succeeded}{\"\\n\"}'"
        text: "jsonpath is an output format. A template is JSONPath expressions in curly braces. This token is the template in the lesson command."
```

```rail
id: "patch-batch-ttl"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "patch"
        text: "Update fields of a resource using a strategic merge patch, a JSON merge patch, or a JSON patch. The patch docs say JSON and YAML are accepted."
      - token: "job"
        text: "The resource type."
      - token: "batch"
        text: "The object name."
      - token: "--type=merge"
        text: "Use a JSON merge patch. The lesson uses it to set ttlSecondsAfterFinished on the finished Job."
      - token: "-p"
        text: "Short form of --patch. The patch to apply, written here as JSON."
      - token: "'{\"spec\":{\"ttlSecondsAfterFinished\":5}}'"
        text: "The patch document. The lesson passes a JSON object that changes one field."
      - token: "sleep"
        text: "Shell. Waits the given number of seconds. The lesson waits 12 seconds so the five-second TTL can delete the Job."
      - token: "12"
        text: "The number of seconds sleep waits."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "job"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "batch"
        text: "The object name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "job-name=batch"
        text: "The label query passed to --selector: job-name=batch."
```

```rail
id: "apply-flaky"
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
      - token: "flaky.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "wait"
        text: "Wait for a condition on one or more resources."
      - token: "--for=condition=failed"
        text: "The condition to wait for. The lesson waits for complete on the batch Job and failed on the flaky Job."
      - token: "job/flaky"
        text: "The resource written as type/name: job/flaky."
      - token: "--timeout=180s"
        text: "How long to wait before giving up. This command passes 180s."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "job"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "flaky"
        text: "The object name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "job-name=flaky"
        text: "The label query passed to --selector: job-name=flaky."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "describe"
        text: "Show details of a specific resource or group of resources. The describe docs say this includes related resources such as events or controllers."
      - token: "job"
        text: "The resource type."
      - token: "flaky"
        text: "The object name."
```

```rail
id: "get-flaky-conditions"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "job"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "flaky"
        text: "The object name."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{range .status.conditions[*]}{.type}={.status} {.reason}: {.message}{\"\\n\"}{end}'"
        text: "jsonpath is an output format. A template is JSONPath expressions in curly braces. This token is the template in the lesson command."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "job"
        text: "The resource type."
      - token: "flaky"
        text: "The object name."
```

```rail
id: "apply-report"
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
      - token: "report.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "cronjob"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "report"
        text: "The object name."
```

```rail
id: "get-report-jobs"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "cronjob"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "report"
        text: "The object name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "jobs"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "logs"
        text: "Print the logs for a container in a pod or specified resource. If the pod has only one container, the container name is optional."
      - token: "job/report-29905755"
        text: "The resource written as type/name: job/report-29905755."
```

```rail
id: "create-report-now"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "create"
        text: "Create a resource from a file or from stdin, or through a subcommand such as namespace."
      - token: "job"
        text: "The resource type."
      - token: "report-now"
        text: "The object name."
      - token: "--from=cronjob/report"
        text: "Create the Job from this CronJob's template. The lesson uses it to run the report without waiting for the schedule."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "wait"
        text: "Wait for a condition on one or more resources."
      - token: "--for=condition=complete"
        text: "The condition to wait for. Here kubectl waits until the Job report-now is complete."
      - token: "job/report-now"
        text: "The resource written as type/name: job/report-now."
      - token: "--timeout=60s"
        text: "How long to wait before giving up. This command passes 60s."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "logs"
        text: "Print the logs for a container in a pod or specified resource. If the pod has only one container, the container name is optional."
      - token: "job/report-now"
        text: "The resource written as type/name: job/report-now."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "patch"
        text: "Update fields of a resource using a strategic merge patch, a JSON merge patch, or a JSON patch. The patch docs say JSON and YAML are accepted."
      - token: "cronjob"
        text: "The resource type."
      - token: "report"
        text: "The object name."
      - token: "-p"
        text: "Short form of --patch. The patch to apply, written here as JSON."
      - token: "'{\"spec\":{\"suspend\":true}}'"
        text: "The patch document. The lesson passes a JSON object that changes one field."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "cronjob"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "report"
        text: "The object name."
```

```rail
id: "get-cronjob-events"
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
        text: "A field query that filters the list. The lesson keeps events whose involved object is a CronJob."
      - token: "involvedObject.kind=CronJob"
        text: "The field query passed to --field-selector: involvedObject.kind=CronJob."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "custom-columns=REASON:.reason,MESSAGE:.message"
        text: "A custom table. This command prints each event's reason and message."
```

```rail
id: "delete-report"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "cronjob"
        text: "The resource type."
      - token: "report"
        text: "The object name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "job"
        text: "The resource type."
      - token: "report-now"
        text: "The object name."
      - token: "--ignore-not-found"
        text: "Treat a missing object as a successful delete. Deleting the CronJob may already have removed report-now."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "cronjobs,jobs,pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
```
