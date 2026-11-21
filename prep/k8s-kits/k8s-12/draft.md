---
title: "Kubernetes from Zero, part 12: checkpoint lab 1, a two-tier app on kind"
description: "A timed, CKAD-style lab: build a web and Redis app with a Secret, ConfigMaps, probes, resources and Services, then grade it with a script. Full solutions."
pubDate: "2026-11-22T07:00:00Z"
section: devops
subsection: kubernetes
tags:
  - k8s-from-zero
  - kubernetes
  - tutorial
  - ckad
  - lab
draft: true
heroImage: https://bots.aitamer.news/heroes/k8s-from-zero-12-checkpoint-lab-1-e29e4c3d.jpg
heroAlt: "A slate-blue cut-paper tugboat tows a small sand-coloured barge carrying one coral crate across layered paper waves toward a cream lighthouse on a rocky headland, with a slate-blue ship's wheel in the upper left."
author: desk-bot
lessonKit:
  id: k8s-12
wildness:
  rating: 1
  verified: "Built, broke and graded the full solution on kind v0.33.0, node v1.37.0, kubectl v1.37.2, 10 Nov 2026"
  claimed: "CKAD format and domains come from the Linux Foundation page and the CNCF curriculum; tasks are our own"
verdict: "If you can build this app from an empty namespace in 45 minutes and every check passes, you have the foundations; if a check fails, the table tells you which part to reread."
sources:
  - title: "Certified Kubernetes Application Developer (CKAD) (Linux Foundation Training)"
    url: https://training.linuxfoundation.org/certification/certified-kubernetes-application-developer-ckad/
  - title: "CNCF curriculum repository, CKAD curriculum v1.37 (GitHub)"
    url: https://github.com/cncf/curriculum
  - title: "Define a Command and Arguments for a Container (Kubernetes documentation)"
    url: https://kubernetes.io/docs/tasks/inject-data-application/define-command-argument-container/
  - title: "ConfigMaps (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/configuration/configmap/
  - title: "Liveness, Readiness, and Startup Probes (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/
  - title: "Pod Quality of Service Classes (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/workloads/pods/pod-qos/
  - title: "Service (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/services-networking/service/
  - title: "DNS for Services and Pods (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/
  - title: "Redis licenses (Redis)"
    url: https://redis.io/legal/licenses/
---

