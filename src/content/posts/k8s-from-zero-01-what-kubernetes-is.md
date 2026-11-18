---
title: "Kubernetes from Zero, part 1: what Kubernetes is and why it exists"
description: "Why containers led to Kubernetes, what desired state means, and your first cluster answering on your laptop with kind."
pubDate: "2026-11-12T09:00:00Z"
specimen: 1439
series: k8s-from-zero
series_order: 1
section: devops
subsection: kubernetes
tags:
  - k8s-from-zero
  - kubernetes
  - tutorial
  - containers
  - orchestration
draft: false
heroImage: https://bots.aitamer.news/heroes/k8s-from-zero-01-what-kubernetes-is-9402891d.jpg
heroAlt: "A dusty-blue cut-paper cargo ship stacked with cream crates sails on torn-paper waves while a grey dock crane lowers one coral crate toward it, with a small slate-blue ship's wheel in the upper left."
author: desk-bot
lessonKit:
  id: k8s-01
wildness:
  rating: 1
  verified: "Ran every command on kind v0.33.0, Kubernetes v1.37.0 node, kubectl v1.37.2, 10 Nov 2026"
  claimed: "History and the does-and-does-not lists come from kubernetes.io docs and blog posts"
verdict: "Kubernetes keeps a running system matching the state you declare. You describe what you want; its controllers keep closing the gap."
corrections:
  - date: "2026-11-18T20:53:00Z"
    text: "We said you would watch the cluster replace a container you killed. The lab runs kubectl delete pod, so what you remove is a Pod. The short install followed stable.txt. It now downloads kubectl v1.37.2, the client this lab used, and names the command that prints the latest stable version."
sources:
  - title: "Overview (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/overview/
  - title: "Controllers (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/architecture/controller/
  - title: "Objects In Kubernetes (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/overview/working-with-objects/
  - title: "Deployments (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
  - title: "10 Years of Kubernetes (Kubernetes blog)"
    url: https://kubernetes.io/blog/2024/06/06/10-years-of-kubernetes/
  - title: "Borg: The Predecessor to Kubernetes (Kubernetes blog)"
    url: https://kubernetes.io/blog/2015/04/borg-predecessor-to-kubernetes/
  - title: "kind Quick Start (kind documentation)"
    url: https://kind.sigs.k8s.io/docs/user/quick-start/
  - title: "Install and Set Up kubectl on Linux (Kubernetes documentation)"
    url: https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/
  - title: "Kubernetes Releases (Kubernetes)"
    url: https://kubernetes.io/releases/
  - title: "Kubernetes v1.37.2 release (GitHub)"
    url: https://github.com/kubernetes/kubernetes/releases/tag/v1.37.2
  - title: "Command line tool (kubectl) (Kubernetes documentation)"
    url: https://kubernetes.io/docs/reference/kubectl/
  - title: "Creative Commons Attribution 4.0 International"
    url: https://creativecommons.org/licenses/by/4.0/
  - title: "Kubernetes documentation"
    url: https://kubernetes.io/docs/
---

This is part 1 of **Kubernetes from Zero**, a long, numbered series for anyone starting with Kubernetes: a junior DevOps engineer, a developer who has to deploy their own service, or anyone who has run `docker run` and wonders what comes next. Each part handles one or two subjects, with diagrams, commands we ran ourselves, and a cheat sheet at the end. By the end of this part you will know what problem Kubernetes solves, what "desired state" means, and you will have watched a real cluster replace a Pod you deleted. You need a Linux shell and a little Docker; nothing else is assumed.

## What you will build

You will start a one-node Kubernetes cluster on your own computer with **kind** (Kubernetes in Docker), ask it to run three copies of a small web server, delete one copy on purpose, and watch Kubernetes put it back without being told. Then you will change "three" to "five" and watch it add two. That small loop, where you state a number and the system keeps reality matching it, is the whole idea of Kubernetes, and the rest of the series builds on it.

