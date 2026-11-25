---
title: "Containers from Zero, part 1: what a container is"
description: "A container is an ordinary Linux process with its own view of files, processes, network and hostname. Install Docker Engine and Compose, then find one container from inside and from the host."
pubDate: "2026-12-02T22:00:00Z"
series: containers-from-zero
series_order: 1
section: devops
subsection: containers
tags:
  - containers-from-zero
  - docker
  - containers
  - tutorial
  - linux
draft: false
author: caret
lessonKit:
  id: containers-01
wildness:
  rating: 1
  verified: "Installed Docker Engine 29.10.1 and Compose v5.8.0 on Ubuntu 24.04 and ran every lab command, 25 Nov 2026"
  claimed: "macOS and Windows notes come from Docker's docs; we ran the lab on Linux only"
verdict: "A container is a process the kernel shows a smaller world. Keep that picture and the rest of Docker makes sense."
sources:
  - title: "What is a container? (Docker documentation)"
    url: https://docs.docker.com/learn/content/what-is-a-container/
  - title: "Install Docker Engine on Ubuntu (Docker documentation)"
    url: https://docs.docker.com/engine/install/ubuntu/
  - title: "Linux post-installation steps for Docker Engine (Docker documentation)"
    url: https://docs.docker.com/engine/install/linux-postinstall/
  - title: "Docker Engine 29 release notes (Docker documentation)"
    url: https://docs.docker.com/engine/release-notes/29/
  - title: "Docker Compose v5.8.0 release (GitHub)"
    url: https://github.com/docker/compose/releases/tag/v5.8.0
  - title: "History and development of Docker Compose (Docker documentation)"
    url: https://docs.docker.com/compose/intro/history/
  - title: "Docker Desktop license agreement (Docker documentation)"
    url: https://docs.docker.com/subscription-billing/desktop-license/
  - title: "namespaces(7) (Linux manual page)"
    url: https://man7.org/linux/man-pages/man7/namespaces.7.html
  - title: "cgroups(7) (Linux manual page)"
    url: https://man7.org/linux/man-pages/man7/cgroups.7.html
  - title: "About the Open Container Initiative (OCI)"
    url: https://opencontainers.org/about/overview/
  - title: "docker container run (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/container/run/
  - title: "Containers from Zero (series page)"
    url: https://aitamer.news/series/containers-from-zero/
  - title: "Docker documentation"
    url: https://docs.docker.com/
---

Containers are everywhere in software delivery, and most explanations start with a whale logo and a list of benefits. This series starts with the machine. By the end of this first part you will be able to say what a container is in one sentence, how it differs from a virtual machine, and which programs are involved when you type `docker run`. If you take the optional lab, you will also install Docker Engine and the Compose plugin on Linux and find one running container from both sides: from inside, where it looks like a tiny computer, and from the host, where it is one more process. No earlier experience with Docker is needed. You should be comfortable typing commands in a Linux terminal.

## Time and setup

- **Reading:** about 12 minutes.
- **Optional lab:** about 20 minutes, most of it the install.
- **Optional advanced step:** about 10 minutes.

The lab needs a Linux machine or virtual machine where you can use `sudo`, and an internet connection to download packages and images. We ran it on Ubuntu 24.04. Docker's [Ubuntu install page](https://docs.docker.com/engine/install/ubuntu/) also lists Ubuntu 22.04, 26.04 and 26.10.

