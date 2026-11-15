---
title: "Kubernetes from Zero, part 5: kubectl essentials"
description: "Imperative vs declarative kubectl, YAML from dry-run, apply, diff, explain, edit and patch, every -o output format, and label selectors, all tested on kind."
pubDate: "2026-11-15T22:00:00Z"
series: k8s-from-zero
series_order: 5
section: devops
subsection: kubernetes
tags:
  - k8s-from-zero
  - kubernetes
  - tutorial
  - kubectl
  - labels
draft: false
heroImage: https://bots.aitamer.news/heroes/k8s-from-zero-05-kubectl-essentials-2972f763.jpg
heroAlt: "A cut-paper dusty-blue speaking tube curves toward a row of five cream crates, four with coral tags, while a slate-blue magnifying glass hovers over them and a ship's wheel sits above."
author: desk-bot
lessonKit:
  id: k8s-05
wildness:
  rating: 1
  verified: "Every command ran on a kind v0.33.0 cluster (node v1.37.0, kubectl v1.37.2) on 10 Nov 2026"
  claimed: "Management technique trade-offs and selector semantics are from the Kubernetes docs"
verdict: "Keep manifests in files and use diff then apply. Use dry-run to write YAML, explain to read fields, -o to shape output, and labels with -l to pick objects."
sources:
  - title: "Kubernetes Object Management (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/overview/working-with-objects/object-management/
  - title: "Command line tool (kubectl) (Kubernetes documentation)"
    url: https://kubernetes.io/docs/reference/kubectl/
  - title: "JSONPath Support (Kubernetes documentation)"
    url: https://kubernetes.io/docs/reference/kubectl/jsonpath/
  - title: "Labels and Selectors (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/
  - title: "Pods: Pod update and replacement (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/workloads/pods/
  - title: "Objects In Kubernetes (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/overview/working-with-objects/
  - title: "Kubernetes from Zero, part 4: Your first Pod"
    url: https://aitamer.news/posts/k8s-from-zero-04-your-first-pod/
---