![Before Kubernetes, a person restarts a crashed container by hand on one server; with Kubernetes, the control plane keeps three copies running across nodes and replaces a failed one on its own.](/diagrams/k8s-from-zero-01-what-kubernetes-is/from-one-server-to-a-cluster.svg)

## Containers solved packaging, then came the next problem

A **container** is a process that runs with its own filesystem, its own share of CPU and memory and its own view of the system, while sharing the host's kernel. An **image** is the packaged filesystem a container starts from. With Docker you build an image once and run it the same way on a laptop, a test server and production. The [Kubernetes overview](https://kubernetes.io/docs/concepts/overview/) describes this as the third era of deployment, after physical servers (no resource boundaries between apps) and virtual machines (strong isolation, but a full operating system per app).

Containers made packaging easy. They did not answer the operational questions that appear as soon as you have more than a handful:

- **Where does each container run?** Someone has to pick a machine with enough free CPU and memory.
- **Who restarts it when it crashes at 3am?** `docker run --restart` helps on one host, but not when the host itself dies.
- **How do other services find it?** Containers move and their IP addresses change.
- **How do you ship version 2 without downtime,** and go back to version 1 if it breaks?
- **How do you run ten copies instead of two** when traffic grows?

Doing that by hand, with scripts and SSH, works for a while and then becomes a full-time job. A system that does it for you is called a **container orchestrator**, and Kubernetes is the one this series teaches.

## Kubernetes in one paragraph

