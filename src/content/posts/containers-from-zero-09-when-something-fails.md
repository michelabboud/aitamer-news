---
title: "Containers from Zero, part 9: when something fails"
description: "Add health checks and restart policies to the notes app, then break it on purpose three ways: stop the database, start the web service with a missing setting, and end the database process. Read the state and the logs of both services and match each failure to what Docker did about it."
pubDate: "2027-01-27T22:00:00Z"
series: containers-from-zero
series_order: 9
section: devops
subsection: containers
tags:
  - containers-from-zero
  - docker
  - compose
  - postgresql
  - tutorial
draft: false
author: caret
lessonKit:
  id: containers-09
wildness:
  rating: 1
  verified: "Caused and read all three failures with Compose v5.8.0 and Engine 29.10.1, 25 Nov 2026"
  claimed: "Restart policy rules are quoted from the Docker documentation"
verdict: "A health check reports; a restart policy reacts to an exit. Neither fixes a wrong setting, and the logs say which one you have."
sources:
  - title: "Workload specification: healthcheck and depends_on (Compose file reference)"
    url: https://docs.docker.com/reference/compose-file/workload-spec/
  - title: "Services top-level element: restart (Compose file reference)"
    url: https://docs.docker.com/reference/compose-file/services/
  - title: "Dockerfile reference: HEALTHCHECK"
    url: https://docs.docker.com/reference/dockerfile/#healthcheck
  - title: "Start containers automatically (Docker documentation)"
    url: https://docs.docker.com/engine/containers/start-containers-automatically/
  - title: "Control startup order (Docker documentation)"
    url: https://docs.docker.com/compose/how-tos/startup-order/
  - title: "docker compose up (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/compose/up/
  - title: "docker compose logs (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/compose/logs/
  - title: "docker inspect (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/inspect/
  - title: "Merge Compose files (Docker documentation)"
    url: https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/
  - title: "pg_isready (PostgreSQL 18 documentation)"
    url: https://www.postgresql.org/docs/18/app-pg-isready.html
  - title: "Server Shutdown (PostgreSQL 18 documentation)"
    url: https://www.postgresql.org/docs/18/server-shutdown.html
  - title: "Containers from Zero, part 8: configuration and the database file"
    url: https://aitamer.news/posts/containers-from-zero-08-configuration-and-the-database-file/
  - title: "Containers from Zero, part 3: run one container"
    url: https://aitamer.news/posts/containers-from-zero-03-run-one-container/
  - title: "Containers from Zero (series page)"
    url: https://aitamer.news/series/containers-from-zero/
  - title: "Docker documentation"
    url: https://docs.docker.com/
---

