---
title: "Containers from Zero, part 7: a small multi-container app"
description: "Build a notes app with a Python web service and a PostgreSQL database, start both with one compose.yaml, add notes with curl and a browser, and read the data inside the database. Then watch the notes vanish after down and up, and find out why."
pubDate: "2027-01-13T22:00:00Z"
series: containers-from-zero
series_order: 7
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
  id: containers-07
wildness:
  rating: 1
  verified: "Ran the notes app on postgres:18-alpine with Compose v5.8.0 and Engine 29.10.1, 25 Nov 2026"
  claimed: "PostgreSQL initialisation details come from the official image's documentation"
verdict: "A web service and a database in one compose.yaml is a few lines; keeping the data needs one more, which part 8 adds."
sources:
  - title: "postgres official image (Docker Hub)"
    url: https://hub.docker.com/_/postgres
  - title: "python official image (Docker Hub)"
    url: https://hub.docker.com/_/python
  - title: "psycopg 3.3.9 (PyPI)"
    url: https://pypi.org/project/psycopg/3.3.9/
  - title: "Installing psycopg (psycopg documentation)"
    url: https://www.psycopg.org/psycopg3/docs/basic/install.html
  - title: "Services top-level element (Compose file reference)"
    url: https://docs.docker.com/reference/compose-file/services/
  - title: "Networking in Compose (Docker documentation)"
    url: https://docs.docker.com/compose/how-tos/networking/
  - title: "Control startup order (Docker documentation)"
    url: https://docs.docker.com/compose/how-tos/startup-order/
  - title: "docker compose down (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/compose/down/
  - title: "docker compose run (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/compose/run/
  - title: "Volumes (Docker documentation)"
    url: https://docs.docker.com/engine/storage/volumes/
  - title: "RFC 9110, HTTP Semantics, section 15.4.4: 303 See Other"
    url: https://www.rfc-editor.org/rfc/rfc9110.html#name-303-see-other
  - title: "Containers from Zero, part 6: Compose for that pair"
    url: https://aitamer.news/posts/containers-from-zero-06-compose-for-that-pair/
  - title: "Containers from Zero (series page)"
    url: https://aitamer.news/series/containers-from-zero/
  - title: "Docker documentation"
    url: https://docs.docker.com/
---

