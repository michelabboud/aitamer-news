---
title: "Containers from Zero, part 10: clean up, and the edge of one machine"
description: "Remove the notes app and everything the series created, with a last backup first, and check that Docker's disk usage is back to zero. Then see what Compose does on one machine, what it leaves to a cluster, and where Kubernetes from Zero picks up."
pubDate: "2027-02-03T22:00:00Z"
series: containers-from-zero
series_order: 10
section: devops
subsection: containers
tags:
  - containers-from-zero
  - docker
  - compose
  - tutorial
draft: false
author: caret
lessonKit:
  id: containers-10
wildness:
  rating: 1
  verified: "Removed every object the series made, back to zero in docker system df, Engine 29.10.1, 25 Nov 2026"
  claimed: "What a cluster manager does is described from the Docker Swarm documentation, not run here"
verdict: "Project commands clean up a project; prune commands clean up the whole machine, so read their warning before you answer y."
sources:
  - title: "docker compose down (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/compose/down/
  - title: "docker compose ls (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/compose/ls/
  - title: "docker system df (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/system/df/
  - title: "docker image rm (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/image/rm/
  - title: "docker builder prune (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/builder/prune/
  - title: "docker system prune (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/system/prune/
  - title: "docker volume prune (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/volume/prune/
  - title: "docker image prune (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/image/prune/
  - title: "Use Compose in production (Docker documentation)"
    url: https://docs.docker.com/compose/how-tos/production/
  - title: "Why use Compose? (Docker documentation)"
    url: https://docs.docker.com/compose/intro/features-uses/
  - title: "Start containers automatically (Docker documentation)"
    url: https://docs.docker.com/engine/containers/start-containers-automatically/
  - title: "Swarm mode (Docker documentation)"
    url: https://docs.docker.com/engine/swarm/
  - title: "Containers from Zero, part 9: when something fails"
    url: https://aitamer.news/posts/containers-from-zero-09-when-something-fails/
  - title: "Overview (Kubernetes documentation)"
    url: https://kubernetes.io/docs/concepts/overview/
  - title: "Kubernetes from Zero, part 1: what Kubernetes is and why it exists"
    url: https://aitamer.news/posts/k8s-from-zero-01-what-kubernetes-is/
  - title: "Containers from Zero (series page)"
    url: https://aitamer.news/series/containers-from-zero/
  - title: "Docker documentation"
    url: https://docs.docker.com/
---

