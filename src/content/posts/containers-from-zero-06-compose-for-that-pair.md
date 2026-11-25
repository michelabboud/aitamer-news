---
title: "Containers from Zero, part 6: Compose for that pair"
description: "Replace the network, the volume and both docker run commands from part 5 with one compose.yaml. Start, inspect, change and stop the pair with docker compose, and see what it creates and what down removes."
pubDate: "2027-01-06T22:00:00Z"
series: containers-from-zero
series_order: 6
section: devops
subsection: containers
tags:
  - containers-from-zero
  - docker
  - compose
  - containers
  - tutorial
draft: false
author: caret
lessonKit:
  id: containers-06
wildness:
  rating: 1
  verified: "Ran the web and proxy pair from one compose.yaml with Compose v5.8.0 on Engine 29.10.1, 25 Nov 2026"
  claimed: "Compose v2 and v5 being functionally identical is Docker's statement; we ran v5.8.0 only"
verdict: "Write the pair down once in compose.yaml, start it with docker compose up -d, and remember that down -v deletes the data."
sources:
  - title: "How Compose works (Docker documentation)"
    url: https://docs.docker.com/compose/intro/compose-application-model/
  - title: "History and development of Docker Compose (Docker documentation)"
    url: https://docs.docker.com/compose/intro/history/
  - title: "Services top-level element (Compose file reference)"
    url: https://docs.docker.com/reference/compose-file/services/
  - title: "Networking in Compose (Docker documentation)"
    url: https://docs.docker.com/compose/how-tos/networking/
  - title: "Control startup order (Docker documentation)"
    url: https://docs.docker.com/compose/how-tos/startup-order/
  - title: "docker compose up (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/compose/up/
  - title: "docker compose down (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/compose/down/
  - title: "docker compose config (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/compose/config/
  - title: "docker compose ps (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/compose/ps/
  - title: "docker compose logs (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/compose/logs/
  - title: "docker compose exec (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/compose/exec/
  - title: "ngx_http_proxy_module (nginx documentation)"
    url: https://nginx.org/en/docs/http/ngx_http_proxy_module.html
  - title: "Containers from Zero, part 5: two containers, one network"
    url: https://aitamer.news/posts/containers-from-zero-05-two-containers-one-network/
  - title: "Containers from Zero (series page)"
    url: https://aitamer.news/series/containers-from-zero/
  - title: "Docker documentation"
    url: https://docs.docker.com/
---

