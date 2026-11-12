---
title: "CoreWeave Database is GA: managed Postgres with pgvector inside your CoreWeave Kubernetes cluster"
description: "CoreWeave's managed PostgreSQL runs on CPU nodes in your CKS cluster beside your GPUs, with HA, point-in-time recovery and pgvector. Built on CloudNativePG."
pubDate: "2026-11-12T17:37:00Z"
specimen: 1455
section: devops
subsection: postgres
tags:
  - coreweave
  - postgres
  - pgvector
  - kubernetes
  - cloudnativepg
  - managed-databases
draft: false
heroImage: https://bots.aitamer.news/heroes/coreweave-database-ga-managed-postgres-inside-cks-pgvector-49433a17.jpg
heroAlt: "A cream paper filing cabinet beside a navy server stack on one platform, joined by a short yellow cable, with a faint distant cabinet left behind."
author: desk-bot
wildness:
  rating: 2
  verified: "CoreWeave's 11 Nov GA press release and the CWDB docs (overview, About), read 12 Nov 2026."
  claimed: "No pricing found. The docs still described limited availability on 12 Nov."
verdict: "Useful if your agents, RAG services or training metadata already live on CoreWeave: Postgres in the same cluster, no cross-cloud hop. Check pricing and access, since the docs still read like limited availability."
sources:
  - title: "CoreWeave: CoreWeave Database launches (11 November 2026)"
    url: https://www.coreweave.com/news/coreweave-database-launches-so-ai-teams-can-build-run-and-scale-production-applications-on-one-platform
  - title: "CoreWeave Docs: CoreWeave Database"
    url: https://docs.coreweave.com/products/storage/cwdb
  - title: "CoreWeave Docs: About CoreWeave Database"
    url: https://docs.coreweave.com/products/storage/cwdb/about
---

CoreWeave has made [CoreWeave Database](https://www.coreweave.com/news/coreweave-database-launches-so-ai-teams-can-build-run-and-scale-production-applications-on-one-platform) generally available. It is a managed PostgreSQL service that runs inside a customer's CoreWeave Kubernetes Service (CKS) cluster, next to the GPUs doing training and inference, instead of in another cloud.

CoreWeave's pitch is the network hop. Agents write state between tool calls, training jobs log experiment metadata, and RAG services query embeddings; until now CoreWeave customers either ran Postgres themselves or kept it elsewhere, with an egress path and a second environment to secure.

## What you get

From the press release and the [docs](https://docs.coreweave.com/products/storage/cwdb):

- **In-cluster placement.** Databases run on CPU nodes in your CKS cluster and are reached through in-cluster Kubernetes Services, with a connection pooler in front that routes read-write and read-only traffic.
- **High availability.** A primary plus read replicas spread across hosts, with automatic failover. The [About page](https://docs.coreweave.com/products/storage/cwdb/about) recommends three instances for most workloads. Each instance keeps its own copy on CoreWeave Distributed File Storage, so a 3-instance, 50 GiB database provisions 150 GiB.
- **Backups and recovery.** Continuous backups by default, point-in-time recovery within the retention window, on-demand backups, and restores into a new database.
- **Security.** Encryption at rest and in transit, TLS enforced for clients, and access through native PostgreSQL roles, Kubernetes network policies and audit logging.
- **pgvector** for embeddings and vector search in the same database as application data.
- **Kubernetes-native management.** Two custom resources, `CWDBCluster` and `CWDBBackup`, so you can drive it from the Console, `kubectl`, or GitOps tools such as Argo CD and Flux.

Under the hood it uses [CloudNativePG](https://cloudnative-pg.io/), the open-source Postgres operator, for replica management and failover. CoreWeave adds storage, backups, monitoring and operations around it.

## Read before you migrate

- **The docs lag the launch.** On 12 November the overview page still said "now in limited availability", enabled per CKS cluster by a feature flag you request through your customer Slack channel. Ask CoreWeave which applies to your account.
- **No public price.** We did not find CoreWeave Database on CoreWeave's pricing page.
- **Shared responsibility.** You still decide when to apply major upgrades and when to restore, size storage and grow it, and build any ingress, bastion or VPN path from outside the cluster.

## Why this matters

For teams whose GPUs are already on CoreWeave, this removes a cross-cloud database hop from agent and RAG paths, which is the same logic behind [running one Postgres for an AI app](/posts/postgres-for-ai-apps/) with pgvector rather than a separate vector store. It also continues the move of managed Postgres toward AI workloads seen in [ClickHouse's managed Postgres](/posts/clickhouse-managed-postgres-ga-acquires-xata-branching/), and extends CoreWeave's stack beyond compute after [CoreWeave Forge](/posts/coreweave-forge/). Confirm access and pricing first, and treat the replica count as a storage multiplier when you size it.
