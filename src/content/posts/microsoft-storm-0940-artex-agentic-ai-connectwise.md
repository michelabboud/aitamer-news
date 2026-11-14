---
title: "Microsoft: Storm-0940 used the ARTEX AI agent framework to turn the ConnectWise breach into a tenant sweep"
description: "Microsoft says a China-aligned group used ARTEX agents after the ConnectWise Cloud Backup breach, trying 2,250+ Microsoft 365 tenants. What to check."
pubDate: "2026-10-22T11:07:00Z"
specimen: 979
updatedDate: "2026-11-14T07:40:00Z"
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
  - title: "CrowdStrike: VAPOR PANDA Uses AI-Driven ARTEX to Scale a Global Espionage Campaign (29 October 2026)"
    url: https://www.crowdstrike.com/en-us/blog/vapor-panda-uses-artex-to-scale-global-campaign/
  - title: "FBI FLASH-20261113-001: Threat overview of ARTEX autonomous penetration testing framework (13 November 2026)"
    url: https://www.ic3.gov/CSA/2026/261113.pdf
  - title: "AWS Security Blog: Amazon Threat Intelligence observes threat actors running cybercrime campaigns with ARTEX AI agents"
    url: https://aws.amazon.com/blogs/security/amazon-threat-intelligence-observes-threat-actors-running-cybercrime-campaigns-with-artex-ai-agents/
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

## Update, 30 October 2026: CrowdStrike sees a second China-nexus group using ARTEX

CrowdStrike [reported on 29 October](https://www.crowdstrike.com/en-us/blog/vapor-panda-uses-artex-to-scale-global-campaign/) that a group it tracks as VAPOR PANDA has also been running ARTEX, in a campaign it says is separate from the Storm-0940 activity above. Both attributions are the vendors' own assessments.

According to CrowdStrike:

- From 17 October, a single ARTEX controller it links to VAPOR PANDA was used against more than 200 organizations in at least 14 countries over 11 days, including foreign ministries in Latin America, Europe, Asia and the Middle East and US semiconductor, defense and think tank organizations.
- The agents ran mainly on DeepSeek, with a second subscription-based commercial model CrowdStrike could not identify. One intrusion's planning agents used on the order of 1.4 billion input tokens.
- A human operator stayed in the loop, issuing instructions in Chinese. In one case the operator told the agents to find Windows machines without the CrowdStrike Falcon sensor.
- The agents chained an unsigned SAML assertion with an XXE flaw to reach a cloud metadata service, and in another case reused authentication keys from a 2022 mail-server export that had likely never been rotated.

CrowdStrike reads this as a sign that ARTEX is spreading among several China-nexus groups. It recommends that defenders rotate signing keys and service credentials after any suspected exposure, including keys in old backups and directory exports; enforce SAML signature validation and IMDSv2; keep cloud roles' command permissions narrow; and hunt for `artx` or `artex` command-line strings, `artx`-prefixed cloud roles and the `C:\ProgramData\artx5v\` directory. The full IOC list is in CrowdStrike's post.

## Update, 14 November 2026: the FBI issues a FLASH on ARTEX, and Amazon sees credential-theft campaigns

The FBI has published [FLASH-20261113-001](https://www.ic3.gov/CSA/2026/261113.pdf), a TLP:CLEAR alert on ARTEX. It describes ARTEX as an open-source, LLM-driven agent platform written in Go that has been used "since at least August 2026" against financial services, government, technology, defense, healthcare and other sectors, with "some intrusions progressing from initial targeting to privileged access in under three hours." The FBI says ARTEX ships no model of its own and calls external providers, naming Anthropic Claude, OpenAI GPT, DeepSeek, GLM, Grok and Kimi, and that DeepSeek Flash models dominate the attacker instances analysed. It notes the original developer took the GitHub repository down on 8 October, but forks, mirrors and a commercial "ARTEX PRO" keep it available, and that researchers counted more than 1,600 publicly exposed ARTEX consoles in early November. The alert lists the ConnectWise Cloud Backup compromise covered above among the notable campaigns.

Separately, [Amazon Threat Intelligence](https://aws.amazon.com/blogs/security/amazon-threat-intelligence-observes-threat-actors-running-cybercrime-campaigns-with-artex-ai-agents/) says its MadPot decoys, set up to look like LLM inference APIs, received requests from ARTEX agents between 3 October and 5 November that carried the agents' own campaign records. The largest campaign stole AI model credentials and fed them back into the framework's model gateway to pay for more hunting. Targets included LLM gateways and app builders such as LiteLLM, One API, Dify, Langflow, Open WebUI and Ollama. Another campaign tried to beat crypto-exchange identity checks with real-time deepfakes; Amazon says the vendor's server-side check rejected every attempt the agents recorded. Amazon attributes the activity to Chinese-nexus groups with moderate confidence and says it cannot verify the outcomes the agents reported. If you run any of those gateways on the internet, check that the admin interface is not exposed and rotate the provider keys it holds.
