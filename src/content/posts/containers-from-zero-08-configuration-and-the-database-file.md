---
title: "Containers from Zero, part 8: configuration and the database file"
description: "Move the notes app's settings into a .env file, give PostgreSQL a named volume so notes survive down and up, change configuration without rebuilding, and make a backup that you restore into an empty database to prove it works."
pubDate: "2027-01-20T22:00:00Z"
series: containers-from-zero
series_order: 8
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
  id: containers-08
wildness:
  rating: 1
  verified: "Ran the .env, volume and backup steps with Compose v5.8.0 and Engine 29.10.1, 25 Nov 2026"
  claimed: "Secret handling beyond .env is described from the Docker documentation, not run here"
verdict: "A named volume keeps the notes; a backup counts once you have restored it into an empty database."
sources:
  - title: "Set environment variables within your container's environment (Docker documentation)"
    url: https://docs.docker.com/compose/how-tos/environment-variables/set-environment-variables/
  - title: "Set, use, and manage variables in a Compose file with interpolation (Docker documentation)"
    url: https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/
  - title: "Environment variables precedence in Docker Compose (Docker documentation)"
    url: https://docs.docker.com/compose/how-tos/environment-variables/envvars-precedence/
  - title: "Manage secrets securely in Docker Compose (Docker documentation)"
    url: https://docs.docker.com/compose/how-tos/use-secrets/
  - title: "docker compose config (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/compose/config/
  - title: "docker compose up (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/compose/up/
  - title: "docker compose exec (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/compose/exec/
  - title: "docker compose down (Docker CLI reference)"
    url: https://docs.docker.com/reference/cli/docker/compose/down/
  - title: "Volumes top-level element (Compose file reference)"
    url: https://docs.docker.com/reference/compose-file/volumes/
  - title: "postgres official image (Docker Hub)"
    url: https://hub.docker.com/_/postgres
  - title: "SQL Dump (PostgreSQL 18 documentation)"
    url: https://www.postgresql.org/docs/18/backup-dump.html
  - title: "pg_isready (PostgreSQL 18 documentation)"
    url: https://www.postgresql.org/docs/18/app-pg-isready.html
  - title: "ALTER ROLE (PostgreSQL 18 documentation)"
    url: https://www.postgresql.org/docs/18/sql-alterrole.html
  - title: "Containers from Zero, part 7: a small multi-container app"
    url: https://aitamer.news/posts/containers-from-zero-07-a-small-multi-container-app/
  - title: "Containers from Zero, part 4: files that outlive the container"
    url: https://aitamer.news/posts/containers-from-zero-04-files-that-outlive-the-container/
  - title: "Containers from Zero (series page)"
    url: https://aitamer.news/series/containers-from-zero/
  - title: "Docker documentation"
    url: https://docs.docker.com/
---

