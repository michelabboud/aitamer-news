---
title: "Containers from Zero, part 2: images and a Dockerfile"
description: "Write a six-line Dockerfile for a small Python web server, build and tag the image, and use docker history to point at the layer your code lives in. Then change one line and watch the build cache."
pubDate: "2026-12-09T22:00:00Z"
series: containers-from-zero
series_order: 2
section: devops
subsection: containers
tags:
  - containers-from-zero
  - docker
  - dockerfile
  - containers
  - tutorial
draft: false
author: caret
lessonKit:
  id: containers-02
wildness:
  rating: 1
  verified: "Built hello-app 1.0 and 1.1 on Docker Engine 29.10.1 and compared their layers, 25 Nov 2026"
  claimed: "Layer and cache behaviour follows Docker's docs; sizes depend on the base image digest you pull"
verdict: "An image is a stack of read-only layers. Put the lines that change least at the top of the Dockerfile and rebuilds stay fast."
sources:
  - title: "How image layers and the build cache work (Docker documentation)"
    url: https://docs.docker.com/learn/content/how-image-layers-and-the-build-cache-work/
  - title: "Write your first Dockerfile (Docker documentation)"
    url: https://docs.docker.com/learn/content/write-your-first-dockerfile/
  - title: "Dockerfile reference (Docker documentation)"
    url: https://docs.docker.com/reference/dockerfile/
  - title: "Build context (Docker documentation)"
    url: https://docs.docker.com/build/concepts/context/
  - title: "docker image history (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/image/history/
  - title: "docker image tag (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/image/tag/
  - title: "containerd image store (Docker documentation)"
    url: https://docs.docker.com/engine/storage/containerd/
  - title: "python, Docker Official Image (Docker Hub)"
    url: https://hub.docker.com/_/python
  - title: "http.server, HTTP servers (Python documentation)"
    url: https://docs.python.org/3/library/http.server.html
  - title: "Containers from Zero, part 1: what a container is"
    url: https://aitamer.news/posts/containers-from-zero-01-what-a-container-is/
  - title: "Containers from Zero (series page)"
    url: https://aitamer.news/series/containers-from-zero/
  - title: "Docker documentation"
    url: https://docs.docker.com/
---

