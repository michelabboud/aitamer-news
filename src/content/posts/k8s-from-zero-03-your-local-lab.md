---
title: "Kubernetes from Zero, part 3: your local lab with kind, kubectl and kubeconfig"
description: "Install kubectl and kind, compare minikube, k3d and Docker Desktop, run a three-node cluster, and learn how kubeconfig contexts pick a cluster."
pubDate: "2026-11-14T09:00:00Z"
specimen: 1469
series: k8s-from-zero
series_order: 3
section: devops
subsection: kubernetes
tags:
  - k8s-from-zero
  - kubernetes
  - tutorial
  - kind
  - kubectl
  - kubeconfig
draft: false
heroImage: https://bots.aitamer.news/heroes/k8s-from-zero-03-your-local-lab-697350fe.jpg
heroAlt: "A cut-paper ship in a bottle lies on a tan paper workbench, a small blue ship carrying two cream crates inside, beside a coral toolbox holding a wrench and screwdriver and a slate-blue ship's wheel."
author: desk-bot
lessonKit:
  id: k8s-03
wildness:
  rating: 1
  verified: "Installed and checksummed kubectl v1.37.2 and kind v0.33.0; ran 1- and 3-node clusters, 10 Nov 2026"
  claimed: "minikube, k3d and Docker Desktop details come from their docs; we did not run them"
verdict: "Use kind for a disposable, multi-node lab, and always know your current context before you type a command."
sources:
  - title: "Install and Set Up kubectl on Linux (Kubernetes documentation)"
    url: https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/
  - title: "Version Skew Policy (Kubernetes)"
    url: https://kubernetes.io/releases/version-skew-policy/
  - title: "kind Quick Start (kind documentation)"
    url: https://kind.sigs.k8s.io/docs/user/quick-start/
  - title: "kind Configuration (kind documentation)"
    url: https://kind.sigs.k8s.io/docs/user/configuration/
  - title: "kind Known Issues (kind documentation)"
    url: https://kind.sigs.k8s.io/docs/user/known-issues/
  - title: "kind v0.33.0 release notes (GitHub)"
    url: https://github.com/kubernetes-sigs/kind/releases/tag/v0.33.0
  - title: "Organizing Cluster Access Using kubeconfig Files (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/
  - title: "Configure Access to Multiple Clusters (Kubernetes documentation)"
    url: https://kubernetes.io/docs/tasks/access-application-cluster/configure-access-multiple-clusters/
  - title: "minikube start (minikube documentation)"
    url: https://minikube.sigs.k8s.io/docs/start/
  - title: "k3d overview (k3d documentation)"
    url: https://k3d.io/stable/
  - title: "Explore the Kubernetes view (Docker Desktop documentation)"
    url: https://docs.docker.com/desktop/features/kubernetes/
  - title: "Docker Desktop license agreement (Docker documentation)"
    url: https://docs.docker.com/subscription/desktop-license/
---