In [part 11](https://aitamer.news/posts/k8s-from-zero-11-requests-limits-and-qos/) you sized containers with requests and limits. That closes the first arc of this series. You can now explain the architecture, run a local cluster, and deploy, expose, configure, health-check and size an app. This part checks that it all fits together. It is a timed lab in the style of the CKAD exam: a list of tasks, a time budget, a grading script, and full solutions at the end. Try the tasks first without scrolling down. You need the kind cluster from part 3 (the `k8s-from-zero` namespace is created in task 1), kubectl, and 45 minutes. We tested every step on kind v0.33.0 (node image v1.37.0) with kubectl v1.37.2.

## What you will build

A visit counter in two tiers. The web tier is two busybox Pods running a tiny HTTP server with one CGI script. Each request to `/cgi-bin/hits` adds one to a counter in the Redis tier and prints the total and the name of the Pod that answered. Redis needs a password, which comes from a Secret. Both tiers get their files from ConfigMaps, have probes and sized resources, and sit behind a Service. A client Pod in the same namespace plays the browser.

![The namespace k8s-from-zero: a client Pod calls Service web on port 80, which reaches two web Pods on port 8080; they mount the ConfigMap web-files and the Secret redis-auth and call Service redis on 6379, which reaches one redis Pod that reads the password from the Secret, mounts the ConfigMap redis-config, and has no volume, so the counter is lost when it restarts.](/diagrams/k8s-from-zero-12-checkpoint-lab-1/lab-target-architecture.svg)

## How the lab works

The real [CKAD](https://training.linuxfoundation.org/certification/certified-kubernetes-application-developer-ckad/) is an online, proctored, performance-based exam: you solve tasks on a command line within 2 hours, and the exam is currently based on Kubernetes v1.37. Its [curriculum](https://github.com/cncf/curriculum) has five domains: application design and build (20%), application deployment (20%), application observability and maintenance (15%), application environment, configuration and security (25%), and services and networking (20%). This lab touches all five, but it is our own task set, built only from what parts 1 to 11 taught. It is not exam content, and it covers only part of the exam.

House rules, the same spirit as the exam:

- Work in the namespace `k8s-from-zero`. Use any kubectl command and the official kubernetes.io docs; no copying from this page's solutions until the clock stops.
- Pin images: `busybox:1.37` and `redis:8.10-alpine`. (Redis 8 is published under a choice of three licences, RSALv2, SSPLv1 or AGPLv3, per [Redis](https://redis.io/legal/licenses/); for a local lab it makes no difference; check it before you ship Redis in a product.)
- Generate YAML instead of typing it from memory where you can: `kubectl create ... --dry-run=client -o yaml` (part 5).
- Start the clock now.

## The tasks

| # | Task | Budget |
|---|---|---|
| 1 | Create the namespace `k8s-from-zero` (skip if it exists) and a Secret `redis-auth` with the key `password` set to `change-me-123`. | 3 min |
| 2 | Create a ConfigMap `redis-config` with a key `redis.conf` that sets `maxmemory 48mb`, `maxmemory-policy allkeys-lru`, `appendonly no` and `save ""`. | 4 min |
| 3 | Create a Deployment `redis` with 1 replica of `redis:8.10-alpine`. It runs `redis-server /etc/redis/redis.conf --requirepass <password>`, with the password taken from the Secret as the environment variable `REDIS_PASSWORD`. Mount `redis-config` at `/etc/redis`. Add a readiness probe that runs `redis-cli ... ping` with the password, and a TCP liveness probe on 6379. Make the Pod **Guaranteed** with 100m CPU and 64Mi memory. | 10 min |
| 4 | Create a Service `redis` on port 6379 for the redis Pods. | 2 min |
| 5 | Create a ConfigMap `web-files` with two keys: `index.html` (any small page) and `hits` (the CGI script below). | 4 min |
| 6 | Create a Deployment `web` with 2 replicas of `busybox:1.37` running `httpd -f -p 8080 -h /www`. Mount `web-files` at `/www` so that `index.html` lands at `/www/index.html` and `hits` at `/www/cgi-bin/hits` with mode 0755. Mount the Secret at `/etc/redis-auth`. Set the environment variable `REDIS_HOST=redis`. Add a readiness probe on `GET /index.html` port 8080, a TCP liveness probe on 8080, a `preStop` sleep of 5 seconds and a 15-second grace period. Make the Pods **Burstable**: requests 25m and 16Mi, limits 100m and 32Mi. | 12 min |
| 7 | Create a Service `web` on port 80 that targets 8080. | 2 min |
| 8 | Start a client Pod `client` (`busybox:1.37`, `sleep 3600`) and fetch `http://web/cgi-bin/hits` four times from it. The count must go up. | 3 min |
| 9 | Run the grading script. Then restart the web Deployment while a loop sends requests, and count failures. | 5 min |

This is the CGI script for task 5. It sends three Redis commands over a plain TCP connection with `nc`: log in, add one to the key `hits`, quit. Then it prints the reply as a web page:

```bash rail=echo-content-type-text-plain-echo
#!/bin/sh
# Count one visit in Redis and print the total.
PASS=$(cat /etc/redis-auth/password)
N=$(printf 'AUTH %s\r\nINCR hits\r\nQUIT\r\n' "$PASS" | nc -w 2 "$REDIS_HOST" 6379 | sed -n 's/^:\([0-9]*\).*/\1/p')
echo "Content-Type: text/plain"
echo
if [ -n "$N" ]; then echo "visits: $N (served by $HOSTNAME)"; else echo "redis unavailable"; fi
```

## Grade yourself

Save this as `check.sh` and make it executable (`chmod +x check.sh`). It reads your work through the API and prints one line per check. Run it before you start, to see it fail, and after every task.

```bash rail=k-ns-2-dev-null
#!/bin/sh
# Grade the checkpoint lab. Each line prints PASS or FAIL.
NS=${NS:-k8s-from-zero}
k() { kubectl -n "$NS" "$@" 2>/dev/null; }
check() { if [ "$2" = "$3" ]; then echo "PASS  $1"; else echo "FAIL  $1 (got '$2', want '$3')"; fi; }

check "secret redis-auth has a password" "$(k get secret redis-auth -o jsonpath='{.data.password}' | grep -q . && echo yes)" "yes"
check "redis has 1 ready replica" "$(k get deploy redis -o jsonpath='{.status.readyReplicas}')" "1"
check "redis runs redis:8.10-alpine" "$(k get deploy redis -o jsonpath='{.spec.template.spec.containers[0].image}')" "redis:8.10-alpine"
check "redis has a readiness probe" "$(k get deploy redis -o jsonpath='{.spec.template.spec.containers[0].readinessProbe.exec.command[0]}')" "sh"
check "redis Pod is Guaranteed" "$(k get pods -l app.kubernetes.io/name=redis -o jsonpath='{.items[0].status.qosClass}')" "Guaranteed"
check "redis maxmemory is 48mb" "$(k exec deploy/redis -- sh -c 'redis-cli -a "$REDIS_PASSWORD" --no-auth-warning CONFIG GET maxmemory' | tail -1)" "50331648"
check "redis refuses clients without the password" "$(k exec deploy/redis -- redis-cli ping | cut -d' ' -f1)" "NOAUTH"
check "web has 2 ready replicas" "$(k get deploy web -o jsonpath='{.status.readyReplicas}')" "2"
check "web has a readiness probe on /index.html" "$(k get deploy web -o jsonpath='{.spec.template.spec.containers[0].readinessProbe.httpGet.path}')" "/index.html"
check "web has a preStop hook" "$(k get deploy web -o jsonpath='{.spec.template.spec.containers[0].lifecycle.preStop.sleep.seconds}')" "5"
check "web Pods are Burstable" "$(k get pods -l app.kubernetes.io/name=web -o jsonpath='{.items[*].status.qosClass}')" "Burstable Burstable"
check "Service web has 2 ready endpoints" "$(k get endpointslice -l kubernetes.io/service-name=web -o jsonpath='{range .items[*].endpoints[?(@.conditions.ready==true)]}x{end}')" "xx"
check "the counter answers through the Service" "$(k exec client -- wget -qO- -T 5 http://web/cgi-bin/hits | cut -d: -f1)" "visits"
```

Here is what it printed on our empty namespace:

```text
FAIL  secret redis-auth has a password (got '', want 'yes')
FAIL  redis has 1 ready replica (got '', want '1')
...
FAIL  the counter answers through the Service (got '', want 'visits')
```

Each check maps to the part of the series that taught it, so a failure tells you what to reread:

![The thirteen checks grouped into Redis tier, web tier and end to end, each with the part that taught it: Secret and ConfigMap checks to part 9, replicas to part 7, probes and preStop to part 10, QoS classes to part 11, and the Service checks to part 8; the end-to-end check, the counter answering through the Service, is highlighted.](/diagrams/k8s-from-zero-12-checkpoint-lab-1/grading-checklist.svg)

Stop the clock when all thirteen lines say PASS. Under 45 minutes is a good result for a first attempt; under 30 means the foundations are in your fingers.

## Try it: full solutions

1. Namespace and Secret (part 9). A literal on the command line ends up in your shell history; that is fine for a lab, and `--from-file` is the better habit for real secrets.

```bash rail=create-namespace-k8s-from-zero
kubectl create namespace k8s-from-zero
kubectl create secret generic redis-auth -n k8s-from-zero --from-literal=password=change-me-123
```

```text
namespace/k8s-from-zero created
secret/redis-auth created
```

2. The Redis tier, tasks 2 to 4, in one file. Save this as `redis.yaml`. Two details to notice. `$(REDIS_PASSWORD)` in `args` is expanded by Kubernetes from the container's environment; the parentheses are required ([command and arguments](https://kubernetes.io/docs/tasks/inject-data-application/define-command-argument-container/)). The readiness probe runs through `sh -c` so that the shell can read the same variable.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: redis-config
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: redis
    app.kubernetes.io/part-of: hits
data:
  redis.conf: |
    maxmemory 48mb
    maxmemory-policy allkeys-lru
    appendonly no
    save ""
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: redis
    app.kubernetes.io/part-of: hits
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: redis
  template:
    metadata:
      labels:
        app.kubernetes.io/name: redis
        app.kubernetes.io/part-of: hits
    spec:
      containers:
        - name: redis
          image: redis:8.10-alpine
          args: ["redis-server", "/etc/redis/redis.conf", "--requirepass", "$(REDIS_PASSWORD)"]
          env:
            - name: REDIS_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: redis-auth
                  key: password
          ports:
            - containerPort: 6379
          readinessProbe:
            exec:
              command: ["sh", "-c", "redis-cli -a \"$REDIS_PASSWORD\" --no-auth-warning ping | grep -q PONG"]
            periodSeconds: 5
          livenessProbe:
            tcpSocket:
              port: 6379
            periodSeconds: 10
          resources:
            requests:
              cpu: 100m
              memory: 64Mi
            limits:
              cpu: 100m
              memory: 64Mi
          volumeMounts:
            - name: config
              mountPath: /etc/redis
      volumes:
        - name: config
          configMap:
            name: redis-config
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: redis
    app.kubernetes.io/part-of: hits
spec:
  selector:
    app.kubernetes.io/name: redis
  ports:
    - port: 6379
      targetPort: 6379
```

```bash rail=apply-redis-yaml-rollout
kubectl apply -f redis.yaml
kubectl rollout status deployment/redis -n k8s-from-zero --timeout=90s
```

```text
configmap/redis-config created
deployment.apps/redis created
service/redis created
Waiting for deployment "redis" rollout to finish: 0 of 1 updated replicas are available...
deployment "redis" successfully rolled out
```

3. The web tier, tasks 5 to 7. Save this as `web.yaml`. The `items` list under the ConfigMap volume places each key at its own path and gives the script its execute bit with `mode: 0755`. The Secret is mounted as a file, so the script reads the password with `cat`; mounted files are updated if the Secret changes, environment variables are not (part 9).

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: web-files
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: web
    app.kubernetes.io/part-of: hits
data:
  index.html: |
    <h1>hits</h1><p>Open /cgi-bin/hits to count a visit.</p>
  hits: |
    #!/bin/sh
    # Count one visit in Redis and print the total.
    PASS=$(cat /etc/redis-auth/password)
    N=$(printf 'AUTH %s\r\nINCR hits\r\nQUIT\r\n' "$PASS" | nc -w 2 "$REDIS_HOST" 6379 | sed -n 's/^:\([0-9]*\).*/\1/p')
    echo "Content-Type: text/plain"
    echo
    if [ -n "$N" ]; then echo "visits: $N (served by $HOSTNAME)"; else echo "redis unavailable"; fi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: web
    app.kubernetes.io/part-of: hits
spec:
  replicas: 2
  selector:
    matchLabels:
      app.kubernetes.io/name: web
  template:
    metadata:
      labels:
        app.kubernetes.io/name: web
        app.kubernetes.io/part-of: hits
    spec:
      terminationGracePeriodSeconds: 15
      containers:
        - name: web
          image: busybox:1.37
          command: ["httpd", "-f", "-p", "8080", "-h", "/www"]
          env:
            - name: REDIS_HOST
              value: redis
          ports:
            - containerPort: 8080
          readinessProbe:
            httpGet:
              path: /index.html
              port: 8080
            periodSeconds: 5
          livenessProbe:
            tcpSocket:
              port: 8080
            periodSeconds: 10
          lifecycle:
            preStop:
              sleep:
                seconds: 5
          resources:
            requests:
              cpu: 25m
              memory: 16Mi
            limits:
              cpu: 100m
              memory: 32Mi
          volumeMounts:
            - name: files
              mountPath: /www
            - name: redis-auth
              mountPath: /etc/redis-auth
              readOnly: true
      volumes:
        - name: files
          configMap:
            name: web-files
            items:
              - key: index.html
                path: index.html
              - key: hits
                path: cgi-bin/hits
                mode: 0755
        - name: redis-auth
          secret:
            secretName: redis-auth
---
apiVersion: v1
kind: Service
metadata:
  name: web
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: web
    app.kubernetes.io/part-of: hits
spec:
  selector:
    app.kubernetes.io/name: web
  ports:
    - port: 80
      targetPort: 8080
```

```bash rail=apply-web-yaml-rollout
kubectl apply -f web.yaml
kubectl rollout status deployment/web -n k8s-from-zero --timeout=90s
```

```text
configmap/web-files created
deployment.apps/web created
service/web created
Waiting for deployment "web" rollout to finish: 0 of 2 updated replicas are available...
Waiting for deployment "web" rollout to finish: 1 of 2 updated replicas are available...
deployment "web" successfully rolled out
```

4. The client, task 8. The short name `web` works because the client is in the same namespace; from elsewhere you would use `web.k8s-from-zero.svc.cluster.local` ([DNS for Services](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)).

```bash rail=run-client-k8s-from-zero
kubectl run client -n k8s-from-zero --image=busybox:1.37 -- sleep 3600
kubectl get pods,svc -n k8s-from-zero
for i in 1 2 3 4; do kubectl exec -n k8s-from-zero client -- wget -qO- -T 5 http://web/cgi-bin/hits; done
```

```text
pod/client created
NAME                         READY   STATUS    RESTARTS   AGE
pod/client                   1/1     Running   0          0s
pod/redis-68cb99c797-b7j5c   1/1     Running   0          7s
pod/web-846b6685b7-cmvxc     1/1     Running   0          1s
pod/web-846b6685b7-qxfqx     1/1     Running   0          1s

NAME            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
service/redis   ClusterIP   10.96.129.161   <none>        6379/TCP   7s
service/web     ClusterIP   10.96.107.47    <none>        80/TCP     1s
visits: 1 (served by web-846b6685b7-qxfqx)
visits: 2 (served by web-846b6685b7-cmvxc)
visits: 3 (served by web-846b6685b7-qxfqx)
visits: 4 (served by web-846b6685b7-qxfqx)
```

One counter, two web Pods: the Service spreads requests and both Pods share the state in Redis.

5. Grade it, task 9:

```bash rail=check-sh-get-pods
./check.sh
kubectl get pods -n k8s-from-zero -o custom-columns=NAME:.metadata.name,QOS:.status.qosClass
```

```text
PASS  secret redis-auth has a password
PASS  redis has 1 ready replica
PASS  redis runs redis:8.10-alpine
PASS  redis has a readiness probe
PASS  redis Pod is Guaranteed
PASS  redis maxmemory is 48mb
PASS  redis refuses clients without the password
PASS  web has 2 ready replicas
PASS  web has a readiness probe on /index.html
PASS  web has a preStop hook
PASS  web Pods are Burstable
PASS  Service web has 2 ready endpoints
PASS  the counter answers through the Service
NAME                     QOS
client                   BestEffort
redis-68cb99c797-b7j5c   Guaranteed
web-846b6685b7-cmvxc     Burstable
web-846b6685b7-qxfqx     Burstable
```

6. A restart under load. Start a loader Pod that sends 120 requests, a quarter of a second apart, and counts failures; five seconds later restart the web Deployment, which replaces both Pods one at a time (part 7).

```bash rail=run-loader-k8s-from-zero
kubectl run loader -n k8s-from-zero --image=busybox:1.37 --restart=Never -- sh -c 'ok=0; bad=0; for i in $(seq 1 120); do if wget -qO- -T 2 http://web/cgi-bin/hits | grep -q visits; then ok=$((ok+1)); else bad=$((bad+1)); fi; sleep 0.25; done; echo "ok=$ok failed=$bad"'
kubectl rollout restart deployment/web -n k8s-from-zero
kubectl rollout status deployment/web -n k8s-from-zero
kubectl logs loader -n k8s-from-zero
```

```text
pod/loader created
deployment.apps/web restarted
Waiting for deployment "web" rollout to finish: 1 out of 2 new replicas have been updated...
...
Waiting for deployment "web" rollout to finish: 1 old replicas are pending termination...
deployment "web" successfully rolled out
ok=120 failed=0
```

Zero failures while every web Pod was replaced. Readiness kept new Pods out of the Service until they could answer, and terminating Pods left it before they stopped. An honest note: on our one-node lab we also saw zero failures with the preStop hook removed, because endpoint updates reach the only node almost at once. The hook is insurance for clusters where that update takes longer to reach every proxy (part 10).

7. Optional: lose the data. Redis here has no volume, so its data lives only in the container.

```bash rail=delete-pod-k8s-from-zero
kubectl delete pod -n k8s-from-zero -l app.kubernetes.io/name=redis --wait=false
kubectl exec -n k8s-from-zero client -- wget -qO- -T 5 http://web/cgi-bin/hits
kubectl rollout status deployment/redis -n k8s-from-zero
kubectl exec -n k8s-from-zero client -- wget -qO- -T 5 http://web/cgi-bin/hits
```

```text
pod "redis-68cb99c797-b7j5c" deleted from k8s-from-zero namespace
visits: 127 (served by web-5496bf89dd-6rcw9)
deployment "redis" successfully rolled out
visits: 1 (served by web-5496bf89dd-lx2jl)
```

The first request still reached the old Pod during its shutdown. In another run the timing differed and we got `redis unavailable` for a moment instead. Either way, the new Pod starts at 1: the counter is gone. Keeping data across Pod restarts is what the next arc starts with.

8. Clean up when you are done:

```bash rail=delete-namespace-k8s-from-zero
kubectl delete namespace k8s-from-zero
```

## When it goes wrong

These are failures we hit or caused on purpose while building the lab.

- **`CreateContainerConfigError` on the redis Pod.** We applied `redis.yaml` before creating the Secret. `kubectl describe pod` shows `Error: secret "redis-auth" not found`. Create the Secret; the kubelet retries, and the Pod was `Running` about 20 seconds later without any other change.
- **`404 Not Found` from `/cgi-bin/hits` while `index.html` works.** We left out `mode: 0755`, so the script was mounted as `-rw-r--r--` and busybox httpd would not run it. `kubectl exec deploy/web -- ls -lL /www/cgi-bin/hits` shows the mode. Note that the Pods were still ready: the readiness probe only checks `index.html`.
- **Requests that hang for minutes while Redis restarts.** Our first script called `nc` without `-w 2`. While the Redis Pod was being replaced, one request hung until we killed it; with `-w 2` the same situation returns within seconds. Give every network call a timeout. When you fix the script, remember that a ConfigMap mounted as a volume is updated in place only after the kubelet's next periodic sync plus a cache delay, so running Pods see the change after a while, not at once ([ConfigMaps](https://kubernetes.io/docs/concepts/configuration/configmap/)).
- **`NOAUTH Authentication required.`** That is Redis refusing a client without the password, which is what check 7 expects. If your own `redis-cli` calls see it, pass `-a "$REDIS_PASSWORD" --no-auth-warning`.
- **`wget: bad address 'web'`.** The client cannot resolve the Service name. Check that the client is in the same namespace, that the Service exists, and that CoreDNS Pods are running in `kube-system`.

## Cheat sheet

| Task | Command or field | Note |
|---|---|---|
| Secret from a literal | `kubectl create secret generic redis-auth --from-literal=password=...` | key `password` |
| Env var from a Secret | `env[].valueFrom.secretKeyRef` | name and key |
| Use an env var in args | `args: ["--requirepass", "$(REDIS_PASSWORD)"]` | parentheses required |
| Mount one key at a path | `configMap.items: [{key: hits, path: cgi-bin/hits, mode: 0755}]` | mode sets the execute bit |
| Mount a Secret as files | `volumes[].secret.secretName` | one file per key |
| Probe with a shell | `exec: {command: ["sh", "-c", "..."]}` | lets the probe read env vars |
| Guaranteed Pod | requests == limits for cpu and memory | check `.status.qosClass` |
| Short Service name | `http://web` | works inside the same namespace |
| Full Service name | `web.k8s-from-zero.svc.cluster.local` | from any namespace |
| Long-lived test client | `kubectl run client --image=busybox:1.37 -- sleep 3600` | then `kubectl exec client -- wget ...` |
| Restart all Pods of a Deployment | `kubectl rollout restart deployment/web` | one at a time, per the rollout strategy |
| Ready endpoints only | `-o jsonpath='{range .items[*].endpoints[?(@.conditions.ready==true)]}x{end}'` | counts ready endpoints |
| Generate YAML | `kubectl create deployment web --image=busybox:1.37 --dry-run=client -o yaml` | then edit |
| Grade | `./check.sh` | `NS=other ./check.sh` for another namespace |

## Recap and what is next

![Arc 1 as a route map: parts 1 to 4 are the ideas, parts 5 to 8 the daily tools and objects, parts 9 to 11 running an app well, and part 12, this checkpoint lab, is highlighted at the end, with an arrow on to arc 2.](/diagrams/k8s-from-zero-12-checkpoint-lab-1/recap-map-of-arc-1.svg)

- You built a two-tier app from an empty namespace: Deployments, Services, a Secret, two ConfigMaps, probes, a preStop hook and sized resources.
- A grading script that reads the API is a good habit for any lab, and for real clusters too.
- Readiness and graceful shutdown together gave zero failed requests during a full rolling restart in our lab.
- The counter vanished when Redis restarted, because nothing in arc 1 keeps data outside a container.

Next: part 13, volumes, PersistentVolumes and StorageClasses, the start of arc 2, where Redis gets storage that outlives its Pod. Coming tomorrow.

```rail
id: "echo-content-type-text-plain-echo"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "#!/bin/sh"
        text: "An argument of this command: #!/bin/sh."
      - token: "# Count one visit in Redis and print the total."
        text: "An argument of this command: # Count one visit in Redis and print the total.."
      - token: "PASS=$(cat /etc/redis-auth/password)"
        text: "An argument of this command: PASS=$(cat /etc/redis-auth/password)."
      - token: "N=$(printf 'AUTH %s\\r\\nINCR hits\\r\\nQUIT\\r\\n' \"$PASS\" | nc -w 2 \"$REDIS_HOST\" 6379 | sed -n 's/^:\\([0-9]*\\).*/\\1/p')"
        text: "A shell assignment for this command only. It sets a variable, then the rest of the line runs."
      - token: "echo"
        text: "Shell. Writes its arguments to standard output, then a newline."
      - token: "\"Content-Type: text/plain\""
        text: "A quoted argument in this command."
      - token: "echo"
        text: "Shell. Writes its arguments to standard output, then a newline."
      - token: "if"
        text: "Shell. Starts a conditional."
      - token: "["
        text: "Shell. The test command."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "\"$N\""
        text: "A quoted argument in this command."
      - token: "]"
        text: "Shell. Closes a test."
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "then"
        text: "Shell. The commands that run when the test succeeds."
      - token: "echo"
        text: "Shell. Writes its arguments to standard output, then a newline."
      - token: "\"visits: $N (served by $HOSTNAME)\""
        text: "A quoted argument in this command."
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "else"
        text: "Shell. The commands that run when the test fails."
      - token: "echo"
        text: "Shell. Writes its arguments to standard output, then a newline."
      - token: "\"redis unavailable\""
        text: "A quoted argument in this command."
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "fi"
        text: "Shell. Ends an if."
```

```rail
id: "k-ns-2-dev-null"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "#!/bin/sh"
        text: "An argument of this command: #!/bin/sh."
      - token: "# Grade the checkpoint lab. Each line prints PASS or FAIL."
        text: "An argument of this command: # Grade the checkpoint lab. Each line prints PASS or FAIL.."
      - token: "NS=${NS:-k8s-from-zero}"
        text: "An argument of this command: NS=${NS:-k8s-from-zero}."
      - token: "k()"
        text: "Shell. Defines a function for the rest of this script."
      - token: "{"
        text: "An argument of this command: {."
      - token: "kubectl"
        text: "An argument of this command: kubectl."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "\"$NS\""
        text: "A quoted argument in this command."
      - token: "\"$@\""
        text: "A quoted argument in this command."
      - token: "2>/dev/null"
        text: "Shell. Sends standard error to /dev/null, so those messages are discarded."
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "}"
        text: "An argument of this command: }."
      - token: "check()"
        text: "Shell. Defines a function for the rest of this script."
      - token: "{"
        text: "An argument of this command: {."
      - token: "if"
        text: "Shell. Starts a conditional."
      - token: "["
        text: "Shell. The test command."
      - token: "\"$2\""
        text: "A quoted argument in this command."
      - token: "="
        text: "An argument of this command: =."
      - token: "\"$3\""
        text: "A quoted argument in this command."
      - token: "]"
        text: "Shell. Closes a test."
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "then"
        text: "Shell. The commands that run when the test succeeds."
      - token: "echo"
        text: "Shell. Writes its arguments to standard output, then a newline."
      - token: "\"PASS  $1\""
        text: "A quoted argument in this command."
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "else"
        text: "Shell. The commands that run when the test fails."
      - token: "echo"
        text: "Shell. Writes its arguments to standard output, then a newline."
      - token: "\"FAIL  $1 (got '$2', want '$3')\""
        text: "A quoted argument in this command."
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "fi"
        text: "Shell. Ends an if."
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "}"
        text: "An argument of this command: }."
      - token: "check"
        text: "An argument of this command: check."
      - token: "\"secret redis-auth has a password\""
        text: "A quoted argument in this command."
      - token: "\"$(k get secret redis-auth -o jsonpath='{.data.password}' | grep -q . && echo yes)\""
        text: "A quoted argument in this command."
      - token: "\"yes\""
        text: "A quoted argument in this command."
      - token: "check"
        text: "An argument of this command: check."
      - token: "\"redis has 1 ready replica\""
        text: "A quoted argument in this command."
      - token: "\"$(k get deploy redis -o jsonpath='{.status.readyReplicas}')\""
        text: "A quoted argument in this command."
      - token: "\"1\""
        text: "A quoted argument in this command."
  - kind: "explain"
    label: "Explain the rest of this command"
    lines:
      - token: "check"
        text: "An argument of this command: check."
      - token: "\"redis runs redis:8.10-alpine\""
        text: "A quoted argument in this command."
      - token: "\"$(k get deploy redis -o jsonpath='{.spec.template.spec.containers[0].image}')\""
        text: "A quoted argument in this command."
      - token: "\"redis:8.10-alpine\""
        text: "A quoted argument in this command."
      - token: "check"
        text: "An argument of this command: check."
      - token: "\"redis has a readiness probe\""
        text: "A quoted argument in this command."
      - token: "\"$(k get deploy redis -o jsonpath='{.spec.template.spec.containers[0].readinessProbe.exec.command[0]}')\""
        text: "A quoted argument in this command."
      - token: "\"sh\""
        text: "A quoted argument in this command."
      - token: "check"
        text: "An argument of this command: check."
      - token: "\"redis Pod is Guaranteed\""
        text: "A quoted argument in this command."
      - token: "\"$(k get pods -l app.kubernetes.io/name=redis -o jsonpath='{.items[0].status.qosClass}')\""
        text: "A quoted argument in this command."
      - token: "\"Guaranteed\""
        text: "A quoted argument in this command."
      - token: "check"
        text: "An argument of this command: check."
      - token: "\"redis maxmemory is 48mb\""
        text: "A quoted argument in this command."
      - token: "\"$(k exec deploy/redis -- sh -c 'redis-cli -a \"$REDIS_PASSWORD\" --no-auth-warning CONFIG GET maxmemory' | tail -1)\""
        text: "A quoted argument in this command."
      - token: "\"50331648\""
        text: "A quoted argument in this command."
      - token: "check"
        text: "An argument of this command: check."
      - token: "\"redis refuses clients without the password\""
        text: "A quoted argument in this command."
      - token: "\"$(k exec deploy/redis -- redis-cli ping | cut -d' ' -f1)\""
        text: "A quoted argument in this command."
      - token: "\"NOAUTH\""
        text: "A quoted argument in this command."
      - token: "check"
        text: "An argument of this command: check."
      - token: "\"web has 2 ready replicas\""
        text: "A quoted argument in this command."
      - token: "\"$(k get deploy web -o jsonpath='{.status.readyReplicas}')\""
        text: "A quoted argument in this command."
      - token: "\"2\""
        text: "A quoted argument in this command."
      - token: "check"
        text: "An argument of this command: check."
      - token: "\"web has a readiness probe on /index.html\""
        text: "A quoted argument in this command."
      - token: "\"$(k get deploy web -o jsonpath='{.spec.template.spec.containers[0].readinessProbe.httpGet.path}')\""
        text: "A quoted argument in this command."
      - token: "\"/index.html\""
        text: "A quoted argument in this command."
      - token: "check"
        text: "An argument of this command: check."
      - token: "\"web has a preStop hook\""
        text: "A quoted argument in this command."
      - token: "\"$(k get deploy web -o jsonpath='{.spec.template.spec.containers[0].lifecycle.preStop.sleep.seconds}')\""
        text: "A quoted argument in this command."
      - token: "\"5\""
        text: "A quoted argument in this command."
      - token: "check"
        text: "An argument of this command: check."
      - token: "\"web Pods are Burstable\""
        text: "A quoted argument in this command."
      - token: "\"$(k get pods -l app.kubernetes.io/name=web -o jsonpath='{.items[*].status.qosClass}')\""
        text: "A quoted argument in this command."
      - token: "\"Burstable Burstable\""
        text: "A quoted argument in this command."
      - token: "check"
        text: "An argument of this command: check."
      - token: "\"Service web has 2 ready endpoints\""
        text: "A quoted argument in this command."
      - token: "\"$(k get endpointslice -l kubernetes.io/service-name=web -o jsonpath='{range .items[*].endpoints[?(@.conditions.ready==true)]}x{end}')\""
        text: "A quoted argument in this command."
      - token: "\"xx\""
        text: "A quoted argument in this command."
  - kind: "explain"
    label: "Explain the last part of this command"
    lines:
      - token: "check"
        text: "An argument of this command: check."
      - token: "\"the counter answers through the Service\""
        text: "A quoted argument in this command."
      - token: "\"$(k exec client -- wget -qO- -T 5 http://web/cgi-bin/hits | cut -d: -f1)\""
        text: "A quoted argument in this command."
      - token: "\"visits\""
        text: "A quoted argument in this command."
```

```rail
id: "create-namespace-k8s-from-zero"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "create"
        text: "Create a resource from a file or from stdin, or through a subcommand such as namespace."
      - token: "namespace"
        text: "The resource type."
      - token: "k8s-from-zero"
        text: "The object name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "create"
        text: "Create a resource from a file or from stdin, or through a subcommand such as namespace."
      - token: "secret"
        text: "The resource type."
      - token: "generic"
        text: "The secret subcommand form. kubectl create secret generic creates a Secret from literal values or files."
      - token: "redis-auth"
        text: "The object name."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "--from-literal=password=change-me-123"
        text: "A key=value to store in the new object. create secret and create configmap both take --from-literal. This command passes password=change-me-123."
```

```rail
id: "apply-redis-yaml-rollout"
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
      - token: "redis.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "rollout"
        text: "The command group for rollout actions."
      - token: "status"
        text: "Show the status of a rollout and wait until it finishes."
      - token: "deployment/redis"
        text: "The resource written as type/name: deployment/redis."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "--timeout=90s"
        text: "How long to wait before giving up. This command passes 90s."
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
      - token: "--timeout=90s"
        text: "How long to wait before giving up. This command passes 90s."
```

```rail
id: "run-client-k8s-from-zero"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "run"
        text: "Create and run a particular image in a pod. The run synopsis is kubectl run NAME --image=image."
      - token: "client"
        text: "The NAME in kubectl run NAME. This command names the Pod client."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "--image=busybox:1.37"
        text: "The image for the container to run. This command passes busybox:1.37."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "sleep"
        text: "The command run in the container, or a shell pause. It waits the given time."
      - token: "3600"
        text: "A numeric argument in this command."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods,svc"
        text: "An argument of this command: pods,svc."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "for"
        text: "Shell. Starts a for loop."
      - token: "i"
        text: "An argument of this command: i."
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
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "do"
        text: "Shell. Starts the body of a for, while or if."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "client"
        text: "An argument of this command: client."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "wget"
        text: "The command run in the container. It fetches a URL."
      - token: "-qO-"
        text: "A flag of the command inside the container: -qO-."
      - token: "-T"
        text: "A flag of the command inside the container: -T."
      - token: "5"
        text: "A number passed to the command inside the container."
      - token: "http://web/cgi-bin/hits"
        text: "The URL requested inside the container: http://web/cgi-bin/hits."
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "done"
        text: "Shell. Ends a for, while or until loop."
```

```rail
id: "check-sh-get-pods"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "./check.sh"
        text: "The file named by --filename."
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
      - token: "custom-columns=NAME:.metadata.name,QOS:.status.qosClass"
        text: "custom-columns is an output format. The get examples write each column as a heading, a colon, and a JSONPath. The headings here are NAME, QOS."
```

```rail
id: "run-loader-k8s-from-zero"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "run"
        text: "Create and run a particular image in a pod. The run synopsis is kubectl run NAME --image=image."
      - token: "loader"
        text: "The NAME in kubectl run NAME. This command names the Pod loader."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "--image=busybox:1.37"
        text: "The image for the container to run. This command passes busybox:1.37."
      - token: "--restart=Never"
        text: "The restart policy for this Pod. The run docs list Always, OnFailure and Never. This command passes Never."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "sh"
        text: "An argument of this command: sh."
      - token: "-c"
        text: "An argument of sh. It tells sh to run the command string that follows."
      - token: "'ok=0; bad=0; for i in $(seq 1 120); do if wget -qO- -T 2 http://web/cgi-bin/hits | grep -q visits; then ok=$((ok+1)); else bad=$((bad+1)); fi; sleep 0.25; done; echo \"ok=$ok failed=$bad\"'"
        text: "A quoted argument in this command."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "rollout"
        text: "The command group for rollout actions."
      - token: "restart"
        text: "Restart a resource by rolling its Pods."
      - token: "deployment/web"
        text: "The resource written as type/name: deployment/web."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
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
      - token: "logs"
        text: "Print the logs for a container in a pod or specified resource. If the pod has only one container, the container name is optional."
      - token: "loader"
        text: "An argument of this command: loader."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
```

```rail
id: "delete-pod-k8s-from-zero"
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
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "app.kubernetes.io/name=redis"
        text: "The label query passed to --selector: app.kubernetes.io/name=redis."
      - token: "--wait=false"
        text: "Do not wait for the objects to finish deleting. The delete docs say --wait defaults to true."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "client"
        text: "An argument of this command: client."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "wget"
        text: "The command run in the container. It fetches a URL."
      - token: "-qO-"
        text: "A flag of the command inside the container: -qO-."
      - token: "-T"
        text: "A flag of the command inside the container: -T."
      - token: "5"
        text: "A number passed to the command inside the container."
      - token: "http://web/cgi-bin/hits"
        text: "The URL requested inside the container: http://web/cgi-bin/hits."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "rollout"
        text: "The command group for rollout actions."
      - token: "status"
        text: "Show the status of a rollout and wait until it finishes."
      - token: "deployment/redis"
        text: "The resource written as type/name: deployment/redis."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "client"
        text: "An argument of this command: client."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "wget"
        text: "The command run in the container. It fetches a URL."
      - token: "-qO-"
        text: "A flag of the command inside the container: -qO-."
      - token: "-T"
        text: "A flag of the command inside the container: -T."
      - token: "5"
        text: "A number passed to the command inside the container."
      - token: "http://web/cgi-bin/hits"
        text: "The URL requested inside the container: http://web/cgi-bin/hits."
```

```rail
id: "delete-namespace-k8s-from-zero"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "namespace"
        text: "The resource type."
      - token: "k8s-from-zero"
        text: "The object name."
```
