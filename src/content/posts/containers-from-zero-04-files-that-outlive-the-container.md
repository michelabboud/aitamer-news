---
title: "Containers from Zero, part 4: files that outlive the container"
description: "Give hello-app a visit counter, watch the count vanish with the container, then keep it with a named volume and share it with a bind mount. Learn to tell which mount a container uses, and who owns the files it writes."
pubDate: "2026-12-23T22:00:00Z"
series: containers-from-zero
series_order: 4
section: devops
subsection: containers
tags:
  - containers-from-zero
  - docker
  - containers
  - storage
  - tutorial
draft: false
author: caret
lessonKit:
  id: containers-04
wildness:
  rating: 1
  verified: "Kept hello-app 1.2 visit counts in a named volume and a bind mount on Engine 29.10.1, 25 Nov 2026"
  claimed: "The warning against editing volume data directly is from Docker's docs; we did not test it"
verdict: "Put data you keep in a named volume, use a bind mount when you need the files on the host, and check with docker inspect which one you have."
sources:
  - title: "Storage overview (Docker documentation)"
    url: https://docs.docker.com/engine/storage/
  - title: "Volumes (Docker documentation)"
    url: https://docs.docker.com/engine/storage/volumes/
  - title: "Bind mounts (Docker documentation)"
    url: https://docs.docker.com/engine/storage/bind-mounts/
  - title: "docker volume create (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/volume/create/
  - title: "docker volume rm (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/volume/rm/
  - title: "docker container rm (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/container/rm/
  - title: "docker container run (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/container/run/
  - title: "docker inspect (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/inspect/
  - title: "Containers from Zero, part 3: run one container"
    url: https://aitamer.news/posts/containers-from-zero-03-run-one-container/
  - title: "Containers from Zero (series page)"
    url: https://aitamer.news/series/containers-from-zero/
  - title: "Docker documentation"
    url: https://docs.docker.com/
---

