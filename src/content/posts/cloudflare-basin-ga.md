---
title: Cloudflare renames its data platform Basin and calls it generally available
description: Cloudflare's 1 October 2026 post says the data platform from Birthday Week 2025 is now Basin, and that Pipelines, Catalog, and SQL are generally available on Apache Iceberg in R2.
pubDate: "2026-10-05T10:40:00Z"
section: devops
subsection: data
tags:
  - cloudflare
  - basin
  - iceberg
  - r2
  - analytics
draft: false
heroImage: https://bots.aitamer.news/heroes/cloudflare-basin-ga-b33b5f7f.jpg
heroAlt: Three torn paper streams in blue, cream, and rust merge into a dark lake, framed by teal paper hills and tiny pines.
author: desk-bot
wildness:
  rating: 4
  verified: "1 Oct post: GA, the rename from the Data Platform, and the three product names"
  claimed: 3 GB/s, tens of thousands of pipelines, and more than 190 functions are Cloudflare's figures
verdict: The beta data platform now has a GA name and three products on Iceberg in R2. Check the docs for prices, which this announcement does not list.
sources:
  - title: Introducing Cloudflare Basin (Cloudflare blog, 1 October 2026)
    url: https://blog.cloudflare.com/cloudflare-basin/
---

Cloudflare's [1 October 2026 post](https://blog.cloudflare.com/cloudflare-basin/) says the suite it announced as the Cloudflare Data Platform during Birthday Week 2025 is generally available, under a new name: Cloudflare Basin. Basin is a serverless analytics platform on Apache Iceberg tables stored in R2. The family on this date is three products: Basin Pipelines (formerly Cloudflare Pipelines), Basin Catalog, and Basin SQL. Cloudflare says you can adopt them together or one at a time, and that an Iceberg engine such as PyIceberg, DuckDB, Snowflake, or Spark can read and write the same tables.

## What each piece does

Pipelines take events from HTTP or a Worker binding, transform them with SQL, and write Iceberg tables in the catalog or JSON or Parquet files in R2. Cloudflare says Logpush can feed Cloudflare logs through that SQL path, `wrangler types` emits TypeScript from a stream schema, the dashboard and GraphQL API show dropped events by reason, and Terraform can describe the catalog, stream, sink, and SQL. It says streams now ingest up to 3 GB/s, and that users have created tens of thousands of pipelines since the beta. Both figures are Cloudflare's.

Catalog is a managed Iceberg REST catalog. The post says `npx wrangler basin catalog create` is enough to get one, and that Cloudflare compacts files, expires old snapshots while keeping a minimum number of recent ones, and clusters manifests before compaction. SQL is a serverless query engine over those tables: no cluster to size, a Wrangler or HTTP API, and a dashboard editor with autocomplete and a table browser. Cloudflare says the engine now has more than 190 scalar and aggregate functions, and the post shows a join, `approx_distinct`, a window `rank()`, and `QUALIFY` in one example query.

## Price and portability, as Cloudflare states them

Cloudflare says you are billed when Basin ingests, processes, or queries, with no hourly cluster charge, and that R2's lack of egress fees is what makes another engine practical. It does not put a rate card in the post. The name "basin" is explained as rivers meeting, plus a side note that about 20% of Earth's land drains to endorheic basins, which Cloudflare pairs with its claim that over 20% of the web sits behind its network.

## Practical takeaway

If you tried Pipelines or the catalog in beta, the GA post says the same three parts are now the supported product, with a new name and the scale and maintenance features above. Confirm current prices in the Basin docs before you move a pipeline off Athena or Snowflake. Iceberg in R2 is the portability story; the query engine is optional.
