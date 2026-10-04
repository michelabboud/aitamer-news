---
title: JSONB Is Not a Portable Blob
description: SQLite and PostgreSQL use the same name for incompatible binary JSON formats. Transfer JSON as text and let the receiving database build its own representation.
pubDate: "2026-10-05T10:00:00Z"
specimen: 262
section: dev
tags:
  - jsonb
  - sqlite
  - postgresql
  - data-migration
draft: false
heroImage: https://media.aitamer.news/heroes/jsonb-is-not-a-portable-blob-65b869ac.jpg
heroAlt: Data moves from one database through a structured document into a differently organized database.
author: ari
wildness:
  rating: 3
  verified: SQLite explicitly says its JSONB bytes are incompatible with PostgreSQL’s.
  claimed: JSON text is the practical transfer format; each engine builds its own JSONB.
verdict: The shared name hides separate binary formats. Exchange JSON text and check how the destination handles duplicate keys and escapes.
sources:
  - title: SQLite JSON Functions and Operators
    url: https://www.sqlite.org/json1.html
  - title: "PostgreSQL Documentation: JSON Types"
    url: https://www.postgresql.org/docs/current/datatype-json.html
---

SQLite and PostgreSQL both use the name `JSONB`. [SQLite says](https://www.sqlite.org/json1.html) its on-disk format differs from PostgreSQL’s and the two are not binary compatible. Copying stored JSONB bytes between the engines will not transfer the JSON value.

## What each engine stores

SQLite normally stores JSON as text. Its JSONB option stores SQLite’s internal parse tree as a BLOB. SQLite’s JSON functions can read that BLOB without parsing text again. The documentation says to treat the format as opaque and keep it inside SQLite. Most SQLite JSONB operations still have linear time complexity. [SQLite documents these properties](https://www.sqlite.org/json1.html).

PostgreSQL stores `jsonb` in its own decomposed binary format. It can index `jsonb` and avoids reparsing the original JSON text for each operation. These properties describe PostgreSQL’s type; [SQLite explicitly rules out binary compatibility](https://www.sqlite.org/json1.html) with its format. [PostgreSQL describes its storage and indexing](https://www.postgresql.org/docs/current/datatype-json.html).

## Text is the transfer boundary

Move JSON text between the engines, then let the receiving engine build its own binary representation. SQLite’s `json(value)` returns JSON text from valid JSON text or a JSONB BLOB. Its `jsonb(value)` builds SQLite JSONB from valid JSON text. PostgreSQL accepts textual JSON input for `jsonb`, and a `jsonb` value can be rendered as text. [SQLite documents both functions](https://www.sqlite.org/json1.html); [PostgreSQL shows text input and output](https://www.postgresql.org/docs/current/datatype-json.html).

Text transfer does not guarantee that the original spelling survives. PostgreSQL `jsonb` drops insignificant whitespace and object key order. If an input object repeats a key, it keeps only the last value. PostgreSQL also rejects some inputs that other JSON readers may accept, including `\u0000` escapes. [These rules are in PostgreSQL’s JSON type documentation](https://www.postgresql.org/docs/current/datatype-json.html).

## What to do

1. Export values as JSON text, using SQLite’s `json(value)` or PostgreSQL’s `jsonb` text output. [SQLite](https://www.sqlite.org/json1.html) and [PostgreSQL](https://www.postgresql.org/docs/current/datatype-json.html) document those paths.
2. Bind that text as input and parse it with the destination engine’s JSON functions or `jsonb` input. Let the destination produce its own stored format. [SQLite](https://www.sqlite.org/json1.html) and [PostgreSQL](https://www.postgresql.org/docs/current/datatype-json.html) describe those inputs.
3. Check transferred values that contain repeated keys or unusual escapes against the destination’s rules before relying on a round trip. [PostgreSQL documents the relevant changes and rejections](https://www.postgresql.org/docs/current/datatype-json.html).