Until now the notes app had one way to handle trouble: `sleep` and hope. [Part 8](https://aitamer.news/posts/containers-from-zero-08-configuration-and-the-database-file/) waited a few seconds for PostgreSQL before sending requests. This part gives Compose two tools. A **health check** is a command Docker runs inside a container to ask whether it works. A **restart policy** tells Docker what to do when a container's main process exits. Then you break the app three ways and read, for each one, what `docker compose ps`, `docker inspect` and the logs of both services say.

## Time and setup

- **Reading:** about 13 minutes.
- **Optional lab:** about 20 minutes, including two waits of about half a minute.
- **Optional advanced step:** about 5 minutes.

You need the `notes` folder from part 8 with its `.env` file, the notes in the `notes_db-data` volume, and `curl`. The series uses Docker Engine 29.10.1 and Compose v5.8.0, and writes `docker` without `sudo`.

## What you will build

The same `compose.yaml` with three additions: a health check on each service, a restart policy on each service, and a `depends_on` that waits for the database to be healthy. `docker compose up -d --wait` returns only when both services are healthy, so the first request works without a `sleep`.

## Health checks

The Compose [workload reference](https://docs.docker.com/reference/compose-file/workload-spec/) says `healthcheck` "declares a check that's run to determine whether or not the service containers are 'healthy'". It "works in the same way, and has the same default values, as the HEALTHCHECK Dockerfile instruction". The [Dockerfile reference](https://docs.docker.com/reference/dockerfile/#healthcheck) gives the rules:

- A container with a health check has a status besides running or exited. "This status is initially `starting`. Whenever a health check passes, it becomes `healthy`". It becomes `unhealthy` after `retries` failures in a row.
- The check runs every `interval`. If one run takes longer than `timeout`, it counts as failed.
- `start_period` gives a slow service time to start: "Probe failure during that period will not be counted towards the maximum number of retries."
- The command's exit code is the answer: 0 is healthy, 1 is unhealthy.

The check runs inside the container, so it can only use programs the image has. For `db`, the PostgreSQL image includes `pg_isready`, which part 8 used to wait for the database. For `web`, the `python:3.14-slim` image has neither `curl` nor `wget`, so the check is a line of Python that requests the app's `/healthz` page. Part 7's app answers `ok` there only after it has run `SELECT 1` against the database, so a healthy `web` means the app and its database connection both work.

## Restart policies

A restart policy is a different mechanism. Docker applies it when the container's main process exits; it does not look at the health status. The [services reference](https://docs.docker.com/reference/compose-file/services/) lists the values:

- `no`, the default: never restart.
- `on-failure[:max-retries]`: "restarts the container if the exit code indicates an error", at most `max-retries` times if you give a number.
- `unless-stopped`: "restarts the container irrespective of the exit code but stops restarting when the service is stopped or removed."
- `always`: restarts the container until it is removed.

The engine's [restart policy page](https://docs.docker.com/engine/containers/start-containers-automatically/) adds one rule this lab tests: "If you manually stop a container, the restart policy is ignored until the Docker daemon restarts or the container is manually restarted."

So an `unhealthy` container that keeps running is not restarted by Docker; something else has to act on that status. Compose acts on it at start-up: with `condition: service_healthy`, the [startup order guide](https://docs.docker.com/compose/how-tos/startup-order/) says "Compose waits for healthchecks to pass on dependencies marked with service_healthy." And `docker compose up --wait`, per the [up reference](https://docs.docker.com/reference/cli/docker/compose/up/), waits "for services to be running|healthy".

![Two columns. Left, the health check: Docker runs a test command inside the running container every interval, here pg_isready for db and a request to /healthz for web. The result is a health status, starting, healthy or unhealthy, after retries consecutive failures. depends_on with condition service_healthy and docker compose up --wait read that status. Highlighted: an unhealthy container keeps running; nothing restarts it. Right, the restart policy: Docker acts when the container's main process exits. on-failure:5 restarts after a non-zero exit, at most five times. unless-stopped restarts after any exit, unless you stopped the container yourself.](/diagrams/containers-from-zero-09-when-something-fails/health-and-restart.svg)

## Optional lab: break it three ways

This lab is optional. Every command ran on 25 November 2026 with Docker Engine 29.10.1 and Compose v5.8.0 in `/home/ubuntu/notes`; your IDs, times and addresses will differ.

> **Safety: this lab publishes port 8080 on 127.0.0.1 and stops services on purpose, but deletes no data.** It uses the Compose project `notes` from part 8: the containers `notes-web-1` and `notes-db-1`, the network `notes_default` and the volume `notes_db-data`, which keeps your notes throughout. Step 3 stops the database, so the app answers `database unavailable` until step 3 brings it back. Step 4 adds a small file, `compose.broken.yaml`, that starts `web` with a missing setting; the app is down until the end of step 4. If port 8080 is busy, `web` fails to start and nothing else is affected. Other containers, networks and volumes keep running and stay untouched. To undo, run `docker compose up -d --wait` in the `notes` folder and delete `compose.broken.yaml`.

**1. Add the checks.** Replace `compose.yaml` with this. The password and title still come from `.env`.

```yaml
name: notes

services:
  web:
    build: .
    ports:
      - "127.0.0.1:8080:8000"
    environment:
      APP_TITLE: ${APP_TITLE:-Notes}
      DATABASE_URL: postgresql://notes:${POSTGRES_PASSWORD:?set it in .env}@db:5432/notes
    depends_on:
      db:
        condition: service_healthy
    restart: on-failure:5
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/healthz', timeout=2)"]
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 10s

  db:
    image: postgres:18-alpine
    environment:
      POSTGRES_USER: notes
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?set it in .env}
      POSTGRES_DB: notes
    volumes:
      - db-data:/var/lib/postgresql
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -h 127.0.0.1 -U notes -d notes"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 10s

volumes:
  db-data:
```

`CMD` runs the command directly; `CMD-SHELL` runs it through the container's shell. `urlopen` raises an error on a failed connection or an error status such as `503`, and Python then exits with 1. `on-failure:5` gives `web` up to five restarts after a crash; `unless-stopped` keeps the database up whenever it exits by itself.

```bash rail=up-wait
docker compose up -d --wait
docker compose ps
curl http://127.0.0.1:8080/notes.txt
```

```text
 Network notes_default Creating
 Network notes_default Created
 Container notes-db-1 Creating
 Container notes-db-1 Created
 Container notes-web-1 Creating
 Container notes-web-1 Created
 Container notes-db-1 Starting
 Container notes-db-1 Started
 Container notes-db-1 Waiting
 Container notes-db-1 Healthy
 Container notes-web-1 Starting
 Container notes-web-1 Started
 Container notes-db-1 Waiting
 Container notes-web-1 Waiting
 Container notes-db-1 Healthy
 Container notes-web-1 Healthy
NAME          IMAGE                COMMAND                  SERVICE   CREATED          STATUS                    PORTS
notes-db-1    postgres:18-alpine   "docker-entrypoint.s…"   db        12 seconds ago   Up 11 seconds (healthy)   5432/tcp
notes-web-1   notes-web            "python app.py"          web       12 seconds ago   Up 5 seconds (healthy)    127.0.0.1:8080->8000/tcp
1. First note
2. Buy coffee beans
```

Read the order: `db` started, Compose waited until it was `Healthy`, and only then started `web`. `--wait` then waited for `web` to be healthy as well, so the first `curl` worked. The notes from part 8 are still there. Without `--wait`, the same run returned right after `web` started; a `curl` at that moment got `Connection reset by peer`, as in part 7, and `ps` showed `(health: starting)`.

![A timeline from left to right, from the lab's output. db: Started, then Waiting, then Healthy once pg_isready succeeds. Only then web: Starting, Started. With --wait, Compose waits again until web is Healthy as well, highlighted, and returns. The first curl after that gets the notes. Without health checks, part 7's web started as soon as db was running, and the first requests failed.](/diagrams/containers-from-zero-09-when-something-fails/start-up-order.svg)

**2. Read a health check.** `docker inspect` shows what Docker stored for each container ([inspect reference](https://docs.docker.com/reference/cli/docker/inspect/)). `--format` picks fields out of it:

```bash rail=inspect-health
docker inspect --format '{{.State.Health.Status}}' notes-db-1
docker inspect --format '{{range .State.Health.Log}}{{.ExitCode}} {{.Output}}{{end}}' notes-db-1 | tail -2
docker inspect --format '{{.HostConfig.RestartPolicy.Name}} {{.HostConfig.RestartPolicy.MaximumRetryCount}}' notes-web-1
```

```text
healthy
0 127.0.0.1:5432 - accepting connections

on-failure 5
```

The second command lists the most recent checks with their exit code and output; Docker keeps the output "to help debug failing probes", in the Dockerfile reference's words. `0` and `accepting connections` is a passing check. The third shows the restart policy Compose gave `web`.

**3. Failure one: the database stops.**

```bash rail=stop-db
docker compose stop db
curl http://127.0.0.1:8080/notes.txt
docker compose logs web | tail -2
docker compose logs db | tail -1
sleep 35
docker compose ps -a
docker inspect --format '{{.State.Health.Status}} restarts={{.RestartCount}}' notes-web-1
docker inspect --format '{{range .State.Health.Log}}{{.Output}}{{end}}' notes-web-1 | tail -2
```

```text
 Container notes-db-1 Stopping
 Container notes-db-1 Stopped
database unavailable
web-1  | database error: failed to resolve host 'db': [Errno -2] Name or service not known
web-1  | 172.18.0.1 "GET /notes.txt HTTP/1.1" 503 -
db-1  | 2026-11-25 12:57:10.080 UTC [1] LOG:  database system is shut down
NAME          IMAGE                COMMAND                  SERVICE   CREATED          STATUS                      PORTS
notes-db-1    postgres:18-alpine   "docker-entrypoint.s…"   db        47 seconds ago   Exited (0) 35 seconds ago
notes-web-1   notes-web            "python app.py"          web       47 seconds ago   Up 41 seconds (unhealthy)   127.0.0.1:8080->8000/tcp
unhealthy restarts=0
urllib.error.HTTPError: HTTP Error 503: Service Unavailable
```

Read it from both sides. `db`'s log ends with a clean shutdown and `ps -a` shows `Exited (0)`: you stopped it, so `unless-stopped` leaves it stopped. `web`'s log says why requests fail: the name `db` no longer resolves, because a stopped container leaves the network. After three failed checks, ten seconds apart, `web` is `unhealthy`, and its health log holds the `503` its check received (the last command prints the final line of Python's error). It is still `Up` with `restarts=0`: its process never exited, and restarting it would not bring the database back.

Bring the database back:

```bash rail=start-db
docker compose up -d --wait
curl http://127.0.0.1:8080/notes.txt
```

```text
 Container notes-web-1 Running
 Container notes-db-1 Starting
 Container notes-db-1 Started
 Container notes-db-1 Waiting
 Container notes-db-1 Healthy
 Container notes-db-1 Waiting
 Container notes-web-1 Waiting
 Container notes-web-1 Healthy
 Container notes-db-1 Healthy
1. First note
2. Buy coffee beans
```

`web` was never restarted. Its next check passed once the database answered, and it was `healthy` again; the app connects on each request, so it needed no restart.

**4. Failure two: a setting is missing.** Part 7's app exits with code 1 when `DATABASE_URL` is empty. Instead of editing `compose.yaml`, write a second file that overrides one value, and give Compose both files with `-f`. The [merge guide](https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/) says Compose merges files in the order you give them: "Subsequent files may merge, override, or add to their predecessors."

```bash rail=crash-loop
printf 'services:\n  web:\n    environment:\n      DATABASE_URL: ""\n' > compose.broken.yaml
cat compose.broken.yaml
docker compose -f compose.yaml -f compose.broken.yaml up -d
sleep 5
docker inspect --format '{{.State.Status}} exit={{.State.ExitCode}} restarts={{.RestartCount}}' notes-web-1
sleep 30
docker compose ps -a web
docker compose logs web
```

```text
services:
  web:
    environment:
      DATABASE_URL: ""
 Container notes-db-1 Running
 Container notes-web-1 Recreate
 Container notes-web-1 Recreated
 Container notes-db-1 Waiting
 Container notes-db-1 Healthy
 Container notes-web-1 Starting
 Container notes-web-1 Started
exited exit=1 restarts=5
NAME          IMAGE       COMMAND           SERVICE   CREATED          STATUS                      PORTS
notes-web-1   notes-web   "python app.py"   web       36 seconds ago   Exited (1) 30 seconds ago
web-1  | DATABASE_URL is not set
web-1  | DATABASE_URL is not set
web-1  | DATABASE_URL is not set
web-1  | DATABASE_URL is not set
web-1  | DATABASE_URL is not set
web-1  | DATABASE_URL is not set
```

The process exited with 1, a failure, so `on-failure:5` restarted it. It failed the same way each time: one start plus five restarts, six identical log lines, all within the first five seconds of this run. Then Docker stopped trying, and half a minute later it was still `Exited (1)`. Without the `:5`, `on-failure` keeps restarting it. A restart cannot fix a wrong setting; the log line can, once you read it. Put the setting back by starting with `compose.yaml` alone, and remove the override:

```bash rail=crash-fix
docker compose up -d --wait
rm compose.broken.yaml
docker compose ps
```

```text
 Container notes-db-1 Running
 Container notes-web-1 Recreate
 Container notes-web-1 Recreated
 Container notes-db-1 Waiting
 Container notes-db-1 Healthy
 Container notes-web-1 Starting
 Container notes-web-1 Started
 Container notes-web-1 Waiting
 Container notes-db-1 Waiting
 Container notes-db-1 Healthy
 Container notes-web-1 Healthy
NAME          IMAGE                COMMAND                  SERVICE   CREATED              STATUS                    PORTS
notes-db-1    postgres:18-alpine   "docker-entrypoint.s…"   db        About a minute ago   Up 47 seconds (healthy)   5432/tcp
notes-web-1   notes-web            "python app.py"          web       6 seconds ago        Up 5 seconds (healthy)    127.0.0.1:8080->8000/tcp
```

![A table with three rows, caused on purpose in the lab. Row 1, docker compose stop db: docker compose ps and docker inspect show db Exited (0) and web Up (unhealthy) with restarts=0; web's log says failed to resolve host 'db', db's log ends with database system is shut down; fix with docker compose up -d --wait. Row 2, web starts with an empty DATABASE_URL: ps shows web Exited (1), restarts=5; the log shows DATABASE_URL is not set six times; fix the configuration and run up -d. This row is highlighted. Row 3, in the advanced step, kill 1 inside db: PostgreSQL logs received smart shutdown request, exits with 0, and unless-stopped starts it again, restarts=1, healthy a few seconds later.](/diagrams/containers-from-zero-09-when-something-fails/three-failures.svg)

Leave the app running; part 10 starts from here and removes it.

## Optional advanced: an exit nobody asked for

The database's `unless-stopped` policy has not done anything yet, because step 3 was a manual stop. Make PostgreSQL exit by itself: send its main process, PID 1 in the container, the `SIGTERM` signal from part 3. PostgreSQL's [shutdown documentation](https://www.postgresql.org/docs/18/server-shutdown.html) calls `SIGTERM` "Smart Shutdown mode": it waits for sessions to end, then stops.

```bash rail=kill-db
docker compose exec db kill 1
sleep 3
docker compose logs db | grep 'smart shutdown'
docker inspect --format '{{.State.Status}} exit={{.State.ExitCode}} restarts={{.RestartCount}}' notes-db-1
docker compose logs db | tail -1
sleep 8
docker compose ps
```

```text
db-1  | 2026-11-25 12:58:33.099 UTC [1] LOG:  received smart shutdown request
running exit=0 restarts=1
db-1  | 2026-11-25 12:58:33.364 UTC [1] LOG:  database system is ready to accept connections
NAME          IMAGE                COMMAND                  SERVICE   CREATED              STATUS                    PORTS
notes-db-1    postgres:18-alpine   "docker-entrypoint.s…"   db        About a minute ago   Up 11 seconds (healthy)   5432/tcp
notes-web-1   notes-web            "python app.py"          web       17 seconds ago       Up 16 seconds (healthy)   127.0.0.1:8080->8000/tcp
```

PostgreSQL shut down cleanly and its process exited with code 0. Nobody ran `docker compose stop`, so `unless-stopped` started it again; `restarts=1`, and the last exit code is still 0. The database was back within a second, on the same volume. With `on-failure`, an exit with 0 would have left it stopped. `docker compose logs --timestamps` adds Docker's own time to each line if a service's log has none ([logs reference](https://docs.docker.com/reference/cli/docker/compose/logs/)).

## When it goes wrong

**`up` ends with `dependency failed to start: container notes-db-1 is unhealthy`.** In this lab's run, a database check that always fails printed that, plus `not started: condition "service_healthy" of service "db" not met` for `web`, and the command exited with 1. The database may be failing, or the check itself may be wrong. Run it by hand: `docker compose exec db pg_isready -h 127.0.0.1 -U notes -d notes`, and read the health log with the `docker inspect` command from step 2.

**The health log says `exec: "curl": executable file not found in $PATH`.** The image lacks the program the check uses; in this lab's run, a `curl` check on `python:3.14-slim` produced exactly that, with exit code `-1`. Use a program the image has.

**A service is `unhealthy` and nobody restarts it.** Expected: Docker restarts on exit, not on health. Find out what the check is failing on, and fix that.

**`Exited (1)` and the same line many times in the log.** A crash at start-up, restarted by `on-failure` until it gave up. The first line of the log is the reason. Fix the setting and run `docker compose up -d`.

**A service stopped and did not come back.** Check how it stopped. A manual `docker compose stop` is not undone by `unless-stopped`; an exit with 0 is not restarted by `on-failure`.

## Cheat sheet

| Task | Command | Note |
|---|---|---|
| Start and wait for healthy | `docker compose up -d --wait` | replaces `sleep` |
| Wait for a dependency | `depends_on: db: condition: service_healthy` | at start-up |
| Health status | `docker inspect --format '{{.State.Health.Status}}' notes-db-1` | starting, healthy, unhealthy |
| Recent checks | `docker inspect --format '{{range .State.Health.Log}}{{.ExitCode}} {{.Output}}{{end}}' notes-db-1` | exit code and output |
| Restart count | `docker inspect --format '{{.RestartCount}}' notes-web-1` | 0 if never restarted |
| Restart after a crash | `restart: on-failure:5` | non-zero exit, at most 5 |
| Restart after any exit | `restart: unless-stopped` | not after a manual stop |
| Override one value | `docker compose -f compose.yaml -f other.yaml up -d` | later files win |
| Both services' logs | `docker compose logs --timestamps` | match the times |

## Recap and what is next

- A health check runs a command inside the container and reports `healthy` or `unhealthy`; it never restarts anything.
- A restart policy acts when the main process exits: `on-failure` after errors, `unless-stopped` after any exit except a manual stop.
- `depends_on` with `service_healthy` and `up --wait` replace `sleep` at start-up.
- Read the state and both services' logs together: a missing database shows in `web`'s log, a crash loop shows as repeated lines and a restart count.

Next: Containers from Zero, part 10: clean up, and the edge of one machine, where you remove the app and everything it created, see what Docker keeps on disk, and look at what Compose does not do. The [series page](https://aitamer.news/series/containers-from-zero/) lists each part as it is published.

*Quoted passages in this lesson come from the [Docker documentation](https://docs.docker.com/) and the [PostgreSQL documentation](https://www.postgresql.org/docs/18/). Docker® is a registered trademark of Docker, Inc. PostgreSQL is a registered trademark of the PostgreSQL Community Association of Canada. "Python" is a registered trademark of the Python Software Foundation. aitamer.news is not affiliated with or endorsed by Docker, Inc., the PostgreSQL Global Development Group or the Python Software Foundation.*

```rail
id: "up-wait"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose up -d --wait"
        text: "Start the services and return once they are healthy."
      - token: "docker compose ps"
        text: "The STATUS column shows the health in brackets."
      - token: "curl http://127.0.0.1:8080/notes.txt"
        text: "The first request works."
```

```rail
id: "inspect-health"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker inspect --format '{{.State.Health.Status}}' notes-db-1"
        text: "Print only the health status."
      - token: "docker inspect --format '{{range .State.Health.Log}}{{.ExitCode}} {{.Output}}{{end}}' notes-db-1"
        text: "Print each stored check with its exit code and output."
      - token: "| tail -2"
        text: "Keep the last lines, the most recent check."
      - token: "docker inspect --format '{{.HostConfig.RestartPolicy.Name}} {{.HostConfig.RestartPolicy.MaximumRetryCount}}' notes-web-1"
        text: "Print the restart policy and its retry limit."
```

```rail
id: "stop-db"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose stop db"
        text: "Stop the database by hand. Its restart policy will not undo this."
      - token: "curl http://127.0.0.1:8080/notes.txt"
        text: "The app answers, but without its database."
      - token: "docker compose logs web | tail -2"
        text: "The last two lines of web's log give the reason."
      - token: "docker compose logs db | tail -1"
        text: "The last line of the database log."
      - token: "sleep 35"
        text: "Wait for three failed health checks, ten seconds apart."
      - token: "docker compose ps -a"
        text: "List the project's containers, including stopped ones."
      - token: "docker inspect --format '{{.State.Health.Status}} restarts={{.RestartCount}}' notes-web-1"
        text: "Health status and how many times Docker restarted web."
      - token: "docker inspect --format '{{range .State.Health.Log}}{{.Output}}{{end}}' notes-web-1"
        text: "The output of web's recent health checks."
```

```rail
id: "start-db"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose up -d --wait"
        text: "Start what is missing and wait until both are healthy."
```

```rail
id: "crash-loop"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "printf 'services:\\n  web:\\n    environment:\\n      DATABASE_URL: \"\"\\n' > compose.broken.yaml"
        text: "Write a small Compose file that empties one setting."
      - token: "docker compose -f compose.yaml -f compose.broken.yaml up -d"
        text: "Merge both files. The second one wins."
      - token: "docker inspect --format '{{.State.Status}} exit={{.State.ExitCode}} restarts={{.RestartCount}}' notes-web-1"
        text: "State, last exit code and restart count of web."
      - token: "docker compose ps -a web"
        text: "web stays exited after the last retry."
      - token: "docker compose logs web"
        text: "One line per start."
```

```rail
id: "crash-fix"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose up -d --wait"
        text: "Use compose.yaml alone again. web is recreated with its setting."
      - token: "rm compose.broken.yaml"
        text: "Delete the override file."
```

```rail
id: "kill-db"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose exec db kill 1"
        text: "Send SIGTERM to the database's main process from inside its container."
      - token: "docker compose logs db | grep 'smart shutdown'"
        text: "Find the line where PostgreSQL received it."
      - token: "docker inspect --format '{{.State.Status}} exit={{.State.ExitCode}} restarts={{.RestartCount}}' notes-db-1"
        text: "The database runs again after one restart."
```
