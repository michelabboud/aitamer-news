---
title: "PostgreSQL can cover an AI app's search and data needs"
description: "pgvector, JSONB, full-text search and row security can support an AI app in one PostgreSQL database, with practical limits to measure before you scale."
pubDate: "2026-09-30T13:00:00Z"
specimen: 56
section: "devops"
tags: ["postgresql", "pgvector", "hybrid-search", "jsonb", "row-security"]
draft: false
heroImage: "https://media.aitamer.news/heroes/postgres-for-ai-apps.jpg"
heroAlt: "A paper-cut collage of three cards with semantic dots, text lines and structured fields connected to a slate-blue database."
author: "ari"
sources:
  - title: "pgvector README"
    url: "https://github.com/pgvector/pgvector"
  - title: "PostgreSQL 18: JSON Types"
    url: "https://www.postgresql.org/docs/current/datatype-json.html"
  - title: "PostgreSQL 18: Full Text Search"
    url: "https://www.postgresql.org/docs/current/textsearch-intro.html"
  - title: "PostgreSQL 18: Preferred Index Types for Text Search"
    url: "https://www.postgresql.org/docs/current/textsearch-indexes.html"
  - title: "PostgreSQL 18: Row Security Policies"
    url: "https://www.postgresql.org/docs/current/ddl-rowsecurity.html"
  - title: "PostgreSQL 18: WITH Queries"
    url: "https://www.postgresql.org/docs/current/queries-with.html"
  - title: "Elastic: Reciprocal Rank Fusion"
    url: "https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion"
  - title: "Amazon Bedrock: Key terminology"
    url: "https://docs.aws.amazon.com/bedrock/latest/userguide/key-definitions.html"
  - title: "Original HNSW paper"
    url: "https://arxiv.org/abs/1603.09320"
wildness:
  rating: 4
  verified: "PostgreSQL and pgvector documentation specify features and caveats."
  claimed: "Index performance comparisons come from pgvector; no independent benchmarks were checked."
verdict: "Start with PostgreSQL when it already fits your app, then measure filtered recall, latency and operations before adding another database."
---

An AI application can produce [embeddings](https://docs.aws.amazon.com/bedrock/latest/userguide/key-definitions.html), structured model output, searchable text and tenant-specific records. That can look like a reason to add a vector store, a document store and a search engine alongside the application database. Sometimes those tools are the right fit. [pgvector](https://github.com/pgvector/pgvector) adds vector similarity search to PostgreSQL, while PostgreSQL already provides [JSON](https://www.postgresql.org/docs/current/datatype-json.html), [full-text search](https://www.postgresql.org/docs/current/textsearch-intro.html) and [row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html). One database can be a sensible starting point.

The appeal is practical: application records and their embeddings can live together, and a query can combine similarity with ordinary filters. Keeping those records together can avoid a separate synchronization path. It does not make every workload easy, and “one database” is a design choice to validate against your traffic and operating constraints.

## Store model output as data you can query

PostgreSQL’s `jsonb` type stores JSON in a decomposed format that is faster to process than reparsing raw JSON text, and it supports indexing. A generalized inverted index (GIN) can speed up queries for keys and values in JSON documents.

That flexibility is useful when an output shape evolves or contains optional fields. It is not a reason to put the whole application schema into one opaque blob. PostgreSQL’s documentation recommends keeping JSON documents structurally predictable. Put fields you routinely join, constrain, sort or aggregate into ordinary columns; use `jsonb` for the parts whose shape benefits from flexibility. Validate model output before storing it. The JSON type checks syntax; enforce your expected output shape separately.

## Add vectors beside the records they describe

With pgvector, a table can hold a record’s text, tenant identifier, metadata and embedding. A vector is a list of numbers produced by an embedding model; similarity search finds stored vectors near a query vector. pgvector supports exact nearest-neighbour search by default and approximate indexes when a workload needs them.

Its two approximate index choices make different trade-offs. **[Hierarchical Navigable Small World (HNSW)](https://arxiv.org/abs/1603.09320)** builds a layered graph for nearest-neighbour search. According to pgvector's README, it offers a better speed-and-recall trade-off than IVFFlat, at the cost of more memory and slower index builds. **IVFFlat** divides vectors into lists and searches selected lists. The README says it uses less memory and builds faster than HNSW, but has a weaker speed-and-recall trade-off. It recommends building the index after the table has some data. Test these trade-offs with your data and query patterns.

Approximate search needs care when filters enter the query. pgvector applies filters after scanning an approximate index. Its README illustrates the consequence: if a filter matches 10 percent of rows, the default HNSW `ef_search` setting of 40 yields about four matching rows on average. Iterative index scans can keep searching for more qualifying rows, within configured limits, but they do not make every filtered query exact. Test recall with realistic tenant sizes, filter selectivity and requested result counts. For selective conditions, a conventional index and exact search over the matching rows may be the better plan.

## Combine meaning and exact words

Vector search can be combined with term-based search. PostgreSQL's full-text search parses text into tokens and normalizes them into searchable terms, and its [GIN index is the preferred index type](https://www.postgresql.org/docs/current/textsearch-indexes.html) for frequent full-text queries. Test searches for identifiers such as error codes and product numbers, because tokenization and normalization can change how they match.

The two searches can run in [one SQL statement](https://www.postgresql.org/docs/current/queries-with.html) against the same records: gather one shortlist by vector distance and another by text rank, then combine the results. One approach is [Reciprocal Rank Fusion (RRF)](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion): assign each result a score based on its position in each shortlist, then add those scores. Because RRF uses rank positions, it avoids comparing a vector-distance score directly with a full-text score. The right balance depends on what users search for, so evaluate judged queries that include both natural-language descriptions and exact terms.

## Use row security as a guardrail

PostgreSQL row-level security policies can restrict which rows a database role may read or change. If row security is enabled and no policy permits an operation, PostgreSQL denies access to rows by default. This can provide an additional tenant boundary when many customers share tables.

It is not a complete tenant-isolation design by itself. Table owners normally bypass policies, as do superusers and roles with the `BYPASSRLS` attribute. Test how the application supplies tenant identity to its policies, using the same roles as in production. Include tenant filters in vector queries. pgvector's README also notes that when tenants share an approximate index, vectors from one tenant can affect recall and speed for another. Measure filtered recall with tenant policies enabled.

## Know when to split the search system out

Start with PostgreSQL when your app already depends on it, your collection fits its operating budget and the same records need transactional updates, metadata filters and vector or text search. This keeps data ownership and application queries close together.

Evaluate a dedicated vector database when measurements show that vector search is driving requirements PostgreSQL cannot meet comfortably: for example, the needed index or filtering behavior is unavailable, search load competes with transactional work, or the team needs scaling and operations that fit a separate search service better. Base that decision on the workload rather than a row-count threshold. Compare the systems using your own queries, tenant distribution, update rate, recall target, latency budget and operational capacity. Include the cost of synchronizing records across systems.

For a first implementation, keep canonical records in PostgreSQL, store embeddings alongside them with pgvector, and add a full-text index if exact terms matter. Begin with exact search on a realistic sample; introduce HNSW or IVFFlat only after measuring when it helps. Then test hybrid relevance and tenant access with real application roles. Add another database when those measurements show a concrete gap.
