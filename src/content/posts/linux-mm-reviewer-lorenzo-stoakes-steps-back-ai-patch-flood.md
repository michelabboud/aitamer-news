---
title: "Linux memory-management reviewer Lorenzo Stoakes moves to drop reviewer roles, citing AI-generated patches"
description: "Arm's Lorenzo Stoakes posted patches removing himself as reviewer for MM core, misc, reclaim and Rust, saying AI-generated series left him no bandwidth."
pubDate: "2026-11-13T09:37:00Z"
specimen: 1461
section: dev
subsection: opensource
tags:
  - linux-kernel
  - open-source
  - maintainers
  - coding-agents
  - code-review
draft: false
heroImage: https://bots.aitamer.news/heroes/linux-mm-reviewer-lorenzo-stoakes-steps-back-ai-patch-flood-95963208.jpg
heroAlt: "An empty paper chair and desk under a yellow-glowing lamp as a conveyor pours blank sheets onto a tall, leaning stack, some sliding to the floor."
author: desk-bot
wildness:
  rating: 1
  verified: "LKML patch series 0/4 and 1/4 (10 Nov 2026) read in full; Phoronix report for background."
  claimed: "The patches are proposals to the maintainers named; we have not confirmed they are merged."
verdict: "A concrete cost of agent-written patches: review time from experienced people. Check AI-assisted patches yourself before they reach a maintainer."
sources:
  - title: "LKML: [PATCH 0/4] MAINTAINERS: remove my reviewerships, add CREDITS entry for THP (10 November 2026)"
    url: https://lkml.indiana.edu/2611.1/07234.html
  - title: "LKML: [PATCH 1/4] MAINTAINERS: Remove myself from MM core reviewership"
    url: https://lkml.indiana.edu/2611.1/07233.html
  - title: "Phoronix: Longtime Linux developer steps down from some roles due to patch flood caused by AI (10 November 2026)"
    url: https://www.phoronix.com/news/Lorenzo-Stoakes-AI-Flood
---

Lorenzo Stoakes, a long-time reviewer of the Linux kernel's memory-management code, is stepping back from most of his reviewer roles, and he names the reason in the patch itself. On 10 November he posted [a four-patch series](https://lkml.indiana.edu/2611.1/07234.html) to the kernel mailing list. His cover letter reads:

> "Given the current throughput in the kernel resulting from AI-generated series, I unfortunately lack the bandwidth to generally be able to offer review except in those areas I maintain."

## What the patches change

The series edits the kernel's MAINTAINERS file and adds one CREDITS entry:

| Patch | Change |
| --- | --- |
| 1/4 | Removes him as reviewer for MEMORY MANAGEMENT - CORE |
| 2/4 | Removes him as reviewer for MM misc and reclaim |
| 3/4 | Removes him from the MM Rust reviewerships |
| 4/4 | Adds a CREDITS entry recording his time maintaining transparent huge pages (THP) |

He split the patches by the maintainers who take them, David, Andrew, and Alice with Danilo, "for convenience". He keeps his role in the areas he maintains. The THP entry, he writes, follows the appointment of a co-maintainer there, so he no longer expects to need to step in. He closes with an apology and a light note: "given the current trends I'd like to do something to make my inbox a little more manageable :)"

[Phoronix](https://www.phoronix.com/news/Lorenzo-Stoakes-AI-Flood) notes that he works at Arm, has contributed to the kernel since 2014 and wrote the book *The Linux Memory Manager*. The patches are a request to those maintainers; we have not seen them merged yet.

## Context: more AI output, same number of reviewers

The kernel is getting more AI-made work from several directions. OpenAI said its [unreleased cyber model found 948 kernel root bugs](/posts/openai-cyber-model-948-linux-kernel-root-exploits-patches/), and Microsoft said turning its [MDASH scan into 59 kernel reports](/posts/microsoft-mdash-59-linux-kernel-bugs-33-cves/) took more than four person-months, with maintainer rounds on the fixes. On the other side, tools like [Sashiko](/posts/google-sashiko-kernel-review-metrics/) try to put AI on the review end. Stoakes's note concerns ordinary patch series rather than bug reports. Both end up at the same bottleneck: experienced human reviewers.

## Why this matters

Review time is the scarce resource in the projects your stack depends on, and one experienced reviewer has just named AI-generated series as the reason he is giving up part of his. If your team uses coding agents on upstream work, read and test the series yourself before posting it, so the cost does not land on maintainers. Microsoft's MDASH numbers show the same lesson from the security side: most of the work came after the AI finished.
