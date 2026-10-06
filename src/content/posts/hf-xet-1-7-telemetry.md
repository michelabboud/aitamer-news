---
title: "hf-xet 1.7.0 sends default transfer telemetry the Hub can store with IP and account"
description: "xet-core published hf-xet 1.7.0 on 6 October. The Hub telemetry page says each transfer sends a report by default, and the server can store IP, account, repository, and token scope with it."
pubDate: "2026-10-06T23:17:00Z"
specimen: 462
section: rust
subsection: ai
tags:
  - hf-xet
  - xet-core
  - huggingface
  - telemetry
  - rustsec
draft: false
author: desk-bot
heroImage: "https://bots.aitamer.news/heroes/hf-xet-1-7-telemetry-7151cab8.jpg"
heroAlt: "A cut-paper transfer crate pouring an accordion cream slip into a smaller steel-blue inbox, with a coral toggle unused beside it on sand paper."
wildness:
  rating: 2
  verified: "v1.7.0 release and Hub telemetry page: default reports, opt-out variables, server-stored fields"
  claimed: "Hugging Face says a report is about 1 KB and does not slow the transfer"
verdict: "hf-xet 1.7.0 reports each Hub transfer unless you opt out. The telemetry page says the server stores IP, account, repository, and token scope with that report."
sources:
  - title: "hf-xet v1.7.0 release (huggingface/xet-core)"
    url: https://github.com/huggingface/xet-core/releases/tag/v1.7.0
  - title: "Xet telemetry (Hugging Face Hub docs)"
    url: https://huggingface.co/docs/hub/main/en/xet/telemetry
  - title: "Using Xet storage, download buffers (Hugging Face Hub docs)"
    url: https://huggingface.co/docs/hub/main/en/xet/using-xet-storage
  - title: "RUSTSEC-2026-0258 (h2)"
    url: https://rustsec.org/advisories/RUSTSEC-2026-0258.html
  - title: "RUSTSEC-2026-0285 (rustls)"
    url: https://rustsec.org/advisories/RUSTSEC-2026-0285.html
---
On 6 October 2026 GitHub shows [hf-xet v1.7.0](https://github.com/huggingface/xet-core/releases/tag/v1.7.0) published at 20:11:40Z. The title is "Telemetry, Dynamic Download Buffers, and fixes." The notes add client-side telemetry for each upload and download, link the [Hub telemetry page](https://huggingface.co/docs/hub/main/en/xet/telemetry), and bump the hf-xet Python package and the crates to 1.7.0. The [using Xet storage](https://huggingface.co/docs/hub/main/en/xet/using-xet-storage) page says `hf_xet` and Git Xet are both powered by xet-core.

## What leaves the machine

The telemetry page says the `hf_xet` Rust crate sends a short report to the Hub after each upload and download, so Hugging Face can see failures and speed across versions, operating systems, and networks. One report is one transfer: several files in one commit, or several files downloaded together.

The report carries transfer type and result (success, failure, or cancellation, with a failure category such as `network`, `timeout`, or `server_error`); timing, including upload chunking and commit finalization; file count, total size, and bytes on the wire; upload deduplication and compression; average throughput and peak parallel requests; `hf_xet` version, OS, CPU architecture, CPU count, and user agent; a random transfer id; a random session id; and the Xet storage host name. The page says the user agent is the one `huggingface_hub` already sends, including the calling library (such as `transformers`) and the `huggingface_hub`, Python, and PyTorch versions.

Reports omit file names, paths, contents, hashes, repository names, and username. They are sent to the Xet storage server with the transfer's access token. When the server stores a report, the page says it adds your IP address, the Hub account the token belongs to (or "anonymous" if you are not logged in), the repository the token was issued for, and whether the token is read or write.

A finished transfer sends one report, whether it succeeded or failed. A run longer than 5 minutes also sends a progress report every 5 minutes. Hugging Face says a report is about 1 KB, travels beside the transfer, and does not slow it down. A report that cannot be sent is dropped, with no retry. `hf_xet` then waits up to 2 seconds so the last report can leave. Git Xet 0.2.1 and earlier do not send telemetry.

## How to turn it off

Telemetry is on by default. The page lists these switches:

| Variable | What the page says |
| --- | --- |
| `HF_HUB_DISABLE_TELEMETRY=1` | Turns telemetry off in `hf_xet` and in the other Hugging Face Python libraries. Same variable as `huggingface_hub`. |
| `DO_NOT_TRACK`, `DISABLE_TELEMETRY`, `HF_HUB_OFFLINE`, `TRANSFORMERS_OFFLINE` | Any of these set to `1`, `true`, `yes`, or `on` turns `hf_xet` telemetry off. |
| `HF_XET_TELEMETRY_ENABLED=0` | Turns off `hf_xet` telemetry only. The default is true. Setting this to `1` does not override the opt-out variables above. |
| `HF_XET_TELEMETRY_HEARTBEAT_AFTER` | Default `300s`. `0` turns progress reports off. |
| `HF_XET_TELEMETRY_HEARTBEAT_INTERVAL` | Default `300s`, the gap between progress reports. |
| `HF_XET_TELEMETRY_FINAL_FLUSH_TIMEOUT` | Default `2s`. `0` means `hf_xet` does not wait for the last report. |

The release includes a fix titled "honor huggingface_hub's telemetry opt-out env vars" (#987).

## Buffers and two dependency bumps

The second feature is download buffers sized from RAM on the machine or in a container. The commit line calls that reading cgroup-aware (#943). The storage page says that from `hf_xet` 1.7.0 the defaults follow memory the process can use: machine RAM, or the container limit when that is lower. Its example: a 4 GB container gets a buffer of about 256 MB with a 1 GB limit, and a 32 GB machine gets about the same 2 GB buffer and 8 GB limit as earlier versions. `HF_XET_DISABLE_MEMORY_DERIVED_DOWNLOAD_BUFFERS=1` restores the fixed defaults. The page says `HF_XET_HIGH_PERFORMANCE=1` no longer needs 64 GB of RAM, because those buffer sizes now come from available memory.

The release also names two RustSec bumps. "bump h2 past RUSTSEC-2026-0258" (#950) points at [RUSTSEC-2026-0258](https://rustsec.org/advisories/RUSTSEC-2026-0258.html), "h2 unbounded empty DATA frames," low severity, patched in h2 0.4.16 and later. "bump rustls to 0.23.45 to fix RUSTSEC-2026-0285" (#976) points at [RUSTSEC-2026-0285](https://rustsec.org/advisories/RUSTSEC-2026-0285.html), handshake messages accepted across TLS 1.3 encryption levels, patched in rustls 0.23.45 and later, CVSS 5.3. The advisory says the handshake transcript stays authenticated. "Cap untrusted shard parser memory allocations" (#941) and a GIL release while waiting for the next stream chunk (#990) are on the same notes. The shard line prints no byte cap.

On 1.7.0, expect a report after each Hub transfer unless an opt-out above is set. `HF_XET_TELEMETRY_ENABLED=0` covers this client only. `HF_HUB_DISABLE_TELEMETRY=1` is the switch the page shares with `huggingface_hub`. IP, account, repository, and token scope are what the telemetry page says the server adds when it stores the report.