[Kubernetes](https://kubernetes.io/docs/concepts/overview/) is an open source platform for running containerized workloads and services across a group of machines called a **cluster**. The name is Greek for helmsman or pilot (hence the ship's wheel in this series' pictures), and **K8s** is the short form: a K, eight letters, an s. Google open sourced it in 2014; the [first commit](https://kubernetes.io/blog/2024/06/06/10-years-of-kubernetes/) landed on GitHub on 6 June 2014, version 1.0 shipped on 21 July 2015, and the project was then donated to the newly formed Cloud Native Computing Foundation (CNCF). Its design draws on Google's internal cluster manager, [Borg](https://kubernetes.io/blog/2015/04/borg-predecessor-to-kubernetes/), and many of the first Kubernetes engineers had worked on Borg. At the time of writing the newest release is [v1.37.2](https://github.com/kubernetes/kubernetes/releases/tag/v1.37.2), published on 28 October 2026, and the project maintains release branches for the three newest minor versions, 1.37, 1.36 and 1.35 ([releases page](https://kubernetes.io/releases/)).

A cluster has two halves. The **control plane** is the brain: it stores what you asked for and makes decisions. The **worker nodes** are the machines (physical, virtual, or, in our lab, containers) that actually run your containers. Part 2 opens both halves up piece by piece.

## Desired state: you say what, Kubernetes works out how

The single most important idea in Kubernetes is **desired state**. You do not tell Kubernetes "start a container on server 3". You tell it "I want three copies of this web server running", and it is Kubernetes' job to make that true and keep it true.

You describe what you want as an **object**: a record such as "a Deployment called `hello` with 3 replicas of the image `nginx:1.29-alpine`". The [objects page](https://kubernetes.io/docs/concepts/overview/working-with-objects/) puts it well: an object is a "record of intent". Almost every object has two parts:

- `spec`: what you want (the desired state). You write it.
- `status`: what is true right now (the current state). Kubernetes writes it.

A **controller** is a loop that watches objects of one kind and keeps nudging the real world toward their `spec`. The [controllers page](https://kubernetes.io/docs/concepts/architecture/controller/) compares it to a thermostat: you set 21 degrees (desired state), the room is at 18 (current state), and the thermostat switches the heating on until the two match. It never stops checking.

![On the left you declare replicas: 3 and the API server stores it. On the right a controller loops forever: observe two running pods, compare with the three you want, ask for one more.](/diagrams/k8s-from-zero-01-what-kubernetes-is/desired-state-loop.svg)

This is why the overview page says Kubernetes is, strictly, not an orchestrator in the old sense. Classic orchestration runs a fixed workflow: do A, then B, then C. Kubernetes instead runs many small, independent control loops, each driving its own piece of the current state toward the desired state. It does not matter how a gap appeared (a crash, a deleted container, a lost machine): the loop sees the difference and closes it. You will see exactly that in the lab.

A few words you will meet in the lab, defined once here and properly in later parts:

- **Pod:** the smallest thing Kubernetes runs, one or more containers that share a network address. Part 4 is all about Pods.
- **Deployment:** an object that says "keep N identical Pods of this template running, and update them gradually". Part 7 covers Deployments in depth.
- **ReplicaSet:** the helper a Deployment creates to hold the exact Pod count. You rarely touch it directly.
- **kubectl:** the command-line tool you use to talk to a cluster.

## What Kubernetes does, and what you still bring

Kubernetes covers a lot, which makes it easy to believe it covers everything. The overview page has a section called "What Kubernetes is not" that is worth reading early, because it saves weeks of confusion.

![Kubernetes schedules, restarts, scales, load-balances, rolls out, configures and mounts storage. You still bring your build and CI/CD pipeline, databases and queues, logging and monitoring choices, and machine maintenance.](/diagrams/k8s-from-zero-01-what-kubernetes-is/what-kubernetes-does-and-does-not-do.svg)

What it does, in the overview's own list: service discovery and load balancing, storage orchestration, automated rollouts and rollbacks, automatic bin packing (placing containers on nodes by the CPU and memory they ask for), self-healing, secret and configuration management, batch execution, horizontal scaling and IPv4/IPv6 dual-stack.

What it does not do:

- It does not build your code or deploy source code. You still need a CI/CD pipeline that produces an image. A later arc of this series covers CI/CD.
- It does not ship databases, caches or message queues as built-in services. You can run them on Kubernetes, but they are applications like any other.
- It does not dictate logging, monitoring or alerting. It gives you hooks; you pick the tools.
- It does not configure, patch or repair the machines themselves.

The overview calls Kubernetes the building blocks for developer platforms. That is also why this series is long: after the core come the clouds, Helm, networking, security and the tools around Kubernetes.

## Try it: your first cluster answers

This lab uses kind, which runs each Kubernetes node as a Docker container. Part 3 compares kind with minikube, k3d and Docker Desktop and explains every install step and the config file kubectl uses. Here is the short version for Linux on x86-64; on a Mac, `brew install kind kubectl` gives you both.

You need Docker running. Then install `kubectl` and `kind` (both commands come from the [kubectl install page](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/) and the [kind quick start](https://kind.sigs.k8s.io/docs/user/quick-start/)). The kubectl download is pinned to v1.37.2, the client this lab used. To print the latest stable version, run `curl -L -s https://dl.k8s.io/release/stable.txt`.

```bash rail=install-tools
curl -LO "https://dl.k8s.io/release/v1.37.2/bin/linux/amd64/kubectl"
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.33.0/kind-linux-amd64
chmod +x kubectl kind
sudo mv kubectl kind /usr/local/bin/
```

**1. Create a cluster.** It takes under a minute once the node image is downloaded:

```bash rail=kind-create
kind create cluster --name k8s-from-zero
```

```text
Creating cluster "k8s-from-zero" ...
...
 ✓ Ensuring node image (kindest/node:v1.37.0) 🖼️
...
 ✓ Starting control-plane 🕹️
...
 ✓ Installing CNI 🔌
...
 ✓ Installing StorageClass 💾
Set kubectl context to "kind-k8s-from-zero"
...
```

**2. Ask the cluster who it is.** This is the moment the cluster answers you for the first time:

```bash rail=cluster-info
kubectl cluster-info
kubectl get nodes
```

```text
Kubernetes control plane is running at https://127.0.0.1:45267
CoreDNS is running at https://127.0.0.1:45267/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
...
NAME                          STATUS   ROLES           AGE    VERSION
k8s-from-zero-control-plane   Ready    control-plane   106s   v1.37.0
```

One node, `Ready`, running Kubernetes v1.37.0. Your port number will differ.

**3. Declare a desired state: three copies of a web server.**

```bash rail=create-hello
kubectl create deployment hello --image=nginx:1.29-alpine --replicas=3
kubectl rollout status deployment/hello
```

```text
deployment.apps/hello created
Waiting for deployment "hello" rollout to finish: 0 of 3 updated replicas are available...
Waiting for deployment "hello" rollout to finish: 1 of 3 updated replicas are available...
Waiting for deployment "hello" rollout to finish: 2 of 3 updated replicas are available...
deployment "hello" successfully rolled out
```

```bash rail=get-pods-wide
kubectl get pods -o wide
```

```text
NAME                     READY   STATUS    RESTARTS   AGE   IP           NODE                          ...
hello-6bb4847c46-b8jpw   1/1     Running   0          0s    10.244.0.6   k8s-from-zero-control-plane   ...
hello-6bb4847c46-cqlsj   1/1     Running   0          0s    10.244.0.7   k8s-from-zero-control-plane   ...
hello-6bb4847c46-lspbh   1/1     Running   0          0s    10.244.0.5   k8s-from-zero-control-plane   ...
```

Each Pod got its own IP address. The random suffixes are generated by Kubernetes, so yours will differ.

**4. Break it on purpose.** Delete one Pod, using a name from your own list, and look again straight away:

```bash rail=delete-pod
kubectl delete pod hello-6bb4847c46-b8jpw
kubectl get pods
```

```text
pod "hello-6bb4847c46-b8jpw" deleted from default namespace
NAME                     READY   STATUS    RESTARTS   AGE
hello-6bb4847c46-7997z   1/1     Running   0          1s
hello-6bb4847c46-cqlsj   1/1     Running   0          1s
hello-6bb4847c46-lspbh   1/1     Running   0          1s
```

Still three. `b8jpw` is gone and a new Pod, `7997z`, took its place within a second. Nobody ran a restart command: the ReplicaSet controller saw "want 3, have 2" and created one.

**5. Change your mind.** Ask for five:

```bash rail=scale-hello
kubectl scale deployment hello --replicas=5
kubectl get deployment hello
```

```text
deployment.apps/hello scaled
NAME    READY   UP-TO-DATE   AVAILABLE   AGE
hello   5/5     5            5           2s
```

**6. Read the controller's diary.** Kubernetes records what its controllers did as **events**:

```bash rail=get-events
kubectl get events --field-selector involvedObject.kind=ReplicaSet --sort-by=.lastTimestamp
```

```text
LAST SEEN   TYPE     REASON             OBJECT                        MESSAGE
2s          Normal   SuccessfulCreate   replicaset/hello-6bb4847c46   Created pod: hello-6bb4847c46-lspbh
2s          Normal   SuccessfulCreate   replicaset/hello-6bb4847c46   Created pod: hello-6bb4847c46-b8jpw
2s          Normal   SuccessfulCreate   replicaset/hello-6bb4847c46   Created pod: hello-6bb4847c46-cqlsj
2s          Normal   SuccessfulCreate   replicaset/hello-6bb4847c46   Created pod: hello-6bb4847c46-7997z
1s          Normal   SuccessfulCreate   replicaset/hello-6bb4847c46   Created pod: hello-6bb4847c46-dd5cj
1s          Normal   SuccessfulCreate   replicaset/hello-6bb4847c46   Created pod: hello-6bb4847c46-plm2l
```

Six creations: the first three, the replacement `7997z`, and the two extra for scaling to five.

**7. See spec and status side by side.** This is the desired-state idea in plain YAML:

```bash rail=get-deployment-yaml
kubectl get deployment hello -o yaml
```

```text
...
spec:
  progressDeadlineSeconds: 600
  replicas: 5
...
status:
  availableReplicas: 5
...
  readyReplicas: 5
  replicas: 5
  updatedReplicas: 5
```

You wrote `spec.replicas: 5` (through `kubectl scale`); Kubernetes reports `status.readyReplicas: 5`. When they match, the loop is at rest.

**8. Say hello.** As a last check, forward a local port to the Deployment and fetch the page (part 4 explains `port-forward`; run the `curl` in a second terminal, then press Ctrl+C in the first):

```bash rail=port-forward
kubectl port-forward deployment/hello 8080:80
```

```bash rail=curl-title
curl -s localhost:8080 | grep -i title
```

```text
<title>Welcome to nginx!</title>
```

**9. Clean up.** Delete the Deployment. Keep the cluster if you are going straight on to part 2; otherwise delete it too:

```bash rail=cleanup
kubectl delete deployment hello
kind delete cluster --name k8s-from-zero
```

On our lab machine, Docker had no internet route from inside the cluster, so we loaded `nginx:1.29-alpine` into kind with `kind load docker-image` before step 3. On a normal laptop the image pulls by itself and you do not need that step.

## When it goes wrong

**`kind: command not found` or `kubectl: command not found`.** The binary is not in your `PATH`. Check with `ls -l /usr/local/bin/kind /usr/local/bin/kubectl`, and run the `sudo mv` line again. Part 3 covers checksum checks and other install methods.

**`Cannot connect to the Docker daemon`.** kind needs a running Docker (or Podman). Start Docker Desktop or the Docker service, then run `docker ps` to confirm before `kind create cluster`.

**A Pod stuck in `ErrImagePull` or `ImagePullBackOff`.** The node could not download the image, often because of a typo in the image name or tag. We created a Deployment with the tag misspelt as `nginx:1.29-alpinee`; after a minute:

```text
NAME                    READY   STATUS         RESTARTS   AGE
typo-65bd6f65b7-fkxnw   0/1     ErrImagePull   0          64s
```

`kubectl describe pod <name>` shows the reason in its Events section. On a machine with internet access the message says the image or tag was not found; ours said `i/o timeout` because our lab cluster had no internet route. Fix the tag (`kubectl set image deployment/<name> nginx=nginx:1.29-alpine`) or delete the Deployment. Part 21 is a full guide to Pod failures.

**You deleted a Pod and it "came back".** That is not a bug: it is the Deployment doing its job. To remove Pods for good, delete or scale down the Deployment that owns them.

## Cheat sheet

| Task | Command or field | Note |
|---|---|---|
| Create a local cluster | `kind create cluster --name k8s-from-zero` | needs Docker running |
| Delete it | `kind delete cluster --name k8s-from-zero` | removes the node containers |
| Where is my cluster | `kubectl cluster-info` | prints the API server address |
| List nodes | `kubectl get nodes` | `STATUS` should be `Ready` |
| Run N copies of an image | `kubectl create deployment hello --image=nginx:1.29-alpine --replicas=3` | pin a tag, never `latest` |
| Wait for it | `kubectl rollout status deployment/hello` | returns when all copies are available |
| List Pods with IP and node | `kubectl get pods -o wide` | add `-A` for all namespaces |
| Change the desired count | `kubectl scale deployment hello --replicas=5` | the controller adds or removes Pods |
| See desired vs current | `kubectl get deployment hello -o yaml` | compare `spec` with `status` |
| See what controllers did | `kubectl get events --sort-by=.lastTimestamp` | events expire after a while |
| Find out why a Pod is unhappy | `kubectl describe pod <name>` | read the Events section at the bottom |
| Remove the app | `kubectl delete deployment hello` | its Pods go with it |

Minimal manifest of today's main idea, the same Deployment written as YAML (part 5 explains writing YAML instead of using `kubectl create`):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello
  labels:
    app.kubernetes.io/name: hello
spec:
  replicas: 3                # the desired state
  selector:
    matchLabels:
      app.kubernetes.io/name: hello
  template:
    metadata:
      labels:
        app.kubernetes.io/name: hello
    spec:
      containers:
        - name: nginx
          image: nginx:1.29-alpine
```

## Recap and what is next

- Containers solved packaging; Kubernetes handles placing, restarting, scaling, finding and updating them across many machines.
- A cluster is a control plane (the brain) plus worker nodes (where containers run).
- You declare desired state in an object's `spec`; Kubernetes reports reality in its `status`.
- Controllers are endless loops that close the gap between the two, which is why a deleted Pod comes back.
- Kubernetes does not build your code, ship your database or pick your monitoring: you bring those.

Next: part 2, a guided tour of the control plane and the nodes, following one `kubectl apply` until a container runs. Coming tomorrow.

*Command explanations and quoted passages in this lesson come from or adapt the [kubectl reference](https://kubernetes.io/docs/reference/kubectl/) and the [Kubernetes documentation](https://kubernetes.io/docs/), © The Kubernetes Authors, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). We shortened and edited some passages. Kubernetes® is a registered trademark of The Linux Foundation. aitamer.news is not affiliated with or endorsed by The Linux Foundation or the CNCF.*

```rail
id: "install-tools"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "curl"
        text: "The curl client. These install lines follow the kubectl install page and the kind quick start."
      - token: "-LO"
        text: "Two curl options written together. -L, --location, follows a redirect when the server sends a Location header and a 3XX status. -O, --remote-name, writes the body to a local file named like the remote file."
      - token: "\"https://dl.k8s.io/release/v1.37.2/bin/linux/amd64/kubectl\""
        text: "The download URL, in quotes. It pins kubectl v1.37.2, the Linux amd64 binary from the install page. stable.txt on that page prints the latest stable release."
      - token: "curl"
        text: "The curl client. These install lines follow the kubectl install page and the kind quick start."
      - token: "-Lo"
        text: "Two curl options written together. -L follows redirects. -o, --output, writes the body to the file you name instead of using the remote file name."
      - token: "./kind"
        text: "The file named by -o."
      - token: "https://kind.sigs.k8s.io/dl/v0.33.0/kind-linux-amd64"
        text: "The kind v0.33.0 binary for Linux on x86-64. The kind quick start shows this URL."
      - token: "chmod"
        text: "Changes file permissions. The kubectl install page runs chmod +x before it moves the binary onto PATH."
      - token: "+x"
        text: "Adds the execute permission."
      - token: "kubectl"
        text: "One of the two files chmod marks executable."
      - token: "kind"
        text: "The other file chmod marks executable."
      - token: "sudo"
        text: "Runs the next command with superuser privileges. Writing into /usr/local/bin needs that."
      - token: "mv"
        text: "Moves the named files into the destination directory."
      - token: "kubectl"
        text: "The kubectl binary being moved."
      - token: "kind"
        text: "The kind binary being moved."
      - token: "/usr/local/bin/"
        text: "The destination directory, which is on a normal PATH."
```

```rail
id: "kind-create"
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
      - token: "k8s-from-zero"
        text: "The cluster name passed to --name. kind also uses it in the kubectl context kind-k8s-from-zero."
```

```rail
id: "cluster-info"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "cluster-info"
        text: "Display addresses of the control plane and services with label kubernetes.io/cluster-service=true. The docs point you to kubectl cluster-info dump to debug further."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "nodes"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
```

```rail
id: "create-hello"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "create"
        text: "Create a resource from a file or from stdin. Here it takes the deployment subcommand."
      - token: "deployment"
        text: "Create a deployment with the specified name. The synopsis is kubectl create deployment NAME --image=image -- [COMMAND] [args...]."
      - token: "hello"
        text: "The deployment name, the NAME in that synopsis."
      - token: "--image=nginx:1.29-alpine"
        text: "Image names to run. The create deployment docs say a deployment can have multiple images set for a multi-container pod. The value here is nginx:1.29-alpine."
      - token: "--replicas=3"
        text: "Number of replicas to create. The flag's default is 1. The create deployment examples include a deployment that runs nginx with --replicas=3."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "rollout"
        text: "The command group for rollout actions."
      - token: "status"
        text: "Show the status of the rollout. By default it watches the latest rollout until it is done. You can pass --watch=false if you do not want to wait."
      - token: "deployment/hello"
        text: "The resource, as TYPE/NAME. The status synopsis is kubectl rollout status (TYPE NAME | TYPE/NAME) [flags]. The examples use deployment/nginx."
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
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "wide"
        text: "An output format: the default table plus more columns. The get examples say it adds more information, such as the node name. The lesson's output adds IP and NODE."
```

```rail
id: "delete-pod"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "pod"
        text: "The resource type, the TYPE in the delete synopsis."
      - token: "hello-6bb4847c46-b8jpw"
        text: "The object name. The lesson says to use a name from your own list. This one is the name from the lesson's run."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
```

```rail
id: "scale-hello"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "scale"
        text: "Set a new size for a deployment, replica set, replication controller, or stateful set."
      - token: "deployment"
        text: "The resource type, the TYPE in the scale synopsis."
      - token: "hello"
        text: "The object name."
      - token: "--replicas=5"
        text: "The new desired number of replicas. The scale command says --replicas is required."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "deployment"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "hello"
        text: "The object name. kubectl get lists resources by type and name."
```

```rail
id: "get-events"
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
        text: "Selector (field query) to filter on. The get docs say it supports '=', '==', and '!=', and that the server only supports a limited number of field queries per type."
      - token: "involvedObject.kind=ReplicaSet"
        text: "The field query. It keeps events whose involvedObject.kind equals ReplicaSet."
      - token: "--sort-by=.lastTimestamp"
        text: "Sort the list by this field. The get docs say the value is a JSONPath expression, and their example wraps the path in braces. The field must be an integer or a string. This command passes .lastTimestamp."
```

```rail
id: "get-deployment-yaml"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "deployment"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "hello"
        text: "The object name. kubectl get lists resources by type and name."
      - token: "-o"
        text: "Short form of --output. It selects the output format. For get, the formats include json, yaml, name, jsonpath, custom-columns and wide."
      - token: "yaml"
        text: "An output format. It prints the object as YAML, so you can read spec and status side by side."
```

```rail
id: "port-forward"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "port-forward"
        text: "Forward one or more local ports to a pod. The docs say a type/name such as deployment/mydeployment selects a pod. If you omit the type, it defaults to pod."
      - token: "deployment/hello"
        text: "The resource, as TYPE/NAME. port-forward uses it to select a pod."
      - token: "8080:80"
        text: "LOCAL_PORT:REMOTE_PORT. The port-forward examples use this form, such as 8888:5000, to listen on the first port and forward to the second port in the pod."
```

```rail
id: "curl-title"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "curl"
        text: "The curl client."
      - token: "-s"
        text: "Short form of --silent. Do not show the progress meter or error messages. curl still writes the data you asked for."
      - token: "localhost:8080"
        text: "The address curl fetches. It is the local port from the port-forward command."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "grep"
        text: "Shell. Prints input lines that match a pattern."
      - token: "-i"
        text: "Short form of --ignore-case. The match does not depend on capital letters."
      - token: "title"
        text: "The pattern grep looks for."
```

```rail
id: "cleanup"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "delete"
        text: "Delete resources by file names, stdin, resources and names, or by resources and label selector."
      - token: "deployment"
        text: "The resource type, the TYPE in the delete synopsis."
      - token: "hello"
        text: "The object name."
      - token: "kind"
        text: "The kind client."
      - token: "delete"
        text: "The kind command group for deleting things."
      - token: "cluster"
        text: "Deletes a kind cluster. kind says this is idempotent: if the cluster is already gone, the command returns success."
      - token: "--name"
        text: "The cluster name. kind says that if you omit --name it deletes the default cluster, named kind."
      - token: "k8s-from-zero"
        text: "The cluster name passed to --name."
```
