---
title: "Microsoft's AI kernel scan: 26,502 findings, 59 bug reports, 33 CVEs and 8 root exploits"
description: "Microsoft FORGE Lab's MDASH scan of Linux took two weeks. Turning it into 59 kernel reports took months, and the oldest bug was at least 21 years old."
pubDate: "2026-11-12T17:07:00Z"
section: general
subsection: security
tags:
  - linux-kernel
  - microsoft
  - vulnerability-research
  - ai-security
  - cve
draft: false
heroImage: https://bots.aitamer.news/heroes/microsoft-mdash-59-linux-kernel-bugs-33-cves-615b6457.jpg
heroAlt: "A wide paper funnel takes in a heap of tiny paper beetles and lets only a short line of yellow ones out onto a workbench with a wrench and thread."
author: desk-bot
wildness:
  rating: 2
  verified: "Microsoft Security Blog post (11 Nov 2026) read in full on 12 Nov; CSO Online summary."
  claimed: "All counts are Microsoft's. MDASH is a codename for an internal tool, not a product."
verdict: "AI can now find kernel bugs faster than people can fix them. Budget for triage, patches and maintainer time, not just for scanning."
sources:
  - title: "Microsoft Security Blog: Lessons from 59 Linux kernel bug reports (11 November 2026)"
    url: https://www.microsoft.com/en-us/security/blog/2026/11/11/lessons-from-59-linux-kernel-bug-reports/
  - title: "CSO Online: AI found Linux kernel bugs that remained undetected for decades (12 November 2026)"
    url: https://www.csoonline.com/article/4247815/ai-found-linux-kernel-bugs-that-remained-undetected-for-decades.html
---

Microsoft's FORGE Lab has published the numbers from an AI-assisted hunt through parts of the Linux kernel, and the headline is the funnel, not the bug count. Using a tool codenamed MDASH, [one full-time researcher and one intern](https://www.microsoft.com/en-us/security/blog/2026/11/11/lessons-from-59-linux-kernel-bug-reports/) scanned a subset of kernel subsystems from late May to mid-June 2026. The effort has produced 59 public upstream reports, 33 assigned CVEs and confirmed working root exploits for eight of them. Fixes for 38 reports are merged into mainline.

## From 26,502 findings to 59 reports

| Stage | Count |
| --- | --- |
| Raw findings, about two weeks on two servers | 26,502 |
| After automated screening | 11,769 |
| Cases backed by a proof of concept | 621 |
| Public upstream reports | 59 |

Of the 621 proof-of-concept cases, 266 shared a root cause with another case, 163 were dropped after review mostly for limited security impact, and 133 were already reported or fixed upstream. Microsoft says reporting the 59 took more than four person-months.

The kernel usually wants a working patch with a vulnerability report. Agents drafted first fixes, Microsoft writes, but human validation and rounds with maintainers were still essential. Half of the merged fixes landed on the first submission. From first public patch to a mainline release took a median of 41 days and up to 108.

## The bugs themselves

Most were old. The average bug was 8.1 years old when first reported, and a `cls_u32` shift-out-of-bounds bug (CVE-2026-74544) had been there for at least 21 years. Microsoft rates 24 of the 33 CVEs High or above on CVSS 3.1.

The eight root exploits cover IPv4 and IPv6 networking, IPsec routing, encrypted-key handling, the GTP tunnel driver and the shared `rhashtable` code. **Microsoft says some of them needed non-default settings or disabled exploit mitigations** in its lab. The exception it highlights is CVE-2026-64563 in `rhashtable`, which it says worked on standard kernels, without special configuration or user namespaces, and also affected Android with SELinux enforcing.

The report lands a week after OpenAI said its [unreleased cyber model found 948 Linux kernel root bugs](/posts/openai-cyber-model-948-linux-kernel-root-exploits-patches/), and follows the numbers [Sashiko put on AI kernel review](/posts/google-sashiko-kernel-review-metrics/) in October. Microsoft's own warning is blunt: it scanned only a small fraction of the kernel, and more tokens may find more bugs without making the system secure.

## Why this matters

Discovery is no longer the bottleneck for kernel security; validation, patches and maintainer review are. If you run Linux fleets, expect a steady stream of AI-found CVEs in old code paths and keep kernel update cadence short. If you run your own AI bug-hunting, plan for the person-months after the scan, because that is where Microsoft spent its time.
