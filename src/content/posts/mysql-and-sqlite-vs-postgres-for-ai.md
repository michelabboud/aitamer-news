---
title: "MySQL, PostgreSQL, or SQLite for an AI app? Start with where your data lives"
description: "MySQL and MariaDB now document native vector features, PostgreSQL can use pgvector, and SQLite can add search through extensions. Here is how to choose by deployment shape and retrieval needs."
pubDate: "2026-10-01T17:00:00Z"
specimen: 64
section: "devops"
tags:
  - databases
  - vector-search
  - mysql
  - postgresql
  - sqlite
  - ai-applications
draft: false
heroImage: "https://media.aitamer.news/heroes/mysql-and-sqlite-vs-postgres-for-ai.jpg"
heroAlt: "A paper-cut collage of three slate-blue paths meeting at cream and coral vector dots, with a small database cylinder and layered document shapes at either side."
author: ari
sources:
  - title: "MySQL 9.7 Reference Manual: The VECTOR Type"
    url: "https://dev.mysql.com/doc/refman/9.7/en/vector.html"
  - title: "MySQL 9.0.0 Release Notes: Vector Data Type"
    url: "https://dev.mysql.com/doc/relnotes/mysql/9.7/en/news-9-0-0.html"
  - title: "MariaDB Server Documentation: Vector Overview"
    url: "https://mariadb.com/docs/server/reference/sql-structure/vectors/vector-overview"
  - title: "MySQL HeatWave User Guide: About MySQL HeatWave Vector Store"
    url: "https://dev.mysql.com/doc/heatwave/en/mys-hw-genai-vector-store-overview.html"
  - title: "pgvector README"
    url: "https://github.com/pgvector/pgvector"
  - title: "SQLite: Appropriate Uses For SQLite"
    url: "https://www.sqlite.org/whentouse.html"
  - title: "SQLite Run-Time Loadable Extensions"
    url: "https://www.sqlite.org/loadext.html"
  - title: "sqlite-vec README"
    url: "https://github.com/asg017/sqlite-vec"
wildness:
  rating: 5
  verified: "Primary docs checked for features, versions, defaults, and limits; no hands-on testing."
  claimed: "Capability claims rely on vendor and maintainer documentation."
verdict: "Choose the database that fits your deployment and relational workload first; add vector search where it can be tested beside your real filters."
---

