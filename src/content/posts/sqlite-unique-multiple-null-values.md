---
title: SQLite UNIQUE allows more than one missing value
description: A uniqueness rule on an optional field does not also require that field to be present.
pubDate: "2026-11-11T08:00:00Z"
specimen: 1293
section: dev
tags:
  - sql
  - sqlite
  - data-quality
draft: false
heroImage: https://media.aitamer.news/heroes/sqlite-unique-multiple-null-values-30f88341.jpg
heroAlt: A cream paper cabinet has empty cubbies and one occupied key tag, with a matching coral key tag outside.
author: ari
wildness:
  rating: 1
  verified: The example accepts multiple NULLs; SQLite documents rejection of duplicate non-null values under UNIQUE.
  claimed: No production schema, query performance or cross-database portability is claimed.
verdict: State absence and uniqueness as separate schema requirements, then test the actual missing-value representation.
sources:
  - title: SQLite official documentation
    url: https://www.sqlite.org/lang_createtable.html#unique_constraints
---

An optional account field can be unique without being mandatory. SQLite permits multiple NULL values in a column protected by a UNIQUE constraint. That combination can be useful, but it surprises applications that read the word unique as a promise that every row has a distinct usable identifier.

This example runs in a fresh database:

```sql
CREATE TABLE contacts(handle TEXT UNIQUE);
INSERT INTO contacts VALUES (NULL), (NULL), ('ada');
SELECT COUNT(*) FROM contacts;
-- 3
```

Both missing handles are accepted. A second non-null ada value would conflict with the existing one under the ordinary constraint handling. The [CREATE TABLE reference](https://www.sqlite.org/lang_createtable.html#unique_constraints) documents SQLite's treatment of NULL values for uniqueness checks.

Consider a registration form that lets a person add a public handle later. The schema can intentionally allow many accounts with no handle while ensuring a chosen handle is not reused. The optional state and the uniqueness of supplied values are separate requirements. Combining UNIQUE with NOT NULL expresses a different design in which absence is disallowed too.

An empty string deserves a deliberate policy. It is a text value, not SQL NULL. If a form submits an empty string for every unfilled handle, the second such value can conflict even though the application visually presents both as blank. Decide at the boundary how an absent field is represented, and test that representation through the actual insert path.

The database rule also does not decide whether two user-facing handles should compare as equivalent. Case, collation and normalization policies belong to the schema and application design. A simple uniqueness example should not be promoted into a complete account-identity policy without checking those details.

For a composite UNIQUE constraint, consider every participating column and the database's NULL semantics. Reasoning from a single-column demonstration can miss how an optional component changes the constraint's outcome. Use the production database engine's documented behavior and test representative combinations rather than assuming every SQL implementation makes the same choices.

Before changing an existing optional field to NOT NULL, inspect the data and plan the migration separately. A stronger future rule does not invent valid values for rows already missing them. Preserve existing records and handle any required backfill explicitly.

A compact test set includes two missing values, two empty strings, a repeated supplied handle, and two different supplied handles. It makes the application's definition of missing visible. That is the distinction a UNIQUE label alone leaves unresolved for anyone reading the schema.
