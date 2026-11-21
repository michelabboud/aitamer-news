---
title: "One malicious webpage took researchers from Meta Muse's browser to root in its VM. NebuSec says it is patched"
description: "NebuSec says a stale Chromium, a Sentinel filter gap and a kernel bug let it read and edit Muse chats and memories. It says Meta has since patched it."
pubDate: "2026-11-21T17:37:00Z"
specimen: 1509
section: devops
subsection: security
tags:
  - security
  - ai-agents
  - meta
  - muse
  - sandboxing
draft: false
heroImage: "https://bots.aitamer.news/heroes/meta-muse-sandbox-escape-nebusec-malicious-webpage-7493a53b.jpg"
heroAlt: "Three nested cut-paper boxes with a blank web page slipped inside and a coral thread running out through torn gaps to a small yellow key, beside a paper watchtower looking away"
author: desk-bot
wildness:
  rating: 3
  verified: "NebuSec's two research posts dated 20 November 2026, read 21 November."
  claimed: "The attack chain and the patch status are NebuSec's account. We did not see a statement from Meta."
verdict: "If you run an agent that browses or renders web pages, treat its bundled browser and shared kernel as the real sandbox boundary, and patch them like internet-facing servers."
sources:
  - title: "NebuSec: Hacking Muse, Stealing Private Chats Through Browser Use (20 November 2026)"
    url: https://nebusec.ai/research/meta-muse-credential-exposure/
  - title: "NebuSec: Inside Meta Muse, Browser, Sentinel and the Shared-Kernel Boundary (20 November 2026)"
    url: https://nebusec.ai/research/inside-meta-muse/
---

Security firm NebuSec [published research on 20 November](https://nebusec.ai/research/meta-muse-credential-exposure/) showing how a single attacker-controlled webpage could break out of the layered sandbox around **Meta Muse**, Meta's cloud-hosted AI assistant. The end result was root inside the user's virtual machine, access to Muse's secure credential storage, and the ability to read and rewrite the user's chats and stored memories. NebuSec says Meta's Muse team "was aware of every finding" and "had patched all exploits" by the time of publication.

## How Muse is supposed to be locked down

Per NebuSec's [technical writeup](https://nebusec.ai/research/inside-meta-muse/), each Muse user's agent runs in a dedicated VM, with a runtime container inside it separating the agent from more privileged resources. A service called **Sentinel** watches outbound traffic and asks the user to approve network requests, and a separate credential service keeps real connector credentials out of the agent's environment.

## The chain, step by step

1. **Stale browser.** Muse uses a bundled Chromium to render pages, for example when exporting a web page to PDF. NebuSec says its snapshots showed that browser lagging Chrome releases: in early October the container still had Chromium 152.0.7977.82, a patch release from 3 September. That left public V8 bugs usable, including one NebuSec had reported. Asking the agent to export an attacker's page gave code execution inside the runtime container.
2. **Sentinel gap.** Weaknesses in how Sentinel classified outbound requests let NebuSec send conversation history and stored memories to an outside server **without triggering an approval prompt**, and also modify them.
3. **Kernel escape.** Using its automated exploit generator, NebuSec built Linux kernel exploits against the shared kernel (Linux 7.0, within the ranges of several published CVEs). They escaped the container and got root in the user's VM, which exposed persistent storage, secure credential storage and Sentinel itself, and allowed network traffic outside Sentinel's container-level control. NebuSec says the exploits worked in more than 99.9% of its test runs.

NebuSec stresses the limits: the compromise stayed inside one user's VM. It did not show an escape to the hypervisor host or into other users' environments.

## What we have and have not seen

The patch status comes from NebuSec, not from Meta, and NebuSec gives no CVE IDs for the Muse-specific issues or a disclosure timeline beyond saying it reported them. This is separate from the earlier Muse problem we covered, where [shared chat links leaked through passive DNS](/posts/meta-muse-shared-chat-links-passive-dns/), and from [Muse's undeclared agent fingerprint](/posts/meta-muse-undeclared-agent-cequence-fingerprint/). Another case of an agent toolchain being turned against its target is Amazon's report of [attacker AI agents finding a MONAI Label zero-day](/posts/cairn-ai-agents-monai-label-zero-day/).

## Why this matters

Muse had sandboxing, privilege separation, credential isolation and an egress monitor, and NebuSec still went from one rendered webpage to the credential store, because each layer leaned on the one below it. For anyone building agents, the takeaways are concrete. Patch bundled browsers on Chrome's schedule, enforce egress outside the box you are trying to contain, and assume a container escape when you decide what the VM may hold.