[Part 6](https://aitamer.news/posts/containers-from-zero-06-compose-for-that-pair/) ran two containers from one file, but `hello-app` only counted visits. This part builds something closer to a real application: a small notes app. A Python web service shows a list of notes and accepts new ones, and a PostgreSQL database stores them. Compose starts both, the web service finds the database by its service name, and you can add notes from `curl` or a browser. At the end you take the app down and bring it back, and the notes are gone. Finding out why sets up part 8.

## Time and setup

- **Reading:** about 14 minutes.
- **Optional lab:** about 25 minutes, most of it typing the app.
- **Optional advanced step:** about 5 minutes.

You need `curl` and, if you like, a web browser on the same machine. The lab pulls `postgres:18-alpine` and builds on `python:3.14-slim` from part 2. The series uses Docker Engine 29.10.1 and Compose v5.8.0, and writes `docker` without `sudo`. Stop the part 6 project first with `docker compose down` in the `hello` folder, because this app also uses port 8080.

## What you will build

A folder named `notes` with five files: `requirements.txt`, `app.py`, `Dockerfile`, `.dockerignore` and `compose.yaml`. `docker compose up -d --build` starts two services, `web` and `db`. `http://127.0.0.1:8080/` shows the notes with a form to add one, and `http://127.0.0.1:8080/notes.txt` lists them as plain text: `1. First note`.

## The two services

**web** is about a hundred lines of Python. It uses the standard library's HTTP server, as `hello-app` did, plus one package from outside: `psycopg`, a PostgreSQL driver. The image installs it from `requirements.txt` with a pinned version, `psycopg[binary]==3.3.9`, the newest release on [PyPI](https://pypi.org/project/psycopg/3.3.9/) when we tested, on 25 November 2026. The `[binary]` part, in the [psycopg install guide's](https://www.psycopg.org/psycopg3/docs/basic/install.html) words, installs "a self-contained package with all the libraries needed", so the slim image needs no PostgreSQL client of its own. The app reads where the database is from one environment variable, `DATABASE_URL`, and creates its table the first time it connects.

**db** is the official PostgreSQL image, unchanged. You configure it with environment variables. The [image's documentation](https://hub.docker.com/_/postgres) says `POSTGRES_PASSWORD` "is required for you to use the PostgreSQL image. It must not be empty or undefined." `POSTGRES_USER` and `POSTGRES_DB` set the user and the database to create; the documentation says that user gets "superuser power", which is fine for a lab and more than an app needs in production. They work only once, when the container finds an empty data folder: "the Docker specific variables will only have an effect if you start the container with a data directory that is empty; any pre-existing database will be left untouched on container startup." Part 8 runs into that.

The database publishes no port. `web` reaches it as `db:5432` on the project network, as part 6's proxy reached `web`, and nothing outside that network can connect to it. Only `web` publishes `127.0.0.1:8080`.

![On the Docker host, curl or a browser connects to 127.0.0.1:8080. Inside the dashed network notes_default, the service web runs python app.py with psycopg and is published on 8080. An arrow labelled db:5432, highlighted, goes to the service db, postgres:18-alpine with the user and database notes, port 5432 not published. web gets the address from DATABASE_URL, postgresql://notes:...@db:5432/notes. Below db, a dashed box: an anonymous volume at /var/lib/postgresql. Only web is published; the database answers only containers on notes_default.](/diagrams/containers-from-zero-07-a-small-multi-container-app/notes-app.svg)

## What a request does

When you add a note, the browser sends `POST /notes` with the text. `web` inserts a row and answers `303 See Other` with `Location: /`. [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-303-see-other) says 303 is "primarily used to allow the output of a POST action to redirect the user agent to a selected resource", so the browser loads the list again with a plain `GET`, and reloading the page does not add the note twice. `GET /` runs a `SELECT` and returns the page; `GET /notes.txt` returns the same list as text, which is easier to read in a terminal.

If the database cannot be reached, each request catches the error, logs it, and answers `503` with `database unavailable` instead of crashing the app. That matters right after start-up, and again in part 9.

![A sequence between curl or a browser, web and the database. 1: POST /notes with body=First note. 2: web runs INSERT INTO notes (body) in PostgreSQL, highlighted. 3: web answers 303 See Other, Location: /. 4: GET / or GET /notes.txt; web runs SELECT id, body FROM notes and answers 200 with the list, 1. First note.](/diagrams/containers-from-zero-07-a-small-multi-container-app/add-a-note.svg)

## Where the database keeps its files

PostgreSQL writes its data under `/var/lib/postgresql`. In version 18 the official image moved the data folder, `PGDATA`, to `/var/lib/postgresql/18/docker`, and its Dockerfile declares `/var/lib/postgresql` as a volume. Part 4 said what that means: a container started without a mount there gets an **anonymous volume** with a random name. This part's `compose.yaml` does not mount anything for `db`, on purpose, so you can see what happens to such a volume.

## Optional lab: the notes app

This lab is optional. Every command ran on 25 November 2026 with Docker Engine 29.10.1 and Compose v5.8.0 in `/home/ubuntu/notes`; your IDs, addresses and times will differ.

> **Safety: this lab publishes port 8080 on 127.0.0.1 and deletes what it creates.** It creates a Compose project named `notes`: the network `notes_default`, the image `notes-web`, the containers `notes-web-1` and `notes-db-1`, and anonymous volumes for the database. The cleanup step deletes those volumes and every note in them. If port 8080 is busy, `web` fails to start and nothing else is affected; the part 6 project is the usual cause. The password in `compose.yaml` is for this lab only; do not reuse it anywhere. Other containers, networks and volumes keep running and stay untouched. To undo everything, run `docker compose down -v` in the `notes` folder, then remove the leftover anonymous volume by name as in step 7. The `notes-web` image stays; part 8 builds on it and part 10 removes it.

**1. Write the app.** Make the folder and the first file:

```bash rail=mkdir-notes
mkdir ~/notes && cd ~/notes
echo 'psycopg[binary]==3.3.9' > requirements.txt
```

Save this as `app.py`:

```python
import html
import os
import signal
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs

import psycopg

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL is not set", file=sys.stderr, flush=True)
    sys.exit(1)
TITLE = os.environ.get("APP_TITLE", "Notes")
PORT = int(os.environ.get("PORT", "8000"))

SCHEMA = """
CREATE TABLE IF NOT EXISTS notes (
    id serial PRIMARY KEY,
    body text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
)
"""


def connect():
    conn = psycopg.connect(DATABASE_URL, connect_timeout=3)
    conn.execute(SCHEMA)
    return conn


def all_notes():
    with connect() as conn:
        return conn.execute("SELECT id, body FROM notes ORDER BY id").fetchall()


def add_note(body):
    with connect() as conn:
        conn.execute("INSERT INTO notes (body) VALUES (%s)", (body,))


class Handler(BaseHTTPRequestHandler):
    def reply(self, status, body, content_type="text/plain; charset=utf-8"):
        data = body.encode()
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        try:
            if self.path == "/healthz":
                with connect() as conn:
                    conn.execute("SELECT 1")
                self.reply(200, "ok\n")
            elif self.path == "/notes.txt":
                text = "".join(f"{i}. {body}\n" for i, body in all_notes())
                self.reply(200, text or "no notes yet\n")
            elif self.path == "/":
                items = "".join(f"<li>{html.escape(body)}</li>" for _, body in all_notes())
                page = (
                    f"<!doctype html><title>{html.escape(TITLE)}</title>"
                    f"<h1>{html.escape(TITLE)}</h1><ul>{items}</ul>"
                    '<form method="post" action="/notes">'
                    '<input name="body" required> <button>Add note</button></form>'
                )
                self.reply(200, page, "text/html; charset=utf-8")
            else:
                self.reply(404, "not found\n")
        except psycopg.Error as error:
            print(f"database error: {error}", flush=True)
            self.reply(503, "database unavailable\n")

    def do_POST(self):
        if self.path != "/notes":
            self.reply(404, "not found\n")
            return
        length = int(self.headers.get("Content-Length", 0))
        form = parse_qs(self.rfile.read(length).decode())
        body = form.get("body", [""])[0].strip()
        if not body:
            self.reply(400, "empty note\n")
            return
        try:
            add_note(body)
        except psycopg.Error as error:
            print(f"database error: {error}", flush=True)
            self.reply(503, "database unavailable\n")
            return
        self.send_response(303)
        self.send_header("Location", "/")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def log_message(self, fmt, *args):
        print(f"{self.address_string()} {fmt % args}", flush=True)


def stop(signum, frame):
    print("received SIGTERM, shutting down", flush=True)
    sys.exit(0)


signal.signal(signal.SIGTERM, stop)
print(f"listening on port {PORT}", flush=True)
HTTPServer(("", PORT), Handler).serve_forever()
```

The `Dockerfile` installs the requirements before copying `app.py`, so editing the app later reuses the cached `pip install` layer, as part 2 explained:

```dockerfile
FROM python:3.14-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
EXPOSE 8000
CMD ["python", "app.py"]
```

Every request opens a new database connection, and `connect()` runs `CREATE TABLE IF NOT EXISTS` each time, so the table appears with the first request and a restarted database is picked up on the next one. `/healthz` answers `ok` only when a `SELECT 1` succeeds; part 9 uses it.

`.dockerignore` keeps Python's cache files out of the build, and `.env`, which part 8 adds:

```text
__pycache__
*.pyc
.env
```

And `compose.yaml`:

```yaml
name: notes

services:
  web:
    build: .
    ports:
      - "127.0.0.1:8080:8000"
    environment:
      DATABASE_URL: postgresql://notes:notes-local-only@db:5432/notes
    depends_on:
      - db

  db:
    image: postgres:18-alpine
    environment:
      POSTGRES_USER: notes
      POSTGRES_PASSWORD: notes-local-only
      POSTGRES_DB: notes
```

`DATABASE_URL` reads as: PostgreSQL, user `notes`, password `notes-local-only`, at host `db`, port 5432, database `notes`. The host is the service name.

**2. Build and start.**

```bash rail=notes-up
docker compose up -d --build
curl http://127.0.0.1:8080/notes.txt
curl http://127.0.0.1:8080/notes.txt
```

```text
 Image notes-web Building
...
 Image notes-web Built
 Network notes_default Creating
 Network notes_default Created
 Container notes-db-1 Creating
 Container notes-db-1 Created
 Container notes-web-1 Creating
 Container notes-web-1 Created
 Container notes-db-1 Starting
 Container notes-db-1 Started
 Container notes-web-1 Starting
 Container notes-web-1 Started
curl: (56) Recv failure: Connection reset by peer
no notes yet
```

The first build runs `pip install` and takes longer; later builds reuse it. The first `curl` came before `web` was listening. In another run, the first few requests answered `database unavailable`, and `docker compose logs web` showed why: `connection to server at "172.18.0.2", port 5432 failed: Connection refused`. PostgreSQL was still setting itself up. A few seconds later, `no notes yet`: the app reached the database and created its table.

**3. Add notes.**

```bash rail=add-notes
curl -i -X POST -d 'body=First note' http://127.0.0.1:8080/notes
curl -X POST -d 'body=Buy coffee beans' http://127.0.0.1:8080/notes
curl http://127.0.0.1:8080/notes.txt
curl http://127.0.0.1:8080/
```

```text
HTTP/1.0 303 See Other
Server: BaseHTTP/0.6 Python/3.14.10
Date: Wed, 25 Nov 2026 12:41:29 GMT
Location: /
Content-Length: 0

1. First note
2. Buy coffee beans
<!doctype html><title>Notes</title><h1>Notes</h1><ul><li>First note</li><li>Buy coffee beans</li></ul><form method="post" action="/notes"><input name="body" required> <button>Add note</button></form>
```

`-i` shows the response headers: the `303` and its `Location`. The last command prints the page your browser would show. Open `http://127.0.0.1:8080/` in a browser on the same machine and add a note with the form; it appears in `/notes.txt` too.

**4. Look at both services.**

```bash rail=notes-ps
docker compose ps
docker compose logs db | tail -4
docker compose logs web
```

```text
NAME          IMAGE                COMMAND                  SERVICE   CREATED         STATUS         PORTS
notes-db-1    postgres:18-alpine   "docker-entrypoint.s…"   db        4 seconds ago   Up 3 seconds   5432/tcp
notes-web-1   notes-web            "python app.py"          web       4 seconds ago   Up 3 seconds   127.0.0.1:8080->8000/tcp
db-1  | 2026-11-25 12:41:26.958 UTC [1] LOG:  listening on IPv6 address "::", port 5432
db-1  | 2026-11-25 12:41:26.960 UTC [1] LOG:  listening on Unix socket "/run/postgresql/.s.PGSQL.5432"
db-1  | 2026-11-25 12:41:26.963 UTC [68] LOG:  database system was shut down at 2026-11-25 12:41:26 UTC
db-1  | 2026-11-25 12:41:26.965 UTC [1] LOG:  database system is ready to accept connections
web-1  | listening on port 8000
web-1  | 172.18.0.1 "GET /notes.txt HTTP/1.1" 200 -
web-1  | 172.18.0.1 "POST /notes HTTP/1.1" 303 -
web-1  | 172.18.0.1 "POST /notes HTTP/1.1" 303 -
web-1  | 172.18.0.1 "GET /notes.txt HTTP/1.1" 200 -
web-1  | 172.18.0.1 "GET / HTTP/1.1" 200 -
```

`db` shows `5432/tcp` with no host address: not published. Its last log line, `database system is ready to accept connections`, is the moment the earlier `database unavailable` answers stop. The full `db` log is longer, because the first start creates the database; scroll it with `docker compose logs db | less`.

**5. Ask the database directly.**

```bash rail=psql-exec
docker compose exec db psql -U notes -d notes -c 'SELECT id, body FROM notes;'
```

```text
 id |       body
----+------------------
  1 | First note
  2 | Buy coffee beans
(2 rows)
```

`psql` is PostgreSQL's command-line client, and it is already in the `db` image. `exec` runs it inside the database container, where it connects through a local socket.

**6. Take it down and bring it back.**

```bash rail=notes-down-up
docker volume ls
docker compose down
docker compose up -d
curl http://127.0.0.1:8080/notes.txt
docker volume ls
```

```text
DRIVER    VOLUME NAME
local     0b0882cc7eefbe69593e9162c7cbb2bf9c5a9165069d94085daa5e11183b544d
 Container notes-web-1 Stopping
 Container notes-web-1 Stopped
 Container notes-web-1 Removing
 Container notes-web-1 Removed
 Container notes-db-1 Stopping
 Container notes-db-1 Stopped
 Container notes-db-1 Removing
 Container notes-db-1 Removed
 Network notes_default Removing
 Network notes_default Removed
 Network notes_default Creating
 Network notes_default Created
 Container notes-db-1 Creating
 Container notes-db-1 Created
 Container notes-web-1 Creating
 Container notes-web-1 Created
 Container notes-db-1 Starting
 Container notes-db-1 Started
 Container notes-web-1 Starting
 Container notes-web-1 Started
no notes yet
DRIVER    VOLUME NAME
local     0b0882cc7eefbe69593e9162c7cbb2bf9c5a9165069d94085daa5e11183b544d
local     e75b303efcf55d64d8ff48bdb2c0949da43fac0994310397c4fc8eb60faabada
```

The notes are gone. Before `down`, one volume with a long random name held the database: the anonymous volume for `/var/lib/postgresql`. `down` removed the container and left the volume. The new `db` container got a new anonymous volume, found an empty data folder, and created a fresh database. The [down reference](https://docs.docker.com/reference/cli/docker/compose/down/) describes exactly this: anonymous volumes stay after `down` by default, and "as they don't have a stable name, they are not automatically mounted by a subsequent up." Your notes still sit in the first volume, with nothing using them.

![Three moments. After the first up, notes-db-1 keeps two notes in volume 0b0882cc.... After down, the container is removed and the volume, highlighted, still holds the two notes, orphaned. After the next up, a new notes-db-1 has a new volume e75b303e... that is empty: no notes yet. Part 8 gives the database a named volume; step 7 removes the orphan by name.](/diagrams/containers-from-zero-07-a-small-multi-container-app/anonymous-volume-left-behind.svg)

**7. Clean up.** This deletes both volumes and the notes in them. Do the advanced step first if you want to try it.

```bash rail=notes-clean
docker compose down -v
docker volume ls
docker volume rm 0b0882cc7eefbe69593e9162c7cbb2bf9c5a9165069d94085daa5e11183b544d
```

```text
 Container notes-web-1 Stopping
 Container notes-web-1 Stopped
 Container notes-web-1 Removing
 Container notes-web-1 Removed
 Container notes-db-1 Stopping
 Container notes-db-1 Stopped
 Container notes-db-1 Removing
 Container notes-db-1 Removed
 Network notes_default Removing
 Network notes_default Removed
DRIVER    VOLUME NAME
local     0b0882cc7eefbe69593e9162c7cbb2bf9c5a9165069d94085daa5e11183b544d
0b0882cc7eefbe69593e9162c7cbb2bf9c5a9165069d94085daa5e11183b544d
```

`down -v` removed the anonymous volume attached to the current `db` container. The orphan from the first run was attached to nothing, so it stayed; remove it by the name your `docker volume ls` shows, not the one above. Keep the `notes` folder and its files for part 8.

## Optional advanced: connect over the network

`exec` used a socket inside the database container. A real client, like `web`, connects over the network. `docker compose run` starts a one-off container for a service, on the project network, so it can play that client. Run this before the cleanup, while the app is up:

```bash rail=psql-run
docker compose run --rm -e PGPASSWORD=notes-local-only db psql -h db -U notes -d notes -c 'SELECT count(*) FROM notes;'
```

```text
 Container notes-db-run-be6689a01771 Creating
 Container notes-db-run-be6689a01771 Created
 count
-------
     0
(1 row)
```

A second container from the `db` service image ran `psql`, connected to the host `db` on port 5432 with the password, and counted the notes in the new, empty database. The [run reference](https://docs.docker.com/reference/cli/docker/compose/run/) notes that `run` "does not create any of the ports specified in the service configuration", which keeps a one-off container from clashing with the running service. `--rm` removes it afterwards. The same command against `localhost` from your own machine would find nothing listening, because port 5432 is not published.

## When it goes wrong

**`database unavailable`, or `503`, right after `up`.** PostgreSQL is still starting. Wait a few seconds; `docker compose logs db` shows `database system is ready to accept connections` when it is ready. Part 9 makes Compose wait for it.

**`web` exits at once with `DATABASE_URL is not set`.** The variable is missing or misspelled in `compose.yaml`. `docker compose config` shows what `web` receives.

**`password authentication failed for user "notes"`.** The password in `DATABASE_URL` does not match `POSTGRES_PASSWORD`, or the database was created earlier with another password, which changing the variable does not update. Part 8 covers that case.

**`failed to resolve host 'db'`.** The host name in `DATABASE_URL` does not match the service name, or `web` is not on the same project network.

**`ModuleNotFoundError: No module named 'psycopg'`.** The image was built before `requirements.txt` was right. Run `docker compose up -d --build`.

**The notes are gone after `down` and `up`.** Expected in this part. Part 8 fixes it.

## Cheat sheet

| Task | Command | Note |
|---|---|---|
| Build and start | `docker compose up -d --build` | first build runs `pip install` |
| List notes | `curl http://127.0.0.1:8080/notes.txt` | `no notes yet` when empty |
| Add a note | `curl -X POST -d 'body=First note' http://127.0.0.1:8080/notes` | answers `303 See Other` |
| One service's logs | `docker compose logs db` | wait for `ready to accept connections` |
| SQL inside the database | `docker compose exec db psql -U notes -d notes -c 'SELECT id, body FROM notes;'` | local socket |
| A one-off client | `docker compose run --rm -e PGPASSWORD=... db psql -h db -U notes -d notes` | over the network, no ports |
| List volumes | `docker volume ls` | anonymous ones have long random names |
| Remove an orphan | `docker volume rm <name>` | permanent |

## Recap and what is next

- `web` finds the database at `db:5432` from `DATABASE_URL`; the database publishes no port.
- The PostgreSQL image is configured with `POSTGRES_*` variables, which take effect only on an empty data folder.
- `depends_on` starts `db` first, but the app must cope with a database that is not ready yet.
- Without a mount, the database writes to an anonymous volume, which `down` leaves behind and the next `up` does not reuse.

Next: Containers from Zero, part 8: configuration and the database file, where the password moves to a `.env` file and the database gets a named volume, so notes survive `down` and `up`. The [series page](https://aitamer.news/series/containers-from-zero/) lists each part as it is published.

*Quoted passages in this lesson come from the [Docker documentation](https://docs.docker.com/), the [postgres image documentation](https://hub.docker.com/_/postgres) and [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html). Docker® is a registered trademark of Docker, Inc. PostgreSQL is a registered trademark of the PostgreSQL Community Association of Canada. "Python" is a registered trademark of the Python Software Foundation. aitamer.news is not affiliated with or endorsed by Docker, Inc., the PostgreSQL Global Development Group or the Python Software Foundation.*

```rail
id: "mkdir-notes"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "mkdir ~/notes && cd ~/notes"
        text: "Make a folder named notes in your home folder and move into it."
      - token: "echo 'psycopg[binary]==3.3.9' > requirements.txt"
        text: "Write the one dependency, pinned to an exact version, into requirements.txt."
```

```rail
id: "notes-up"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose up -d --build"
        text: "Build the web image, then create and start both services in the background."
      - token: "curl http://127.0.0.1:8080/notes.txt"
        text: "Ask for the notes as plain text. The first request may come too early."
```

```rail
id: "add-notes"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "curl -i"
        text: "Include the response headers in the output."
      - token: "-X POST"
        text: "Send a POST request instead of GET."
      - token: "-d 'body=First note'"
        text: "Send form data with one field, body. curl sends it exactly as typed, and the app's form parser reads the space."
      - token: "http://127.0.0.1:8080/notes"
        text: "The address that adds a note."
      - token: "curl http://127.0.0.1:8080/"
        text: "The HTML page a browser would show."
```

```rail
id: "notes-ps"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose ps"
        text: "List the project's containers with their ports."
      - token: "docker compose logs db | tail -4"
        text: "The last four lines of the database log."
      - token: "docker compose logs web"
        text: "Every request web has served."
```

```rail
id: "psql-exec"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose exec db"
        text: "Run a command inside the running db container."
      - token: "psql -U notes -d notes"
        text: "Start PostgreSQL's client as user notes, on the database notes."
      - token: "-c 'SELECT id, body FROM notes;'"
        text: "Run one SQL statement and exit."
```

```rail
id: "notes-down-up"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker volume ls"
        text: "List volumes. The database's anonymous volume has a long random name."
      - token: "docker compose down"
        text: "Remove the containers and the network. The anonymous volume stays."
      - token: "docker compose up -d"
        text: "Create new containers. db gets a new, empty anonymous volume."
      - token: "curl http://127.0.0.1:8080/notes.txt"
        text: "The notes are gone."
```

```rail
id: "notes-clean"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose down -v"
        text: "Remove containers, the network and the anonymous volumes attached to them."
      - token: "docker volume ls"
        text: "The orphan from the first run is still there."
      - token: "docker volume rm"
        text: "Delete the orphaned volume by name. Use the name your own list shows."
```

```rail
id: "psql-run"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose run --rm"
        text: "Start a one-off container for a service, and remove it when it exits."
      - token: "-e PGPASSWORD=notes-local-only"
        text: "Give psql the password through an environment variable."
      - token: "db"
        text: "Use the db service's image and network."
      - token: "psql -h db -U notes -d notes"
        text: "Connect over the network to the host db."
      - token: "-c 'SELECT count(*) FROM notes;'"
        text: "Count the notes and exit."
```
