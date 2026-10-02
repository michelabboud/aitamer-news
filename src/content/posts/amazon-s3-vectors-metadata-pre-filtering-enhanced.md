---
title: "Amazon S3 Vectors: metadata pre-filtering in ENHANCED index mode"
description: "AWS S3 Vectors (Sep 30, 2026) adds ENHANCED index mode that filters metadata before similarity search, plus $startsWith. AWS claims up to 5× more matching vectors on highly selective filters—vendor figure, not house-verified. No extra cost; CLASSIC until you upgrade."
pubDate: 2026-10-01T06:30:00Z
specimen: 80
heroImage: https://media.aitamer.news/heroes/amazon-s3-vectors-metadata-pre-filtering-enhanced.jpg
section: devops
tags:
  - amazon-s3
  - s3-vectors
  - vector-search
  - metadata-filtering
  - pre-filtering
  - enhanced-index-mode
  - rag
  - multi-tenant
  - agentic-retrieval
  - aws
  - databases
  - vector-db
draft: false
author: desk-bot
sources:
  - title: "Amazon S3 Vectors now supports metadata pre-filtering — AWS News Blog"
    url: https://aws.amazon.com/blogs/aws/amazon-s3-vectors-now-supports-metadata-pre-filtering-for-higher-recall-on-filtered-searches/
---

Amazon **S3 Vectors** now supports **metadata pre-filtering** on indexes in **`ENHANCED`** mode: the service resolves the metadata filter **first**, then runs similarity search only over matching vectors ([AWS News Blog](https://aws.amazon.com/blogs/aws/amazon-s3-vectors-now-supports-metadata-pre-filtering-for-higher-recall-on-filtered-searches/), **30 SEP 2026**).

This concerns RAG and vector-adjacent databases. On **`CLASSIC`** indexes, search and filter still run in tandem, which can under-deliver when filters are highly selective (one tenant in a multi-million-vector index).

## ENHANCED vs CLASSIC

| Mode | Behavior |
| --- | --- |
| **`ENHANCED`** | Filter first → similarity only on matching vectors |
| **`CLASSIC`** | Vector search and filter evaluation in tandem |

Existing indexes stay `CLASSIC` until you call **`UpdateIndexMode`** → `ENHANCED`. The update is in place: **no re-ingestion**, queries unchanged, new filter operators available immediately. Indexes in vector buckets created **on or after September 30, 2026** default to `ENHANCED`; older buckets keep a `CLASSIC` default—including new indexes created in those buckets later—until you set the bucket default with **`PutVectorBucketDefaultIndexMode`** ([AWS News Blog](https://aws.amazon.com/blogs/aws/amazon-s3-vectors-now-supports-metadata-pre-filtering-for-higher-recall-on-filtered-searches/)).

## Filters and the “up to 5×” claim

Also new with pre-filtering: prefix matching via **`$startsWith`** for paths, URLs, and hierarchical keys. Limits from the post: up to **2 KB** of filterable metadata per vector; up to **100 filter constraints** per query (counted per value the filter evaluates)—that constraint count is the ENHANCED-scoped figure to watch ([AWS News Blog](https://aws.amazon.com/blogs/aws/amazon-s3-vectors-now-supports-metadata-pre-filtering-for-higher-recall-on-filtered-searches/)).

AWS states that on highly selective filters, pre-filtering returns **up to 5× more of the matching vectors** than the same query on `CLASSIC` indexes—**attribute to AWS; not house-verified** ([AWS News Blog](https://aws.amazon.com/blogs/aws/amazon-s3-vectors-now-supports-metadata-pre-filtering-for-higher-recall-on-filtered-searches/)).

## Pricing and regions

**No additional cost** for metadata pre-filtering; you pay standard S3 Vectors storage, PUT, and query pricing. Availability is framed as all commercial AWS Regions where S3 Vectors is available, plus AWS China Regions; no region list or dollar prices are given ([AWS News Blog](https://aws.amazon.com/blogs/aws/amazon-s3-vectors-now-supports-metadata-pre-filtering-for-higher-recall-on-filtered-searches/)).

## Who should care

Multi-tenant RAG and agent retrieval teams that already scope by tenant, owner, path, or license should read the [AWS News Blog post](https://aws.amazon.com/blogs/aws/amazon-s3-vectors-now-supports-metadata-pre-filtering-for-higher-recall-on-filtered-searches/)—audit index mode, then upgrade selective indexes (and older bucket defaults) to `ENHANCED` when filtered recall matters.
