---
title: Journald Can Drop Messages During a Log Burst
description: A burst of voice worker errors can exceed journald’s per-service limit. Learn how its interval, burst and disk rules affect what an incident log can prove.
pubDate: "2026-10-10T04:30:00Z"
specimen: 606
section: devops
tags:
  - journald
  - logging
  - reliability
  - voice-applications
draft: false
heroImage: https://media.aitamer.news/heroes/journald-can-drop-messages-during-a-log-burst-00c9d44f.jpg
heroAlt: A paper funnel archives some blue messages but spills rust overflow beside a counting bead strand.
author: ari
wildness:
  rating: 1
  verified: journald rate limits per service, adjusts the effective burst for disk space, and reports dropped messages.
  claimed: No claim of lossless storage or measured drop frequency.
verdict: Check for drop notices and service overrides before reading a gap as recovery; reconcile critical voice failures against a separate durable count.
sources:
  - title: systemd journald.conf manual
    url: https://raw.githubusercontent.com/systemd/systemd/main/man/journald.conf.xml
---

A voice transcription worker can fail in a tight loop: each rejected audio chunk produces an error, and a single request generates hundreds of lines. An operator opens the journal and sees only the beginning of the failure. A gap in the journal cannot establish that the worker stopped emitting lines; journald may have dropped them.

The [journald configuration manual](https://raw.githubusercontent.com/systemd/systemd/main/man/journald.conf.xml) defines `RateLimitIntervalSec=` as the window and `RateLimitBurst=` as the number of messages a service may log within it. Once that service exceeds the effective burst, journald drops further messages until the interval ends and generates a message reporting the number dropped. The limit is applied per service, so an unrelated API process does not consume the voice worker's allowance. A unit's `LogRateLimitIntervalSec=` or `LogRateLimitBurst=` settings can override the journal-wide values for that service.

There is an easy trap in treating `RateLimitBurst=` as a fixed ceiling. The manual says journald multiplies the effective limit by a factor derived from free space available to the journal. Two hosts with the same configuration can therefore admit different bursts. Setting either rate-limit value to zero disables this rate limiting, but that change alone cannot make logging lossless. Storage mode and capacity still matter: `Storage=volatile` keeps the journal under `/run/log/journal`, while `Storage=none` drops stored entries. The `SystemMaxUse=` and `RuntimeMaxUse=` limits constrain persistent and volatile journal space respectively; journald removes archived files when reclaiming space, leaving less history to inspect.

For an incident review, look for journald's dropped-message notice before interpreting a quiet interval as an application recovery. Record the worker's configured unit overrides, journal storage mode and available space alongside the timestamps. If every rejected audio chunk must be accounted for, use an application-level count or durable event path with its own delivery guarantees, then reconcile that count with the journal. Treat the journal as operational evidence whose completeness has conditions, especially during the very burst that prompted the investigation.
