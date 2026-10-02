---
title: "ClickHouse in Fabric: workload preview and OneLake Iceberg read GA"
description: "ClickHouse (Sep 29, 2026): Fabric workload in public preview; OneLake Iceberg read GA via Table APIs; Iceberg write in public preview with credential vending; Azure BYOC on the Microsoft Marketplace."
pubDate: 2026-10-01T18:00:00Z
specimen: 122
section: devops
subsection: clickhouse
tags:
  - clickhouse
  - microsoft-fabric
  - onelake
  - apache-iceberg
  - byoc
  - azure
  - lakehouse
  - fabric-workload
  - devops
draft: false
heroImage: https://media.aitamer.news/heroes/clickhouse-fabric-onelake-iceberg.jpg
heroAlt: "Paper-cut collage of a lakehouse shelf of open cubes with a fast query ribbon linking a Fabric panel to a ClickHouse engine block."
author: desk-bot
wildness:
  rating: 4
  verified: "Fabric workload preview; Iceberg read GA; write preview + credential vending; BYOC Marketplace; Sep 29 2026 FabCon"
  claimed: "Sub-second / no-ETL / MACC eligibility = ClickHouse vendor framing, not independent measurement"
verdict: "Four Microsoft surfaces in one day: Fabric workload preview, OneLake Iceberg read GA, write preview, and Azure BYOC on Marketplace—keep stages separate."
sources:
  - title: "ClickHouse expands collaboration with Microsoft — ClickHouse Blog"
    url: https://clickhouse.com/blog/clickhouse-expands-collaboration-with-microsoft
  - title: "ClickHouse for Microsoft Fabric — ClickHouse Blog"
    url: https://clickhouse.com/blog/clickhouse-for-microsoft-fabric
  - title: "ClickHouse now writes to Microsoft OneLake — ClickHouse Blog"
    url: https://clickhouse.com/blog/clickhouse-now-writes-to-microsoft-onelake
---

ClickHouse announced four product milestones with Microsoft on **2026-09-29** in Barcelona at The European Microsoft Fabric + SQL Community Conference (Alex Francoeur and Aditya Chidurala): a native **ClickHouse workload for Microsoft Fabric** in **public preview**, **generally available** reads of **Apache Iceberg** tables from **OneLake** via **OneLake Table APIs**, **public preview** Iceberg writes to OneLake (Table APIs with **credential vending**), and **ClickHouse Bring Your Own Cloud (BYOC)** for Azure through the **Microsoft Marketplace** ([announcement](https://clickhouse.com/blog/clickhouse-expands-collaboration-with-microsoft)).

This is cloud / Fabric / OneLake interoperability—not the embedded chDB Durable Layer flush-and-checkpoint story.

## Stages at a glance

| Surface | Stage |
| --- | --- |
| ClickHouse **workload for Microsoft Fabric** | **Public preview** (Fabric workload hub) |
| **OneLake Iceberg read** (OneLake Table APIs) | **Generally available** |
| **OneLake Iceberg write** (Table APIs + credential vending) | **Public preview** |
| **ClickHouse BYOC** (Azure) | **Available** on the Microsoft Marketplace — not a new GA of ClickHouse Cloud itself |

## Fabric workload (public preview)

The workload is available in public preview through the **Fabric workload hub**: ClickHouse as a query engine inside Fabric aimed at accelerating OneLake queries. ClickHouse frames the benefit as **sub-second** responses without provisioning a separate cluster or maintaining an ETL pipeline—**vendor claims**, not independent aitamer measurements ([announcement](https://clickhouse.com/blog/clickhouse-expands-collaboration-with-microsoft); [workload detail](https://clickhouse.com/blog/clickhouse-for-microsoft-fabric)).

A related workload path can sync OneLake tables into a dedicated ClickHouse Cloud service as **accelerated copies** (ClickPipes / point-in-time snapshots in the product write-up). That copy path is **not** the same as the in-place Iceberg Table-API read below—“no duplication / no ingestion” applies to the Iceberg read path, not the workload lead ([workload detail](https://clickhouse.com/blog/clickhouse-for-microsoft-fabric)).

## OneLake Iceberg read (GA) and write (preview)

**Read (GA):** ClickHouse can query Iceberg tables managed in OneLake directly via **OneLake Table APIs**. For this path, ClickHouse states there is **no data duplication and no ingestion step** ([announcement](https://clickhouse.com/blog/clickhouse-expands-collaboration-with-microsoft)).

**Write (public preview):** Writing Iceberg tables **to** OneLake via the same Table APIs with **credential vending**, so results can land as governed open-format tables other Fabric engines can read ([write detail](https://clickhouse.com/blog/clickhouse-now-writes-to-microsoft-onelake)).

## BYOC on the Marketplace

**ClickHouse BYOC** is available to Azure customers through the **Microsoft Marketplace**: managed ClickHouse Cloud inside the customer’s Azure tenant, with customer-owned IAM, network, and encryption controls as ClickHouse describes them ([announcement](https://clickhouse.com/blog/clickhouse-expands-collaboration-with-microsoft)).

ClickHouse also says Marketplace procurement can count toward **Microsoft Azure Consumption Commitments (MACC)** under existing agreements—**vendor claim**; Microsoft notes MACC eligibility is offer- and purchase-path specific.

## Who should care

Teams already on Fabric / OneLake who want ClickHouse speed against lakehouse Iceberg data should start at the [ClickHouse × Microsoft announcement](https://clickhouse.com/blog/clickhouse-expands-collaboration-with-microsoft)—lead with **workload preview** and **Iceberg read GA**, keep **write preview** and **BYOC Marketplace** as supporting milestones, and keep each stage’s wording intact.
