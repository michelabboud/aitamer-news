---
title: Stop Two GPU Reservations From Overlapping
description: Use a PostgreSQL exclusion constraint to keep active reservations for the same GPU from overlapping. Range bounds and cancellation rules make the schedule explicit.
pubDate: "2026-10-05T20:00:00Z"
specimen: 281
section: dev
tags:
  - postgresql
  - sql
  - scheduling
  - constraints
draft: false
heroImage: https://media.aitamer.news/heroes/stop-two-gpu-reservations-from-overlapping-6bed7f16.jpg
heroAlt: A GPU sits above a timeline that marks one reservation and rejects a second overlapping slot.
author: ari
wildness:
  rating: 2
  verified: PostgreSQL documents range overlap exclusion and per-resource reservations.
  claimed: The same pattern can guard active reservations for each GPU.
verdict: Use a partial GiST exclusion constraint for active GPU bookings. Validate range bounds and existing data, then treat a conflict as a normal request for another slot.
sources:
  - title: "PostgreSQL: Constraints"
    url: https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION
  - title: "PostgreSQL: Range Types"
    url: https://www.postgresql.org/docs/current/rangetypes.html
  - title: "PostgreSQL: btree_gist"
    url: https://www.postgresql.org/docs/current/btree-gist.html
  - title: "PostgreSQL: CREATE TABLE"
    url: https://www.postgresql.org/docs/current/sql-createtable.html
  - title: "PostgreSQL: Transaction Isolation"
    url: https://www.postgresql.org/docs/current/transaction-iso.html
  - title: "PostgreSQL: ALTER TABLE"
    url: https://www.postgresql.org/docs/current/sql-altertable.html
---

A GPU reservation needs a GPU identifier and a span of time. The rule is simple: two active reservations for the same GPU must not overlap. A unique constraint checks whether values are equal. PostgreSQL recommends an exclusion constraint for rules involving overlapping ranges. It checks pairs of rows using operators you choose. [PostgreSQL's constraint guide](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION) explains that an exclusion constraint rejects a pair when every specified comparison is true.

## Store the reserved time as a range

PostgreSQL has a `tstzrange` type for a range of timestamps with time zones. Its `&&` operator asks whether two ranges overlap. A range constructor with two bounds includes the lower bound and excludes the upper bound. This `[)` convention lets one reservation end at the instant another begins. Those adjacent ranges do not overlap. [PostgreSQL's range guide](https://www.postgresql.org/docs/current/rangetypes.html) describes the type, operator, and bound rules.

Keep the GPU identifier and the time range in separate columns. The identifier answers *which GPU*; the range answers *when*. Make both columns `NOT NULL`. Otherwise, a null comparison can let a row pass an exclusion constraint. Also reject an empty range: an empty reservation occupies no time, so it cannot conflict with another range. These choices follow from the [exclusion rule](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION) and [range behavior](https://www.postgresql.org/docs/current/rangetypes.html).

## Put the overlap rule in the table

This table keeps cancelled reservations for history while excluding them from the scheduling rule:

```sql
CREATE EXTENSION btree_gist;

CREATE TABLE gpu_reservations (
  reservation_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  gpu_id text NOT NULL,
  during tstzrange NOT NULL,
  state text NOT NULL CHECK (state IN ('active', 'cancelled')),
  CHECK (NOT isempty(during)),
  CONSTRAINT gpu_reservations_no_overlap
    EXCLUDE USING gist (gpu_id WITH =, during WITH &&)
    WHERE (state = 'active')
);
```

The `gpu_id WITH =` comparison is true when two rows name the same GPU. The `during WITH &&` comparison is true when their ranges overlap. The exclusion constraint rejects a pair when both are true. PostgreSQL's [range documentation](https://www.postgresql.org/docs/current/rangetypes.html) shows this same combination for reservations tied to a room. The `btree_gist` extension supplies GiST support for equality on ordinary scalar types, including `text`, alongside the range operator. [Its documentation](https://www.postgresql.org/docs/current/btree-gist.html) lists those supported types.

The `WHERE` clause limits the constraint to active rows. PostgreSQL implements that predicate with a partial index. A cancelled reservation can therefore retain its original time even if a new active reservation uses that slot. Changing the cancelled row back to `active` makes it subject to the constraint again. The [CREATE TABLE reference](https://www.postgresql.org/docs/current/sql-createtable.html) documents both the predicate and checks on inserted or updated rows.

## Treat a conflict as a normal booking result

Insert a requested window with the range constructor. Pass the endpoints as parameters so the database builds the same `[)` shape for every request:

```sql
INSERT INTO gpu_reservations (gpu_id, during, state)
VALUES ($1, tstzrange($2::timestamptz, $3::timestamptz, '[)'), 'active');
```

An overlapping active booking for that GPU makes the insert fail with an exclusion constraint error. A booking for another GPU can use the same time. A booking that begins exactly when the earlier one ends can also fit. These outcomes follow from the [documented room reservation example](https://www.postgresql.org/docs/current/rangetypes.html) and the meaning of `[)` bounds. Give the constraint a stable name, as above, so application code can identify this scheduling failure and offer another slot; PostgreSQL includes named constraints in error messages, according to the [CREATE TABLE reference](https://www.postgresql.org/docs/current/sql-createtable.html).

A search for available time is useful for the interface, but its result is only a snapshot. Under PostgreSQL's default Read Committed isolation level, a plain `SELECT` sees data committed before that query began. Another transaction may change the schedule afterward. Let the insert and its constraint decide whether the requested reservation succeeds. The [transaction isolation guide](https://www.postgresql.org/docs/current/transaction-iso.html) describes that snapshot behavior.

## Check the edges before adopting it

Decide whether reservations may have open-ended bounds. PostgreSQL ranges allow them, and `NOT isempty(during)` does not forbid them. If every reservation must have a finite start and end, add checks using `lower_inf(during)` and `upper_inf(during)`. The [range guide](https://www.postgresql.org/docs/current/rangetypes.html) defines both functions.

For an existing table, inspect current active reservations for overlaps before adding the constraint. PostgreSQL normally scans existing rows when a table constraint is added. Its `NOT VALID` shortcut is unavailable for exclusion constraints, and adding the constraint generally requires an `ACCESS EXCLUSIVE` lock. Plan the change around that lock and resolve conflicting rows first. The [ALTER TABLE reference](https://www.postgresql.org/docs/current/sql-altertable.html) states those limits.

## What to do

1. Store each GPU booking in a `tstzrange`, and agree on inclusive starts and exclusive ends. [Check the range rules](https://www.postgresql.org/docs/current/rangetypes.html).
2. Require a GPU identifier and a nonempty range. Add `btree_gist` and an exclusion constraint using GPU equality and range overlap. [Follow the documented pattern](https://www.postgresql.org/docs/current/rangetypes.html).
3. If cancellations stay in the table, put the active-state predicate on the constraint. [Check the predicate syntax](https://www.postgresql.org/docs/current/sql-createtable.html).
4. Try adjacent, overlapping, different-GPU, and cancelled bookings. Make the application handle a rejected booking as a request for a different slot. [PostgreSQL shows the overlapping case](https://www.postgresql.org/docs/current/rangetypes.html).
