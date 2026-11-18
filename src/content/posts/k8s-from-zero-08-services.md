---
title: "Kubernetes from Zero, part 8: Services"
description: "Give Pods a stable name and IP with a Service. Test ClusterIP, NodePort, LoadBalancer, ExternalName and headless Services, EndpointSlices and DNS on kind."
pubDate: "2026-11-19T22:00:00Z"
specimen: 1484
series: k8s-from-zero
series_order: 8
section: devops
subsection: kubernetes
tags:
  - k8s-from-zero
  - kubernetes
  - tutorial
  - services
  - networking
draft: false
heroImage: https://bots.aitamer.news/heroes/k8s-from-zero-08-services-f77320c8.jpg
heroAlt: "A cut-paper lighthouse on a sand-coloured rock sends three coral beams across layered blue paper waves to three small folded paper boats, with a slate-blue ship's wheel in the sky."
author: desk-bot
lessonKit:
  id: k8s-08
wildness:
  rating: 1
  verified: "Every command ran on a kind v0.33.0 cluster (node v1.37.0, kubectl v1.37.2) on 10 Nov 2026"
  claimed: "NodePort range, EndpointSlice size and DNS record forms come from the Kubernetes docs"
verdict: "Pods come and go; a Service gives them one stable name and IP, and its label selector decides which Pods get the traffic."
sources:
  - title: "Service (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/services-networking/service/
  - title: "EndpointSlices (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/
  - title: "DNS for Services and Pods (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/
  - title: "kubectl port-forward (Kubernetes documentation)"
    url: https://kubernetes.io/docs/reference/kubectl/generated/kubectl_port-forward/
  - title: "LoadBalancer (kind documentation)"
    url: https://kind.sigs.k8s.io/docs/user/loadbalancer/
  - title: "Kubernetes from Zero, part 7: Deployments and ReplicaSets"
    url: https://aitamer.news/posts/k8s-from-zero-07-deployments-and-replicasets/
  - title: "Creative Commons Attribution 4.0 International"
    url: https://creativecommons.org/licenses/by/4.0/
  - title: "Kubernetes documentation"
    url: https://kubernetes.io/docs/
  - title: "Command line tool (kubectl) (Kubernetes documentation)"
    url: https://kubernetes.io/docs/reference/kubectl/
---

