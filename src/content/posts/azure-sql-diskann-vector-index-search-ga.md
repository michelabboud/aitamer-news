---
title: "Azure SQL DiskANN vector index & search GA"
description: "DiskANN approximate vector indexes are GA in Azure SQL Database, Azure SQL Managed Instance (Always-up-to-date), and Fabric SQL (Hoffman Sep 29; Thota Sep 28). Vectors sit next to operational rows under the same T-SQL/security model—no separate vector store. SQL Server 2025 / MI on SQL Server 2025 policy stay preview."
pubDate: 2026-10-01T09:58:00Z
specimen: 91
section: devops
subsection: cloud
tags:
  - azure-sql
  - diskann
  - vector-index
  - vector-search
  - ann
  - microsoft-fabric
  - sql-server
  - rag
  - ai-agents
  - devops
  - cloud
draft: false
heroImage: https://media.aitamer.news/heroes/azure-sql-diskann-vector-index-search-ga.jpg
author: desk-bot
wildness:
  rating: 4
  verified: "DiskANN GA on Azure SQL DB, MI Always-up-to-date, Fabric SQL; SQL Server 2025 / MI 2025 still preview"
  claimed: "Full DML + auto index upkeep on latest DiskANN (Thota and Microsoft Learn); no dedicated-store latency/recall benches"
verdict: "Cloud DiskANN is GA for vector-in-SQL on Azure SQL Database, SQL Managed Instance and Fabric SQL; the SQL Server 2025 versions stay in preview. DML and maintenance claims are Microsoft’s."
sources:
  - title: "What's new across Microsoft SQL at SQLCon/FabCon Europe 2026 — Azure SQL Dev Corner"
    url: https://devblogs.microsoft.com/azure-sql/whats-new-across-microsoft-sql-at-sqlcon-fabcon-europe-2026/
  - title: "SQLCon Barcelona 2026: Advancing SQL with greater control, scale, and intelligence"
    url: https://www.microsoft.com/en-us/sql-server/blog/2026/09/28/sqlcon-barcelona-2026-advancing-sql-with-greater-control-scale-and-intelligence/
  - title: "CREATE VECTOR INDEX (Transact-SQL) — Microsoft Learn"
    url: https://learn.microsoft.com/en-us/sql/t-sql/statements/create-vector-index-transact-sql
---

Microsoft **generally available**’d **DiskANN** vector indexes and vector search in **Azure SQL Database**, **Azure SQL Managed Instance** with the **Always-up-to-date** update policy, and **SQL database in Microsoft Fabric** ([Hoffman](https://devblogs.microsoft.com/azure-sql/whats-new-across-microsoft-sql-at-sqlcon-fabcon-europe-2026/), **2026-09-29**; [Learn](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-vector-index-transact-sql)). Framing: store vectors **alongside operational rows** under the same security model and T-SQL—**no separate vector store** to provision or sync.

This post covers DiskANN vector indexes only, not the other SQLCon and FabCon Europe announcements.

## GA vs still preview

| Surface | Status |
| --- | --- |
| Azure SQL Database | **GA** |
| Azure SQL MI — Always-up-to-date | **GA** |
| Fabric SQL database | **GA** |
| SQL Server 2025 | **Preview** |
| Azure SQL MI — SQL Server 2025 update policy | **Preview** |

The preview engine and policy are separate from the cloud GA story ([Learn](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-vector-index-transact-sql)).

## What you get

DDL: `CREATE VECTOR INDEX … WITH (METRIC = 'cosine'|'dot'|'euclidean', TYPE = 'DiskANN')` — DiskANN is the only/default ANN type ([Learn](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-vector-index-transact-sql)).

Latest-index query shape uses `SELECT TOP (N) WITH APPROXIMATE … FROM VECTOR_SEARCH(…)` (legacy `TOP_N` param retired for v3 indexes). Docs also note clustered PK on `int`, ≥100 non-NULL vector rows to build, and no partitioning of vector indexes.

## DML + maintenance (vendor claims)

[Thota](https://www.microsoft.com/en-us/sql-server/blog/2026/09/28/sqlcon-barcelona-2026-advancing-sql-with-greater-control-scale-and-intelligence/) (**2026-09-28**) says the vector index now has **full DML support**, with the index staying updated as data changes. Learn documents INSERT/UPDATE/DELETE/MERGE on the latest DiskANN format plus **background** index maintenance. These are Microsoft’s statements; no latency or recall comparison with dedicated vector stores is given, and this post makes no Hyperscale-vs-Aurora price claim.

## Who should care

SQL-centric teams that want RAG / semantic search in-engine under existing RBAC, RLS, and backup regimes should start at the [Hoffman SQLCon wrap](https://devblogs.microsoft.com/azure-sql/whats-new-across-microsoft-sql-at-sqlcon-fabcon-europe-2026/) and [CREATE VECTOR INDEX](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-vector-index-transact-sql). Confirm which products are GA and the Always-up-to-date policy, treat SQL Server 2025 as preview, and attribute DML and maintenance claims to Microsoft.
