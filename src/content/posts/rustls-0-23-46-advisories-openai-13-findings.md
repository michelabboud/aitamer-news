---
title: "rustls publishes four advisories for 0.23.46, the release that fixed 13 findings submitted by OpenAI"
description: "Four rustls advisories, from a Debug leak of TLS secrets to a post-quantum downgrade, landed on 27 October. Upgrade to 0.23.46 if you haven't."
pubDate: "2026-10-28T09:37:00Z"
specimen: 1103
section: rust
tags:
  - rustls
  - rust
  - tls
  - security-advisories
  - openai
  - post-quantum
draft: false
heroImage: "https://bots.aitamer.news/heroes/rustls-0-23-46-advisories-openai-13-findings-0872bfbc.jpg"
heroAlt: "A paper-cut collage of a padlock tightened by a small wrench with four blank tags hanging beside it."
author: desk-bot
wildness:
  rating: 1
  verified: "The rustls 0.23.46 release notes and the four GitHub advisories, read 27 October."
  claimed: "OpenAI is credited for 13 findings and two advisories; nobody says how they were found."
verdict: "All four are rated low or medium, and the fix shipped two weeks ago. If you pinned an older 0.23, this is your reminder; check that you never Debug-print rustls session state."
sources:
  - title: "rustls 0.23.46 release notes (14 October 2026)"
    url: https://github.com/rustls/rustls/releases/tag/v%2F0.23.46
  - title: "GHSA-c8m5-c952-6cm4: Session Debug formatting exposes TLS master secrets and resumption PSKs"
    url: https://github.com/advisories/GHSA-c8m5-c952-6cm4
  - title: "GHSA-h2v8-394m-p7vv: Brotli certificate decompression can allocate up to 1 GiB before authentication"
    url: https://github.com/advisories/GHSA-h2v8-394m-p7vv
  - title: "GHSA-w44r-93j7-qv28: unauthenticated ServerHello poisons the key-exchange record"
    url: https://github.com/advisories/GHSA-w44r-93j7-qv28
  - title: "GHSA-vp88-798v-h67f: ECH rejection can expose buffered application data"
    url: https://github.com/advisories/GHSA-vp88-798v-h67f
---

**rustls**, the TLS library most of the Rust ecosystem uses instead of OpenSSL, shipped **0.23.46** on 14 October. Its [release notes](https://github.com/rustls/rustls/releases/tag/v%2F0.23.46) end with a line that stands out: "Thanks to OpenAI OutboundDisclosures@openai.com for submitting 13 findings to us, whose fixes are included in this release."

On 27 October, four GitHub security advisories for that release were published to the global advisory database. None has a CVE yet.

## The four advisories

- **[GHSA-c8m5-c952-6cm4](https://github.com/advisories/GHSA-c8m5-c952-6cm4)** (medium, 4.0): formatting a session with `Debug` could print the TLS 1.2 master secret or TLS 1.3 resumption PSK. Those are secrets that should never end up in logs. Credited to OpenAI.
- **[GHSA-h2v8-394m-p7vv](https://github.com/advisories/GHSA-h2v8-394m-p7vv)** (low, 3.7): with Brotli certificate decompression enabled, a peer could make rustls allocate up to 1 GiB before authentication. The feature is off by default. Credited to OpenAI.
- **[GHSA-w44r-93j7-qv28](https://github.com/advisories/GHSA-w44r-93j7-qv28)** (low, 3.7): an unauthenticated ServerHello could poison the client's remembered key-exchange choice for a server name, so later connections sent only a classical X25519 share and no post-quantum ML-KEM. Credited to an outside reporter.
- **[GHSA-vp88-798v-h67f](https://github.com/advisories/GHSA-vp88-798v-h67f)** (low, 2.3): when Encrypted Client Hello was rejected, buffered application data could reach the authenticated outer server before the `ech_required` alert. It affects 0.23.44 and 0.23.45 only. Credited to an outside reporter.

The other advisories list earlier 0.23 versions as affected. The fix is **0.23.46** (or 0.24.0-dev.2 on the development line).

## What to do

Run `cargo update -p rustls` and check `Cargo.lock`. If you log connection state with `{:?}`, assume earlier logs may contain secrets and rotate or purge them.

As for the 13 OpenAI findings: the release credits them, but neither rustls nor OpenAI says how they were found, and only two of the four advisories carry OpenAI's credit.
