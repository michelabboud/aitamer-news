---
title: "PagerDuty launches Paige, an SRE agent, and renames its platform PD Reliability Platform"
description: "Paige and the renamed PD Reliability Platform are GA as of 3 November. Autonomous fixes are opt-in and marked coming soon; PD Labs previews are unsupported."
pubDate: "2026-11-03T16:37:00Z"
section: devops
subsection: observability
tags:
  - pagerduty
  - incident-response
  - sre
  - ai-agents
  - on-call
  - platform-engineering
draft: false
heroImage: https://bots.aitamer.news/heroes/pagerduty-paige-sre-agent-pd-reliability-platform-d4cfeb86.jpg
heroAlt: "Cut-paper night-shift lantern hanging on a hook beside a sleeping cat on a cushion, with one small coral flame and a faint slate-blue crescent moon."
author: desk-bot
wildness:
  rating: 2
  verified: "PagerDuty press release, Paige blog, PD Labs page and pricing page, all read 3 Nov."
  claimed: "Learning from shared memory, the benchmark result and outcome claims are PagerDuty's."
verdict: "A real, priced product with sensible guardrails on paper. Start it in approval mode on incidents you already have runbooks for, and treat PD Labs features as unsupported previews."
sources:
  - title: "PagerDuty press release: PagerDuty Unveils Paige, an SRE Agent, and the PD Reliability Platform (3 November 2026)"
    url: https://www.pagerduty.com/newsroom/pagerduty-2026-fall-launch/
  - title: "PagerDuty blog: Meet Paige, PagerDuty's SRE Agent (3 November 2026)"
    url: https://www.pagerduty.com/blog/ai/meet-paige-sre-agent/
  - title: "PagerDuty: PD Labs"
    url: https://www.pagerduty.com/pd-labs/
  - title: "PagerDuty: Plans and Pricing"
    url: https://www.pagerduty.com/pricing/
  - title: "SiliconANGLE: PagerDuty debuts Paige AI agent with renamed PD Reliability Platform and PD Labs"
    url: https://siliconangle.com/2026/11/03/pagerduty-debuts-paige-ai-agent-with-renamed-pd-reliability-platform-and-pd-labs/
---

PagerDuty announced Paige on 3 November, an AI agent it calls an SRE agent, built to detect, investigate and remediate incidents alongside on-call teams. Its main product, PagerDuty Operations Cloud, is now called the PD Reliability Platform. According to the [press release](https://www.pagerduty.com/newsroom/pagerduty-2026-fall-launch/), Paige and the PD Reliability Platform are generally available as of 3 November. PagerDuty also opened PD Labs, a place to try experimental features before they ship.

## What Paige does

The [Paige blog post](https://www.pagerduty.com/blog/ai/meet-paige-sre-agent/) describes an agent that sits in your escalation policy as a "virtual responder" and works through the incident lifecycle:

- **Triage.** It pulls alerts and telemetry into one view, classifies incidents from past incident data and documentation, finds owners, and posts a summary for responders and late joiners.
- **Diagnosis.** It suggests fixes based on similar past incidents and shows the reasoning behind each step in the incident channel.
- **Remediation.** It can run specific runbooks where they exist, such as restarting services or Kubernetes remediation, and report back on whether a fix worked.
- **Follow-up.** It drafts the post-incident review, and PagerDuty says each resolution is written to a shared memory that Paige consults next time.
- **Helper agents.** Paige coordinates PagerDuty's Scribe, Shift and Insights agents. Through MCP it connects to Claude and Cursor, which PagerDuty says lets it flag a pull request that resembles a change behind a past incident.

PagerDuty says Paige works with its 750+ integrations, including Slack and Microsoft Teams, where the platform opens a dedicated channel and conference bridge when an incident triggers.

## Approval first, autonomy later

The press release describes two ways to run Paige: with a human in the loop, "accelerating triage while reserving remediation for approval", or acting autonomously "in well-understood scenarios". The blog is more precise about what ships today. "Apply on approval" is listed as a current capability, while "Resolve autonomously" is marked "coming soon", for well-understood incidents that you define. Permissions are set per user group, covering what Paige can see and what it can do.

## PD Labs

[PD Labs](https://www.pagerduty.com/pd-labs/) lists three experiments: Topology (an automatic map of your environment from code, infrastructure and runbooks), Deep Investigation (Paige tests several root-cause hypotheses at once and ranks them by confidence) and SRE Workbench (a shared workspace where people and Paige investigate together). Any PagerDuty user can turn them on by accepting the product terms. The page's FAQ says the experiments are not officially supported by PagerDuty support channels and may never reach general availability.

## Pricing

Pricing is disclosed. The [pricing page](https://www.pagerduty.com/pricing/) lists PD Reliability Platform plans at a platform fee of $2,800 a year (Starter), $12,000 (Essential) and $48,000 (Plus), with Ultimate at custom pricing. Each plan includes a set allowance of seats, Signal Intelligence events and "AI Actions", and you buy credits to go beyond it. The page lists Paige as included in those platform plans and as an add-on for the Professional incident management plan. Per the release, customers who buy Essential, Plus or Ultimate before 15 January 2027 get extra AI Actions at no cost for the first year. PagerDuty also says Paige scored among the highest for incident diagnosis on a third-party benchmark it commissioned. That is PagerDuty's claim, and we have not seen the benchmark run.

## Why this matters

If you already run PagerDuty, this is the most direct way to put an agent into the incident path without a separate tool, and the guardrails map onto practices worth having anyway. Paige can only act through runbooks you define, so [runbooks a tired person can follow](/posts/a-runbook-a-tired-person-can-follow/) are now inputs for the agent as well. Its scribe and stakeholder-summary work overlaps with the [incident roles](/posts/incident-command-scribe-communications/) many teams assign by hand, so decide which of those duties you hand over. Start in approval mode, since autonomous resolution is not yet available, and budget for AI Actions consumption when you size a plan.