Nine parts built up a small app: images, containers, volumes, a network, a Compose file, a database, settings in `.env`, health checks and restart policies. [Part 9](https://aitamer.news/posts/containers-from-zero-09-when-something-fails/) left it running. This last part takes it all apart, in an order where each command removes only what you mean it to, and checks the result. Then it looks at what everything in this series has in common: it ran on one machine. That is where Compose stops, and where [Kubernetes from Zero](https://aitamer.news/posts/k8s-from-zero-01-what-kubernetes-is/) starts.

## Time and setup

- **Reading:** about 10 minutes.
- **Optional lab:** about 15 minutes.
- **Optional advanced step:** about 3 minutes.

You need the `hello` and `notes` folders from the earlier parts. The series uses Docker Engine 29.10.1 and Compose v5.8.0, and writes `docker` without `sudo`. If you skipped parts of the lab, some objects below will not exist on your machine; the commands then say so and change nothing.

## What you will build

Nothing, this time. At the end, `docker system df` shows zero images, containers, volumes and build cache from the series, the two project folders are gone, and one file is left: a last backup of the notes.

## Two kinds of clean-up command

Some commands work on one Compose project. `docker compose down` removes the project's containers and networks. The [down reference](https://docs.docker.com/reference/cli/docker/compose/down/) describes the two options this lab adds: `-v` removes "named volumes declared in the "volumes" section of the Compose file and anonymous volumes attached to containers", and `--rmi local` removes images used by services that "don't have a custom tag". `notes-web` qualifies, because Compose built and named it; `postgres:18-alpine` does not, because the file names it.

Other commands work on the whole machine. Each `prune` command removes everything of its kind that nothing uses, from any project:

- [`docker system prune`](https://docs.docker.com/reference/cli/docker/system/prune/) removes stopped containers, unused networks, dangling images and unused build cache. `--volumes` adds unused anonymous volumes; `-a` removes unused images, not only dangling ones.
- [`docker volume prune`](https://docs.docker.com/reference/cli/docker/volume/prune/) "By default, it only removes anonymous volumes." `-a` removes "all unused volumes, not just anonymous ones".
- [`docker image prune`](https://docs.docker.com/reference/cli/docker/image/prune/) removes dangling images, images with no name left; `-a` removes "all unused images, not just dangling ones".
- [`docker builder prune`](https://docs.docker.com/reference/cli/docker/builder/prune/) removes dangling build cache by default; `-a` removes "all unused build cache, not just dangling ones".

A stopped container you meant to start again counts as unused, and so, for `docker volume prune -a`, does a named volume another project keeps its data in while that project is down. So this lab removes the series' objects by project and by name, and uses only `builder prune`, which deletes dangling cache that a later build can recreate.

![A table. Rows are commands, columns are what they remove and the scope. docker compose down: the project's containers and networks; scope this project. down -v: also the project's named volumes and anonymous volumes attached to its containers. down -v --rmi local: also images the project built that have no custom tag, such as notes-web. docker image rm NAME: the named images, refused while a container uses them. docker builder prune: dangling build cache, or all unused build cache with -a; scope the whole machine. docker system prune: all stopped containers, unused networks, dangling images and unused build cache on the whole machine, highlighted; --volumes adds unused anonymous volumes. docker volume prune: unused anonymous volumes on the whole machine; -a also unused named volumes.](/diagrams/containers-from-zero-10-clean-up-and-the-edge-of-one-machine/what-each-command-removes.svg)

## Optional lab: take it all apart

This lab is optional. Every command ran on 25 November 2026 with Docker Engine 29.10.1 and Compose v5.8.0, as the user `ubuntu`; your IDs, sizes and times will differ.

> **Safety: this lab deletes data on purpose.** It deletes the volume `notes_db-data` and every note in it, after step 2 saves a backup to `~/notes-backup.sql`. It removes the projects `notes` and `hello`, the images listed in step 4, your machine's dangling build cache, and the folders `~/hello` and `~/notes` with the files you typed in. It publishes no port. Images and build cache can be pulled or rebuilt later; the notes come back only from the backup. Containers, volumes and images that belong to other work stay, as long as you remove only the names below; if a name in step 4 is also used by your own work, leave it out. To undo, there is no undo: keep `~/notes-backup.sql`, and copy the folders elsewhere first if you want them.

**1. See what is there.**

```bash rail=see-all
docker compose ls -a
docker system df
docker image ls
```

```text
NAME                STATUS              CONFIG FILES
notes               running(2)          /home/ubuntu/notes/compose.yaml
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          10        2         736.4MB   91.56MB (12%)
Containers      2         2         954.4kB   0B (0%)
Local Volumes   1         1         65.94MB   0B (0%)
Build Cache     24        0         76.52MB   94.21kB
IMAGE                ID             DISK USAGE   CONTENT SIZE   EXTRA
alpine:3.24          f59abe656b69         13MB         3.94MB
hello-app:1.0        fd0ea3351db9        178MB         43.6MB
hello-app:1.1        045cf843b4fd        178MB         43.6MB
hello-app:1.2        e3f7279a6402        178MB         43.6MB
hello-app:latest     045cf843b4fd        178MB         43.6MB
hello-web:latest     ffccb8bb8ac1        178MB         43.6MB
hello-world:latest   1e4c05b897a7       25.9kB         9.49kB
nginx:1.30-alpine    8eb2b5540eae        102MB         29.4MB
notes-web:latest     a72a73bd5c5b        211MB         51.9MB   U
postgres:18-alpine   0115267ab5a5        434MB          121MB   U
python:3.14-slim     22eafb370920        180MB         45.7MB
```

[`docker compose ls -a`](https://docs.docker.com/reference/cli/docker/compose/ls/) lists Compose projects; `hello` does not appear because part 6 removed its containers, but its image `hello-web` is still there. [`docker system df`](https://docs.docker.com/reference/cli/docker/system/df/) shows "the amount of disk space used by the Docker daemon". `U` marks the two images a container uses. `hello-app:1.1` and `hello-app:latest` share an ID: part 2 gave one image two names.

**2. Save the notes, then remove the app.**

```bash rail=notes-down
cd ~/notes
docker compose exec db pg_dump -U notes notes > ~/notes-backup.sql
wc -l ~/notes-backup.sql
docker compose down -v --rmi local
```

```text
98 /home/ubuntu/notes-backup.sql
 Container notes-web-1 Stopping
 Container notes-web-1 Stopped
 Container notes-web-1 Removing
 Container notes-web-1 Removed
 Container notes-db-1 Stopping
 Container notes-db-1 Stopped
 Container notes-db-1 Removing
 Container notes-db-1 Removed
 Volume notes_db-data Removing
 Network notes_default Removing
 Volume notes_db-data Removed
 Image notes-web:latest Removing
 Image notes-web:latest Removed
 Network notes_default Removed
```

One command removed both containers, the network, the volume with the database, and the image Compose built. The backup sits in your home folder, outside the project, because step 7 deletes the project folder. Part 8 showed how to restore it into a fresh database.

**3. Remove the image the hello project left.**

```bash rail=hello-down
cd ~/hello
docker compose down --rmi local
```

```text
 Image hello-web:latest Removing
 Image hello-web:latest Removed
```

The project had no containers left, but `down` still reads `compose.yaml`, finds the image its `build:` produced, and removes it.

**4. Remove the images by name.** First the ones you built in parts 2 and 4, then the ones Docker pulled:

```bash rail=image-rm
docker image rm hello-app:1.0 hello-app:1.1 hello-app:1.2 hello-app:latest
docker image rm python:3.14-slim alpine:3.24 nginx:1.30-alpine postgres:18-alpine hello-world
```

```text
Untagged: hello-app:1.0
Deleted: sha256:fd0ea3351db9fd1676b4c65a40625b77f217ab91fc935587b1646abceb9fccc2
Untagged: hello-app:1.1
Untagged: hello-app:1.2
Deleted: sha256:e3f7279a6402a8eddb5649881d0b8f5212f15a5560f00ce9c7f49087f379cfcb
Untagged: hello-app:latest
Deleted: sha256:045cf843b4fd7236bd2d1a66c8a98713eec96cb682597062fa4889b929770fdd
Untagged: python:3.14-slim
Deleted: sha256:22eafb370920ad8b429e0aec3fff433e0669968519f5d60469d83729c138b28b
Untagged: alpine:3.24
Deleted: sha256:f59abe656b692d901e184be3445e084786602108599d2a51d229c0f5a48c71bf
Untagged: nginx:1.30-alpine
Deleted: sha256:8eb2b5540eae779603cc3db84b3986a15ecb5308b54303146eee9837c137b51a
Untagged: postgres:18-alpine
Deleted: sha256:0115267ab5a509022df9319c77be365cef335adb71556c75f60f5360ee247e71
Untagged: hello-world:latest
Deleted: sha256:1e4c05b897a751332ce85c7e9449da2d93514ea2dea6dbb0e2753c9e949b2bfa
```

`Untagged` removes a name; `Deleted` removes the image once its last name is gone. `hello-app:1.1` was untagged without a `Deleted` line, because `hello-app:latest` still pointed at the same ID; removing that name deleted it.

**5. Remove the build cache.** Every `docker build` and `docker compose build` left cache entries that make the next build faster. This command covers the whole machine, so other projects build more slowly next time; it deletes no images or data.

```bash rail=builder-prune
docker builder prune
```

```text
WARNING! This will remove all dangling build cache. Are you sure you want to continue? [y/N] y
ID						RECLAIMABLE	SIZE		LAST ACCESSED
keb1efnuztmwrl5hz8yne4e3h*              	true 		4.096kB   	40 minutes ago
...
lgvgmlcmz5ki4bio7h6g1ycg8               	true 	29.84MB   	47 minutes ago
Total:	76.52MB
```

Answer `y` at the question. The list had 24 entries; the middle is cut here. On this machine every entry went, as step 6 shows.

**6. Check.**

```bash rail=check-empty
docker system df
docker volume ls
docker network ls
docker compose ls -a
```

```text
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          0         0         0B        0B
Containers      0         0         0B        0B
Local Volumes   0         0         0B        0B
Build Cache     0         0         0B        0B
DRIVER    VOLUME NAME
NETWORK ID     NAME      DRIVER    SCOPE
55aa58477ea4   bridge    bridge    local
2627086260d3   host      host      local
13c3cd697b49   none      null      local
NAME                STATUS              CONFIG FILES
```

All zero. The three networks left are Docker's own, from part 5; `docker network rm bridge` answers `bridge is a pre-defined network and cannot be removed`. If your machine has other work on it, your numbers will not reach zero, and that is the point of removing by name.

![Two columns from the lab's docker system df output. Before: Images 10 using 736.4MB, Containers 2 using 954.4kB, Local Volumes 1 using 65.94MB, Build Cache 24 entries using 76.52MB. After down -v --rmi local in both project folders, docker image rm for the remaining images and docker builder prune: every row is 0 and 0B, highlighted. The networks bridge, host and none stay; they belong to Docker itself.](/diagrams/containers-from-zero-10-clean-up-and-the-edge-of-one-machine/before-and-after.svg)

**7. Remove the folders.** This deletes the files you typed in: `app.py`, the Dockerfiles, the Compose files and `.env`.

```bash rail=rm-folders
cd ~
rm -r ~/hello ~/notes
ls ~/notes-backup.sql
```

```text
/home/ubuntu/notes-backup.sql
```

The backup is all that is left.

## Optional advanced: read a prune warning

Every `prune` command lists what it will remove and asks first. Reading that list is the safe way to learn its scope. Run these and answer `N`; nothing is removed:

```bash rail=prune-warnings
docker system prune --volumes
docker volume prune
```

```text
WARNING! This will remove:
  - all stopped containers
  - all networks not used by at least one container
  - all anonymous volumes not used by at least one container
  - all dangling images
  - unused build cache

Are you sure you want to continue? [y/N] N
WARNING! This will remove anonymous local volumes not used by at least one container.
Are you sure you want to continue? [y/N] N
```

"Not used by at least one container" is the rule for everything here: a stopped container still uses its volume, but a volume whose container you removed is unused. `-f` skips the question, which is how scripts run these commands; type it only once you have read the list. Run before step 2, they would have removed nothing from the notes app, because its running containers used its network, volume and images.

## The edge of one machine

Everything in this series ran on one Docker Engine on one machine. Compose read `compose.yaml` and asked that engine to create the network, the volume and the containers; the engine applied the restart policies of part 9; the volume lived on that machine's disk. Docker's [production guide](https://docs.docker.com/compose/how-tos/production/) puts it simply: "The easiest way to deploy an application is to run it on a single server, similar to how you would run your development environment." The [Compose overview](https://docs.docker.com/compose/intro/features-uses/) says "Compose supports production deployments on single hosts." Compose can also talk to a remote engine, through `DOCKER_HOST`; that is still one engine.

On one machine, everything shares that machine's fate. If it shuts down, the engine and the app stop with it; when the engine starts again, `always` and `unless-stopped` bring containers back, while `on-failure`, the [restart policies page](https://docs.docker.com/engine/containers/start-containers-automatically/) says, "doesn't restart the container if the daemon restarts", but nothing moves them to another machine while it is down. A cluster manager works on several machines at once. Docker's [Swarm documentation](https://docs.docker.com/engine/swarm/) describes the idea: the manager "constantly monitors the cluster state and reconciles any differences between the actual state and your expressed desired state". With ten replicas of a container, "if ... a worker machine hosting two of those replicas crashes, the manager creates two new replicas to replace the replicas that crashed."

Kubernetes is a cluster manager built around the same idea of desired state; its [overview](https://kubernetes.io/docs/concepts/overview/) says "You can describe the desired state for your deployed containers using Kubernetes, and it can change the actual state to the desired state at a controlled rate". It is what [Kubernetes from Zero](https://aitamer.news/posts/k8s-from-zero-01-what-kubernetes-is/) teaches, starting from what you know now: images, containers, ports, volumes and health checks all carry over. This series stops here.

![Left, one Docker host. Compose reads compose.yaml and talks to one Docker Engine, local or remote through DOCKER_HOST. The engine runs web and db and keeps the volume. Restart policies are applied by that engine. If the machine stops, everything on it stops with it, highlighted. Right, several machines run by a cluster manager. You state a desired state, for example ten replicas; when a machine crashes, the manager starts replacements on the others, as the Docker Swarm documentation describes. Kubernetes is the cluster manager Kubernetes from Zero teaches, starting with part 1.](/diagrams/containers-from-zero-10-clean-up-and-the-edge-of-one-machine/edge-of-one-machine.svg)

## When it goes wrong

**`Error response from daemon: conflict: unable to delete hello-world:latest (must be forced) - container 66dddfa5e137 is using its referenced image 1e4c05b897a7`.** A container, even a stopped one, still uses the image. This came from a `hello-world` container left over from a run. Remove it with `docker rm` and the ID from the message, then remove the image.

**`No such image`.** You removed it earlier, or never pulled it. Nothing to do.

**`no configuration file provided: not found` from `docker compose down`.** You are not in the project folder. `cd` into it first; the `CONFIG FILES` column of `docker compose ls -a` shows where it is.

**`docker system df` is not zero.** Something else on the machine uses Docker, or a container from an earlier part is still there. `docker ps -a` and `docker volume ls` show what; remove the series' objects by name.

## Cheat sheet

| Task | Command | Note |
|---|---|---|
| List projects | `docker compose ls -a` | with their folders |
| Disk usage | `docker system df` | images, containers, volumes, cache |
| Remove a project and its data | `docker compose down -v --rmi local` | in the project folder |
| Remove images by name | `docker image rm hello-app:1.0` | refused while a container uses it |
| Remove build cache | `docker builder prune` | whole machine, asks first |
| Read a prune's scope | `docker system prune --volumes` | answer N to only read |
| Unused anonymous volumes | `docker volume prune` | `-a` includes named ones |

## Recap: the series

- **Parts 1 to 3:** a container is a process with its own view of the machine; an image is its files, built from a Dockerfile; `docker run` publishes ports and `docker stop` sends a signal.
- **Parts 4 and 5:** volumes and bind mounts keep files; a user-defined network gives containers names.
- **Parts 6 and 7:** one `compose.yaml` replaces the commands, and runs a web service with a database.
- **Parts 8 and 9:** settings live in `.env`, the database in a named volume with a tested backup; health checks report and restart policies react to exits.
- **Part 10:** project commands clean up a project, prune commands the whole machine, and Compose works on one machine.

Next: [Kubernetes from Zero, part 1: what Kubernetes is and why it exists](https://aitamer.news/posts/k8s-from-zero-01-what-kubernetes-is/), for running containers on more than one machine. The [Containers from Zero series page](https://aitamer.news/series/containers-from-zero/) lists all ten parts.

*Quoted passages in this lesson come from the [Docker documentation](https://docs.docker.com/) and the [Kubernetes documentation](https://kubernetes.io/docs/). Docker® is a registered trademark of Docker, Inc. Kubernetes® is a registered trademark of The Linux Foundation. aitamer.news is not affiliated with or endorsed by Docker, Inc., The Linux Foundation or the CNCF.*

```rail
id: "see-all"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose ls -a"
        text: "List Compose projects, including stopped ones."
      - token: "docker system df"
        text: "Show how much disk space Docker uses, by kind."
      - token: "docker image ls"
        text: "List images. U marks images in use."
```

```rail
id: "notes-down"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "cd ~/notes"
        text: "Move into the notes project folder."
      - token: "docker compose exec db pg_dump -U notes notes > ~/notes-backup.sql"
        text: "Save the database to a file in your home folder."
      - token: "wc -l ~/notes-backup.sql"
        text: "Count the lines to see the file is not empty."
      - token: "docker compose down -v --rmi local"
        text: "Remove containers, the network, the volumes and the image Compose built."
```

```rail
id: "hello-down"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "cd ~/hello"
        text: "Move into the hello project folder."
      - token: "docker compose down --rmi local"
        text: "Remove what is left of the project, here the image it built."
```

```rail
id: "image-rm"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker image rm hello-app:1.0 hello-app:1.1 hello-app:1.2 hello-app:latest"
        text: "Remove the images you built with docker build, by name."
      - token: "docker image rm python:3.14-slim alpine:3.24 nginx:1.30-alpine postgres:18-alpine hello-world"
        text: "Remove the images Docker pulled for the series."
```

```rail
id: "builder-prune"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker builder prune"
        text: "Remove dangling build cache on the whole machine; -a would remove all unused cache. It asks first."
```

```rail
id: "check-empty"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker system df"
        text: "Every row should show 0."
      - token: "docker volume ls"
        text: "No volumes left."
      - token: "docker network ls"
        text: "Only Docker's own three networks."
      - token: "docker compose ls -a"
        text: "No projects left."
```

```rail
id: "rm-folders"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "cd ~"
        text: "Move to your home folder, out of the folders you delete."
      - token: "rm -r ~/hello ~/notes"
        text: "Delete both project folders and everything in them."
      - token: "ls ~/notes-backup.sql"
        text: "The backup is still there."
```

```rail
id: "prune-warnings"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker system prune --volumes"
        text: "Show what a machine-wide prune would remove. Answer N."
      - token: "docker volume prune"
        text: "Show what a volume prune would remove. Answer N."
```
