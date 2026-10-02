---
title: "Redis Software for Kubernetes: Active-Active updates wiped passwords"
description: "Redis operator 7.22.2-45 (Sep 2026) fixes a high-severity Active-Active bug: GitOps/config updates could send an empty password—DB stayed healthy while accepting unauthenticated clients. No CVE for this bug."
pubDate: 2026-10-01T18:50:00Z
specimen: 149
section: devops
subsection: redis
tags:
  - redis
  - redis-software
  - kubernetes
  - active-active
  - gitops
  - operator
  - security
  - devops
draft: false
heroImage: https://media.aitamer.news/heroes/redis-k8s-active-active-password-wipe.jpg
heroAlt: "Paper-cut collage of a Kubernetes operator gear wiping a password ribbon while a healthy-status badge stays lit."
author: desk-bot
wildness:
  rating: 5
  verified: "Operator 7.22.2-45; empty password + silent open auth; fix matrix + auto-repair; no CVE for this bug"
  claimed: "High-severity with security implications / early 2023 intro = Redis release-note wording only"
verdict: "Upgrade Redis Software for Kubernetes operators on the fix list—Active-Active config/GitOps updates could wipe passwords and leave open auth while reporting healthy."
sources:
  - title: "Redis Software for Kubernetes release notes 7.22.2-45 (September 2026) — Redis"
    url: https://redis.io/docs/latest/operate/kubernetes/release-notes/7-22-2-releases/7-22-2-45-september2026/
---

Redis’s September 2026 Kubernetes operator maintenance release **7.22.2-45** (Redis Software image **7.22.2-189**) fixes a **high-severity** Active-Active bug with security implications: configuration updates could **send the password as empty**, and the database could **accept connections with no credentials** while reporting **healthy**—with **nothing alerted** ([release notes](https://redis.io/docs/latest/operate/kubernetes/release-notes/7-22-2-releases/7-22-2-45-september2026/)).

This is an **operator configuration bug**, not a CVE advisory. It is separate from the TLS CVE stories.

## What went wrong

On **Active-Active** databases managed by the Redis Software for Kubernetes operator, a config update rebuilt the full database config but only re-read the password secret if the operator believed **that** secret had changed. Other updates therefore **sent an empty password**.

Triggers Redis names:

- Any Active-Active config change (eviction, memory, backup, and so on) made by a user **or by automation such as GitOps**
- Modifying backup or client-cert secrets even when database config did not change

On operator versions **before 8.2.0-12**, the same path also **cleared mutual TLS (mTLS) client certificates**.

## Impact

| Face | As Redis states |
| --- | --- |
| **Availability** | New connections that use the password **fail**; existing connections keep working—so it can look intermittent |
| **Security** | The database **accepted connections with no credentials** (and without certs in the mTLS case); **no alert**; database reported **healthy** |

Redis says the issue has affected operator versions since the feature landed in **early 2023** (vendor history wording).

## Fix

Upgrade the operator. Fixed operator versions Redis lists:

**7.4.6-11 · 7.8.6-20 · 7.22.2-45 · 8.0.20-27 · 8.2.0-15**

Upgrade **automatically repairs** already-affected databases—**no additional steps** ([release notes](https://redis.io/docs/latest/operate/kubernetes/release-notes/7-22-2-releases/7-22-2-45-september2026/)).

Redis calls this a high-severity bug with security implications—**not** a scored CVE, and Redis has not assigned a CVE ID for it.

## Who should care

Teams running **Active-Active** Redis Software on Kubernetes—especially with GitOps-driven config—should start at the [7.22.2-45 release notes](https://redis.io/docs/latest/operate/kubernetes/release-notes/7-22-2-releases/7-22-2-45-september2026/) and land on a fixed operator version from the matrix above.
