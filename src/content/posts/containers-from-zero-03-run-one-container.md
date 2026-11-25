---
title: "Containers from Zero, part 3: run one container"
description: "Run hello-app with a published port and an environment variable, read its logs, then stop, start and remove it. See why docker stop sometimes takes ten seconds, and why this series binds ports to 127.0.0.1."
pubDate: "2026-12-16T22:00:00Z"
series: containers-from-zero
series_order: 3
section: devops
subsection: containers
tags:
  - containers-from-zero
  - docker
  - containers
  - networking
  - tutorial
draft: false
author: caret
lessonKit:
  id: containers-03
wildness:
  rating: 1
  verified: "Ran, logged, stopped, restarted and removed hello-app 1.1 on Engine 29.10.1; timed docker stop, 25 Nov 2026"
  claimed: "Firewall and IPv6 publishing notes come from Docker's docs; we tested IPv4 on 127.0.0.1 only"
verdict: "Publish to 127.0.0.1 unless you mean to share the port, and make PID 1 handle SIGTERM so docker stop is quick."
sources:
  - title: "docker container run (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/container/run/
  - title: "Port publishing and mapping (Docker documentation)"
    url: https://docs.docker.com/engine/network/port-publishing/
  - title: "Install Docker Engine on Ubuntu: firewall limitations (Docker documentation)"
    url: https://docs.docker.com/engine/install/ubuntu/
  - title: "docker container logs (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/container/logs/
  - title: "View container logs (Docker documentation)"
    url: https://docs.docker.com/engine/logging/
  - title: "docker container stop (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/container/stop/
  - title: "docker container rm (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/container/rm/
  - title: "docker container ps (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/container/ps/
  - title: "Dockerfile reference (Docker documentation)"
    url: https://docs.docker.com/reference/dockerfile/
  - title: "Containers from Zero, part 2: images and a Dockerfile"
    url: https://aitamer.news/posts/containers-from-zero-02-images-and-a-dockerfile/
  - title: "Containers from Zero (series page)"
    url: https://aitamer.news/series/containers-from-zero/
  - title: "Docker documentation"
    url: https://docs.docker.com/
---

