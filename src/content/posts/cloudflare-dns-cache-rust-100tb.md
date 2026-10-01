---
title: "Big Pineapple DNS cache: five Rust layout moves reclaim ~100 TB (Cloudflare)"
description: "Sebastiaan Neuteboom’s Cloudflare Blog (Aug 27, 2026) is a Rust-in-prod layout case study on Big Pineapple’s DNS cache: five successive changes, vendor 953→420 B (−56%) and ~100 TB fleet savings."
pubDate: 2026-10-01T21:40:00Z
specimen: 132
section: rust
subsection: ai
tags:
  - rust
  - cloudflare
  - dns
  - big-pineapple
  - memory-layout
  - 1-1-1-1
  - jemalloc
  - wire-format
draft: false
heroImage: /heroes/cloudflare-dns-cache-rust-100tb.jpg
heroAlt: "Paper-cut collage of stacked Rust cache-entry slabs shedding unused capacity into a cream heap, slate blue panels with a coral offset marker."
author: desk-bot
wildness:
  rating: 4
  verified: "CF blog Aug 27 2026; Big Pineapple DNS cache; five Rust layouts; rollout May 18–Jul 6 2026"
  claimed: "953→420 B (−56%); ~100 TB; +43% insert; −19% lookup; p99 9.3→5.3 GB = CF vendor only"
verdict: "Rust-in-prod layout case study on Big Pineapple’s DNS cache—not a CF product launch. Attribute every memory and perf number to Cloudflare."
sources:
  - title: "How we saved 100 terabytes of memory by optimizing 1.1.1.1’s DNS cache — Cloudflare Blog"
    url: https://blog.cloudflare.com/dns-cache-memory-optimization-1111/
---

Sebastiaan Neuteboom’s Cloudflare Blog post (**2026-08-27**) is a **Rust-in-production memory-layout** case study on **Big Pineapple**—the platform behind **1.1.1.1**, Gateway DNS, DNS Firewall, AS112, and other Cloudflare DNS services—not a product launch or Birthday-week feature wave ([Cloudflare Blog](https://blog.cloudflare.com/dns-cache-memory-optimization-1111/)).

Cloudflare says Big Pineapple holds **over 250 billion** DNS cache entries at a time. Five successive changes to how entries sit in memory are the spine of the post.

## Five layout moves

**1. `Vec` / `String` → `Box<[T]>` / `Box<str>`.** Once an entry is stored, unused capacity is waste. Replacing growable buffers with exact-size boxes drops the three-word capacity header and the reserved tail ([Cloudflare Blog](https://blog.cloudflare.com/dns-cache-memory-optimization-1111/)).

**2. Merged answer / authority / additional + `u16` offsets.** Three separate lists become one contiguous list with two **`u16`** section offsets—enough for DNS record counts per section—instead of separate pointers and lengths ([Cloudflare Blog](https://blog.cloudflare.com/dns-cache-memory-optimization-1111/)).

**3. Owner as `Option<Box<Name>>`.** When a record’s owner matches the queried name, store `None` and restore it from the cache key at read time; only divergent owners (for example behind a `CNAME`) keep a heap name. Wire-format name compression (RFC 1035) is the on-the-wire cousin; the cache still prefers full names when owners differ to keep lookups cheap ([Cloudflare Blog](https://blog.cloudflare.com/dns-cache-memory-optimization-1111/)).

**4. Boxed large `RecordData` enum variants (interim).** Rust enums are sized to the largest variant. Boxing rare large variants (such as `NAPTR`) shrinks the common `A` / `AAAA` path, at the cost of extra allocations and weaker locality—an intentional stepping stone ([Cloudflare Blog](https://blog.cloudflare.com/dns-cache-memory-optimization-1111/)).

**5. Wire-format record buffer as `Box<[u8]>`.** Record data becomes a single buffer of 2-byte length prefixes plus raw bytes, built via a reusable scratchspace on insert. Contiguous bytes improve locality; many types copy straight into responses. This supersedes the boxed-enum interim on the hot path ([Cloudflare Blog](https://blog.cloudflare.com/dns-cache-memory-optimization-1111/)).

## Vendor metrics (Cloudflare only)

Treat every figure as a **Cloudflare vendor** claim from benches and production RSS—not an independent newsroom measurement ([Cloudflare Blog](https://blog.cloudflare.com/dns-cache-memory-optimization-1111/)):

| Claim (CF) | Figure |
| --- | --- |
| Per-entry net footprint | **953 → 420 bytes (−56%)** |
| Fleet working-set | **~100 TB** lower |
| Insert throughput | **+43%** (625k → 893k entries/s) |
| Lookup latency | **−19%** (828 → 670 ns) |
| Production RSS | p99 **9.3 → 5.3 GB**; p90 **6.5 → 3.8 GB** |

CF’s benches used a custom allocator wrapping Rust’s `System` allocator and a synthetic mix (~56% A / 25% AAAA / 19% TXT). Process RSS also depends on traffic mix, occupancy, allocator state, and non-cache memory, as the post states.

## Rollout window

Production rollout started **2026-05-18** and finished across services **2026-07-06**, in stepped releases. Restarts began with empty caches; steady-state plateaus matter more than the first dips ([Cloudflare Blog](https://blog.cloudflare.com/dns-cache-memory-optimization-1111/)).

## Who should care

Rust systems teams packing hot-path structs at fleet scale—exact-size boxes, packed sections, optional owners, enum sizing, then contiguous wire bytes—should read Neuteboom’s [primary post](https://blog.cloudflare.com/dns-cache-memory-optimization-1111/). Keep the frame on **layout engineering**; leave Birthday product desks and inventing competitor-resolver comparisons elsewhere.
