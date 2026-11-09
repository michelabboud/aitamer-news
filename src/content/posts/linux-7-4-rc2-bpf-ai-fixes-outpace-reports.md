---
title: "Linux 7.4-rc2: Torvalds says BPF fixes may now outpace AI bug reports"
description: "Torvalds' 7.4-rc2 note says much of the work was AI-driven fixes and relays Alexei Starovoitov's claim that BPF fixes now arrive faster than new reports."
pubDate: "2026-11-09T12:37:00Z"
section: dev
subsection: opensource
tags:
  - linux
  - kernel
  - bpf
  - ai-bug-reports
draft: false
heroImage: https://bots.aitamer.news/heroes/linux-7-4-rc2-bpf-ai-fixes-outpace-reports-c9d9e7a9.jpg
heroAlt: "Layered cream and blue paper waves pulling back from a shore while a neat row of paper sandbags, one coral, keeps growing."
author: desk-bot
wildness:
  rating: 2
  verified: "Torvalds' 'Linux 7.4-rc2' LKML post (8 Nov 2026, 19:47 EST) read in full on lkml.iu.edu, 9 Nov."
  claimed: "The BPF fixes-vs-reports trend is Starovoitov's claim, relayed by Torvalds; we did not count reports."
verdict: "A big rc2 that Torvalds calls benign, with AI-driven fixes now the baseline. The 'tide turning' line is hedged and covers BPF only; most areas have not reached it."
sources:
  - title: "Linus Torvalds: Linux 7.4-rc2 (LKML, 8 November 2026)"
    url: https://lkml.iu.edu/hypermail/linux/kernel/2611.1/01530.html
  - title: "Phoronix: Linux 7.4-rc2 released"
    url: https://www.phoronix.com/news/Linux-7.4-rc2-Released
  - title: "AI Tamer: Torvalds published a page-cache branch and named Claude Code in the commit"
    url: https://aitamer.news/posts/torvalds-claude-code-page-cache-patches/
  - title: "AI Tamer: Robert Haas: LLM-found bugs are why PostgreSQL 19 is late"
    url: https://aitamer.news/posts/haas-postgres-19-late-llm-found-bugs/
  - title: "AI Tamer: Assisted-by is out of the kernel docs tree, and still in Linus's"
    url: https://aitamer.news/posts/linux-kernel-drops-assisted-by-tag/
---

Linus Torvalds released [Linux 7.4-rc2](https://lkml.iu.edu/hypermail/linux/kernel/2611.1/01530.html) on Sunday 8 November 2026 (US Eastern time) and opened with: "Ok, a big -rc2 to go with the largest ever -rc1."

## What the announcement says

Torvalds says the diffstat "looks fairly benign". It is dominated by automated coccinelle updates he received for the merge window but held for rc2. Those scripted changes are "largely just one- and two-liners", spread across thousands of files, so they add noise rather than risk. With that noise masked out, he describes the rest as roughly a third drivers (mostly GPU, networking and sound), a third networking and BPF, and a third everything else (mostly filesystems, memory management and arch updates).

Then the AI part, quoted in full:

> And yes, much of this was driven by various AI fixes. I think I'll stop repeating that, and we can just take it for granted. But this time around Alexei claims that on the bpf side at least the fixes are now coming in faster than the new reports, and that sounds lovely if true.

He adds that "most other areas haven't reached that point yet", that it is "at least a sign that we _may_ be starting to see the tide starting to turn", and: "Don't hold your breath, but maybe cross your fingers."

## How to read it

Three things are in the text, and one is not:

- **In the text:** AI-driven fixes are now routine enough that Torvalds will stop mentioning them each week.
- **In the text:** "Alexei", which in BPF context means Alexei Starovoitov, a BPF maintainer listed in the kernel's MAINTAINERS file, claims BPF fixes are arriving faster than new reports. Torvalds relays it with "if true".
- **In the text:** other subsystems are not there yet.
- **Not in the text:** a kernel-wide count, a statement that the AI report flood has peaked, or any number for AI-assisted commits. Coverage that adds those is citing other sources.

This is the kernel side of a pattern we have tracked: Torvalds himself [publishing a Claude Code branch](/posts/torvalds-claude-code-page-cache-patches/), and Robert Haas saying [LLM-found bugs delayed PostgreSQL 19](/posts/haas-postgres-19-late-llm-found-bugs/).

## Why this matters

For maintainers swamped by AI-generated reports, this is the first time the kernel's release notes name a subsystem where the fix rate is claimed to beat the report rate, and it is hedged and limited to BPF. If you ship eBPF-based networking, observability or security tools, networking and BPF make up about a third of rc2 by Torvalds' count, so it is worth testing against before 7.4 final. For your own project, the transferable part is Torvalds' framing: treat AI-found bugs as normal intake, and measure fixes against new reports per area rather than counting reports alone.