In [part 2](https://aitamer.news/posts/containers-from-zero-02-images-and-a-dockerfile/) you built `hello-app` and looked at its layers, but you never reached it from your browser or terminal. This part runs it properly. You will publish its port so the host can reach it, set its greeting from the command line without rebuilding, read its logs, and walk the container through its whole life: running, stopped, started again, and removed. You will also see why `docker stop` finishes at once for some containers and takes ten seconds for others, and why every port in this series is bound to `127.0.0.1`.

## Time and setup

- **Reading:** about 12 minutes.
- **Optional lab:** about 15 minutes.
- **Optional advanced step:** about 5 minutes.

You need the `hello-app:1.1` image from part 2, and `curl`, which most Linux distributions include. The series uses Docker Engine 29.10.1 and Compose v5.8.0, and writes `docker` without `sudo`.

## What you will build

One container named `hello`, running `hello-app:1.1`, reachable at `http://127.0.0.1:8080/` from your machine only, with its greeting set to `Shalom`. You will read what it logs, stop it, start it again, and remove it.

## Publishing a port

A container has its own network namespace (part 1), so its port 8000 is not your machine's port 8000. To reach it from the host you **publish** a port with `-p` ([port publishing](https://docs.docker.com/engine/network/port-publishing/)). The format is `HOST_IP:HOST_PORT:CONTAINER_PORT`; the host IP is optional. `EXPOSE` in the Dockerfile does not do this for you; it only documents the port.

The host IP matters. Docker's docs say `-p 8080:80` maps "port 8080 on any address on the Docker host" to the container, and add: "Publishing container ports is insecure by default. Meaning, when you publish a container's ports it becomes available not only to the Docker host, but to the outside world as well." With `127.0.0.1` in front, "only the Docker host can access the published container port." The [Ubuntu install page](https://docs.docker.com/engine/install/ubuntu/) also warns that if you use `ufw` or `firewalld`, ports you publish with Docker bypass your firewall rules. That is why every lab in this series publishes on `127.0.0.1`.

![On the Docker host, curl asks for 127.0.0.1:8080. The highlighted rule from -p 127.0.0.1:8080:8000 forwards it to port 8000 in the container hello, where python app.py listens on its own interface, for example 172.17.0.2, and logs requests from 172.17.0.1. Another computer asking for the host's address on port 8080 gets no answer, because only 127.0.0.1 is published; -p 8080:8000 would publish on every address and bypass ufw and firewalld.](/diagrams/containers-from-zero-03-run-one-container/port-publishing.svg)

The host port must be free. Two containers, or a container and a program on your machine, cannot both listen on `127.0.0.1:8080`. This series uses 8080 and 8081.

## Environment variables: configuration without a rebuild

`-e NAME=value` sets an environment variable in the container ([docker run](https://docs.docker.com/reference/cli/docker/container/run/)). It overrides a value baked into the image with `ENV`. `hello-app` reads `GREETING`, which the Dockerfile set to `Hello`; `-e GREETING=Shalom` changes it for one container. The image stays the same. Part 8 takes this further with Compose and a `.env` file.

## Logs are standard output

Docker captures what the container's main process writes to standard output and standard error. In the [logging docs'](https://docs.docker.com/engine/logging/) words, "By default, docker logs shows the command's STDOUT and STDERR." That is why `hello-app` prints its log lines with `flush=True` instead of writing them to a file inside the container. `docker logs` works on stopped containers too, until the container is removed.

## The life of a container

A container is created, runs, exits, and is eventually removed. `docker run` does the first two steps at once. A stopped container keeps its ID, name, settings, writable layer and exit code, so `docker start` brings back the same container. `docker rm` deletes it, and `--rm` on `docker run` deletes it automatically when it exits.

![Three states: created, running (highlighted) and exited. docker run creates and starts in one step. docker stop moves running to exited, docker start moves exited back to running. docker rm removes a created or exited container, docker rm -f also removes a running one, and --rm removes a container when it exits.](/diagrams/containers-from-zero-03-run-one-container/container-lifecycle.svg)

## How docker stop works

The [docker stop reference](https://docs.docker.com/reference/cli/docker/container/stop/) says: "The main process inside the container will receive SIGTERM, and after a grace period, SIGKILL." The grace period is 10 seconds for Linux containers unless you pass `--timeout`. A process that exits on `SIGTERM` stops at once; one that ignores it is killed after the grace period.

PID 1 is special here. The [run reference](https://docs.docker.com/reference/cli/docker/container/run/) warns that a process running as PID 1 "ignores any signal with the default action. So, the process doesn't terminate on SIGINT or SIGTERM unless it's coded to do so." `hello-app` is coded to do so: its `stop` function handles `SIGTERM`. The exec form of `CMD` from part 2 matters too: it starts `python` itself as PID 1, so the signal reaches your code. The shell form would start `/bin/sh -c` as PID 1 instead, which the [Dockerfile reference](https://docs.docker.com/reference/dockerfile/) says "does not pass signals". We tried it on `python:3.14-slim`: with `CMD python app.py`, PID 1 was `/bin/sh -c python app.py`, the handler never ran, and `docker stop` took 10.1 seconds. Other base images can behave differently; the exec form avoids the question.

![docker stop sends SIGTERM to PID 1 and waits up to 10 seconds before SIGKILL. hello-app handles SIGTERM and exits with code 0 after 0.22 seconds (highlighted). python -m http.server as PID 1 has no handler, so it is killed after 10.1 seconds with exit code 137, 128 plus 9. With --init, docker-init is PID 1 and passes SIGTERM on, and the server exits in 0.10 seconds with code 143, 128 plus 15.](/diagrams/containers-from-zero-03-run-one-container/docker-stop-signals.svg)

## Optional lab: run hello-app

This lab is optional. It creates and removes containers named `hello`, `hello2` and `once`, and leaves your images alone. Every command ran on 25 November 2026 with Docker Engine 29.10.1; IDs, addresses and times will differ on yours.

> **Safety: this lab publishes ports 8080 and 8081 on 127.0.0.1.** If another program already listens on one of them, Docker refuses to start the container and nothing else is affected; pick a free port such as `127.0.0.1:8090:8000`. `ss -ltn` lists the ports in use. Because the address is `127.0.0.1`, nothing is opened to your network. Nothing is deleted except the containers this lab creates. To undo everything, run `docker rm -f hello hello2 once`.

**1. Run hello-app with a published port and a greeting.**

```bash rail=run-hello
docker run -d --name hello -p 127.0.0.1:8080:8000 -e GREETING=Shalom hello-app:1.1
docker ps
```

```text
74d2d006da042977b44e97793f1f498aeb2697d1735dfe12efac026d1b8f166e
CONTAINER ID   IMAGE           COMMAND           CREATED        STATUS                  PORTS                      NAMES
74d2d006da04   hello-app:1.1   "python app.py"   1 second ago   Up Less than a second   127.0.0.1:8080->8000/tcp   hello
```

`PORTS` shows the rule: `127.0.0.1:8080` on the host to `8000/tcp` in the container.

**2. Ask it for a page.**

```bash rail=curl-hello
curl http://127.0.0.1:8080/
curl http://127.0.0.1:8080/about
docker port hello
```

```text
Shalom from container 74d2d006da04
Shalom from container 74d2d006da04
8000/tcp -> 127.0.0.1:8080
```

The greeting came from `-e`, and the hostname is the container ID. The app answers every path the same way. `docker port` lists a container's published ports.

**3. Read the logs.**

```bash rail=logs-hello
docker logs hello
docker logs --timestamps -n 1 hello
```

```text
listening on port 8000
172.17.0.1 "GET / HTTP/1.1" 200 -
172.17.0.1 "GET /about HTTP/1.1" 200 -
2026-11-25T12:18:35.156514606Z 172.17.0.1 "GET /about HTTP/1.1" 200 -
```

The first line is the app's start-up message; the others are your two requests. They come from `172.17.0.1`, the host's side of Docker's default network, because the published port forwards them. `-n 1` shows only the last line and `--timestamps` adds Docker's own time stamp, in UTC. `docker logs -f hello` follows new lines as they arrive until you press Ctrl+C.

**4. Stop it and look at what is left.**

```bash rail=stop-hello
time docker stop hello
docker ps -a --filter name=hello
docker logs -n 2 hello
```

```text
hello

real	0m0.221s
user	0m0.015s
sys	0m0.003s
CONTAINER ID   IMAGE           COMMAND           CREATED         STATUS                              PORTS     NAMES
74d2d006da04   hello-app:1.1   "python app.py"   2 seconds ago   Exited (0) Less than a second ago             hello
172.17.0.1 "GET /about HTTP/1.1" 200 -
received SIGTERM, shutting down
```

The stop took about a fifth of a second, the status is `Exited (0)`, and the last log line is the app's own `SIGTERM` handler. `docker ps` alone would not list the container any more; `-a` includes stopped ones.

**5. Start the same container again.**

```bash rail=start-hello
docker start hello
curl http://127.0.0.1:8080/
```

```text
hello
Shalom from container 74d2d006da04
```

Same ID, same greeting, same port: `docker start` reuses the stopped container with all its settings.

**6. Remove it.**

```bash rail=rm-hello
docker rm hello
docker rm -f hello
```

```text
Error response from daemon: cannot remove container "hello": container is running: stop the container before removing or force remove
hello
```

`docker rm` refuses to remove a running container. `-f` stops it first. Its logs and writable layer are gone with it.

**7. See a port conflict.** Start `hello` again, then try a second container on the same host port:

```bash rail=port-conflict
docker run -d --name hello -p 127.0.0.1:8080:8000 hello-app:1.1
docker run -d --name hello2 -p 127.0.0.1:8080:8000 hello-app:1.1
docker ps -a --filter name=hello2 --format '{{.Names}} {{.Status}}'
docker rm hello2
docker rm -f hello
```

```text
8b11f075f7242843abcf0d899e4f79e62385b2631bfaf81e0fdf5b59592ddc0f
9373926ed0fc0b370b1213b3423fbd623914afa54e86cbd13f63a63798511f96
docker: Error response from daemon: failed to set up container networking: driver failed programming external connectivity on endpoint hello2 (3ea9632b808257a3dc8b8fea37fc73f8f657659ee382f996b499c040db0c6716): Bind for 127.0.0.1:8080 failed: port is already allocated

Run 'docker run --help' for more information
hello2 Created
hello2
hello
```

`hello2` was created but could not start, and stayed behind in the `Created` state until `docker rm hello2`. Pick another host port, such as `127.0.0.1:8081:8000`, and both can run.

**8. A throwaway container with `--rm`.**

```bash rail=rm-flag
docker run -d --rm --name once -p 127.0.0.1:8081:8000 -e GREETING=Hi hello-app:1.1
curl http://127.0.0.1:8081/
docker stop once
docker ps -a --filter name=once
```

```text
19eed440ad87b1bcda5304532bb46bb214e1056d3d2b646101fc14bd4e4b6ea0
Hi from container 19eed440ad87
once
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```

The list is empty: `--rm` removed `once` as soon as it stopped. Use it for short experiments; leave it off when you want to read the logs of a container that has stopped.

## Optional advanced: a server that ignores SIGTERM

Python's built-in server, started directly as PID 1, has no `SIGTERM` handler. Time `docker stop` on it, then on the same server started with `--init`:

```bash rail=slow-stop
docker run -d --name plain python:3.14-slim python -m http.server 8000
time docker stop plain
docker ps -a --filter name=plain --format '{{.Names}} {{.Status}}'
docker run -d --init --name withinit python:3.14-slim python -m http.server 8000
time docker stop withinit
docker ps -a --filter name=withinit --format '{{.Names}} {{.Status}}'
docker rm plain withinit
```

```text
7d5743e56dd205514b8c164f9d4e2b1c2b4e4e7a111c0ebb55a43e4a31b2bfe7
plain

real	0m10.143s
...
plain Exited (137) Less than a second ago
091ef4135532b8a55547baa924413d54d907c6d1ad776f605b9643f98e0800d9
withinit

real	0m0.103s
...
withinit Exited (143) Less than a second ago
plain
withinit
```

`plain` ignored `SIGTERM`, so Docker waited the full grace period and killed it: exit code 137 is 128 plus 9, the number of `SIGKILL`. With `--init`, the [run reference](https://docs.docker.com/reference/cli/docker/container/run/) says an init process becomes PID 1; here that was `/sbin/docker-init`, which passed `SIGTERM` to Python, whose default action ended it: 143 is 128 plus 15, `SIGTERM`. Handle `SIGTERM` in your own code, as `hello-app` does, or use `--init` for programs you cannot change. `docker stop -t 30` gives a slow program more time.

## When it goes wrong

**`Bind for 127.0.0.1:8080 failed: port is already allocated`.** Another container or program uses that host port. `docker ps` shows containers with published ports; `ss -ltn` lists every listening port. Choose another host port, and remove the container left in `Created`.

**`curl: (7) Failed to connect to 127.0.0.1 port 8080`.** Nothing is published there. Check `docker ps`: is the container running, and does `PORTS` show `127.0.0.1:8080->8000/tcp`? A container started without `-p` has no published port, and `EXPOSE` does not publish one.

**`curl: (56) Recv failure: Connection reset by peer` right after `docker run`.** The port is published but the app is not listening yet. Wait a second and try again, or check `docker logs` for `listening on port 8000`.

**`Conflict. The container name "/hello" is already in use`.** A container named `hello` still exists, maybe stopped. `docker rm -f hello`, or choose another name.

**`docker stop` takes ten seconds.** PID 1 does not handle `SIGTERM`. See the advanced step.

**The container exits at once.** `docker ps -a` shows `Exited` with a code; `docker logs <name>` shows why. Part 9 covers failures in depth.

## Cheat sheet

| Task | Command | Note |
|---|---|---|
| Run with a port and a variable | `docker run -d --name hello -p 127.0.0.1:8080:8000 -e GREETING=Shalom hello-app:1.1` | host port first |
| Published ports | `docker port hello` | also in `docker ps` |
| Read logs | `docker logs hello` | stdout and stderr of PID 1 |
| Last lines, with time | `docker logs --timestamps -n 1 hello` | UTC |
| Follow logs | `docker logs -f hello` | Ctrl+C to stop following |
| Stop | `docker stop hello` | SIGTERM, then SIGKILL after 10 s |
| More time to stop | `docker stop -t 30 hello` | seconds |
| Start again | `docker start hello` | same container and settings |
| Include stopped containers | `docker ps -a` | shows the exit code |
| Remove | `docker rm hello` | `-f` if it is running |
| Remove on exit | `docker run --rm ...` | no logs after it stops |
| Init process as PID 1 | `docker run --init ...` | passes signals on |

## Recap and what is next

- `-p HOST_IP:HOST_PORT:CONTAINER_PORT` publishes a port. Without a host IP it is open on every address, and it bypasses `ufw` and `firewalld`; this series uses `127.0.0.1`.
- `-e` sets an environment variable for one container and overrides the image's `ENV`.
- `docker logs` shows what PID 1 writes to stdout and stderr, until the container is removed.
- A stopped container keeps its settings and writable layer; `docker start` reuses it and `docker rm` deletes it.
- `docker stop` sends `SIGTERM`, waits 10 seconds, then sends `SIGKILL`. PID 1 must handle `SIGTERM` itself, or run under `--init`.

Next: Containers from Zero, part 4: files that outlive the container, where `hello-app` counts its visits in a file and you keep that file with a named volume and a bind mount. The [series page](https://aitamer.news/series/containers-from-zero/) lists each part as it is published.

*Quoted passages in this lesson come from the [Docker documentation](https://docs.docker.com/). Docker® is a registered trademark of Docker, Inc. aitamer.news is not affiliated with or endorsed by Docker, Inc.*

```rail
id: "run-hello"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker run"
        text: "Create and start a new container."
      - token: "-d"
        text: "Run it in the background and print its ID."
      - token: "--name hello"
        text: "Name the container hello."
      - token: "-p 127.0.0.1:8080:8000"
        text: "Publish a port. Host address 127.0.0.1, host port 8080, container port 8000. Only programs on this machine can connect."
      - token: "-e GREETING=Shalom"
        text: "Set the environment variable GREETING inside the container. It overrides the image's ENV GREETING=Hello."
      - token: "hello-app:1.1"
        text: "The image from part 2."
      - token: "docker ps"
        text: "List running containers, with their published ports."
```

```rail
id: "curl-hello"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "curl http://127.0.0.1:8080/"
        text: "Send an HTTP GET request to the published port and print the answer."
      - token: "curl http://127.0.0.1:8080/about"
        text: "Another path. hello-app answers every path the same way."
      - token: "docker port hello"
        text: "List the container's published ports as container port, then host address and port."
```

```rail
id: "logs-hello"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker logs hello"
        text: "Print everything the container's main process wrote to standard output and standard error."
      - token: "--timestamps"
        text: "Put Docker's time stamp, in UTC, in front of each line."
      - token: "-n 1"
        text: "Show only the last line. -n is short for --tail."
```

```rail
id: "stop-hello"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "time"
        text: "Shell keyword. Runs the command and prints how long it took."
      - token: "docker stop hello"
        text: "Send SIGTERM to the container's main process, wait up to 10 seconds, then send SIGKILL if it is still running."
      - token: "docker ps -a"
        text: "List all containers, including stopped ones."
      - token: "--filter name=hello"
        text: "Show only containers whose name matches hello."
      - token: "docker logs -n 2 hello"
        text: "The last two log lines. Logs stay readable after the container stops."
```

```rail
id: "start-hello"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker start hello"
        text: "Start a stopped container again, with the same ID, settings and writable layer."
      - token: "curl http://127.0.0.1:8080/"
        text: "Check that it answers again on the same port."
```

```rail
id: "rm-hello"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker rm hello"
        text: "Remove a container. It must be stopped, so this fails while hello runs."
      - token: "docker rm -f hello"
        text: "Force. Stop the container with SIGKILL if needed, then remove it."
```

```rail
id: "port-conflict"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker run -d --name hello -p 127.0.0.1:8080:8000 hello-app:1.1"
        text: "Starts hello on host port 8080 again, this time with the image's default greeting."
      - token: "docker run -d --name hello2 -p 127.0.0.1:8080:8000 hello-app:1.1"
        text: "Tries to start a second container on the same host port. Docker creates it, then fails to start it."
      - token: "docker ps -a --filter name=hello2 --format '{{.Names}} {{.Status}}'"
        text: "Shows hello2 and its state. --format prints only the fields named in the template."
      - token: "docker rm hello2"
        text: "Removes the container that never started."
      - token: "docker rm -f hello"
        text: "Stops and removes hello."
```

```rail
id: "rm-flag"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker run -d --rm"
        text: "Run in the background and remove the container automatically when it exits."
      - token: "--name once"
        text: "The container name."
      - token: "-p 127.0.0.1:8081:8000"
        text: "Publish container port 8000 on host port 8081."
      - token: "-e GREETING=Hi"
        text: "Set the greeting for this container only."
      - token: "hello-app:1.1"
        text: "The image."
      - token: "curl http://127.0.0.1:8081/"
        text: "Ask it for a page on the new port."
      - token: "docker stop once"
        text: "Stop it. Because of --rm, Docker then removes it."
      - token: "docker ps -a --filter name=once"
        text: "The list is empty: the container is gone."
```

```rail
id: "slow-stop"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker run -d --name plain python:3.14-slim python -m http.server 8000"
        text: "Run Python's built-in web server directly as PID 1. It has no SIGTERM handler."
      - token: "time docker stop plain"
        text: "Time how long docker stop takes. Here it waits the full 10-second grace period."
      - token: "docker ps -a --filter name=plain --format '{{.Names}} {{.Status}}'"
        text: "Show the exit status. 137 means the process was killed by SIGKILL."
      - token: "--init"
        text: "Run an init process as PID 1 that passes signals on to your command and reaps zombie processes."
      - token: "docker run -d --init --name withinit python:3.14-slim python -m http.server 8000"
        text: "The same server, started under docker-init."
      - token: "time docker stop withinit"
        text: "Now SIGTERM reaches Python and the container stops at once."
      - token: "docker rm plain withinit"
        text: "Remove both stopped containers."
```
