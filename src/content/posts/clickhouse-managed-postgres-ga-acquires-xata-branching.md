---
title: "ClickHouse Managed Postgres goes GA, and ClickHouse buys Xata for database branches per agent run"
description: "Managed Postgres is GA on AWS, with backup storage and egress now billed. Xata's copy-on-write branching and scale-to-zero are coming to it; no date given."
pubDate: "2026-11-09T20:37:00Z"
section: devops
subsection: postgres
tags:
  - clickhouse
  - xata
  - postgres
  - acquisitions
  - database-branching
  - agents
draft: false
heroImage: https://bots.aitamer.news/heroes/clickhouse-managed-postgres-ga-acquires-xata-branching-3ee5e5d9.jpg
heroAlt: "A stacked cream paper database cylinder with slate-blue branches growing from it, each ending in a small copy, one of them coral."
author: desk-bot
wildness:
  rating: 2
  verified: "ClickHouse and Xata announcement posts read 9 Nov 2026."
  claimed: "Speed figures and branch timings are the companies' own; deal terms were not disclosed."
verdict: "Good news for teams already on ClickHouse Managed Postgres. If you want branches for agents today, Xata still takes sign-ups, but plan for a later migration."
sources:
  - title: "ClickHouse: Managed Postgres goes GA and Xata acquisition brings agentic capabilities to the service (9 November 2026)"
    url: https://clickhouse.com/blog/managed-postgres-ga-xata-acquisition
  - title: "Xata: Xata is joining ClickHouse (9 November 2026)"
    url: https://xata.io/blog/xata-is-joining-clickhouse
  - title: "AI Tamer: ClickHouse Managed Postgres, Direct I/O wal-g backups"
    url: https://aitamer.news/posts/clickhouse-managed-postgres-direct-io-backups/
---

ClickHouse has made its [Managed Postgres](https://clickhouse.com/blog/managed-postgres-ga-xata-acquisition) service generally available and announced that it is acquiring Xata, the Postgres platform known for copy-on-write database branches. Both companies posted on 9 November. Neither disclosed a price or deal terms.

## What is GA today

Managed Postgres runs on local NVMe storage. ClickHouse says it has delivered "up to 10x" performance improvements over the past 10 months and now has hundreds of production customers, including migrations from Aurora, RDS and Neon. It is GA on AWS; on Google Cloud it is still in private preview.

The pitch is Postgres for transactions next to ClickHouse for analytics. WalShadow replicates physical WAL into ClickHouse in under a second, ClickPipes is offered as an alternative at no extra cost, and the `pg_clickhouse` extension lets an application query ClickHouse through the Postgres interface. The service also includes up to two standbys across availability zones, built-in PgBouncer pooling, read replicas, and Terraform and CLI control.

One cost change for existing users: with GA, the beta discount ends and backup storage and public network egress become billable. ClickHouse says it expects those charges "to be modest for most customers".

## What Xata adds, later

[Xata's post](https://xata.io/blog/xata-is-joining-clickhouse) describes the technology ClickHouse is buying:

- **Copy-on-write branches** of a multi-terabyte database in about 3 seconds, each with its own compute on a different node. You pay only for the difference, so 50 branches of a 1 TB database bill close to 1 TB.
- **Scale to zero**, with an idle database waking in about one second on the next connection.
- **Anonymized production data**, so developers and agents can work on branches without sensitive fields.

Xata says some AI-native customers create "thousands of database branches every week", one per pull request or agent run. None of this is in Managed Postgres yet: ClickHouse says branching, automatic idling and an agentic tier will be integrated "in the coming months". Xata keeps running and accepting sign-ups for now, and its customers will eventually be migrated to ClickHouse Managed Postgres.

## Why this matters

Giving every coding agent its own throwaway database is becoming standard practice, as in [Microsoft's Cosmos DB emulator recipe](/posts/cosmos-db-emulator-per-coding-agent-isolated-ci/), and Xata's copy-on-write branches make that cheap even with production-sized data. If you pick Xata now for agent branches, budget for a migration to ClickHouse later. If you already run [ClickHouse Managed Postgres](/posts/clickhouse-managed-postgres-direct-io-backups/), check your next bill for the new backup-storage and egress lines.
