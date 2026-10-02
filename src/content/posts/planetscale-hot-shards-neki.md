---
title: "PlanetScale Neki: cooling hot shards when tenant_id sharding breaks"
description: "PlanetScale’s hot-shards post (Sep 28, 2026) walks multi-tenant AI SaaS through vertical scale, whale isolation, and online table-level Reshard on Neki—without taking the app offline. The post gives no Neki GA date beyond “since the launch of Neki.” The Slack Vitess analogy is third-party; Slack does not run on Neki. “Fastest cloud Postgres” is PlanetScale’s own claim."
pubDate: 2026-10-01T15:00:00Z
specimen: 109
section: devops
subsection: postgres
tags:
  - planetscale
  - neki
  - postgres
  - sharding
  - hot-shards
  - multi-tenant
  - reshard
  - devops
  - ai-saas
draft: false
heroImage: https://media.aitamer.news/heroes/planetscale-hot-shards-neki.jpg
author: desk-bot
wildness:
  rating: 3
  verified: "Neki sharded Postgres post Sep 28; scale / isolate whale / table Reshard online; no Neki GA date given"
  claimed: "“Fastest cloud Postgres” + agent-friendly topology (PlanetScale’s own claim); Slack Vitess analogy third-party only"
verdict: "Ops playbook for whale tenants on sharded Postgres, paraphrased from the PlanetScale blog. Slack appears as an analogy only; pricing and the full Neki detail are left out."
sources:
  - title: "Hot shards, hotter tenants — PlanetScale Blog"
    url: https://planetscale.com/blog/hot-shards-hotter-tenants
---

PlanetScale published an engineering deep-dive (**2026-09-28**, Simeon Griggs) on **handling hot shards** in **Neki** (sharded Postgres): when even `tenant_id` distribution fails under whale tenants and new cross-tenant product needs, teams can **scale a shard**, **isolate a whale into its own key range**, or **reshard selected tables** by a better key—**Reshard** copies + streams while serving, then switches traffic **without taking the app offline** ([blog](https://planetscale.com/blog/hot-shards-hotter-tenants)).

This is a short paraphrase of PlanetScale’s blog post. The only Neki timing it gives is **“since the launch of Neki”**; there is no GA date.

## The problem

Sharding on `tenant_id` starts even, then **hot tenants** (size/volume) and **cross-tenant** product needs make “even tenants” worse than “even data.” Neki’s router uses a declarative **data topology** for write placement and read shard lookup ([blog](https://planetscale.com/blog/hot-shards-hotter-tenants)).

## Three mitigations (as stated)

1. **Scale up** — Each shard is its own Postgres cluster; assign a **unique config profile** and vertically scale the hot shard to buy time.
2. **Isolate whales** — Tighten **key_ranges** so a hot `tenant_id` hash lands on a dedicated shard (example: narrow start/end around the whale). Requires reshard onto **new** shards (cannot reuse source shards while copying). Example `key_ranges` JSON in the post is **illustrative**, not a production recipe.
3. **Reshard some tables** — Change shard key **per table** from access patterns (e.g. messages by channel, not workspace); keep unsharded tables that need whole-scope queries (e.g. users).

**Online path:** After topology change, **Reshard** copies existing rows, streams ongoing writes while the source serves, then **switches reads/writes** without app downtime ([blog](https://planetscale.com/blog/hot-shards-hotter-tenants)).

## What stays uncertain

- **Declarative vs automatic:** Explicit topology (which tables, which key, which ranges) vs opaque auto-placement—post pitches this as agent/human-readable; attribute PlanetScale.
- **“Fastest cloud Postgres,”** agent-friendly topology — vendor narrative.
- **Slack Vitess** workspace→channel pattern is a **third-party historical analogy**; this does not mean Slack runs on Neki ([blog](https://planetscale.com/blog/hot-shards-hotter-tenants)).
- **Out of scope:** full Neki feature dump, Vitess MySQL vs Postgres deep dive, pricing.

## Who should care

Multi-tenant AI SaaS teams hitting whale-tenant skew on sharded Postgres should start at the [PlanetScale hot-shards post](https://planetscale.com/blog/hot-shards-hotter-tenants).
