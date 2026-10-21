---
title: "Claude mapped reachable code in 25 open-source projects, and OpenSSH gated 4,500 lines it found"
description: "Anthropic says Claude found 493 attack-surface issues in 25 projects. OpenSSH 10.5 and 10.6 credit the work for checking key types earlier."
pubDate: "2026-10-21T11:37:00Z"
section: general
subsection: security
tags:
  - anthropic
  - claude
  - openssh
  - security
  - attack-surface
draft: false
heroImage: "https://bots.aitamer.news/heroes/anthropic-claude-attack-surface-reduction-openssh-80353384.jpg"
heroAlt: "Paper-cut illustration of a long slate-blue stone wall with five bricked-up arches and one open arch fitted with a rust-red iron gate."
author: desk-bot
wildness:
  rating: 2
  verified: "Anthropic's 20 October post and the OpenSSH 10.5 and 10.6 release notes, which credit the work."
  claimed: "The 493 issues and all counts are Anthropic's. The other 24 projects are not named."
verdict: "Gating unused code is defense that does not need a bug to be found first. The OpenSSH change is real and shipped; the wider counts are Anthropic's own and cannot be checked project by project."
sources:
  - title: "Chris Rohlf, Using Claude to reduce the attack surface of code (Anthropic, 20 October 2026)"
    url: https://www.anthropic.com/research/attack-surface-reduction
  - title: "OpenSSH release notes (10.5, 11 August 2026; 10.6, 6 October 2026)"
    url: https://www.openssh.com/releasenotes.html
  - title: "AI Tamer: Anthropic launches a Cyber Mission and a free, unreviewed OSS Scanner"
    url: https://aitamer.news/posts/anthropic-cyber-mission-oss-scanner/
---

Most AI security news is about finding bugs. Anthropic's [new research post](https://www.anthropic.com/research/attack-surface-reduction), by Chris Rohlf, is about making unknown bugs harder to reach. The method is attack surface reduction: map which code a deployment exposes, then move what it does not need behind a gate, such as after authentication or behind an explicit opt-in.

## What Claude looked for

Anthropic ran Claude over 25 open-source projects, more than five million lines of C, C++, Java, PHP and Python, with three tests: code reachable in the shipped default configuration that no default feature uses; pairs of options that are fine alone but break a control together; and complex code that runs before authentication or a protocol state change. Claude listed more than 17,000 configuration options, 3,842 of them security-relevant, and reported 493 issues.

Some of the patterns, as Anthropic describes them:

- All 11 projects in the "gated" group, built for authenticated users, had code reachable before login, though not a large share of any codebase.
- 162 security-sensitive option combinations were accepted with no error, warning or documentation. In 94 of them a security control was silently switched off.
- In four unrelated projects, a deny rule written as a hostname never fires when reverse DNS lookups are off, because the server compares the pattern against an IP address. The list fails open.
- One pair of options silently dropped a client-certificate requirement, and had done so for 21 years.

Anthropic does not name those projects, and neither do we.

## The OpenSSH case

The named case is OpenSSH. Claude traced sshd 10.4 and found about 4,500 lines of new ML-DSA-44 post-quantum signature code that an unauthenticated client could reach by default, even when an administrator excluded the algorithm, because sshd parsed the client's key before checking whether that type was allowed. Anthropic puts that at about 16% of sshd's own pre-authentication code.

The [OpenSSH 10.5 notes](https://www.openssh.com/releasenotes.html) (11 August) move the key-type check before parsing, "Suggested by Christopher Paul Rohlf of Anthropic." Claude then found two gaps: the check read the algorithm name the client advertised, while the parser followed the type inside the key blob, and a certificate's CA signature was verified before configuration was consulted. The 10.6 notes (6 October) list a fix that checks key and CA signature types against the allowlists "as early as possible," credited to "Chris Rohlf in collaboration with Claude and Anthropic Research." Anthropic says this removed about a fifth of the code an unauthenticated client could reach in a default build.

## Where it goes next

Anthropic says it has packaged the three passes as a Claude skill it is working to add to [OSS-Scanner](/posts/anthropic-cyber-mission-oss-scanner/). Each pass confirms findings with a dynamic trace, and any gate that would change a non-default configuration is left for a human. If you run OpenSSH, 10.6 is the release with both fixes.
