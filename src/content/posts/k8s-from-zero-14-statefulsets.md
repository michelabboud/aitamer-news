---
title: "Kubernetes from Zero, part 14: StatefulSets, stable names and a disk per Pod"
description: "Run stateful apps with StatefulSets: stable Pod names and DNS, a headless Service, one claim per Pod, ordered rollout and a learning Postgres on kind."
pubDate: "2026-11-25T22:00:00Z"
series: k8s-from-zero
series_order: 14
section: devops
subsection: kubernetes
tags:
  - k8s-from-zero
  - kubernetes
  - tutorial
  - statefulsets
  - storage
draft: false
heroImage: https://bots.aitamer.news/heroes/k8s-from-zero-14-statefulsets-61fab348.jpg
heroAlt: "Three slate-blue paper boats sit side by side on a wooden pier, each beside its own stack of sand-colored crates; the left boat carries a coral life ring and a ship's wheel stands on a post at the right."
author: desk-bot
lessonKit:
  id: k8s-14
wildness:
  rating: 1
  verified: "Every command ran on three-node kind v0.33.0 (node v1.37.0, kubectl v1.37.2), postgres:18-alpine, 10 Nov 2026"
  claimed: "Feature stages (maxUnavailable beta, Recreate alpha in v1.37) and the rollback caveat are from the docs"
verdict: "Use a StatefulSet when each replica needs its own name and its own disk. Create the headless Service, keep claims on scale down, and back up the data."
sources:
  - title: "StatefulSets (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/
  - title: "StatefulSet Basics (Kubernetes documentation)"
    url: https://kubernetes.io/docs/tutorials/stateful-application/basic-stateful-set/
  - title: "Service, headless Services (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/services-networking/service/
  - title: "DNS for Services and Pods (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/
  - title: "Persistent Volumes (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/storage/persistent-volumes/
  - title: "postgres official image (Docker Hub)"
    url: https://hub.docker.com/_/postgres
  - title: "Kubernetes from Zero, part 13: Volumes, PersistentVolumes, claims and StorageClasses"
    url: https://aitamer.news/posts/k8s-from-zero-13-volumes-pv-pvc-storageclass/
  - title: "kubectl reference (Kubernetes documentation)"
    url: https://kubernetes.io/docs/reference/kubectl/
---

