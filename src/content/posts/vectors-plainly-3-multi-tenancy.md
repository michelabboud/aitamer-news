---
title: "Vectors, Plainly, part 3: multi-tenancy, and how to organise data in a vector database"
description: "A vector index has no row-level security by default, and a missing filter leaks data without an error. The isolation levels, what each engine offers, and how to lay out collections, namespaces and metadata."
pubDate: 2026-09-30
section: dev
tags:
  - vectors-plainly
  - vector-databases
  - multi-tenancy
  - saas
  - security
draft: true
heroImage: /heroes/vectors-plainly-3-multi-tenancy.jpg
heroAlt: "A paper-cut collage of a cream and sand cabinet of fifteen pigeonholes on a slate-blue field; each holds its own small cluster of sage, blue or cream paper dots, and the middle compartment carries a small coral padlock."
author: quill
sources:
  - title: "Pinecone: implement multitenancy"
    url: https://docs.pinecone.io/guides/index-data/implement-multitenancy
  - title: "Qdrant: multitenancy (multiple partitions)"
    url: https://qdrant.tech/documentation/guides/multiple-partitions/
  - title: "Weaviate: multi-tenancy operations"
    url: https://docs.weaviate.io/weaviate/manage-collections/multi-tenancy
  - title: "Weaviate: vector index concepts"
    url: https://docs.weaviate.io/weaviate/concepts/vector-index
  - title: "Milvus: multi-tenancy strategies"
    url: https://milvus.io/docs/multi_tenancy.md
  - title: "pgvector README (multitenancy, iterative index scans)"
    url: https://github.com/pgvector/pgvector
  - title: "PostgreSQL: row security policies"
    url: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
  - title: "Vespa: streaming search"
    url: https://docs.vespa.ai/en/performance/streaming-search.html
wildness:
  rating: 2
  verified: "Each engine's isolation model and limits come from its own current docs."
  claimed: "Physical isolation and cost claims are the vendors' descriptions, not our tests."
verdict: "Pick isolation per tenant class, not once for everyone, and enforce the tenant scope below your application code. A vector index returns “closest”, so a forgotten filter leaks quietly."
---

*Part 3 of 6 in **Vectors, Plainly**. Earlier: [part 1, what a vector database does](/posts/vectors-plainly-1-what-a-vector-database-is/), and [part 2, inside the index](/posts/vectors-plainly-2-inside-the-index/).*

Most vector databases in production serve more than one customer, team or user from the same infrastructure. That makes tenant isolation the first design decision after the embedding model, and it is harder than it looks, because the structure at the centre of a vector database has no rows, no foreign keys and no row-level security. A graph of nearest neighbours doesn't know who owns what.

This part covers the isolation levels, what the main engines actually offer, the failure that really happens, and then the wider question of how to organise data: collections, namespaces, metadata and clusters.

## Why vectors make this harder

In a relational database, a query that forgets `WHERE tenant_id = ?` returns other tenants' rows, but at least the query was wrong in a way a reviewer can see, and row-level security can catch it. A vector query asks for the nearest items. Without a tenant scope, the nearest items may belong to anyone, and the database returns them ranked by relevance, with no error and nothing that looks unusual. The leak looks like a good answer.