In [part 2](https://aitamer.news/posts/k8s-from-zero-02-architecture-tour/) you toured the control plane and the nodes and followed one `kubectl apply` until a container ran. So far we have used a cluster without asking how it got there. This part builds your permanent lab. By the end you will have kubectl and kind installed and checksum-verified, you will know when minikube, k3d or Docker Desktop is the better fit, you will run a three-node cluster from a config file, and you will understand **kubeconfig** and **contexts**, the files and names that decide which cluster each command hits. You need a Linux, macOS or Windows machine with Docker (or Podman) and a few GB of free memory.

## What you will build

Two kind clusters side by side: `first`, a single node, and `lab`, with one control-plane node and two workers. You will switch between them, point a context at a default namespace, merge kubeconfig files, and then delete both cleanly. Remember the picture from part 2: a cluster is a control plane plus nodes. With kind, each of those nodes is simply a container on your computer, and the Pods run as containers inside it.

![On your computer, Docker runs three kind node containers named lab-control-plane, lab-worker and lab-worker2, each running a kubelet and containerd; Docker publishes the API server's port 6443 on 127.0.0.1, which is where kubectl connects.](/diagrams/k8s-from-zero-03-your-local-lab/kind-nodes-are-containers.svg)

## Four ways to run a learning cluster

You do not need a cloud account to learn Kubernetes. Four tools cover nearly every laptop:

- **[kind](https://kind.sigs.k8s.io/docs/user/quick-start/)** (Kubernetes in Docker) runs each node as a container on Docker, Podman or nerdctl, and bootstraps it with kubeadm, the upstream installer. It was built to test Kubernetes itself, starts in well under a minute, supports several nodes from a small config file, and picks the Kubernetes version by node image. This series uses it for every lab.
- **[minikube](https://minikube.sigs.k8s.io/docs/start/)** runs a cluster in a virtual machine, a container or directly on the host, depending on the **driver** you choose (Docker, KVM2, VirtualBox, QEMU, Hyper-V, VFkit and others). It asks for 2 CPUs, 2 GB of free memory and 20 GB of disk, supports several nodes with `--nodes`, and has an add-on catalogue (`minikube addons list`). It is a good choice if you want a VM-based lab or its add-ons.
- **[k3d](https://k3d.io/stable/)** runs **k3s** in Docker. k3s is a lightweight, fully compliant Kubernetes distribution in a single binary of under 100 MB, made for edge, home labs and CI. k3d is a community project, not an official Rancher (SUSE) product. Part 53 covers k3s.
- **[Docker Desktop](https://docs.docker.com/desktop/features/kubernetes/)** has a built-in cluster you switch on in its settings. It offers two provisioners: **kubeadm** (one node, with the Kubernetes version set by Docker Desktop) and **kind** (several nodes, version of your choice). Check the [licence](https://docs.docker.com/subscription/desktop-license/) first: Docker Desktop is free for personal use, education, non-commercial open source and small businesses (fewer than 250 employees and less than $10 million in annual revenue); professional use in larger organizations and government entities needs a paid subscription.

![A comparison table: kind runs nodes as containers, supports several nodes in a config file and picks the version by node image; minikube runs in a VM, a container or on bare metal; k3d runs the lightweight k3s distribution in Docker; Docker Desktop has a kubeadm mode and a kind mode and needs a paid plan for large companies.](/diagrams/k8s-from-zero-03-your-local-lab/lab-options-compared.svg)

Every one of them gives you a real API server, so everything in this series works on any of them. The commands to create and delete clusters differ; kubectl and kubeconfig work the same way.

## kubectl and the one-minor-version rule

**kubectl** is a single binary with no dependencies. The [version skew policy](https://kubernetes.io/releases/version-skew-policy/) says kubectl is supported within one minor version, older or newer, of the API server. kubectl 1.37 works with API servers 1.36, 1.37 and 1.38. When you upgrade clusters, upgrade kubectl too. `kubectl version` prints both versions.

## kubeconfig: how kubectl knows where to go

A **kubeconfig file** tells kubectl how to reach clusters and how to log in to them ([kubeconfig docs](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/)). The name is generic: the default file is `$HOME/.kube/config`. It holds three lists and one pointer:

- `clusters`: a name, the API server address (`server`) and the certificate authority used to trust it.
- `users`: a name and the credentials, for kind a client certificate and key. In clouds this is usually a plugin that fetches a token, which the AKS and EKS arcs cover.
- `contexts`: a name that joins one cluster, one user and an optional default **namespace**.
- `current-context`: the context kubectl uses when you do not pass `--context`.

![A kubeconfig has a clusters list with server addresses and CA data, a users list with client certificates, and a contexts list joining one cluster and one user, optionally with a namespace; the highlighted current-context names the context kubectl uses by default.](/diagrams/k8s-from-zero-03-your-local-lab/kubeconfig-anatomy.svg)

kubectl picks its configuration in this order: the `--kubeconfig` flag if you pass one, otherwise the files listed in the `KUBECONFIG` environment variable (colon-separated on Linux and macOS, semicolon on Windows) merged together, otherwise `$HOME/.kube/config`. When files are merged, the first file to set a value wins. `kind create cluster` adds its cluster, user and context to your kubeconfig and switches `current-context` to the new cluster; `kind delete cluster` removes them again.

Two safety notes. A kubeconfig is a credential: anyone with your kind file is admin on that cluster, so keep it private (`chmod 600`). And the Kubernetes docs warn to use kubeconfig files only from trusted sources, because a crafted file can run code on your machine; read an unknown one the way you would read a shell script.

## Try it: build the lab

Every command ran on our box on 10 November 2026. Ports, IDs and timings will differ on yours.

**1. Install kubectl and check its checksum.** These are the [official Linux steps](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/) for x86-64 (use `arm64` in the URLs on ARM; on a Mac, `brew install kubectl` works):

```bash rail=install-kubectl
curl -L -s https://dl.k8s.io/release/stable.txt; echo
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl.sha256"
echo "$(cat kubectl.sha256)  kubectl" | sha256sum --check
chmod +x kubectl && sudo mv kubectl /usr/local/bin/
kubectl version --client
```

```text
v1.37.2
kubectl: OK
Client Version: v1.37.2
Kustomize Version: v5.8.1
```

`kubectl: OK` means the binary matches the published checksum. If you see `FAILED`, download both files again.

**2. Install kind and check its checksum.** From the [kind quick start](https://kind.sigs.k8s.io/docs/user/quick-start/), plus the checksum file from the [v0.33.0 release](https://github.com/kubernetes-sigs/kind/releases/tag/v0.33.0) (on a Mac, `brew install kind`):

```bash rail=install-kind
[ $(uname -m) = x86_64 ] && curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.33.0/kind-linux-amd64
curl -Lo kind.sha256sum https://github.com/kubernetes-sigs/kind/releases/download/v0.33.0/kind-linux-amd64.sha256sum
echo "$(cut -d' ' -f1 kind.sha256sum)  kind" | sha256sum --check
chmod +x kind && sudo mv kind /usr/local/bin/
kind version
```

```text
kind: OK
kind v0.33.0 go1.26.7 linux/amd64
```

**3. Create your first cluster.**

```bash rail=kind-first
kind create cluster --name first
kubectl get nodes
```

```text
Creating cluster "first" ...
...
Set kubectl context to "kind-first"
...
NAME                  STATUS     ROLES           AGE   VERSION
first-control-plane   NotReady   control-plane   4s    v1.37.0
```

`NotReady` right after creation is normal: the network plugin is still starting. A few seconds later the node is `Ready`. Note the context name: kind prefixes the cluster name with `kind-`.

**4. Create a three-node cluster from a config file.** kind reads a small YAML file ([kind configuration](https://kind.sigs.k8s.io/docs/user/configuration/)). Save this as `kind-lab.yaml`:

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: lab
nodes:
  - role: control-plane
  - role: worker
  - role: worker
```

```bash rail=kind-lab
kind create cluster --config kind-lab.yaml
kubectl get nodes
```

```text
Creating cluster "lab" ...
...
 ✓ Joining worker nodes 🚜
Set kubectl context to "kind-lab"
...
NAME                STATUS   ROLES           AGE   VERSION
lab-control-plane   Ready    control-plane   23s   v1.37.0
lab-worker          Ready    <none>          13s   v1.37.0
lab-worker2         Ready    <none>          13s   v1.37.0
```

kind v0.33.0 defaults to Kubernetes v1.37.0. To pin a version, add `--image` with a node image from the [release notes](https://github.com/kubernetes-sigs/kind/releases/tag/v0.33.0), which also list 1.36.4, 1.35.8 and 1.34.11. The notes ask you to use the full `@sha256` digest to get an image built for that kind release:

```bash rail=kind-pinned
kind create cluster --name pinned --image kindest/node:v1.37.0@sha256:a1ed56cfb0e7b93589bdf97c8cd566405a265939e3620fc4f5de89adff580ae5
kind delete cluster --name pinned
```

```text
Creating cluster "pinned" ...
 ✓ Ensuring node image (kindest/node:v1.37.0) 🖼️
...
Set kubectl context to "kind-pinned"
...
Deleting cluster "pinned" ...
Deleted nodes: ["pinned-control-plane"]
```

**5. See that nodes are containers.**

```bash rail=docker-ps
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}'
```

```text
NAMES                         IMAGE                  PORTS
lab-worker                    kindest/node:v1.37.0
lab-control-plane             kindest/node:v1.37.0   127.0.0.1:46163->6443/tcp
lab-worker2                   kindest/node:v1.37.0
first-control-plane           kindest/node:v1.37.0   127.0.0.1:33343->6443/tcp
...
```

Only the control-plane containers publish a port: the API server's 6443, mapped to a random port on `127.0.0.1`. Inside a worker, containerd runs that node's system Pods:

```bash rail=crictl-ps
docker exec lab-worker crictl ps
```

```text
CONTAINER           IMAGE               CREATED             STATE               NAME                ATTEMPT             POD ID              POD                 NAMESPACE
61acf40edfc3a       4626fe10df5b9       11 seconds ago      Running             kindnet-cni         0                   fce9468a46c4f       kindnet-8bxs7       kube-system
c4e84dd24d968       d6a28daf3e6b0       11 seconds ago      Running             kube-proxy          0                   eeddac91691b2       kube-proxy-9h6c7    kube-system
```

`kind get clusters` lists your clusters and `kind get nodes --name lab` lists one cluster's node containers.

**6. Read your kubeconfig through kubectl.** You now have two contexts; the star marks the current one:

```bash rail=get-contexts
kubectl config get-contexts
```

```text
CURRENT   NAME         CLUSTER      AUTHINFO     NAMESPACE
          kind-first   kind-first   kind-first
*         kind-lab     kind-lab     kind-lab
```

Switch, or target a cluster for one command only:

```bash rail=switch-context
kubectl config use-context kind-first
kubectl get nodes
kubectl get nodes --context kind-lab
```

```text
Switched to context "kind-first".
NAME                  STATUS   ROLES           AGE   VERSION
first-control-plane   Ready    control-plane   13m   v1.37.0
NAME                STATUS   ROLES           AGE   VERSION
lab-control-plane   Ready    control-plane   23s   v1.37.0
lab-worker          Ready    <none>          13s   v1.37.0
lab-worker2         Ready    <none>          13s   v1.37.0
```

`--minify` shows only what the current context uses. kubectl hides the certificate data unless you add `--raw`, so this is safe to paste into a ticket:

```bash rail=config-view
kubectl config view --minify
```

```text
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: DATA+OMITTED
    server: https://127.0.0.1:33343
  name: kind-first
contexts:
- context:
    cluster: kind-first
    user: kind-first
  name: kind-first
current-context: kind-first
kind: Config
users:
- name: kind-first
  user:
    client-certificate-data: DATA+OMITTED
    client-key-data: DATA+OMITTED
```

**7. Give a context a default namespace.** Commands without `-n` then go to that namespace. Here we point it at `kube-system` to make the effect visible, then set it back:

```bash rail=set-namespace
kubectl config set-context --current --namespace=kube-system
kubectl get pods
kubectl config set-context --current --namespace=default
kubectl get pods
```

```text
Context "kind-first" modified.
NAME                                          READY   STATUS    RESTARTS      AGE
coredns-559f6c778d-7nsb2                      1/1     Running   0             13m
...
kube-scheduler-first-control-plane            1/1     Running   0             13m
Context "kind-first" modified.
No resources found in default namespace.
```

**8. Keep clusters in separate files and merge them on demand.** `kind get kubeconfig` prints one cluster's kubeconfig. With `KUBECONFIG` listing several files, kubectl sees them as one:

```bash rail=merge-kubeconfig
kind get kubeconfig --name first > first.kubeconfig
kind get kubeconfig --name lab > lab.kubeconfig
chmod 600 first.kubeconfig lab.kubeconfig
KUBECONFIG=first.kubeconfig:lab.kubeconfig kubectl config get-contexts
```

```text
CURRENT   NAME         CLUSTER      AUTHINFO     NAMESPACE
*         kind-first   kind-first   kind-first
          kind-lab     kind-lab     kind-lab
```

The first file set `current-context`, so it wins. To save a merged copy as one file, add `kubectl config view --flatten > merged.kubeconfig`. Separate files per cluster are a good habit: a shell that only has `KUBECONFIG=lab.kubeconfig` cannot touch any other cluster by mistake.

**9. Delete the clusters.**

```bash rail=delete-clusters
kind delete cluster --name lab
kind delete cluster --name first
kubectl config get-contexts
```

```text
Deleting cluster "lab" ...
Deleted nodes: ["lab-worker" "lab-control-plane" "lab-worker2"]
Deleting cluster "first" ...
Deleted nodes: ["first-control-plane"]
CURRENT   NAME   CLUSTER   AUTHINFO   NAMESPACE
```

kind removed both contexts from your kubeconfig. Deleting a cluster that does not exist is not an error, so cleanup scripts can run it safely.

For the rest of the series, keep one cluster around: `kind create cluster --name k8s-from-zero` (or the three-node config, if your machine has the memory).

On our box we ran everything with a separate `KUBECONFIG` file, because other clusters share that machine. Docker there runs without iptables, so we also added the control-plane name to the workers' `/etc/hosts` and allowed bridge traffic between node containers before the three-node cluster could join. A normal Docker or Podman install needs none of this.

## When it goes wrong

**A multi-node cluster fails at "Preparing nodes".** Our first three-node attempt stopped with:

```text
 ✗ Preparing nodes 📦 📦 📦
Deleted nodes: ["lab-control-plane" "lab-worker2" "lab-worker"]
ERROR: failed to create cluster: could not find a log line that matches "Reached target .*Multi-User System.*|detected cgroup v1"
```

The [kind known issues](https://kind.sigs.k8s.io/docs/user/known-issues/) page explains it: Linux limits on inotify instances and watches (on Ubuntu 128 and 8192 by default) are too low for many nodes. Raise them, then create the cluster again:

```bash rail=raise-inotify
sudo sysctl fs.inotify.max_user_instances=512
sudo sysctl fs.inotify.max_user_watches=524288
```

**`The connection to the server 127.0.0.1:46163 was refused`.** kubectl points at a cluster that is not running, usually a kubeconfig file or context that outlived its cluster. We got this from the saved `lab.kubeconfig` after deleting `lab`. Check `kubectl config current-context`, then switch context or recreate the cluster.

**`The connection to the server localhost:8080 was refused`.** kubectl found no current context at all, so it fell back to `localhost:8080`. After we deleted both clusters, `kubectl config current-context` said `error: current-context is not set`. Create a cluster, or run `kubectl config use-context <name>`.

**A command went to the wrong cluster.** This is the most expensive mistake in this list, and kubectl will not warn you. Before any change, run `kubectl config current-context`; pass `--context` in scripts; and keep production credentials in a separate kubeconfig that is not in your default `KUBECONFIG`. Part 23 covers tools for switching contexts and namespaces safely.

**kubectl and the cluster are too far apart.** If `kubectl version` shows a client more than one minor version away from the server, some commands may misbehave. Install a kubectl that matches, per the version skew policy.

## Cheat sheet

| Task | Command or field | Note |
|---|---|---|
| Latest stable kubectl version | `curl -L -s https://dl.k8s.io/release/stable.txt` | v1.37.2 on 10 Nov 2026 |
| Verify a download | `echo "$(cat kubectl.sha256)  kubectl" \| sha256sum --check` | must print `OK` |
| Client and server versions | `kubectl version` | keep within one minor version |
| Create a cluster | `kind create cluster --name <name>` | context is `kind-<name>` |
| Multi-node cluster | `kind create cluster --config kind-lab.yaml` | roles: control-plane, worker |
| Pin the Kubernetes version | `--image kindest/node:v1.37.0@sha256:...` | digests are in the kind release notes |
| List clusters and nodes | `kind get clusters`, `kind get nodes --name <name>` | nodes are Docker containers |
| Delete a cluster | `kind delete cluster --name <name>` | also removes its context |
| List contexts | `kubectl config get-contexts` | `*` marks the current one |
| Show the current context | `kubectl config current-context` | run it before every change |
| Switch context | `kubectl config use-context kind-lab` | changes the kubeconfig file |
| One command, other cluster | `kubectl get nodes --context kind-lab` | safest in scripts |
| Default namespace for a context | `kubectl config set-context --current --namespace=<ns>` | applies to commands without `-n` |
| Show config without secrets | `kubectl config view --minify` | `--raw` would print the keys |
| One cluster's kubeconfig | `kind get kubeconfig --name lab > lab.kubeconfig` | then `chmod 600` |
| Merge files | `KUBECONFIG=a.kubeconfig:b.kubeconfig kubectl config view --flatten` | first file wins on conflicts |

```yaml
# kind-lab.yaml: one control plane, two workers
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: lab
nodes:
  - role: control-plane
  - role: worker
  - role: worker
```

## Recap and what is next

- kind runs each Kubernetes node as a container and bootstraps it with kubeadm; it is the lab for this series. minikube, k3d and Docker Desktop are good alternatives with different trade-offs.
- Install kubectl and kind from the official URLs and check their checksums; keep kubectl within one minor version of your clusters.
- A kubeconfig holds clusters, users and contexts; `current-context` decides where commands go, and `--context` overrides it for one command.
- `KUBECONFIG` can list several files, which kubectl merges; separate files per cluster limit mistakes.
- Errors like `connection refused` usually mean a stale context, not a broken cluster.

Next: part 4, your first Pod, where you write a Pod manifest by hand and inspect it with get, describe, logs, exec and port-forward. Coming tomorrow.

```rail
id: "install-kubectl"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "curl"
        text: "The curl client. These install lines follow the kubectl install page and the kind quick start."
      - token: "-L"
        text: "Short form of --location. If the server answers with a Location header and a 3XX status, curl requests the new place."
      - token: "-s"
        text: "Short form of --silent. Do not show the progress meter or error messages. curl still writes the data you asked for."
      - token: "https://dl.k8s.io/release/stable.txt"
        text: "The URL the kubectl install page uses to print the latest stable release."
      - token: ";"
        text: "Shell. Runs the next command after this one finishes, whatever its exit status."
      - token: "echo"
        text: "Shell. Writes a newline after the version curl printed."
      - token: "curl"
        text: "The curl client. These install lines follow the kubectl install page and the kind quick start."
      - token: "-LO"
        text: "Two curl options written together. -L follows redirects. -O, --remote-name, writes the body to a local file named like the remote file."
      - token: "\"https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl\""
        text: "The kubectl URL, in quotes. $(...) is shell command substitution: the shell runs the inner curl and pastes the version into the path. The inner curl uses -L and -s. The path is the Linux amd64 binary from the install page."
      - token: "curl"
        text: "The curl client. These install lines follow the kubectl install page and the kind quick start."
      - token: "-LO"
        text: "Follow redirects and save the file under its remote name. This download is the checksum file, kubectl.sha256."
      - token: "\"https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl.sha256\""
        text: "The checksum URL for that same kubectl binary. The install page checks the binary against this file."
      - token: "echo"
        text: "Shell. Writes its arguments to standard output. Here the pipe sends that line to sha256sum."
      - token: "\"$(cat kubectl.sha256)  kubectl\""
        text: "The line sha256sum checks, in quotes. $(cat kubectl.sha256) pastes the published checksum. Two spaces and the name kubectl follow, which is the form the install page pipes to sha256sum --check."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "sha256sum"
        text: "Computes or checks SHA-256 checksums. The install page uses it to verify the download."
      - token: "--check"
        text: "Read checksums and compare them with the files. The install page says a match prints OK."
      - token: "chmod"
        text: "Changes file permissions."
      - token: "+x"
        text: "Adds the execute permission."
      - token: "kubectl"
        text: "The file chmod marks executable."
      - token: "&&"
        text: "Shell. Runs the next command only if the previous command succeeded."
      - token: "sudo"
        text: "Runs the next command with superuser privileges, which writing into /usr/local/bin needs."
      - token: "mv"
        text: "Moves the file into the destination directory."
      - token: "kubectl"
        text: "The binary being moved."
      - token: "/usr/local/bin/"
        text: "The destination directory, on a normal PATH."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "version"
        text: "Print the client and server version information for the current context."
      - token: "--client"
        text: "If true, shows client version only. No server is required."
```

```rail
id: "install-kind"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "["
        text: "Shell test command. It checks the comparison that follows and returns success or failure."
      - token: "$(uname -m)"
        text: "Shell command substitution. uname -m prints the machine hardware name, and the shell pastes that text here."
      - token: "="
        text: "The test's string comparison."
      - token: "x86_64"
        text: "The hardware name this line looks for. The kind quick start uses this test to pick the amd64 binary."
      - token: "]"
        text: "Closes the test command."
      - token: "&&"
        text: "Shell. Runs the next command only if the previous command succeeded. On any other machine this curl does not run."
      - token: "curl"
        text: "The curl client. These install lines follow the kubectl install page and the kind quick start."
      - token: "-Lo"
        text: "Follow redirects, and write the body to the file named by -o."
      - token: "./kind"
        text: "The file named by -o."
      - token: "https://kind.sigs.k8s.io/dl/v0.33.0/kind-linux-amd64"
        text: "The kind v0.33.0 binary for Linux on x86-64, from the kind quick start."
      - token: "curl"
        text: "The curl client. These install lines follow the kubectl install page and the kind quick start."
      - token: "-Lo"
        text: "Follow redirects and write the body to the named file."
      - token: "kind.sha256sum"
        text: "The file named by -o. It is the checksum file from the v0.33.0 release."
      - token: "https://github.com/kubernetes-sigs/kind/releases/download/v0.33.0/kind-linux-amd64.sha256sum"
        text: "The checksum file for that kind binary. The lesson takes it from the v0.33.0 release."
      - token: "echo"
        text: "Writes a checksum line to the pipe."
      - token: "\"$(cut -d' ' -f1 kind.sha256sum)  kind\""
        text: "The line sha256sum checks. cut -d sets the field separator to a space, and -f1 prints the first field, which is the checksum. Two spaces and the name kind follow."
      - token: "|"
        text: "Shell. Sends the previous command's standard output to the next command."
      - token: "sha256sum"
        text: "Checks the SHA-256 checksum."
      - token: "--check"
        text: "Compare the checksums it reads with the files. A match prints OK."
      - token: "chmod"
        text: "Changes file permissions."
      - token: "+x"
        text: "Adds the execute permission."
      - token: "kind"
        text: "The file chmod marks executable."
      - token: "&&"
        text: "Shell. Runs the next command only if the previous command succeeded."
      - token: "sudo"
        text: "Runs the next command with superuser privileges."
      - token: "mv"
        text: "Moves the file into the destination directory."
      - token: "kind"
        text: "The binary being moved."
      - token: "/usr/local/bin/"
        text: "The destination directory."
      - token: "kind"
        text: "The kind client."
      - token: "version"
        text: "Prints the kind CLI version."
```

```rail
id: "kind-first"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kind"
        text: "The kind client."
      - token: "create"
        text: "The kind command group for creating things."
      - token: "cluster"
        text: "Creates a local Kubernetes cluster. kind's own description says it uses container nodes. The quick start says kind can use Docker, Podman or nerdctl."
      - token: "--name"
        text: "Sets the cluster name. kind says this overrides KIND_CLUSTER_NAME and the config, and that the default name is kind."
      - token: "first"
        text: "The cluster name. kind prefixes the kubectl context with kind-, so the context is kind-first."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "nodes"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
```

```rail
id: "kind-lab"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kind"
        text: "The kind client."
      - token: "create"
        text: "The kind command group for creating things."
      - token: "cluster"
        text: "Creates a local Kubernetes cluster. kind's own description says it uses container nodes. The quick start says kind can use Docker, Podman or nerdctl."
      - token: "--config"
        text: "Path to a kind config file. The kind configuration page shows kind create cluster --config=config.yaml."
      - token: "kind-lab.yaml"
        text: "The config file. The lesson saves it with name lab, one control-plane node and two workers."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "nodes"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
```

```rail
id: "kind-pinned"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kind"
        text: "The kind client."
      - token: "create"
        text: "The kind command group for creating things."
      - token: "cluster"
        text: "Creates a local Kubernetes cluster. kind's own description says it uses container nodes. The quick start says kind can use Docker, Podman or nerdctl."
      - token: "--name"
        text: "Sets the cluster name. The default name is kind."
      - token: "pinned"
        text: "The cluster name passed to --name."
      - token: "--image"
        text: "Node docker image to use for booting the cluster. The kind quick start says a different image changes the Kubernetes version."
      - token: "kindest/node:v1.37.0@sha256:a1ed56cfb0e7b93589bdf97c8cd566405a265939e3620fc4f5de89adff580ae5"
        text: "The image name and digest. kind's release notes ask you to use the full @sha256 digest so you get the image built for that kind release."
      - token: "kind"
        text: "The kind client."
      - token: "delete"
        text: "The kind command group for deleting things."
      - token: "cluster"
        text: "Deletes a kind cluster. kind says this is idempotent: if the cluster is already gone, the command returns success."
      - token: "--name"
        text: "The cluster name. If you omit it, kind deletes the default cluster, named kind."
      - token: "pinned"
        text: "The cluster name passed to --name."
```

```rail
id: "docker-ps"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker"
        text: "The docker client. The lesson uses it because a kind node is a Docker container."
      - token: "ps"
        text: "List containers. kind nodes show up here because each node is a container."
      - token: "--format"
        text: "Format the output with a custom template. The docker ps docs say a value that starts with table prints a table using the template that follows."
      - token: "'table {{.Names}}\\t{{.Image}}\\t{{.Ports}}'"
        text: "The template, in single quotes. table asks for column headers. {{.Names}}, {{.Image}} and {{.Ports}} are fields of each container. \\t is a tab between columns."
```

```rail
id: "crictl-ps"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker"
        text: "The docker client. The lesson uses it because a kind node is a Docker container."
      - token: "exec"
        text: "docker exec runs a command in a running container. This line passes no docker flags."
      - token: "lab-worker"
        text: "The container name. It is the kind worker node from this lesson."
      - token: "crictl"
        text: "A debugging client for a CRI runtime. The lesson runs the copy that is already inside the node."
      - token: "ps"
        text: "List containers. The crictl command list names ps as the command that lists containers."
```

```rail
id: "get-contexts"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "config"
        text: "The command group for kubeconfig entries: contexts, clusters and users."
      - token: "get-contexts"
        text: "Display one or many contexts from the kubeconfig file. The examples start with listing every context."
```

```rail
id: "switch-context"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "config"
        text: "The command group for kubeconfig entries."
      - token: "use-context"
        text: "Set the current-context in a kubeconfig file. The synopsis is kubectl config use-context CONTEXT_NAME."
      - token: "kind-first"
        text: "The context name. The lesson's get-contexts output lists it."
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
      - token: "nodes"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "--context"
        text: "The name of the kubeconfig context to use. This flag is inherited by kubectl commands, and it applies to this one command."
      - token: "kind-lab"
        text: "The context name passed to --context. The lesson uses it to read the other cluster without changing current-context."
```

```rail
id: "config-view"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "config"
        text: "The command group for kubeconfig entries."
      - token: "view"
        text: "Display merged kubeconfig settings or a specified kubeconfig file. The docs say you can add --output jsonpath={...} to extract one value."
      - token: "--minify"
        text: "Remove all information not used by current-context from the output. The lesson uses it so the printout shows only the context you are on."
```

```rail
id: "set-namespace"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "config"
        text: "The command group for kubeconfig entries."
      - token: "set-context"
        text: "Set a context entry in kubeconfig. The docs say that if the name already exists, new fields merge on top of the existing values for those fields."
      - token: "--current"
        text: "Modify the current context. The synopsis allows NAME or --current."
      - token: "--namespace=kube-system"
        text: "The namespace for the context entry. The short form is -n. The value here is kube-system, so later commands that omit -n use that namespace."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "config"
        text: "The command group for kubeconfig entries."
      - token: "set-context"
        text: "Set a context entry in kubeconfig, merging onto the fields you name."
      - token: "--current"
        text: "Modify the current context."
      - token: "--namespace=default"
        text: "Sets the context's namespace back to default."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "get"
        text: "Display one or many resources. kubectl get prints a table of the most important information about the resources you name."
      - token: "pods"
        text: "The resource type to display. kubectl get points you to kubectl api-resources for the full list of types the server supports."
```

```rail
id: "merge-kubeconfig"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kind"
        text: "The kind client."
      - token: "get"
        text: "The kind command group for reading cluster information."
      - token: "kubeconfig"
        text: "Prints cluster kubeconfig. kind writes it to standard output."
      - token: "--name"
        text: "The cluster context name. kind's default name is kind."
      - token: "first"
        text: "The cluster name passed to --name."
      - token: ">"
        text: "Shell. Writes the command's standard output to the file that follows, replacing that file."
      - token: "first.kubeconfig"
        text: "The file that receives the kubeconfig."
      - token: "kind"
        text: "The kind client."
      - token: "get"
        text: "The kind command group for reading cluster information."
      - token: "kubeconfig"
        text: "Prints cluster kubeconfig."
      - token: "--name"
        text: "The cluster context name."
      - token: "lab"
        text: "The cluster name passed to --name."
      - token: ">"
        text: "Shell. Writes the command's standard output to the file that follows, replacing that file."
      - token: "lab.kubeconfig"
        text: "The file that receives this cluster's kubeconfig."
      - token: "chmod"
        text: "Changes file permissions."
      - token: "600"
        text: "Owner can read and write. Group and everyone else have no permission. The lesson says a kubeconfig is a credential, so keep it private with chmod 600."
      - token: "first.kubeconfig"
        text: "One of the two files chmod changes."
      - token: "lab.kubeconfig"
        text: "The other file chmod changes."
      - token: "KUBECONFIG=first.kubeconfig:lab.kubeconfig"
        text: "Sets the KUBECONFIG variable for this one command. The kind quick start says that when KUBECONFIG is set, it is a list of paths, merged, using your system's path separator. On Linux that separator is a colon."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "config"
        text: "The command group for kubeconfig entries."
      - token: "get-contexts"
        text: "Display one or many contexts from the kubeconfig file. With KUBECONFIG set, kubectl reads the merged files."
```

```rail
id: "delete-clusters"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "kind"
        text: "The kind client."
      - token: "delete"
        text: "The kind command group for deleting things."
      - token: "cluster"
        text: "Deletes a kind cluster. kind says this is idempotent: deleting a cluster that does not exist returns success."
      - token: "--name"
        text: "The cluster name. If you omit it, kind deletes the default cluster, named kind."
      - token: "lab"
        text: "The cluster name passed to --name."
      - token: "kind"
        text: "The kind client."
      - token: "delete"
        text: "The kind command group for deleting things."
      - token: "cluster"
        text: "Deletes a kind cluster."
      - token: "--name"
        text: "The cluster name."
      - token: "first"
        text: "The cluster name passed to --name."
      - token: "kubectl"
        text: "The Kubernetes command-line client. Subcommands and flags are documented under kubernetes.io/docs/reference/kubectl/."
      - token: "config"
        text: "The command group for kubeconfig entries."
      - token: "get-contexts"
        text: "Display one or many contexts from the kubeconfig file. The lesson's output is empty after both deletes."
```

```rail
id: "raise-inotify"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "sudo"
        text: "Runs the next command with superuser privileges. Setting these kernel parameters needs that."
      - token: "sysctl"
        text: "Reads or writes kernel parameters. The kind known issues page uses it to raise inotify limits on the host."
      - token: "fs.inotify.max_user_instances=512"
        text: "The parameter and the value. The known issues page says Ubuntu's default of 128 is too low for many nodes, and it shows 512."
      - token: "sudo"
        text: "Runs the next command with superuser privileges."
      - token: "sysctl"
        text: "Writes a kernel parameter."
      - token: "fs.inotify.max_user_watches=524288"
        text: "The watches limit. The same page says Ubuntu's default is 8192 and shows 524288."
```