In [part 13](https://aitamer.news/posts/k8s-from-zero-13-volumes-pv-pvc-storageclass/) you gave one Pod a disk that outlived it. A real database needs more: each replica wants its own disk, a name that stays the same after a restart, and an address other replicas can find. A Deployment cannot give you that; its Pods are interchangeable, with random names. This episode introduces the **StatefulSet**, the workload built for exactly this. By the end you can run a StatefulSet behind a headless Service, reach each Pod by a stable DNS name, watch the ordered start and stop, keep data across restarts and scale-downs, and run a small Postgres for learning. You need the three-node kind cluster from part 3 and the `k8s-from-zero` namespace. We tested on kind v0.33.0 (node image v1.37.0), kubectl v1.37.2 and `postgres:18-alpine`; our cluster is called `k8s-ep13`.

## What you will build

First a three-replica nginx StatefulSet called `web`, each Pod with its own 1 GiB claim and a page that says which Pod it is. You will look the Pods up by name through DNS, delete one and watch the same identity come back, then scale down and up without losing a byte. Second, a one-replica Postgres with its password in a Secret, a table that survives a Pod deletion, and a cleanup policy that removes its claim when you delete the set.

![The StatefulSet web and the headless Service web manage three Pods, web-0 to web-2, each with a DNS name such as web-0.web.k8s-from-zero.svc.cluster.local and its own claim www-web-N. web-1 is highlighted: after we deleted it, it came back with the same name and claim, and only its IP changed.](/diagrams/k8s-from-zero-14-statefulsets/statefulset-identity.svg)

## Identity is the point of a StatefulSet

The [StatefulSets page](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/) describes it as a controller that manages Pods based on an identical spec, while keeping a sticky identity for each one. For N replicas the Pods are numbered with an **ordinal** from 0 to N-1, and the name is the set's name plus the ordinal: `web-0`, `web-1`, `web-2`. Each Pod also gets the labels `statefulset.kubernetes.io/pod-name` and, stable since v1.32, `apps.kubernetes.io/pod-index` with its ordinal. A Deployment's replacement Pod gets a new random name; a StatefulSet's replacement for `web-1` is `web-1` again.

Three things make up that identity:

- **A stable name**, derived from the ordinal.
- **A stable network identity.** A StatefulSet needs a **headless Service**: a Service with `clusterIP: None`. Part 8 introduced the type. The [DNS page](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/) says a lookup of a headless Service returns one answer per Pod rather than one virtual IP. The StatefulSet adds a per-Pod record: `web-0.web.k8s-from-zero.svc.cluster.local`, the Pod name, then the Service name, then the namespace. The docs also say you are responsible for creating this Service; the StatefulSet only refers to it with `serviceName`.
- **Stable storage.** `volumeClaimTemplates` stamps out one PersistentVolumeClaim per Pod, named template plus Pod: `www-web-0`. A replacement Pod reattaches the same claim.

Use a StatefulSet for databases, queues and clustered systems where members know each other by name. If your replicas are identical and keep no local state, a Deployment is simpler.

## One claim per Pod, kept on purpose

In part 13 you wrote the claim yourself. Here you write a template and the controller makes the claims. The important rule, in the docs' words: "Deleting and/or scaling a StatefulSet down will not delete the volumes associated with the StatefulSet." Data is treated as more valuable than tidiness.

![One volumeClaimTemplate named www makes the claims www-web-0, www-web-1 and www-web-2, each bound to its own volume. After scaling to one replica, only web-0 runs, yet all three claims are still Bound, highlighted. A panel explains persistentVolumeClaimRetentionPolicy with Retain as the default.](/diagrams/k8s-from-zero-14-statefulsets/volumeclaimtemplate-per-pod.svg)

Since v1.32 you can change that with `persistentVolumeClaimRetentionPolicy`, which has two settings:

- `whenDeleted`: what happens to the claims when the StatefulSet is deleted.
- `whenScaled`: what happens to the claims of Pods removed by a scale down.

Each is `Retain` (the default) or `Delete`. The docs add that these only apply when Pods are removed by deletion or scaling. If a Pod dies because its node failed, the replacement keeps the existing claim.

## Order: start up, then down

By default (`podManagementPolicy: OrderedReady`) the controller creates Pods one at a time, from 0 upward, and waits for each to be **Running and Ready** before the next. Scaling down goes in reverse, from the highest ordinal, and each Pod must be fully gone before the next one stops. Readiness comes from the probe you met in part 10, so a probe that never passes stops the whole line. You will hit that in "When it goes wrong", because we did.

![A timeline: web-0 becomes Ready before web-1 is created, and web-1 before web-2. Scaling down to one stops web-2 first, then web-1, while web-0 keeps running. A highlighted box notes that a Pod that never becomes Ready blocks the next ordinal, and a panel says Parallel starts and stops all Pods at once.](/diagrams/k8s-from-zero-14-statefulsets/ordered-start-and-stop.svg)

`podManagementPolicy: Parallel` keeps the identities but drops the waiting: all Pods start or stop at once. It suits systems whose members do not need a fixed boot order.

Updates follow `updateStrategy`. `RollingUpdate` (the default) replaces Pods from the highest ordinal down, one at a time. A `partition` number lets you update only the Pods with an ordinal at or above it, a simple way to stage a change. The docs list `maxUnavailable` for rolling updates as beta and enabled by default in v1.37, and a `Recreate` strategy as alpha, behind a feature gate. `OnDelete` updates a Pod only when you delete it yourself. One caveat from the docs: if a rolling update brings in a template that never becomes Ready, reverting the template is not enough; you must also delete the Pod that was stuck on the bad version.

## Try it: a StatefulSet you can find by name

Set your context namespace to `k8s-from-zero`. The box we tested on has no internet inside the cluster, so we preloaded `nginx:1.29-alpine`, `busybox:1.37` and `postgres:18-alpine` with `kind load docker-image`; on your laptop they pull normally.

1. **Write the Service and the StatefulSet.** Save as `web-sts.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: web
spec:
  clusterIP: None # headless: DNS returns the Pod IPs, no virtual IP
  selector:
    app.kubernetes.io/name: web
  ports:
    - name: http
      port: 80
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: web
  namespace: k8s-from-zero
spec:
  serviceName: web
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
        - name: nginx
          image: nginx:1.29-alpine
          ports:
            - name: http
              containerPort: 80
          readinessProbe:
            tcpSocket:
              port: http
          volumeMounts:
            - name: www
              mountPath: /usr/share/nginx/html
  volumeClaimTemplates:
    - metadata:
        name: www
      spec:
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: 1Gi
```

The claim is mounted over nginx's web root, so each Pod starts with an empty site. The readiness probe only checks that port 80 accepts connections; step 9 explains why.

2. **Apply it and watch the order.** In a second terminal, start a watch first. The custom columns make the order easy to read:

```bash rail=get-pods
kubectl get pods -l app.kubernetes.io/name=web -w -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,READY:.status.containerStatuses[0].ready,NODE:.spec.nodeName
```

Then apply and wait in the first terminal:

```bash rail=apply-web-sts-yaml-rollout
kubectl apply -f web-sts.yaml
kubectl rollout status statefulset/web --timeout=180s
```

```text
service/web created
statefulset.apps/web created
Waiting for 3 pods to be ready...
Waiting for 2 pods to be ready...
Waiting for 2 pods to be ready...
Waiting for 1 pods to be ready...
Waiting for 1 pods to be ready...
partitioned roll out complete: 3 new pods have been updated...
```

The watch shows each Pod reach Ready before the next one is even created:

```text
NAME    STATUS    READY    NODE
web-0   Pending   <none>   <none>
web-0   Pending   <none>   <none>
web-0   Pending   <none>   k8s-ep13-worker2
web-0   Pending   false    k8s-ep13-worker2
web-0   Pending   false    k8s-ep13-worker2
web-0   Running   false    k8s-ep13-worker2
web-0   Running   true     k8s-ep13-worker2
web-1   Pending   <none>   <none>
web-1   Pending   <none>   <none>
web-1   Pending   <none>   k8s-ep13-worker
web-1   Pending   false    k8s-ep13-worker
web-1   Pending   false    k8s-ep13-worker
web-1   Running   false    k8s-ep13-worker
web-1   Running   true     k8s-ep13-worker
web-2   Pending   <none>   <none>
web-2   Pending   <none>   <none>
web-2   Pending   <none>   k8s-ep13-worker
web-2   Pending   false    k8s-ep13-worker
web-2   Pending   false    k8s-ep13-worker
web-2   Running   false    k8s-ep13-worker
web-2   Running   true     k8s-ep13-worker
```

3. **Look at names, labels and claims.**

```bash rail=get-pods-wide
kubectl get pods -l app.kubernetes.io/name=web -o wide
kubectl get pods -l app.kubernetes.io/name=web -L apps.kubernetes.io/pod-index
kubectl get pvc
kubectl get svc web
```

```text
NAME    READY   STATUS    RESTARTS   AGE   IP            NODE               NOMINATED NODE   READINESS GATES
web-0   1/1     Running   0          14s   10.244.2.11   k8s-ep13-worker2   <none>           <none>
web-1   1/1     Running   0          10s   10.244.1.13   k8s-ep13-worker    <none>           <none>
web-2   1/1     Running   0          5s    10.244.1.15   k8s-ep13-worker    <none>           <none>
NAME    READY   STATUS    RESTARTS   AGE   POD-INDEX
web-0   1/1     Running   0          14s   0
web-1   1/1     Running   0          10s   1
web-2   1/1     Running   0          5s    2
NAME        STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
www-web-0   Bound    pvc-c94d238a-7a0c-4d41-87ad-9fc837f929d4   1Gi        RWO            standard       <unset>                 14s
www-web-1   Bound    pvc-16e455b5-dcd0-4790-a941-c825f94560bf   1Gi        RWO            standard       <unset>                 10s
www-web-2   Bound    pvc-058fe3a5-7dbb-4b9e-9f87-872860516d74   1Gi        RWO            standard       <unset>                 5s
NAME   TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
web    ClusterIP   None         <none>        80/TCP    15s
```

Ages 14, 10 and 5 seconds: one at a time. `CLUSTER-IP None` is the headless Service.

4. **Give each Pod a page that names it.**

```bash rail=for-i-in
for i in 0 1 2; do kubectl exec web-$i -- sh -c "echo hello from \$(hostname) > /usr/share/nginx/html/index.html"; done
```

The file lands on each Pod's own claim.

5. **Find the Pods through DNS.** Run a throwaway client Pod that looks up the Service and fetches one page:

```bash rail=run-dns-test-sh
kubectl run dns-test --image=busybox:1.37 --restart=Never --rm -i --quiet -- sh -c "nslookup web-0.web; nslookup web; wget -qO- http://web-1.web"
```

```text
Server:		10.96.0.10
Address:	10.96.0.10:53

** server can't find web-0.web: SERVFAIL

*** Can't find web-0.web: No answer

Server:		10.96.0.10
Address:	10.96.0.10:53

Name:	web.k8s-from-zero.svc.cluster.local
Address: 10.244.1.15
Name:	web.k8s-from-zero.svc.cluster.local
Address: 10.244.1.13
Name:	web.k8s-from-zero.svc.cluster.local
Address: 10.244.2.11

...
hello from web-1
```

The Service name returns all three Pod IPs, one answer per Pod. The short Pod name `web-1.web` worked for `wget`, yet busybox's `nslookup` gave up on `web-0.web` with SERVFAIL. Use the full name with `nslookup`:

```bash rail=run-dns-test-sh-6
kubectl run dns-test --image=busybox:1.37 --restart=Never --rm -i --quiet -- sh -c "nslookup web-0.web.k8s-from-zero.svc.cluster.local; for i in 0 1 2; do wget -qO- http://web-\$i.web; done"
```

```text
Server:		10.96.0.10
Address:	10.96.0.10:53


Name:	web-0.web.k8s-from-zero.svc.cluster.local
Address: 10.244.2.11

hello from web-0
hello from web-1
hello from web-2
```

Every Pod answers at its own name with its own page.

6. **Delete a Pod and watch the identity return.**

```bash rail=delete-pod-web-1
kubectl delete pod web-1
kubectl get pods -l app.kubernetes.io/name=web -o wide
kubectl exec web-1 -- cat /usr/share/nginx/html/index.html
```

```text
pod "web-1" deleted from k8s-from-zero namespace
NAME    READY   STATUS    RESTARTS   AGE   IP            NODE               NOMINATED NODE   READINESS GATES
web-0   1/1     Running   0          36s   10.244.2.11   k8s-ep13-worker2   <none>           <none>
web-1   1/1     Running   0          6s    10.244.1.16   k8s-ep13-worker    <none>           <none>
web-2   1/1     Running   0          27s   10.244.1.15   k8s-ep13-worker    <none>           <none>
hello from web-1
```

Same name, same node (its claim is node-local, part 13), same page. The IP changed from `10.244.1.13` to `10.244.1.16`, which is why clients should use the DNS name.

7. **Scale down and back up.**

```bash rail=scale-statefulset-web
kubectl scale statefulset web --replicas=1
kubectl rollout status statefulset/web --timeout=120s
kubectl get pods -l app.kubernetes.io/name=web
kubectl get pvc
```

```text
statefulset.apps/web scaled
partitioned roll out complete: 2 new pods have been updated...
NAME    READY   STATUS    RESTARTS   AGE
web-0   1/1     Running   0          40s
NAME        STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
www-web-0   Bound    pvc-c94d238a-7a0c-4d41-87ad-9fc837f929d4   1Gi        RWO            standard       <unset>                 40s
www-web-1   Bound    pvc-16e455b5-dcd0-4790-a941-c825f94560bf   1Gi        RWO            standard       <unset>                 36s
www-web-2   Bound    pvc-058fe3a5-7dbb-4b9e-9f87-872860516d74   1Gi        RWO            standard       <unset>                 31s
```

Our watch showed `web-2` get its deletion mark first and `web-1` right after it. All three claims are still `Bound`. Scale back up:

```bash rail=scale-statefulset-web-9
kubectl scale statefulset web --replicas=3
kubectl rollout status statefulset/web --timeout=120s
kubectl exec web-2 -- cat /usr/share/nginx/html/index.html
```

```text
statefulset.apps/web scaled
Waiting for 2 pods to be ready...
Waiting for 1 pods to be ready...
Waiting for 1 pods to be ready...
partitioned roll out complete: 3 new pods have been updated...
hello from web-2
```

The new `web-2` found the old claim and the page you wrote in step 4.

8. **Delete the set and clean up the claims yourself.**

```bash rail=delete-web-sts-yaml-get
kubectl delete -f web-sts.yaml
kubectl get pods,pvc
kubectl delete pvc -l app.kubernetes.io/name=web
```

```text
service "web" deleted from k8s-from-zero namespace
statefulset.apps "web" deleted from k8s-from-zero namespace
NAME                              STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
persistentvolumeclaim/www-web-0   Bound    pvc-c94d238a-7a0c-4d41-87ad-9fc837f929d4   1Gi        RWO            standard       <unset>                 62s
persistentvolumeclaim/www-web-1   Bound    pvc-16e455b5-dcd0-4790-a941-c825f94560bf   1Gi        RWO            standard       <unset>                 58s
persistentvolumeclaim/www-web-2   Bound    pvc-058fe3a5-7dbb-4b9e-9f87-872860516d74   1Gi        RWO            standard       <unset>                 53s
persistentvolumeclaim "www-web-0" deleted from k8s-from-zero namespace
persistentvolumeclaim "www-web-1" deleted from k8s-from-zero namespace
persistentvolumeclaim "www-web-2" deleted from k8s-from-zero namespace
```

The claims outlived the set. On our cluster they carried the Pod template's `app.kubernetes.io/name: web` label, which made one selector enough to remove them.

9. **Run a learning Postgres.** This is for practice: one replica, no backups, no replication, a throwaway password. Save as `pg.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: pg-auth
  namespace: k8s-from-zero
type: Opaque
stringData:
  POSTGRES_PASSWORD: learning-only-change-me
---
apiVersion: v1
kind: Service
metadata:
  name: pg
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: postgres
spec:
  clusterIP: None
  selector:
    app.kubernetes.io/name: postgres
  ports:
    - name: postgres
      port: 5432
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: pg
  namespace: k8s-from-zero
spec:
  serviceName: pg
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: postgres
  template:
    metadata:
      labels:
        app.kubernetes.io/name: postgres
    spec:
      terminationGracePeriodSeconds: 30
      containers:
        - name: postgres
          image: postgres:18-alpine
          ports:
            - name: postgres
              containerPort: 5432
          envFrom:
            - secretRef:
                name: pg-auth
          readinessProbe:
            exec:
              command: ["pg_isready", "-U", "postgres"]
            periodSeconds: 5
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              memory: 512Mi
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql # PostgreSQL 18+ image layout
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: 1Gi
```

The password comes from a Secret (part 9), readiness from `pg_isready`, and the requests and limits follow part 11. Note the mount path. The [postgres image page](https://hub.docker.com/_/postgres) says that from PostgreSQL 18 the image keeps its data in a version-specific folder, `/var/lib/postgresql/18/docker`, and that volumes should be mounted at `/var/lib/postgresql`. Older guides mount `/var/lib/postgresql/data`, which is right only for version 17 and below.

```bash rail=apply-pg-yaml-rollout
kubectl apply -f pg.yaml
kubectl rollout status statefulset/pg --timeout=180s
kubectl get pods,pvc -l app.kubernetes.io/name=postgres
kubectl exec pg-0 -- sh -c 'echo PGDATA=$PGDATA; ls /var/lib/postgresql'
```

```text
secret/pg-auth created
service/pg created
statefulset.apps/pg created
Waiting for 1 pods to be ready...
partitioned roll out complete: 1 new pods have been updated...
NAME       READY   STATUS    RESTARTS   AGE
pod/pg-0   1/1     Running   0          11s

NAME                              STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
persistentvolumeclaim/data-pg-0   Bound    pvc-f2b21047-3c60-42bd-a693-9e7c6512da04   1Gi        RWO            standard       <unset>                 11s
PGDATA=/var/lib/postgresql/18/docker
18
```

10. **Write a row, kill the Pod, read the row.**

```bash rail=exec-pg-0-psql
kubectl exec pg-0 -- psql -U postgres -c "CREATE TABLE notes (id serial PRIMARY KEY, body text);" -c "INSERT INTO notes (body) VALUES ('survives a restart');"
kubectl delete pod pg-0
kubectl wait --for=condition=Ready pod/pg-0 --timeout=120s
kubectl exec pg-0 -- psql -U postgres -c "SELECT * FROM notes;"
```

```text
CREATE TABLE
INSERT 0 1
pod "pg-0" deleted from k8s-from-zero namespace
pod/pg-0 condition met
 id |        body        
----+--------------------
  1 | survives a restart
(1 row)
```

Now connect the way an app would, by the Pod's DNS name:

```bash rail=run-psql-psql
kubectl run psql --image=postgres:18-alpine --restart=Never --rm -i --quiet --env=PGPASSWORD=learning-only-change-me -- psql -h pg-0.pg -U postgres -c "SELECT now(), body FROM notes;"
```

```text
              now              |        body        
-------------------------------+--------------------
 2026-11-10 21:08:14.532734+00 | survives a restart
(1 row)
```

Typing the password on the command line is fine for a lab; in a real app it would come from the same Secret.

11. **Let the set delete its claim.** Turn on the retention policy, then delete:

```bash rail=patch-statefulset-pg
kubectl patch statefulset pg --type=merge -p '{"spec":{"persistentVolumeClaimRetentionPolicy":{"whenDeleted":"Delete","whenScaled":"Retain"}}}'
kubectl get statefulset pg -o jsonpath='{.spec.persistentVolumeClaimRetentionPolicy}{"\n"}'
kubectl delete statefulset pg
kubectl get pvc
kubectl delete -f pg.yaml --ignore-not-found
```

```text
statefulset.apps/pg patched
{"whenDeleted":"Delete","whenScaled":"Retain"}
statefulset.apps "pg" deleted from k8s-from-zero namespace
No resources found in k8s-from-zero namespace.
secret "pg-auth" deleted from k8s-from-zero namespace
service "pg" deleted from k8s-from-zero namespace
```

`data-pg-0` went with the set, and with it the table. That is the trade you choose with `Delete`.

## When it goes wrong

- **The first Pod never becomes Ready and the others never appear.** Our first version of `web-sts.yaml` used an `httpGet` readiness probe on `/`. The empty claim hid nginx's default page, nginx answered 403, and `web-0` sat at `0/1` for three minutes while `web-1` was never created:

```text
Warning  Unhealthy  5s (x20 over 3m4s)  kubelet  spec.containers{nginx}: Readiness probe failed: HTTP probe failed with statuscode: 403
```

Fix the probe or the content. With `OrderedReady`, one unready Pod blocks every higher ordinal.
- **`spec.volumeClaimTemplates: ... field is immutable`.** We changed the template's storage from 1Gi to 2Gi and re-applied; the API refused. Grow existing claims directly if the class allows expansion (`allowVolumeExpansion`, part 13), or create a new StatefulSet.
- **Pods start but cannot find each other by name.** The headless Service is missing, has a different name from `serviceName`, or its selector does not match. Check `kubectl get svc` for `CLUSTER-IP None` and compare names.
- **A rollout to a bad template stays stuck after you revert.** The docs call this a known issue with `OrderedReady`: after reverting the template, delete the Pod that was running the bad version so the controller can recreate it.
- **Old data shows up in a new set.** Claims with the same names were left behind. List `kubectl get pvc` before reusing a StatefulSet name, and delete what you do not want.

## Cheat sheet

| Task | Command or field | Note |
|---|---|---|
| Headless Service | `spec.clusterIP: None` | you create it yourself |
| Link the set to it | `spec.serviceName: web` | must match the Service name |
| Pod names | `web-0`, `web-1`, ... | set name plus ordinal |
| Pod DNS name | `web-0.web.k8s-from-zero.svc.cluster.local` | short `web-0.web` in the namespace |
| One claim per Pod | `spec.volumeClaimTemplates` | claims named `www-web-0`, ... |
| Watch the ordered start | `kubectl get pods -l app.kubernetes.io/name=web -w` | each Pod waits for Ready |
| Wait for a rollout | `kubectl rollout status statefulset/web` | works like Deployments |
| Scale | `kubectl scale statefulset web --replicas=1` | highest ordinal stops first |
| Start all at once | `podManagementPolicy: Parallel` | keeps identities |
| Stage an update | `updateStrategy.rollingUpdate.partition: 2` | only ordinals at or above 2 |
| Show the ordinal | `kubectl get pods -L apps.kubernetes.io/pod-index` | stable since v1.32 |
| Delete claims with the set | `persistentVolumeClaimRetentionPolicy.whenDeleted: Delete` | default `Retain` |
| Delete claims on scale down | `persistentVolumeClaimRetentionPolicy.whenScaled: Delete` | default `Retain` |
| Remove leftover claims | `kubectl delete pvc -l app.kubernetes.io/name=web` | check the list first |
| Postgres 18 mount path | `/var/lib/postgresql` | 17 and older: `/var/lib/postgresql/data` |

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: web
  namespace: k8s-from-zero
spec:
  serviceName: web
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
        - name: nginx
          image: nginx:1.29-alpine
  volumeClaimTemplates:
    - metadata:
        name: www
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 1Gi
```

## Recap and what is next

- A StatefulSet gives each Pod a stable name, a DNS record through a headless Service, and its own claim.
- Pods start in ordinal order and stop in reverse; a Pod that is never Ready stops the line unless you choose `Parallel`.
- Claims survive scale downs and deletion by default; `persistentVolumeClaimRetentionPolicy` changes that.
- Running a database this way works for learning. Production needs replication, backups and tested restores, which later episodes cover.

Next: Kubernetes from Zero, part 15, DaemonSets, Jobs and CronJobs, coming tomorrow.

*Command explanations and quoted passages in this lesson come from or adapt the [kubectl reference](https://kubernetes.io/docs/reference/kubectl/) and the [Kubernetes documentation](https://kubernetes.io/docs/), © The Kubernetes Authors, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). We shortened and edited some passages. Kubernetes® is a registered trademark of The Linux Foundation. aitamer.news is not affiliated with or endorsed by The Linux Foundation or the CNCF.*

```rail
id: "get-pods"
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
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "app.kubernetes.io/name=web"
        text: "The label query passed to --selector: app.kubernetes.io/name=web."
      - token: "-w"
        text: "Short form of --watch. After listing the requested object, watch for changes."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "custom-columns=NAME:.metadata.name,STATUS:.status.phase,READY:.status.containerStatuses[0].ready,NODE:.spec.nodeName"
        text: "custom-columns is an output format. The get examples write each column as a heading, a colon, and a JSONPath. The headings here are NAME, STATUS, READY, NODE."
```

```rail
id: "apply-web-sts-yaml-rollout"
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
      - token: "web-sts.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "rollout"
        text: "The command group for rollout actions."
      - token: "status"
        text: "Show the status of a rollout and wait until it finishes."
      - token: "statefulset/web"
        text: "The resource written as type/name: statefulset/web."
      - token: "--timeout=180s"
        text: "How long to wait before giving up. This command passes 180s."
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
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "app.kubernetes.io/name=web"
        text: "The label query passed to --selector: app.kubernetes.io/name=web."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "wide"
        text: "An output format. The get examples say wide adds more information, such as the node name. For Pods the lesson's table adds IP and NODE."
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
      - token: "-L"
        text: "Short form of --label-columns. The get docs say it accepts a comma-separated list of labels to present as columns, and that names are case-sensitive."
      - token: "apps.kubernetes.io/pod-index"
        text: "A label key for --label-columns. The get docs present it as a column."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pvc"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "svc"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "web"
        text: "The object name."
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
        text: "An argument of this command: i."
      - token: "in"
        text: "Shell. Names the list a for loop walks."
      - token: "0"
        text: "A numeric argument in this command."
      - token: "1"
        text: "A numeric argument in this command."
      - token: "2"
        text: "A numeric argument in this command."
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "do"
        text: "Shell. Starts the body of a for, while or if."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "web-$i"
        text: "An argument of this command: web-$i."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "sh"
        text: "An argument of the command inside the container: sh."
      - token: "-c"
        text: "A flag of the command inside the container: -c. sh -c runs the next argument as a shell command."
      - token: "\"echo hello from \\$(hostname) > /usr/share/nginx/html/index.html\""
        text: "A quoted command string run inside the container."
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "done"
        text: "Shell. Ends a for, while or until loop."
```

```rail
id: "run-dns-test-sh"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "run"
        text: "Create and run a particular image in a pod. The run synopsis is kubectl run NAME --image=image."
      - token: "dns-test"
        text: "The NAME in kubectl run NAME. This command names the Pod dns-test."
      - token: "--image=busybox:1.37"
        text: "The image for the container to run. This command passes busybox:1.37."
      - token: "--restart=Never"
        text: "The restart policy for this Pod. The run docs list Always, OnFailure and Never. This command passes Never."
      - token: "--rm"
        text: "If true, delete the Pod after it exits. The run docs say this is only valid when attaching to the container."
      - token: "-i"
        text: "Short form of --stdin. Pass stdin to the container."
      - token: "--quiet"
        text: "Suppress the extra messages kubectl would otherwise print."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "sh"
        text: "An argument of the command inside the container: sh."
      - token: "-c"
        text: "An argument of sh. It tells sh to run the command string that follows."
      - token: "\"nslookup web-0.web; nslookup web; wget -qO- http://web-1.web\""
        text: "The URL requested inside the container: \"nslookup web-0.web; nslookup web; wget -qO- http://web-1.web\"."
```

```rail
id: "run-dns-test-sh-6"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "run"
        text: "Create and run a particular image in a pod. The run synopsis is kubectl run NAME --image=image."
      - token: "dns-test"
        text: "The NAME in kubectl run NAME. This command names the Pod dns-test."
      - token: "--image=busybox:1.37"
        text: "The image for the container to run. This command passes busybox:1.37."
      - token: "--restart=Never"
        text: "The restart policy for this Pod. The run docs list Always, OnFailure and Never. This command passes Never."
      - token: "--rm"
        text: "If true, delete the Pod after it exits. The run docs say this is only valid when attaching to the container."
      - token: "-i"
        text: "Short form of --stdin. Pass stdin to the container."
      - token: "--quiet"
        text: "Suppress the extra messages kubectl would otherwise print."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "sh"
        text: "An argument of the command inside the container: sh."
      - token: "-c"
        text: "An argument of sh. It tells sh to run the command string that follows."
      - token: "\"nslookup web-0.web.k8s-from-zero.svc.cluster.local; for i in 0 1 2; do wget -qO- http://web-\\$i.web; done\""
        text: "The URL requested inside the container: \"nslookup web-0.web.k8s-from-zero.svc.cluster.local; for i in 0 1 2; do wget -qO- http://web-\\$i.web; done\"."
```

```rail
id: "delete-pod-web-1"
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
      - token: "web-1"
        text: "The object name."
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
        text: "An output format. The get examples say wide adds more information, such as the node name. For Pods the lesson's table adds IP and NODE."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "web-1"
        text: "An argument of this command: web-1."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "cat"
        text: "Shell. Writes the named files to standard output."
      - token: "/usr/share/nginx/html/index.html"
        text: "A path inside the container: /usr/share/nginx/html/index.html."
```

```rail
id: "scale-statefulset-web"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "scale"
        text: "Set a new size for a deployment, replica set, replication controller, or stateful set."
      - token: "statefulset"
        text: "The resource type."
      - token: "web"
        text: "The object name."
      - token: "--replicas=1"
        text: "The number of desired replicas. This command passes 1."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "rollout"
        text: "The command group for rollout actions."
      - token: "status"
        text: "Show the status of a rollout and wait until it finishes."
      - token: "statefulset/web"
        text: "The resource written as type/name: statefulset/web."
      - token: "--timeout=120s"
        text: "How long to wait before giving up. This command passes 120s."
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
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pvc"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
```

```rail
id: "scale-statefulset-web-9"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "scale"
        text: "Set a new size for a deployment, replica set, replication controller, or stateful set."
      - token: "statefulset"
        text: "The resource type."
      - token: "web"
        text: "The object name."
      - token: "--replicas=3"
        text: "The number of desired replicas. This command passes 3."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "rollout"
        text: "The command group for rollout actions."
      - token: "status"
        text: "Show the status of a rollout and wait until it finishes."
      - token: "statefulset/web"
        text: "The resource written as type/name: statefulset/web."
      - token: "--timeout=120s"
        text: "How long to wait before giving up. This command passes 120s."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "web-2"
        text: "An argument of this command: web-2."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "cat"
        text: "Shell. Writes the named files to standard output."
      - token: "/usr/share/nginx/html/index.html"
        text: "A path inside the container: /usr/share/nginx/html/index.html."
```

```rail
id: "delete-web-sts-yaml-get"
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
      - token: "web-sts.yaml"
        text: "The file named by --filename. delete removes the resources that file describes."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods,pvc"
        text: "An argument of this command: pods,pvc."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "pvc"
        text: "The resource type."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "app.kubernetes.io/name=web"
        text: "The label query passed to --selector: app.kubernetes.io/name=web."
```

```rail
id: "apply-pg-yaml-rollout"
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
      - token: "pg.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "rollout"
        text: "The command group for rollout actions."
      - token: "status"
        text: "Show the status of a rollout and wait until it finishes."
      - token: "statefulset/pg"
        text: "The resource written as type/name: statefulset/pg."
      - token: "--timeout=180s"
        text: "How long to wait before giving up. This command passes 180s."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods,pvc"
        text: "An argument of this command: pods,pvc."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "app.kubernetes.io/name=postgres"
        text: "The label query passed to --selector: app.kubernetes.io/name=postgres."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "pg-0"
        text: "An argument of this command: pg-0."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "sh"
        text: "An argument of the command inside the container: sh."
      - token: "-c"
        text: "A flag of the command inside the container: -c. sh -c runs the next argument as a shell command."
      - token: "'echo PGDATA=$PGDATA; ls /var/lib/postgresql'"
        text: "An argument of the command inside the container: 'echo PGDATA=$PGDATA; ls /var/lib/postgresql'."
```

```rail
id: "exec-pg-0-psql"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "pg-0"
        text: "An argument of this command: pg-0."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "psql"
        text: "The Postgres client."
      - token: "-U"
        text: "A flag of the command inside the container: -U."
      - token: "postgres"
        text: "An argument of the command inside the container: postgres."
      - token: "-c"
        text: "A flag of the command inside the container: -c. In this command it belongs to psql, which runs one SQL statement."
      - token: "\"CREATE TABLE notes (id serial PRIMARY KEY, body text);\""
        text: "An argument of the command inside the container: \"CREATE TABLE notes (id serial PRIMARY KEY, body text);\"."
      - token: "-c"
        text: "A flag of the command inside the container: -c. In this command it belongs to psql, which runs one SQL statement."
      - token: "\"INSERT INTO notes (body) VALUES ('survives a restart');\""
        text: "An argument of the command inside the container: \"INSERT INTO notes (body) VALUES ('survives a restart');\"."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "pod"
        text: "The resource type."
      - token: "pg-0"
        text: "The object name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "wait"
        text: "Wait for a condition on one or more resources."
      - token: "--for=condition=Ready"
        text: "The condition to wait for. The wait command takes --for. This command passes condition=Ready."
      - token: "pod/pg-0"
        text: "The resource written as type/name: pod/pg-0."
      - token: "--timeout=120s"
        text: "How long to wait before giving up. This command passes 120s."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "pg-0"
        text: "An argument of this command: pg-0."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "psql"
        text: "The Postgres client."
      - token: "-U"
        text: "A flag of the command inside the container: -U."
      - token: "postgres"
        text: "An argument of the command inside the container: postgres."
      - token: "-c"
        text: "A flag of the command inside the container: -c. In this command it belongs to psql, which runs one SQL statement."
      - token: "\"SELECT * FROM notes;\""
        text: "An argument of the command inside the container: \"SELECT * FROM notes;\"."
```

```rail
id: "run-psql-psql"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "run"
        text: "Create and run a particular image in a pod. The run synopsis is kubectl run NAME --image=image."
      - token: "psql"
        text: "The NAME in kubectl run NAME. This command names the Pod psql."
      - token: "--image=postgres:18-alpine"
        text: "The image for the container to run. This command passes postgres:18-alpine."
      - token: "--restart=Never"
        text: "The restart policy for this Pod. The run docs list Always, OnFailure and Never. This command passes Never."
      - token: "--rm"
        text: "If true, delete the Pod after it exits. The run docs say this is only valid when attaching to the container."
      - token: "-i"
        text: "Short form of --stdin. Pass stdin to the container."
      - token: "--quiet"
        text: "Suppress the extra messages kubectl would otherwise print."
      - token: "--env=PGPASSWORD=learning-only-change-me"
        text: "An environment variable for the container, as KEY=VALUE. This command passes PGPASSWORD=learning-only-change-me."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "psql"
        text: "The Postgres client."
      - token: "-h"
        text: "A flag of the command inside the container: -h."
      - token: "pg-0.pg"
        text: "An argument of the command inside the container: pg-0.pg."
      - token: "-U"
        text: "A flag of the command inside the container: -U."
      - token: "postgres"
        text: "An argument of the command inside the container: postgres."
      - token: "-c"
        text: "A flag of the command inside the container: -c."
      - token: "\"SELECT now(), body FROM notes;\""
        text: "An argument of the command inside the container: \"SELECT now(), body FROM notes;\"."
```

```rail
id: "patch-statefulset-pg"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "patch"
        text: "Update fields of a resource using a strategic merge patch, a JSON merge patch, or a JSON patch. The patch docs say JSON and YAML are accepted."
      - token: "statefulset"
        text: "The resource type."
      - token: "pg"
        text: "The object name."
      - token: "--type=merge"
        text: "The type of patch being provided. The patch docs list json, merge and strategic, and the default is strategic. merge is a JSON merge patch."
      - token: "-p"
        text: "Short form of --patch. The patch to be applied to the resource JSON file. The patch examples pass it as JSON."
      - token: "'{\"spec\":{\"persistentVolumeClaimRetentionPolicy\":{\"whenDeleted\":\"Delete\",\"whenScaled\":\"Retain\"}}}'"
        text: "A quoted argument in this command."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "statefulset"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "pg"
        text: "The object name."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath='{.spec.persistentVolumeClaimRetentionPolicy}{\"\\n\"}'"
        text: "jsonpath is an output format. A template is JSONPath expressions in curly braces. The JSONPath page says a double-quoted string inserts text, and its example uses a quoted backslash-n for a newline. This token is the template in the lesson command."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "statefulset"
        text: "The resource type."
      - token: "pg"
        text: "The object name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pvc"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete."
      - token: "pg.yaml"
        text: "The file named by --filename. delete removes the resources that file describes."
      - token: "--ignore-not-found"
        text: "Treat a missing object as a successful delete."
```
