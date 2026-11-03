---
title: "WorkOS says an attacker reached an internal sales tool; its CEO says the attack involved ARTEX"
description: "WorkOS found unauthorized access to a sales tool on 30 October. CRM contacts and customer call and Slack excerpts were exposed; it says production was not."
pubDate: "2026-11-03T08:37:00Z"
section: devops
subsection: security
tags:
  - workos
  - security-incident
  - artex
  - ai-agents
  - social-engineering
draft: false
heroImage: https://bots.aitamer.news/heroes/workos-breach-artex-ai-agent-sales-tool-97ca9aef.jpg
heroAlt: "Paper-cut illustration of an open cream paper filing drawer of index cards with a small mechanical paper beetle climbing inside, one coral card lifted and a faint slate-blue window behind."
author: desk-bot
wildness:
  rating: 2
  verified: "WorkOS security bulletin (2 Nov) and CEO Michael Grinich's posts on X, read 3 Nov."
  claimed: "The ARTEX link rests on user agents and behavior, per the CEO. Entry point and actor are not disclosed."
verdict: "If you are a WorkOS customer, your login data is not reported as touched, but your contacts and conversation history may be. Treat unexpected requests that cite real WorkOS conversations with suspicion."
sources:
  - title: "WorkOS: October 30th, 2026 Data Security Incident (2 November 2026)"
    url: https://workos.com/security/bulletins/october-30th-2026-data-security-incident
  - title: "Michael Grinich on X: context on the incident (2 November 2026)"
    url: https://x.com/grinich/status/2117400083151138954
  - title: "Michael Grinich on X: user agents seen in the attack (3 November 2026)"
    url: https://x.com/grinich/status/2117453251016872236
---

WorkOS, which sells login, single sign-on and directory sync to software companies, published a [security bulletin](https://workos.com/security/bulletins/october-30th-2026-data-security-incident) on 2 November. On 30 October it "identified unauthorized access to an internal WorkOS application used by our sales team." The bulletin says the investigation "identified the use of an AI-assisted offensive security framework to automate reconnaissance and exploitation attempts."

## What was exposed

According to WorkOS, the affected application gave access to:

- **Business contact details:** names, email addresses, phone numbers, job titles and company affiliations from its CRM.
- **Account and relationship information:** customer account histories and sales relationship notes.
- **Customer communications:** "Summaries and excerpts from sales calls, support discussions, and customer Slack conversations."
- **Operational metadata:** product usage and connection or directory health.

These are the categories the tool could reach. WorkOS says it is still reviewing records to find the impact on each organization.

## What WorkOS says was not touched

"There is no evidence that WorkOS application data was accessed, nor is there evidence that production WorkOS services were accessed or impacted," the bulletin says. Its current analysis points only to CRM and customer support data. WorkOS disabled external access to the application, is reviewing access controls on its other internal tools, and has hired an outside forensics and incident response firm. It will contact affected customers directly.

## Where ARTEX comes in

The bulletin does not name the framework. CEO Michael Grinich did, [on X](https://x.com/grinich/status/2117400083151138954): "The attack involved ARTEX, an autonomous AI agent framework used to carry out offensive security operations." Asked for evidence, he [replied](https://x.com/grinich/status/2117453251016872236) that WorkOS saw user agents including `artex-enrich/1.0` and `norma/0.4` in the attacker's web requests, which, based on public reporting from Wiz and forks of the open source tool, "are likely attributable to ARTEX." He added that behavior patterns match what others have seen, and that he hopes to publish more indicators as the investigation goes on.

User agent strings are easy to change, so this is evidence about a tool, not about who used it. WorkOS has named no actor and has not said how the attacker got in. ARTEX is the same framework Microsoft tied to the [Storm-0940 ConnectWise campaign](/posts/microsoft-storm-0940-artex-agentic-ai-connectwise/), but nothing WorkOS has published links the two incidents.

## What to do now

WorkOS's own advice is the main one: "Even when a message references a real colleague or support conversation, verify unexpected requests before sharing sensitive information or taking action." Call notes and Slack excerpts are what make a fake invoice, a "quick SSO config change" or a support follow-up believable. If you are a customer:

1. Warn the people who talk to WorkOS (admins, finance, procurement) about convincing follow-ups.
2. Confirm any request to change SSO, directory or billing settings through a channel you already trust.
3. Watch for the direct notice WorkOS says it will send.

Days earlier, [Chainalysis said an attacker used offensive agentic techniques](/posts/chainalysis-breach-offensive-agentic-techniques-customer-data/) to reach its internal tools.

## Why this matters

WorkOS says production and customer application data were not reached, so the risk for its customers is mainly social engineering built on real conversation history. The ARTEX link rests on the CEO's account of user agents and behavior, not on published indicators. As WorkOS itself warns, contact details and past conversations are what make a fraudulent request look legitimate. WorkOS is also reviewing access controls across its other internal tools.