In [part 3](https://aitamer.news/posts/containers-from-zero-03-run-one-container/) you ran `hello-app`, stopped it and removed it. Nothing it did was worth keeping. Real programs write files: a database, uploads, a counter. This part gives `hello-app` a visit counter stored in a file, shows the count disappear when the container is removed, and then keeps it two ways: in a **named volume** that Docker manages, and in a **bind mount** of a folder you choose. By the end you can look at any container and say which kind of storage it uses.

## Time and setup

- **Reading:** about 13 minutes.
- **Optional lab:** about 20 minutes.
- **Optional advanced step:** about 10 minutes.

You need the `hello` folder and the `hello-app` source from part 2, and `curl`. The series uses Docker Engine 29.10.1 and Compose v5.8.0, and writes `docker` without `sudo`. The file owners and paths in this lab come from Docker Engine on Linux with its daemon running as root; on Docker Desktop, or in rootless mode, files can show up as yours, and volumes live inside Docker's own virtual machine or data folder.

## What you will build

`hello-app:1.2`, which answers `Hello from container ..., visit 3` and keeps the count in `/data/visits.txt`. You will run it three ways: with no mount, with the named volume `hello-data`, and with your own `data` folder bind-mounted at `/data`.

## Why the count disappears

Part 2 showed that each container gets a thin writable layer on top of the image's read-only layers. Docker's [storage overview](https://docs.docker.com/engine/storage/) is direct about what that means: "Data written to the container layer doesn't persist when the container is destroyed." `docker stop` keeps the layer; `docker rm` deletes it. A new container from the same image starts with an empty writable layer again.

To keep data, you mount storage from outside the container at a path inside it. The program writes to `/data` as usual; the mount decides where the bytes really go. The overview lists several mount types. This part uses the two you will meet most:

- **Volumes** are "persistent storage mechanisms managed by the Docker daemon. They retain data even after the containers using them are removed."
- **Bind mounts** "create a direct link between a host system path and a container, allowing access to files or directories stored anywhere on the host."

![The same file, /data/visits.txt, in three setups. Without a mount it goes into the container's writable layer and is deleted by docker rm. With a named volume it goes into hello-data, a directory Docker manages under /var/lib/docker/volumes, and survives docker rm (highlighted). With a bind mount it goes into a folder you chose, such as /home/ubuntu/hello/data, which survives docker rm and which you can edit on the host.](/diagrams/containers-from-zero-04-files-that-outlive-the-container/where-data-lives.svg)

## Named volumes

A named volume is a directory that Docker creates and tracks. You create one with `docker volume create hello-data`, or Docker creates it the first time a container asks for it. The [volumes page](https://docs.docker.com/engine/storage/volumes/) explains the lifecycle: "When a container is destroyed, the writable layer is destroyed with it. Using a volume ensures that the data is persisted even if the container using it is removed." Removing a container never removes a named volume; you do that yourself with `docker volume rm`.

On Linux the files sit under `/var/lib/docker/volumes/`, but you should treat that path as Docker's. The [storage overview](https://docs.docker.com/engine/storage/) warns: "Directly accessing or interacting with the volume data is unsupported, undefined behavior, and may result in the volume or its data breaking in unexpected ways." To read a volume, mount it into a container.

Two more details from the volumes page matter later in the series. If you mount an empty volume over a directory that already has files in the image, Docker copies those files into the volume first. And a volume can also be **anonymous**: it gets a random name instead of one you chose, and is not shared between containers automatically. Removing a container leaves its anonymous volumes behind, unless the container ran with `--rm`. The PostgreSQL image used from part 7 declares a volume at `/var/lib/postgresql`, so a container started from it without a mount there gets an anonymous one; part 10 cleans those up.

![A timeline. The first container, with the volume hello-data mounted at /data, answers visit 1 and visit 2. docker rm -f removes it, and docker run starts a new container with the same volume, which answers visit 3. The volume, highlighted, runs underneath both containers. Without a volume, the new container answered visit 1, because the count was in the deleted writable layer.](/diagrams/containers-from-zero-04-files-that-outlive-the-container/volume-outlives-container.svg)

## Bind mounts

A bind mount takes a path on the host, usually a folder, and makes it appear at a path in the container. Both sides see the same files at the same time. The [bind mounts page](https://docs.docker.com/engine/storage/bind-mounts/) lists the use cases: sharing source code with a container, keeping files a container generates on the host, and sharing configuration files. Docker itself bind-mounts `/etc/resolv.conf` into containers so they can resolve names.

That directness has costs the same page spells out. "Bind mounts have write access to files on the host by default", so a process in the container can change or delete host files. And containers with bind mounts "may fail if run on a different host without the same directory structure." Add `readonly` when the container only needs to read. Mount over a directory that already has files in the image, and those files are hidden for as long as the mount is there.

Files in a bind mount also keep their owners as numbers. `hello-app` runs as root, user ID 0, so a file it creates shows up on your host as owned by root. The advanced step shows the effect and the usual fix, `--user`.

## --mount and -v

There are two ways to write a mount on `docker run`. The long form names every part:

```text
--mount type=volume,src=hello-data,dst=/data
--mount type=bind,src="$PWD"/data,dst=/data
```

The short form packs them into one value separated by colons: `-v hello-data:/data` for a volume, `-v "$PWD"/data:/data` for a bind mount. `-v` decides which type you meant from the first part: a name means a volume, a path means a bind mount. The bind mounts page says "In general, --mount is preferred", because it is explicit and supports every option. They also behave differently when the host path does not exist: `-v` creates it, always as a directory, while `--mount` stops with an error. You will see both in the lab. This series uses `--mount` with `docker run`; Compose files from part 6 use a short form of their own.

## Optional lab: keep the count

This lab is optional. Every command ran on 25 November 2026 with Docker Engine 29.10.1 in `/home/ubuntu/hello`; your IDs, paths and times will differ.

> **Safety: this lab deletes data it creates.** It makes and then removes a volume named `hello-data`, and folders named `data` and `missing` inside your `hello` folder. If you already have a volume called `hello-data` (check with `docker volume ls`) or a `data` folder there that matters to you, rename them in the commands below, or the cleanup step will delete them. It also publishes port 8080 on 127.0.0.1; if that port is busy, Docker refuses to start the container and nothing else is affected. Other containers, volumes and images keep running and stay untouched. To undo everything, run `docker rm -f hello`, then `docker volume rm hello-data`, then `rm -rf data` and `rmdir missing` in the `hello` folder.

**1. Teach hello-app to count.** In the `hello` folder, open `app.py`. Under the line `PORT = 8000`, add the two settings and the function:

```python
DATA_DIR = os.environ.get("DATA_DIR", "/data")
COUNT_FILE = os.path.join(DATA_DIR, "visits.txt")


def count_visit():
    os.makedirs(DATA_DIR, exist_ok=True)
    try:
        with open(COUNT_FILE) as f:
            visits = int(f.read().strip() or 0)
    except FileNotFoundError:
        visits = 0
    visits += 1
    with open(COUNT_FILE, "w") as f:
        f.write(f"{visits}\n")
    return visits
```

Then change the first line of `do_GET` so it counts the visit and reports it:

```python
    def do_GET(self):
        visits = count_visit()
        body = f"{GREETING} from container {socket.gethostname()}, visit {visits}\n".encode()
```

The Dockerfile stays the same. Build the new version:

```bash rail=build-12
docker build -t hello-app:1.2 .
```

```text
...
#8 naming to docker.io/library/hello-app:1.2 done
#8 unpacking to docker.io/library/hello-app:1.2 done
#8 DONE 0.0s
```

**2. Count without a mount, and lose it.**

```bash rail=no-volume
docker run -d --name hello -p 127.0.0.1:8080:8000 hello-app:1.2
curl http://127.0.0.1:8080/
curl http://127.0.0.1:8080/
docker rm -f hello
docker run -d --name hello -p 127.0.0.1:8080:8000 hello-app:1.2
curl http://127.0.0.1:8080/
docker rm -f hello
```

```text
2d3068c5a15f54c1db9e1f7b98bb6b6d33b11c689ec68759f884b1c5e0eb8e82
Hello from container 2d3068c5a15f, visit 1
Hello from container 2d3068c5a15f, visit 2
hello
26989c7242662d65a49d545f4b44db1bc26ca37f52f5d034f2bb31e875b91f83
Hello from container 26989c724266, visit 1
hello
```

The count reached 2, then the new container started again at 1. The file was in the first container's writable layer, and `docker rm` deleted it.

**3. Keep it in a named volume.**

```bash rail=named-volume
docker volume create hello-data
docker run -d --name hello -p 127.0.0.1:8080:8000 --mount type=volume,src=hello-data,dst=/data hello-app:1.2
curl http://127.0.0.1:8080/
curl http://127.0.0.1:8080/
docker rm -f hello
docker run -d --name hello -p 127.0.0.1:8080:8000 --mount type=volume,src=hello-data,dst=/data hello-app:1.2
curl http://127.0.0.1:8080/
```

```text
hello-data
dd8c9a2200f735219aff83de94a9d73d913bb96396d400e51de49e8c3d2689fb
Hello from container dd8c9a2200f7, visit 1
Hello from container dd8c9a2200f7, visit 2
hello
1ef8d9e75cd06f8bb603a0f216b59812d92b93cf52f4e85816b2de00fea26a99
Hello from container 1ef8d9e75cd0, visit 3
```

A different container ID, and the count continued at 3. The file lived in `hello-data`, which `docker rm -f` left alone. Leave this container running for the next step.

**4. Say which mount it uses.**

```bash rail=inspect-volume
docker volume ls
docker volume inspect hello-data
docker inspect --format '{{range .Mounts}}{{.Type}} {{.Name}} {{.Source}} -> {{.Destination}}{{end}}' hello
docker rm -f hello
```

```text
DRIVER    VOLUME NAME
local     hello-data
[
    {
        "CreatedAt": "2026-11-25T12:25:15Z",
        "Driver": "local",
        "Labels": null,
        "Mountpoint": "/var/lib/docker/volumes/hello-data/_data",
        "Name": "hello-data",
        "Options": null,
        "Scope": "local"
    }
]
volume hello-data /var/lib/docker/volumes/hello-data/_data -> /data
hello
```

`docker volume ls` lists volumes; you may see others from earlier experiments. `local` is the built-in driver that stores the volume on this machine. The last line answers the question this part set out to answer: the container's `/data` is a mount of `Type` volume, named `hello-data`. `docker inspect` reads it from the container itself, so it works on any container, including ones someone else started.

**5. Share a folder with a bind mount.** Make a `data` folder, start the count at 41 from the host, and mount the folder:

```bash rail=bind-mount
mkdir data
echo 41 > data/visits.txt
docker run -d --name hello -p 127.0.0.1:8080:8000 --mount type=bind,src="$PWD"/data,dst=/data hello-app:1.2
curl http://127.0.0.1:8080/
cat data/visits.txt
echo 99 > data/visits.txt
curl http://127.0.0.1:8080/
ls -l data
docker inspect --format '{{range .Mounts}}{{.Type}} {{.Source}} -> {{.Destination}}{{end}}' hello
docker rm -f hello
```

```text
39f4628d2de4eea5716a5f7a47cbcecaf86a7e0b1a8456a747caaee9c3daac03
Hello from container 39f4628d2de4, visit 42
42
Hello from container 39f4628d2de4, visit 100
total 4
-rw-r--r-- 1 ubuntu ubuntu 4 Nov 25 12:25 visits.txt
bind /home/ubuntu/hello/data -> /data
hello
```

The container read the 41 you wrote and answered 42. You read its 42 with `cat`, wrote 99, and it answered 100. Both sides edit one file. This time `docker inspect` says `bind`, and the source is your folder. The file still belongs to you because you created it; the advanced step shows what happens when the container creates it.

**6. A path that does not exist.** Try both forms with a folder named `missing` that you have not created:

```bash rail=missing-path
docker run -d --name hello --mount type=bind,src="$PWD"/missing,dst=/data hello-app:1.2
docker run -d --name hello -v "$PWD"/missing:/data hello-app:1.2
ls -ld missing
docker rm -f hello
rmdir missing
```

```text
docker: Error response from daemon: invalid mount config for type "bind": bind source path does not exist: /home/ubuntu/hello/missing

Run 'docker run --help' for more information
b7b0057b389873461a0d9aa27dd4f21207c4159c3e6d6992360c5d9ad0f22b9f
drwxr-xr-x 2 root root 4096 Nov 25 12:25 missing
hello
```

`--mount` refused, which is what you want when the path has a typo. `-v` quietly created `missing`, owned by root because the Docker daemon made it. You can still remove it with `rmdir`, since it is empty and sits in your own folder.

**7. Clean up.** This deletes the volume and its count. Removing a volume is permanent.

```bash rail=cleanup
docker volume rm hello-data
docker volume ls --filter name=hello-data
rm -r data
```

```text
hello-data
DRIVER    VOLUME NAME
```

The list is empty. If `docker volume rm` says `volume is in use`, a container still mounts it; remove that container first.

## Optional advanced: who owns the files

Run the bind mount again, but let the container create the file. Then run it as your own user:

```bash rail=ownership
mkdir data
docker run -d --name hello -p 127.0.0.1:8080:8000 --mount type=bind,src="$PWD"/data,dst=/data hello-app:1.2
curl http://127.0.0.1:8080/
ls -l data
echo 5 > data/visits.txt
docker rm -f hello
rm -f data/visits.txt
docker run -d --name hello -p 127.0.0.1:8080:8000 --user "$(id -u):$(id -g)" --mount type=bind,src="$PWD"/data,dst=/data hello-app:1.2
curl http://127.0.0.1:8080/
ls -l data
echo 5 > data/visits.txt
curl http://127.0.0.1:8080/
docker rm -f hello
```

```text
f97435a236b7a268b13e5fbe590e00090d78da1c055bd447ccec6b78fb2ffc70
Hello from container f97435a236b7, visit 1
total 4
-rw-r--r-- 1 root root 2 Nov 25 12:25 visits.txt
bash: data/visits.txt: Permission denied
hello
e31be1158bfc77db8f24e0d17b7b1a2dc2c357e56d5bb3a811ac8c96ec19b890
Hello from container e31be1158bfc, visit 1
total 4
-rw-r--r-- 1 ubuntu ubuntu 2 Nov 25 12:25 visits.txt
Hello from container e31be1158bfc, visit 6
hello
```

The first file belonged to root, so your shell could not write it. `rm -f` still worked, because deleting a file needs write permission on the folder, which is yours; without `-f`, [GNU `rm`](https://www.gnu.org/software/coreutils/manual/html_node/rm-invocation.html) stops to ask before it removes a write-protected file when you run it from a terminal. With `--user`, which the [run reference](https://docs.docker.com/reference/cli/docker/container/run/) describes as "Username or UID (format: <name|uid>[:<group|gid>])", the app ran as your user and group IDs, 1000:1000 here, and the file came out as yours.

![Two cases side by side. By default the app in the container runs as user ID 0, root, so the visits.txt it writes into the bind mount shows on the host as owned by root root, and echo 5 into it fails with Permission denied. Started with --user "$(id -u):$(id -g)", the app runs as user ID 1000, the file shows as owned by ubuntu ubuntu, writing to it works, and the next visit is 6 (highlighted).](/diagrams/containers-from-zero-04-files-that-outlive-the-container/bind-mount-ownership.svg)

Last, mount the folder read-only and ask for a page:

```bash rail=read-only
docker run -d --name hello -p 127.0.0.1:8080:8000 --mount type=bind,src="$PWD"/data,dst=/data,readonly hello-app:1.2
curl http://127.0.0.1:8080/
docker logs -n 3 hello
docker rm -f hello
rm -r data
```

```text
794f160123c0a0ba38885714c82ffb7eb0d9d95b92a26190b13183a231bd1894
curl: (52) Empty reply from server
         ~~~~^^^^^^^^^^^^^^^^^
OSError: [Errno 30] Read-only file system: '/data/visits.txt'
----------------------------------------
hello
```

The app could not write its count, Python raised an error, and the request got no reply. `readonly` is right for configuration a container should only read, and wrong for data it must write. The logs told you which.

## When it goes wrong

**The count starts at 1 again.** The container has no mount at `/data`, or a different one. `docker inspect --format '{{range .Mounts}}{{.Type}} {{.Name}} {{.Source}} -> {{.Destination}}{{end}}' hello` prints nothing when there is no mount. Check the volume name for typos: a misspelled name silently creates a new, empty volume.

**`bind source path does not exist`.** `--mount type=bind` needs the host path to exist. Create it, or fix the path. Use `"$PWD"/data` for a folder in the current directory; a relative path such as `data` on its own is read as a volume name by `-v`.

**`Permission denied` on a file in a bind mount.** The container wrote it as root. Run the container with `--user "$(id -u):$(id -g)"`, or fix the owner with `sudo chown`.

**`Read-only file system`.** The mount has `readonly`, or `ro` in the short form. Remove it if the container must write there.

**`volume is in use`.** `docker volume rm` refuses while a container, running or stopped, still uses the volume. `docker ps -a --filter volume=hello-data` finds it.

**The image's files vanished from a folder.** A mount hides whatever the image had at that path. Mount somewhere else, or, for an empty named volume, let Docker copy the image's files in first.

## Cheat sheet

| Task | Command | Note |
|---|---|---|
| Create a volume | `docker volume create hello-data` | or let `docker run` create it |
| Mount a volume | `--mount type=volume,src=hello-data,dst=/data` | short form `-v hello-data:/data` |
| Bind-mount a folder | `--mount type=bind,src="$PWD"/data,dst=/data` | short form `-v "$PWD"/data:/data` |
| Read-only mount | `...,dst=/data,readonly` | `:ro` in the short form |
| List volumes | `docker volume ls` | driver and name |
| Volume details | `docker volume inspect hello-data` | `Mountpoint` is Docker's, do not edit it |
| Which mounts a container has | `docker inspect --format '{{range .Mounts}}{{.Type}} {{.Source}} -> {{.Destination}}{{end}}' hello` | `volume` or `bind` |
| Run as your user | `--user "$(id -u):$(id -g)"` | files in bind mounts stay yours |
| Remove a volume | `docker volume rm hello-data` | permanent; fails while in use |

## Recap and what is next

- Files written to a container's writable layer are deleted by `docker rm`.
- A named volume is storage Docker manages. It survives `docker rm` until you run `docker volume rm`.
- A bind mount shares a host folder with the container. Both sides see the same files, with the same numeric owners.
- `--mount` is explicit and refuses a missing host path; `-v` is shorter and creates one.
- `docker inspect` on a container shows each mount's type, source and destination.

Next: Containers from Zero, part 5: two containers, one network, where a second container reaches `hello-app` by its name. The [series page](https://aitamer.news/series/containers-from-zero/) lists each part as it is published.

*Quoted passages in this lesson come from the [Docker documentation](https://docs.docker.com/). Docker® is a registered trademark of Docker, Inc. aitamer.news is not affiliated with or endorsed by Docker, Inc.*

```rail
id: "build-12"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker build"
        text: "Build an image from the Dockerfile in a folder."
      - token: "-t hello-app:1.2"
        text: "Tag the result with the name hello-app and the tag 1.2."
      - token: "."
        text: "Use the current folder as the build context."
```

```rail
id: "no-volume"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker run -d --name hello"
        text: "Run hello-app in the background, named hello."
      - token: "-p 127.0.0.1:8080:8000"
        text: "Publish container port 8000 on host port 8080, this machine only."
      - token: "hello-app:1.2"
        text: "The new image that counts visits in /data/visits.txt."
      - token: "curl http://127.0.0.1:8080/"
        text: "Ask for a page. Each request adds one visit."
      - token: "docker rm -f hello"
        text: "Stop and remove the container, with its writable layer."
```

```rail
id: "named-volume"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker volume create hello-data"
        text: "Create a named volume called hello-data."
      - token: "--mount type=volume,src=hello-data,dst=/data"
        text: "Mount the volume hello-data at /data inside the container."
      - token: "curl http://127.0.0.1:8080/"
        text: "Count a visit. The count is written into the volume."
      - token: "docker rm -f hello"
        text: "Remove the container. The volume stays."
```

```rail
id: "inspect-volume"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker volume ls"
        text: "List volumes with their driver and name."
      - token: "docker volume inspect hello-data"
        text: "Show a volume's details as JSON, including where Docker keeps it."
      - token: "docker inspect"
        text: "Show low-level details of a container as JSON."
      - token: "--format"
        text: "Print only what the Go template asks for, here each mount's type, name, source and destination."
      - token: "docker rm -f hello"
        text: "Remove the container. The volume stays."
```

```rail
id: "bind-mount"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "mkdir data"
        text: "Make a folder named data in the current folder."
      - token: "echo 41 > data/visits.txt"
        text: "Write the number 41 into the count file from the host."
      - token: "--mount type=bind,src=\"$PWD\"/data,dst=/data"
        text: "Mount your data folder at /data in the container. $PWD is the current folder, so the source is an absolute path."
      - token: "cat data/visits.txt"
        text: "Read the count file from the host."
      - token: "echo 99 > data/visits.txt"
        text: "Change the count from the host while the container runs."
      - token: "ls -l data"
        text: "List the folder with owners and permissions."
      - token: "docker inspect --format"
        text: "Print the container's mounts. This one says bind."
      - token: "docker rm -f hello"
        text: "Remove the container. Your folder stays."
```

```rail
id: "missing-path"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "--mount type=bind,src=\"$PWD\"/missing,dst=/data"
        text: "Ask for a bind mount of a folder that does not exist. --mount refuses."
      - token: "-v \"$PWD\"/missing:/data"
        text: "The same mount in the short form. -v creates the missing folder on the host."
      - token: "ls -ld missing"
        text: "Show the folder itself, with its owner."
      - token: "docker rm -f hello"
        text: "Remove the container."
      - token: "rmdir missing"
        text: "Remove the empty folder."
```

```rail
id: "cleanup"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker volume rm hello-data"
        text: "Delete the volume and everything in it. This cannot be undone."
      - token: "docker volume ls --filter name=hello-data"
        text: "Check that the volume is gone."
      - token: "rm -r data"
        text: "Delete the data folder in the current folder."
```

```rail
id: "ownership"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "--mount type=bind,src=\"$PWD\"/data,dst=/data"
        text: "Bind-mount the empty data folder. The app creates visits.txt itself."
      - token: "ls -l data"
        text: "Show who owns the file the container created."
      - token: "echo 5 > data/visits.txt"
        text: "Try to write the file as your user."
      - token: "rm -f data/visits.txt"
        text: "Delete it without a question. That needs write permission on the folder, which you have."
      - token: "--user \"$(id -u):$(id -g)\""
        text: "Run the app with your user ID and group ID instead of root."
      - token: "curl http://127.0.0.1:8080/"
        text: "Count a visit and read the answer."
      - token: "docker rm -f hello"
        text: "Remove the container."
```

```rail
id: "read-only"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "--mount type=bind,src=\"$PWD\"/data,dst=/data,readonly"
        text: "Bind-mount the folder read-only. The container can read it but not write it."
      - token: "curl http://127.0.0.1:8080/"
        text: "Ask for a page. The app fails to write its count."
      - token: "docker logs -n 3 hello"
        text: "Show the last three log lines, with the error."
      - token: "docker rm -f hello"
        text: "Remove the container."
      - token: "rm -r data"
        text: "Delete the data folder."
```