In [part 1](https://aitamer.news/posts/containers-from-zero-01-what-a-container-is/) you saw that a container is a process with its own view of the system, and that its files come from an image. This part makes your own image. You will write a small Python web server, describe its image in a six-line **Dockerfile**, build and tag it, and then read the image back layer by layer until you can point at the one layer your code lives in. Then you will change one line of code, rebuild, and see which steps Docker reused. Everything in the rest of the series runs this app or a bigger version of it.

## Time and setup

- **Reading:** about 14 minutes.
- **Optional lab:** about 20 minutes.
- **Optional advanced step:** about 5 minutes.

You need Docker Engine and a terminal, as installed in part 1. No Python is needed on your machine: Python runs inside the image. This series uses Docker Engine 29.10.1 and Compose v5.8.0. The commands write `docker` without `sudo`; add `sudo` if you skipped the `docker` group in part 1.

## What you will build

An image called `hello-app`, in two versions. Version `1.0` is a web server that answers every request with a greeting and the container's hostname. Version `1.1` changes the greeting text. You will tag `1.1` as `latest` too. Part 3 runs it and publishes its port.

## A Dockerfile is a recipe for an image

A **Dockerfile** is a text file of instructions, one per line, that Docker follows from top to bottom to build an image ([Dockerfile reference](https://docs.docker.com/reference/dockerfile/)). This is the whole Dockerfile for this part:

```dockerfile
FROM python:3.14-slim
WORKDIR /app
COPY app.py .
ENV GREETING=Hello
EXPOSE 8000
CMD ["python", "app.py"]
```

Line by line:

- **`FROM python:3.14-slim`** picks the **base image** your image starts from. `python` is a Docker Official Image on [Docker Hub](https://hub.docker.com/_/python); the tag `3.14-slim` is Python 3.14 on a smaller Debian base. On 25 November 2026 that tag pointed at Python 3.14.10 on Debian trixie. Tags such as `3-slim` or `slim` move to new Python versions over time (they already point at 3.15), so this series pins the minor version.
- **`WORKDIR /app`** sets the working directory for the instructions after it, and for the container's command, creating the folder if it does not exist.
- **`COPY app.py .`** copies `app.py` from your project into the image, into the working directory (`.` is `/app` here).
- **`ENV GREETING=Hello`** sets an environment variable that will be present in every container started from the image. The app reads it.
- **`EXPOSE 8000`** records that the app listens on port 8000. The reference is explicit: "The EXPOSE instruction doesn't actually publish the port." It is documentation for whoever runs the image. Part 3 publishes the port.
- **`CMD ["python", "app.py"]`** sets the default command a container runs. This is the **exec form**, a JSON array with double quotes. It runs `python` directly, without a shell in between. The reference also has a shell form (`CMD python app.py`); part 3 shows why the exec form matters when you stop a container.

## Layers: an image is a stack

Docker's guide on [layers and the build cache](https://docs.docker.com/learn/content/how-image-layers-and-the-build-cache-work/) says: "An image isn't one big file. It's an ordered stack of layers, each one a set of filesystem changes: files added, changed, or deleted." Each Dockerfile instruction that changes files produces one layer, and once a layer is created it never changes. Instructions such as `ENV`, `EXPOSE` and `CMD` change no files. They set metadata, and appear as 0-byte rows.

`FROM` does not copy Python into your image either. Your image starts on top of the base image's own layers, and every image built from the same base shares those layers on disk, because each layer is stored by a digest of its contents.

![On the left, the six Dockerfile lines. On the right, the image as docker history lists it, newest first: CMD, EXPOSE and ENV at 0B as metadata; COPY app.py at 12.3kB, highlighted as the layer with your code; WORKDIR /app at 8.19kB; then the python:3.14-slim base with Python 3.14.10 at 42.1MB, apt packages at 4.93MB, symbolic links at 16.4kB, and a Debian trixie base of 87.7MB.](/diagrams/containers-from-zero-02-images-and-a-dockerfile/dockerfile-to-image.svg)

## The build cache

Because layers never change, Docker keeps the result of each build step and reuses it on the next build when nothing that step depends on has changed. The output then says `CACHED` for that step. Once a step has to run again, every step after it runs again too. That is why a Dockerfile puts the things that change least (the base image, system packages, dependencies) near the top, and your own code, which changes most, near the bottom. In this Dockerfile, editing `app.py` reruns only `COPY`.

![hello-app:1.0 and hello-app:1.1 listed by layer digest. The four python:3.14-slim layers and the WORKDIR layer are identical in both; WORKDIR was CACHED on the rebuild. Only the top COPY layer differs, 22b502fd8b26 against 74899f619c88, because app.py changed. hello-app:latest points at the same image ID as 1.1.](/diagrams/containers-from-zero-02-images-and-a-dockerfile/layers-shared.svg)

## A running container adds one writable layer

Image layers are read-only. When Docker starts a container, the guide explains, "it adds a thin writable layer on top of the image's layers and presents the whole stack as one filesystem." Anything the container writes lands in that layer. `docker diff` lists what the container changed. Removing the container deletes its writable layer, and the image stays as it was. This matters for part 4: data written inside a container is gone when the container is removed, unless you store it somewhere else.

![Container try: a highlighted writable layer holding /app/note.txt sits on top of the read-only COPY, WORKDIR and python:3.14-slim layers; docker diff try reports C /app and A /app/note.txt. A second container from the same image has its own empty writable layer over the same shared layers and sees only app.py.](/diagrams/containers-from-zero-02-images-and-a-dockerfile/container-writable-layer.svg)

## Image names and tags

An image reference has the form `[HOST[:PORT]/]NAMESPACE/REPOSITORY[:TAG]` ([docker image tag](https://docs.docker.com/reference/cli/docker/image/tag/)). If you leave out the host, Docker uses Docker Hub. If you leave out the namespace, it uses `library`, the namespace for Docker Official Images, so `python:3.14-slim` is `docker.io/library/python:3.14-slim`. "If no tag is provided, Docker defaults to latest." A tag is a movable name for an image ID: `docker tag` adds another name to the same image without copying anything.

## Optional lab: write and build hello-app

This lab is optional. It creates a project folder and two images, and deletes nothing. Part 3's lab starts from the image `hello-app:1.1` built here; if you skip this lab now, come back to steps 1 to 7 before part 3's lab. Every command ran on 25 November 2026 with Docker Engine 29.10.1; IDs, digests and timings will differ on your machine.

**1. Create the project folder and the app.** The app uses only Python's standard library ([http.server](https://docs.python.org/3/library/http.server.html)), so the image needs no extra packages. Create a folder and save this as `app.py` inside it:

```bash rail=make-folder
mkdir hello && cd hello
```

```python
import os
import signal
import socket
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

GREETING = os.environ.get("GREETING", "Hello")
PORT = 8000


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        body = f"{GREETING} from {socket.gethostname()}\n".encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        print(f"{self.address_string()} {fmt % args}", flush=True)


def stop(signum, frame):
    print("received SIGTERM, shutting down", flush=True)
    sys.exit(0)


signal.signal(signal.SIGTERM, stop)
print(f"listening on port {PORT}", flush=True)
HTTPServer(("", PORT), Handler).serve_forever()
```

The server answers every `GET` with the greeting and the hostname, and prints one log line per request. The `stop` function handles `SIGTERM`, the signal `docker stop` sends; part 3 shows why that matters.

**2. Write the Dockerfile and a `.dockerignore`.** Save the six lines from the start of this part as `Dockerfile` (no extension) in the same folder. Then create a `.dockerignore`. The `.` at the end of `docker build` is the **build context**: the folder whose files `COPY` can reach. A `.dockerignore` file keeps files out of it, which the [build context docs](https://docs.docker.com/build/concepts/context/) say avoids sending unwanted files to the builder:

```bash rail=dockerignore
printf '.git\n__pycache__\n*.pyc\n' > .dockerignore
ls -A
```

```text
app.py
Dockerfile
.dockerignore
```

**3. Build and tag version 1.0.**

```bash rail=build-10
docker build -t hello-app:1.0 .
```

In a terminal, Docker draws a compact progress view. This is the plain form, trimmed:

```text
#5 [1/3] FROM docker.io/library/python:3.14-slim@sha256:22eafb370920ad8b429e0aec3fff433e0669968519f5d60469d83729c138b28b
#5 DONE 0.0s

#6 [2/3] WORKDIR /app
#6 DONE 0.0s

#7 [3/3] COPY app.py .
#7 DONE 0.0s

#8 exporting to image
...
#8 naming to docker.io/library/hello-app:1.0 done
#8 unpacking to docker.io/library/hello-app:1.0 0.0s done
#8 DONE 0.1s
```

There are three numbered steps, `[1/3]` to `[3/3]`, for the three instructions that touch files. The first time, step 1 also downloads the Python base image, which takes longer. Note that `FROM` resolved the tag to a digest, `sha256:22eafb...`: the exact base image this build used.

**4. List the image.**

```bash rail=image-ls
docker image ls hello-app
```

```text
IMAGE           ID             DISK USAGE   CONTENT SIZE   EXTRA
hello-app:1.0   fd0ea3351db9        178MB         43.6MB
```

These columns come from the **containerd image store**, which Docker Engine 29 uses by default on a new install ([containerd image store](https://docs.docker.com/engine/storage/containerd/)). That store keeps the compressed layers as downloaded and also unpacks them, so `CONTENT SIZE` (compressed) is much smaller than `DISK USAGE`. Most of both is the shared Python base.

**5. Read the layers.** `docker image history` lists an image's layers, newest first ([reference](https://docs.docker.com/reference/cli/docker/image/history/)). The `--format` option keeps two columns:

```bash rail=history
docker history --format 'table {{.CreatedBy}}\t{{.Size}}' hello-app:1.0
```

```text
CREATED BY                                      SIZE
CMD ["python" "app.py"]                         0B
EXPOSE 8000/tcp                                 0B
ENV GREETING=Hello                              0B
COPY app.py . # buildkit                        12.3kB
WORKDIR /app                                    8.19kB
CMD ["python3"]                                 0B
RUN /bin/sh -c set -eux;  for src in idle3 p…   16.4kB
RUN /bin/sh -c set -eux;   savedAptMark="$(a…   42.1MB
ENV PYTHON_SHA256=de414a57119abef52784d8993e…   0B
ENV PYTHON_VERSION=3.14.10                      0B
RUN /bin/sh -c set -eux;  apt-get update;  a…   4.93MB
ENV LANG=C.UTF-8                                0B
ENV PATH=/usr/local/bin:/usr/local/sbin:/usr…   0B
# debian.sh --arch 'amd64' out/ 'trixie' '@1…   87.7MB
```

Read it from the bottom up. The bottom nine rows are `python:3.14-slim`, built by the Python image's own Dockerfile: a Debian trixie base, some packages, Python 3.14.10, and a default command of `python3`. The top five rows are your Dockerfile. **`COPY app.py .`, at 12.3kB, is the layer your code lives in.** `ENV`, `EXPOSE` and `CMD` are 0B because they only set metadata. Your `CMD` replaced the base image's `python3`.

**6. Check that it runs.** Part 3 covers running properly. For now, start it in the background, read its first log line, ask it for a page from inside the container, and remove it:

```bash rail=try-10
docker run -d --name try hello-app:1.0
docker logs try
docker exec try python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000').read().decode(), end='')"
docker rm -f try
```

```text
598a55597090b17d04a033da6b868262b7a415470f6dec29a2dbc4bdd9033f17
listening on port 8000
Hello from 598a55597090
try
```

If `docker logs try` prints nothing, the app had not printed its first line yet; run it again a second later.

The hostname in the answer is the container ID, as in part 1.

**7. Change one line and rebuild as 1.1.** Edit `app.py` so the body says `from container`. Line 13 becomes:

```python
        body = f"{GREETING} from container {socket.gethostname()}\n".encode()
```

Then build again with a new tag:

```bash rail=build-11
docker build -t hello-app:1.1 .
```

```text
#5 [1/3] FROM docker.io/library/python:3.14-slim@sha256:22eafb370920ad8b429e0aec3fff433e0669968519f5d60469d83729c138b28b
#5 DONE 0.0s

#6 [2/3] WORKDIR /app
#6 CACHED

#7 [3/3] COPY app.py .
#7 DONE 0.0s
...
```

`WORKDIR` is `CACHED`: nothing it depends on changed. `COPY` ran again because `app.py` changed.

**8. Compare the two images layer by layer.** `docker image inspect` can print each layer's digest. The `slice . 7 19` in the template keeps 12 characters of each digest, the same trick Docker's layers guide uses:

```bash rail=compare-layers
docker image inspect --format '{{range .RootFS.Layers}}{{println (slice . 7 19)}}{{end}}' hello-app:1.0
docker image inspect --format '{{range .RootFS.Layers}}{{println (slice . 7 19)}}{{end}}' hello-app:1.1
```

```text
54ae9782e24f
8bea222313c7
1d5b23e30cf6
3223e9c67581
4bfad4ab49d7
22b502fd8b26

54ae9782e24f
8bea222313c7
1d5b23e30cf6
3223e9c67581
4bfad4ab49d7
74899f619c88
```

These list file layers only, oldest first, so there are six, not fourteen. The first four are the Python base. The fifth is `WORKDIR`. Only the last one, the `COPY` layer, differs. The two images share everything else on disk.

**9. Tag 1.1 as latest.**

```bash rail=tag-latest
docker tag hello-app:1.1 hello-app:latest
docker image ls hello-app
```

```text
IMAGE              ID             DISK USAGE   CONTENT SIZE   EXTRA
hello-app:1.0      fd0ea3351db9        178MB         43.6MB
hello-app:1.1      045cf843b4fd        178MB         43.6MB
hello-app:latest   045cf843b4fd        178MB         43.6MB
```

`latest` and `1.1` have the same ID: one image, two names. `latest` is only a default name. It moves only when you tag again, so it can point at an older build. That is why this series runs explicit tags like `hello-app:1.1`.

**10. See the writable layer.** Write a file inside a container, list the container's changes, then start a fresh container from the same image:

```bash rail=writable-layer
docker run -d --name try hello-app:1.1
docker exec try sh -c "echo scratch > /app/note.txt"
docker diff try | grep /app
docker rm -f try
docker run --rm hello-app:1.1 ls /app
```

```text
cfc3a97a776e4ff6f781b55d776a63a3be6a6fd2cfbc775ce3d214653bac5139
C /app
A /app/note.txt
try
app.py
```

`C` means changed and `A` means added. Without the `grep`, `docker diff` also lists Python's bytecode cache files, which the interpreter wrote while it started. The fresh container has only `app.py`: the note lived in the removed container's writable layer, and the image never changed.

Keep the `hello` folder and the images. Part 3 runs `hello-app:1.1`.

## Optional advanced: the settings inside an image

The 0-byte rows are stored in the image's configuration. `docker image inspect` can print them:

```bash rail=inspect-config
docker image inspect --format '{{.Config.Cmd}} {{.Config.WorkingDir}} {{.Config.ExposedPorts}}' hello-app:1.1
docker image inspect --format '{{range .Config.Env}}{{println .}}{{end}}' hello-app:1.1
```

```text
[python app.py] /app map[8000/tcp:{}]
PATH=/usr/local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
LANG=C.UTF-8
PYTHON_VERSION=3.14.10
PYTHON_SHA256=de414a57119abef52784d8993e341d53aed635fc2b05c2607d9f98a2c5b72032
GREETING=Hello
```

Your image inherited `PATH`, `LANG` and the Python variables from the base, and added `GREETING`. `docker run -e GREETING=...` overrides it for one container without rebuilding, which part 3 does.

## When it goes wrong

**`ERROR: failed to build: failed to solve: failed to compute cache key: failed to calculate checksum of ref ...: "/app.py": not found`.** `COPY` could not find the file in the build context. Run `docker build` from the folder that holds `app.py`, keep the `.` at the end, and check that `.dockerignore` does not exclude it.

**`ERROR: failed to build: failed to solve: failed to read dockerfile: open Dockerfile: no such file or directory`.** Docker looks for a file named exactly `Dockerfile` in the context. Check the name and its capital D, or pass another file with `-f`.

**`invalid tag "Hello-App:1.0": repository name must be lowercase`.** Repository names must be lowercase. `docker run` says the same with `invalid reference format: repository name (library/Hello-App) must be lowercase`. Use `hello-app:1.0`.

**A code change does not show up.** You probably ran the old tag. Rebuild with a new tag, as in step 7, and run that tag.

**Every build reinstalls everything.** A step near the top changes on every build, so the cache stops there. Move rarely changing steps up and your code down. Part 7 does this with Python dependencies.

## Cheat sheet

| Task | Command or line | Note |
|---|---|---|
| Base image | `FROM python:3.14-slim` | pin at least the minor version |
| Working folder | `WORKDIR /app` | created if missing |
| Add your code | `COPY app.py .` | from the build context |
| Default variable | `ENV GREETING=Hello` | `-e` overrides it at run time |
| Document a port | `EXPOSE 8000` | does not publish anything |
| Default command | `CMD ["python", "app.py"]` | exec form, double quotes |
| Build and tag | `docker build -t hello-app:1.0 .` | `.` is the build context |
| List images | `docker image ls hello-app` | containerd store columns |
| Layers, newest first | `docker history --format 'table {{.CreatedBy}}\t{{.Size}}' hello-app:1.0` | 0B rows are settings |
| Layer digests | `docker image inspect --format '{{range .RootFS.Layers}}{{println (slice . 7 19)}}{{end}}' hello-app:1.1` | shared layers match |
| Another name | `docker tag hello-app:1.1 hello-app:latest` | same image ID |
| What a container wrote | `docker diff try` | `A` added, `C` changed, `D` deleted |

## Recap and what is next

- A Dockerfile is a list of instructions. `FROM` picks a base, `WORKDIR`, `COPY` and `RUN` change files, and `ENV`, `EXPOSE` and `CMD` set metadata.
- An image is a stack of read-only layers. `docker history` shows them, and the `COPY` layer is where your code lives.
- The build cache reuses unchanged steps; order the Dockerfile from least to most often changed.
- A tag is a name for an image ID. `latest` is only the default name.
- A container adds one writable layer, and removing the container deletes it.

Next: Containers from Zero, part 3: run one container, where you publish `hello-app`'s port, set its greeting from the command line, read its logs, and stop and remove it. The [series page](https://aitamer.news/series/containers-from-zero/) lists each part as it is published.

*Quoted passages in this lesson come from the [Docker documentation](https://docs.docker.com/). Docker® is a registered trademark of Docker, Inc. Python® is a registered trademark of the Python Software Foundation. aitamer.news is not affiliated with or endorsed by Docker, Inc. or the Python Software Foundation.*

```rail
id: "make-folder"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "mkdir hello"
        text: "Creates a folder named hello for the project."
      - token: "&&"
        text: "Shell. Runs the next command only if the previous one succeeded."
      - token: "cd hello"
        text: "Moves into the new folder. The later commands run here."
```

```rail
id: "dockerignore"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "printf '.git\\n__pycache__\\n*.pyc\\n'"
        text: "Prints three lines: .git, __pycache__ and *.pyc. \\n is a line break."
      - token: "> .dockerignore"
        text: "Shell. Writes that output to the file .dockerignore, replacing it if it exists. Docker leaves the matching files out of the build context."
      - token: "ls -A"
        text: "Lists the folder, including names that start with a dot, except . and .. themselves."
```

```rail
id: "build-10"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker build"
        text: "Builds an image from a Dockerfile. In Docker Engine 29 this runs BuildKit through Buildx."
      - token: "-t hello-app:1.0"
        text: "Tags the result: repository hello-app, tag 1.0."
      - token: "."
        text: "The build context, here the current folder. COPY can only reach files inside it, and Docker reads ./Dockerfile by default."
```

```rail
id: "image-ls"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker image ls"
        text: "Lists images."
      - token: "hello-app"
        text: "Shows only images in the repository hello-app."
```

```rail
id: "history"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker history"
        text: "Shows the history of an image: one row per layer or setting, newest first."
      - token: "--format 'table {{.CreatedBy}}\\t{{.Size}}'"
        text: "A Go template. table adds column headers, .CreatedBy is the instruction that made the row, .Size its size, and \\t a tab between columns."
      - token: "hello-app:1.0"
        text: "The image to inspect."
```

```rail
id: "try-10"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker run -d --name try hello-app:1.0"
        text: "Starts a container named try from hello-app:1.0 in the background."
      - token: "docker logs try"
        text: "Prints what the container's process has written to standard output and standard error so far."
      - token: "docker exec try python -c \"…\""
        text: "Runs a one-line Python program inside the running container."
      - token: "urllib.request.urlopen('http://localhost:8000')"
        text: "Fetches the page from the server on port 8000. localhost here is the container itself, because the command runs inside it."
      - token: ".read().decode()"
        text: "Reads the response body and turns the bytes into text."
      - token: "end=''"
        text: "Tells print not to add a second line break, because the body already ends with one."
      - token: "docker rm -f try"
        text: "Stops and removes the container."
```

```rail
id: "build-11"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker build -t hello-app:1.1 ."
        text: "The same build with a new tag. Unchanged steps come from the build cache and are marked CACHED."
```

```rail
id: "compare-layers"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker image inspect"
        text: "Prints detailed information about an image."
      - token: "--format '…'"
        text: "A Go template that selects what to print."
      - token: "{{range .RootFS.Layers}} … {{end}}"
        text: "Loops over the image's file layers, oldest first. Each one is a digest such as sha256:54ae…."
      - token: "{{println (slice . 7 19)}}"
        text: "Prints characters 7 to 18 of the digest, skipping the sha256: prefix, then a line break."
      - token: "hello-app:1.0"
        text: "The first image. The second line repeats the command for hello-app:1.1."
```

```rail
id: "tag-latest"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker tag"
        text: "Creates a new name for an existing image. Nothing is copied."
      - token: "hello-app:1.1"
        text: "The source image."
      - token: "hello-app:latest"
        text: "The new name. latest is the tag Docker uses when you give none."
      - token: "docker image ls hello-app"
        text: "Lists the repository again. Both names show the same image ID."
```

```rail
id: "writable-layer"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker run -d --name try hello-app:1.1"
        text: "Starts a background container from version 1.1."
      - token: "docker exec try sh -c \"echo scratch > /app/note.txt\""
        text: "Runs a shell inside the container that writes a small file. sh -c runs the quoted command line."
      - token: "docker diff try"
        text: "Lists files and folders the container changed compared with its image. A added, C changed, D deleted."
      - token: "| grep /app"
        text: "Keeps only lines that contain /app."
      - token: "docker rm -f try"
        text: "Removes the container and its writable layer."
      - token: "docker run --rm hello-app:1.1 ls /app"
        text: "Runs ls in a fresh container from the same image, then removes it."
```

```rail
id: "inspect-config"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker image inspect --format '{{.Config.Cmd}} {{.Config.WorkingDir}} {{.Config.ExposedPorts}}'"
        text: "Prints the image's default command, working directory and exposed ports from its configuration."
      - token: "docker image inspect --format '{{range .Config.Env}}{{println .}}{{end}}'"
        text: "Prints each environment variable in the image's configuration on its own line."
      - token: "hello-app:1.1"
        text: "The image to inspect."
```
