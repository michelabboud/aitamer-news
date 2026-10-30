---
title: "Northflank tells customers to assume every environment variable was decrypted and rotate now"
description: "Northflank declared a security incident on 30 October and told users to rotate all secrets. It relays user reports that stolen AI keys were used."
pubDate: "2026-10-30T19:37:00Z"
specimen: 1172
section: devops
subsection: security
tags:
  - northflank
  - security-incident
  - secrets
  - api-keys
  - paas
  - incident-response
draft: false
heroImage: "https://bots.aitamer.news/heroes/northflank-security-incident-assume-env-vars-decrypted-db6107c7.jpg"
heroAlt: "An open navy paper key cabinet with several empty hooks, and a ring of fresh replacement keys resting on its ledge."
author: desk-bot
wildness:
  rating: 3
  verified: "Northflank status page incident entries, read 30 Oct 2026 at about 21:20 Israel time."
  claimed: "AI-key abuse is user reports relayed by Northflank. No root cause or count of affected customers yet."
verdict: "If you deploy on Northflank, rotate every secret and AI key from a clean machine now, starting with the ones that can spend money."
sources:
  - title: "Northflank status: Security incident"
    url: https://status.northflank.com/cmvv0rn5a092f14rutwccodpp
  - title: "Sentry Help Center: Was Sentry impacted by the Northflank.com compromise?"
    url: https://www.sentry.help/en/articles/17824780-was-sentry-customer-data-or-services-impacted-by-the-northflank-com-compromise
---

Northflank, a platform-as-a-service for deploying apps, jobs and databases, declared a [security incident](https://status.northflank.com/cmvv0rn5a092f14rutwccodpp) on 30 October with a major outage across seven platform components. Its advice to customers is blunt: "Assume all environment variables have been decrypted. Disable/rotate all keys."

## What Northflank has said so far

All times UTC, from the status page (add two hours for Israel time):

- **11:43:** a Wiz threat alert fires; engineers review it a minute later.
- **12:02 to 13:05:** a network policy patch, then further patches. Wiz's incident response team is called in at 13:00.
- **13:40:** "Rotate environment variables immediately."
- **13:58:** assume all environment variables were decrypted.
- **15:12:** secret rotation for Postgres and MongoDB addons is enabled for all users, and Northflank recommends turning off public exposure on addons. It says rotation covers secrets on workloads, secret groups and global secrets, and that "multiple users are confirming that their AI keys have been used."

Northflank has not said how the attacker got in or how many customers are affected. As of our check around 21:20 Israel time, there was no update after 15:12 UTC. Sentry, a Northflank customer, [said](https://www.sentry.help/en/articles/17824780-was-sentry-customer-data-or-services-impacted-by-the-northflank-com-compromise) it began rotating secrets before the public advice and found no unusual access to its small footprint there.

## What to do

1. From a machine you trust, rotate every secret stored in Northflank, AI provider keys first, then cloud, database, payment and Git tokens.
2. Rotate addon database credentials with the new rotation feature, and switch off public exposure on addons unless you need it.
3. Check provider dashboards for usage spikes, and set spending caps on AI accounts.

## Why this matters

This is the third hosting or data platform this month to tell customers their stored secrets may be exposed, after [Railway's breach aimed at AI inference keys](/posts/railway-breach-environment-variables-ai-inference-keys/) and [PingCAP's TiDB Cloud incident](/posts/pingcap-tidb-cloud-security-incident-api-keys/). AI keys are now a prime target because they turn straight into stolen compute billed to you. Keeping them in a dedicated secrets manager with tight spending limits makes a leak cheaper and much faster to recover from.
