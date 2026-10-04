---
title: SQLite Can Enforce the Types You Declared
description: A STRICT table can keep unexpected types out of local state. Older SQLite versions need attention before you adopt it.
pubDate: "2026-10-05T19:00:00Z"
specimen: 279
section: dev
tags:
  - sqlite
  - databases
  - schema
  - local-state
draft: false
heroImage: https://media.aitamer.news/heroes/sqlite-can-enforce-the-types-you-declared-16b186cd.jpg
heroAlt: A gate beside a database admits matching shapes and diverts irregular shapes into a separate tray.
author: ari
wildness:
  rating: 2
  verified: STRICT rejects values that cannot be losslessly converted to the declared type.
  claimed: A strict schema can catch a bad retry count before it becomes stored state.
verdict: Use STRICT for typed local state once every reader supports SQLite 3.37.0 or later. Add CHECK constraints for value rules.
sources:
  - title: STRICT Tables
    url: https://www.sqlite.org/stricttables.html
  - title: Datatypes In SQLite
    url: https://www.sqlite.org/datatype3.html
---

A local agent may keep a run ID, a status, a retry count, and an input value in SQLite. The declared types can look like a firm contract. In an ordinary table, though, SQLite treats a column type as a preference. It can store text in an `INTEGER` column when that text cannot be converted to an integer. That leaves code reading the row to handle a value the schema seemed to rule out. [SQLite’s type documentation](https://www.sqlite.org/datatype3.html) explains this flexible behavior.

## What STRICT changes

Put `STRICT` after a table’s closing parenthesis to enforce its declared column types:

```sql
CREATE TABLE local_runs (
  run_id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'done')),
  retries INTEGER NOT NULL DEFAULT 0 CHECK (retries >= 0),
  input ANY
) STRICT;
```

A strict table requires a type for every column. The permitted names are `INT`, `INTEGER`, `REAL`, `TEXT`, `BLOB`, and `ANY`. SQLite still tries a lossless conversion before rejecting an inserted value. A numeric string that can be converted may therefore enter `retries` as an integer; text such as `'several'` fails with a datatype constraint error. `ANY` accepts values without that conversion and preserves their types. [SQLite’s STRICT table documentation](https://www.sqlite.org/stricttables.html) specifies each rule.

The example also separates type from meaning. `STRICT` keeps a retry count in the integer type. The `CHECK` constraint rules out negative counts, and another `CHECK` limits status values. SQLite says `CHECK`, `NOT NULL`, and other ordinary constraints work the same way on strict tables. [Its STRICT table guide](https://www.sqlite.org/stricttables.html) describes that boundary.

## Where older SQLite matters

SQLite added `STRICT` in version 3.37.0. Earlier versions normally report an error when a database schema contains a strict table, although the underlying file format did not change. There is a `writable_schema` path that lets an older version access such a table, but it ignores strict type enforcement. SQLite warns that this can allow incorrect types into the table. [The compatibility section](https://www.sqlite.org/stricttables.html) gives those limits.

## What to do

1. Check the SQLite version in every runtime that opens the database before adopting `STRICT`.
2. Use strict columns for state with known types. Add `NOT NULL` and `CHECK` constraints for rules about missing values and allowed values.
3. Reserve `ANY` for fields that need mixed types. After older software has touched a strict database, run `PRAGMA quick_check` with a newer SQLite version; SQLite says it checks stored types in strict tables. [The STRICT table guide](https://www.sqlite.org/stricttables.html) documents that check.
