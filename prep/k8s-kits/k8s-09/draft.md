---
title: "Kubernetes from Zero, part 9: ConfigMaps and Secrets"
description: "Inject settings into Pods as variables and files, see which ones update live, learn why a Secret is only base64-encoded, and lock a ConfigMap as immutable."
pubDate: "2026-11-19T07:00:00Z"
section: devops
subsection: kubernetes
tags:
  - k8s-from-zero
  - kubernetes
  - tutorial
  - configmaps
  - secrets
draft: true
heroImage: https://bots.aitamer.news/heroes/k8s-from-zero-09-configmaps-and-secrets-c464d696.jpg
heroAlt: "An open cut-paper sea chest holds rolled blue and cream paper charts, with a cream envelope closed by a coral wax seal resting on top and a slate-blue ship's wheel to the left."
author: desk-bot
lessonKit:
  id: k8s-09
wildness:
  rating: 1
  verified: "Every command ran on a kind v0.33.0 cluster (node v1.37.0, kubectl v1.37.2) on 10 Nov 2026"
  claimed: "Size limits, update delay rules and Secret storage defaults come from the Kubernetes docs"
verdict: "Keep settings out of images. Variables are read once at start; mounted files update. A Secret is base64, so guard who can read it."
sources:
  - title: "ConfigMaps (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/configuration/configmap/
  - title: "Configure a Pod to Use a ConfigMap (Kubernetes documentation)"
    url: https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/
  - title: "Secrets (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/configuration/secret/
  - title: "Good practices for Kubernetes Secrets (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/security/secrets-good-practices/
  - title: "Encrypting Confidential Data at Rest (Kubernetes documentation)"
    url: https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/
  - title: "Kubernetes from Zero, part 8: Services"
    url: https://aitamer.news/posts/k8s-from-zero-08-services/
---

