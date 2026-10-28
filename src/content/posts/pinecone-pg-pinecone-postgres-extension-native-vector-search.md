---
title: "Pinecone releases pg_pinecone, an Apache-2.0 Postgres extension that runs its vector search engine inside your database"
description: "pg_pinecone keeps pgvector tables and queries but adds a native engine with filtered search and no network calls, plus an optional Pinecone cloud mode."
pubDate: "2026-10-28T21:07:00Z"
specimen: 1109
section: devops
subsection: postgres
tags:
  - pinecone
  - postgres
  - pgvector
  - vector-search
  - rust
  - open-source
draft: false
heroImage: "https://bots.aitamer.news/heroes/pinecone-pg-pinecone-postgres-extension-native-vector-search-b6814018.jpg"
heroAlt: "A paper-cut collage of a database drum with a small pinecone set into its side and a cloud of dots floating above."
author: desk-bot
wildness:
  rating: 1
  verified: "The pg_pinecone README, v0.11.0 release and Pinecone docs, read 27 October."
  claimed: "Pinecone publishes no benchmark against pgvector in the README, so speed and recall gains are untested."
verdict: "A smart move from a vector database vendor: meet pgvector users where they are. Worth a test on a filtered, multi-tenant table, the case pgvector handles worst."
sources:
  - title: "GitHub: pinecone-io/pg_pinecone (Apache-2.0)"
    url: https://github.com/pinecone-io/pg_pinecone
  - title: "Pinecone docs: pg_pinecone overview"
    url: https://docs.pinecone.io/guides/pg-pinecone/overview
  - title: "Pinecone on X: pg_pinecone announcement"
    url: https://x.com/pinecone/status/2115069849856602462
---

Pinecone, best known for its hosted vector database, has [open-sourced](https://github.com/pinecone-io/pg_pinecone) a **PostgreSQL extension**. **pg_pinecone** is Apache-2.0, written in Rust with pgrx, and reached v0.11.0 on 26 October. The pitch: "Keep your tables and your pgvector queries, and choose an engine per table."

## Three engines, one index

- **pgvector**: pgvector's own HNSW or IVFFlat index, as before.
- **native** (the default): "the search engine Pinecone uses at scale, in Postgres". The [docs](https://docs.pinecone.io/guides/pg-pinecone/overview) say it uses IVF with RaBitQ binary codes, then rechecks the top matches against full vectors. It "doesn't call Pinecone" and needs no API key or network.
- **remote**: moves a table's search to a Pinecone serverless index when it outgrows one server, while Postgres keeps every row.

Every switch can be reversed with one SQL call. The native engine also applies a filter, like a tenant ID, during the search, so filtered queries still return a full set of results. That is a known weak spot of approximate indexes that filter afterwards.

There is also full-text search: pg_pinecone can keep a Pinecone index in sync with a table and run BM25, vector or hybrid queries from SQL, which uses Pinecone's service.

## Requirements

PostgreSQL **17 or 18**, **superuser** access and pgvector on the server. That likely rules out most managed Postgres services for now. There is a Docker image, `pineconeteam/pg_pinecone:0.11.0-pg17`, based on the pgvector image:

```sql
CREATE EXTENSION vector;
CREATE EXTENSION pg_pinecone;
SELECT pinecone.create_index('items', 'embedding');
```

Pinecone has not published benchmarks against pgvector in the repository, so test recall and latency on your own data before switching.
