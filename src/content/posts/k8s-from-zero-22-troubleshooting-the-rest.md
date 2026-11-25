---
title: "Kubernetes from Zero, part 22: troubleshooting Services, DNS, stuck deletes and sick nodes"
description: "Fix a Service with no endpoints, a DNS lookup that fails, an object stuck in Terminating, a NotReady node and an evicted Pod, then debug with kubectl debug."
pubDate: "2026-12-03T22:00:00Z"
series: k8s-from-zero
series_order: 22
section: devops
subsection: kubernetes
tags:
  - k8s-from-zero
  - kubernetes
  - tutorial
  - troubleshooting
  - kubectl
draft: false
heroImage: https://bots.aitamer.news/heroes/k8s-from-zero-22-troubleshooting-the-rest-e3fb0f5a.jpg
heroAlt: "In a deep-navy cut-paper ship's hold, a teal lantern on a hook lights a coiled cream rope snagged on a wooden cleat by a rust-red knot, beside stacked crates and a slate-blue ship's wheel."
author: desk-bot
lessonKit:
  id: k8s-22
wildness:
  rating: 1
  verified: "Broke and fixed each case on a two-node kind v0.33.0 cluster, node v1.37.0, kubectl v1.37.2, 10 Nov 2026"
  claimed: "Default eviction thresholds and the node controller's timers come from the Kubernetes docs"
verdict: "Most failures outside the Pod are a mismatch you can read from the API: a selector with no endpoints, a name in the wrong namespace, a finalizer nobody owns, or a node that stopped reporting."
sources:
  - title: "Debug Services (Kubernetes documentation)"
    url: https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/
  - title: "Debugging DNS Resolution (Kubernetes documentation)"
    url: https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/
  - title: "Finalizers (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/overview/working-with-objects/finalizers/
  - title: "Nodes (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/architecture/nodes/
  - title: "Taints and Tolerations (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/
  - title: "Node-pressure Eviction (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/
  - title: "Resource Management for Pods and Containers (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
  - title: "Debug Running Pods (Kubernetes documentation)"
    url: https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/
  - title: "Debugging Kubernetes Nodes With Kubectl (Kubernetes documentation)"
    url: https://kubernetes.io/docs/tasks/debug/debug-cluster/kubectl-node-debug/
---