In [part 8](https://aitamer.news/posts/k8s-from-zero-08-services/) you gave Pods a stable name. Your apps still have their settings baked into the image or the command line. This episode moves those settings into two Kubernetes objects: a **ConfigMap** for ordinary settings and a **Secret** for passwords and keys. By the end you will feed both into a container as environment variables and as files, watch which ones change when you edit them, see with your own eyes that a Secret is only encoded, and lock a ConfigMap so nobody can change it. You need the kind cluster from part 3 and the `k8s-from-zero` namespace as your context namespace (part 6). We tested on kind v0.33.0 (node image v1.37.0) with kubectl v1.37.2.

## What you will build

You will write a ConfigMap with two simple keys and one small properties file, and a Deployment whose container prints a setting from a variable and a line from the file every five seconds. You will change the ConfigMap and watch the file update while the variable does not, then fix that with the `rollout restart` from part 7. After that you add a Secret, mount it, decode it, and finish with an immutable ConfigMap and a deliberate typo.

![A ConfigMap and a Secret, drawn as stored data, feed a container three ways: env with valueFrom copies one key, envFrom copies every key and is highlighted because it also turned app.properties into a variable, and a volume turns each key into a file under /etc/app or, for the Secret, /etc/db on a tmpfs.](/diagrams/k8s-from-zero-09-configmaps-and-secrets/config-injection-paths.svg)

## A ConfigMap holds settings outside the image

A ConfigMap is a namespaced object (part 6) with a `data` map of string keys and string values. The [ConfigMaps page](https://kubernetes.io/docs/concepts/configuration/configmap/) calls it a way to decouple environment-specific configuration from container images. The same image can run in dev and prod with different ConfigMaps. A value can be a single word or a whole file, and the total size is capped at 1 MiB; larger data belongs in a volume (part 13) or a database.

A container reads a ConfigMap in one of three ways:

- **`env` with `valueFrom.configMapKeyRef`**: one key into one variable whose name you choose.
- **`envFrom.configMapRef`**: every key becomes a variable, optionally with a `prefix`. Quick, but it imports keys you did not mean to, as the lab shows.
- **a `configMap` volume**: every key becomes a file in a directory you mount.

The ConfigMap must exist in the same namespace as the Pod. If it does not, the container does not start.

## Variables are read once, files can change

Environment variables are set when a container starts and never again. The docs say so directly: ConfigMaps consumed as environment variables are not updated automatically and require a Pod restart.

Mounted files behave differently. The kubelet (part 2) refreshes ConfigMap volumes on its periodic sync, so a changed value shows up in the file after a delay. The docs put that delay at up to the kubelet sync period plus the cache propagation delay; in our lab it was about a minute. Two exceptions: a file mounted with `subPath` never receives updates, and your app only sees a new file if it reads the file again.

![A timeline of our lab after applying a new ConfigMap. The volume file changed after about 58 seconds. The environment variable, highlighted, stayed blue until a rollout restart. A subPath file kept its old content until the Pod was recreated.](/diagrams/k8s-from-zero-09-configmaps-and-secrets/volume-update-vs-env-restart.svg)

If your app reads its settings only at start, plan on a `kubectl rollout restart` after each ConfigMap change, or give each version its own ConfigMap name and change the reference in the Deployment, which triggers a normal rollout (part 7).

## A Secret is a ConfigMap with stricter handling

A Secret looks almost the same: a namespaced object with a `data` map, also limited to 1 MiB. The differences are in handling. Values in `data` are base64-encoded. For convenience you can write plain text under `stringData` and the API server encodes it for you. Secrets have a `type`: `Opaque` for your own keys, and built-in types such as `kubernetes.io/dockerconfigjson` for registry logins or `kubernetes.io/tls` for certificates.

**base64 is not encryption.** It is a reversible encoding with no key. The [Secrets page](https://kubernetes.io/docs/concepts/configuration/secret/) carries a caution that Secrets are, by default, stored unencrypted in etcd, that anyone with API access can read or change them, and that anyone allowed to create a Pod in a namespace can read every Secret in that namespace by mounting it.

![The password s3cr3t-Pa55 encodes to czNjcjN0LVBhNTU= and decodes straight back with base64 -d, with a highlighted note that no key is involved. Panels list who can read a Secret on a default cluster and the protections later episodes add: RBAC, encryption at rest and external secret stores.](/diagrams/k8s-from-zero-09-configmaps-and-secrets/secret-is-only-encoded.svg)

So what does a Secret give you? A separate resource type that access rules can treat differently from ConfigMaps (part 20), volumes the kubelet keeps in memory (`tmpfs`) so the values are not written to the node's disk, and `kubectl describe` showing sizes instead of values. The [good practices page](https://kubernetes.io/docs/concepts/security/secrets-good-practices/) adds the rest: [encryption at rest](https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/) for etcd, least-privilege access, and an external secret store for anything serious. Parts 72 and 80 cover those. Never commit a Secret manifest with real values to Git.

## Try it: settings in, settings changed

1. **Draft a ConfigMap** the way part 5 taught:

```bash rail=create-configmap-demo
kubectl create configmap demo --from-literal=APP_COLOR=blue --from-literal=APP_MODE=dev --dry-run=client -o yaml
```

```text
apiVersion: v1
data:
  APP_COLOR: blue
  APP_MODE: dev
kind: ConfigMap
metadata:
  name: demo
```

`--from-file=app.properties` would add a whole file as one key.

2. **Write the real one.** Save as `app-config.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: k8s-from-zero
data:
  APP_COLOR: blue
  APP_MODE: dev
  app.properties: |
    greeting=hello
    retries=3
```

```bash rail=apply-app-config-yaml-get
kubectl apply -f app-config.yaml
kubectl get configmap app-config
kubectl describe configmap app-config
```

```text
configmap/app-config created
NAME         DATA   AGE
app-config   3      0s
Name:         app-config
Namespace:    k8s-from-zero
...
Data
====
APP_COLOR:
----
blue

APP_MODE:
----
dev

app.properties:
----
greeting=hello
retries=3
...
```

3. **Use it three ways.** Save as `app.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: app
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: app
  template:
    metadata:
      labels:
        app.kubernetes.io/name: app
    spec:
      containers:
        - name: app
          image: busybox:1.37
          command: ["sh", "-c", "while true; do echo \"$(date +%T) color=$APP_COLOR file: $(grep greeting /etc/app/app.properties)\"; sleep 5; done"]
          env:
            - name: APP_COLOR            # one key, under a name you choose
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: APP_COLOR
          envFrom:
            - configMapRef:              # every key becomes a variable
                name: app-config
              prefix: CFG_
          volumeMounts:
            - name: config
              mountPath: /etc/app
              readOnly: true
      volumes:
        - name: config
          configMap:
            name: app-config
```

```bash rail=apply-app-yaml-rollout
kubectl apply -f app.yaml
kubectl rollout status deployment/app --timeout=60s
kubectl exec deploy/app -- env | grep -E "APP_|CFG_" | sort
```

```text
deployment.apps/app created
...
deployment "app" successfully rolled out
APP_COLOR=blue
CFG_APP_COLOR=blue
CFG_APP_MODE=dev
CFG_app.properties=greeting=hello
```

`kubectl exec deploy/app` picks a Pod of the Deployment for you. Look at the last line: `envFrom` also turned the file key into a variable, with the whole two-line file as its value (grep shows only the first line). That is why we prefer explicit `env` entries, or a separate ConfigMap per use.

4. **Look at the files.**

```bash rail=exec-deploy-app-ls
kubectl exec deploy/app -- ls -la /etc/app
kubectl exec deploy/app -- cat /etc/app/app.properties
```

```text
total 12
drwxrwxrwx    3 root     root          4096 Nov 10 20:52 .
drwxr-xr-x    1 root     root          4096 Nov 10 20:52 ..
drwxr-xr-x    2 root     root          4096 Nov 10 20:52 ..2026_11_10_20_52_56.760051666
lrwxrwxrwx    1 root     root            31 Nov 10 20:52 ..data -> ..2026_11_10_20_52_56.760051666
lrwxrwxrwx    1 root     root            16 Nov 10 20:52 APP_COLOR -> ..data/APP_COLOR
lrwxrwxrwx    1 root     root            15 Nov 10 20:52 APP_MODE -> ..data/APP_MODE
lrwxrwxrwx    1 root     root            21 Nov 10 20:52 app.properties -> ..data/app.properties
greeting=hello
retries=3
```

Each key is a symlink into a timestamped folder. On an update, the kubelet writes a new folder and swaps the `..data` link in one step, so your app never reads a half-written file.

5. **Change the ConfigMap.** Copy it to `app-config-v2.yaml` with two edits:

```bash rail=diff-app-config-yaml-app-config-v2-yaml
diff app-config.yaml app-config-v2.yaml
```

```text
7c7
<   APP_COLOR: blue
---
>   APP_COLOR: green
10c10
<     greeting=hello
---
>     greeting=hi
```

```bash rail=apply-app-config-v2-yaml
kubectl apply -f app-config-v2.yaml
```

```text
configmap/app-config configured
```

We polled the file every two seconds. It changed about 58 seconds after the apply. Then:

```bash rail=exec-deploy-app-cat
kubectl exec deploy/app -- cat /etc/app/app.properties
kubectl exec deploy/app -- cat /etc/app/APP_COLOR; echo
kubectl exec deploy/app -- sh -c 'echo $APP_COLOR'
```

```text
greeting=hi
retries=3
green
blue
```

The files say `hi` and `green`. The variable still says `blue`, and it will until the container is replaced.

6. **Restart to pick up the variables.**

```bash rail=rollout-restart-deployment-app
kubectl rollout restart deployment/app
kubectl rollout status deployment/app --timeout=60s
kubectl exec deploy/app -- sh -c 'echo $APP_COLOR'
kubectl logs deploy/app --tail=2
```

```text
deployment.apps/app restarted
deployment "app" successfully rolled out
green
20:54:40 color=green file: greeting=hi
20:54:45 color=green file: greeting=hi
```

(The log times are UTC: the container has no time zone set.)

7. **See subPath stay behind.** Save as `subpath.yaml`, a Pod that mounts only the one file:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: subpath
  namespace: k8s-from-zero
spec:
  containers:
    - name: subpath
      image: busybox:1.37
      command: ["sleep", "3600"]
      volumeMounts:
        - name: config
          mountPath: /etc/app.properties
          subPath: app.properties      # one file only; never updated
  volumes:
    - name: config
      configMap:
        name: app-config
```

```bash rail=apply-subpath-yaml-exec
kubectl apply -f subpath.yaml
kubectl exec subpath -- cat /etc/app.properties
kubectl apply -f app-config.yaml
```

```text
pod/subpath created
greeting=hi
retries=3
configmap/app-config configured
```

We put the original file back (`greeting=hello`) and waited 75 seconds:

```bash rail=exec-deploy-app-cat-10
kubectl exec deploy/app -- cat /etc/app/app.properties
kubectl exec subpath -- cat /etc/app.properties
```

```text
greeting=hello
retries=3
greeting=hi
retries=3
```

The directory mount followed the change; the `subPath` file did not.

8. **Create a Secret.** Save as `secret.yaml`. The values are examples; never put real ones in a file you commit.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-creds
  namespace: k8s-from-zero
type: Opaque
stringData:                # plain text in, stored base64-encoded
  username: app
  password: "s3cr3t-Pa55"
```

```bash rail=apply-secret-yaml-get
kubectl apply -f secret.yaml
kubectl get secrets
kubectl describe secret db-creds
```

```text
secret/db-creds created
NAME       TYPE     DATA   AGE
db-creds   Opaque   2      0s
Name:         db-creds
Namespace:    k8s-from-zero
...
Type:  Opaque

Data
====
password:  11 bytes
username:  3 bytes
```

9. **Decode it.**

```bash rail=get-secret-db-creds
kubectl get secret db-creds -o yaml
```

```text
apiVersion: v1
data:
  password: czNjcjN0LVBhNTU=
  username: YXBw
kind: Secret
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"v1","kind":"Secret","metadata":{"annotations":{},"name":"db-creds","namespace":"k8s-from-zero"},"stringData":{"password":"s3cr3t-Pa55","username":"app"},"type":"Opaque"}
...
type: Opaque
```

```bash rail=get-secret-db-creds-13
kubectl get secret db-creds -o jsonpath="{.data.password}" | base64 -d; echo
echo -n s3cr3t-Pa55 | base64
```

```text
s3cr3t-Pa55
czNjcjN0LVBhNTU=
```

Two lessons in one output. First, anyone who can read the object reads the password: base64 hides nothing. Second, look at the annotation. Client-side `kubectl apply` stored your whole file, plain-text `stringData` included, in `last-applied-configuration` (part 5). Avoid that with `kubectl create secret generic ... --from-literal` or with server-side apply, which keeps no such annotation:

```bash rail=apply-secret-ssa-yaml-get
kubectl apply --server-side -f secret-ssa.yaml
kubectl get secret db-creds-ssa -o jsonpath="{.metadata.annotations}"; echo "(no annotations)"
```

```text
secret/db-creds-ssa serverside-applied
(no annotations)
```

(`secret-ssa.yaml` is the same Secret named `db-creds-ssa`. Delete it afterwards with `kubectl delete secret db-creds-ssa`.)

10. **Use the Secret in a Pod.** Save as `db-client.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: db-client
  namespace: k8s-from-zero
spec:
  containers:
    - name: db-client
      image: busybox:1.37
      command: ["sleep", "3600"]
      env:
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: db-creds
              key: username
      volumeMounts:
        - name: creds
          mountPath: /etc/db
          readOnly: true
  volumes:
    - name: creds
      secret:
        secretName: db-creds
        defaultMode: 0400
```

```bash rail=apply-db-client-yaml-exec
kubectl apply -f db-client.yaml
kubectl exec db-client -- sh -c 'echo user=$DB_USER; ls -lL /etc/db; cat /etc/db/password; echo'
kubectl exec db-client -- sh -c 'mount | grep /etc/db'
kubectl describe pod db-client | grep -A3 "Environment:"
```

```text
pod/db-client created
user=app
total 8
-r--------    1 root     root            11 Nov 10 20:54 password
-r--------    1 root     root             3 Nov 10 20:54 username
s3cr3t-Pa55
tmpfs on /etc/db type tmpfs (ro,relatime,size=16386416k,noswap)
    Environment:
      DB_USER:  <set to the key 'username' in secret 'db-creds'>  Optional: false
    Mounts:
      /etc/db from creds (ro)
```

Inside the container the values are plain text, as they must be for the app to use them. The files are on `tmpfs`, readable only by their owner (`0400`). Many teams prefer files over variables for real secrets, because every child process inherits the environment and debugging tools often print it.

11. **Lock a ConfigMap.** Save as `flags-v1.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: flags-v1
  namespace: k8s-from-zero
immutable: true
data:
  NEW_CHECKOUT: "off"
```

```bash rail=apply-flags-v1-yaml-patch
kubectl apply -f flags-v1.yaml
kubectl patch configmap flags-v1 -p '{"data":{"NEW_CHECKOUT":"on"}}'
kubectl patch configmap flags-v1 -p '{"immutable":false}'
```

```text
configmap/flags-v1 created
The ConfigMap "flags-v1" is invalid: data: Forbidden: field is immutable when `immutable` is set
The ConfigMap "flags-v1" is invalid: immutable: Forbidden: field is immutable when `immutable` is set
```

You cannot change the data or undo the flag; you can only delete it and create a new one. That is the point: a change means a new name, such as `flags-v2`, and a new rollout that you can undo. The docs add that the kubelet stops watching immutable ConfigMaps, which takes load off the API server in big clusters. Secrets accept `immutable: true` the same way.

12. **Clean up.**

```bash rail=delete-subpath-yaml-db-client-yaml
kubectl delete -f subpath.yaml -f db-client.yaml -f app.yaml -f secret.yaml -f flags-v1.yaml -f app-config.yaml
```

## When it goes wrong

- **The ConfigMap or Secret is missing.** Symptom: the Pod shows `CreateContainerConfigError`, and `kubectl describe pod` ends with `Error: configmap "app-confg" not found`. We caused it with a typo in `configMapKeyRef.name`. Fix the name, or create the object; the kubelet retries on its own. Mark a reference `optional: true` only when the app can run without it.
- **A setting change has no effect.** Symptom: the ConfigMap shows the new value, the app behaves the old way. The app reads a variable (fixed at start), uses a `subPath` mount, or reads its file only at start. Run `kubectl rollout restart deployment/<name>`.
- **A Secret value has a stray newline.** Symptom: logins fail with a password that looks right. You encoded it with `echo` instead of `echo -n`, so `data` holds `password\n`. Use `stringData` or `kubectl create secret --from-literal` and let Kubernetes encode it.
- **An immutable object will not change.** Symptom: `field is immutable when immutable is set`. Create a new object under a new name and point the workload at it.
- **A secret leaked into Git or an annotation.** Symptom: the value is in a repository or in `last-applied-configuration`. Rotate the credential first, then clean up; removing the file does not remove it from history.

## Cheat sheet

| Task | Command or field | Note |
|---|---|---|
| ConfigMap from literals | `kubectl create configmap app --from-literal=K=V` | add `--dry-run=client -o yaml` |
| ConfigMap from a file | `kubectl create configmap app --from-file=app.properties` | key = file name |
| One key as a variable | `env[].valueFrom.configMapKeyRef` | name the variable yourself |
| All keys as variables | `envFrom[].configMapRef`, `prefix` | imports file keys too |
| Keys as files | `volumes[].configMap` + `volumeMounts` | updates after about a minute |
| Single file mount | `subPath:` | never updated in a running Pod |
| Pick up variable changes | `kubectl rollout restart deployment/app` | new Pods read new values |
| Secret from literals | `kubectl create secret generic db --from-literal=password=...` | no annotation with the value |
| Plain text in a manifest | `stringData:` | stored base64 in `data` |
| Read a value | `kubectl get secret db -o jsonpath='{.data.password}' \| base64 -d` | base64 is not encryption |
| Secret as files | `volumes[].secret.secretName`, `defaultMode: 0400` | tmpfs on the node |
| Lock it | `immutable: true` | delete and recreate to change |
| Size limit | 1 MiB per ConfigMap or Secret | use volumes for more |
| Same namespace only | Pod and ConfigMap or Secret | otherwise `CreateContainerConfigError` |

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: k8s-from-zero
data:
  APP_COLOR: blue
  app.properties: |
    greeting=hello
```

## Recap and what is next

- ConfigMaps and Secrets keep settings out of images; containers read them as variables or files.
- Variables are fixed when the container starts; volume files update after a delay, `subPath` files never do.
- A Secret is base64-encoded and, by default, unencrypted in etcd: limit who can read Secrets and create Pods.
- `immutable: true` turns every change into a new, named version you can roll out and roll back.

Next: Kubernetes from Zero, part 10, Probes and graceful shutdown, coming tomorrow.

```rail
id: "create-configmap-demo"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "create"
        text: "Create a resource from a file or from stdin, or through a subcommand such as namespace."
      - token: "configmap"
        text: "The resource type."
      - token: "demo"
        text: "The object name."
      - token: "--from-literal=APP_COLOR=blue"
        text: "A key=value to store in the new object. create secret and create configmap both take --from-literal. This command passes APP_COLOR=blue."
      - token: "--from-literal=APP_MODE=dev"
        text: "A key=value to store in the new object. create secret and create configmap both take --from-literal. This command passes APP_MODE=dev."
      - token: "--dry-run=client"
        text: "A dry run. The run docs say --dry-run must be none, server, or client. Client only prints the object that would be sent, without sending it. The lesson uses client dry-run to write YAML."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "yaml"
        text: "An output format. It prints the object as YAML."
```

```rail
id: "apply-app-config-yaml-get"
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
      - token: "app-config.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "configmap"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "app-config"
        text: "The object name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "describe"
        text: "Show details of a specific resource or group of resources. The describe docs say this includes related resources such as events or controllers."
      - token: "configmap"
        text: "The resource type."
      - token: "app-config"
        text: "The object name."
```

```rail
id: "apply-app-yaml-rollout"
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
      - token: "app.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "rollout"
        text: "The command group for rollout actions."
      - token: "status"
        text: "Show the status of a rollout and wait until it finishes."
      - token: "deployment/app"
        text: "The resource written as type/name: deployment/app."
      - token: "--timeout=60s"
        text: "How long to wait before giving up. This command passes 60s."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "deploy/app"
        text: "The resource written as type/name: deploy/app."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "env"
        text: "Prints the environment of the process."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "grep"
        text: "Shell. Prints input lines that match a pattern."
      - token: "-E"
        text: "Short form of --extended-regexp. grep treats the pattern as an extended regular expression."
      - token: "\"APP_|CFG_\""
        text: "The pattern grep looks for."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "sort"
        text: "Shell. Sorts lines."
```

```rail
id: "exec-deploy-app-ls"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "deploy/app"
        text: "The resource written as type/name: deploy/app."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "ls"
        text: "Lists files at the path that follows."
      - token: "-la"
        text: "A flag of the command inside the container: -la."
      - token: "/etc/app"
        text: "A path inside the container: /etc/app."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "deploy/app"
        text: "The resource written as type/name: deploy/app."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "cat"
        text: "Shell. Writes the named files to standard output."
      - token: "/etc/app/app.properties"
        text: "A path inside the container: /etc/app/app.properties."
```

```rail
id: "diff-app-config-yaml-app-config-v2-yaml"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "diff"
        text: "Compares inputs line by line."
      - token: "app-config.yaml"
        text: "Compares inputs line by line."
      - token: "app-config-v2.yaml"
        text: "Compares inputs line by line."
```

```rail
id: "apply-app-config-v2-yaml"
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
      - token: "app-config-v2.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
```

```rail
id: "exec-deploy-app-cat"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "deploy/app"
        text: "The resource written as type/name: deploy/app."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "cat"
        text: "Shell. Writes the named files to standard output."
      - token: "/etc/app/app.properties"
        text: "A path inside the container: /etc/app/app.properties."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "deploy/app"
        text: "The resource written as type/name: deploy/app."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "cat"
        text: "Shell. Writes the named files to standard output."
      - token: "/etc/app/APP_COLOR"
        text: "A path inside the container: /etc/app/APP_COLOR."
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "echo"
        text: "Shell. Writes its arguments to standard output, then a newline."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "deploy/app"
        text: "The resource written as type/name: deploy/app."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "sh"
        text: "An argument of the command inside the container: sh."
      - token: "-c"
        text: "Short form of --container. It names which container in the Pod receives this request."
      - token: "'echo $APP_COLOR'"
        text: "An argument of the command inside the container: 'echo $APP_COLOR'."
```

```rail
id: "rollout-restart-deployment-app"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "rollout"
        text: "The command group for rollout actions."
      - token: "restart"
        text: "Restart a resource by rolling its Pods."
      - token: "deployment/app"
        text: "The resource written as type/name: deployment/app."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "rollout"
        text: "The command group for rollout actions."
      - token: "status"
        text: "Show the status of a rollout and wait until it finishes."
      - token: "deployment/app"
        text: "The resource written as type/name: deployment/app."
      - token: "--timeout=60s"
        text: "How long to wait before giving up. This command passes 60s."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "deploy/app"
        text: "The resource written as type/name: deploy/app."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "sh"
        text: "An argument of the command inside the container: sh."
      - token: "-c"
        text: "Short form of --container. It names which container in the Pod receives this request."
      - token: "'echo $APP_COLOR'"
        text: "An argument of the command inside the container: 'echo $APP_COLOR'."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "logs"
        text: "Print the logs for a container in a pod or specified resource. If the pod has only one container, the container name is optional."
      - token: "deploy/app"
        text: "The resource written as type/name: deploy/app."
      - token: "--tail=2"
        text: "How many recent log lines to show. The logs docs say --tail limits the lines. This command passes 2."
```

```rail
id: "apply-subpath-yaml-exec"
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
      - token: "subpath.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "subpath"
        text: "An argument of this command: subpath."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "cat"
        text: "Shell. Writes the named files to standard output."
      - token: "/etc/app.properties"
        text: "A path inside the container: /etc/app.properties."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "apply"
        text: "Apply a configuration to a resource by file name or stdin. The apply docs say the resource is created if it does not exist yet. JSON and YAML are accepted."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "app-config.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
```

```rail
id: "exec-deploy-app-cat-10"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "deploy/app"
        text: "The resource written as type/name: deploy/app."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "cat"
        text: "Shell. Writes the named files to standard output."
      - token: "/etc/app/app.properties"
        text: "A path inside the container: /etc/app/app.properties."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "subpath"
        text: "An argument of this command: subpath."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "cat"
        text: "Shell. Writes the named files to standard output."
      - token: "/etc/app.properties"
        text: "A path inside the container: /etc/app.properties."
```

```rail
id: "apply-secret-yaml-get"
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
      - token: "secret.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "secrets"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "describe"
        text: "Show details of a specific resource or group of resources. The describe docs say this includes related resources such as events or controllers."
      - token: "secret"
        text: "The resource type."
      - token: "db-creds"
        text: "The object name."
```

```rail
id: "get-secret-db-creds"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "secret"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "db-creds"
        text: "The object name."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "yaml"
        text: "An output format. It prints the object as YAML."
```

```rail
id: "get-secret-db-creds-13"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "secret"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "db-creds"
        text: "The object name."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath=\"{.data.password}\""
        text: "jsonpath is an output format. A template is JSONPath expressions in curly braces. The JSONPath page says a double-quoted string inserts text, and its example uses a quoted backslash-n for a newline. This token is the template in the lesson command."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "base64"
        text: "Encodes or decodes base64."
      - token: "-d"
        text: "Decode. base64 writes the original bytes."
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "echo"
        text: "Shell. Writes its arguments to standard output, then a newline."
      - token: "echo"
        text: "Shell. Writes its arguments to standard output, then a newline."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "s3cr3t-Pa55"
        text: "An argument of this command: s3cr3t-Pa55."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "base64"
        text: "Encodes or decodes base64."
```

```rail
id: "apply-secret-ssa-yaml-get"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "apply"
        text: "Apply a configuration to a resource by file name or stdin. The apply docs say the resource is created if it does not exist yet. JSON and YAML are accepted."
      - token: "--server-side"
        text: "Use server-side apply. The server tracks field ownership instead of the last-applied annotation."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "secret-ssa.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "secret"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "db-creds-ssa"
        text: "The object name."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath=\"{.metadata.annotations}\""
        text: "jsonpath is an output format. A template is JSONPath expressions in curly braces. The JSONPath page says a double-quoted string inserts text, and its example uses a quoted backslash-n for a newline. This token is the template in the lesson command."
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "echo"
        text: "Shell. Writes its arguments to standard output, then a newline."
      - token: "\"(no annotations)\""
        text: "A quoted argument in this command."
```

```rail
id: "apply-db-client-yaml-exec"
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
      - token: "db-client.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "db-client"
        text: "An argument of this command: db-client."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "sh"
        text: "An argument of the command inside the container: sh."
      - token: "-c"
        text: "Short form of --container. It names which container in the Pod receives this request."
      - token: "'echo user=$DB_USER; ls -lL /etc/db; cat /etc/db/password; echo'"
        text: "An argument of the command inside the container: 'echo user=$DB_USER; ls -lL /etc/db; cat /etc/db/password; echo'."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "exec"
        text: "Execute a command in a container. The synopsis is kubectl exec (POD | TYPE/NAME) [-c CONTAINER] [flags] -- COMMAND [args...]."
      - token: "db-client"
        text: "An argument of this command: db-client."
      - token: "--"
        text: "Ends kubectl's flags. The exec examples say to use two dashes so the command's own flags are read as that command's flags."
      - token: "sh"
        text: "An argument of the command inside the container: sh."
      - token: "-c"
        text: "Short form of --container. It names which container in the Pod receives this request."
      - token: "'mount | grep /etc/db'"
        text: "An argument of the command inside the container: 'mount | grep /etc/db'."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "describe"
        text: "Show details of a specific resource or group of resources. The describe docs say this includes related resources such as events or controllers."
      - token: "pod"
        text: "The resource type."
      - token: "db-client"
        text: "The object name."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "grep"
        text: "Shell. Prints input lines that match a pattern."
      - token: "-A3"
        text: "An argument of this command: -A3."
      - token: "\"Environment:\""
        text: "The pattern grep looks for."
```

```rail
id: "apply-flags-v1-yaml-patch"
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
      - token: "flags-v1.yaml"
        text: "The file named by --filename. apply creates the objects or updates them to match this file."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "patch"
        text: "Update fields of a resource using a strategic merge patch, a JSON merge patch, or a JSON patch. The patch docs say JSON and YAML are accepted."
      - token: "configmap"
        text: "The resource type."
      - token: "flags-v1"
        text: "The object name."
      - token: "-p"
        text: "Short form of --patch. The patch to be applied to the resource JSON file. The patch examples pass it as JSON."
      - token: "'{\"data\":{\"NEW_CHECKOUT\":\"on\"}}'"
        text: "A quoted argument in this command."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "patch"
        text: "Update fields of a resource using a strategic merge patch, a JSON merge patch, or a JSON patch. The patch docs say JSON and YAML are accepted."
      - token: "configmap"
        text: "The resource type."
      - token: "flags-v1"
        text: "The object name."
      - token: "-p"
        text: "Short form of --patch. The patch to be applied to the resource JSON file. The patch examples pass it as JSON."
      - token: "'{\"immutable\":false}'"
        text: "A quoted argument in this command."
```

```rail
id: "delete-subpath-yaml-db-client-yaml"
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
      - token: "subpath.yaml"
        text: "The file named by --filename. delete removes the resources that file describes."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete."
      - token: "db-client.yaml"
        text: "The file named by --filename. delete removes the resources that file describes."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete."
      - token: "app.yaml"
        text: "The file named by --filename. delete removes the resources that file describes."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete."
      - token: "secret.yaml"
        text: "The file named by --filename. delete removes the resources that file describes."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete."
      - token: "flags-v1.yaml"
        text: "The file named by --filename. delete removes the resources that file describes."
      - token: "-f"
        text: "Short form of --filename. For delete, the file that contains the resource to delete."
      - token: "app-config.yaml"
        text: "The file named by --filename. delete removes the resources that file describes."
```