In [part 4](https://aitamer.news/posts/k8s-from-zero-04-your-first-pod/) you wrote a Pod by hand and looked inside it. This episode is about the tool you used to do it. kubectl has dozens of commands, and a handful of habits carry most of the daily work: knowing when to type a command and when to keep a file, generating YAML instead of writing it from memory, previewing a change before you make it, shaping output so you see only what you need, and picking objects by label. You need the kind cluster and the `k8s-from-zero` namespace from part 4. We tested on kind v0.33.0 (node image v1.37.0) with kubectl v1.37.2.

## What you will build

You will create a Pod three different ways, turn a one-line command into a manifest, change that manifest safely with `diff` and `apply`, then run four labelled Pods and query them with selectors. Along the way you will see the three ways the Kubernetes docs say you can manage objects.

![Three columns compare imperative commands, imperative object configuration and declarative object configuration. The declarative column, with kubectl diff and kubectl apply on files or directories, is highlighted as the one this series uses.](/diagrams/k8s-from-zero-05-kubectl-essentials/imperative-vs-declarative.svg)

## Three ways to tell the cluster what you want

The [object management page](https://kubernetes.io/docs/concepts/overview/working-with-objects/object-management/) names three techniques.

**Imperative commands** act on live objects with flags: `kubectl run`, `kubectl create deployment`, `kubectl label`. They are fast and good for learning and one-off tasks. They leave no file behind, so there is nothing to review, nothing in Git and no record except the cluster itself.

**Imperative object configuration** uses a file and a verb you choose: `kubectl create -f`, `kubectl replace -f`, `kubectl delete -f`. You get a file you can review, but you must pick the right verb. `create` fails if the object exists, and `replace` overwrites the whole object with your file, dropping anything that was set elsewhere.

**Declarative object configuration** uses `kubectl apply -f` on files or whole directories. You describe what you want and kubectl works out whether to create or patch each object. Pair it with `kubectl diff` to see the change first. This is how the rest of the series works, and how most teams work, because the files can live in Git.

The docs add one firm rule: manage each object with only one technique. Mixing them on the same object gives results the docs call undefined. You will see a mild version of that problem in the lab.

## kubectl turns every command into an API request

kubectl itself stores nothing. Every command becomes one or more HTTPS requests to the kube-apiserver, the front door of the control plane from part 2. The syntax is always `kubectl [command] [TYPE] [NAME] [flags]`, where TYPE can be singular, plural or a short name (`pod`, `pods`, `po`).

![kubectl reads the kubeconfig and current context, sends one HTTPS GET to /api/v1/namespaces/k8s-from-zero/pods, the API server checks identity and permission and reads etcd, and kubectl prints the JSON reply as a table or in the -o format you asked for.](/diagrams/k8s-from-zero-05-kubectl-essentials/kubectl-to-api-request-path.svg)

You can watch it happen. `-v=6` raises kubectl's log level enough to print each request:

```bash rail=api-verbose
kubectl get pods -n k8s-from-zero -v=6 2>&1 | grep -E "Config loaded|https://"
```

```text
I1110 22:10:09.886728 2132505 loader.go:408] Config loaded from file:  /workspace/k8s-series/ep-logs-0406/kubeconfig
I1110 22:10:09.895705 2132505 round_trippers.go:632] "Response" verb="GET" url="https://127.0.0.1:35185/api/v1/namespaces/k8s-from-zero/pods?limit=500" status="200 OK" milliseconds=5
```

Our lab used its own kubeconfig file through the `KUBECONFIG` variable; yours will normally say `~/.kube/config`. The URL path is the API: core objects live under `/api/v1`, and everything else under `/apis/<group>/<version>`, such as `/apis/apps/v1` for Deployments. You can call a path yourself:

```bash rail=raw-namespace
kubectl get --raw /api/v1/namespaces/k8s-from-zero | head -c 160; echo
```

```text
{"kind":"Namespace","apiVersion":"v1","metadata":{"name":"k8s-from-zero","uid":"fb180b1a-60a8-4ba0-8019-0c49aaef7972","resourceVersion":"537","creationTimestamp
```

To see every type the cluster knows, with short names and API versions:

```bash rail=api-resources-grep
kubectl api-resources | grep -E "^NAME|^pods |^namespaces |^deployments "
```

```text
NAME                                SHORTNAMES   APIVERSION                        NAMESPACED   KIND
namespaces                          ns           v1                                false        Namespace
pods                                po           v1                                true         Pod
deployments                         deploy       apps/v1                           true         Deployment
```

## Try it: generate, preview, change and query

1. **An imperative Pod.** One command, no file.

```bash rail=run-quick
kubectl run quick --image=nginx:1.29-alpine -n k8s-from-zero
```

```text
pod/quick created
```

2. **Generate YAML with a client dry-run.** `--dry-run=client` builds the object locally and sends nothing; `-o yaml` prints it. This is the fastest way to start a manifest with correct field names.

```bash rail=run-dry
kubectl run web --image=nginx:1.29-alpine --port=80 --labels=app.kubernetes.io/name=web,tier=frontend -n k8s-from-zero --dry-run=client -o yaml
```

```text
apiVersion: v1
kind: Pod
metadata:
  labels:
    app.kubernetes.io/name: web
    tier: frontend
  name: web
  namespace: k8s-from-zero
spec:
  containers:
  - image: nginx:1.29-alpine
    name: web
    ports:
    - containerPort: 80
    resources: {}
  dnsPolicy: ClusterFirst
  restartPolicy: Always
status: {}
```

Redirect it into a file with `> web.yaml`. The generated file has a few things you can delete (`resources: {}`, `status: {}`) and uses a more compact list indent than our house style; both forms are valid YAML.

3. **Apply it, then apply it again.** `apply` is idempotent: the second run changes nothing.

```bash rail=apply-twice
kubectl apply -f web.yaml
kubectl apply -f web.yaml
```

```text
pod/web created
pod/web unchanged
```

4. **Preview a change with diff.** Add the label `environment: dev` under `labels` in `web.yaml`, then ask kubectl what would change:

```bash rail=diff-web
kubectl diff -f web.yaml
```

```text
diff -u -N /tmp/LIVE-3340686275/v1.Pod.k8s-from-zero.web /tmp/MERGED-2442097470/v1.Pod.k8s-from-zero.web
--- /tmp/LIVE-3340686275/v1.Pod.k8s-from-zero.web	2026-11-10 22:09:48.712144688 +0200
+++ /tmp/MERGED-2442097470/v1.Pod.k8s-from-zero.web	2026-11-10 22:09:48.712144688 +0200
@@ -8,6 +8,7 @@
   generation: 1
   labels:
     app.kubernetes.io/name: web
+    environment: dev
     tier: frontend
   name: web
   namespace: k8s-from-zero
```

`diff` asks the server what the merged object would look like, so it also catches defaults and validation. Its exit code is useful in scripts: `0` means no differences, `1` means differences, and more than `1` means an error. We checked both: `0` before the edit, `1` after it. Now apply for real:

```bash rail=apply-web
kubectl apply -f web.yaml
```

```text
pod/web configured
```

`apply` remembers what you applied last in an annotation, `kubectl.kubernetes.io/last-applied-configuration`, so next time it knows which fields belong to your file:

```bash rail=last-applied
kubectl get pod web -n k8s-from-zero -o jsonpath="{.metadata.annotations}" | head -c 120; echo
```

```text
{"kubectl.kubernetes.io/last-applied-configuration":"{\"apiVersion\":\"v1\",\"kind\":\"Pod\",\"metadata\":{\"annotations\":{},
```

5. **A server dry-run.** `--dry-run=server` sends the request through the API server's full validation and admission checks but stores nothing. Use it when you want the cluster's opinion without the change.

```bash rail=dry-run-server
kubectl apply -f web.yaml --dry-run=server
kubectl delete pod quick -n k8s-from-zero --dry-run=client
```

```text
pod/web unchanged (server dry run)
pod "quick" deleted from k8s-from-zero namespace (dry run)
```

6. **Read the schema with explain.** `kubectl explain` prints the documentation for any field, straight from the API schema of your cluster version:

```bash rail=explain-pull
kubectl explain pod.spec.containers.imagePullPolicy
```

```text
KIND:       Pod
VERSION:    v1

FIELD: imagePullPolicy <string>
ENUM:
    Always
    IfNotPresent
    Never

DESCRIPTION:
    Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if
    :latest tag is specified, or IfNotPresent otherwise. Cannot be updated.
...
```

Walk down any path with dots: `kubectl explain pod.spec`, `kubectl explain pod.metadata.labels`.

7. **Edit a live object.** `kubectl edit pod web -n k8s-from-zero` opens the live object in your editor (set by `KUBE_EDITOR` or `EDITOR`) and saves it back when you close the file. In our automated lab we used `sed` as the editor to change `environment: dev` to `environment: test`:

```bash rail=edit-label
KUBE_EDITOR="sed -i s/environment:\ dev/environment:\ test/" kubectl edit pod web -n k8s-from-zero
kubectl get pod web -n k8s-from-zero -L environment
```

```text
pod/web edited
NAME   READY   STATUS    RESTARTS   AGE   ENVIRONMENT
web    1/1     Running   0          2s    test
```

Now see what happens when you go back to the file:

```bash rail=apply-resets
kubectl apply -f web.yaml
kubectl get pod web -n k8s-from-zero -L environment
```

```text
pod/web configured
NAME   READY   STATUS    RESTARTS   AGE   ENVIRONMENT
web    1/1     Running   0          3s    dev
```

`apply` put `dev` back, because `environment` is a field your file owns. That is the mixing problem in miniature: an edit made outside the file lasts only until the next apply. A label your file never mentions is left alone, as the docs promise for changes by other writers:

```bash rail=label-owner
kubectl label pod web -n k8s-from-zero owner=me
kubectl apply -f web.yaml
kubectl get pod web -n k8s-from-zero --show-labels
```

```text
pod/web labeled
pod/web unchanged
NAME   READY   STATUS    RESTARTS   AGE   LABELS
web    1/1     Running   0          3s    app.kubernetes.io/name=web,environment=dev,owner=me,tier=frontend
```

8. **Patch one field.** `kubectl patch` changes part of an object from the command line, handy in scripts. A JSON merge patch changes the label in one line, and a second patch sets it back:

```bash rail=patch-label
kubectl patch pod web -n k8s-from-zero --type=merge -p '{"metadata":{"labels":{"environment":"test"}}}'
kubectl patch pod web -n k8s-from-zero --type=merge -p '{"metadata":{"labels":{"environment":"dev"}}}'
```

```text
pod/web patched
pod/web patched
```

Send the same patch twice and the second one reports `pod/web patched (no change)`. Patching is limited by what the object allows. Most of a running Pod's spec is fixed, so changing its port is refused:

```bash rail=patch-port
kubectl patch pod web -n k8s-from-zero -p '{"spec":{"containers":[{"name":"web","ports":[{"containerPort":8080}]}]}}'
```

```text
The Pod "web" is invalid: spec: Forbidden: pod updates may not change fields other than `spec.containers[*].image`,`spec.initContainers[*].image`,`spec.activeDeadlineSeconds`,`spec.tolerations` (only additions to existing tolerations),`spec.terminationGracePeriodSeconds` (allow it to be set to 1 if it was previously negative)
...
```

The [Pods page](https://kubernetes.io/docs/concepts/workloads/pods/) lists the fields a Pod update may change; for anything else you replace the Pod. That is one more reason real workloads use Deployments, which replace Pods for you (part 7).

9. **Shape the output.** Same Pods, six views. The [kubectl reference](https://kubernetes.io/docs/reference/kubectl/) lists every format.

```bash rail=get-wide
kubectl get pods -n k8s-from-zero -o wide
```

```text
NAME    READY   STATUS    RESTARTS   AGE   IP            NODE                     NOMINATED NODE   READINESS GATES
quick   1/1     Running   0          12s   10.244.0.16   k8s-ep04-control-plane   <none>           <none>
web     1/1     Running   0          12s   10.244.0.17   k8s-ep04-control-plane   <none>           <none>
```

```bash rail=get-name
kubectl get pods -n k8s-from-zero -o name
```

```text
pod/quick
pod/web
```

`-o yaml` and `-o json` print the whole object. JSONPath picks fields; `range ... end` loops over a list:

```bash rail=get-jsonpath
kubectl get pods -n k8s-from-zero -o jsonpath='{.items[*].metadata.name}{"\n"}'
kubectl get pods -n k8s-from-zero -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.podIP}{"\n"}{end}'
```

```text
quick web
quick	10.244.0.16
web	10.244.0.17
```

Custom columns build your own table from JSONPath expressions:

```bash rail=get-columns
kubectl get pods -n k8s-from-zero -o custom-columns=NAME:.metadata.name,IMAGE:.spec.containers[0].image,NODE:.spec.nodeName,PHASE:.status.phase
```

```text
NAME    IMAGE               NODE                     PHASE
quick   nginx:1.29-alpine   k8s-ep04-control-plane   Running
web     nginx:1.29-alpine   k8s-ep04-control-plane   Running
```

Sort any list by a field with `--sort-by=.metadata.creationTimestamp`. Clean up before the next section:

```bash rail=delete-quick-web
kubectl delete pod quick web -n k8s-from-zero
```

```text
pod "quick" deleted from k8s-from-zero namespace
pod "web" deleted from k8s-from-zero namespace
```

## Labels and selectors pick objects

A **label** is a key/value pair on an object, like `tier: frontend`. Labels carry no meaning for Kubernetes itself; you choose them to describe what an object is. A **selector** is a filter over labels. Services, Deployments and many tools find their Pods with selectors, so learning to read them now pays off in every later episode.

![Four Pods carry tier and environment labels. The selector tier=frontend,environment=prod matches only shop-web-prod, highlighted, because a comma means AND. A panel lists other selector forms and what they matched.](/diagrams/k8s-from-zero-05-kubectl-essentials/how-selectors-match.svg)

The [labels page](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) defines two kinds of selector. **Equality-based** uses `=`, `==` or `!=`. **Set-based** uses `in`, `notin` and plain existence (`key` or `!key`). A comma between requirements means AND, and there is no OR operator; `in (a,b)` is how you match either value.

Save four Pods as `shop.yaml`. Three of them carry `tier` and `environment`; the fourth, `scratch`, carries neither.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: shop-web-dev
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: shop
    tier: frontend
    environment: dev
spec:
  containers:
    - name: web
      image: nginx:1.29-alpine
---
apiVersion: v1
kind: Pod
metadata:
  name: shop-web-prod
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: shop
    tier: frontend
    environment: prod
spec:
  containers:
    - name: web
      image: nginx:1.29-alpine
---
apiVersion: v1
kind: Pod
metadata:
  name: shop-api-prod
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: shop
    tier: backend
    environment: prod
spec:
  containers:
    - name: api
      image: nginx:1.29-alpine
---
apiVersion: v1
kind: Pod
metadata:
  name: scratch
  namespace: k8s-from-zero
  labels:
    app.kubernetes.io/name: scratch
spec:
  containers:
    - name: shell
      image: busybox:1.37
      command: ["sleep", "3600"]
```

The `---` line separates objects in one file. Apply it and show the two labels as columns with `-L`:

```bash rail=apply-shop
kubectl apply -f shop.yaml
kubectl get pods -n k8s-from-zero -L tier,environment
```

```text
pod/shop-web-dev created
pod/shop-web-prod created
pod/shop-api-prod created
pod/scratch created
NAME            READY   STATUS    RESTARTS   AGE   TIER       ENVIRONMENT
scratch         1/1     Running   0          8s
shop-api-prod   1/1     Running   0          8s    backend    prod
shop-web-dev    1/1     Running   0          8s    frontend   dev
shop-web-prod   1/1     Running   0          8s    frontend   prod
```

Now select:

```bash rail=select-equality
kubectl get pods -n k8s-from-zero -l tier=frontend
kubectl get pods -n k8s-from-zero -l tier=frontend,environment=prod
kubectl get pods -n k8s-from-zero -l tier!=frontend
```

```text
NAME            READY   STATUS    RESTARTS   AGE
shop-web-dev    1/1     Running   0          9s
shop-web-prod   1/1     Running   0          9s
NAME            READY   STATUS    RESTARTS   AGE
shop-web-prod   1/1     Running   0          9s
NAME            READY   STATUS    RESTARTS   AGE
scratch         1/1     Running   0          9s
shop-api-prod   1/1     Running   0          9s
```

Notice that `tier!=frontend` also matched `scratch`, which has no `tier` at all. The docs spell this out: inequality matches objects without the key too. Set-based forms:

```bash rail=select-set
kubectl get pods -n k8s-from-zero -l 'environment in (dev,prod)'
kubectl get pods -n k8s-from-zero -l '!environment'
```

```text
NAME            READY   STATUS    RESTARTS   AGE
shop-api-prod   1/1     Running   0          9s
shop-web-dev    1/1     Running   0          9s
shop-web-prod   1/1     Running   0          9s
NAME      READY   STATUS    RESTARTS   AGE
scratch   1/1     Running   0          9s
```

Use single quotes around set-based selectors so your shell leaves the parentheses and `!` alone.

Change labels with `kubectl label`. Adding is simple; changing an existing value needs `--overwrite`; a trailing `-` removes a key:

```bash rail=label-scratch
kubectl label pod scratch -n k8s-from-zero environment=dev
kubectl label pod scratch -n k8s-from-zero environment=test
kubectl label pod scratch -n k8s-from-zero environment=test --overwrite
kubectl label pod scratch -n k8s-from-zero environment-
```

```text
pod/scratch labeled
error: 'environment' already has a value (dev), and --overwrite is false
pod/scratch labeled
pod/scratch unlabeled
```

Selectors also work on commands that change things. Label every shop Pod at once, list them by the new label, then delete only the dev ones:

```bash rail=label-shop
kubectl label pods -n k8s-from-zero -l app.kubernetes.io/name=shop team=payments
kubectl get pods -n k8s-from-zero -l team=payments -o name
kubectl delete pods -n k8s-from-zero -l environment=dev
```

```text
pod/shop-api-prod labeled
pod/shop-web-dev labeled
pod/shop-web-prod labeled
pod/shop-api-prod
pod/shop-web-dev
pod/shop-web-prod
pod "shop-web-dev" deleted from k8s-from-zero namespace
```

Run `kubectl get pods -l ...` before any `delete -l ...` with the same selector. It is the cheapest safety check in Kubernetes. Clean up with `kubectl delete -f shop.yaml`; kubectl reports `NotFound` for `shop-web-dev`, which you already deleted, and removes the rest.

## When it goes wrong

- **`create` on something that exists.** Symptom: `Error from server (AlreadyExists): error when creating "web.yaml": pods "web" already exists`. `create` only creates. Use `apply` for files you keep changing.
- **A change you made disappears.** Symptom: a value you set with `edit` or `label` is back to the old one after the next deploy. The field is owned by a file that someone applied again. Change the file instead, and keep each object under one technique.
- **The cluster refuses an update.** Symptom: `spec: Forbidden: pod updates may not change fields other than ...`. Most Pod fields are fixed after creation. Delete and recreate the Pod, or, from part 7 on, change the Deployment that owns it.
- **A label change is refused.** Symptom: `'environment' already has a value (dev), and --overwrite is false`. kubectl protects existing values. Add `--overwrite` when you mean it.
- **A selector matches nothing, or too much.** Symptom: `No resources found`, or a `!=` selector that also hits unlabelled objects. Values are case-sensitive (`-l tier=Frontend` found nothing), and `!=` matches objects without the key. Check with `--show-labels` or `-L <key>` first.

## Cheat sheet

| Task | Command or field | Note |
|---|---|---|
| Run a Pod with no file | `kubectl run quick --image=nginx:1.29-alpine` | imperative, for one-offs |
| Generate a manifest | `kubectl run web --image=nginx:1.29-alpine --dry-run=client -o yaml > web.yaml` | edit, then keep it in Git |
| Preview a change | `kubectl diff -f web.yaml` | exit 0 none, 1 changes, above 1 error |
| Create or update from files | `kubectl apply -f web.yaml` | also `-f dir/`, `-R` for subfolders |
| Validate without storing | `kubectl apply -f web.yaml --dry-run=server` | runs admission checks |
| Field documentation | `kubectl explain pod.spec.containers` | dot paths go deeper |
| Edit live | `kubectl edit pod web` | lost on the next apply of a file that owns the field |
| Patch one field | `kubectl patch pod web --type=merge -p '{"metadata":{"labels":{"k":"v"}}}'` | good in scripts |
| Extra columns | `kubectl get pods -o wide` | IP and node for Pods |
| Names only | `kubectl get pods -o name` | `pod/web`, for loops |
| One field | `kubectl get pods -o jsonpath='{.items[*].metadata.name}'` | `range ... end` to loop |
| Your own table | `kubectl get pods -o custom-columns=NAME:.metadata.name,NODE:.spec.nodeName` | JSONPath per column |
| Sort | `kubectl get pods --sort-by=.metadata.creationTimestamp` | any JSONPath field |
| Show labels | `kubectl get pods --show-labels` or `-L tier` | `-L` adds a column per key |
| Select by label | `kubectl get pods -l tier=frontend,environment=prod` | comma means AND |
| Set-based select | `kubectl get pods -l 'environment in (dev,prod)'` | also `notin`, `key`, `!key` |
| Add, change, remove a label | `kubectl label pod web k=v`, `--overwrite`, `k-` | works with `-l` too |
| See the API request | `kubectl get pods -v=6` | prints verb and URL |
| List resource types | `kubectl api-resources` | short names and API versions |

## Recap and what is next

- Imperative commands are for quick work; keep real objects in files and use `diff` then `apply`.
- `--dry-run=client -o yaml` writes a correct starting manifest; `explain` tells you what each field means.
- Every kubectl command is an HTTPS request to the API server; `-v=6` shows it.
- `-o wide`, `name`, `yaml`, `json`, `jsonpath` and `custom-columns` shape output for people and scripts.
- Labels describe objects and selectors pick them; a comma is AND, and `!=` also matches missing keys.

Next: Kubernetes from Zero, part 6, namespaces, labels and annotations, coming tomorrow.

```rail
id: "api-verbose"
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
      - token: "-v=6"
        text: "Sets kubectl's log level. The quick reference says level 6 displays requested resources. The same table says level 8 displays HTTP request contents."
      - token: "2>&1"
        text: "Shell. Sends standard error to the same place as standard output, so the next command can read kubectl's log lines."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "grep"
        text: "Shell. Prints input lines that match a pattern."
      - token: "-E"
        text: "Short form of --extended-regexp. grep treats the pattern as an extended regular expression."
      - token: "\"Config loaded|https://\""
        text: "The pattern grep looks for. The lesson keeps the line that names the loaded kubeconfig and the line that shows the https request."
```

```rail
id: "raw-namespace"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "--raw"
        text: "Raw URI to request from the server. Uses the transport specified by the kubeconfig file."
      - token: "/api/v1/namespaces/k8s-from-zero"
        text: "The URI passed to --raw. The lesson says core objects live under /api/v1, and this path is the k8s-from-zero namespace."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "head"
        text: "Shell. Prints the beginning of its input."
      - token: "-c"
        text: "With head, how many bytes to print from the start of the input."
      - token: "160"
        text: "How many bytes head prints. The lesson keeps the first 160 bytes of the API reply."
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "echo"
        text: "Shell. Writes its arguments to standard output, then a newline."
```

```rail
id: "api-resources-grep"
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
      - token: "grep"
        text: "Shell. Prints input lines that match a pattern."
      - token: "-E"
        text: "Short form of --extended-regexp. grep treats the pattern as an extended regular expression."
      - token: "\"^NAME|^pods |^namespaces |^deployments \""
        text: "The extended regular expression. It keeps the header row and the pods, namespaces and deployments rows."
```

```rail
id: "run-quick"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "run"
        text: "Create and run a particular image in a pod. The run synopsis is kubectl run NAME --image=image."
      - token: "quick"
        text: "The Pod name. The lesson creates it with kubectl run and later deletes it."
      - token: "--image=nginx:1.29-alpine"
        text: "The image for the container to run. The lesson pins the tag nginx:1.29-alpine."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
```

```rail
id: "run-dry"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "run"
        text: "Create and run a particular image in a pod. The run synopsis is kubectl run NAME --image=image."
      - token: "web"
        text: "The NAME in kubectl run NAME. This command names the Pod web."
      - token: "--image=nginx:1.29-alpine"
        text: "The image for the container to run. The lesson pins the tag nginx:1.29-alpine."
      - token: "--port=80"
        text: "The port that this container exposes. The run docs describe --port that way."
      - token: "--labels=app.kubernetes.io/name=web,tier=frontend"
        text: "Comma-separated labels to apply to the pod. The run docs say this flag overrides previous values. The lesson sets app.kubernetes.io/name to web and tier to frontend."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "--dry-run=client"
        text: "A dry run. The run docs say --dry-run must be none, server, or client. Client only prints the object that would be sent, without sending it. The lesson uses client dry-run to write YAML."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "yaml"
        text: "An output format. It prints the object as YAML."
```

```rail
id: "apply-twice"
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
        text: "The file named by --filename. The lesson generates it with kubectl run web and a client dry-run, then applies it."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "apply"
        text: "Apply a configuration to a resource by file name or stdin. The apply docs say the resource is created if it does not exist yet. JSON and YAML are accepted."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "web.yaml"
        text: "The file named by --filename. The lesson generates it with kubectl run web and a client dry-run, then applies it."
```

```rail
id: "diff-web"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "diff"
        text: "Diff the live object against the configuration apply would produce. The diff docs say the output is YAML. Exit status 0 means no differences, 1 means differences, and a higher status means kubectl or diff failed."
      - token: "-f"
        text: "Short form of --filename. For diff, the file, directory or URL that contains the configuration to diff."
      - token: "web.yaml"
        text: "The file named by --filename. The lesson generates it with kubectl run web and a client dry-run, then applies it."
```

```rail
id: "apply-web"
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
        text: "The file named by --filename. The lesson generates it with kubectl run web and a client dry-run, then applies it."
```

```rail
id: "last-applied"
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
      - token: "web"
        text: "The Pod name in this command."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "jsonpath=\"{.metadata.annotations}\""
        text: "jsonpath is an output format. A template is JSONPath expressions in curly braces. The JSONPath page says a double-quoted string inserts text, and its example uses a quoted backslash-n for a newline. This token is the template in the lesson command."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "head"
        text: "Shell. Prints the beginning of its input."
      - token: "-c"
        text: "With head, how many bytes to print from the start of the input."
      - token: "120"
        text: "How many bytes head prints. The lesson keeps the first 120 bytes of the annotation JSON."
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "echo"
        text: "Shell. Writes its arguments to standard output, then a newline."
```

```rail
id: "dry-run-server"
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
        text: "The file named by --filename. The lesson generates it with kubectl run web and a client dry-run, then applies it."
      - token: "--dry-run=server"
        text: "A dry run. The run docs say server submits the request without persisting the resource. The lesson says a server dry-run still runs the API server validation and admission checks."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "pod"
        text: "The resource type."
      - token: "quick"
        text: "The Pod name. The lesson creates it with kubectl run and later deletes it."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "--dry-run=client"
        text: "A dry run. The run docs say --dry-run must be none, server, or client. Client only prints the object that would be sent, without sending it. The lesson uses client dry-run to write YAML."
```

```rail
id: "explain-pull"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "explain"
        text: "Get documentation for a resource or a field. The explain docs say fields are named as TYPE.FIELDNAME.FIELDNAME and the text comes from the API server OpenAPI schema."
      - token: "pod.spec.containers.imagePullPolicy"
        text: "The field path passed to explain. The lesson reads imagePullPolicy on a container, and the output lists Always, IfNotPresent and Never."
```

```rail
id: "edit-label"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "KUBE_EDITOR=\"sed -i s/environment:\\ dev/environment:\\ test/\""
        text: "Sets KUBE_EDITOR for this one command. The edit docs say that variable names the editor. The lesson points it at sed so the edit changes environment: dev to environment: test."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "edit"
        text: "Edit a resource on the server. The edit docs say it opens the editor named by KUBE_EDITOR, or EDITOR, and saves the object back when you close the file."
      - token: "pod"
        text: "The resource type."
      - token: "web"
        text: "The Pod name in this command."
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
      - token: "web"
        text: "The Pod name in this command."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "-L"
        text: "Short form of --label-columns. The get docs say it accepts a comma-separated list of labels to present as columns, and that names are case-sensitive."
      - token: "environment"
        text: "A label key. With -L, the get docs present each named label as its own column."
```

```rail
id: "apply-resets"
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
        text: "The file named by --filename. The lesson generates it with kubectl run web and a client dry-run, then applies it."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "web"
        text: "The Pod name in this command."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "-L"
        text: "Short form of --label-columns. The get docs say it accepts a comma-separated list of labels to present as columns, and that names are case-sensitive."
      - token: "environment"
        text: "A label key. With -L, the get docs present each named label as its own column."
```

```rail
id: "label-owner"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "label"
        text: "Update the labels on a resource. The label docs say a trailing hyphen on a key removes that label, and --overwrite is required to change a value that is already set."
      - token: "pod"
        text: "The resource type."
      - token: "web"
        text: "The Pod name in this command."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "owner=me"
        text: "A label assignment. The label command sets owner to me."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "apply"
        text: "Apply a configuration to a resource by file name or stdin. The apply docs say the resource is created if it does not exist yet. JSON and YAML are accepted."
      - token: "-f"
        text: "Short form of --filename. The file, directory or URL that contains the configuration to apply."
      - token: "web.yaml"
        text: "The file named by --filename. The lesson generates it with kubectl run web and a client dry-run, then applies it."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pod"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "web"
        text: "The Pod name in this command."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "--show-labels"
        text: "When printing, show all labels as the last column. The get docs say that column is hidden by default."
```

```rail
id: "patch-label"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "patch"
        text: "Update fields of a resource using a strategic merge patch, a JSON merge patch, or a JSON patch. The patch docs say JSON and YAML are accepted."
      - token: "pod"
        text: "The resource type."
      - token: "web"
        text: "The Pod name in this command."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "--type=merge"
        text: "The type of patch being provided. The patch docs list json, merge and strategic, and the default is strategic. merge is a JSON merge patch."
      - token: "-p"
        text: "Short form of --patch. The patch to be applied to the resource JSON file. The patch examples pass it as JSON."
      - token: "'{\"metadata\":{\"labels\":{\"environment\":\"test\"}}}'"
        text: "The JSON merge patch, in single quotes. It sets the environment label to test."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "patch"
        text: "Update fields of a resource using a strategic merge patch, a JSON merge patch, or a JSON patch. The patch docs say JSON and YAML are accepted."
      - token: "pod"
        text: "The resource type."
      - token: "web"
        text: "The Pod name in this command."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "--type=merge"
        text: "The type of patch being provided. The patch docs list json, merge and strategic, and the default is strategic. merge is a JSON merge patch."
      - token: "-p"
        text: "Short form of --patch. The patch to be applied to the resource JSON file. The patch examples pass it as JSON."
      - token: "'{\"metadata\":{\"labels\":{\"environment\":\"dev\"}}}'"
        text: "The JSON merge patch, in single quotes. It sets the environment label back to dev."
```

```rail
id: "patch-port"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "patch"
        text: "Update fields of a resource using a strategic merge patch, a JSON merge patch, or a JSON patch. The patch docs say JSON and YAML are accepted."
      - token: "pod"
        text: "The resource type."
      - token: "web"
        text: "The Pod name in this command."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "-p"
        text: "Short form of --patch. The patch to be applied to the resource JSON file. The patch examples pass it as JSON."
      - token: "'{\"spec\":{\"containers\":[{\"name\":\"web\",\"ports\":[{\"containerPort\":8080}]}]}}'"
        text: "The JSON patch, in single quotes. It tries to change the web container port to 8080. The lesson shows the API refusing it, because most of a running Pod spec is fixed."
```

```rail
id: "get-wide"
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
        text: "An output format. The get examples say wide adds more information, such as the node name. For Pods the lesson's table adds IP and NODE."
```

```rail
id: "get-name"
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
      - token: "name"
        text: "An output format. The get synopsis includes name, which prints each object as type/name."
```

```rail
id: "get-jsonpath"
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
      - token: "jsonpath='{.items[*].metadata.name}{\"\\n\"}'"
        text: "jsonpath is an output format. A template is JSONPath expressions in curly braces. The JSONPath page says a double-quoted string inserts text, and its example uses a quoted backslash-n for a newline. This token is the template in the lesson command."
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
      - token: "jsonpath='{range .items[*]}{.metadata.name}{\"\\t\"}{.status.podIP}{\"\\n\"}{end}'"
        text: "jsonpath is an output format. A template is JSONPath expressions in curly braces. The JSONPath page says a double-quoted string inserts text, and its example uses a quoted backslash-n for a newline. This token is the template in the lesson command."
```

```rail
id: "get-columns"
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
      - token: "custom-columns=NAME:.metadata.name,IMAGE:.spec.containers[0].image,NODE:.spec.nodeName,PHASE:.status.phase"
        text: "custom-columns is an output format. The get examples write each column as a heading, a colon, and a JSONPath. The headings here are IMAGE, NODE, PHASE."
```

```rail
id: "delete-quick-web"
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
      - token: "quick"
        text: "The Pod name. The lesson creates it with kubectl run and later deletes it."
      - token: "web"
        text: "The Pod name in this command."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
```

```rail
id: "apply-shop"
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
      - token: "shop.yaml"
        text: "The file named by --filename. The lesson saves four Pods in it: shop-web-dev, shop-web-prod, shop-api-prod and scratch."
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
      - token: "-L"
        text: "Short form of --label-columns. The get docs say it accepts a comma-separated list of labels to present as columns, and that names are case-sensitive."
      - token: "tier,environment"
        text: "A label key for --label-columns. The get docs present it as a column."
```

```rail
id: "select-equality"
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
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "tier=frontend"
        text: "The label query. It asks for objects whose tier label equals frontend. The lesson matches shop-web-dev and shop-web-prod."
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
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "tier=frontend,environment=prod"
        text: "The label query. A comma means AND, so both requirements must match. The lesson says only shop-web-prod matches."
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
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "tier!=frontend"
        text: "The label query. Inequality. The lesson says this also matches scratch, which has no tier label, because inequality matches objects that lack the key."
```

```rail
id: "select-set"
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
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "'environment in (dev,prod)'"
        text: "A set-based label query. The lesson says in (dev,prod) matches either value, and the single quotes keep the shell from reading the parentheses."
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
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "'!environment'"
        text: "A set-based label query for objects without the environment key. The lesson's match is scratch. The single quotes keep the shell from treating the exclamation mark as history expansion."
```

```rail
id: "label-scratch"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "label"
        text: "Update the labels on a resource. The label docs say a trailing hyphen on a key removes that label, and --overwrite is required to change a value that is already set."
      - token: "pod"
        text: "The resource type."
      - token: "scratch"
        text: "The Pod name. The lesson's scratch Pod starts with only the app.kubernetes.io/name label."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "environment=dev"
        text: "A label assignment. The label command sets environment to dev."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "label"
        text: "Update the labels on a resource. The label docs say a trailing hyphen on a key removes that label, and --overwrite is required to change a value that is already set."
      - token: "pod"
        text: "The resource type."
      - token: "scratch"
        text: "The Pod name. The lesson's scratch Pod starts with only the app.kubernetes.io/name label."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "environment=test"
        text: "A label assignment. The label command sets environment to test."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "label"
        text: "Update the labels on a resource. The label docs say a trailing hyphen on a key removes that label, and --overwrite is required to change a value that is already set."
      - token: "pod"
        text: "The resource type."
      - token: "scratch"
        text: "The Pod name. The lesson's scratch Pod starts with only the app.kubernetes.io/name label."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "environment=test"
        text: "A label assignment. The label command sets environment to test."
      - token: "--overwrite"
        text: "If true, allow labels to be overwritten. The label docs say that otherwise an update which overwrites an existing label is rejected."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "label"
        text: "Update the labels on a resource. The label docs say a trailing hyphen on a key removes that label, and --overwrite is required to change a value that is already set."
      - token: "pod"
        text: "The resource type."
      - token: "scratch"
        text: "The Pod name. The lesson's scratch Pod starts with only the app.kubernetes.io/name label."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "environment-"
        text: "The label key environment with a trailing hyphen. The label docs say this removes that label and does not require --overwrite."
```

```rail
id: "label-shop"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "label"
        text: "Update the labels on a resource. The label docs say a trailing hyphen on a key removes that label, and --overwrite is required to change a value that is already set."
      - token: "pods"
        text: "The resource type."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "app.kubernetes.io/name=shop"
        text: "The label query. It asks for objects whose app.kubernetes.io/name label equals shop."
      - token: "team=payments"
        text: "A label assignment. The label command sets team to payments."
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
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "team=payments"
        text: "The label query. It asks for objects whose team label equals payments."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "name"
        text: "An output format. The get synopsis includes name, which prints each object as type/name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "pods"
        text: "The resource type."
      - token: "-n"
        text: "Short form of --namespace. If present, the namespace scope for this CLI request."
      - token: "k8s-from-zero"
        text: "The namespace name passed to --namespace."
      - token: "-l"
        text: "Short form of --selector. A label query. The get docs say it supports '=', '==', '!=', 'in' and 'notin', and that matching objects must satisfy every constraint."
      - token: "environment=dev"
        text: "The label query. It asks for objects whose environment label equals dev."
```