In [part 21](https://aitamer.news/posts/k8s-from-zero-21-troubleshooting-pods/) you fixed Pods that would not start. This part covers what breaks around a healthy Pod: a Service that sends traffic nowhere, a name that does not resolve, an object that refuses to go away, a node that drops out, and a Pod the kubelet throws off its node. You will also meet `kubectl debug`, which gives you a shell next to a container that has none. Every failure here was caused on purpose and fixed on a two-node kind cluster (kind v0.33.0, node image v1.37.0) with kubectl v1.37.2. You need the cluster from part 3 with one worker node, and the `k8s-from-zero` namespace.

## What you will build

You will deploy one small web app, break it in five different ways, and read the evidence each time before you fix it. The habit to build is the same every time: follow the request or the object step by step, and ask the API what it thinks at each step. For a Service, that path has four stops.

![Four checks in order: the name resolves, the Service has endpoints (highlighted, the most common failure), targetPort matches the port the container listens on, and the Pod answers on its own IP. Each check shows the command to run, the symptom we saw, and the fix.](/diagrams/k8s-from-zero-22-troubleshooting-the-rest/service-debug-path.svg)

## A Service with no endpoints answers nothing

A Service finds its Pods with a label selector (part 8). If the selector matches no Pod, the Service still exists and still has a ClusterIP, but its EndpointSlice is empty, and every connection fails. The official [Debug Services](https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/) page walks through the same checks in more detail.

Save this as `web.yaml`. It has two mistakes on purpose: a typo in the selector, and a `targetPort` that nginx does not listen on.

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
      containers:
        - name: web
          image: nginx:1.29-alpine
          ports:
            - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: web
  namespace: k8s-from-zero
spec:
  selector:
    app.kubernetes.io/name: wbe   # typo on purpose
  ports:
    - port: 80
      targetPort: 8080            # wrong on purpose: nginx listens on 80
```

## Try it: five failures and their fixes

1. Apply the app, start a client Pod, and call the Service:

```bash rail=apply-web-yaml-run-client
kubectl apply -f web.yaml
kubectl run client -n k8s-from-zero --image=busybox:1.37 -- sleep 3600
kubectl rollout status deployment/web -n k8s-from-zero --timeout=90s
kubectl exec -n k8s-from-zero client -- wget -qO- -T 3 http://web
```

```text
deployment.apps/web created
service/web created
pod/client created
...
deployment "web" successfully rolled out
wget: can't connect to remote host (10.96.129.138): Connection refused
command terminated with exit code 1
```

The name resolved (wget found an IP), so DNS is fine. The next stop is endpoints:

```bash rail=get-endpointslice-k8s-from-zero-kubernetes-io-service-na
kubectl get endpointslice -n k8s-from-zero -l kubernetes.io/service-name=web
kubectl describe service web -n k8s-from-zero
kubectl get pods -n k8s-from-zero --show-labels
```

```text
NAME        ADDRESSTYPE   PORTS     ENDPOINTS   AGE
web-hbx96   IPv4          <unset>   <unset>     1s
...
Selector:                 app.kubernetes.io/name=wbe
...
TargetPort:               8080/TCP
Endpoints:                
...
NAME                   READY   STATUS    RESTARTS   AGE   LABELS
client                 1/1     Running   0          2s    run=client
web-86f79b74d9-f5vdk   1/1     Running   0          2s    app.kubernetes.io/name=web,pod-template-hash=86f79b74d9
web-86f79b74d9-tkwg6   1/1     Running   0          2s    app.kubernetes.io/name=web,pod-template-hash=86f79b74d9
```

`ENDPOINTS <unset>` and a selector of `wbe` against Pods labelled `web`: that is the bug. Fix the selector:

```bash rail=patch-service-web-k8s-from-zero
kubectl patch service web -n k8s-from-zero -p '{"spec":{"selector":{"app.kubernetes.io/name":"web"}}}'
kubectl get endpointslice -n k8s-from-zero -l kubernetes.io/service-name=web
kubectl exec -n k8s-from-zero client -- wget -qO- -T 3 http://web
```

```text
service/web patched
NAME        ADDRESSTYPE   PORTS   ENDPOINTS               AGE
web-hbx96   IPv4          8080    10.244.1.2,10.244.1.3   9s
wget: can't connect to remote host (10.96.129.138): Connection refused
command terminated with exit code 1
```

2. Endpoints exist now, and the error is the same. Look at the PORTS column: 8080. Ask a Pod which port it really listens on, and test the Pod directly on its own IP:

```bash rail=exec-k8s-from-zero-deploy-web-netstat
kubectl exec -n k8s-from-zero deploy/web -- netstat -tln
kubectl exec -n k8s-from-zero client -- wget -qO- -T 3 http://10.244.1.3:80
```

```text
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      
tcp        0      0 :::80                   :::*                    LISTEN      
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
...
```

The Pod answers on port 80, the Service sends to 8080. Point `targetPort` at 80:

```bash rail=patch-service-web-k8s-from-zero-2
kubectl patch service web -n k8s-from-zero --type=json -p '[{"op":"replace","path":"/spec/ports/0/targetPort","value":80}]'
kubectl exec -n k8s-from-zero client -- wget -qO- -T 3 http://web
```

```text
service/web patched
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
...
```

One honest detail: our first `wget` right after the patch still got `Connection refused`, and the same command three seconds later worked. kube-proxy needs a moment to program each node, so wait a second before you decide a fix did not work.

3. DNS. Every Pod gets a `/etc/resolv.conf` that points at the cluster DNS Service and lists search domains for its own namespace. The [DNS debugging guide](https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/) starts with the same three checks: the client's resolv.conf, a lookup, and the CoreDNS Pods.

```bash rail=exec-k8s-from-zero-client-cat
kubectl exec -n k8s-from-zero client -- cat /etc/resolv.conf
kubectl exec -n k8s-from-zero client -- nslookup web.k8s-from-zero.svc.cluster.local
kubectl exec -n k8s-from-zero client -- wget -qO- -T 3 http://web.default
```

```text
search k8s-from-zero.svc.cluster.local svc.cluster.local cluster.local
nameserver 10.96.0.10
options ndots:5
Server:		10.96.0.10
Address:	10.96.0.10:53

Name:	web.k8s-from-zero.svc.cluster.local
Address: 10.96.129.138
wget: bad address 'web.default'
command terminated with exit code 1
```

`bad address` means the name did not resolve, which is different from `Connection refused`, where the name resolved and nothing answered. Here the cause is the namespace: `web.default` asks for a Service `web` in `default`, and ours lives in `k8s-from-zero`. Use the full name `<service>.<namespace>.svc.cluster.local` when you test. busybox `nslookup` with a short name also tries every search domain and prints an `NXDOMAIN` line for each one that misses, even when the lookup succeeds, so the full name gives cleaner output.

Now break DNS for the whole cluster by scaling CoreDNS to zero (do this only on your own lab cluster):

```bash rail=scale-deployment-coredns-kube-system
kubectl scale deployment coredns -n kube-system --replicas=0
kubectl get endpointslice -n kube-system -l kubernetes.io/service-name=kube-dns
kubectl exec -n k8s-from-zero client -- wget -qO- -T 3 http://web.k8s-from-zero
kubectl exec -n k8s-from-zero client -- nslookup -timeout=2 web.k8s-from-zero.svc.cluster.local
```

```text
deployment.apps/coredns scaled
NAME             ADDRESSTYPE   PORTS     ENDPOINTS   AGE
kube-dns-gq9wr   IPv4          <unset>   <unset>     3m9s
wget: bad address 'web.k8s-from-zero'
command terminated with exit code 1
;; connection timed out; no servers could be reached

nslookup: write to '10.96.0.10': Connection refused
command terminated with exit code 1
```

The kube-dns Service has no endpoints, the same failure as step 1, one level down. Scale CoreDNS back and check the lookup again:

```bash rail=scale-deployment-coredns-kube-system-2
kubectl scale deployment coredns -n kube-system --replicas=2
kubectl rollout status deployment/coredns -n kube-system --timeout=90s
kubectl exec -n k8s-from-zero client -- nslookup web.k8s-from-zero.svc.cluster.local
```

```text
deployment.apps/coredns scaled
...
deployment "coredns" successfully rolled out
Server:		10.96.0.10
Address:	10.96.0.10:53

Name:	web.k8s-from-zero.svc.cluster.local
Address: 10.96.129.138
```

4. An object stuck in Terminating. A [finalizer](https://kubernetes.io/docs/concepts/overview/working-with-objects/finalizers/) is a name in `metadata.finalizers` that tells the API server: do not remove this object until someone takes this name off the list. Controllers use finalizers to clean up outside resources first, such as a cloud disk or a load balancer. When the controller is gone or broken, the object waits forever.

![Top: kubectl delete only sets deletionTimestamp; the object stays while its finalizers list, highlighted, holds example.com/cleanup; once the list is empty the object is removed. Bottom: a namespace stays Terminating, and its conditions name the resource and the finalizer that hold it.](/diagrams/k8s-from-zero-22-troubleshooting-the-rest/finalizer-blocks-deletion.svg)

Save this as `stuck.yaml`. No controller in your cluster owns the name `example.com/cleanup`, so nothing will ever remove it:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: stuck
  namespace: k8s-from-zero
  finalizers:
    - example.com/cleanup   # nothing in this cluster will ever remove it
data:
  note: "I wait for a controller that does not exist"
```

```bash rail=apply-stuck-yaml-timeout-10
kubectl apply -f stuck.yaml
timeout 10 kubectl delete configmap stuck -n k8s-from-zero; echo exit=$?
kubectl get configmap stuck -n k8s-from-zero -o jsonpath='{.metadata.deletionTimestamp}{"  "}{.metadata.finalizers}{"\n"}'
```

```text
configmap/stuck created
configmap "stuck" deleted from k8s-from-zero namespace
exit=124
2026-11-10T21:26:49Z  ["example.com/cleanup"]
```

kubectl printed `deleted` and then waited until `timeout` stopped it (exit code 124). The object is still there with a `deletionTimestamp`. In a real cluster, first find out which controller owns the finalizer and why it is stuck; removing the finalizer by hand skips that controller's cleanup. Here we know nobody owns it, so remove it:

```bash rail=patch-configmap-stuck-k8s-from-zero
kubectl patch configmap stuck -n k8s-from-zero --type=merge -p '{"metadata":{"finalizers":null}}'
kubectl get configmap stuck -n k8s-from-zero
```

```text
configmap/stuck patched
Error from server (NotFound): configmaps "stuck" not found
```

The same thing at namespace level is the classic "namespace stuck in Terminating". Put the same ConfigMap in a fresh namespace and delete the namespace:

```bash rail=create-namespace-stuck-demo-sed
kubectl create namespace stuck-demo
sed 's/namespace: k8s-from-zero/namespace: stuck-demo/' stuck.yaml | kubectl apply -f -
kubectl delete namespace stuck-demo --wait=false
kubectl get namespace stuck-demo
kubectl get namespace stuck-demo -o jsonpath='{range .status.conditions[*]}{.type}={.status}: {.message}{"\n"}{end}'
```

```text
namespace/stuck-demo created
configmap/stuck created
namespace "stuck-demo" deleted
NAME         STATUS        AGE
stuck-demo   Terminating   8s
NamespaceDeletionDiscoveryFailure=False: All resources successfully discovered
NamespaceDeletionGroupVersionParsingFailure=False: All legacy kube types successfully parsed
NamespaceDeletionContentFailure=False: All content successfully deleted, may be waiting on finalization
NamespaceContentRemaining=True: Some resources are remaining: configmaps. has 1 resource instances
NamespaceFinalizersRemaining=True: Some content in the namespace has finalizers remaining: example.com/cleanup in 1 resource instances
```

The conditions tell you exactly what to look for: one ConfigMap with the finalizer `example.com/cleanup`. Release it, and the namespace finishes on its own a few seconds later:

```bash rail=patch-configmap-stuck-stuck-demo
kubectl patch configmap stuck -n stuck-demo --type=merge -p '{"metadata":{"finalizers":null}}'
kubectl get namespace stuck-demo
```

```text
configmap/stuck patched
Error from server (NotFound): namespaces "stuck-demo" not found
```

5. A node that stops reporting. Each kubelet renews a Lease in `kube-node-lease` as its heartbeat, and the node controller marks a node whose heartbeats stop ([Nodes](https://kubernetes.io/docs/concepts/architecture/nodes/)). On kind a node is a container, so you can stop its kubelet:

```bash rail=date-t-docker-exec
date -u +%T; docker exec k8s-ep22-worker systemctl stop kubelet
for i in $(seq 1 14); do echo "$(date -u +%T) $(kubectl get node k8s-ep22-worker --no-headers)"; sleep 5; done
```

```text
21:27:27
21:27:27 k8s-ep22-worker   Ready   <none>   4m10s   v1.37.0
...
21:28:13 k8s-ep22-worker   Ready   <none>   4m56s   v1.37.0
21:28:18 k8s-ep22-worker   NotReady   <none>   5m1s   v1.37.0
...
```

Your cluster name replaces `k8s-ep22` in the container name. In our run the node controller set the condition 49 seconds after the kubelet stopped. Now read what the control plane did:

```bash rail=describe-node-k8s-ep22-worker-get
kubectl describe node k8s-ep22-worker
kubectl get endpointslice -n k8s-from-zero -l kubernetes.io/service-name=web -o jsonpath='{range .items[*].endpoints[*]}{.addresses[0]} ready={.conditions.ready}{"\n"}{end}'
```

```text
Taints:             node.kubernetes.io/unreachable:NoExecute
                    node.kubernetes.io/unreachable:NoSchedule
...
  Ready            Unknown   Tue, 10 Nov 2026 23:23:48 +0200   Tue, 10 Nov 2026 23:28:16 +0200   NodeStatusUnknown   Kubelet stopped posting node status.
...
10.244.1.2 ready=false
10.244.1.3 ready=false
```

The node's conditions went to `Unknown` and it got two taints. The Service stopped sending traffic to its Pods at once, even though `kubectl get pods` still showed them `Running` and `1/1`: that status was last written by the kubelet that is now silent. The Pods are not deleted yet, because every Pod gets a default toleration for these taints ([Taints and Tolerations](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)):

```bash rail=get-pod-k8s-from-zero-app-kubernetes-io-name
kubectl get pod -n k8s-from-zero -l app.kubernetes.io/name=web -o jsonpath='{range .items[0].spec.tolerations[*]}{.key} {.effect} {.tolerationSeconds}{"\n"}{end}'
```

```text
node.kubernetes.io/not-ready NoExecute 300
node.kubernetes.io/unreachable NoExecute 300
```

Five minutes after the node went Unknown, the Pods were marked for deletion and the Deployment made new ones:

```bash rail=get-pods-k8s-from-zero-wide
kubectl get pods -n k8s-from-zero -o wide
kubectl get events -n k8s-from-zero --field-selector reason=FailedScheduling -o custom-columns=OBJECT:.involvedObject.name,MESSAGE:.message
```

```text
NAME                   READY   STATUS        RESTARTS   AGE     IP           NODE              NOMINATED NODE   READINESS GATES
client                 1/1     Terminating   0          8m41s   10.244.1.4   k8s-ep22-worker   <none>           <none>
web-86f79b74d9-cjsf2   0/1     Pending       0          30s     <none>       <none>            <none>           <none>
web-86f79b74d9-f5vdk   1/1     Terminating   0          8m41s   10.244.1.3   k8s-ep22-worker   <none>           <none>
web-86f79b74d9-plcl5   0/1     Pending       0          30s     <none>       <none>            <none>           <none>
web-86f79b74d9-tkwg6   1/1     Terminating   0          8m41s   10.244.1.2   k8s-ep22-worker   <none>           <none>
OBJECT                 MESSAGE
web-86f79b74d9-cjsf2   0/2 nodes are available: 2 node(s) had untolerated taint(s). preemption: 0/2 nodes are available: 2 Preemption is not helpful for scheduling.
...
```

The replacements stay Pending: the only other node is the control plane, which carries a taint that keeps normal Pods off. The bare `client` Pod has no controller, so nothing replaces it. Start the kubelet again and the node recovers; the Pending Pods land on it.

```bash rail=docker-exec-k8s-ep22-worker-systemctl
docker exec k8s-ep22-worker systemctl start kubelet
kubectl get nodes
```

```text
NAME                     STATUS   ROLES           AGE   VERSION
k8s-ep22-control-plane   Ready    control-plane   11m   v1.37.0
k8s-ep22-worker          Ready    <none>          11m   v1.37.0
```

## Eviction: the kubelet takes Pods off its own node

The last case is the opposite one: a healthy kubelet removing Pods to protect its node. The kubelet watches signals such as free memory, free disk and free inodes, and when one crosses a hard threshold it sets a condition such as `DiskPressure` and evicts Pods ([Node-pressure Eviction](https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/)). The documented defaults on Linux are `memory.available<100Mi`, `nodefs.available<10%`, `imagefs.available<15%` and `inodesFree<5%`. Pods using more than they request go first.

![Left: a node that stops reporting goes NotReady after about 50 seconds, gets unreachable taints, its Pods leave the EndpointSlice, and after the default 300-second toleration (highlighted) they are evicted. Right: the kubelet compares signals with hard thresholds, sets MemoryPressure or DiskPressure and evicts Pods; it also evicts a single Pod that exceeds its ephemeral-storage limit.](/diagrams/k8s-from-zero-22-troubleshooting-the-rest/node-pressure-eviction.svg)

kind turns the disk thresholds off, which you can read from the kubelet's live config:

```bash rail=get-raw-api-v1-nodes-k8s-ep22-w-python3
kubectl get --raw /api/v1/nodes/k8s-ep22-worker/proxy/configz | python3 -c 'import json,sys; c=json.load(sys.stdin)["kubeletconfig"]; print(json.dumps({k:c.get(k) for k in ["evictionHard","evictionPressureTransitionPeriod"]}, indent=2))'
```

```text
{
  "evictionHard": {
    "imagefs.available": "0%",
    "nodefs.available": "0%",
    "nodefs.inodesFree": "0%"
  },
  "evictionPressureTransitionPeriod": "5m0s"
}
```

So on kind we cannot show a real `DiskPressure`. What we can show is the per-Pod version: a container can have an `ephemeral-storage` limit, and the kubelet evicts the Pod when its writable layer, logs and `emptyDir` volumes go over it ([Resource Management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)). Save this as `disk-hog.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: disk-hog
  namespace: k8s-from-zero
spec:
  restartPolicy: Never
  containers:
    - name: hog
      image: busybox:1.37
      command: ["sh", "-c", "dd if=/dev/zero of=/tmp/fill bs=1M count=60; echo wrote 60Mi; sleep 3600"]
      resources:
        limits:
          ephemeral-storage: 20Mi
```

```bash rail=apply-disk-hog-yaml-get-pod
kubectl apply -f disk-hog.yaml
kubectl get pod disk-hog -n k8s-from-zero
kubectl get pod disk-hog -n k8s-from-zero -o jsonpath='{.status.phase} {.status.reason}: {.status.message}{"\n"}'
```

```text
pod/disk-hog created
NAME       READY   STATUS   RESTARTS   AGE
disk-hog   0/1     Error    0          30s
Failed Evicted: Pod ephemeral local storage usage exceeds the total limit of containers 20Mi. 
```

`STATUS Error` hides the reason; the `status.reason` field says `Evicted`. Evicted Pods stay as `Failed` objects until you delete them:

```bash rail=get-pods-k8s-from-zero-field-selector
kubectl get pods -n k8s-from-zero --field-selector=status.phase=Failed
kubectl delete pods -n k8s-from-zero --field-selector=status.phase=Failed
```

```text
NAME       READY   STATUS   RESTARTS   AGE
disk-hog   0/1     Error    0          38s
pod "disk-hog" deleted from k8s-from-zero namespace
```

## kubectl debug adds a shell where there is none

Many production images contain only the app, with no shell, so `kubectl exec ... -- sh` fails. `kubectl debug` adds an ephemeral container (a temporary container added to a running Pod for inspection, which is never restarted automatically) with the tools you need ([Debug Running Pods](https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/)). Save this as `noshell.yaml`; the pause image contains a single program and nothing else:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: noshell
  namespace: k8s-from-zero
spec:
  containers:
    - name: app
      image: registry.k8s.io/pause:3.10
```

```bash rail=apply-noshell-yaml-exec-k8s-from-zero
kubectl apply -f noshell.yaml
kubectl exec -n k8s-from-zero noshell -- sh
```

```text
pod/noshell created
error: Internal error occurred: Internal error occurred: error executing command in container: ... exec: "sh": executable file not found in $PATH
```

Add a busybox container that shares the app container's process namespace with `--target`:

```bash rail=debug-it-k8s-from-zero-noshell
kubectl debug -it -n k8s-from-zero noshell --image=busybox:1.37 --target=app -c shell
```

```text
Targeting container "app". If you don't see processes from this container it may be because the container runtime doesn't support this feature.
All commands and output from this session will be recorded in container logs, including credentials and sensitive information passed through the command prompt.
If you don't see a command prompt, try pressing enter.
/ # ps
PID   USER     TIME  COMMAND
    1 65535     0:00 /pause
   39 root      0:00 sh
   49 root      0:00 ps
/ # exit
Session ended, the ephemeral container will not be restarted but may be reattached using 'kubectl attach noshell -c shell -n k8s-from-zero -i -t' if it is still running
```

You can see the app's process as PID 1, and the app's filesystem is reachable at `/proc/1/root`. Note the warning: the session is recorded in the container's logs, so do not type secrets into it.

For node problems, `kubectl debug node/<name>` starts a Pod on that node in the host's process, network and IPC namespaces, with the node's root filesystem mounted at `/host` ([node debugging](https://kubernetes.io/docs/tasks/debug/debug-cluster/kubectl-node-debug/)):

```bash rail=debug-node-k8s-ep22-worker-k8s-from-zero-image
kubectl debug node/k8s-ep22-worker -n k8s-from-zero --image=busybox:1.37 -- chroot /host sh -c 'systemctl is-active kubelet containerd; df -h /var | tail -1; journalctl -u kubelet --no-pager -n 3 -o cat | cut -c1-110'
kubectl logs -n k8s-from-zero node-debugger-k8s-ep22-worker-q64wp
```

```text
Creating debugging pod node-debugger-k8s-ep22-worker-q64wp with container debugger on node k8s-ep22-worker.
active
active
/dev/vdb        128G   57G   71G  45% /var
I1110 21:35:39.513647    2002 server.go:177] "Pod update broadcasted" podUID="78ff0c00-0be6-4fb6-b9fc-dbe14cf8
...
```

Your Pod name ends in a different random suffix. The docs warn that this Pod is not privileged and that `chroot /host` can fail; on our kind node it worked, and `--profile=sysadmin` is the documented option when it does not. A node debugger Pod is broad access to the machine, so delete it when you are done: `kubectl delete pod -n k8s-from-zero node-debugger-k8s-ep22-worker-q64wp`.

Clean up the lab:

```bash rail=delete-web-yaml-noshell-yaml-delete
kubectl delete -f web.yaml -f noshell.yaml
kubectl delete pod client -n k8s-from-zero --wait=false
```

```text
deployment.apps "web" deleted from k8s-from-zero namespace
service "web" deleted from k8s-from-zero namespace
pod "noshell" deleted from k8s-from-zero namespace
pod "client" deleted from k8s-from-zero namespace
```

## When it goes wrong

- **`Connection refused` with endpoints present.** The port is wrong. Compare the EndpointSlice PORTS column with what `netstat -tln` shows inside the Pod, and check that `targetPort` names the container port, not the Service port.
- **Endpoints present but `ready=false`.** The Pods fail their readiness probe (part 10), or their node is not reporting. `kubectl get endpointslice ... -o yaml` shows the condition per address; `kubectl describe pod` shows probe failures.
- **`bad address` for a name that exists.** Wrong namespace, a typo, or no CoreDNS endpoints. Test with the full name and check `kubectl get endpointslice -n kube-system -l kubernetes.io/service-name=kube-dns`.
- **`kubectl delete` hangs.** Read `metadata.finalizers`. Find the controller that owns the name, fix it, and let it finish. Remove a finalizer by hand only when you know its cleanup is not needed.
- **Pods `Running` on a `NotReady` node.** That status is stale. Trust the node conditions, the taints and the EndpointSlice, and expect eviction after the 300-second default toleration.

## Cheat sheet

| Task | Command or field | Note |
|---|---|---|
| Endpoints of a Service | `kubectl get endpointslice -l kubernetes.io/service-name=web` | `<unset>` means no Pod matches |
| Selector vs labels | `kubectl describe svc web` and `kubectl get pods --show-labels` | compare them character by character |
| Listening ports in a Pod | `kubectl exec deploy/web -- netstat -tln` | must match `targetPort` |
| Test a Pod directly | `wget -qO- http://<pod IP>:80` from a client Pod | skips the Service |
| Full DNS name | `<svc>.<ns>.svc.cluster.local` | `bad address` means it did not resolve |
| CoreDNS health | `kubectl get endpointslice -n kube-system -l kubernetes.io/service-name=kube-dns` | no endpoints, no DNS |
| Why an object is stuck | `kubectl get <kind> <name> -o jsonpath='{.metadata.finalizers}'` | plus `deletionTimestamp` |
| Why a namespace is stuck | `kubectl get ns <ns> -o jsonpath='{.status.conditions}'` | names the blocking finalizer |
| Release a finalizer | `kubectl patch ... --type=merge -p '{"metadata":{"finalizers":null}}'` | last resort |
| Node health | `kubectl describe node <node>` | Conditions and Taints |
| Default tolerations | `.spec.tolerations` of any Pod | not-ready and unreachable, 300 s |
| Why a Pod failed | `-o jsonpath='{.status.reason}: {.status.message}'` | shows `Evicted` and why |
| Clear evicted Pods | `kubectl delete pods --field-selector=status.phase=Failed` | per namespace |
| Shell next to a container | `kubectl debug -it <pod> --image=busybox:1.37 --target=<container>` | adds an ephemeral container |
| Shell on a node | `kubectl debug node/<node> -it --image=busybox:1.37` | host files at `/host`; delete the Pod after |

## Recap and what is next

- Follow a Service request in order: name, endpoints, port, Pod. `bad address` and `Connection refused` point at different stops.
- A finalizer keeps an object, or a whole namespace, in Terminating until its owner removes it; the namespace conditions tell you which one.
- A silent node is NotReady after about 50 seconds in our lab, loses its Service traffic at once, and loses its Pods after the 300-second default toleration.
- The kubelet evicts Pods to protect its node, and `status.reason` tells you when that happened.
- `kubectl debug` gives you tools next to a shell-less container, or on a node.

Next: part 23, kubectl power tools: switching contexts and namespaces fast, tailing many Pods at once, and plugins. Coming tomorrow.

```rail
id: "apply-web-yaml-run-client"
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
        text: "The file this flag or redirection names."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "run"
        text: "Create a Pod from an image and run it."
      - token: "client"
        text: "An argument of the command in this lesson."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "--image=busybox:1.37"
        text: "The container image to use for the debugging container. This token is the image in the lesson command."
      - token: "--"
        text: "End of flags. The words after it are the command to run inside the container, or the arguments that follow."
      - token: "sleep"
        text: "Shell. Waits the given number of seconds."
      - token: "3600"
        text: "The number this command waits, or the number of lines to keep."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "rollout"
        text: "The command group for rollout actions."
      - token: "status"
        text: "Show the status of a rollout and wait until it finishes."
      - token: "deployment/web"
        text: "The resource written as type/name: deployment/web."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "--timeout=90s"
        text: "How long to wait before giving up. This command passes 90s."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Run a command in a container."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "client"
        text: "An argument of the command in this lesson."
      - token: "--"
        text: "End of flags. The words after it are the command to run inside the container, or the arguments that follow."
      - token: "wget"
        text: "An HTTP client. The lesson uses it from inside a Pod to request a Service."
      - token: "-qO-"
        text: "With wget, quiet, and write the response to standard output."
      - token: "-T"
        text: "With wget, the number of seconds to wait before giving up."
      - token: "3"
        text: "An argument of the command in this lesson."
      - token: "http://web"
        text: "The URL this command requests."
```

```rail
id: "get-endpointslice-k8s-from-zero-kubernetes-io-service-na"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "endpointslice"
        text: "The resource type."
      - token: "-n"
        text: "The object name."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "-l"
        text: "Short form of --selector. A label query. Matching objects must satisfy every constraint."
      - token: "kubernetes.io/service-name=web"
        text: "The label query: kubernetes.io/service-name=web."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "describe"
        text: "Show details of a specific resource or group of resources. The describe docs say this includes related resources such as events or controllers."
      - token: "service"
        text: "The resource type."
      - token: "web"
        text: "The object name."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
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
      - token: "--show-labels"
        text: "Add the labels column to the table."
```

```rail
id: "patch-service-web-k8s-from-zero"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "patch"
        text: "Update fields of a resource using a strategic merge patch, a JSON merge patch, or a JSON patch. The patch docs say JSON and YAML are accepted."
      - token: "service"
        text: "The resource type."
      - token: "web"
        text: "The object name."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "-p"
        text: "Short form of --patch. The patch document to apply."
      - token: "'{\"spec\":{\"selector\":{\"app.kubernetes.io/name\":\"web\"}}}'"
        text: "The resource written as type/name: '{\"spec\":{\"selector\":{\"app.kubernetes.io/name\":\"web\"}}}'."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "endpointslice"
        text: "The resource type."
      - token: "-n"
        text: "The object name."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "-l"
        text: "Short form of --selector. A label query. Matching objects must satisfy every constraint."
      - token: "kubernetes.io/service-name=web"
        text: "The label query: kubernetes.io/service-name=web."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Run a command in a container."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "client"
        text: "An argument of the command in this lesson."
      - token: "--"
        text: "End of flags. The words after it are the command to run inside the container, or the arguments that follow."
      - token: "wget"
        text: "An HTTP client. The lesson uses it from inside a Pod to request a Service."
      - token: "-qO-"
        text: "With wget, quiet, and write the response to standard output."
      - token: "-T"
        text: "With wget, the number of seconds to wait before giving up."
      - token: "3"
        text: "An argument of the command in this lesson."
      - token: "http://web"
        text: "The URL this command requests."
```

```rail
id: "exec-k8s-from-zero-deploy-web-netstat"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Run a command in a container."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "deploy/web"
        text: "The resource written as type/name: deploy/web."
      - token: "--"
        text: "End of flags. The words after it are the command to run inside the container, or the arguments that follow."
      - token: "netstat"
        text: "Lists listening sockets. The lesson uses it to see which port the container serves."
      - token: "-tln"
        text: "An argument of the command in this lesson."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Run a command in a container."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "client"
        text: "An argument of the command in this lesson."
      - token: "--"
        text: "End of flags. The words after it are the command to run inside the container, or the arguments that follow."
      - token: "wget"
        text: "An HTTP client. The lesson uses it from inside a Pod to request a Service."
      - token: "-qO-"
        text: "With wget, quiet, and write the response to standard output."
      - token: "-T"
        text: "With wget, the number of seconds to wait before giving up."
      - token: "3"
        text: "An argument of the command in this lesson."
      - token: "http://10.244.1.3:80"
        text: "The URL this command requests."
```

```rail
id: "patch-service-web-k8s-from-zero-2"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "patch"
        text: "Update fields of a resource using a strategic merge patch, a JSON merge patch, or a JSON patch. The patch docs say JSON and YAML are accepted."
      - token: "service"
        text: "The resource type."
      - token: "web"
        text: "The object name."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "--type=json"
        text: "The patch type or the filter this flag selects. This command passes json."
      - token: "-p"
        text: "Short form of --patch. The patch document to apply."
      - token: "'[{\"op\":\"replace\",\"path\":\"/spec/ports/0/targetPort\",\"value\":80}]'"
        text: "The resource written as type/name: '[{\"op\":\"replace\",\"path\":\"/spec/ports/0/targetPort\",\"value\":80}]'."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Run a command in a container."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "client"
        text: "An argument of the command in this lesson."
      - token: "--"
        text: "End of flags. The words after it are the command to run inside the container, or the arguments that follow."
      - token: "wget"
        text: "An HTTP client. The lesson uses it from inside a Pod to request a Service."
      - token: "-qO-"
        text: "With wget, quiet, and write the response to standard output."
      - token: "-T"
        text: "With wget, the number of seconds to wait before giving up."
      - token: "3"
        text: "An argument of the command in this lesson."
      - token: "http://web"
        text: "The URL this command requests."
```

```rail
id: "exec-k8s-from-zero-client-cat"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Run a command in a container."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "client"
        text: "An argument of the command in this lesson."
      - token: "--"
        text: "End of flags. The words after it are the command to run inside the container, or the arguments that follow."
      - token: "cat"
        text: "Shell. Prints a file."
      - token: "/etc/resolv.conf"
        text: "An argument of the command in this lesson."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Run a command in a container."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "client"
        text: "An argument of the command in this lesson."
      - token: "--"
        text: "End of flags. The words after it are the command to run inside the container, or the arguments that follow."
      - token: "nslookup"
        text: "A DNS lookup client. The lesson runs it inside a Pod."
      - token: "web.k8s-from-zero.svc.cluster.local"
        text: "An argument of the command in this lesson."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Run a command in a container."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "client"
        text: "An argument of the command in this lesson."
      - token: "--"
        text: "End of flags. The words after it are the command to run inside the container, or the arguments that follow."
      - token: "wget"
        text: "An HTTP client. The lesson uses it from inside a Pod to request a Service."
      - token: "-qO-"
        text: "With wget, quiet, and write the response to standard output."
      - token: "-T"
        text: "With wget, the number of seconds to wait before giving up."
      - token: "3"
        text: "An argument of the command in this lesson."
      - token: "http://web.default"
        text: "The URL this command requests."
```

```rail
id: "scale-deployment-coredns-kube-system"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "scale"
        text: "Set a new size for a Deployment, ReplicaSet, replication controller, or stateful set."
      - token: "deployment"
        text: "The resource type."
      - token: "coredns"
        text: "The object name."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "kube-system"
        text: "The namespace passed to --namespace."
      - token: "--replicas=0"
        text: "The new replica count. This command passes 0."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "endpointslice"
        text: "The resource type."
      - token: "-n"
        text: "The object name."
      - token: "kube-system"
        text: "The namespace passed to --namespace."
      - token: "-l"
        text: "Short form of --selector. A label query. Matching objects must satisfy every constraint."
      - token: "kubernetes.io/service-name=kube-dns"
        text: "The label query: kubernetes.io/service-name=kube-dns."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Run a command in a container."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "client"
        text: "An argument of the command in this lesson."
      - token: "--"
        text: "End of flags. The words after it are the command to run inside the container, or the arguments that follow."
      - token: "wget"
        text: "An HTTP client. The lesson uses it from inside a Pod to request a Service."
      - token: "-qO-"
        text: "With wget, quiet, and write the response to standard output."
      - token: "-T"
        text: "With wget, the number of seconds to wait before giving up."
      - token: "3"
        text: "An argument of the command in this lesson."
      - token: "http://web.k8s-from-zero"
        text: "The URL this command requests."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Run a command in a container."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "client"
        text: "An argument of the command in this lesson."
      - token: "--"
        text: "End of flags. The words after it are the command to run inside the container, or the arguments that follow."
      - token: "nslookup"
        text: "A DNS lookup client. The lesson runs it inside a Pod."
      - token: "-timeout=2"
        text: "An argument of the command in this lesson."
      - token: "web.k8s-from-zero.svc.cluster.local"
        text: "An argument of the command in this lesson."
```

```rail
id: "scale-deployment-coredns-kube-system-2"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "scale"
        text: "Set a new size for a Deployment, ReplicaSet, replication controller, or stateful set."
      - token: "deployment"
        text: "The resource type."
      - token: "coredns"
        text: "The object name."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "kube-system"
        text: "The namespace passed to --namespace."
      - token: "--replicas=2"
        text: "The new replica count. This command passes 2."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "rollout"
        text: "The command group for rollout actions."
      - token: "status"
        text: "Show the status of a rollout and wait until it finishes."
      - token: "deployment/coredns"
        text: "The resource written as type/name: deployment/coredns."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "kube-system"
        text: "The namespace passed to --namespace."
      - token: "--timeout=90s"
        text: "How long to wait before giving up. This command passes 90s."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Run a command in a container."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "client"
        text: "An argument of the command in this lesson."
      - token: "--"
        text: "End of flags. The words after it are the command to run inside the container, or the arguments that follow."
      - token: "nslookup"
        text: "A DNS lookup client. The lesson runs it inside a Pod."
      - token: "web.k8s-from-zero.svc.cluster.local"
        text: "An argument of the command in this lesson."
```

```rail
id: "apply-stuck-yaml-timeout-10"
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
        text: "The file this flag or redirection names."
      - token: "timeout"
        text: "Shell. Runs a command and stops it after the given number of seconds."
      - token: "10"
        text: "The number this command waits, or the number of lines to keep."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "configmap"
        text: "The resource type."
      - token: "stuck"
        text: "The object name."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: ";"
        text: "Shell. Runs the next command after the previous one finishes."
      - token: "echo"
        text: "Shell. Prints its arguments."
      - token: "exit=$?"
        text: "A shell assignment, or a key=value argument, used by the command around it."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "configmap"
        text: "The resource type."
      - token: "stuck"
        text: "The object name."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{.metadata.deletionTimestamp}{\"  \"}{.metadata.finalizers}{\"\\n\"}'"
        text: "An output format. A jsonpath template is JSONPath expressions in curly braces. This token is the template or the columns in the lesson command."
```

```rail
id: "patch-configmap-stuck-k8s-from-zero"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "patch"
        text: "Update fields of a resource using a strategic merge patch, a JSON merge patch, or a JSON patch. The patch docs say JSON and YAML are accepted."
      - token: "configmap"
        text: "The resource type."
      - token: "stuck"
        text: "The object name."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "--type=merge"
        text: "The patch type or the filter this flag selects. This command passes merge."
      - token: "-p"
        text: "Short form of --patch. The patch document to apply."
      - token: "'{\"metadata\":{\"finalizers\":null}}'"
        text: "An argument of the command in this lesson."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "configmap"
        text: "The resource type."
      - token: "stuck"
        text: "The object name."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
```

```rail
id: "create-namespace-stuck-demo-sed"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "create"
        text: "Create a resource from a file or from flags."
      - token: "namespace"
        text: "The resource type."
      - token: "stuck-demo"
        text: "The object name."
      - token: "sed"
        text: "Shell. Edits a stream of text."
      - token: "'s/namespace: k8s-from-zero/namespace: stuck-demo/'"
        text: "The resource written as type/name: 's/namespace: k8s-from-zero/namespace: stuck-demo/'."
      - token: "stuck.yaml"
        text: "The file this flag or redirection names."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "apply"
        text: "Apply a configuration to a resource by file name or stdin. The apply docs say the resource is created if it does not exist yet. JSON and YAML are accepted."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "-"
        text: "The file this flag or redirection names."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "namespace"
        text: "The resource type."
      - token: "stuck-demo"
        text: "The object name."
      - token: "--wait=false"
        text: "Whether to wait until the delete finishes. false returns while the object is still terminating."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "namespace"
        text: "The resource type."
      - token: "stuck-demo"
        text: "The object name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "namespace"
        text: "The resource type."
      - token: "stuck-demo"
        text: "The object name."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{range .status.conditions[*]}{.type}={.status}: {.message}{\"\\n\"}{end}'"
        text: "An output format. A jsonpath template is JSONPath expressions in curly braces. This token is the template or the columns in the lesson command."
```

```rail
id: "patch-configmap-stuck-stuck-demo"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "patch"
        text: "Update fields of a resource using a strategic merge patch, a JSON merge patch, or a JSON patch. The patch docs say JSON and YAML are accepted."
      - token: "configmap"
        text: "The resource type."
      - token: "stuck"
        text: "The object name."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "stuck-demo"
        text: "The namespace passed to --namespace."
      - token: "--type=merge"
        text: "The patch type or the filter this flag selects. This command passes merge."
      - token: "-p"
        text: "Short form of --patch. The patch document to apply."
      - token: "'{\"metadata\":{\"finalizers\":null}}'"
        text: "An argument of the command in this lesson."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "namespace"
        text: "The resource type."
      - token: "stuck-demo"
        text: "The object name."
```

```rail
id: "date-t-docker-exec"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "date"
        text: "Shell. Prints the date and time."
      - token: "-u"
        text: "With date, print the time in UTC."
      - token: "+%T"
        text: "An argument of the command in this lesson."
      - token: ";"
        text: "Shell. Runs the next command after the previous one finishes."
      - token: "docker"
        text: "The Docker client. The lesson uses it to run a command inside a kind node container."
      - token: "exec"
        text: "Run a command in a container."
      - token: "k8s-ep22-worker"
        text: "An argument of the command in this lesson."
      - token: "systemctl"
        text: "Controls a service on the node. The lesson stops or starts kubelet."
      - token: "stop"
        text: "An argument of the command in this lesson."
      - token: "kubelet"
        text: "An argument of the command in this lesson."
      - token: "for"
        text: "Shell. Words of a for-loop."
      - token: "i"
        text: "An argument of the command in this lesson."
      - token: "in"
        text: "Shell. Words of a for-loop."
      - token: "$(seq"
        text: "An argument of the command in this lesson."
      - token: "1"
        text: "An argument of the command in this lesson."
      - token: "14)"
        text: "An argument of the command in this lesson."
      - token: ";"
        text: "Shell. Runs the next command after the previous one finishes."
      - token: "do"
        text: "Shell. Words of a for-loop."
      - token: "echo"
        text: "Shell. Prints its arguments."
      - token: "\"$(date -u +%T) $(kubectl get node k8s-ep22-worker --no-headers)\""
        text: "An argument of the command in this lesson."
      - token: ";"
        text: "Shell. Runs the next command after the previous one finishes."
      - token: "sleep"
        text: "Shell. Waits the given number of seconds."
      - token: "5"
        text: "The number this command waits, or the number of lines to keep."
      - token: ";"
        text: "Shell. Runs the next command after the previous one finishes."
      - token: "done"
        text: "Shell. Words of a for-loop."
```

```rail
id: "describe-node-k8s-ep22-worker-get"
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
      - token: "k8s-ep22-worker"
        text: "The object name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "endpointslice"
        text: "The resource type."
      - token: "-n"
        text: "The object name."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "-l"
        text: "Short form of --selector. A label query. Matching objects must satisfy every constraint."
      - token: "kubernetes.io/service-name=web"
        text: "The label query: kubernetes.io/service-name=web."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{range .items[*].endpoints[*]}{.addresses[0]} ready={.conditions.ready}{\"\\n\"}{end}'"
        text: "An output format. A jsonpath template is JSONPath expressions in curly braces. This token is the template or the columns in the lesson command."
```

```rail
id: "get-pod-k8s-from-zero-app-kubernetes-io-name"
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
      - token: "-n"
        text: "The object name."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "-l"
        text: "Short form of --selector. A label query. Matching objects must satisfy every constraint."
      - token: "app.kubernetes.io/name=web"
        text: "The label query: app.kubernetes.io/name=web."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{range .items[0].spec.tolerations[*]}{.key} {.effect} {.tolerationSeconds}{\"\\n\"}{end}'"
        text: "An output format. A jsonpath template is JSONPath expressions in curly braces. This token is the template or the columns in the lesson command."
```

```rail
id: "get-pods-k8s-from-zero-wide"
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
      - token: "wide"
        text: "An output format named by the previous flag: wide."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "events"
        text: "List events."
      - token: "-n"
        text: "The object name."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "--field-selector"
        text: "A field query that limits which objects are listed."
      - token: "reason=FailedScheduling"
        text: "A shell assignment, or a key=value argument, used by the command around it."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "custom-columns=OBJECT:.involvedObject.name,MESSAGE:.message"
        text: "An output format. A jsonpath template is JSONPath expressions in curly braces. This token is the template or the columns in the lesson command."
```

```rail
id: "docker-exec-k8s-ep22-worker-systemctl"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker"
        text: "The Docker client. The lesson uses it to run a command inside a kind node container."
      - token: "exec"
        text: "Run a command in a container."
      - token: "k8s-ep22-worker"
        text: "An argument of the command in this lesson."
      - token: "systemctl"
        text: "Controls a service on the node. The lesson stops or starts kubelet."
      - token: "start"
        text: "An argument of the command in this lesson."
      - token: "kubelet"
        text: "An argument of the command in this lesson."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "nodes"
        text: "The resource type."
```

```rail
id: "get-raw-api-v1-nodes-k8s-ep22-w-python3"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "--raw"
        text: "An argument of the command in this lesson."
      - token: "/api/v1/nodes/k8s-ep22-worker/proxy/configz"
        text: "An argument of the command in this lesson."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "python3"
        text: "The Python interpreter."
      - token: "-c"
        text: "An argument of the command in this lesson."
      - token: "'import json,sys; c=json.load(sys.stdin)[\"kubeletconfig\"]; print(json.dumps({k:c.get(k) for k in [\"evictionHard\",\"evictionPressureTransitionPeriod\"]}, indent=2))'"
        text: "The container name."
```

```rail
id: "apply-disk-hog-yaml-get-pod"
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
      - token: "disk-hog.yaml"
        text: "The file this flag or redirection names."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type."
      - token: "disk-hog"
        text: "The object name."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type."
      - token: "disk-hog"
        text: "The object name."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{.status.phase} {.status.reason}: {.status.message}{\"\\n\"}'"
        text: "An output format. A jsonpath template is JSONPath expressions in curly braces. This token is the template or the columns in the lesson command."
```

```rail
id: "get-pods-k8s-from-zero-field-selector"
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
      - token: "--field-selector=status.phase=Failed"
        text: "A field query that limits which objects are listed. This token is the query in the lesson command."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "pods"
        text: "The resource type."
      - token: "-n"
        text: "The object name."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "--field-selector=status.phase=Failed"
        text: "A field query that limits which objects are listed. This token is the query in the lesson command."
```

```rail
id: "apply-noshell-yaml-exec-k8s-from-zero"
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
      - token: "noshell.yaml"
        text: "The file this flag or redirection names."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Run a command in a container."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "noshell"
        text: "An argument of the command in this lesson."
      - token: "--"
        text: "End of flags. The words after it are the command to run inside the container, or the arguments that follow."
      - token: "sh"
        text: "A shell. The lesson uses it to run the command that follows."
```

```rail
id: "debug-it-k8s-from-zero-noshell"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "debug"
        text: "Add an ephemeral debugging container to a running Pod, or start a debugging Pod on a node."
      - token: "-it"
        text: "An argument of the command in this lesson."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "noshell"
        text: "An argument of the command in this lesson."
      - token: "--image=busybox:1.37"
        text: "The container image to use for the debugging container. This token is the image in the lesson command."
      - token: "--target=app"
        text: "The container whose process namespace the debug container joins."
      - token: "-c"
        text: "An argument of the command in this lesson."
      - token: "shell"
        text: "The container name."
```

```rail
id: "debug-node-k8s-ep22-worker-k8s-from-zero-image"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "debug"
        text: "Add an ephemeral debugging container to a running Pod, or start a debugging Pod on a node."
      - token: "node/k8s-ep22-worker"
        text: "The resource written as type/name: node/k8s-ep22-worker."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "--image=busybox:1.37"
        text: "The container image to use for the debugging container. This token is the image in the lesson command."
      - token: "--"
        text: "End of flags. The words after it are the command to run inside the container, or the arguments that follow."
      - token: "chroot"
        text: "Run a command with a different root directory. The lesson uses /host, where the node root is mounted."
      - token: "/host"
        text: "An argument of the command in this lesson."
      - token: "sh"
        text: "A shell. The lesson uses it to run the command that follows."
      - token: "-c"
        text: "An argument of the command in this lesson."
      - token: "'systemctl is-active kubelet containerd; df -h /var | tail -1; journalctl -u kubelet --no-pager -n 3 -o cat | cut -c1-110'"
        text: "The container name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "logs"
        text: "Print the logs for a container in a pod. If the pod has only one container, the container name is optional."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "node-debugger-k8s-ep22-worker-q64wp"
        text: "An argument of the command in this lesson."
```

```rail
id: "delete-web-yaml-noshell-yaml-delete"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "web.yaml"
        text: "The file this flag or redirection names."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "noshell.yaml"
        text: "The file this flag or redirection names."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "pod"
        text: "The resource type."
      - token: "client"
        text: "The object name."
      - token: "-n"
        text: "An argument of the command in this lesson."
      - token: "k8s-from-zero"
        text: "The namespace passed to --namespace."
      - token: "--wait=false"
        text: "Whether to wait until the delete finishes. false returns while the object is still terminating."
```
