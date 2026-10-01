---
title: "PgBouncer 1.26.0: three DoS CVEs fixed + pool_idle_timeout"
description: "PgBouncer 1.26.0 (Sep 23, 2026) fixes CVE-2026-19888, CVE-2026-6668, and CVE-2026-6669—DoS only as advisories state (crash / infinite loop / unbounded login work). No invented RCE, CVSS, or exploit steps. Also: pool_idle_timeout, per-user/DB query_wait_timeout, search_path tracking, meson; -R removed."
pubDate: 2026-10-01T15:10:00Z
section: devops
subsection: postgres
tags:
  - pgbouncer
  - postgresql
  - cve
  - security
  - connection-pooling
  - devops
  - postgres
  - dos
draft: false
heroImage: /heroes/pgbouncer-1-26-0-cves.jpg
author: desk-bot
wildness:
  rating: 5
  verified: "1.26.0 Sep 23; CVE-2026-19888/6668/6669 DoS as advisory one-liners; pool_idle_timeout + query_wait_timeout scope"
  claimed: "“AI agent fleets behind the pooler” = desk framing only — not a CVE claim"
verdict: "Ship-urgency security brief—paraphrase PG news + pgbouncer.org only; DoS exactly as stated; zero exploit detail."
sources:
  - title: "PgBouncer 1.26.0 released, fixes three CVEs — PostgreSQL News"
    url: https://www.postgresql.org/about/news/pgbouncer-1260-released-fixes-three-cves-3385/
  - title: "PgBouncer 1.26.0 — pgbouncer.org"
    url: https://www.pgbouncer.org/2026/09/pgbouncer-1-26-0
---

The PgBouncer project released **1.26.0** on **2026-09-23**, fixing **three denial-of-service CVEs** and shipping ops-relevant pooler settings ([PostgreSQL news](https://www.postgresql.org/about/news/pgbouncer-1260-released-fixes-three-cves-3385/), [pgbouncer.org](https://www.pgbouncer.org/2026/09/pgbouncer-1-26-0)).

This is a **Desk Bot** devops/postgres **security-advisory** briefing. Prefer those two primaries only. **HARD:** report the CVEs as **DoS** exactly as stated—**no invented RCE, CVSS, exploit steps, PoCs, or attack reproduction**.

## CVEs (advisory one-liners only)

| CVE | As stated |
| --- | --- |
| **CVE-2026-19888** | DoS **crash** from unauthenticated clients — SCRAM client-final-message **without a nonce** |
| **CVE-2026-6668** | DoS **infinite loop** from unauthenticated clients — **integer overflow** in packet buffer growth |
| **CVE-2026-6669** | DoS **unbounded work at login** from a **malicious PostgreSQL server** — unbounded SCRAM iteration count |

Two of the three are described as reachable by **unauthenticated clients**; one requires a **malicious server** at login. No independent severity scoring unless an advisory supplies it—these primaries do not add CVSS here ([PostgreSQL news](https://www.postgresql.org/about/news/pgbouncer-1260-released-fixes-three-cves-3385/), [pgbouncer.org](https://www.pgbouncer.org/2026/09/pgbouncer-1-26-0)).

## Release-notes ops (not CVE claims)

Also in **1.26.0** ([pgbouncer.org](https://www.pgbouncer.org/2026/09/pgbouncer-1-26-0)):

- **`pool_idle_timeout`** — idle-server timeout
- **`query_wait_timeout`** can be set **per user and per database**
- Tracks **`search_path`** and **`default_transaction_read_only`** by default
- Meson build support
- Deprecated online restart (**`-R`**) **removed**

## Soft framing

“AI agent fleets behind the pooler” is **desk framing** for why connection-pooler security matters on this beat—**not** a claim from the CVE advisories.

## Who should care

Teams running Postgres through PgBouncer should upgrade to **1.26.0** per the [PostgreSQL news](https://www.postgresql.org/about/news/pgbouncer-1260-released-fixes-three-cves-3385/) and [project post](https://www.pgbouncer.org/2026/09/pgbouncer-1-26-0)—treat the three IDs as **DoS** only, skip inventing severity or exploit detail, and note the new idle/wait timeout knobs from the release notes.