A vector feature can make a familiar database useful for [retrieval-augmented generation (RAG) and semantic search](https://mariadb.com/docs/server/reference/sql-structure/vectors/vector-overview). It does not make every database interchangeable. The practical choice is still about where the application runs, how its data is shared, and how retrieval fits with the rest of its queries.

As of September 2026, [MySQL](https://dev.mysql.com/doc/refman/9.7/en/vector.html), [MariaDB](https://mariadb.com/docs/server/reference/sql-structure/vectors/vector-overview), and [PostgreSQL through pgvector](https://github.com/pgvector/pgvector) document vector storage or search options. The [sqlite-vec project](https://github.com/asg017/sqlite-vec) documents vector search for SQLite through an extension. The shape of those features differs: a column type stores vector values; an index helps find nearby values; and a managed service such as [HeatWave](https://dev.mysql.com/doc/heatwave/en/mys-hw-genai-vector-store-overview.html) may handle embedding, ingestion, or retrieval for you. Treat those as separate capabilities when choosing.

## MySQL stores vectors, with a key limitation

[MySQL's `VECTOR` type](https://dev.mysql.com/doc/refman/9.7/en/vector.html) holds single-precision floating-point entries. The manual gives a default length of 2,048 entries and a maximum of 16,383. MySQL 9.0 introduced the type, according to its [release notes](https://dev.mysql.com/doc/relnotes/mysql/9.7/en/news-9-0-0.html). The notes also document an important boundary: a vector column cannot be a primary, foreign, unique, or partitioning key.

That makes a MySQL vector column useful as a way to keep embeddings alongside ordinary application data, but it does not on its own establish a general-purpose vector index for every MySQL deployment. Do not infer search capability from the column type alone. Check the documentation for the exact MySQL edition and service you plan to operate, then verify the query path it supports.

## HeatWave adds a managed retrieval workflow

[Oracle's HeatWave guide](https://dev.mysql.com/doc/heatwave/en/mys-hw-genai-vector-store-overview.html) describes an in-database vector store that can ingest unstructured files from Object Storage, parse and segment them, generate embeddings, and support semantic search and RAG. This is a broader workflow than storing vectors in a MySQL table. It is a HeatWave product capability, so teams considering it should evaluate its supported deployment, permissions, data-ingestion path, and model choices against their environment.

The distinction matters for architecture. If your application already depends on MySQL, its vector type may help keep records together. If you want a managed document-to-retrieval pipeline, investigate HeatWave specifically rather than assuming the same pipeline comes with any MySQL server. Oracle describes the product's capabilities; those descriptions do not supply an independent performance comparison with PostgreSQL or MariaDB.

## MariaDB documents a vector index in the server

[MariaDB's vector documentation](https://mariadb.com/docs/server/reference/sql-structure/vectors/vector-overview) describes `VECTOR(n)` columns and a `VECTOR INDEX` definition. It says the initial implementation uses a modified Hierarchical Navigable Small World (HNSW) algorithm for approximate nearest-neighbour search. Its documented index options include Euclidean or cosine distance and an `M` setting. The page says larger `M` values increase accuracy while also increasing index size, memory consumption, and the work of `SELECT` and `INSERT` statements.

As of September 2026, the page lists vectors in MariaDB Community Server 11.7 and later, with general availability from 11.8, and notes availability in specified Enterprise Server releases. Confirm the release and support channel for your installation before designing around this feature. MariaDB's SQL-level index is a concrete vector-search facility; its presence alone does not tell you how it performs on your data or filters.

## PostgreSQL offers a broad extension path

The [pgvector README](https://github.com/pgvector/pgvector) documents a vector type and similarity search for PostgreSQL. It describes exact nearest-neighbour search by default and optional approximate indexes: HNSW and IVFFlat. According to the README, HNSW uses a graph and has slower index construction and higher memory use than IVFFlat; IVFFlat groups vectors into lists and searches selected lists. These are tunable approximate methods, so results can differ from exact search.

The appeal is integration. According to the pgvector README, embeddings can live in PostgreSQL tables beside application rows, with filters and joins available in queries. You still need to measure recall, latency, index build and update costs, and behavior under the filters your product actually uses. With approximate indexes, the README says filtering occurs after the index scan, which can leave fewer eligible results for a tenant or access-control condition.

## SQLite fits local applications, with an extension choice

SQLite's [own guide](https://www.sqlite.org/whentouse.html) describes it as local storage for individual applications and devices, with a different purpose from client/server databases built around shared, centralized data. That makes SQLite a natural candidate when an AI feature belongs inside a desktop, mobile, edge, or single-node application and keeping state close to the application is valuable.

SQLite's [extension mechanism](https://www.sqlite.org/loadext.html) lets applications add functions and virtual tables. One option, [sqlite-vec](https://github.com/asg017/sqlite-vec), documents vector storage and nearest-neighbour queries through a virtual table. Its maintainers label it pre-1.0 and warn that breaking changes may occur. SQLite's official documentation also says extension loading is disabled by default for security reasons; an application must explicitly enable or statically link extensions. Account for packaging and upgrades, especially across platforms.

This is a different maintenance choice from enabling a built-in database feature or installing a PostgreSQL extension. SQLite's guide says it requires no administration; your application still takes responsibility for shipping compatible vector-search code. Check extension support, query semantics, backup behavior, and the filtering operations you need before treating the database file as a complete retrieval system.

## Choose by deployment, then test retrieval

Start with the application boundary. Pick SQLite when data belongs on one device or within one application's local store and you can own the extension packaging. Prefer PostgreSQL with pgvector when you need a shared relational service and want its documented exact-search baseline plus optional HNSW or IVFFlat indexes. Keep MySQL when it is already the system of record, but distinguish the `VECTOR` type from indexed search. Consider MariaDB's documented `VECTOR INDEX` when its server feature and support lifecycle fit your deployment. Consider HeatWave when its managed ingestion and RAG workflow is the actual requirement.

Then test with representative data and queries. Compare exact results against approximate search; measure recall and latency; include metadata and access filters; and check writes, rebuilds, and operational packaging. Keep embeddings tied to the model and preprocessing that produced them, and plan how to regenerate them if either changes. Choose the simplest database path that meets those requirements, and add a specialized vector service only when measurements show a gap your chosen database cannot close.
