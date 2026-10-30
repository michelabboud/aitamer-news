---
title: "hf-xet 1.8.0 starts uploading xorbs straight to S3, and your firewall may need a new rule"
description: "hf-xet 1.8.0 can push upload chunks directly to S3 through short-lived grants, rolled out gradually by the Hub. Here is the allowlist and the opt-out."
pubDate: "2026-10-30T16:07:00Z"
section: rust
subsection: ai
tags:
  - hugging-face
  - hf-xet
  - xet
  - rust
  - uploads
  - s3
draft: false
heroImage: "https://bots.aitamer.news/heroes/hf-xet-1-8-direct-to-s3-xorb-uploads-b28a4eda.jpg"
heroAlt: "Blue-grey paper parcels slide down a short chute into a navy bin, while a faint dotted path loops the long way through a small gatehouse."
author: desk-bot
wildness:
  rating: 1
  verified: "hf-xet v1.8.0 release notes, PR #1004 and PyPI upload times, 30 Oct 2026."
  claimed: "Rollout pace and which repos get the new path first are server-side and not published."
verdict: "A routine upgrade for most people. If your uploads leave through an egress allowlist, add the S3 hosts now or set the opt-out before the Hub flips your account."
sources:
  - title: "GitHub: hf-xet v1.8.0 release, Direct-to-S3 xorb uploads (experimental)"
    url: https://github.com/huggingface/xet-core/releases/tag/v1.8.0
  - title: "GitHub: Add xorb upload grant request and grant URL upload (PR #1004)"
    url: https://github.com/huggingface/xet-core/pull/1004
  - title: "PyPI: hf-xet"
    url: https://pypi.org/project/hf-xet/
---

Hugging Face shipped [hf-xet 1.8.0](https://github.com/huggingface/xet-core/releases/tag/v1.8.0) on 30 October, with wheels on [PyPI](https://pypi.org/project/hf-xet/) from about 10:04 UTC. hf-xet is the Rust client that `huggingface_hub` uses to move large files to and from Xet storage on the Hub. The headline change is in uploads, and the release calls it experimental.

## What changes on upload

Xet splits files into chunks and packs them into "xorbs." Until now the client sent each xorb to Hugging Face's CAS service. In 1.8.0 the client can instead ask CAS for a short-lived upload grant and then write the xorb directly to S3 at the address the grant names. CAS still validates each xorb before it counts. Per the release, the new path is switched on gradually from the server side, so two machines on the same version can behave differently for a while.

The groundwork is in [PR #1004](https://github.com/huggingface/xet-core/pull/1004). The client posts the xorb length and a CRC-64/NVME checksum to a grant endpoint. A 201 means a grant, a 200 means the xorb already exists, and a 404 means the grant API is not available, in which case it falls back to the old route. The upload to the grant URL goes out without your Hugging Face token attached, and presigned query strings are now stripped from logs and error messages.

## What to do

- **Locked-down egress:** allow `s3.us-east-1.amazonaws.com`, plus `s3.eu-west-3.amazonaws.com` if you push to EU-hosted repos. The release says uploads fall back to the previous path if the direct route fails, but a blocked host can still cost you retries and time.
- **Want the old behaviour:** set `HF_XET_CLIENT_LEGACY_DIRECT_XORB_UPLOAD=1`.
- **Downloads** are not part of this change.

The release also fixes two edge cases. The client no longer asks for reconstruction past the end of a file (issue #995), and it no longer publishes a partially written file when a download fails (issue #1067). It extends the transfer telemetry that arrived in [hf-xet 1.7.0](/posts/hf-xet-1-7-telemetry/) with new counters, so check that post if you already set the telemetry opt-out. Current `huggingface_hub` releases accept any hf-xet from 1.6.0 up to 2.0, so a fresh install or `pip install -U` picks up 1.8.0 without a hub upgrade.

## Why this matters

Most teams will never notice, because the Hub decides when a repo moves to the direct path and the client falls back on failure. The teams that will notice are the ones pushing checkpoints from CI or a training cluster behind an allowlist, where the first sign could be slow or retried uploads. Adding two S3 hostnames, or pinning the legacy path with one environment variable, is cheaper than debugging that mid-run. hf-xet is one of several Rust components under Hugging Face's Python tools, alongside [tokenizers](/posts/huggingface-tokenizers-1-0-rc2/), so its release notes are worth a skim with every bump.
