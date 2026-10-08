---
title: DNS Can Cache the Absence of a Name
description: Creating a DNS record for a new voice endpoint does not clear earlier negative answers. Learn how NXDOMAIN, NODATA and SOA-derived lifetimes affect rollout checks.
pubDate: "2026-10-08T23:30:00Z"
specimen: 510
section: devops
tags:
  - dns
  - negative-caching
  - service-rollout
  - voice-applications
draft: false
heroImage: https://media.aitamer.news/heroes/dns-can-cache-the-absence-of-a-name-30acbdec.jpg
heroAlt: A new teal name card waits beside an empty slot whose cached blue flap remains closed under a paper hourglass.
author: ari
wildness:
  rating: 1
  verified: RFC 2308 defines cacheable NXDOMAIN/NODATA answers and an SOA-derived negative TTL.
  claimed: The voice endpoint and 900/300-second SOA values are illustrative, not observed.
verdict: When a new voice endpoint appears absent, compare the application resolver with the authoritative server and allow for the SOA-derived negative lifetime.
sources:
  - title: "RFC 2308: Negative Caching of DNS Queries"
    url: https://www.rfc-editor.org/rfc/rfc2308.html
---

Suppose a team brings up `ingest.voice.example` for a speech transcription service. A client looks it up before the record exists and receives `NXDOMAIN`. The team then creates the record and verifies it at the authoritative name server. Some clients still fail. That sequence can be normal DNS behavior: a recursive resolver may remember the earlier answer that the name did not exist.

[The DNS negative caching specification](https://www.rfc-editor.org/rfc/rfc2308.html) distinguishes `NXDOMAIN`, which says the queried name does not exist, from `NODATA`, which says the name exists but has no record of the requested type. A missing A record for an existing name is therefore different from a missing name. The distinction matters during a rollout that adds IPv4, IPv6, or a separate hostname: the cached answers are associated with different queries.

For a cacheable negative answer, the authoritative server includes its zone's start of authority record, usually called the SOA, in the response's authority section. The negative lifetime starts at the smaller of the SOA record's own time to live and its MINIMUM field. If those values are 900 and 300 seconds, respectively, the initial negative time to live is 300 seconds. A resolver that cached the answer earlier can continue returning it until its remaining lifetime reaches zero, even after the authoritative server knows the new address. The record's new positive time to live does not retroactively shorten that earlier negative entry.

That 300-second example is a protocol calculation, not a promise that every client waits exactly five minutes. A resolver can impose a shorter cache limit; a client can also use another resolver or hold its own result. The specification says negative answers without an SOA should not be cached because they lack the countdown needed for safe reuse. An intermittent lookup failure also has causes beyond negative caching, so the response code and authority section matter more than the elapsed time alone.

When introducing a new endpoint for an AI voice application, query the exact hostname and record type through the resolver the application uses, then compare that answer with the authoritative server's answer. If the former still returns a negative response, inspect the SOA and its remaining time to live. Plan the rollout around the negative cache lifetime, and make connection retries tolerate the period between record creation and cache expiry.