[Part 5](https://aitamer.news/posts/containers-from-zero-05-two-containers-one-network/) took three commands and a careful order to run two containers: create a network, start `web` with its volume, then start `proxy` with a port, a bind mount and the right image. Getting any of it wrong, or starting things in the wrong order, broke the pair. This part writes the same setup down once, in a file named `compose.yaml`, and hands it to **Docker Compose**. One command starts everything, one shows its state, and one takes it all down again.

## Time and setup

- **Reading:** about 13 minutes.
- **Optional lab:** about 20 minutes.
- **Optional advanced step:** about 5 minutes.

You need the `hello` folder with `app.py` (version 1.2), the `Dockerfile` from part 4, and `curl`. The series uses Docker Engine 29.10.1 and Compose v5.8.0, and writes `docker` without `sudo`. Part 1 installed Compose as the `docker compose` plugin; `docker compose version` should print a version.

## What you will build

A `compose.yaml` in the `hello` folder that describes two services. `web` builds `hello-app` from the folder and keeps its count in a volume. `proxy` runs nginx with your `proxy.conf` and publishes `127.0.0.1:8080`. `docker compose up -d` starts both; `curl http://127.0.0.1:8080/` answers `Hello from container ..., visit 1`.

## What Compose is

Compose reads a file that describes containers, networks and volumes, and makes Docker match it. The [Compose application model](https://docs.docker.com/compose/intro/compose-application-model/) calls each container role a **service**, and the set of them a **project**. The default file name is `compose.yaml`; Compose looks for it in the current folder. It also accepts the older names `compose.yml`, `docker-compose.yaml` and `docker-compose.yml`.

You run it as `docker compose`, with a space. The old Python program `docker-compose`, with a hyphen, was Compose v1, and the [Compose history page](https://docs.docker.com/compose/intro/history/) says the supported versions today are v2 and v5. It adds that "Compose v5, released in 2025, is functionally identical to Compose v2"; the version number jumped to avoid confusion with old file formats labelled "v2" and "v3". Files in this series have no `version:` line, which current Compose does not need.

## From commands to a file

Each part of a `docker run` command has a key in `compose.yaml`. The [services reference](https://docs.docker.com/reference/compose-file/services/) lists them all; this lab needs only a handful:

- `build: .` builds an image from the Dockerfile in this folder, as `docker build .` did. Compose names it after the project and service, here `hello-web`.
- `image: nginx:1.30-alpine` uses an existing image, as the last word of `docker run` did.
- `environment:` sets variables, as `-e` did.
- `ports: ["127.0.0.1:8080:80"]` publishes a port, as `-p` did. Quote it, so YAML reads it as text.
- `volumes:` under a service mounts storage. `hello-data:/data` is a named volume; `./proxy.conf:...:ro` is a bind mount of a file relative to `compose.yaml`, read-only.
- `depends_on: [web]` starts `web` before `proxy`.

The network has no line at all. The [Compose networking page](https://docs.docker.com/compose/how-tos/networking/) explains: "When you run docker compose up, Compose creates a network named <project-name>_default and attaches all services to it. Each service registers its name with an internal DNS server, so containers can reach each other using the service name directly." That is the user-defined network from part 5, made for you, and it is why `proxy_pass http://web:8000` still works.

![Left, the commands from part 5; right, the matching lines in compose.yaml. docker network create hello-net becomes nothing, because Compose creates hello_default. the volume that web's --mount created on first use becomes the top-level volumes key. docker run --name web with the network, the volume mount and hello-app:1.2 becomes the service web with build: . and its volume (highlighted). docker run --name proxy with -p 127.0.0.1:8080:80 and the proxy.conf mount becomes the service proxy with image nginx:1.30-alpine, ports, volumes and depends_on: web.](/diagrams/containers-from-zero-06-compose-for-that-pair/run-commands-to-compose.svg)

## Names Compose gives things

The project name comes from the folder name unless the file sets `name:`. This file sets `name: hello`, so everything it creates starts with `hello`: the network `hello_default`, the volume `hello_hello-data`, and containers named after project, service and a number, `hello-web-1` and `hello-proxy-1`. Inside the network, services still find each other by the short service name, `web`. Two projects with different names can use the same `compose.yaml` side by side without their containers, networks or volumes colliding, apart from host ports.

## Started is not ready

`depends_on` decides the order in which Compose starts containers. It does not wait for the program inside to be ready. The [startup order page](https://docs.docker.com/compose/how-tos/startup-order/) says it plainly: "On startup, Compose does not wait until a container is "ready", only until it's running." The lab shows what that looks like. Part 9 adds health checks so Compose can wait properly.

![Inside project hello: the image hello-web, built from build: ., and the volume hello_hello-data. Inside the dashed network hello_default, highlighted, hello-web-1 (service web, 8000/tcp, /data from hello_hello-data) and hello-proxy-1 (service proxy, 127.0.0.1:8080 to 80/tcp). An arrow labelled web:8000 goes from proxy to web. They started in order, hello-web-1 then hello-proxy-1, because of depends_on.](/diagrams/containers-from-zero-06-compose-for-that-pair/what-compose-up-creates.svg)

## up, down, and down -v

`docker compose up -d` creates whatever is missing and starts it in the background. Run it again after you change the file, and the [up reference](https://docs.docker.com/reference/cli/docker/compose/up/) says Compose "picks up the changes by stopping and recreating the containers (preserving mounted volumes)". Services you did not change keep running.

`docker compose down` stops and removes the project's containers and its default network. The [down reference](https://docs.docker.com/reference/cli/docker/compose/down/) lists what it leaves: named volumes stay unless you add `-v`, which removes "named volumes declared in the "volumes" section of the Compose file and anonymous volumes attached to containers". Images stay unless you add `--rmi`. So `down` is safe for your data, and `down -v` deletes it.

![A table. docker compose down removes the containers hello-web-1 and hello-proxy-1 and the network hello_default, keeps the volume hello_hello-data so the next up continues at visit 3, and keeps the image hello-web. docker compose down -v removes the containers, the network and the volume, highlighted because it deletes the count, and keeps the image; --rmi local would remove it.](/diagrams/containers-from-zero-06-compose-for-that-pair/down-and-down-v.svg)

## Optional lab: one file for the pair

This lab is optional. Every command ran on 25 November 2026 with Docker Engine 29.10.1 and Compose v5.8.0 in `/home/ubuntu/hello`; your IDs, addresses and times will differ.

> **Safety: this lab publishes port 8080 on 127.0.0.1 and its last step deletes data.** It creates a Compose project named `hello`: the network `hello_default`, the volume `hello_hello-data`, the image `hello-web`, and the containers `hello-web-1` and `hello-proxy-1`. The cleanup step, `docker compose down -v`, deletes the volume and the visit count in it. If you already run another Compose project named `hello`, change `name: hello` in the file first, or the two will share containers and data. If port 8080 is busy, the proxy fails to start and nothing else is affected; stop the part 5 containers if they are still running. Other containers, networks and volumes keep running and stay untouched. To undo everything, run `docker compose down -v --rmi local` in the `hello` folder; `--rmi local` also removes the `hello-web` image that Compose built.

**1. Write the two files.** In the `hello` folder, save `proxy.conf` again if you removed it in part 5:

```nginx
server {
    listen 80;

    location / {
        proxy_pass http://web:8000;
    }
}
```

Then save this as `compose.yaml` next to it:

```yaml
name: hello

services:
  web:
    build: .
    environment:
      GREETING: Hello
    volumes:
      - hello-data:/data

  proxy:
    image: nginx:1.30-alpine
    ports:
      - "127.0.0.1:8080:80"
    volumes:
      - ./proxy.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - web

volumes:
  hello-data:
```

YAML uses indentation for structure, so use spaces, two per level, and no tabs. The last two lines declare the named volume that `web` uses.

**2. Check the file.**

```bash rail=compose-config
docker compose config
```

```text
name: hello
services:
  proxy:
    image: nginx:1.30-alpine
    networks:
      default: null
    volumes:
      - type: bind
        source: /home/ubuntu/hello/proxy.conf
        target: /etc/nginx/conf.d/default.conf
        read_only: true
        bind: {}
    depends_on:
      web:
        condition: service_started
        required: true
    ports:
      - mode: ingress
        host_ip: 127.0.0.1
        target: 80
        published: "8080"
        protocol: tcp
  web:
    environment:
      GREETING: Hello
    networks:
      default: null
    volumes:
      - type: volume
        source: hello-data
        target: /data
        volume: {}
    build:
      context: /home/ubuntu/hello
      dockerfile: Dockerfile
networks:
  default:
    name: hello_default
volumes:
  hello-data:
    name: hello_hello-data
```

`config` reads the file, fills in defaults, and prints the full model, or an error if the YAML is wrong. Short forms are spelled out: the bind mount is `type: bind` with an absolute source, the port has `host_ip: 127.0.0.1`, and `depends_on` waits for `condition: service_started`, which means running, not ready. The last lines show the names Compose will use: `hello_default` and `hello_hello-data`.

**3. Start the pair.**

```bash rail=compose-up
docker compose up -d
curl http://127.0.0.1:8080/
curl http://127.0.0.1:8080/
curl http://127.0.0.1:8080/
```

```text
 Image hello-web Building
...
#9 naming to docker.io/library/hello-web:latest done
...
 Image hello-web Built
 Network hello_default Creating
 Volume hello_hello-data Creating
 Volume hello_hello-data Created
 Network hello_default Created
 Container hello-web-1 Creating
 Container hello-web-1 Created
 Container hello-proxy-1 Creating
 Container hello-proxy-1 Created
 Container hello-web-1 Starting
 Container hello-web-1 Started
 Container hello-proxy-1 Starting
 Container hello-proxy-1 Started
curl: (56) Recv failure: Connection reset by peer
Hello from container 631172cdddda, visit 1
Hello from container 631172cdddda, visit 2
```

Compose built the image, created the network and volume, then created and started `web` before `proxy`. The build steps came from the cache, since the Dockerfile and `app.py` match `hello-app:1.2`. The first `curl`, typed straight after, arrived before nginx was listening: both containers were started, neither was ready. In another run the first request got `502 Bad Gateway` from nginx instead, because `web` was not listening yet. A second later, both answered.

**4. Look at the project.**

```bash rail=compose-ps
docker compose ps
docker compose logs web
```

```text
NAME            IMAGE               COMMAND                  SERVICE   CREATED        STATUS        PORTS
hello-proxy-1   nginx:1.30-alpine   "/docker-entrypoint.…"   proxy     1 second ago   Up 1 second   127.0.0.1:8080->80/tcp
hello-web-1     hello-web           "python app.py"          web       1 second ago   Up 1 second   8000/tcp
web-1  | listening on port 8000
web-1  | 172.18.0.3 "GET / HTTP/1.1" 200 -
web-1  | 172.18.0.3 "GET / HTTP/1.1" 200 -
```

`docker compose ps` lists only this project's containers, with their service names. `docker compose logs` takes service names, and prefixes each line with the service and its number, such as `web-1`; leave the name off to see every service, and add `-f` to follow.

**5. Take it down and bring it back.**

```bash rail=down-up
docker compose down
docker compose up -d
curl http://127.0.0.1:8080/
docker volume ls --filter name=hello
docker network ls --filter name=hello
```

```text
 Container hello-proxy-1 Stopping
 Container hello-proxy-1 Stopped
 Container hello-proxy-1 Removing
 Container hello-proxy-1 Removed
 Container hello-web-1 Stopping
 Container hello-web-1 Stopped
 Container hello-web-1 Removing
 Container hello-web-1 Removed
 Network hello_default Removing
 Network hello_default Removed
 Network hello_default Creating
 Network hello_default Created
 Container hello-web-1 Creating
 Container hello-web-1 Created
 Container hello-proxy-1 Creating
 Container hello-proxy-1 Created
 Container hello-web-1 Starting
 Container hello-web-1 Started
 Container hello-proxy-1 Starting
 Container hello-proxy-1 Started
Hello from container ba02556a84a2, visit 3
DRIVER    VOLUME NAME
local     hello_hello-data
NETWORK ID     NAME            DRIVER    SCOPE
cd076a7ecfe2   hello_default   bridge    local
```

`down` stopped `proxy` first, the reverse of the start order, then removed both containers and the network. It did not touch the volume, so the new `web` container, with a new ID, carried on at visit 3.

**6. Change the configuration.** In `compose.yaml`, change `GREETING: Hello` to `GREETING: Shalom`, save, and run:

```bash rail=change-config
docker compose up -d
curl http://127.0.0.1:8080/
docker compose exec web cat /data/visits.txt
```

```text
 Container hello-proxy-1 Running
 Container hello-web-1 Recreate
 Container hello-web-1 Recreated
 Container hello-web-1 Starting
 Container hello-web-1 Started
Shalom from container eafaf26b629a, visit 4
4
```

Compose compared the file with what was running, recreated only `web`, and left `proxy` running. `docker compose exec` runs a command in a running service's container, here to read the count file from the volume.

**7. See it in plain Docker terms.**

```bash rail=plain-docker
docker ps --format '{{.Names}}\t{{.Image}}\t{{.Ports}}'
docker network inspect --format '{{range .Containers}}{{.Name}} {{.IPv4Address}}{{"\n"}}{{end}}' hello_default
docker inspect --format '{{index .Config.Labels "com.docker.compose.project"}} {{index .Config.Labels "com.docker.compose.service"}}' hello-web-1
docker image ls hello-web
```

```text
hello-web-1	hello-web	8000/tcp
hello-proxy-1	nginx:1.30-alpine	127.0.0.1:8080->80/tcp
hello-proxy-1 172.18.0.3/16
hello-web-1 172.18.0.2/16
hello web
IMAGE              ID             DISK USAGE   CONTENT SIZE   EXTRA
hello-web:latest   ffccb8bb8ac1        178MB         43.6MB   U
```

Compose made ordinary containers, a network and an image, the same kinds of objects you made by hand in part 5. It finds its own again through labels it attaches, such as `com.docker.compose.project` and `com.docker.compose.service`.

**8. Clean up.** This deletes the volume and its count.

```bash rail=down-v
docker compose down -v
docker volume ls --filter name=hello
```

```text
 Container hello-proxy-1 Stopping
 Container hello-proxy-1 Stopped
 Container hello-proxy-1 Removing
 Container hello-proxy-1 Removed
 Container hello-web-1 Stopping
 Container hello-web-1 Stopped
 Container hello-web-1 Removing
 Container hello-web-1 Removed
 Volume hello_hello-data Removing
 Network hello_default Removing
 Volume hello_hello-data Removed
 Network hello_default Removed
DRIVER    VOLUME NAME
```

The volume list is empty. Keep `compose.yaml` and `proxy.conf` if you want to try the advanced step; `docker compose up -d` brings everything back with a fresh count.

## Optional advanced: a proxy with a stale address

nginx looks up `web` when it starts and keeps the address it got. Normally `web` keeps its address too, but not always. To force a change, stop `web`, let another container take its address, then start `web` again:

```bash rail=stale-address
docker compose up -d
curl http://127.0.0.1:8080/
docker compose stop web
docker run -d --name squatter --network hello_default alpine:3.24 sleep 300
docker compose up -d web
docker inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' squatter hello-web-1
curl http://127.0.0.1:8080/
docker compose logs proxy | grep upstream
docker compose restart proxy
curl http://127.0.0.1:8080/
docker rm -f squatter
docker compose down -v
```

```text
...
Hello from container baa441d304fc, visit 1
...
ab80061e71b3fe90a79245a5812d52cf4ff349c436d85732d3ca443697be5a7e
 Container hello-web-1 Starting
 Container hello-web-1 Started
172.18.0.2
172.18.0.4
<html>
<head><title>502 Bad Gateway</title></head>
<body>
<center><h1>502 Bad Gateway</h1></center>
<hr><center>nginx/1.30.8</center>
</body>
</html>
proxy-1  | 2026/11/25 12:37:16 [error] 23#23: *3 connect() failed (111: Connection refused) while connecting to upstream, client: 172.18.0.1, server: , request: "GET / HTTP/1.1", upstream: "http://172.18.0.2:8000/", host: "127.0.0.1:8080"
 Container hello-proxy-1 Restarting
 Container hello-proxy-1 Started
Hello from container baa441d304fc, visit 2
...
```

`web` came back at `172.18.0.4`, but nginx still sent the request to `172.18.0.2`, where `squatter` refused it: the log line names the old `upstream`. Restarting the proxy made nginx look the name up again. nginx can look names up while it runs, but that takes two changes: the [proxy module documentation](https://nginx.org/en/docs/http/ngx_http_proxy_module.html) says a `proxy_pass` value containing variables is resolved with a `resolver`, and the [core module documentation](https://nginx.org/en/docs/http/ngx_http_core_module.html#resolver) describes `resolver` as the directive that "configures name servers used to resolve names of upstream servers into addresses". For this series, restarting the proxy after recreating `web` is enough.

## When it goes wrong

**`no configuration file provided: not found`.** You are not in the folder with `compose.yaml`. `cd` into it, or pass the file with `docker compose -f path/to/compose.yaml`.

**`yaml: line 3: found character that cannot start any token`.** A tab in the indentation; YAML allows only spaces. A key indented one space too far gives `mapping values are not allowed in this context` instead. Both name the line.

**`Bind for 127.0.0.1:8080 failed: port is already allocated`.** The part 5 `proxy` container, or another program, still holds the port. `docker ps` shows which; `docker rm -f proxy web` removes the part 5 pair.

**The first request fails right after `up`.** `depends_on` waits for the container to be running, not for the program to be ready. Wait a second; part 9 makes Compose wait for a health check.

**`502 Bad Gateway` after `web` was recreated.** The proxy may hold an old address. `docker compose restart proxy`.

**The count starts at 1 after `down`.** You used `down -v`, or changed `name:` so Compose made a new volume with a new prefix. `docker volume ls` shows what exists.

**A change to `app.py` does not show up.** `up` does not rebuild an image that already exists. Run `docker compose up -d --build`.

## Cheat sheet

| Task | Command | Note |
|---|---|---|
| Check and print the model | `docker compose config` | errors point at the line |
| Start in the background | `docker compose up -d` | builds and creates what is missing |
| Rebuild, then start | `docker compose up -d --build` | after changing the source |
| List the project's containers | `docker compose ps` | with service names |
| Logs of one service | `docker compose logs web` | `-f` to follow |
| Run a command in a service | `docker compose exec web cat /data/visits.txt` | the container must be running |
| Restart one service | `docker compose restart proxy` | same container |
| Stop and remove, keep data | `docker compose down` | volumes and images stay |
| Stop and remove, delete data | `docker compose down -v` | removes named volumes too |
| Compose version | `docker compose version` | v5.8.0 in this series |

## Recap and what is next

- `compose.yaml` describes services, volumes and networks once; `docker compose` makes Docker match it.
- Compose creates a `<project>_default` network where services find each other by name, and prefixes names with the project.
- `depends_on` sets start order. Running is not ready.
- `up -d` recreates only what changed; `down` keeps named volumes; `down -v` deletes them.
- Compose builds ordinary containers, networks, volumes and images, and labels them so it can find them again.

Next: Containers from Zero, part 7: a small multi-container app, where a web process stores notes in a PostgreSQL database, both started by one `compose.yaml`. The [series page](https://aitamer.news/series/containers-from-zero/) lists each part as it is published.

*Quoted passages in this lesson come from the [Docker documentation](https://docs.docker.com/) and the [nginx documentation](https://nginx.org/en/docs/). Docker® is a registered trademark of Docker, Inc. NGINX is a registered trademark of F5, Inc. aitamer.news is not affiliated with or endorsed by Docker, Inc. or F5, Inc.*

```rail
id: "compose-config"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose config"
        text: "Read compose.yaml from the current folder, check it, fill in defaults and print the full model."
```

```rail
id: "compose-up"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose up"
        text: "Create and start everything compose.yaml describes, building images where needed."
      - token: "-d"
        text: "Detached. Start in the background and return to the prompt."
      - token: "curl http://127.0.0.1:8080/"
        text: "Ask the proxy. The first request may come too early."
```

```rail
id: "compose-ps"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose ps"
        text: "List the containers of this project, with service names, status and ports."
      - token: "docker compose logs web"
        text: "Show the logs of the web service. Each line starts with the service and its number, web-1."
```

```rail
id: "down-up"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose down"
        text: "Stop and remove the project's containers and default network. Named volumes stay."
      - token: "docker compose up -d"
        text: "Create everything again in the background."
      - token: "curl http://127.0.0.1:8080/"
        text: "The count continues, because the volume was kept."
      - token: "docker volume ls --filter name=hello"
        text: "List volumes whose name contains hello."
      - token: "docker network ls --filter name=hello"
        text: "List networks whose name contains hello."
```

```rail
id: "change-config"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose up -d"
        text: "Compare compose.yaml with what runs, and recreate only the services that changed."
      - token: "curl http://127.0.0.1:8080/"
        text: "The new greeting, same count."
      - token: "docker compose exec web cat /data/visits.txt"
        text: "Run cat inside the running web container to read the count file."
```

```rail
id: "plain-docker"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker ps --format"
        text: "List running containers with name, image and ports only."
      - token: "docker network inspect --format"
        text: "List the containers on hello_default with their addresses."
      - token: "docker inspect --format"
        text: "Print two labels Compose put on the container, its project and service."
      - token: "docker image ls hello-web"
        text: "Show the image Compose built for the web service."
```

```rail
id: "down-v"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose down -v"
        text: "Stop and remove containers and the network, and delete the named volume with its data."
      - token: "docker volume ls --filter name=hello"
        text: "Check that the volume is gone."
```

```rail
id: "stale-address"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose stop web"
        text: "Stop the web container without removing it. Its address is freed."
      - token: "docker run -d --name squatter --network hello_default alpine:3.24 sleep 300"
        text: "Start a container on the project network so it takes the free address."
      - token: "docker compose up -d web"
        text: "Start web again. It gets a new address."
      - token: "docker inspect --format"
        text: "Print the addresses of squatter and hello-web-1."
      - token: "docker compose logs proxy | grep upstream"
        text: "Find nginx's error line, which names the address it tried."
      - token: "docker compose restart proxy"
        text: "Restart nginx so it looks up web again."
      - token: "docker rm -f squatter"
        text: "Remove the extra container."
      - token: "docker compose down -v"
        text: "Remove the project and its volume."
```
