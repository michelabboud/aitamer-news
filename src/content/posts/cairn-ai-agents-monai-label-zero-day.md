---
title: "AI agents found and used a zero-day on their own, Amazon says. The MONAI Label fix is still unreleased"
description: "Amazon says a China-linked actor's Cairn agents found a file-write zero-day in a medical imaging AI app in 11 minutes. MONAI Label has no fixed release yet."
pubDate: "2026-11-21T08:07:00Z"
section: devops
subsection: security
tags:
  - security
  - ai-agents
  - zero-day
  - vulnerability
  - open-source
draft: false
heroImage: "https://bots.aitamer.news/heroes/cairn-ai-agents-monai-label-zero-day-cb7d571a.jpg"
heroAlt: "Cut-paper illustration of stacked stone cairns marking a winding red trail up to a small cottage with a propped-open side window"
author: desk-bot
wildness:
  rating: 3
  verified: "Amazon Threat Intelligence's 20 November post, the MONAI Label GitHub advisory, fix PR #1915 and README PR #1940, and PyPI release data, all read 21 November."
  claimed: "Attribution to a Chinese-nexus actor is Amazon's, at moderate confidence. Amazon does not name the medical imaging application; the MONAI Label link comes from the matching advisory, which AWS reported."
verdict: "If you run MONAI Label, take it off any untrusted network and turn on authentication today: the path traversal is fixed only in source, not in a release."
sources:
  - title: "AWS Security Blog: Chinese-nexus actor's Cairn AI agents found a zero-day on their own (20 November 2026)"
    url: https://aws.amazon.com/blogs/security/chinese-nexus-actors-cairn-ai-agents-found-a-zero-day-on-their-own/
  - title: "MONAI Label: Path traversal in datastore upload endpoints allows arbitrary file write (GHSA-qc22-rmgc-vg94, 18 November 2026)"
    url: https://github.com/Project-MONAI/MONAILabel/security/advisories/GHSA-qc22-rmgc-vg94
  - title: "MONAI Label PR #1915: fix: confine datastore write paths"
    url: https://github.com/Project-MONAI/MONAILabel/pull/1915
  - title: "MONAI Label PR #1940: security warning against internet-facing deployments (merged 19 November 2026)"
    url: https://github.com/Project-MONAI/MONAILabel/pull/1940
  - title: "BleepingComputer: Hackers use autonomous AI tool Cairn to find zero-day, take over server (20 November 2026)"
    url: https://www.bleepingcomputer.com/news/security/hackers-use-autonomous-ai-tool-cairn-to-find-zero-day-take-over-server/
---

Amazon's threat intelligence team says it watched autonomous AI agents find a zero-day and use it to take root on a server, with the human operator giving little more than a goal: "obtain shell access." In a [post on 20 November](https://aws.amazon.com/blogs/security/chinese-nexus-actors-cairn-ai-agents-found-a-zero-day-on-their-own/), Amazon says it found the attacker's own instance of **Cairn**, an open-source autonomous penetration testing framework, running on the internet without authentication on 10 September. That left the whole operation visible: project settings, prompts and the agents' output.

## What the agents did

Amazon says the campaign hit universities in East Asia outside mainland China over about 48 hours from 8 September. It attributes it to a Chinese-nexus actor with moderate confidence, based on Simplified Chinese prompts, China Standard Time timestamps and the targets.

- **A Redis server with no authentication:** the agents spent about 16 hours and 148 actions trying to turn access into a shell. They also mapped an internal Docker network through an SSRF bug in a Qdrant instance next to it and sprayed credentials at PostgreSQL, SSH and other services. Nothing worked.
- **A university GPU server:** the agents built a list of about 80 real usernames from faculty pages, archives and papers, then tried more than 30,000 credential combinations over six hours. That failed too.
- **A medical imaging AI application:** the agents found an upload endpoint with a filename parameter, tested it for path traversal and, in about **11 minutes** from mapping the API, could write files anywhere. In a later session they wrote a Python reverse shell into `sitecustomize.py`, which Python loads at startup, then called a training endpoint to start a new Python process. The shell ran as root.

Amazon assesses with high confidence that the bug was a zero-day, since it found no fix, issue or advisory at the time. It also says the operator then gave the agents a proxy into a second university running the same software.

## The bug, and the missing release

Amazon does not name the application. The matching advisory, [GHSA-qc22-rmgc-vg94](https://github.com/Project-MONAI/MONAILabel/security/advisories/GHSA-qc22-rmgc-vg94) in **MONAI Label**, an open-source tool for labelling medical images with AI, was originally reported by AWS's vulnerability disclosure account, and [BleepingComputer](https://www.bleepingcomputer.com/news/security/hackers-use-autonomous-ai-tool-cairn-to-find-zero-day-take-over-server/) identifies the app as MONAI Label. The advisory, published 18 November and rated critical, says:

- `PUT /datastore/image` uses a caller-supplied `image` value as a file ID without checking it, so `../../../tmp/x` writes the upload outside the datastore. `PUT /datastore/label` has the same flaw.
- **Authentication is off by default** (`MONAI_LABEL_AUTH_ENABLE=False`), so anyone who can reach the server can exploit it. With authentication on, the `ANNOTATOR` role is enough.
- Versions up to **0.8.5** are affected. The fix, [PR #1915](https://github.com/Project-MONAI/MONAILabel/pull/1915), was merged on 19 October, but the advisory says it "will be included in the next MONAI Label release". On PyPI, 0.8.5, uploaded in November 2024, is still the newest version.

On 19 November the maintainers also [added a README warning](https://github.com/Project-MONAI/MONAILabel/pull/1940) that MONAI Label is not meant to face the internet and has "known, unpatched security issues". AI on the attacking side keeps showing up: [PHP2Shell](/posts/php2shell-php-rce-ai-found-exploited-before-disclosure/) was found with AI and probed before its patch, and the [Cisco Expressway](/posts/cisco-expressway-cve-2026-76466-exploited-after-poc/) attackers' scripts carried signs of an AI assistant.

## What to do

1. **Get MONAI Label off untrusted networks** and keep it on a closed LAN, as the maintainers now advise.
2. **Turn on authentication** and give the `ANNOTATOR` role only to trusted users.
3. **Run it as an unprivileged user** that can write only to the datastore, so a stray write cannot reach `sitecustomize.py` or system paths. If you must patch now, build from a commit that includes PR #1915.
4. **Check logs for the two IPs** Amazon lists from 8 to 10 September: `142.4.98.145` and `142.4.107.34`. Also look for unexpected `sitecustomize.py` files in your Python environments.

## Why this matters

The failures are as telling as the success: the agents ground away for 16 hours without a break, and the one soft target fell in 11 minutes, according to Amazon. Research and lab tools like MONAI Label often ship with authentication off and end up reachable from the internet, and this one still has no fixed release. Audit what your AI and data science tools expose, and do not count on a human attacker's working hours for time to respond.
