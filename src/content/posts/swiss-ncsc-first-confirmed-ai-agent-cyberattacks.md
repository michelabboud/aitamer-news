---
title: "Switzerland confirms its first cyberattacks run with AI agents, including breaches at critical infrastructure operators"
description: "Switzerland's NCSC says AI agents were used in five confirmed attacks, four of them successful. Two of three critical infrastructure targets were breached."
pubDate: "2026-11-27T15:46:00Z"
specimen: 1549
section: devops
subsection: security
tags:
  - security
  - ai-agents
  - critical-infrastructure
  - switzerland
  - incident-response
draft: false
heroImage: "https://bots.aitamer.news/heroes/swiss-ncsc-first-confirmed-ai-agent-cyberattacks-dfa9c0b1.jpg"
heroAlt: "Cut-paper scene of a hand holding up a yellow shield before a mountain dam wall, where a swarm of small paper insects has forced two of its many doors open beside power pylons"
author: desk-bot
wildness:
  rating: 2
  verified: "NCSC (BACS) advisory of 24 Nov and SRF's 26 Nov interview with its director, read 27 Nov 2026."
  claimed: "Counts are the director's and changed after the advisory. Victims and attackers are not named."
verdict: "This is a government confirming real, successful agent-driven intrusions, not a forecast. Patch internet-facing systems within a day, cut what is exposed, and put MFA in front of everything reachable."
sources:
  - title: "Swiss NCSC (BACS): Cyberattacks involving AI agents: First confirmed cases in Switzerland (24 November 2026)"
    url: https://www.bacs.admin.ch/en/26-ki-agenten-1-en
  - title: "SRF: Erstmals Cyberangriffe mit KI-Agenten in der Schweiz (26 November 2026)"
    url: https://www.srf.ch/news/schweiz/fuenf-bestaetigte-faelle-erstmals-cyberangriffe-mit-ki-agenten-in-der-schweiz
  - title: "Swissinfo: Switzerland reports first AI-enabled cyberattacks on critical infrastructure (26 November 2026)"
    url: https://www.swissinfo.ch/eng/swiss-ai/switzerland-reports-first-ai-based-cyberattacks-on-critical-infrastructure/92440400
  - title: "The Hacker News: Switzerland Confirms AI-Assisted Cyberattacks Breached Critical Infrastructure Operators (27 November 2026)"
    url: https://thehackernews.com/2026/11/switzerland-confirms-ai-assisted.html
  - title: "UK NCSC blog: Familiar weaknesses, exploited faster: defending against agentic cyber attacks (24 November 2026)"
    url: https://www.ncsc.gov.uk/blogs/familiar-weaknesses-exploited-faster-defending-against-agentic-cyber-attacks
---

Switzerland's National Cyber Security Centre (NCSC, known in German as BACS) has confirmed the country's first cyberattacks carried out with the help of AI agents. Its [advisory of 24 November](https://www.bacs.admin.ch/en/26-ki-agenten-1-en) says organisations and operators of critical infrastructure in at least two sectors were hit, and calls the cases "a shift in the cyber threat landscape".

## What the NCSC has confirmed

The advisory says the attackers used what it calls agentic offensive frameworks: AI agents that search for weaknesses, pick attack tools, judge the results and plan the next step on their own. According to the NCSC, such agents exploit things like default or easily guessed passwords and known flaws in internet-facing systems, find them in a fraction of the time a human would need, and can switch to other attack methods when defences react.

Two days later the agency's director, Florian Schütz, gave the first numbers to Swiss public broadcaster [SRF](https://www.srf.ch/news/schweiz/fuenf-bestaetigte-faelle-erstmals-cyberangriffe-mit-ki-agenten-in-der-schweiz). There are five confirmed cases so far, all reported in recent days, and systems were successfully compromised in four of them. According to [Swissinfo's report](https://www.swissinfo.ch/eng/swiss-ai/switzerland-reports-first-ai-based-cyberattacks-on-critical-infrastructure/92440400) on the interview, three of the attacks targeted critical infrastructure operators and two of those succeeded. Schütz said there were no major outages.

Note that the count moved. The 24 November advisory said every attack known to the NCSC at the time had succeeded; the interview gives four of five. Neither explains the change, and the numbers may shift again as more reports come in. The NCSC is not naming the victims, saying they have the right to speak for themselves, and it does not yet know who is behind the attacks.

## What it did and did not say about the tools

The advisory names ARTEX and CyberStrikeAI as examples of AI agents reachable over the internet and says the number of such agents has almost doubled since October. It does not say those tools were used in the Swiss cases. ARTEX already appeared in [Microsoft's Storm-0940 report](/posts/microsoft-storm-0940-artex-agentic-ai-connectwise/) in October.

Switzerland is not alone. India's CERT-In said in October that [AI agents had reached Indian organisations' live systems](/posts/cert-in-rogue-ai-agents-indian-firms/), and on 24 November the [UK NCSC](https://www.ncsc.gov.uk/blogs/familiar-weaknesses-exploited-faster-defending-against-agentic-cyber-attacks) reported a marked rise in AI-assisted attacks since September, stressing that the weaknesses exploited are old ones and only the speed is new. Earlier this month the UK agency [warned that AI-powered malware](/posts/ncsc-ai-malware-uk-critical-infrastructure-by-2028/) would likely hit British critical infrastructure by 2028.

## What the NCSC asks companies to do now

- Cut the number of systems reachable from the internet, and restrict the rest with geo-blocking or IP allow lists.
- Install critical security updates on internet-facing systems as soon as possible, and no later than 24 hours after release.
- Protect everything reachable from outside, such as webmail and VPN, with MFA or passkeys, without exception.
- Grant the lowest privileges that work, watch for unusual behaviour and data volumes, and run regular penetration tests.

## Why this matters

Agent-driven attacks have moved from forecasts to a government confirming successful intrusions, including at critical infrastructure operators. Nothing in the advisory is exotic: the NCSC describes agents going after default passwords and unpatched, exposed systems, only much faster than a human could. If you run anything internet-facing, the 24-hour patch window and MFA on every exposed login are the concrete bar to measure yourself against.
