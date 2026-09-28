---
title: "SQLite can carry a small AI app from prototype to local product"
description: "SQLite puts application data, full-text search and, with an extension, vector search in a local database file. Here is where that fits and when PostgreSQL fits better."
pubDate: "2026-10-02T11:00:00Z"
specimen: 67
section: "dev"
tags:
  - "sqlite"
  - "ai-apps"
  - "rag"
  - "full-text-search"
  - "vector-search"
draft: false
heroImage: "https://media.aitamer.news/heroes/sqlite-for-ai-apps.jpg"
heroAlt: "A paper-cut collage of a cream stack of index cards branching into four small document fragments across a slate-blue field, with one coral tab."
author: "ari"
sources:
  - title: "Appropriate Uses For SQLite"
    url: "https://www.sqlite.org/whentouse.html"
  - title: "SQLite FTS5 Extension"
    url: "https://www.sqlite.org/fts5.html"
  - title: "Write-Ahead Logging"
    url: "https://www.sqlite.org/wal.html"
  - title: "SQLite Backup API"
    url: "https://www.sqlite.org/backup.html"
  - title: "sqlite-vec README"
    url: "https://github.com/asg017/sqlite-vec"
  - title: "PostgreSQL: Introduction to MVCC"
    url: "https://www.postgresql.org/docs/current/mvcc-intro.html"
wildness:
  rating: 2
  verified: "FTS5 table and query ran on SQLite 3.45.1."
  claimed: "Most behavior claims rely on SQLite, PostgreSQL and sqlite-vec project documentation."
verdict: "Start with SQLite when one app owns local data and writes can queue briefly; move to PostgreSQL when shared access and write concurrency become core needs."
---

Artificial intelligence (AI) applications often begin with a basic data problem: keep documents, conversation history, settings and search results somewhere the application can query. A small retrieval-augmented generation (RAG) feature can add another store for embeddings. It is tempting to assemble a database server, a search service and a vector service before the workload needs them.

[SQLite describes itself as an in-process database](https://www.sqlite.org/whentouse.html): the application calls a library that reads and writes a database file. That design suits an agent that runs on one machine, a desktop assistant with private local notes, or a RAG prototype with a bounded collection. The data stays close to the code, Structured Query Language (SQL) handles filtering and transactions, and a backup can be made through [SQLite’s backup application programming interface (API)](https://www.sqlite.org/backup.html).

The single-file idea has a useful caveat: when write-ahead logging is enabled, SQLite typically also uses `-wal` and `-shm` files while connections are open. Treat the WAL file as part of the database’s live state. A safe backup should use SQLite’s backup facilities or otherwise account for the active journal; copying only the main file while writes are in flight can miss committed changes.

## Keep the retrieval stack small

For many developer-facing assistants, retrieval starts with ordinary text search. SQLite’s [full-text search 5 (FTS5) extension](https://www.sqlite.org/fts5.html) adds full-text indexes through a virtual table. A minimal table and query look like this:

```sql
CREATE VIRTUAL TABLE snippets USING fts5(title, body);

SELECT title, body
FROM snippets
WHERE snippets MATCH 'transaction rollback'
ORDER BY rank;
```

FTS5 indexes tokens and returns matching rows. Ordering by `rank` sorts results by relevance, as in SQLite’s documented examples. This gives an application a useful lexical baseline for terms users know exactly, such as function names, error messages and identifiers. Token matching can miss semantically similar wording, so pair it with vector search when users describe the same idea in different terms.

Vector search can also live beside application data. As of September 2026, the [sqlite-vec project README](https://github.com/asg017/sqlite-vec) describes an SQLite extension with `vec0` virtual tables for float, int8 and binary vectors. Its repository marks it pre-v1 and warns that breaking changes may occur. That makes it an option to evaluate for a compact app, with an explicit compatibility and upgrade plan before relying on it in a long-lived deployment.

With embeddings and source text stored locally, the application can filter retrieved chunks with its ordinary tables and then pass selected text to a model. The model call itself may still be remote; a local database does not make the whole application private if prompts or documents leave the device.

## WAL helps readers while writes take turns

SQLite’s [write-ahead logging (WAL) mode](https://www.sqlite.org/wal.html) records changes in a separate log before checkpointing them into the main database file. In WAL mode, readers and a writer can usually proceed concurrently. This is useful when an agent is reading context while another task updates history or ingests documents.

WAL does not turn SQLite into a many-writer server. Only one writer can append to a given WAL at a time, so overlapping writes queue or encounter a busy result. Keep write transactions short: finish the database update, then make the slower model or network call outside the transaction. Long-running readers can also delay checkpoints, so close cursors and read transactions promptly. WAL relies on shared memory and works for processes on the same host, not a database file shared over a network filesystem.

Those details fit a local agent loop well: one application coordinates a modest amount of state, background ingestion can take turns with chat writes, and many operations are reads. They fit less well when many independent app instances all write to the same database file, especially if the file is on network storage.

## Move the coordination point to PostgreSQL

Use [PostgreSQL](https://www.postgresql.org/docs/current/mvcc-intro.html) when the database becomes shared service state: several application servers need a central database over the network, concurrent writes are sustained, or operational needs call for a server-managed data service. SQLite’s own [choice guide](https://www.sqlite.org/whentouse.html) recommends a client/server database for many clients issuing SQL over a network and for workloads that cannot serialize writers. PostgreSQL documents its multi-version concurrency control (MVCC) model, where statements see consistent snapshots while data changes continue.

This is a workload decision rather than a size contest. A large local corpus with mostly reads may remain comfortable in SQLite, while a smaller multi-user service may need PostgreSQL because of access patterns. The migration point is when coordinating writes and sharing a database file become harder than operating a database server.

## Choose the smallest store that fits the workflow

For a single-user tool or a small agent service that keeps its data on one machine, start with SQLite tables, add FTS5 for token-based text retrieval, and evaluate sqlite-vec if semantic search is useful. Keep vector dimensions, extension loading, backups and index rebuilds in your deployment plan. Measure query latency and write contention with the workload you expect, rather than assuming an extension or a local file guarantees a particular speed.

If multiple app instances need to write centrally, or writes regularly wait behind one another, move the shared state to PostgreSQL and keep SQLite where it remains useful, such as local caches or offline data. The right first database is the one whose concurrency and operating model match the application you are actually shipping.
