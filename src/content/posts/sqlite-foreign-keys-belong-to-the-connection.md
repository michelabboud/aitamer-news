---
title: SQLite Foreign Keys Belong to the Connection
description: A foreign key declaration does not guarantee enforcement on every SQLite connection. Enable it when each connection opens, verify the setting, and check older data for violations.
pubDate: "2026-10-06T13:30:00Z"
specimen: 315
section: general
tags:
  - sqlite
  - databases
  - foreign-keys
  - data-integrity
draft: false
heroImage: https://media.aitamer.news/heroes/sqlite-foreign-keys-belong-to-the-connection-8f4aa00b.jpg
heroAlt: Three database connections have separate switches, with only the middle switch turned on.
author: ari
wildness:
  rating: 2
  verified: SQLite enables foreign-key enforcement separately for each connection.
  claimed: Each app connection should confirm enforcement before writing.
verdict: A practical connection setup rule, grounded in SQLite's documentation, with a separate check for existing violations.
sources:
  - title: SQLite Foreign Key Support
    url: https://www.sqlite.org/foreignkeys.html
  - title: SQLite PRAGMA foreign_keys
    url: https://www.sqlite.org/pragma.html#pragma_foreign_keys
  - title: SQLite PRAGMA foreign_key_check
    url: https://www.sqlite.org/pragma.html#pragma_foreign_key_check
---

A small AI app can store conversations in one table and messages in another. Each message can carry a conversation ID declared as a foreign key. With enforcement enabled, SQLite rejects a message that refers to a missing conversation. It can also reject deletion of a conversation that still has dependent messages. SQLite permits a child row with a NULL key, so use `NOT NULL` when every message must have a conversation. [SQLite's foreign-key guide](https://www.sqlite.org/foreignkeys.html) explains these rules.

## The setting lives on each connection

The declaration in the table schema is only part of the setup. SQLite says applications must enable foreign-key enforcement separately for each database connection. Its default can be changed at compile time and could change in a future release. Set the desired behavior explicitly when a connection opens. [SQLite's pragma reference](https://www.sqlite.org/pragma.html#pragma_foreign_keys) describes the setting.

Imagine a request handler and an ingestion worker opening separate connections to the same database. Enabling enforcement in the handler does not configure the worker. If the worker writes a message with a nonexistent conversation ID while its connection has enforcement off, the declared relationship will not stop that write. This follows from SQLite's [per-connection rule](https://www.sqlite.org/foreignkeys.html).

## Enable it before transactions

Run `PRAGMA foreign_keys = ON;` as part of every connection's setup. Then query `PRAGMA foreign_keys;` and require a result of `1`. A result of `0` means enforcement is off. No result means that SQLite lacks foreign-key support in that build or version. SQLite also says changing the setting inside a transaction has no effect, so do this before beginning one. [The SQLite guide](https://www.sqlite.org/foreignkeys.html) shows the setting and readback.

## What to do

1. Declare the relationship in the schema. Add `NOT NULL` to the child key if the relationship is mandatory.
2. In every path that opens a connection, enable enforcement before a transaction starts. Read the setting back and fail setup unless it is `1`.
3. For a database that may contain earlier writes, run `PRAGMA foreign_key_check;`. SQLite returns a row for each violation it finds. Investigate those rows before treating the data as consistent. [SQLite's pragma reference](https://www.sqlite.org/pragma.html#pragma_foreign_key_check) documents this check.