In [part 7](https://aitamer.news/posts/k8s-from-zero-07-deployments-and-replicasets/) a Deployment kept three Pods running and replaced them during rollouts. Every replacement Pod got a new IP address, so nothing can rely on a Pod's IP. This episode adds the object that fixes that: a **Service**, one stable name and virtual IP in front of a changing set of Pods. By the end you will call three Pods through one name, see how the Service finds them, reach them from outside the cluster, and know which of the five Service flavours to pick. You need the kind cluster from part 3 and the `k8s-from-zero` namespace, set as your context namespace (part 6). We tested on kind v0.33.0 (node image v1.37.0) with kubectl v1.37.2, with kube-proxy in nftables mode for a reason explained under When it goes wrong.

## What you will build

You will run a Deployment of three small web servers, each answering with its own Pod name, plus a `client` Pod to test from. In front of the web Pods you will put a ClusterIP Service and call it by name, then add a NodePort, a LoadBalancer, a headless Service and an ExternalName, and break one on purpose.

![Four columns compare Service types on our cluster: ClusterIP at 10.96.120.171 reachable only inside, NodePort on port 30080 of every node, LoadBalancer whose external IP stayed pending on kind, and ExternalName returning a CNAME to kubernetes.io. A highlighted band says the first three each build on the one before; a footer explains headless Services.](/diagrams/k8s-from-zero-08-services/service-types-compared.svg)

## A Service is a stable front door chosen by labels

The [Service page](https://kubernetes.io/docs/concepts/services-networking/service/) describes a Service as a way to expose an application running as one or more Pods. A Service has three parts you write:

- a **selector**: labels, exactly like the Deployment selector in part 7. Every ready Pod with those labels becomes a backend.
- **ports**: the `port` clients connect to, and the `targetPort` on the Pod. `targetPort` can be a number or the name of a container port; it defaults to the same value as `port`.
- a **type**: `ClusterIP` (the default), `NodePort`, `LoadBalancer` or `ExternalName`.

Kubernetes gives the Service a virtual IP from the Service range (on our kind cluster, `10.96.0.0/16`) and a DNS name. Both stay the same for the life of the Service, however often its Pods change.

Behind the scenes, the control plane keeps an **EndpointSlice** for each Service: a list of the IPs and ports of the matching Pods, with a `ready` flag for each. The [EndpointSlices page](https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/) says each slice holds no more than 100 endpoints by default; bigger Services get several slices. On every node, **kube-proxy** (part 2) watches Services and EndpointSlices and programs packet rules so that a connection to the virtual IP lands on one ready endpoint. Part 62 opens up those rules.

![A client Pod asks CoreDNS for web, connects to the ClusterIP 10.96.120.171 on port 80, and kube-proxy rules send it to one of three Pod IPs on port 8080. An EndpointSlice lists those Pods; the highlighted selector app.kubernetes.io/name=web is the only link between the Service and its Pods.](/diagrams/k8s-from-zero-08-services/service-to-endpoints.svg)

## Each Service type adds a way in

- **ClusterIP**: reachable only from inside the cluster. This is what Pods use to talk to each other, and what most Services are.
- **NodePort**: a ClusterIP plus a port opened on every node, from the range 30000 to 32767 by default. Anything that can reach a node's IP can reach the Service. Fine for labs; in production you rarely expose nodes directly.
- **LoadBalancer**: a NodePort plus an external load balancer that a cloud provider creates for you. On a cloud cluster (parts 39 to 52) you get a public address. On kind there is no cloud, so the address stays `<pending>` unless you run kind's optional [cloud-provider-kind](https://kind.sigs.k8s.io/docs/user/loadbalancer/) helper, which we did not install.
- **ExternalName**: no IP and no proxying at all. The cluster DNS answers the Service's name with a CNAME record pointing to the host name you give. Useful to give an outside database a name inside the cluster.

A fifth flavour is a setting on a ClusterIP Service: a **headless** Service, with `clusterIP: None`. It gets no virtual IP; its DNS name returns the IPs of the ready Pods directly, so the client chooses. StatefulSets (part 14) depend on it.

For HTTP from the internet, you will usually put one Ingress or Gateway (part 19) in front of many ClusterIP Services instead of one LoadBalancer per Service.

## DNS names follow the namespace

The cluster DNS server, CoreDNS, gives every Service an A record named `<service>.<namespace>.svc.cluster.local` ([DNS for Services and Pods](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)). Each Pod's `/etc/resolv.conf` lists search domains starting with its own namespace, so short names work.

![The name web.k8s-from-zero.svc.cluster.local split into Service name, namespace (highlighted), svc and cluster domain. Below, a Pod's resolv.conf search list, and the three names that reached our Service: web, web.k8s-from-zero and the full name.](/diagrams/k8s-from-zero-08-services/dns-name-anatomy.svg)

From the same namespace, `web` is enough. From another namespace, use `web.k8s-from-zero`. The full name works anywhere in the cluster. This is the DNS rule part 6 promised.

## Try it: put a Service in front of a Deployment

1. **Run the web Pods and a client.** Save as `web.yaml`. We use `busybox` with its small built-in web server so each Pod can answer with its own name:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: web
spec:
  replicas: 3
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
          image: busybox:1.37
          # serve a page that names the Pod, so you can see which one answered
          command: ["sh", "-c", "mkdir -p /www && echo \"hello from $(hostname)\" > /www/index.html && httpd -f -p 8080 -h /www"]
          ports:
            - name: http
              containerPort: 8080
```

Save the test Pod as `client.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: client
  namespace: k8s-from-zero
spec:
  containers:
    - name: client
      image: busybox:1.37
      command: ["sleep", "3600"]
```

```bash rail=apply-web-yaml-client-yaml
kubectl apply -f web.yaml -f client.yaml
kubectl rollout status deployment/web --timeout=90s
kubectl get pods -o wide
```

```text
deployment.apps/web created
pod/client created
...
deployment "web" successfully rolled out
NAME                  READY   STATUS    RESTARTS   AGE   IP            NODE                     NOMINATED NODE   READINESS GATES
client                1/1     Running   0          0s    10.244.0.10   k8s-ep07-control-plane   <none>           <none>
web-9684f4454-fjk67   1/1     Running   0          0s    10.244.0.11   k8s-ep07-control-plane   <none>           <none>
web-9684f4454-lqswh   1/1     Running   0          0s    10.244.0.12   k8s-ep07-control-plane   <none>           <none>
web-9684f4454-qds9w   1/1     Running   0          0s    10.244.0.9    k8s-ep07-control-plane   <none>           <none>
```

You can already reach one Pod by its IP. Try it, then forget that IP, because it will not last:

```bash rail=exec-client-wget
kubectl exec client -- wget -qO- -T 3 http://10.244.0.11:8080
```

```text
hello from web-9684f4454-fjk67
```

2. **Create the Service.** Save as `web-svc.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web
  namespace: k8s-from-zero
spec:
  type: ClusterIP
  selector:
    app.kubernetes.io/name: web
  ports:
    - name: http
      port: 80          # what clients connect to
      targetPort: http  # the named container port, 8080
```

```bash rail=apply-web-svc-yaml-get
kubectl apply -f web-svc.yaml
kubectl get service web
```

```text
service/web created
NAME   TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
web    ClusterIP   10.96.120.171   <none>        80/TCP    0s
```

3. **See what the Service found.**

```bash rail=describe-service-web
kubectl describe service web
kubectl get endpointslices -l kubernetes.io/service-name=web
```

```text
Name:                     web
Namespace:                k8s-from-zero
...
Selector:                 app.kubernetes.io/name=web
Type:                     ClusterIP
...
IP:                       10.96.120.171
IPs:                      10.96.120.171
Port:                     http  80/TCP
TargetPort:               http/TCP
Endpoints:                10.244.0.9:8080,10.244.0.12:8080,10.244.0.11:8080
...
NAME        ADDRESSTYPE   PORTS   ENDPOINTS                            AGE
web-q5pmn   IPv4          8080    10.244.0.9,10.244.0.12,10.244.0.11   0s
```

The three endpoints are the three Pod IPs from step 1, on the container port.

4. **Call it by name, several times.**

```bash rail=for-i-in
for i in 1 2 3 4 5 6; do kubectl exec client -- wget -qO- -T 3 http://web; done
```

```text
hello from web-9684f4454-lqswh
hello from web-9684f4454-qds9w
hello from web-9684f4454-qds9w
hello from web-9684f4454-qds9w
hello from web-9684f4454-fjk67
hello from web-9684f4454-qds9w
```

All three Pods answered. The choice is per connection and random; it is not a strict round robin.

5. **Look at the DNS side.**

```bash rail=exec-client-cat
kubectl exec client -- cat /etc/resolv.conf
kubectl exec client -- nslookup web.k8s-from-zero.svc.cluster.local
kubectl exec client -- wget -qO- -T 3 http://web.k8s-from-zero
kubectl get svc -n kube-system kube-dns
```

```text
search k8s-from-zero.svc.cluster.local svc.cluster.local cluster.local
nameserver 10.96.0.10
options ndots:5
Server:		10.96.0.10
Address:	10.96.0.10:53

Name:	web.k8s-from-zero.svc.cluster.local
Address: 10.96.120.171

hello from web-9684f4454-qds9w
NAME       TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)                  AGE
kube-dns   ClusterIP   10.96.0.10   <none>        53/UDP,53/TCP,9153/TCP   75s
```

The name server in every Pod is itself a Service, `kube-dns` in `kube-system`, in front of the CoreDNS Pods.

6. **Replace every Pod and keep the address.**

```bash rail=delete-pod-get
kubectl delete pod -l app.kubernetes.io/name=web --wait=false
kubectl get pods -l app.kubernetes.io/name=web -o wide
kubectl get service web
kubectl exec client -- wget -qO- -T 3 http://web
```

```text
pod "web-9684f4454-fjk67" deleted from k8s-from-zero namespace
pod "web-9684f4454-lqswh" deleted from k8s-from-zero namespace
pod "web-9684f4454-qds9w" deleted from k8s-from-zero namespace
NAME                  READY   STATUS        RESTARTS   AGE   IP            ...
web-9684f4454-88996   1/1     Running       0          6s    10.244.0.15   ...
web-9684f4454-fjk67   1/1     Terminating   0          17s   10.244.0.11   ...
web-9684f4454-jdpwg   1/1     Running       0          6s    10.244.0.13   ...
web-9684f4454-lqswh   1/1     Terminating   0          17s   10.244.0.12   ...
web-9684f4454-qds9w   1/1     Terminating   0          17s   10.244.0.9    ...
web-9684f4454-rgwjl   1/1     Running       0          6s    10.244.0.14   ...
NAME   TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
web    ClusterIP   10.96.120.171   <none>        80/TCP    16s
hello from web-9684f4454-88996
```

New Pods, new IPs, same Service IP, and the call still works. The old Pods sit in `Terminating` for up to 30 seconds because the shell that starts the busybox web server runs as process 1 and ignores the stop signal, so Kubernetes waits out the grace period; part 10 explains graceful shutdown.

7. **Scale and watch the slice follow.**

```bash rail=scale-deployment-web
kubectl scale deployment web --replicas=1
kubectl get endpointslices -l kubernetes.io/service-name=web
kubectl scale deployment web --replicas=3
kubectl get endpointslices -l kubernetes.io/service-name=web
```

```text
deployment.apps/web scaled
NAME        ADDRESSTYPE   PORTS   ENDPOINTS     AGE
web-q5pmn   IPv4          8080    10.244.0.15   2m5s
deployment.apps/web scaled
NAME        ADDRESSTYPE   PORTS   ENDPOINTS                             AGE
web-q5pmn   IPv4          8080    10.244.0.15,10.244.0.19,10.244.0.18   2m5s
```

(We waited for the old Pods to finish terminating before the first `get`.) To see the `ready` flag and which Pod each endpoint is, read the slice with JSONPath (part 5):

```bash rail=get-endpointslice
kubectl get endpointslice -l kubernetes.io/service-name=web -o jsonpath='{range .items[0].endpoints[*]}{.addresses[0]}{"  ready="}{.conditions.ready}{"  pod="}{.targetRef.name}{"\n"}{end}'
```

```text
10.244.0.15  ready=true  pod=web-9684f4454-88996
10.244.0.19  ready=true  pod=web-9684f4454-rq74b
10.244.0.18  ready=true  pod=web-9684f4454-xh9g9
```

8. **Open a NodePort.** Save as `web-nodeport.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-nodeport
  namespace: k8s-from-zero
spec:
  type: NodePort
  selector:
    app.kubernetes.io/name: web
  ports:
    - name: http
      port: 80
      targetPort: http
      nodePort: 30080   # leave this out to get a random port from the range
```

```bash rail=apply-web-nodeport-yaml-get
kubectl apply -f web-nodeport.yaml
kubectl get service web-nodeport
NODE_IP=$(kubectl get node k8s-ep07-control-plane -o jsonpath="{.status.addresses[0].address}")
echo $NODE_IP
for i in 1 2 3; do curl -s -m 5 http://$NODE_IP:30080; done
```

```text
service/web-nodeport created
NAME           TYPE       CLUSTER-IP    EXTERNAL-IP   PORT(S)        AGE
web-nodeport   NodePort   10.96.68.20   <none>        80:30080/TCP   0s
172.18.0.3
hello from web-9684f4454-v4dcb
hello from web-9684f4454-88996
hello from web-9684f4454-fggfn
```

Use your own node name (`kubectl get nodes`). The kind node is a Docker container (part 3), so its IP is reachable from a Linux host. On Docker Desktop for Mac or Windows it is not; use step 12's `port-forward` there, or kind's `extraPortMappings` setting when you create the cluster.

9. **Ask for a LoadBalancer.** Save `web-lb.yaml` as a copy of the NodePort file with `name: web-lb`, `type: LoadBalancer` and no `nodePort` line:

```bash rail=apply-web-lb-yaml-get
kubectl apply -f web-lb.yaml
kubectl get service web-lb
```

```text
service/web-lb created
NAME     TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE
web-lb   LoadBalancer   10.96.50.128   <pending>     80:30471/TCP   5s
```

`<pending>` is the expected answer on kind: nothing in the cluster creates load balancers. Note that a NodePort (30471) was still assigned. The Service already works as a NodePort and a ClusterIP; only the outside piece is missing.

10. **Go headless.** Save as `web-headless.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-headless
  namespace: k8s-from-zero
spec:
  clusterIP: None
  selector:
    app.kubernetes.io/name: web
  ports:
    - name: http
      port: 8080
      targetPort: http
```

```bash rail=apply-web-headless-yaml-get
kubectl apply -f web-headless.yaml
kubectl get service web-headless
kubectl exec client -- nslookup web-headless.k8s-from-zero.svc.cluster.local
```

```text
service/web-headless created
NAME           TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)    AGE
web-headless   ClusterIP   None         <none>        8080/TCP   0s
Server:		10.96.0.10
Address:	10.96.0.10:53

Name:	web-headless.k8s-from-zero.svc.cluster.local
Address: 10.244.0.15
Name:	web-headless.k8s-from-zero.svc.cluster.local
Address: 10.244.0.16
Name:	web-headless.k8s-from-zero.svc.cluster.local
Address: 10.244.0.17
```

No cluster IP; the name returns the three Pod IPs. Use the full name with busybox `nslookup`; with a short name it also prints a line for every search domain it tried.

11. **Point a name outside the cluster.** Save as `docs-external.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: docs
  namespace: k8s-from-zero
spec:
  type: ExternalName
  externalName: kubernetes.io
```

```bash rail=apply-docs-external-yaml-get
kubectl apply -f docs-external.yaml
kubectl get service docs
kubectl exec client -- nslookup -type=CNAME docs.k8s-from-zero.svc.cluster.local
```

```text
service/docs created
NAME   TYPE           CLUSTER-IP   EXTERNAL-IP     PORT(S)   AGE
docs   ExternalName   <none>       kubernetes.io   <none>    0s
Server:		10.96.0.10
Address:	10.96.0.10:53

docs.k8s-from-zero.svc.cluster.local	canonical name = kubernetes.io
```

The answer is only a DNS alias. Our lab cluster has no internet access, so we stopped at the CNAME; on your machine, `wget` to `docs` would then resolve `kubernetes.io` normally (and the remote web server would see the wrong `Host` header, a common ExternalName surprise for HTTP).

12. **Compare with port-forward.** `kubectl port-forward` (part 4) also accepts a Service:

```bash rail=port-forward-service-web-8080-80
kubectl port-forward service/web 8080:80
```

In a second terminal:

```bash rail=curl-http-127-0-0-1-8080-curl
curl -s http://127.0.0.1:8080; curl -s http://127.0.0.1:8080; curl -s http://127.0.0.1:8080
```

```text
hello from web-9684f4454-88996
hello from web-9684f4454-88996
hello from web-9684f4454-88996
```

The same Pod every time. The [port-forward reference](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_port-forward/) explains why: kubectl picks one matching Pod and tunnels to it, and the session ends when that Pod goes away. Port-forward is a debugging tunnel from your laptop. A Service is how real traffic finds Pods. Press Ctrl+C to stop it.

13. **Clean up.**

```bash rail=delete-docs-external-yaml-web-headless-y
kubectl delete -f docs-external.yaml -f web-headless.yaml -f web-lb.yaml -f web-nodeport.yaml -f web-svc.yaml -f web.yaml -f client.yaml
```

## When it goes wrong

- **The Service has no endpoints.** Symptom: `wget: can't connect to remote host (10.96.66.176): Connection refused`, and `kubectl describe service` shows an empty `Endpoints:` line. We caused it with a selector typo, `app.kubernetes.io/name: wbe`. Compare `kubectl get svc <name> -o wide` (SELECTOR column) with `kubectl get pods --show-labels`, and fix the selector.
- **Endpoints exist, but connections fail.** Symptom: the same `Connection refused`, while `kubectl get endpointslices` lists Pod IPs. Look at the PORTS column: we exposed the Deployment with `--target-port=9999` and the slice showed `9999`, a port nothing listens on. Use a named port (`targetPort: http`) so the Service follows the container.
- **The name does not resolve.** Symptom: `wget: bad address 'web'`. Either the Service is in another namespace (use `web.<namespace>`), or cluster DNS is down: check `kubectl get pods -n kube-system -l k8s-app=kube-dns`. We hit the second case on our lab box: in its default iptables mode, kube-proxy could not program its rules on this machine's kernel (`kubectl logs -n kube-system -l k8s-app=kube-proxy` showed `Failed to execute iptables-restore`), so the `kube-dns` Service did not answer either. We recreated the cluster with kube-proxy in nftables mode (`networking.kubeProxyMode: "nftables"` in the kind config) and every step here then worked. On a usual Linux, Mac or Windows machine the default works.
- **The LoadBalancer stays pending.** Symptom: `EXTERNAL-IP <pending>`. Nothing in the cluster provisions load balancers. On kind, use NodePort or port-forward; on a cloud cluster, check the cloud controller's events with `kubectl describe service`.
- **Pods that are not ready get no traffic.** Symptom: fewer endpoints than Pods. Only ready Pods are used; part 10 shows how readiness probes control this.

## Cheat sheet

| Task | Command or field | Note |
|---|---|---|
| Expose a Deployment quickly | `kubectl expose deployment web --port=80 --target-port=8080` | writes a ClusterIP Service |
| List Services | `kubectl get svc -o wide` | `-o wide` adds SELECTOR |
| See backends | `kubectl get endpointslices -l kubernetes.io/service-name=web` | backend Pod IPs; each has a ready condition |
| Explain a Service | `kubectl describe service web` | Selector, TargetPort, Endpoints |
| Default type | `type: ClusterIP` | inside the cluster only |
| Open on every node | `type: NodePort`, `nodePort: 30080` | range 30000-32767 |
| Ask the cloud for an LB | `type: LoadBalancer` | `<pending>` on kind |
| DNS alias to outside | `type: ExternalName`, `externalName: kubernetes.io` | CNAME only, no proxy |
| Pod IPs in DNS | `clusterIP: None` | headless |
| Map ports | `port: 80`, `targetPort: http` | named ports follow the container |
| Same-namespace name | `http://web` | search list in resolv.conf |
| Cross-namespace name | `http://web.k8s-from-zero` | full: `.svc.cluster.local` |
| Test from inside | `kubectl exec client -- wget -qO- -T 3 http://web` | busybox client Pod |
| Debug from your laptop | `kubectl port-forward service/web 8080:80` | one Pod, not load balanced |

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web
  namespace: k8s-from-zero
spec:
  selector:
    app.kubernetes.io/name: web
  ports:
    - name: http
      port: 80
      targetPort: http
```

## Recap and what is next

- A Service gives a changing set of Pods one stable virtual IP and DNS name; its label selector picks the Pods.
- EndpointSlices hold the backend Pod IPs with a ready condition on each, and kube-proxy sends each connection to a ready one.
- ClusterIP is for inside traffic; NodePort and LoadBalancer add ways in from outside; ExternalName and headless Services change what DNS returns.
- Use `<service>.<namespace>` across namespaces, and check endpoints first when a Service does not answer.

Next: Kubernetes from Zero, part 9, ConfigMaps and Secrets, coming tomorrow.

*Command explanations and quoted passages in this lesson come from or adapt the [kubectl reference](https://kubernetes.io/docs/reference/kubectl/) and the [Kubernetes documentation](https://kubernetes.io/docs/), © The Kubernetes Authors, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). We shortened and edited some passages. Kubernetes® is a registered trademark of The Linux Foundation. aitamer.news is not affiliated with or endorsed by The Linux Foundation or the CNCF.*

```rail
id: "apply-web-yaml-client-yaml"
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
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "client.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "rollout"
        text: "The command group for rollout actions."
      - token: "status"
        text: "Show the status of a rollout and wait until it finishes."
      - token: "deployment/web"
        text: "The resource written as type/name: deployment/web."
      - token: "--timeout=90s"
        text: "How long to wait before giving up. This command passes 90s."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "wide"
        text: "An output format. The get examples say wide adds more information, such as the node name. For Pods the lesson's table adds IP, NODE, NOMINATED NODE and READINESS GATES."
```

```rail
id: "exec-client-wget"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "client"
        text: "The test Pod named client. The lesson uses it to call the web Pods."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "wget"
        text: "The command run in the container. It fetches a URL."
      - token: "-qO-"
        text: "A flag of the command inside the container: -qO-."
      - token: "-T"
        text: "A flag of the command inside the container: -T."
      - token: "3"
        text: "A number passed to the command inside the container."
      - token: "http://10.244.0.11:8080"
        text: "The URL requested inside the container: http://10.244.0.11:8080."
```

```rail
id: "apply-web-svc-yaml-get"
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
      - token: "web-svc.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "service"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "web"
        text: "The object name."
```

```rail
id: "describe-service-web"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "describe"
        text: "Show details of a specific resource or group of resources. The describe docs say this includes related resources such as events or controllers."
      - token: "service"
        text: "The resource type."
      - token: "web"
        text: "The object name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "endpointslices"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "kubernetes.io/service-name=web"
        text: "The label query passed to --selector: kubernetes.io/service-name=web."
```

```rail
id: "for-i-in"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "for"
        text: "Shell. Starts a for loop."
      - token: "i"
        text: "The loop variable for the six calls to http://web. The lesson shows all three web Pods answering."
      - token: "in"
        text: "Shell. Names the list a for loop walks."
      - token: "1"
        text: "A numeric argument in this command."
      - token: "2"
        text: "A numeric argument in this command."
      - token: "3"
        text: "A numeric argument in this command."
      - token: "4"
        text: "A numeric argument in this command."
      - token: "5"
        text: "A numeric argument in this command."
      - token: "6"
        text: "A numeric argument in this command."
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "do"
        text: "Shell. Starts the body of a for, while or if."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "client"
        text: "The test Pod named client. The lesson uses it to call the web Pods."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "wget"
        text: "The command run in the container. It fetches a URL."
      - token: "-qO-"
        text: "A flag of the command inside the container: -qO-."
      - token: "-T"
        text: "A flag of the command inside the container: -T."
      - token: "3"
        text: "A number passed to the command inside the container."
      - token: "http://web"
        text: "The URL requested inside the container: http://web."
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "done"
        text: "Shell. Ends a for, while or until loop."
```

```rail
id: "exec-client-cat"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "client"
        text: "The test Pod named client. The lesson uses it to call the web Pods."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "cat"
        text: "Shell. Writes the named files to standard output."
      - token: "/etc/resolv.conf"
        text: "A path inside the container: /etc/resolv.conf."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "client"
        text: "The test Pod named client. The lesson uses it to call the web Pods."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "nslookup"
        text: "The command run in the container. It looks up a DNS name."
      - token: "web.k8s-from-zero.svc.cluster.local"
        text: "An argument of the command inside the container: web.k8s-from-zero.svc.cluster.local."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "client"
        text: "The test Pod named client. The lesson uses it to call the web Pods."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "wget"
        text: "The command run in the container. It fetches a URL."
      - token: "-qO-"
        text: "A flag of the command inside the container: -qO-."
      - token: "-T"
        text: "A flag of the command inside the container: -T."
      - token: "3"
        text: "A number passed to the command inside the container."
      - token: "http://web.k8s-from-zero"
        text: "The URL requested inside the container: http://web.k8s-from-zero."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "svc"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "kube-system"
        text: "The namespace name passed to --namespace."
      - token: "kube-dns"
        text: "The cluster DNS Service in kube-system. The lesson's resolv.conf nameserver is its ClusterIP, 10.96.0.10."
```

```rail
id: "delete-pod-get"
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
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "app.kubernetes.io/name=web"
        text: "The label query passed to --selector: app.kubernetes.io/name=web."
      - token: "--wait=false"
        text: "Do not wait for the objects to finish deleting. The delete docs say --wait defaults to true."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "app.kubernetes.io/name=web"
        text: "The label query passed to --selector: app.kubernetes.io/name=web."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "wide"
        text: "An output format. The get examples say wide adds more information, such as the node name. For Pods the lesson's table adds IP, NODE, NOMINATED NODE and READINESS GATES."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "service"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "web"
        text: "The object name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "client"
        text: "The test Pod named client. The lesson uses it to call the web Pods."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "wget"
        text: "The command run in the container. It fetches a URL."
      - token: "-qO-"
        text: "A flag of the command inside the container: -qO-."
      - token: "-T"
        text: "A flag of the command inside the container: -T."
      - token: "3"
        text: "A number passed to the command inside the container."
      - token: "http://web"
        text: "The URL requested inside the container: http://web."
```

```rail
id: "scale-deployment-web"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "scale"
        text: "Set a new size for a deployment, replica set, replication controller, or stateful set."
      - token: "deployment"
        text: "The resource type."
      - token: "web"
        text: "The object name."
      - token: "--replicas=1"
        text: "The number of desired replicas. This command passes 1."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "endpointslices"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "kubernetes.io/service-name=web"
        text: "The label query passed to --selector: kubernetes.io/service-name=web."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "scale"
        text: "Set a new size for a deployment, replica set, replication controller, or stateful set."
      - token: "deployment"
        text: "The resource type."
      - token: "web"
        text: "The object name."
      - token: "--replicas=3"
        text: "The number of desired replicas. This command passes 3."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "endpointslices"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "kubernetes.io/service-name=web"
        text: "The label query passed to --selector: kubernetes.io/service-name=web."
```

```rail
id: "get-endpointslice"
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
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "kubernetes.io/service-name=web"
        text: "The label query passed to --selector: kubernetes.io/service-name=web."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{range .items[0].endpoints[*]}{.addresses[0]}{\"  ready=\"}{.conditions.ready}{\"  pod=\"}{.targetRef.name}{\"\\n\"}{end}'"
        text: "jsonpath is an output format. A template is JSONPath expressions in curly braces. The JSONPath page says a double-quoted string inserts text, and its example uses a quoted backslash-n for a newline. This token is the template in the lesson command."
```

```rail
id: "apply-web-nodeport-yaml-get"
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
      - token: "web-nodeport.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "service"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "web-nodeport"
        text: "The object name."
      - token: "NODE_IP=$(kubectl get node k8s-ep07-control-plane -o jsonpath=\"{.status.addresses[0].address}\")"
        text: "A shell variable assignment on its own line. It stores the node's first address, read by the jsonpath, and the next lines use it as $NODE_IP."
      - token: "echo"
        text: "Shell. Writes its arguments to standard output, then a newline."
      - token: "$NODE_IP"
        text: "The kind node address stored on the previous line. The lesson prints it, then curls port 30080 on it."
      - token: "for"
        text: "Shell. Starts a for loop."
      - token: "i"
        text: "The loop variable for the three curls to the NodePort on port 30080."
      - token: "in"
        text: "Shell. Names the list a for loop walks."
      - token: "1"
        text: "A numeric argument in this command."
      - token: "2"
        text: "A numeric argument in this command."
      - token: "3"
        text: "A numeric argument in this command."
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "do"
        text: "Shell. Starts the body of a for, while or if."
      - token: "curl"
        text: "The curl client."
      - token: "-s"
        text: "The -s flag on the curl to the NodePort. The lesson prints three hello lines from the web Pods."
      - token: "-m"
        text: "The -m flag on that curl, passed 5, in the loop that calls the NodePort."
      - token: "5"
        text: "A numeric argument in this command."
      - token: "http://$NODE_IP:30080"
        text: "The NodePort address. web-nodeport.yaml sets nodePort 30080, and the lesson curls it on the kind node IP."
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "done"
        text: "Shell. Ends a for, while or until loop."
```

```rail
id: "apply-web-lb-yaml-get"
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
      - token: "web-lb.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "service"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "web-lb"
        text: "The object name."
```

```rail
id: "apply-web-headless-yaml-get"
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
      - token: "web-headless.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "service"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "web-headless"
        text: "The object name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "client"
        text: "The test Pod named client. The lesson uses it to call the web Pods."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "nslookup"
        text: "The command run in the container. It looks up a DNS name."
      - token: "web-headless.k8s-from-zero.svc.cluster.local"
        text: "An argument of the command inside the container: web-headless.k8s-from-zero.svc.cluster.local."
```

```rail
id: "apply-docs-external-yaml-get"
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
      - token: "docs-external.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "service"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "docs"
        text: "The object name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "client"
        text: "The test Pod named client. The lesson uses it to call the web Pods."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "nslookup"
        text: "The command run in the container. It looks up a DNS name."
      - token: "-type=CNAME"
        text: "A flag of the command inside the container: -type=CNAME."
      - token: "docs.k8s-from-zero.svc.cluster.local"
        text: "An argument of the command inside the container: docs.k8s-from-zero.svc.cluster.local."
```

```rail
id: "port-forward-service-web-8080-80"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "port-forward"
        text: "Forward one or more local ports to a pod."
      - token: "service/web"
        text: "The resource written as type/name: service/web."
      - token: "8080:80"
        text: "Local port 8080 forwarded to Service port 80. The next command curls 127.0.0.1:8080."
```

```rail
id: "curl-http-127-0-0-1-8080-curl"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "curl"
        text: "The curl client."
      - token: "-s"
        text: "Short form of --silent. curl hides the progress meter."
      - token: "http://127.0.0.1:8080"
        text: "The local URL of the port-forward. The lesson's three curls all get a reply from the same Pod."
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "curl"
        text: "The curl client."
      - token: "-s"
        text: "Short form of --silent. curl hides the progress meter."
      - token: "http://127.0.0.1:8080"
        text: "The local URL of the port-forward. The lesson's three curls all get a reply from the same Pod."
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "curl"
        text: "The curl client."
      - token: "-s"
        text: "Short form of --silent. curl hides the progress meter."
      - token: "http://127.0.0.1:8080"
        text: "The local URL of the port-forward. The lesson's three curls all get a reply from the same Pod."
```

```rail
id: "delete-docs-external-yaml-web-headless-y"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete."
      - token: "docs-external.yaml"
        text: "The file named by --filename. delete removes the resources that file describes."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete."
      - token: "web-headless.yaml"
        text: "The file named by --filename. delete removes the resources that file describes."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete."
      - token: "web-lb.yaml"
        text: "The file named by --filename. delete removes the resources that file describes."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete."
      - token: "web-nodeport.yaml"
        text: "The file named by --filename. delete removes the resources that file describes."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete."
      - token: "web-svc.yaml"
        text: "The file named by --filename. delete removes the resources that file describes."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete."
      - token: "web.yaml"
        text: "The file named by --filename. delete removes the resources that file describes."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete."
      - token: "client.yaml"
        text: "The file named by --filename. delete removes the resources that file describes."
```
