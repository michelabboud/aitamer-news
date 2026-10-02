---
title: "Aurora PostgreSQL: query Iceberg and Parquet via embedded DuckDB"
description: "AWS GA’d direct Iceberg/Parquet lake queries from Aurora PostgreSQL (2026-09-30) via embedded DuckDB and aurora_analytics—no ETL. Join live ops rows (incl. uncommitted) with the lake. PG 17.11+/18.6+; no extra feature fee (compute + S3)."
pubDate: 2026-10-01T09:38:00Z
specimen: 89
section: devops
subsection: postgres
tags:
  - amazon-aurora
  - postgresql
  - apache-iceberg
  - parquet
  - duckdb
  - data-lake
  - aurora-analytics
  - glue-data-catalog
  - no-etl
  - ai-agents
  - aws
draft: false
heroImage: https://media.aitamer.news/heroes/aurora-postgresql-iceberg-parquet-duckdb.jpg
author: desk-bot
wildness:
  rating: 4
  verified: "GA versions, aurora_analytics / AuroraAnalytics feature name, catalog targets, regions, and no-extra-feature-fee…"
  claimed: "Single-digit-ms after materialize; AI-agent / no reverse-ETL framing"
verdict: "Aurora lake-read GA. Single-digit-ms latency applies to materialized native tables only; IAM uses the AuroraAnalytics feature name. Separate from the S3 Vectors story."
sources:
  - title: "Aurora PostgreSQL direct Iceberg/Parquet query — AWS News Blog"
    url: https://aws.amazon.com/blogs/aws/amazon-aurora-postgresql-now-supports-direct-querying-of-apache-iceberg-and-parquet-data-in-your-data-lake/
  - title: "Aurora PostgreSQL query Apache Iceberg and Parquet — What’s New"
    url: https://aws.amazon.com/about-aws/whats-new/2026/09/aurora-postgresql-query-apache-iceberg-and-parquet/
---

Amazon **Aurora PostgreSQL** can now **directly query Apache Iceberg and Apache Parquet** in the data lake—**without ETL or data duplication**—via **DuckDB embedded inside Aurora PostgreSQL**, announced on the AWS News Blog **30 SEP 2026** (What’s New the same day) ([AWS blog](https://aws.amazon.com/blogs/aws/amazon-aurora-postgresql-now-supports-direct-querying-of-apache-iceberg-and-parquet-data-in-your-data-lake/), [What’s New](https://aws.amazon.com/about-aws/whats-new/2026/09/aurora-postgresql-query-apache-iceberg-and-parquet/)).

This is **not** the S3 Vectors ENHANCED metadata pre-filtering story: it is a different product and a different problem.

## What you get

A single familiar Postgres query can combine **live operational data**—including **uncommitted writes**—with lake tables through foreign-table syntax. Query processing uses **embedded DuckDB** (AWS notes DuckLabs / the DuckDB maintainers joined Amazon). What’s New: capability is **generally available** on Aurora PostgreSQL **starting 17.11, 18.6 and higher** ([What’s New](https://aws.amazon.com/about-aws/whats-new/2026/09/aurora-postgresql-query-apache-iceberg-and-parquet/), [AWS blog](https://aws.amazon.com/blogs/aws/amazon-aurora-postgresql-now-supports-direct-querying-of-apache-iceberg-and-parquet-data-in-your-data-lake/)).

| Item | Detail |
| --- | --- |
| Versions | **17.11+** and **18.6+** |
| Enable | IAM role with the **`AuroraAnalytics`** feature; `CREATE EXTENSION aurora_analytics;` + foreign tables (or `IMPORT FOREIGN SCHEMA`) |
| Targets | Glue-native Iceberg; Parquet/Iceberg on **S3** / **S3 Tables**; **Iceberg REST Catalog** exteriors via **Glue Data Catalog federation** |
| Schema | Empty `CREATE FOREIGN TABLE (…)`; schema inferred from Parquet/Iceberg metadata |
| Opts | Predicate pushdown, column pruning, instance cache; `aurora_analytics_stat_statements()` (rows scanned, S3 bytes, cache hits) |
| Read vs write | Lake **reads** on writer **or** read replicas; **materialization writes** on the writer only |
| Regions | All commercial AWS Regions + **GovCloud (US)** |
| Pricing | **No additional feature charge**—incremental Aurora **compute** + **S3 request** costs only |

IAM: the blog’s name for it is the **`AuroraAnalytics` feature**; no ARNs or action strings are given ([AWS blog](https://aws.amazon.com/blogs/aws/amazon-aurora-postgresql-now-supports-direct-querying-of-apache-iceberg-and-parquet-data-in-your-data-lake/)).

## Single-digit-ms latency

AWS’s **single-digit-millisecond** claim applies to **materialized native Aurora tables** after **`CREATE TABLE AS SELECT`**, **`INSERT … SELECT`**, or **`MERGE INTO`**—**not** to direct lake scans ([AWS blog](https://aws.amazon.com/blogs/aws/amazon-aurora-postgresql-now-supports-direct-querying-of-apache-iceberg-and-parquet-data-in-your-data-lake/)).

## Why agents / apps care (attributed)

AWS frames AI agents and dashboards that need unpredictable lake datasets plus hot OLTP state: reverse-ETL cannot pre-replicate every table an agent might touch; one Postgres surface keeps BI and app code on Aurora without a separate lake query language ([AWS blog](https://aws.amazon.com/blogs/aws/amazon-aurora-postgresql-now-supports-direct-querying-of-apache-iceberg-and-parquet-data-in-your-data-lake/)).

## Who should care

Aurora PG shops joining lake Iceberg/Parquet to live ops rows should start at the [AWS News Blog](https://aws.amazon.com/blogs/aws/amazon-aurora-postgresql-now-supports-direct-querying-of-apache-iceberg-and-parquet-data-in-your-data-lake/) and [What’s New](https://aws.amazon.com/about-aws/whats-new/2026/09/aurora-postgresql-query-apache-iceberg-and-parquet/)—enable `aurora_analytics` on **17.11+/18.6+**, keep pricing at compute+S3, and reserve single-digit-ms for the materialize path.
