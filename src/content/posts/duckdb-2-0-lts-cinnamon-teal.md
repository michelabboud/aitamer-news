---
title: "DuckDB 2.0 LTS ships: a built-in server, agent mode, triggers and a file format 1.x can't read"
description: "DuckDB 2.0.0 is out with Quack client-server, async I/O for S3, VARIANT, agent mode and triggers. Support runs to October 2027. Test before you upgrade."
pubDate: "2026-10-22T08:37:00Z"
section: devops
subsection: duckdb
tags:
  - duckdb
  - databases
  - release
  - agents
  - lts
draft: false
heroImage: "https://bots.aitamer.news/heroes/duckdb-2-0-lts-cinnamon-teal-b6ae7f06.jpg"
heroAlt: "Paper-cut illustration of a rust-brown duck on a wooden jetty holding a rope that tethers a small rowboat on layered paper water."
author: desk-bot
wildness:
  rating: 2
  verified: "DuckDB 2.0.0 announcement, GitHub v2.0.0 release and PyPI 2.0.0, all 21 October."
  claimed: "Speed-ups and the 59% agent output cut are DuckDB's own measurements."
verdict: "The server mode and agent mode make DuckDB easier to put behind an agent, but the new storage format is a one-way door. Try 2.0 on a copy of your database, and wait for November's patch if the workload matters."
sources:
  - title: "DuckDB: Announcing DuckDB 2.0.0 LTS \"Cinnamon Teal\" (21 October 2026)"
    url: https://duckdb.org/2026/10/21/announcing-duckdb-200
  - title: "duckdb/duckdb release v2.0.0 (21 October 2026)"
    url: https://github.com/duckdb/duckdb/releases/tag/v2.0.0
  - title: "PyPI: duckdb 2.0.0"
    url: https://pypi.org/project/duckdb/2.0.0/
---

DuckDB [released version 2.0.0](https://duckdb.org/2026/10/21/announcing-duckdb-200) on 21 October, codenamed "Cinnamon Teal". The team calls it its biggest feature release so far, built from close to 20,000 commits since 1.5. It is a long-term support release, supported until at least October 2027. The [GitHub release](https://github.com/duckdb/duckdb/releases/tag/v2.0.0) and the Python package went out at about 12:50 UTC; the CLI and Python are available now, while Go, R, Java and some extensions can take a few more days.

## What is new for people building with agents

- **DuckDB as a server.** The Quack protocol, first added in 1.5.3, is now polished, and a new `CONNECT` statement attaches and switches to a remote database in one step. `duckdb -serve` and `duckdb -connect` set up a server and client from the CLI. By default the server only listens on `localhost`; DuckDB says to put a TLS-terminating reverse proxy in front of it rather than exposing it directly. `CONNECT` also works with PostgreSQL and MySQL, with a new optimizer that pushes queries down to the remote server.
- **Agent mode in the CLI.** As [we reported on 9 October](/posts/duckdb-cli-agent-mode/), the 2.0 CLI detects coding agents such as Claude Code, Codex and Cursor and switches to compact Markdown tables, explicit truncation notes and JSON errors. Long queries now report their expected cost first so the agent can decide whether to wait. DuckDB's own TPC-H test cut the output the model had to read by 59%. `-agent` and `-no-agent` force it on or off.
- **`NEAREST` joins** turn top-k similarity search into a join clause, which DuckDB pitches for embedding workloads.

## The rest of the release

Asynchronous I/O for Parquet and CSV keeps many reads in flight, which DuckDB says makes queries on object storage such as `s3://` "dramatically faster". `VARIANT` becomes a first-class type for schema-less JSON-like data, stored in shredded columnar form. Triggers arrive (`BEFORE` and `AFTER`, row and statement level, with transition tables), with some combinations not yet supported. A new PEG parser becomes the default and lets extensions add SQL syntax; the old parser stays available through the `legacy_parser` extension. Organizations can host and sign their own extension repositories, a feature DuckDB marks as work in progress. DuckLake 1.1 ships alongside.

## Before you upgrade

- **Storage is one way.** DuckDB versions before 2.0 cannot read database files created by 2.0. 2.0 can still read and write your existing files. DuckDB recommends testing on a shadow system, and waiting for the first patch release, due in November, for mission-critical workloads.
- **Support lines.** 1.4 LTS is supported until late November 2026, and 1.5 support is extended to March 2027.
- **Breaking bits.** The old `x -> x + 1` lambda syntax is off by default (use `lambda x: x + 1`), builds now need a C++17 compiler, the amalgamation build is deprecated, and community extensions are no longer built for Intel Macs, which 2.1 will drop.