There is also a quieter cost. Tenants who share one approximate index share its graph. The [pgvector README](https://github.com/pgvector/pgvector) puts it plainly: "sharing an approximate index between tenants means vectors from one tenant can affect recall (and speed) for other tenants". A small tenant filtered out of a big shared graph is also the classic post-filtering trap from part 2: ask for ten results, get four.

## Three levels of isolation

![Three columns from left to right: a shared index with a tenant filter, a namespace or partition per tenant, and a separate collection or cluster per tenant. Isolation grows from left to right, and so does the number of indexes to operate.](/diagrams/vectors-plainly-3-multi-tenancy/isolation-levels.svg)

| Strategy | Isolation | Cost and operations | Fits best when |
|---|---|---|---|
| **Shared index, tenant field filtered on every query** | Weakest: one missing filter leaks | Lowest: one index to build and tune | Many small tenants, low sensitivity, tight budget |
| **Namespace or partition per tenant** | Good: queries are scoped by structure, not only by a filter | Moderate: some per-partition overhead | The common default for business SaaS |
| **Separate collection, index or cluster per tenant** | Strongest: physical separation, own keys possible | Highest: index sprawl, slower cold queries for tiny tenants | Regulated data, enterprise contracts, strict deletion promises |

The middle row is where most products should start, and the engines have converged on it, each with its own twist.

## What the engines offer

**Pinecone** tells you to "use one namespace per tenant". Its [multitenancy guide](https://docs.pinecone.io/guides/index-data/implement-multitenancy) says each namespace "is stored separately", giving "physical isolation of each tenant's data", and that every read and write targets exactly one namespace. Offboarding a tenant means deleting its namespace, which the docs call "a lightweight and almost instant operation". The guide is also candid about the alternative: you can keep everyone in one namespace and filter on a tenant field, but "queries scan the entire namespace regardless of filters", so it costs more.

**Qdrant** argues the other way for most cases. Its [multitenancy guide](https://qdrant.tech/documentation/guides/multiple-partitions/) says "creating a separate collection for each tenant is rarely the most efficient approach", because each collection carries its own overhead. Instead, you put tenants in one collection, index the tenant field with `is_tenant: true`, and filter on it in every query. The flag makes Qdrant store each tenant's vectors together, so "the data of one tenant can be read in a single sequential pass". Since v1.16.0 Qdrant also supports **tiered multitenancy**: small tenants share a shard, and large tenants are promoted to dedicated shards as they grow.

**Weaviate** builds tenancy into the collection. Per [its docs](https://docs.weaviate.io/weaviate/manage-collections/multi-tenancy), "each tenant is stored on a separate shard. Data stored in one tenant is not visible to another tenant." Tenants have activity states: `ACTIVE`, `INACTIVE` (on disk, not loaded) and `OFFLOADED` (moved to cloud storage), which is how you keep millions of mostly idle tenants from eating memory. Deleting a tenant deletes all its objects. Weaviate also recommends a flat, index-free vector index as "a good choice for small collections, such as for multi-tenancy use cases", with its dynamic index switching a tenant to HNSW once it grows past 10,000 objects by default.

**Milvus** documents four levels in its [multi-tenancy guide](https://milvus.io/docs/multi_tenancy.md), with their default limits:

| Milvus level | Default tenant limit | Isolation |
|---|---|---|
| Database per tenant | 64 | Fully separated |
| Collection per tenant | 65,536 | Physically isolated |
| Partition per tenant | 1,024 per collection | Physically separated by partition |
| Partition key | Millions | "Relatively weak": tenants hashed into 16 partitions share them |

**PostgreSQL with pgvector** gives you Postgres's own tools. The README recommends list partitioning or separate tables for tenant isolation, which gives each tenant its own index. For enforcement, Postgres [row security policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) can make the tenant condition non-optional for the application's database role. Remember that under an approximate index, filters are applied after the index scan, so pair a shared index with pgvector's iterative index scans (0.8.0 and later) or accept short result lists for small tenants.

**Vespa** has a different answer for per-user data: [streaming search](https://docs.vespa.ai/en/performance/streaming-search.html). Documents carry the user or group in their id, each query names one group, and Vespa builds no index at all: it reads that group's raw documents. Vector search in this mode is "always exact", because HNSW is not supported there. When each query touches only one small slice of the corpus, as with a personal mailbox or notes app, scanning the slice beats maintaining an index for everyone.

## The failure that actually happens

The breach in real systems is rarely a clever attack on a namespace. It is the shared-index design with one code path, perhaps a new endpoint, a batch job or an admin tool, that forgets the tenant filter.

![Two tenants share one index. An acme user queries without a tenant filter, and two of the five nearest results belong to the other tenant; nothing errors, so the leak looks like a normal answer.](/diagrams/vectors-plainly-3-multi-tenancy/missing-filter.svg)

The fix is to take the decision away from application code:

- **Bind credentials to a scope.** Where the engine supports keys or roles scoped to a namespace, tenant or collection, give each tenant's traffic a credential that cannot see anything else.
- **Put a thin proxy or data-access layer in front** that injects the tenant scope into every query, so no caller can omit it.
- **Use database policy where it exists**, such as Postgres row security or a namespace-bound client.
- **Test it.** Add a CI test that writes a record for tenant A, queries as tenant B with a query that would match it perfectly, and fails if anything comes back.

## Beyond isolation: organising the data

Tenancy is one axis. The same mechanisms also organise data for relevance and operations, and most systems use two or three of them together. From coarsest to finest:

![Nested boxes: a collection per data domain holds a namespace per tenant, inside which metadata filters narrow by category, status or date; clusters discovered from the vectors reveal topics nobody labelled.](/diagrams/vectors-plainly-3-multi-tenancy/organising-stack.svg)

1. **Collection or index.** A physically separate structure with its own schema, and usually its own embedding model and dimension. Use it for genuinely different kinds of data, such as a product catalogue and support tickets, not for categories of the same data. Remember from part 1 that vectors from different models can't share a space, so different models imply different collections.
2. **Namespace or partition.** A logical subdivision within a collection: same schema and index type, cheap to create, queried one at a time. This is what most tenant and per-project isolation uses.
3. **Metadata fields.** Ordinary structured fields, such as category, tag, language, date or status, filtered alongside the vector search. The cheapest and most flexible grouping: a "bucket" can simply be a filter value. Index the fields you filter on; most engines need a payload index to filter efficiently.
4. **Clusters.** Groups discovered from the vectors themselves, with k-means or HDBSCAN over the embeddings, when you have no taxonomy and want the data to reveal one: topic discovery, grouping support tickets, spotting anomalies that sit far from every cluster. Use clusters to discover structure, never to enforce access.

A practical layout for a multi-tenant product is therefore: a collection per data domain, a namespace (or tenant partition) per customer, and metadata for category, status and date inside each customer's data. Store the embedding model's name and version as metadata too; part 4 explains why you will be glad you did.

## Choosing, per tenant class

The most useful shift is to stop choosing one level for everybody. Most products have a long tail of small tenants and a few large or sensitive ones. Qdrant's tiered multitenancy and Weaviate's tenant states are both built for that shape, and you can do the same by hand anywhere:

- **Long tail**: shared collection or shared partitioning, scoped keys, enforced filters, a flat or small index per tenant where the engine supports it.
- **Large tenants**: their own namespace or shard, so their size doesn't degrade anyone else's recall.
- **Regulated or contractual tenants**: their own collection or cluster, with their own keys, their own backups and a deletion story you can demonstrate.

Deletion is the question to ask of every design before you ship it. "Delete everything for this customer" should be one operation (drop a namespace, a tenant, a partition or a collection), not a filtered delete across a shared graph that leaves tombstones behind. Part 6 returns to why that matters for erasure requests.

---

**Next: part 4 of 6, "Getting quality right": choosing an embedding model, dimensions and chunking, measuring recall instead of guessing, and the use cases where vector search earns its place. It publishes tomorrow, 1 October.**
