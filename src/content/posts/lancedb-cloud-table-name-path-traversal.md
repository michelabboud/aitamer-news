---
title: "LanceDB fixes a table-name path traversal in its Cloud client that could cross tenants"
description: "Before 0.40.0, LanceDB's Cloud client put table names into REST URLs unencoded, so a name with ../ could reach another table or tenant. Upgrade."
pubDate: "2026-10-24T11:37:00Z"
section: devops
subsection: rag
tags:
  - lancedb
  - vector-database
  - rag
  - security
  - rust
  - path-traversal
draft: false
heroImage: "https://bots.aitamer.news/heroes/lancedb-cloud-table-name-path-traversal-fbc8630a.jpg"
heroAlt: "A steel-blue paper cabinet with blank drawers, and a cream ribbon path that leaves one drawer, loops around past a coral arrow and enters another."
author: desk-bot
wildness:
  rating: 2
  verified: "Advisory GHSA-jw4x-p897-vx6q (22 October) and the lancedb 0.40.0 release on PyPI, read 24 October."
  claimed: "The severity score is the maintainers' own; there is no CVE yet and no report of exploitation."
verdict: "Moderate on paper, but it matters if your app lets users or an LLM pick table names on LanceDB Cloud. Upgrade to 0.40.0 and stop passing untrusted names through."
sources:
  - title: "Table name and namespace_path are interpolated into LanceDB Cloud REST URLs without validation or encoding (GHSA-jw4x-p897-vx6q)"
    url: https://github.com/lancedb/lancedb/security/advisories/GHSA-jw4x-p897-vx6q
  - title: "lancedb 0.40.0 (PyPI)"
    url: https://pypi.org/project/lancedb/0.40.0/
---

LanceDB has published an [advisory](https://github.com/lancedb/lancedb/security/advisories/GHSA-jw4x-p897-vx6q) for a bug in how its client talks to LanceDB Cloud. Table names, with any namespace prefix, went into the REST request path as-is, with no validation and no percent-encoding. A name containing `/`, `?` or `#` could change which route the request hit.

The advisory went up on 22 October. The fix shipped earlier, in version 0.40.0 on 7 October, for all three packages.

## Who is affected

| Package | Affected | Fixed |
| --- | --- | --- |
| `lancedb` (Rust crate) | below 0.40.0 | 0.40.0 |
| `lancedb` (PyPI) | below 0.40.0 | 0.40.0 |
| `@lancedb/lancedb` (npm) | below 0.40.0 | 0.40.0 |

Only the remote (Cloud) backend is affected. LanceDB already had a table-name validator, the advisory says, but it was applied to the embedded backend and not to the remote one. The URL builder sits in the Rust code at `rust/lancedb/src/remote/db.rs`, and the advisory lists all three packages as affected.

## What a bad name could do

The advisory's impact section is aimed at the shape most RAG and agent backends have: an app that opens, creates or drops a table by a name taken from user input or from an LLM. In that case, it says, the caller gets to choose which table and which API route the app's Cloud key is used against:

- **Cross-table access.** A name like `a/../../../v1/table/<victim>` returns a working handle, and every search, update or delete on it hits the victim table.
- **Tenant escape.** If you separate tenants with `namespace_path`, the library's own multi-tenancy feature, a crafted name can erase the prefix and reach another tenant's tables.
- **Wrong endpoint.** A call the app thinks is a describe can be steered to a drop.

Because the resulting URL is identical to a legitimate request, the server cannot tell the difference.

GitHub lists the issue as Moderate, 4.7 on CVSS v3, with "privileges required" rated high. The weaknesses listed are relative path traversal, improper output encoding and the confused deputy pattern. The reporter is credited as sajdakabir. No CVE is assigned yet.

## Practical takeaway

If you use LanceDB Cloud, upgrade the Rust crate, Python or Node package to 0.40.0 or later. Then check your code anyway: do not build table names from user or model text. Map user choices to an allowlist of table names you control, and keep tenant separation on the server side, not only in a name prefix.
