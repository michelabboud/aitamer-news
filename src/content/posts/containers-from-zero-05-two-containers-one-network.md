---
title: "Containers from Zero, part 5: two containers, one network"
description: "Put hello-app and an nginx proxy on a network you create, so one container reaches the other by name. See why the default network cannot do that, what happens when the app stops, and how networks keep containers apart."
pubDate: "2026-12-30T22:00:00Z"
series: containers-from-zero
series_order: 5
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
  id: containers-05
wildness:
  rating: 1
  verified: "Reached hello-app by name through an nginx proxy on a user-defined network, Engine 29.10.1, 25 Nov 2026"
  claimed: "Network drivers other than bridge, and IPv6 networks, are described from Docker's docs only"
verdict: "Create a network for containers that talk to each other, call them by name, and publish only the one port people need."
sources:
  - title: "Networking overview (Docker documentation)"
    url: https://docs.docker.com/engine/network/
  - title: "Bridge network driver (Docker documentation)"
    url: https://docs.docker.com/engine/network/drivers/bridge/
  - title: "docker network create (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/network/create/
  - title: "docker network connect (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/network/connect/
  - title: "docker container run (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/container/run/
  - title: "nginx official image (Docker Hub)"
    url: https://hub.docker.com/_/nginx
  - title: "ngx_http_proxy_module (nginx documentation)"
    url: https://nginx.org/en/docs/http/ngx_http_proxy_module.html
  - title: "alpine official image (Docker Hub)"
    url: https://hub.docker.com/_/alpine
  - title: "Containers from Zero, part 4: files that outlive the container"
    url: https://aitamer.news/posts/containers-from-zero-04-files-that-outlive-the-container/
  - title: "Containers from Zero (series page)"
    url: https://aitamer.news/series/containers-from-zero/
  - title: "Docker documentation"
    url: https://docs.docker.com/
---

