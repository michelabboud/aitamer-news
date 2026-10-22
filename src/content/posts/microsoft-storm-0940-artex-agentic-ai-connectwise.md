---
title: "Microsoft: Storm-0940 used the ARTEX AI agent framework to turn the ConnectWise breach into a tenant sweep"
description: "Microsoft says a China-aligned group used ARTEX agents after the ConnectWise Cloud Backup breach, trying 2,250+ Microsoft 365 tenants. What to check."
pubDate: "2026-10-22T11:07:00Z"
specimen: 979
section: devops
subsection: security
tags:
  - security
  - microsoft
  - ai-agents
  - supply-chain
  - microsoft-365
draft: false
heroImage: "https://bots.aitamer.news/heroes/microsoft-storm-0940-artex-agentic-ai-connectwise-c4382e3e.jpg"
heroAlt: "Paper-cut illustration of a backup vault door left ajar as a stream of identical keys rushes toward a long row of doors, a few already open, beside a small hourglass."
author: desk-bot
wildness:
  rating: 2
  verified: "Microsoft Threat Intelligence post (21 October) and ConnectWise's status page and advisory."
  claimed: "The Storm-0940 attribution and the ARTEX link are Microsoft's assessment; ConnectWise names no actor."
verdict: "If ConnectWise Cloud Backup was ever connected to your Microsoft 365 tenant, keep it disabled, preserve logs, and review its service principal activity from 1 October. Agent speed means the window between first alert and damage is short."
sources:
  - title: "Microsoft Security Blog: AI-driven, large-scale nation-state campaign using ARTEX enables supply chain compromise (21 October 2026)"
    url: https://www.microsoft.com/en-us/security/blog/2026/10/21/storm-0940-uses-artex-agentic-ai-connectwise-supply-chain-compromise/
  - title: "ConnectWise status: Cloud Backup issue investigation (from 16 October 2026)"
    url: https://status.connectwise.com/pages/incident/619cf82551fec9053d612f09/6ad263692dc48705ab3da2cb
  - title: "ConnectWise Trust Center advisories: Cloud Backup service interruption (updated 22 October 2026)"
    url: https://www.connectwise.com/company/trust/advisories
---

[Microsoft Threat Intelligence](https://www.microsoft.com/en-us/security/blog/2026/10/21/storm-0940-uses-artex-agentic-ai-connectwise-supply-chain-compromise/) says a group it tracks as Storm-0940, which it calls China-state aligned, has used ARTEX, an agentic AI penetration-testing framework, to automate attacks on hundreds of organizations since as early as September. Microsoft also assesses that Storm-0940 was behind the recent compromise of ConnectWise Cloud Backup, a multi-tenant app with access to customers' Microsoft 365 environments.

## What Microsoft says happened

- **A password spray first.** Between 10 and 14 October, one address sprayed 327 accounts at eight organizations: over 151,000 failed logons, peaking at 2,900 failures a minute on 11 October. Microsoft saw no successful sign-in from that run.
- **Then the backup app.** [ConnectWise](https://status.connectwise.com/pages/incident/619cf82551fec9053d612f09/6ad263692dc48705ab3da2cb) reported unauthorized access attempts on 16 October and, on 17 October, unauthorized access to application identities in Cloud Backup, so it shut off the app's access. Microsoft says ConnectWise's indicators matched the spray's network range.
- **Then a sweep.** With the stolen app identities, Microsoft says, ARTEX tried to sign in to more than 2,250 tenants at 2,900 attempts a minute. Because the app was already trusted, no user had to sign in.
- **Follow-on work in some tenants.** In some environments the agents ran Microsoft Graph reconnaissance, added app credentials for persistence, and changed identities, groups and privileged roles. In several cases, Microsoft says, initial targeting to privileged cloud access took under three hours.

Microsoft stresses that an affected app, or even a successful sign-in, does not by itself mean data was taken. ConnectWise says it has no indication that backup data was compromised.

## What ARTEX is

Microsoft describes ARTEX as an open-source multi-agent LLM framework, written in Go with a Next.js front end, that can use any AI model and run a pen test from reconnaissance to exfiltration with little human input. Its interface switches between English, Korean, Mandarin, Spanish and Japanese. ARTEX was already named in the [South Korean bank intrusions](/posts/south-korea-bank-intrusions-ai-tool/), after which its developer said it would no longer be open source.

## What to do if you used ConnectWise Cloud Backup

Microsoft's list, in short:

1. Keep the ConnectWise app connections disabled until ConnectWise publishes restoration steps. Its [advisory](https://www.connectwise.com/company/trust/advisories) says phased restoration will take several days.
2. Do not delete the enterprise applications first. Preserve Entra sign-in and audit logs and Purview records.
3. Search every tenant by application ID, not display name, including tenants where the integration is no longer used.
4. Review service principal sign-ins from at least 15 October, and back to 1 October where logs allow.
5. Look for new app credentials, owners, consent grants, privileged role assignments and Conditional Access changes. Rotate credentials once you confirm anything suspicious.

The wider lesson from Microsoft's account is speed: an agent does not stop at night, so alerts that a human team would handle the next morning can arrive after the damage is done.
