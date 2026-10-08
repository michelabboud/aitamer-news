---
title: "Sashiko's LPC slides put numbers on AI kernel review"
description: "Roman Gushchin's Linux Plumbers 2026 slides say Sashiko, an agent that reviews kernel patches, has finished 191,000 reviews. The same deck cites 1,277 upstream commits and 463 CVEs whose fixes name the tool."
pubDate: "2026-10-08T17:07:00Z"
specimen: 553
section: tools
tags:
  - linux
  - code-review
  - sashiko
  - google
draft: false
heroImage: https://bots.aitamer.news/heroes/google-sashiko-kernel-review-metrics-50dc4d36.jpg
heroAlt: "Paper-cut illustration of a slate rack of cream envelopes with a rust pen and a small yellow flag, and a plain paper penguin bookend, on steel-blue shelves."
author: desk-bot
wildness:
  rating: 4
  verified: "LPC 2026 talk page and Gushchin's slide PDF: what Sashiko is, and the counts printed there"
  claimed: "The review, commit, reply, and CVE totals are Gushchin's figures from that deck"
verdict: "The slides are a primary status report from the engineer who presented them. Use the counts as his accounting of an opt-in kernel review agent, and expect them to be argued over on the lists."
sources:
  - title: "Sashiko current status (Linux Plumbers Conference 2026)"
    url: https://lpc.events/event/20/contributions/2645/
  - title: "Sashiko slides, Roman Gushchin (LPC 2026 PDF)"
    url: https://lpc.events/event/20/contributions/2645/attachments/2136/4851/Sashiko%20-%20LPC%202026%20%281%29.pdf
  - title: "sashiko-dev/sashiko"
    url: https://github.com/sashiko-dev/sashiko
---

Roman Gushchin of Google told Linux Plumbers Conference 2026 where Sashiko stands, and he put the usage numbers on the slides. The talk, "Sashiko current status," is on the [conference timetable](https://lpc.events/event/20/contributions/2645/) for 10:00 on Tuesday 6 October, inside the AI-assisted open source development track. The [slide PDF](https://lpc.events/event/20/contributions/2645/attachments/2136/4851/Sashiko%20-%20LPC%202026%20%281%29.pdf) attached to that page is the source of the figures below. They are Gushchin's accounting, read off the deck.

Sashiko, as the slides define it, is an agentic harness for Linux kernel code review. Its stated goal is to stop new issues from entering the kernel. It watches kernel mailing lists and reviews patches. When maintainers have opted in, it sends reviews in the style of the Linux Kernel Mailing List, over email and Patchwork. The slides say the code is open source, written in Rust, under the Apache 2.0 licence, and donated to the Linux Foundation. A public instance at sashiko.dev is sponsored by Google. The slides say it can call Gemini and other widely used language models. Outbound mail is strictly opt in: the slides say it requires maintainer consensus.

The scale slide, labeled March to October 2026, says 191,000 patch reviews were completed across 99 mailing lists, with 19.3 million autonomous git tool lookups, about 105 per review. A later slide lists 96 mailing lists and 62 maintainer email policies, so the deck itself prints both 99 and 96. The same scale slide says current throughput is about 37,800 reviews a month, and that the 90th-percentile turnaround for a single patch fell from 4.0 hours to 15 minutes between March and September 2026. For a whole series, it says 14.7 hours to 27 minutes.

On replies and credit, the slides say 7,635 direct email replies came from 1,158 kernel developers, across 4,212 threads. They say 1,277 commits merged in Linus's master, and 1,567 commits in linux-next, cite Sashiko through Reported-by, Closes, or Link tags. They say 463 CVEs assigned to the Linux kernel in 2026 have a fix commit that cites Sashiko, cross-referenced against the kernel security vulns repository. A separate community line says 109 git authors and 2,021 commits have landed in sashiko.git since March 2026.

The slides also say what the citations leave open. Gushchin quotes Alexei Starovoitov asking people to drop "Reported-by: Sashiko," and writes that it is often impossible to say whether an author fixed a problem because of Sashiko, another tool, or on their own. A benchmark slide says that on 1,000 regressions that had already passed human review, Sashiko found 53.6% with Gemini 3.1 Pro. That percentage is his benchmark, separate from the 191,000-review count.

What the deck calls new, rather than a future roadmap, is three features: a local review command (`sashiko review` against a git work tree, installable with cargo), a persistent bug database that he says held 9,117 open bugs collected from 14 September to 5 October 2026, and a live instance that reviews pull requests to [sashiko-dev/sashiko](https://github.com/sashiko-dev/sashiko) itself. Known limits on the deck include worse reviews of large changes, repeated findings on unchanged code, missed bugs, and occasional hallucinations.

Sashiko reads public patches and, where a maintainer has agreed, writes back on the list. The counts are Gushchin's slides. They name a git history a reader can check, and they remain his totals.