So far every container in this series has worked alone, and you reached it from your machine through a published port. Most real setups have at least two containers that talk to each other: a web server in front of an app, an app in front of a database. This part builds the first such pair. `hello-app` from [part 4](https://aitamer.news/posts/containers-from-zero-04-files-that-outlive-the-container/) runs as a container named `web`, and an nginx container named `proxy` forwards your requests to it. To make that work, you create a network and let one container find the other by its name.

## Time and setup

- **Reading:** about 12 minutes.
- **Optional lab:** about 20 minutes, including one step that can wait a minute.
- **Optional advanced step:** about 5 minutes.

You need the `hello-app:1.2` image from part 4, the `hello` folder, and `curl`. The lab pulls two small public images, `alpine:3.24` and `nginx:1.30-alpine`. The series uses Docker Engine 29.10.1 and Compose v5.8.0, and writes `docker` without `sudo`.

## What you will build

A network named `hello-net` with two containers on it. `web` runs `hello-app:1.2` with the volume `hello-data` at `/data`, as in part 4 (Docker creates it again on first use), and publishes nothing. `proxy` runs nginx, publishes `127.0.0.1:8080`, and passes each request on to `http://web:8000`. From your machine, `curl http://127.0.0.1:8080/` answers `Hello from container ..., visit 2`.

## Every container is on a network

Part 1 said each container gets its own network namespace: its own interfaces and addresses. Docker connects that namespace to a network. The [bridge driver page](https://docs.docker.com/engine/network/drivers/bridge/) explains the default: "When you start Docker, a default bridge network (also called bridge) is created automatically, and newly-started containers connect to it unless otherwise specified." That is why every container so far had an address like `172.17.0.2`, and why `hello-app` saw requests from `172.17.0.1`.

The default network has one limit that matters here. Containers on it "can only access each other by IP addresses", the same page says, unless you use the old `--link` option, which it calls legacy. Addresses change when containers are recreated, so typing them into another container's configuration breaks easily.

## Your own network gives you names

The fix is a network you create yourself, a **user-defined bridge network**. The bridge page lists what it changes. First: "User-defined bridges provide automatic DNS resolution between containers." On such a network, a container's name works as a hostname for the other containers on it. Docker answers those lookups itself; the [networking overview](https://docs.docker.com/engine/network/) says containers on a custom network "use Docker's embedded DNS server", and "The embedded DNS server address is 127.0.0.11." Names Docker does not know, such as public websites, it forwards to the DNS servers your host uses.

Second, scope. "All containers without a --network specified, are attached to the default bridge network. This can be a risk, as unrelated stacks/services/containers are then able to communicate." A user-defined network holds only the containers you attach to it. The same page adds that by default Docker sets rules so containers on different bridge networks "can only communicate with each other using published ports". The advanced step shows that.

Inside one network, nothing needs publishing. "Containers connected to the same user-defined bridge network effectively expose all ports to each other." `-p` is only for traffic from outside, such as your browser or `curl`. So the pattern in this lab, and in most of the rest of the series, is one published port on the container people talk to, and none on the containers behind it.

![Two panels. On the default bridge network, the container web is at 172.17.0.2. An alpine container asking for http://web:8000/ gets bad address 'web:8000', because there is no name lookup; asking for http://172.17.0.2:8000/ works and answers visit 1. On the user-defined network hello-net, highlighted, an alpine container asks the embedded DNS server at 127.0.0.11 for web, learns that web is 172.18.0.2, and gets Hello from container 080f5f53068e, visit 1.](/diagrams/containers-from-zero-05-two-containers-one-network/default-bridge-vs-user-network.svg)

## Why a proxy

The second container in this lab is nginx acting as a **reverse proxy**: it accepts requests and passes them on to another server. Part 6 runs this same pair from one file, and part 7 keeps the shape with a database: one published port in front, nothing published behind it. Here it is simply the smallest useful program that has to find another container by name. Its whole configuration is one `server` block. The line that matters is `proxy_pass http://web:8000;`, which the [nginx proxy module documentation](https://nginx.org/en/docs/http/ngx_http_proxy_module.html) describes as setting "the protocol and address of a proxied server". `web` is a container name, and Docker's DNS turns it into an address.

The official nginx image reads extra configuration from `/etc/nginx/conf.d/`, and its default site lives in `/etc/nginx/conf.d/default.conf`. A read-only bind mount from part 4 replaces that file with yours, without building a new image.

![The Docker host runs curl against 127.0.0.1:8080. Inside the dashed network hello-net, the proxy container, nginx:1.30-alpine with proxy_pass http://web:8000, has the only published port, 127.0.0.1:8080 to 80. An arrow labelled web:8000, highlighted, goes from proxy to web, which runs hello-app:1.2 with the volume hello-data at /data. web is not published, shows only 8000/tcp, and logs requests from 172.18.0.3, the proxy's address.](/diagrams/containers-from-zero-05-two-containers-one-network/proxy-and-web.svg)

## Optional lab: a pair on one network

This lab is optional. Every command ran on 25 November 2026 with Docker Engine 29.10.1 in `/home/ubuntu/hello`; your IDs, addresses and times will differ.

> **Safety: this lab publishes port 8080 on 127.0.0.1 and deletes what it creates.** It creates containers named `web`, `proxy` and `client`, a network named `hello-net`, a volume named `hello-data`, and a file named `proxy.conf` in your `hello` folder. The cleanup step deletes all of them, including the visit count in `hello-data`. If you already have any of those names, check with `docker ps -a`, `docker network ls` and `docker volume ls`, and rename them in the commands. If port 8080 is busy, Docker refuses to start `proxy` and nothing else is affected; remove the half-created container with `docker rm proxy` before trying again. Other containers, networks and volumes keep running and stay untouched. To undo everything, run `docker rm -f web proxy client`, then `docker network rm hello-net`, then `docker volume rm hello-data`, then `rm proxy.conf`.

**1. Try a name on the default network.**

```bash rail=default-bridge
docker run -d --name web hello-app:1.2
docker run --rm alpine:3.24 wget -qO- http://web:8000/
docker inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' web
docker run --rm alpine:3.24 wget -qO- http://172.17.0.2:8000/
docker rm -f web
```

```text
b215e923eef720a39fde1da692cec3e4063fa68b2e7f36173a501114d040862a
wget: bad address 'web:8000'
172.17.0.2
Hello from container b215e923eef7, visit 1
web
```

The `alpine` container could not turn the name `web` into an address. The address worked. Use the address your `docker inspect` printed in the fourth line; yours may differ. `wget` is built into the small `alpine` image, so it is handy for a quick request from inside a network. The first time, Docker pulls `alpine:3.24` and prints its download messages before the answer.

**2. Create a network and try again.**

```bash rail=user-network
docker network create hello-net
docker network ls
docker run -d --name web --network hello-net --mount type=volume,src=hello-data,dst=/data hello-app:1.2
docker run --rm --network hello-net alpine:3.24 wget -qO- http://web:8000/
docker run --rm --network hello-net alpine:3.24 cat /etc/resolv.conf
docker run --rm --network hello-net alpine:3.24 nslookup web
```

```text
31411768bdbfa60600398756a283377f330220f28e19ec8eaaecfc0dd70d0eb0
NETWORK ID     NAME        DRIVER    SCOPE
55aa58477ea4   bridge      bridge    local
31411768bdbf   hello-net   bridge    local
2627086260d3   host        host      local
13c3cd697b49   none        null      local
080f5f53068e774f4e487870d6cd00540fc87bfa9de10de494ca00f8fd374b22
Hello from container 080f5f53068e, visit 1
# Generated by Docker Engine.
# This file can be edited; Docker Engine will not make further changes once it
# has been modified.

nameserver 127.0.0.11
options ndots:0

# Based on host file: '/etc/resolv.conf' (internal resolver)
# ExtServers: [host(10.0.0.2)]
# Overrides: []
# Option ndots from: internal
Server:		127.0.0.11
Address:	127.0.0.11:53

Non-authoritative answer:

Non-authoritative answer:
Name:	web
Address: 172.18.0.2
```

The name works now. `docker network ls` shows your network next to the three Docker creates: `bridge`, the default; `host`, which shares the host's own network; and `none`, which has no network at all. Inside the container, `/etc/resolv.conf` points at `127.0.0.11`, Docker's embedded DNS server, and `nslookup` shows it answering `web` with `172.18.0.2`. The `ExtServers` line names your host's DNS server, which will differ. If the first `wget` says `Connection refused`, the app had not started listening yet; run it again.

**3. Put the proxy in front.** In the `hello` folder, save this as `proxy.conf`:

```nginx
server {
    listen 80;

    location / {
        proxy_pass http://web:8000;
    }
}
```

Then start nginx on the same network, with the only published port:

```bash rail=proxy-run
docker run -d --name proxy --network hello-net -p 127.0.0.1:8080:80 --mount type=bind,src="$PWD"/proxy.conf,dst=/etc/nginx/conf.d/default.conf,readonly nginx:1.30-alpine
curl http://127.0.0.1:8080/
curl http://127.0.0.1:8080/
docker ps --format '{{.Names}}\t{{.Ports}}'
docker logs -n 2 web
```

```text
1558c2eca1548d7c07704880fc8dda08b52d779bd14d9415d6de88779bf15c95
Hello from container 080f5f53068e, visit 2
Hello from container 080f5f53068e, visit 3
proxy	127.0.0.1:8080->80/tcp
web	8000/tcp
172.18.0.3 "GET / HTTP/1.1" 200 -
172.18.0.3 "GET / HTTP/1.1" 200 -
```

Your request went to the proxy, and the proxy asked `web`. The count continued from step 2 because `web` keeps it in the volume. `docker ps` shows the difference between the two: `proxy` has a published port, while `web` lists `8000/tcp` with no host address, so only containers on `hello-net` can reach it. Its logs show the requests coming from `172.18.0.3`, the proxy.

**4. See who is on the network.**

```bash rail=network-inspect
docker network inspect --format '{{range .Containers}}{{.Name}} {{.IPv4Address}}{{"\n"}}{{end}}' hello-net
```

```text
web 172.18.0.2/16
proxy 172.18.0.3/16
```

Two containers, each with an address on `hello-net`. `/16` is the size of the network's address range.

**5. Stop the app and ask the proxy.** This step can take a minute.

```bash rail=stop-web
docker stop web
curl http://127.0.0.1:8080/
docker logs -n 1 proxy
docker start web
curl http://127.0.0.1:8080/
```

```text
web
<html>
<head><title>504 Gateway Time-out</title></head>
<body>
<center><h1>504 Gateway Time-out</h1></center>
<hr><center>nginx/1.30.8</center>
</body>
</html>
172.18.0.1 - - [25/Nov/2026:12:31:57 +0000] "GET / HTTP/1.1" 504 167 "-" "curl/8.5.0" "-"
web
Hello from container 080f5f53068e, visit 4
```

With `web` stopped, the proxy had nobody to pass the request to. In this run nginx waited for a connection until its `proxy_connect_timeout`, 60 seconds by default, and answered `504 Gateway Time-out`. In an earlier run the same step answered at once with `502 Bad Gateway`. Both mean the proxy is up and the server behind it is not. After `docker start web`, the next request worked and the count went on.

**6. Start the proxy before the app exists.**

```bash rail=proxy-first
docker rm -f proxy web
docker run -d --name proxy --network hello-net -p 127.0.0.1:8080:80 --mount type=bind,src="$PWD"/proxy.conf,dst=/etc/nginx/conf.d/default.conf,readonly nginx:1.30-alpine
docker ps -a --filter name=proxy --format '{{.Names}} {{.Status}}'
docker logs proxy 2>&1 | tail -2
docker rm proxy
```

```text
proxy
web
61681b0860b06e3711e466693cbe0095c531cf62ca970f766376fb9ba23d86d4
proxy Exited (1) 1 second ago
2026/11/25 12:31:59 [emerg] 1#1: host not found in upstream "web" in /etc/nginx/conf.d/default.conf:5
nginx: [emerg] host not found in upstream "web" in /etc/nginx/conf.d/default.conf:5
```

nginx looks up `web` when it starts. With no container named `web` on the network, it stopped with `host not found in upstream`. Order matters: start `web` first, then `proxy`. Part 6 hands that order to Compose, and its advanced section shows the opposite problem: nginx keeps the address it looked up, even after `web` moves. `2>&1` sends nginx's error output into the pipe as well, so `tail` sees it.

**7. Clean up.** This deletes the network, the volume and its count, and `proxy.conf`.

```bash rail=cleanup
docker network rm hello-net
docker volume rm hello-data
rm proxy.conf
```

```text
hello-net
hello-data
```

If you go on to the advanced step, run the cleanup after it instead.

## Optional advanced: networks keep containers apart

Start `web` on `hello-net` again, and a `client` container on the default network. Ask for `web`'s address from outside its network, then connect the client to it:

```bash rail=isolation
docker run -d --name web --network hello-net --mount type=volume,src=hello-data,dst=/data hello-app:1.2
docker inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' web
docker run --rm alpine:3.24 wget -T 3 -qO- http://172.18.0.2:8000/
docker run -d --name client alpine:3.24 sleep 300
docker network connect hello-net client
docker exec client wget -qO- http://web:8000/
docker inspect --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' client
docker rm -f client web
```

```text
6c21257b461647eee76716591f63d7f88571a3dcfd5f03ff7b05507abd7effcf
172.18.0.2
wget: download timed out
24f10ec9f0103086f6f205228493e2373369c8717fbc4db3abad810d2006f4ba
Hello from container 6c21257b4616, visit 5
bridge hello-net 
client
web
```

From the default network, even the right address timed out after three seconds: Docker's rules keep the two bridge networks apart. `docker network connect` attached the running `client` to `hello-net` as well, without a restart, and from there the name worked. The last `inspect` lists both networks the client is on. Run the cleanup from step 7 when you are done.

![Before: client on the default bridge and web on hello-net, at 172.18.0.2; wget http://172.18.0.2:8000/ from the client times out. After docker network connect, the client, highlighted, is on both networks, and wget http://web:8000/ answers Hello from container 6c21257b4616, visit 5.](/diagrams/containers-from-zero-05-two-containers-one-network/networks-keep-containers-apart.svg)

## When it goes wrong

**`bad address 'web:8000'`, or `Could not resolve host`.** The two containers are not on the same user-defined network, or the name is wrong. `docker network inspect hello-net` lists who is on it. The default bridge never resolves container names.

**`host not found in upstream "web"` and nginx exits.** nginx started before a container named `web` was on its network. Start `web`, then start the proxy again with `docker start proxy`.

**`502 Bad Gateway` or `504 Gateway Time-out`.** The proxy works and the app behind it does not answer. Check `docker ps -a` and `docker logs web`. Check that the port in `proxy_pass` is the one the app listens on, `8000`.

**`curl: (7) Failed to connect` to `127.0.0.1:8080`.** The proxy is not running, or not published. Remember that `web` has no published port; ask the proxy.

**`wget: download timed out` to a container address.** The two containers are on different networks. Connect them with `docker network connect`, or start them on the same network.

**`network hello-net has active endpoints`.** `docker network rm` refuses while a container is attached; the message names it. Remove or disconnect it first.

## Cheat sheet

| Task | Command | Note |
|---|---|---|
| Create a network | `docker network create hello-net` | bridge driver by default |
| List networks | `docker network ls` | `bridge`, `host`, `none` always exist |
| Start on a network | `docker run -d --name web --network hello-net ...` | the name becomes a hostname |
| Who is on it | `docker network inspect hello-net` | addresses of each container |
| Attach a running container | `docker network connect hello-net client` | it keeps its other networks |
| Detach | `docker network disconnect hello-net client` | |
| A container's address | `docker inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' web` | changes when it is recreated |
| Quick request from inside | `docker run --rm --network hello-net alpine:3.24 wget -qO- http://web:8000/` | |
| Remove a network | `docker network rm hello-net` | only with no containers attached |

## Recap and what is next

- Containers start on the default bridge network, where they reach each other only by address.
- On a network you create, Docker's DNS server at `127.0.0.11` resolves container names.
- Containers on the same network reach every port on each other; publish only the port people outside need.
- A reverse proxy in front of an app needs the app to exist when it starts, and answers `502` or `504` when the app is down.
- Separate networks keep containers apart until you connect them.

Next: Containers from Zero, part 6: Compose for that pair, where one file replaces the network, volume and both `docker run` commands from this lab. The [series page](https://aitamer.news/series/containers-from-zero/) lists each part as it is published.

*Quoted passages in this lesson come from the [Docker documentation](https://docs.docker.com/) and the [nginx documentation](https://nginx.org/en/docs/). Docker® is a registered trademark of Docker, Inc. NGINX is a registered trademark of F5, Inc. aitamer.news is not affiliated with or endorsed by Docker, Inc. or F5, Inc.*

```rail
id: "default-bridge"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker run -d --name web hello-app:1.2"
        text: "Start hello-app named web, on the default bridge network."
      - token: "docker run --rm alpine:3.24"
        text: "Start a throwaway alpine container, removed when it exits."
      - token: "wget -qO- http://web:8000/"
        text: "Fetch a URL quietly and print the answer. Here the name web cannot be resolved."
      - token: "docker inspect --format"
        text: "Print web's address on its network."
      - token: "wget -qO- http://172.17.0.2:8000/"
        text: "The same request by address, which works."
      - token: "docker rm -f web"
        text: "Remove the container."
```

```rail
id: "user-network"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker network create hello-net"
        text: "Create a user-defined bridge network named hello-net."
      - token: "docker network ls"
        text: "List networks, including the three Docker creates."
      - token: "--network hello-net"
        text: "Attach the container to hello-net instead of the default network."
      - token: "--mount type=volume,src=hello-data,dst=/data"
        text: "Keep the visit count in the volume hello-data, as in part 4."
      - token: "wget -qO- http://web:8000/"
        text: "Ask web by name from another container on the same network."
      - token: "cat /etc/resolv.conf"
        text: "Show the DNS settings Docker gave the container."
      - token: "nslookup web"
        text: "Ask the DNS server for the address of web."
```

```rail
id: "proxy-run"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "--name proxy --network hello-net"
        text: "Name the container proxy and put it on hello-net with web."
      - token: "-p 127.0.0.1:8080:80"
        text: "Publish nginx's port 80 on host port 8080, this machine only."
      - token: "--mount type=bind,src=\"$PWD\"/proxy.conf,dst=/etc/nginx/conf.d/default.conf,readonly"
        text: "Replace nginx's default site with your proxy.conf, read-only."
      - token: "nginx:1.30-alpine"
        text: "The official nginx image, version 1.30, built on Alpine."
      - token: "curl http://127.0.0.1:8080/"
        text: "Ask the proxy. It passes the request to web."
      - token: "docker ps --format"
        text: "List running containers with only their names and ports."
      - token: "docker logs -n 2 web"
        text: "The last two requests web received, from the proxy's address."
```

```rail
id: "network-inspect"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker network inspect hello-net"
        text: "Show the network's details as JSON."
      - token: "--format"
        text: "Print one line per attached container, with its name and address."
```

```rail
id: "stop-web"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker stop web"
        text: "Stop the app. The proxy keeps running."
      - token: "curl http://127.0.0.1:8080/"
        text: "Ask the proxy. It cannot reach web and answers with an error page."
      - token: "docker logs -n 1 proxy"
        text: "nginx's access log line for that request, with the status code."
      - token: "docker start web"
        text: "Start the app again."
      - token: "curl http://127.0.0.1:8080/"
        text: "The proxy reaches web again."
```

```rail
id: "proxy-first"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker rm -f proxy web"
        text: "Remove both containers."
      - token: "docker run -d --name proxy"
        text: "Start the proxy again, this time with no web on the network."
      - token: "docker ps -a --filter name=proxy"
        text: "Show the proxy's state. It has exited."
      - token: "docker logs proxy 2>&1 | tail -2"
        text: "Send error output into the pipe too, and show the last two lines."
      - token: "docker rm proxy"
        text: "Remove the stopped proxy."
```

```rail
id: "cleanup"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker network rm hello-net"
        text: "Delete the network. It must have no containers attached."
      - token: "docker volume rm hello-data"
        text: "Delete the volume and the visit count in it."
      - token: "rm proxy.conf"
        text: "Delete the nginx configuration file."
```

```rail
id: "isolation"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "--network hello-net"
        text: "Start web on hello-net again."
      - token: "docker inspect --format"
        text: "Print web's address on hello-net."
      - token: "wget -T 3 -qO- http://172.18.0.2:8000/"
        text: "From the default network, try web's address and give up after 3 seconds."
      - token: "docker run -d --name client alpine:3.24 sleep 300"
        text: "Start a client container on the default network that waits 300 seconds."
      - token: "docker network connect hello-net client"
        text: "Attach the running client to hello-net as well."
      - token: "docker exec client wget -qO- http://web:8000/"
        text: "Run wget inside the client. Now the name works."
      - token: "docker inspect --format"
        text: "List the names of the networks the client is on."
      - token: "docker rm -f client web"
        text: "Remove both containers."
```
