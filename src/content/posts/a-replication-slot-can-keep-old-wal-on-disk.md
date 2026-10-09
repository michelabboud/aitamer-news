---
title: A Replication Slot Can Keep Old WAL on Disk
description: An inactive PostgreSQL replication consumer can retain write-ahead log files. Learn how to inspect slot state and choose between unbounded retention and a finite recovery window.
pubDate: "2026-10-10T09:00:00Z"
section: devops
tags:
  - postgresql
  - replication
  - wal
  - operations
draft: false
heroImage: https://media.aitamer.news/heroes/a-replication-slot-can-keep-old-wal-on-disk-731fa2b8.jpg
heroAlt: An idle teal paper cart pins an old ledger segment while a blue spool retains a growing cream roll.
author: ari
wildness:
  rating: 1
  verified: PostgreSQL documents slot WAL retention, checkpoint limits, and slot availability states.
  claimed: The indexing-worker scenario is illustrative; no outage or disk-growth measurement is claimed.
verdict: Inspect the slot and its consumer together. A finite WAL retention limit protects disk space at checkpoints, but the consumer needs a recovery plan if required WAL disappears.
sources:
  - title: "PostgreSQL: Replication configuration"
    url: https://www.postgresql.org/docs/current/runtime-config-replication.html
  - title: "PostgreSQL: pg_replication_slots view"
    url: https://www.postgresql.org/docs/current/view-pg-replication-slots.html
  - title: "PostgreSQL: Log-Shipping Standby Servers"
    url: https://www.postgresql.org/docs/current/warm-standby.html
---

A conversation-indexing worker goes offline while the application keeps writing new events to PostgreSQL. The worker's replication slot still marks the oldest write-ahead log (WAL) it may need. Disk use on the database server can keep growing even though the consumer has stopped doing useful work.

A slot preserves a restart position for a replication consumer. PostgreSQL's [replication settings](https://www.postgresql.org/docs/current/runtime-config-replication.html) say a slot can retain WAL in `pg_wal`, and the default `max_slot_wal_keep_size = -1` permits unlimited slot retention. This matters for an AI product whose indexing, analytics, or agent-memory pipeline consumes database changes: an idle downstream service can become a storage risk upstream. The slot's existence alone does not prove a problem; its activity and required WAL position do.

Start with a read-only inspection:

```sql
SELECT slot_name, slot_type, active, restart_lsn,
       wal_status, safe_wal_size
FROM pg_replication_slots
ORDER BY slot_name;
```

The [slot view](https://www.postgresql.org/docs/current/view-pg-replication-slots.html) defines `restart_lsn` as the oldest WAL that might still be needed. `active` tells you whether a slot is currently streamed. `wal_status` distinguishes retained WAL from a slot whose required WAL is due for removal or already lost. `safe_wal_size` estimates how many more WAL bytes can be written before a finite limit puts the slot in danger; it is null when the limit is unlimited or the slot is lost. Check the consumer's health and ownership before changing any slot.

Setting a finite `max_slot_wal_keep_size` bounds what slots may retain **at checkpoint time**. It is a recovery policy, not an exact instantaneous disk quota. If a consumer falls farther behind than the limit, required WAL can be removed and that consumer may be unable to resume from its slot. `wal_keep_size` has a different role: it sets a minimum amount of past WAL kept for standby streaming, and other needs such as archiving or checkpoints can retain more. The [standby documentation](https://www.postgresql.org/docs/current/warm-standby.html) describes archive recovery for a physical standby when the needed segment is available there; do not assume a logical change consumer has the same recovery path.

Choose the retention limit from a measured outage window and WAL generation rate, with room for bursts and checkpoint timing. Alert on inactive slots, their WAL status, and disk headroom. If a consumer has exceeded the chosen window, plan its reinitialization or other supported recovery before expecting it to reconnect. Keeping every byte protects resumption until the disk fills; bounding retention protects the server while making that resumption conditional.
