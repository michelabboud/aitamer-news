---
title: A Redis Eviction Policy Decides Which Writes Can Fail
description: Redis memory pressure can evict a cache key or reject a write. Choose the policy by deciding which data may disappear and how the application handles a full instance.
pubDate: "2026-10-09T19:30:00Z"
section: devops
tags:
  - redis
  - caching
  - memory-management
  - ai-applications
draft: false
heroImage: https://media.aitamer.news/heroes/a-redis-eviction-policy-decides-which-writes-can-fail-1497e7a1.jpg
heroAlt: A full paper tray has a tabbed teal tile lifted out while an untagged navy tile meets a closed rust crossbar.
author: ari
wildness:
  rating: 1
  verified: Redis documents noeviction, all-keys and expiring-key policy behavior at maxmemory.
  claimed: The voice assistant key layout is an illustrative design, not a measured deployment.
verdict: Define which keys may disappear before setting maxmemory-policy. Separate disposable cache from recovery state where possible, and handle rejected writes.
sources:
  - title: Redis key eviction
    url: https://redis.io/docs/latest/develop/reference/eviction/
---

A voice assistant might keep replayable audio snippets beside the cursor that records where a conversation will resume. Both are Redis keys, but losing them has different consequences. Once the instance reaches its configured `maxmemory`, the eviction policy decides whether Redis removes a key or refuses a memory-growing command. That policy is part of the application’s failure behavior.

### Draw the eviction boundary

With `noeviction`, Redis retains keys and returns an error for commands that need to add data after the limit is reached. Reads of existing data continue. This protects the conversation cursor from eviction, but a new cursor or cache write can fail. The application must check the write reply and have a recovery path; merely choosing `noeviction` cannot create capacity.

`allkeys-lru` and `allkeys-lfu` let Redis reclaim space from any key. LRU favors recently accessed keys; LFU favors frequently accessed keys, with older frequency decaying over time. Both are approximations. They fit a cache whose entries can be rebuilt, such as generated snippet previews. On a shared instance, a cursor without an expiry is still eligible for eviction under an all-keys policy. Persistence settings do not change that selection rule. [Redis’s eviction guide](https://redis.io/docs/latest/develop/reference/eviction/) describes the policy families and their eligibility rules.

The `volatile-lru` and `volatile-lfu` variants consider only keys with an expiry. If snippets have a time to live and cursors do not, those policies keep cursors outside the eviction pool. That boundary depends on correct TTL assignment: an accidental expiry makes a cursor eligible, while cache entries without expiry cannot be reclaimed by the policy. When no expiring keys are available, volatile policies behave like `noeviction` and growth writes can fail. `volatile-ttl` instead chooses eligible keys with the shortest remaining life.

### Check the pressure you actually have

Redis reports `evicted_keys`, `expired_keys`, cache hits and misses, and rejected commands through `INFO`. Look at those alongside application write errors. For policies that evict keys, replication and append-only-file update buffers are excluded from the memory compared with `maxmemory`. Redis recommends leaving RAM headroom for those buffers on replicated or persisted instances; the guide exempts `noeviction` from this recommendation.

For a new design, put rebuildable AI cache entries and recovery-critical conversation state on separate instances when practical. If they must share one, give every disposable entry a TTL, choose a volatile policy deliberately, and test both key survival and write-error handling at the memory limit.
