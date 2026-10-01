---
title: "AlloyDB PostgreSQL for agents: Preview isolated query compute"
description: "Google Cloud AlloyDB “PostgreSQL for agents” (docs updated Sep 24, 2026) is Preview only: agents query live transactional data with isolation from core systems and can scale compute to zero when idle."
pubDate: 2026-10-01T18:40:00Z
specimen: 124
section: devops
subsection: postgres
tags:
  - alloydb
  - postgresql
  - google-cloud
  - ai-agents
  - preview
  - scale-to-zero
  - devops
  - postgres
draft: false
heroImage: /heroes/alloydb-postgresql-agents-preview.jpg
heroAlt: "Paper-cut collage of a primary database block beside a separate agent query ribbon that fades to an empty shelf when idle."
author: desk-bot
wildness:
  rating: 4
  verified: "AlloyDB PostgreSQL for agents Preview; docs 2026-09-24; isolation + scale-to-zero as Google states"
  claimed: "Thousands of agents / lakehouse analytics on live data = Google vendor framing only"
verdict: "Preview-only AlloyDB path for agent queries on live transactional data—isolation and scale-to-zero as Google states; not GA."
sources:
  - title: "PostgreSQL for agents in AlloyDB — Google Cloud"
    url: https://docs.cloud.google.com/alloydb/docs/postgresql-agents-alloydb
---

Google Cloud documents **PostgreSQL for agents** in **AlloyDB** as a **Preview** feature (page last updated **2026-09-24** UTC): a decoupled path so AI agents can query **live transactional data** with **full isolation** from core business systems—and **without affecting the primary production database**—while agent compute can **start in seconds** and **scale back to zero** when idle ([docs](https://docs.cloud.google.com/alloydb/docs/postgresql-agents-alloydb)).

## Preview only

This product is subject to Google’s **Pre-GA Offerings Terms** and Additional Terms for **Generative AI Preview** products—available **“as is”** with limited support. It is not generally available; Google has not published a GA date, SKUs, regions, or pricing on this public page. Access is via Google’s **access request / join the Preview** flow; deeper technical docs sit behind that gate ([docs](https://docs.cloud.google.com/alloydb/docs/postgresql-agents-alloydb)).

## What Google states

- Agents query **live transactional data** with **full isolation** so they don’t affect **core business systems** or the **primary production database**
- Decoupled architecture framed for many collaborating agents that **start in seconds**
- Compute can **automatically scale back to zero** when idle

Google also markets “thousands” of collaborating agents and “lakehouse analytics” on live operational data—**vendor framing** only on a thin public page. Stick to isolation and scale-to-zero as written; unpublished compute internals stay out of this brief.

## Who should care

Teams running AlloyDB who want agent analytics on fresh OLTP state without hammering the primary should start at the [AlloyDB PostgreSQL for agents docs](https://docs.cloud.google.com/alloydb/docs/postgresql-agents-alloydb)—keep every claim in **Preview**, and treat access-gated details as out of scope until Google publishes them publicly.