[Part 7](https://aitamer.news/posts/containers-from-zero-07-a-small-multi-container-app/) left two problems in the notes app. The password sat in `compose.yaml` twice, and the notes vanished after `down` and `up` because the database wrote to an anonymous volume. This part moves the settings into a `.env` file next to `compose.yaml`, gives the database a named volume, and shows that you can change a setting without rebuilding the image. Then it makes a backup and restores it into an empty database, because until you have restored a backup, you do not know that it works.

## Time and setup

- **Reading:** about 12 minutes.
- **Optional lab:** about 20 minutes.
- **Optional advanced step:** about 5 minutes.

You need the `notes` folder from part 7, with `app.py`, `requirements.txt`, `Dockerfile` and `.dockerignore`, and `curl`. The series uses Docker Engine 29.10.1 and Compose v5.8.0, and writes `docker` without `sudo`. If part 7's project is still up, run `docker compose down -v` in the `notes` folder first.

## What you will build

The same two services, `web` and `db`, from a new `compose.yaml` that reads two values from a `.env` file: the page title and the database password. The database keeps its files in a volume named `notes_db-data`, so `down` and `up` keep the notes. At the end you have a file, `backup.sql`, that you know restores, because you restored it.

## Values from a file: interpolation

Compose can fill in parts of `compose.yaml` from variables before it does anything else. The [interpolation guide](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/) lists the forms. Two of them matter here:

- `${APP_TITLE:-Notes}` is the "value of VAR if set and non-empty, otherwise default". If you set nothing, the title is `Notes`.
- `${POSTGRES_PASSWORD:?set it in .env}` is the "value of VAR if set and non-empty, otherwise exit with error". There is no sensible default for a password, so Compose stops and prints the message after `?`.

Where the values come from: "The .env file should be placed at the root of the project directory next to your compose.yaml file." The same guide gives the order when a variable is set in more than one place: your shell's environment first, then a file named with `--env-file`, and only if `--env-file` is not set, the `.env` file. `docker compose config` prints the file with every value filled in, and `docker compose config --environment` prints the variables it used.

Interpolation happens on your machine, when Compose reads the file. The container gets only the result, through the `environment:` entries, as ordinary environment variables. The image does not change, so a new title needs no build.

![Three stages from left to right. The .env file next to compose.yaml holds APP_TITLE=Kitchen notes and POSTGRES_PASSWORD=local-dev-only-7c2f. compose.yaml refers to them as ${APP_TITLE:-Notes}, which falls back to Notes when the variable is unset or empty, and ${POSTGRES_PASSWORD:?set it in .env}, which stops Compose with that message when it is missing. Compose replaces them when it reads the file; docker compose config shows the result, highlighted: APP_TITLE: Kitchen notes and DATABASE_URL with the password filled in. The containers receive those values as ordinary environment variables. A variable set in your shell wins over .env, and --env-file replaces .env.](/diagrams/containers-from-zero-08-configuration-and-the-database-file/where-a-value-comes-from.svg)

## What `.env` is for, and what it is not

A `.env` file keeps local settings out of `compose.yaml`, so the Compose file can be shared and each person keeps their own values. It is plain text on your disk. Docker's [environment variables guide](https://docs.docker.com/compose/how-tos/environment-variables/set-environment-variables/) is direct about passwords: "Don't use environment variables to pass sensitive information, such as passwords, in to your containers. Use secrets instead." The [secrets guide](https://docs.docker.com/compose/how-tos/use-secrets/) gives the reason: environment variables "can also be printed in logs when debugging errors without your knowledge." You will see that in step 1, where `docker compose config` prints the password.

This series keeps a local lab password in `.env` because the database is reachable only from the project network and the password protects nothing else. For anything shared or real, Compose secrets mount a file at `/run/secrets/<secret_name>` inside the container, and the [postgres image](https://hub.docker.com/_/postgres) can read its password from such a file through `POSTGRES_PASSWORD_FILE`. Part 7's `.dockerignore` already lists `.env`, so the file never enters an image. If the folder is a Git repository, add `.env` to `.gitignore` too.

## A named volume for the database

Part 4 showed the difference: an anonymous volume gets a random name and nothing finds it again, while a named volume keeps its name. The [postgres image documentation](https://hub.docker.com/_/postgres) says that from PostgreSQL 18 the data folder, `PGDATA`, is `/var/lib/postgresql/18/docker`, and the image declares its volume at `/var/lib/postgresql`. Mounting a named volume at `/var/lib/postgresql` replaces the anonymous one. The image documentation warns that PostgreSQL 17 and older use `/var/lib/postgresql/data` instead, so check the path when you use a different major version.

Compose names the volume after the project: `db-data` in project `notes` becomes `notes_db-data`. `docker compose down` leaves named volumes alone; only `down -v` removes them, as the [down reference](https://docs.docker.com/reference/cli/docker/compose/down/) describes.

One more rule from part 7 now matters. The `POSTGRES_*` variables take effect only when the data folder is empty. With a named volume, the folder is empty once, on the first start. After that, changing `POSTGRES_PASSWORD` in `.env` does not change the password inside the database.

## Optional lab: settings in .env, data in a volume

This lab is optional. Every command ran on 25 November 2026 with Docker Engine 29.10.1 and Compose v5.8.0 in `/home/ubuntu/notes`; your IDs, times and addresses will differ.

> **Safety: this lab publishes port 8080 on 127.0.0.1 and step 6 deletes the database on purpose.** It uses the Compose project `notes` from part 7: the network `notes_default`, the image `notes-web`, the containers `notes-web-1` and `notes-db-1`, and a new volume `notes_db-data`. Step 6 runs `docker compose down -v`, which deletes `notes_db-data` and every note in it; it runs only after step 5 has written `backup.sql`, and it restores from that file. If port 8080 is busy, `web` fails to start and nothing else is affected. The password in `.env` is for this lab only; do not reuse it anywhere. Other containers, networks and volumes keep running and stay untouched. To undo everything, run `docker compose down -v` in the `notes` folder and delete `.env` and `backup.sql`.

**1. Move the settings out.** Replace `compose.yaml` in the `notes` folder with this:

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
      - db

  db:
    image: postgres:18-alpine
    environment:
      POSTGRES_USER: notes
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?set it in .env}
      POSTGRES_DB: notes
    volumes:
      - db-data:/var/lib/postgresql

volumes:
  db-data:
```

Check it before the `.env` file exists:

```bash rail=config-no-env
docker compose config
```

```text
error while interpolating services.db.environment.POSTGRES_PASSWORD: required variable POSTGRES_PASSWORD is missing a value: set it in .env
error while interpolating services.web.environment.DATABASE_URL: required variable POSTGRES_PASSWORD is missing a value: set it in .env
```

That is the `:?` form at work: both places that use the password stop with your message. Now create `.env` and look again:

```bash rail=write-env
printf 'APP_TITLE=Kitchen notes\nPOSTGRES_PASSWORD=local-dev-only-7c2f\n' > .env
cat .env
docker compose config --environment | grep -E '^(APP_TITLE|POSTGRES_PASSWORD)='
docker compose config | grep -A3 'environment:'
```

```text
APP_TITLE=Kitchen notes
POSTGRES_PASSWORD=local-dev-only-7c2f
APP_TITLE=Kitchen notes
POSTGRES_PASSWORD=local-dev-only-7c2f
    environment:
      POSTGRES_DB: notes
      POSTGRES_PASSWORD: local-dev-only-7c2f
      POSTGRES_USER: notes
--
    environment:
      APP_TITLE: Kitchen notes
      DATABASE_URL: postgresql://notes:local-dev-only-7c2f@db:5432/notes
```

`config --environment` lists every variable Compose could use, including your shell's, so the `grep` keeps the two that matter. `config` prints the filled-in file, password included: the exposure the secrets guide warns about.

**2. Start it and add notes.**

```bash rail=env-up
docker compose up -d
sleep 4
curl -X POST -d 'body=First note' http://127.0.0.1:8080/notes
curl -X POST -d 'body=Buy coffee beans' http://127.0.0.1:8080/notes
curl http://127.0.0.1:8080/notes.txt
curl -s http://127.0.0.1:8080/ | grep -o '<h1>[^<]*</h1>'
```

```text
 Network notes_default Creating
 Volume notes_db-data Creating
 Volume notes_db-data Created
 Network notes_default Created
 Container notes-db-1 Creating
 Container notes-db-1 Created
 Container notes-web-1 Creating
 Container notes-web-1 Created
 Container notes-db-1 Starting
 Container notes-db-1 Started
 Container notes-web-1 Starting
 Container notes-web-1 Started
1. First note
2. Buy coffee beans
<h1>Kitchen notes</h1>
```

`Volume notes_db-data Created` is new. The `sleep` gives PostgreSQL time to set up the empty volume; part 9 replaces it with a proper wait. The image `notes-web` from part 7 is reused, because `app.py` did not change.

**3. Change a setting without a build.** Edit `.env` so the title reads `Shared notes`, then apply it:

```bash rail=change-title
sed -i 's/APP_TITLE=Kitchen notes/APP_TITLE=Shared notes/' .env
docker compose up -d
curl -s http://127.0.0.1:8080/ | grep -o '<h1>[^<]*</h1>'
curl http://127.0.0.1:8080/notes.txt
```

```text
 Container notes-db-1 Running
 Container notes-web-1 Recreate
 Container notes-web-1 Recreated
 Container notes-web-1 Starting
 Container notes-web-1 Started
<h1>Shared notes</h1>
1. First note
2. Buy coffee beans
```

`up` compared the file with what was running. `web`'s environment changed, so it recreated that container from the same image; `db` had no change and kept running. The [up reference](https://docs.docker.com/reference/cli/docker/compose/up/) describes this: when a service's configuration changed, `up` "picks up the changes by stopping and recreating the containers (preserving mounted volumes)." You can also edit `.env` in a text editor; `sed` is there so the command can be copied.

![After editing .env from Kitchen notes to Shared notes, docker compose up -d compares the new model with what runs. web's environment changed, so Compose recreates notes-web-1 from the same image notes-web; this is highlighted. db did not change, so notes-db-1 keeps running. The named volume notes_db-data is untouched, so the two notes are still there, and the page heading now says Shared notes.](/diagrams/containers-from-zero-08-configuration-and-the-database-file/change-config.svg)

**4. Take it down and bring it back.** This is where part 7 lost its notes.

```bash rail=volume-survives
docker compose down
docker volume ls --filter name=notes
docker compose up -d
sleep 3
curl http://127.0.0.1:8080/notes.txt
docker compose exec db ls /var/lib/postgresql
docker compose exec db sh -c 'echo $PGDATA'
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
local     notes_db-data
 Network notes_default Creating
 Network notes_default Created
 Container notes-db-1 Creating
 Container notes-db-1 Created
 Container notes-db-1 Starting
 Container notes-db-1 Started
 Container notes-web-1 Starting
 Container notes-web-1 Started
1. First note
2. Buy coffee beans
18
/var/lib/postgresql/18/docker
```

`down` removed both containers and the network and left `notes_db-data`. The new `db` container mounted the same volume, found a database in it, and the notes were there. Inside the volume is a folder per major version, `18`, and the data folder below it, as the image documentation says.

**5. Make a backup.** `pg_dump` writes a database out as SQL statements that recreate it. The [PostgreSQL documentation](https://www.postgresql.org/docs/18/backup-dump.html) shows the basic form, `pg_dump dbname > dumpfile`, and says such dumps are "internally consistent, meaning, the dump represents a snapshot of the database at the time pg_dump began running."

```bash rail=pg-dump
docker compose exec db pg_dump -U notes notes > backup.sql
wc -l backup.sql
grep -A3 '^COPY' backup.sql
```

```text
98 backup.sql
COPY public.notes (id, body, created_at) FROM stdin;
1	First note	2026-11-25 12:46:05.48205+00
2	Buy coffee beans	2026-11-25 12:46:05.499968+00
\.
```

`pg_dump` runs inside the container and writes to its output; the `>` is your shell, so `backup.sql` lands in the `notes` folder on your machine, outside the volume. No password was needed: the image documentation explains that it "sets up trust authentication locally", for connections from inside the same container. The `COPY` block holds the two notes.

**6. Prove the backup.** Delete the database, restore it into an empty one, and check. This step deletes the volume; make sure step 5 printed your notes first.

```bash rail=restore-drill
docker compose down -v
docker compose up -d db
until docker compose exec db pg_isready -h 127.0.0.1 -U notes -d notes; do sleep 1; done
docker compose exec -T db psql -q -U notes -d notes < backup.sql
docker compose up -d
sleep 2
curl http://127.0.0.1:8080/notes.txt
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
 Volume notes_db-data Removing
 Volume notes_db-data Removed
 Network notes_default Removed
 Network notes_default Creating
 Volume notes_db-data Creating
 Volume notes_db-data Created
 Network notes_default Created
 Container notes-db-1 Creating
 Container notes-db-1 Created
 Container notes-db-1 Starting
 Container notes-db-1 Started
127.0.0.1:5432 - no response
127.0.0.1:5432 - accepting connections
 set_config
------------

(1 row)

 setval
--------
      2
(1 row)

1. First note
2. Buy coffee beans
```

What each line did:

- `down -v` removed the volume, and with it the notes.
- `up -d db` started only the database, on a new, empty `notes_db-data`. The image created the user and the database `notes` again from `.env`. That matters, because the PostgreSQL documentation notes that restoring with `psql` does not create the database; it must exist first.
- [`pg_isready`](https://www.postgresql.org/docs/18/app-pg-isready.html) reports whether the server accepts connections and exits with 0 when it does, so `until` repeats it until then. `-h 127.0.0.1` makes it ask over TCP, the way a client in another container connects.
- `exec -T` turns off the terminal that `exec` normally allocates ([exec reference](https://docs.docker.com/reference/cli/docker/compose/exec/)), so your shell can feed `backup.sql` to `psql`. `-q` keeps `psql` quiet; the two small tables are results of statements inside the dump that set up the session and the id counter.
- `up -d` started `web`, and the list came back from the restored data.

![Five steps. 1, docker compose exec db pg_dump -U notes notes writes backup.sql on your machine, 98 lines with the two notes. 2, docker compose down -v deletes the volume notes_db-data and the notes in it; this destructive step is highlighted. 3, docker compose up -d db creates a new empty volume, and PostgreSQL initialises a fresh database. 4, pg_isready -h 127.0.0.1 repeats until it says accepting connections, then psql reads backup.sql into the new database. 5, docker compose up -d starts web, and /notes.txt lists 1. First note and 2. Buy coffee beans again.](/diagrams/containers-from-zero-08-configuration-and-the-database-file/backup-and-restore.svg)

Leave the project running or stop it with `docker compose down`; the notes stay in `notes_db-data`, and part 9 starts from here. Keep `.env` and `backup.sql`.

## Optional advanced: which value wins

The interpolation guide puts your shell's variables above `.env`. Try it with the title:

```bash rail=shell-wins
APP_TITLE="From the shell" docker compose up -d
curl -s http://127.0.0.1:8080/ | grep -o '<h1>[^<]*</h1>'
docker compose up -d
curl -s http://127.0.0.1:8080/ | grep -o '<h1>[^<]*</h1>'
```

```text
 Container notes-db-1 Running
 Container notes-web-1 Recreate
 Container notes-web-1 Recreated
 Container notes-web-1 Starting
 Container notes-web-1 Started
<h1>From the shell</h1>
 Container notes-db-1 Running
 Container notes-web-1 Recreate
 Container notes-web-1 Recreated
 Container notes-web-1 Starting
 Container notes-web-1 Started
<h1>Shared notes</h1>
```

The variable set in front of the command applied to that one run and won over `.env`. The next `up`, without it, went back to the `.env` value and recreated `web` again. A variable you `export` in your shell and forget about does the same thing to every later run, which is a common reason for "my `.env` change does nothing". `docker compose config` shows the value Compose will use.

## When it goes wrong

**`required variable POSTGRES_PASSWORD is missing a value: set it in .env`.** Compose did not find `.env`. It must sit next to `compose.yaml`, be named exactly `.env`, and you must run `docker compose` from that folder (or name the project folder with `--project-directory`).

**`password authentication failed for user "notes"` after changing `POSTGRES_PASSWORD`.** The `db` log shows why: `PostgreSQL Database directory appears to contain a database; Skipping initialization`. The volume keeps the password the database was created with, while `web` now sends the new one. Either put the old value back in `.env`, or change it inside the database to match, then run `docker compose up -d`:

```bash rail=alter-password
docker compose exec db psql -U notes -d notes -c "ALTER USER notes PASSWORD 'new-password';"
```

In this lab's run, that command answered `ALTER ROLE` and `web` connected again. [`ALTER USER`](https://www.postgresql.org/docs/18/sql-alterrole.html) is another name for `ALTER ROLE`. Deleting the volume with `down -v` also "fixes" it, by deleting every note.

**The notes are gone after `down` and `up`.** Check `docker volume ls` for `notes_db-data` and that `db` mounts it at `/var/lib/postgresql`. A path such as `/var/lib/postgresql/data` on PostgreSQL 18 leaves the real data folder in an anonymous volume, as in part 7.

**The restore prints `ERROR:  relation "notes" already exists`.** You restored into a database that was not empty, for example after `down` without `-v`. In this lab's run the following lines included `duplicate key value violates unique constraint "notes_pkey"`, and the list still showed the two notes once: nothing was restored. Restore into a fresh volume, as in step 6.

**A title change shows the old title.** A shell variable with the same name wins over `.env`. Run `echo $APP_TITLE`; if it prints something, `unset APP_TITLE`.

## Cheat sheet

| Task | Command | Note |
|---|---|---|
| Default value | `${APP_TITLE:-Notes}` | used if unset or empty |
| Required value | `${POSTGRES_PASSWORD:?set it in .env}` | stops with the message |
| See filled-in values | `docker compose config` | prints secrets too |
| See variables used | `docker compose config --environment` | includes your shell's |
| Apply a setting | `docker compose up -d` | recreates only what changed |
| Named database volume | `db-data:/var/lib/postgresql` | path for PostgreSQL 18 |
| Back up | `docker compose exec db pg_dump -U notes notes > backup.sql` | file lands on your machine |
| Wait for the database | `until docker compose exec db pg_isready -h 127.0.0.1 -U notes -d notes; do sleep 1; done` | exit 0 when ready |
| Restore | `docker compose exec -T db psql -q -U notes -d notes < backup.sql` | into an empty database |

## Recap and what is next

- `${VAR:-default}` and `${VAR:?message}` fill `compose.yaml` from `.env`, your shell or `--env-file`; the shell wins.
- Changing a value and running `up -d` recreates only the affected container from the same image.
- A named volume at `/var/lib/postgresql` keeps the database across `down` and `up`; `down -v` deletes it.
- `POSTGRES_*` variables only set up an empty database; later changes need SQL.
- A backup is proven once it has been restored into an empty database.

Next: Containers from Zero, part 9: when something fails, where Compose checks that each service is healthy, waits for the database instead of sleeping, and restarts a service that crashes. The [series page](https://aitamer.news/series/containers-from-zero/) lists each part as it is published.

*Quoted passages in this lesson come from the [Docker documentation](https://docs.docker.com/), the [postgres image documentation](https://hub.docker.com/_/postgres) and the [PostgreSQL documentation](https://www.postgresql.org/docs/18/). Docker® is a registered trademark of Docker, Inc. PostgreSQL is a registered trademark of the PostgreSQL Community Association of Canada. aitamer.news is not affiliated with or endorsed by Docker, Inc. or the PostgreSQL Global Development Group.*

```rail
id: "config-no-env"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose config"
        text: "Read compose.yaml, fill in every variable and print the result. Without .env, the password is missing."
```

```rail
id: "write-env"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "printf 'APP_TITLE=Kitchen notes\\nPOSTGRES_PASSWORD=local-dev-only-7c2f\\n' > .env"
        text: "Write two lines into a new file named .env."
      - token: "cat .env"
        text: "Print the file."
      - token: "docker compose config --environment"
        text: "Print the variables Compose uses for interpolation."
      - token: "grep -E '^(APP_TITLE|POSTGRES_PASSWORD)='"
        text: "Keep only the two lines that start with these names."
      - token: "docker compose config | grep -A3 'environment:'"
        text: "Show each environment block with three lines after it."
```

```rail
id: "env-up"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose up -d"
        text: "Create the network, the named volume and both containers."
      - token: "sleep 4"
        text: "Wait while PostgreSQL sets up the empty volume."
      - token: "curl -X POST -d 'body=First note' http://127.0.0.1:8080/notes"
        text: "Add a note."
      - token: "curl http://127.0.0.1:8080/notes.txt"
        text: "List the notes."
      - token: "curl -s http://127.0.0.1:8080/ | grep -o '<h1>[^<]*</h1>'"
        text: "Print only the page heading."
```

```rail
id: "change-title"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "sed -i 's/APP_TITLE=Kitchen notes/APP_TITLE=Shared notes/' .env"
        text: "Change the title in .env in place."
      - token: "docker compose up -d"
        text: "Apply the change. Only web is recreated."
      - token: "curl -s http://127.0.0.1:8080/ | grep -o '<h1>[^<]*</h1>'"
        text: "The heading shows the new title."
```

```rail
id: "volume-survives"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose down"
        text: "Remove containers and the network. Named volumes stay."
      - token: "docker volume ls --filter name=notes"
        text: "List volumes whose name contains notes."
      - token: "docker compose up -d"
        text: "New containers, same volume."
      - token: "docker compose exec db ls /var/lib/postgresql"
        text: "List the top of the volume inside db."
      - token: "docker compose exec db sh -c 'echo $PGDATA'"
        text: "Print the data folder. Single quotes keep your shell from expanding it."
```

```rail
id: "pg-dump"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose exec db pg_dump -U notes notes"
        text: "Dump the database notes as user notes, inside db."
      - token: "> backup.sql"
        text: "Your shell saves the output to a file on your machine."
      - token: "wc -l backup.sql"
        text: "Count the lines in the file."
      - token: "grep -A3 '^COPY' backup.sql"
        text: "Show the line that starts the table data and three after it."
```

```rail
id: "restore-drill"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose down -v"
        text: "Remove containers, the network and the volume. The notes are deleted."
      - token: "docker compose up -d db"
        text: "Start only the database, on a new empty volume."
      - token: "until docker compose exec db pg_isready -h 127.0.0.1 -U notes -d notes; do sleep 1; done"
        text: "Repeat the readiness check every second until it succeeds."
      - token: "docker compose exec -T db psql -q -U notes -d notes < backup.sql"
        text: "Feed the backup to psql without a terminal."
      - token: "docker compose up -d"
        text: "Start web as well."
      - token: "curl http://127.0.0.1:8080/notes.txt"
        text: "The notes are back."
```

```rail
id: "shell-wins"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "APP_TITLE=\"From the shell\" docker compose up -d"
        text: "Set the variable for this one command. It wins over .env."
      - token: "docker compose up -d"
        text: "Without it, the value from .env applies again."
```

```rail
id: "alter-password"
items:
  - kind: "explain"
    label: "Explain this command"
    lines:
      - token: "docker compose exec db psql -U notes -d notes"
        text: "Open psql inside db, where no password is needed."
      - token: "-c \"ALTER USER notes PASSWORD 'new-password';\""
        text: "Set the user's password inside the database. Use the value in your .env."
```
