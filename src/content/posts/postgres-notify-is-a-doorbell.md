---
title: Postgres NOTIFY Is a Doorbell
description: A notification can wake a worker, while a committed table row records the work. Here is how to use both across startup and reconnects.
pubDate: "2026-10-06T11:30:00Z"
specimen: 311
section: general
tags:
  - postgresql
  - notify
  - workers
  - transactions
draft: false
heroImage: https://media.aitamer.news/heroes/postgres-notify-is-a-doorbell-8fc8e454.jpg
heroAlt: A pressed doorbell alerts people beside a database, prompting them to inspect stored records.
author: ari
wildness:
  rating: 2
  verified: NOTIFY waits for commit; LISTEN documents a startup race and reaches current listeners.
  claimed: Use notifications to prompt queries for committed work rows.
verdict: Store work in a table, then use NOTIFY to prompt workers to read it. Query pending rows when a worker starts or reconnects.
sources:
  - title: "PostgreSQL: NOTIFY"
    url: https://www.postgresql.org/docs/current/sql-notify.html
  - title: "PostgreSQL: LISTEN"
    url: https://www.postgresql.org/docs/current/sql-listen.html
  - title: "PostgreSQL: COMMIT"
    url: https://www.postgresql.org/docs/current/sql-commit.html
---

## The signal arrives after commit

A writer can add a job row and send `NOTIFY` in the same transaction. PostgreSQL delivers the event only after the transaction commits. If it rolls back, neither the row nor its notification takes effect. A committed table change becomes visible to other transactions and remains durable across a crash. That makes the row a place to record work a worker must find later. [PostgreSQL’s NOTIFY documentation](https://www.postgresql.org/docs/current/sql-notify.html) explains the delivery timing; its [COMMIT documentation](https://www.postgresql.org/docs/current/sql-commit.html) explains the table change.

## The row carries the work

Give the row an identifier, the inputs needed for the task, and a status such as pending. The notification can carry the identifier, or it can name a channel that means “check for work.” PostgreSQL recommends tables for structured or larger data and suggests sending a record key in the payload. [The NOTIFY documentation](https://www.postgresql.org/docs/current/sql-notify.html) also says identical notifications on one channel within one transaction can be folded into a single delivery.

When a signal arrives, query the table and decide what is still pending. The notification tells the worker when to look. The row tells it what to do. Notification count should never stand in for job count.

## A listener can miss a bell

`LISTEN` reaches sessions currently subscribed to a channel. The subscription ends when the session ends. A disconnected worker therefore cannot rely on receiving an earlier signal when it returns. If the application keeps pending rows, it can find them with a later query. This follows from [LISTEN’s session rules](https://www.postgresql.org/docs/current/sql-listen.html) and [COMMIT’s durability guarantee](https://www.postgresql.org/docs/current/sql-commit.html).

There is also a startup race. PostgreSQL says to commit `LISTEN`, inspect the database in a new transaction, and then use notifications for later changes. Some early notifications may point to changes already found by that inspection. The worker should accept that overlap and check the row again. [The LISTEN documentation](https://www.postgresql.org/docs/current/sql-listen.html) spells out this order.

## What to do

1. Write the work row and send `NOTIFY` in one transaction, then commit. [NOTIFY](https://www.postgresql.org/docs/current/sql-notify.html) ties delivery to that commit.
2. On startup or reconnect, commit `LISTEN` and query outstanding rows before waiting for signals. [LISTEN](https://www.postgresql.org/docs/current/sql-listen.html) specifies this sequence.
3. After each signal, query for pending work and check its current status before processing. Keep the payload short, perhaps just a row key. [NOTIFY](https://www.postgresql.org/docs/current/sql-notify.html) recommends storing larger data in a table.