On macOS or Windows, Docker runs Linux containers inside a small Linux virtual machine that Docker Desktop manages for you ([Docker docs](https://docs.docker.com/learn/content/what-is-a-container/)). The `docker` commands in this series work there too, but the advanced step reads Linux files under `/proc` on the host and works only on Linux. Check the [Docker Desktop licence](https://docs.docker.com/subscription-billing/desktop-license/) first: it is free for personal use, education, non-commercial open source and small businesses (fewer than 250 employees and less than $10 million in annual revenue), and needs a paid subscription for professional use in larger organizations and for government entities.

**Versions this series uses.** Every lab in this series ran on Docker Engine 29.10.1, released on 24 November 2026 according to the [Engine 29 release notes](https://docs.docker.com/engine/release-notes/29/), with containerd 2.4.2 and runc 1.5.3, and the Docker Compose plugin [v5.8.0](https://github.com/docker/compose/releases/tag/v5.8.0). The command is `docker compose`, with a space. Docker's [Compose history page](https://docs.docker.com/compose/intro/history/) says Compose v5 is functionally identical to Compose v2 and uses the same `docker compose` command. The old Python tool `docker-compose`, with a hyphen, is Compose v1; the same page lists only v2 and v5 as supported today.

## What you will build

Nothing permanent yet. You will install Docker, run the `hello-world` test image, start one small Alpine Linux container that sleeps, and inspect it from the inside and from the host. Then you will delete it. Part 2 builds your first image, and the rest of the series grows that image into a small web app with a database.

## A container is a process with its own view

Docker's own guide puts it plainly: "A container is an ordinary process on your computer, such as a Node.js server, that runs in isolation" ([What is a container?](https://docs.docker.com/learn/content/what-is-a-container/)). The guide lists what that isolated process gets:

- **Its own filesystem.** It sees only the files it was started with, usually a small operating system's files plus your app and its libraries.
- **Its own view of the system.** Its own processes, network interfaces and hostname.
- **Limits you can set.** You can cap its memory and CPU.

On Linux, the kernel provides those three things with two features. **Namespaces** wrap a global resource so that the processes inside "appear to have their own isolated instance" of it ([namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html)). There is one namespace type per resource: a PID namespace for process numbers, a mount namespace for the filesystem view, a UTS namespace for the hostname, a network namespace for interfaces and ports, and a few more. **Control groups**, or cgroups, organize processes into groups whose use of resources such as memory and CPU "can then be limited and monitored" ([cgroups(7)](https://man7.org/linux/man-pages/man7/cgroups.7.html)).

![One Linux host runs ordinary processes such as systemd, sshd, your shell and dockerd. One of them, sleep 600 with host PID 22381, is the container. From inside, the same process is PID 1, has the hostname e5463b99575d, sees Alpine Linux files and its own network interface, and can be capped by a cgroup. All of them run on one shared Linux kernel.](/diagrams/containers-from-zero-01-what-a-container-is/a-container-is-a-process.svg)

The diagram uses numbers from our lab. The host saw the container as process 22381, running `sleep 600`. Inside the container, the same process was PID 1, the hostname was the container's short ID, and the files were Alpine Linux, although the host runs Ubuntu. `uname -r` printed the same kernel version on both sides, because there is only one kernel.

## Containers and virtual machines

A virtual machine pretends to be a whole computer. Docker's guide explains that every VM "boots its own complete operating system, including its own kernel". A container does not boot anything. "It's still a process, so every container on a machine shares that machine's kernel", which is why a container starts in about a second and why one machine can run many of them ([Docker docs](https://docs.docker.com/learn/content/what-is-a-container/)).

![Two stacks side by side. Virtual machines: hardware, a hypervisor, then two VMs, each with its own guest operating system and kernel under its app. Containers: hardware, one host operating system with one shared kernel, Docker Engine, then three containers holding only an app, its libraries and files. The shared kernel is highlighted.](/diagrams/containers-from-zero-01-what-a-container-is/containers-and-vms.svg)

The same page names the trade-off: a VM's isolation is stronger. Containers that share a kernel are separated by that kernel, while VMs are separated by the hardware boundary the hypervisor creates. In practice you use both. Cloud servers are usually VMs that run many containers each, and Docker Desktop on macOS and Windows runs your Linux containers inside a small Linux VM, because Linux containers need a Linux kernel to share.

## Images, containers and the engine

Four words come up in every lesson:

- An **image** is the package a container starts from: operating system files, a language runtime, your app and its dependencies, plus settings such as which command to run. Docker's guide calls images immutable: once built, an image never changes. Part 2 builds one.
- A **container** is a running (or stopped) instance of an image. You can start many containers from one image.
- **Docker Engine** is the server side. Its daemon, `dockerd`, stores images, containers, networks and volumes, and does the work.
- The **`docker` command** is a client. It sends your request to `dockerd` over a Unix socket, `/var/run/docker.sock`, and prints the answer.

Under `dockerd` there are two more programs. Docker's install page says "Docker Engine depends on containerd and runc" and installs them together as the `containerd.io` package ([install guide](https://docs.docker.com/engine/install/ubuntu/)). containerd manages images and containers on the host. runc is the low-level tool that asks the kernel for the namespaces and cgroup and starts your process. Docker donated runc to the [Open Container Initiative](https://opencontainers.org/about/overview/), which maintains open specifications for container images and runtimes.

![The docker CLI talks over /var/run/docker.sock to dockerd. Inside Docker Engine 29.10.1, dockerd hands the container to containerd, which unpacks the image and calls runc. runc asks the Linux kernel for namespaces and a cgroup and starts your process, which is highlighted. dockerd also keeps images, containers, networks and volumes.](/diagrams/containers-from-zero-01-what-a-container-is/who-starts-a-container.svg)

## Optional lab: install Docker and look inside a container

This lab is optional. The rest of this part, and part 2's reading, make sense without it. Every command ran on our Ubuntu 24.04 machine on 25 November 2026. IDs, process numbers and times will differ on yours.

> **Safety: this lab installs system packages and offers root-equivalent access.** Step 1 removes conflicting Docker packages your distribution may have installed and adds Docker's apt repository. Step 4 is optional and adds your user to the `docker` group. Docker's docs warn that "the docker group grants root-level privileges to the user" ([post-install steps](https://docs.docker.com/engine/install/linux-postinstall/)). Do this only on a machine you control, such as a personal laptop or a lab VM. Nothing else on the machine stops running. To undo step 4, run `sudo gpasswd -d $USER docker` and log in again. If you skip step 4, put `sudo` in front of every `docker` command in this series. Docker also warns that ports published by containers bypass `ufw` and `firewalld` rules; this part publishes no ports, and part 3 binds them to `127.0.0.1` only.

**1. Remove conflicting packages and add Docker's repository.** These lines come from the [official Ubuntu instructions](https://docs.docker.com/engine/install/ubuntu/). The first one removes unofficial packages such as `docker.io` that conflict with Docker's own. apt may report that none of them are installed, which is fine. Images and containers stored in `/var/lib/docker/` are not removed by it.

```bash rail=remove-old
sudo apt remove $(dpkg --get-selections docker.io docker-compose docker-compose-v2 docker-doc docker-buildx podman-docker containerd runc | cut -f1)
```

Then add Docker's signing key and apt source:

```bash rail=add-repo
sudo apt update
sudo apt install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo apt update
```

**2. Install Docker Engine, the CLI, containerd, Buildx and Compose.**

```bash rail=install-docker
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

This installs the newest version in the repository. To match this series exactly on Ubuntu 24.04, the install page shows how to pin a version instead: `apt list --all-versions docker-ce` lists them, and `5:29.10.1-1~ubuntu.24.04~noble` is the version string for Engine 29.10.1. The page also says to check that the service is running with `sudo systemctl status docker`, and to start it with `sudo systemctl start docker` if it is not.

**3. Check the versions and run the test image.**

```bash rail=check-versions
sudo docker version --format 'Client {{.Client.Version}} / Server {{.Server.Version}}'
sudo docker compose version
sudo docker run hello-world
```

```text
Client 29.10.1 / Server 29.10.1
Docker Compose version v5.8.0

Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
    (amd64)
 3. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.
...
```

The four numbered steps in that message are the diagram above: the client asked the daemon, the daemon pulled an image and created a container, and the container's output came back to your terminal. `Client` and `Server` are two programs, and either can be upgraded separately; both should be the same release.

**4. Optional: run docker without sudo.** Read the safety banner first. These are the [post-install steps](https://docs.docker.com/engine/install/linux-postinstall/). On Ubuntu the package already created the `docker` group, so you only add yourself to it:

```bash rail=docker-group
sudo usermod -aG docker $USER
newgrp docker
docker run hello-world
```

`newgrp docker` starts a shell with the new group for this terminal only. Log out and back in to apply it everywhere. The rest of this series writes `docker` without `sudo`.

**5. Start a container that just sleeps.** `alpine:3.24` is a very small Linux image. The container runs one command, `sleep 600`, in the background:

```bash rail=run-sleeper
docker run -d --name sleeper alpine:3.24 sleep 600
docker ps
```

```text
e5463b99575d4fcc20c158ed46c71db8e5f15bb164d5ad9ff8c8ed8ea5db6f54
CONTAINER ID   IMAGE         COMMAND       CREATED                  STATUS                  PORTS     NAMES
e5463b99575d   alpine:3.24   "sleep 600"   Less than a second ago   Up Less than a second             sleeper
```

The long line is the container's full ID. `docker ps` shows the first 12 characters, and you can use either the ID or the name in later commands. If the image was not on your machine yet, Docker first prints `Unable to find image 'alpine:3.24' locally`, pulls it, and ends the pull with `Status: Downloaded newer image for alpine:3.24`.

**6. Look from inside.** `docker exec` runs another command inside a running container:

```bash rail=look-inside
docker exec sleeper ps
docker exec sleeper hostname
docker exec sleeper grep PRETTY_NAME /etc/os-release
grep PRETTY_NAME /etc/os-release
docker exec sleeper uname -r
uname -r
```

```text
PID   USER     TIME  COMMAND
    1 root      0:00 sleep 600
    7 root      0:00 ps
e5463b99575d
PRETTY_NAME="Alpine Linux v3.24"
PRETTY_NAME="Ubuntu 24.04.5 LTS"
6.12.113+
6.12.113+
```

Inside, `sleep 600` is PID 1, and the only other process is the `ps` you just ran. The hostname is the container ID. The files say Alpine Linux, while the same `grep` on the host says Ubuntu. The kernel version is the same on both sides, because it is the same kernel.

**7. Look from the host.** `docker top` lists the container's processes with the host's process numbers:

```bash rail=look-outside
docker top sleeper
ps -o pid,user,cmd -p "$(docker inspect --format '{{.State.Pid}}' sleeper)"
```

```text
UID                 PID                 PPID                C                   STIME               TTY                 TIME                CMD
root                22381               22356               6                   11:50               ?                   00:00:00            sleep 600
    PID USER     CMD
  22381 root     sleep 600
```

The host's own `ps` finds the same process, PID 22381. Nothing about it is hidden from the host; the container's view is what is limited.

**8. Clean up.**

```bash rail=cleanup
docker rm -f sleeper
docker ps -a
```

```text
sleeper
CONTAINER ID   IMAGE         COMMAND    CREATED         STATUS                     PORTS     NAMES
7869c26536aa   hello-world   "/hello"   6 seconds ago   Exited (0) 6 seconds ago             vibrant_feistel
```

`docker rm -f` stops and removes the container in one step. `docker ps -a` also lists stopped containers. Each `hello-world` run left one behind, with a name Docker made up, such as `vibrant_feistel` here. Remove it by name: `docker rm vibrant_feistel`. The `alpine:3.24` and `hello-world` images stay on disk, so the next container starts without a download. Part 10 shows how to clean everything up.

## Optional advanced: namespaces and a cgroup from the host

This step reads Linux kernel files directly, so it works only on a Linux host. It needs a running container, so start the sleeper again first.

**Namespaces.** Every process has a folder `/proc/<pid>/ns/` with one link per namespace type. Two processes share a namespace when their links show the same number. Compare the container's process with your own shell (`$$` is your shell's PID). Reading another user's namespace links needs `sudo`:

```bash rail=compare-namespaces
docker run -d --name sleeper alpine:3.24 sleep 600
PID=$(docker inspect --format '{{.State.Pid}}' sleeper)
sudo readlink /proc/$PID/ns/pid /proc/$PID/ns/net /proc/$PID/ns/uts /proc/$PID/ns/mnt
readlink /proc/$$/ns/pid /proc/$$/ns/net /proc/$$/ns/uts /proc/$$/ns/mnt
```

```text
pid:[4026532204]
net:[4026532206]
uts:[4026532202]
mnt:[4026532201]
pid:[4026532343]
net:[4026531840]
uts:[4026532341]
mnt:[4026532340]
```

All four numbers differ: the container has its own PID, network, hostname and mount namespaces. These are exactly the four views you saw in step 6.

**A cgroup limit.** On a cgroup v2 host, a container sees its own memory limit in `/sys/fs/cgroup/memory.max`. Without a limit it says `max`. With `--memory 64m` it is 64 MiB in bytes:

```bash rail=memory-limit
docker exec sleeper cat /sys/fs/cgroup/memory.max
docker run --rm --memory 64m alpine:3.24 cat /sys/fs/cgroup/memory.max
docker rm -f sleeper
```

```text
max
67108864
sleeper
```

67108864 is 64 × 1024 × 1024. `--rm` deletes that second container as soon as its command finishes. `docker info --format '{{.CgroupVersion}}'` prints `2` on a cgroup v2 host, as ours did.

## When it goes wrong

**`permission denied while trying to connect to the Docker daemon socket`.** Your user cannot open `/var/run/docker.sock`. Use `sudo`, or finish step 4 and open a new login session. `id -nG` lists your groups; `docker` must be among them.

**`Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`** The client works but `dockerd` is not running. Check with `sudo systemctl status docker` and start it with `sudo systemctl start docker`.

**`docker-compose: command not found`.** That is the old v1 command name. Type `docker compose`, with a space. If that fails too, the `docker-compose-plugin` package is missing; install it as in step 2.

**`WARNING: Error loading config file: /home/user/.docker/config.json - stat /home/user/.docker/config.json: permission denied`.** You ran `docker` with `sudo` before joining the group, so `~/.docker` is owned by root. The post-install page gives the fix: `sudo chown "$USER":"$USER" /home/"$USER"/.docker -R` and `sudo chmod g+rwx "$HOME/.docker" -R`.

**`Conflict. The container name "/sleeper" is already in use`.** A container with that name still exists, perhaps stopped. Remove it with `docker rm -f sleeper`, or pick another name.

**apt reports conflicts with `containerd` or `docker.io`.** A distribution package is still installed. Run the removal line from step 1 again.

## Cheat sheet

| Task | Command | Note |
|---|---|---|
| Client and server versions | `docker version` | both should be the same release |
| Compose version | `docker compose version` | `docker compose`, with a space |
| Test the install | `docker run hello-world` | prints the four steps Docker took |
| Run in the background | `docker run -d --name sleeper alpine:3.24 sleep 600` | prints the full container ID |
| Running containers | `docker ps` | add `-a` for stopped ones too |
| Run a command inside | `docker exec sleeper ps` | the container must be running |
| Host view of its processes | `docker top sleeper` | host process numbers |
| The host PID | `docker inspect --format '{{.State.Pid}}' sleeper` | one more process on the host |
| Memory limit | `docker run --memory 64m ...` | seen inside as `memory.max` |
| Remove when done | `--rm` on `docker run` | deletes the container on exit |
| Stop and remove | `docker rm -f sleeper` | `-f` stops it first |

## Recap and what is next

- A container is an ordinary process with its own filesystem, its own view of processes, network and hostname, and optional resource limits.
- On Linux, namespaces give the process its view and cgroups limit what it can use. Every container shares the host's kernel.
- A virtual machine boots a whole operating system with its own kernel. It isolates more strongly and starts more slowly.
- `docker` is a client; `dockerd` does the work, with containerd and runc underneath.
- This series uses Docker Engine 29.10.1 and Compose v5.8.0, and always types `docker compose`.

Next: Containers from Zero, part 2: images and a Dockerfile, where you write a five-line Dockerfile for a small Python web server and see which layer each line adds. The [series page](https://aitamer.news/series/containers-from-zero/) lists each part as it is published.

*Quoted passages in this lesson come from the [Docker documentation](https://docs.docker.com/) and from the Linux man-pages project ([namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html), [cgroups(7)](https://man7.org/linux/man-pages/man7/cgroups.7.html)). Docker® is a registered trademark of Docker, Inc. aitamer.news is not affiliated with or endorsed by Docker, Inc.*

```rail
id: "remove-old"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "sudo"
        text: "Runs the next command with superuser privileges. Removing packages needs that."
      - token: "apt"
        text: "Ubuntu's package manager."
      - token: "remove"
        text: "Removes the packages that follow. Their configuration files stay on disk."
      - token: "$( … )"
        text: "Shell command substitution. The shell runs the command inside and pastes its output here, so apt receives a list of package names."
      - token: "dpkg --get-selections"
        text: "Prints each named package that dpkg knows about, followed by a tab and its state. For a name it does not know, it prints a warning instead."
      - token: "docker.io docker-compose docker-compose-v2 docker-doc docker-buildx podman-docker containerd runc"
        text: "The unofficial or separately packaged names Docker's install page says to remove, because they conflict with Docker's own packages."
      - token: "|"
        text: "Shell. Sends the previous command's output to the next command."
      - token: "cut -f1"
        text: "Keeps only the first tab-separated field of each line, which is the package name."
```

```rail
id: "add-repo"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "sudo apt update"
        text: "Refreshes apt's list of available packages."
      - token: "sudo apt install ca-certificates curl"
        text: "Installs the certificate store and curl, which the next lines use to download Docker's signing key over HTTPS."
      - token: "sudo install -m 0755 -d /etc/apt/keyrings"
        text: "Creates the folder /etc/apt/keyrings with mode 0755. -d means create a directory, -m sets its permissions."
      - token: "sudo curl -fsSL"
        text: "Downloads with curl. -f fails on an HTTP error, -s hides the progress bar, -S still shows errors, -L follows redirects."
      - token: "https://download.docker.com/linux/ubuntu/gpg"
        text: "Docker's public signing key for its Ubuntu packages."
      - token: "-o /etc/apt/keyrings/docker.asc"
        text: "Writes the key to this file."
      - token: "sudo chmod a+r /etc/apt/keyrings/docker.asc"
        text: "Lets every user read the key file, so apt can read it."
      - token: "sudo tee /etc/apt/sources.list.d/docker.sources"
        text: "tee writes its input to the named file, here as root. The input is the block up to EOF."
      - token: "<<EOF"
        text: "Shell. A here-document: the lines up to the line EOF become tee's input. The shell still expands $( … ) inside it."
      - token: "Types: deb"
        text: "The apt source holds binary packages."
      - token: "URIs: https://download.docker.com/linux/ubuntu"
        text: "Docker's apt repository for Ubuntu."
      - token: "Suites: $(. /etc/os-release && echo \"${UBUNTU_CODENAME:-$VERSION_CODENAME}\")"
        text: "Reads /etc/os-release and prints your Ubuntu codename, such as noble for 24.04, so apt picks the matching packages."
      - token: "Components: stable"
        text: "The stable channel of Docker's repository."
      - token: "Architectures: $(dpkg --print-architecture)"
        text: "Your machine's architecture as dpkg names it, such as amd64 or arm64."
      - token: "Signed-By: /etc/apt/keyrings/docker.asc"
        text: "apt accepts packages from this source only if they are signed with this key."
      - token: "EOF"
        text: "Ends the here-document."
      - token: "sudo apt update"
        text: "Refreshes the package list again, now including Docker's repository."
```

```rail
id: "install-docker"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "sudo apt install"
        text: "Installs packages with apt, as root."
      - token: "docker-ce"
        text: "Docker Engine, the daemon dockerd. ce stands for Community Edition."
      - token: "docker-ce-cli"
        text: "The docker command-line client."
      - token: "containerd.io"
        text: "Docker's bundle of containerd and runc, which the install page says Docker Engine depends on."
      - token: "docker-buildx-plugin"
        text: "Buildx, the build plugin behind docker build."
      - token: "docker-compose-plugin"
        text: "Compose v2 and later, used as docker compose."
```

```rail
id: "check-versions"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "sudo docker version"
        text: "Shows the version of the docker client and of the daemon it talks to."
      - token: "--format 'Client {{.Client.Version}} / Server {{.Server.Version}}'"
        text: "A Go template that prints only the two version numbers instead of the full report."
      - token: "sudo docker compose version"
        text: "Prints the Compose plugin's version."
      - token: "sudo docker run hello-world"
        text: "Creates and starts a container from the hello-world image, pulling the image first if it is missing. The container prints a message and exits."
```

```rail
id: "docker-group"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "sudo usermod -aG docker $USER"
        text: "Adds your user to the docker group. -a appends, so you keep your other groups. -G names the group. $USER is your user name."
      - token: "newgrp docker"
        text: "Starts a new shell whose group is docker, so this terminal can use the socket now. Other sessions need a fresh login."
      - token: "docker run hello-world"
        text: "The same test as before, now without sudo. If it works, the group change worked."
```

```rail
id: "run-sleeper"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker run"
        text: "Create and run a new container from an image."
      - token: "-d"
        text: "Detached. Run the container in the background and print its ID."
      - token: "--name sleeper"
        text: "Gives the container a name you can use instead of its ID. Names must be unique."
      - token: "alpine:3.24"
        text: "The image, repository alpine at tag 3.24. Docker pulls it from Docker Hub if it is not on your machine."
      - token: "sleep 600"
        text: "The command the container runs: wait 600 seconds. The container stops when this command ends."
      - token: "docker ps"
        text: "List running containers."
```

```rail
id: "look-inside"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker exec"
        text: "Execute a command in a running container."
      - token: "sleeper"
        text: "The container name from step 5."
      - token: "ps"
        text: "Lists processes. This is BusyBox ps from inside the Alpine image."
      - token: "hostname"
        text: "Prints the container's hostname, which Docker sets to the short container ID."
      - token: "grep PRETTY_NAME /etc/os-release"
        text: "Prints the operating system's name from its os-release file. First inside the container, then on the host."
      - token: "uname -r"
        text: "Prints the kernel release. First inside the container, then on the host."
```

```rail
id: "look-outside"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker top"
        text: "Display the running processes of a container, with host process numbers."
      - token: "sleeper"
        text: "The container name."
      - token: "ps -o pid,user,cmd -p"
        text: "The host's ps, showing the PID, user and command of one process."
      - token: "\"$(docker inspect --format '{{.State.Pid}}' sleeper)\""
        text: "Command substitution. docker inspect prints the container's details; the template picks .State.Pid, the host PID of the container's main process."
```

```rail
id: "cleanup"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker rm"
        text: "Remove one or more containers."
      - token: "-f"
        text: "Force. Stops a running container first, then removes it."
      - token: "sleeper"
        text: "The container name."
      - token: "docker ps -a"
        text: "List all containers, including stopped ones."
```

```rail
id: "compare-namespaces"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker run -d --name sleeper alpine:3.24 sleep 600"
        text: "Starts the sleeper container again in the background, as in step 5."
      - token: "PID=$(docker inspect --format '{{.State.Pid}}' sleeper)"
        text: "Stores the container's host PID in the shell variable PID."
      - token: "sudo readlink"
        text: "Prints where a symbolic link points. Reading another user's namespace links needs root."
      - token: "/proc/$PID/ns/pid /proc/$PID/ns/net /proc/$PID/ns/uts /proc/$PID/ns/mnt"
        text: "The container process's links for its PID, network, UTS (hostname) and mount namespaces. namespaces(7) says processes in the same namespace show the same identifier."
      - token: "readlink /proc/$$/ns/pid /proc/$$/ns/net /proc/$$/ns/uts /proc/$$/ns/mnt"
        text: "The same four links for your own shell. $$ is the shell's own PID. These are your own process, so no sudo."
```

```rail
id: "memory-limit"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker exec sleeper cat /sys/fs/cgroup/memory.max"
        text: "Reads the container's cgroup v2 memory limit from inside. max means no limit."
      - token: "docker run --rm"
        text: "Runs a container and removes it as soon as it exits."
      - token: "--memory 64m"
        text: "Memory limit for the container, here 64 MiB."
      - token: "alpine:3.24 cat /sys/fs/cgroup/memory.max"
        text: "The image, and the command that prints the limit the container now has."
      - token: "docker rm -f sleeper"
        text: "Stops and removes the sleeper container."
```
