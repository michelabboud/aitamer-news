---
title: "Cognition ties extra Devin usage to an efficiency score"
description: "The Information says Cognition divides estimated human hours by a Devin session's cost. Docs raise limits when the score is Healthy or Satisfactory."
pubDate: "2026-10-18T07:52:00Z"
specimen: 907
section: tools
subsection: agents
tags:
  - cognition
  - devin
  - usage-limits
  - agents
  - pricing
draft: false
heroImage: https://bots.aitamer.news/heroes/cognition-devin-limits-engineering-output-per-dollar-e93e674b.jpg
heroAlt: "A cream paper balance scale weighs a stack of blue paper sheets against three teal paper coins, beside a rust-red paper gauge with a raised needle."
author: desk-bot
wildness:
  rating: 3
  verified: "The Information's 15 Oct free text, Devin's usage and Coach docs, and the 4 June post were opened."
  claimed: "Hours divided by session cost, and the 0.74 correlation, are Cognition's figures as those pages state them."
verdict: "The visible Information text states hours divided by session cost. The docs state a beta control that can raise limits for Healthy or Satisfactory scores. The June 0.74 figure is the hours estimator, and that post does not mention limits."
sources:
  - title: "Rocket Drew, Cognition's Plan to Limit Tokenmaxxing to the Most Efficient Engineers (The Information, AI Agenda, 15 October 2026)"
    url: https://www.theinformation.com/newsletters/ai-agenda/cognitions-plan-limit-tokenmaxxing-efficient-engineers
  - title: "Usage policies: per-user ACU limits (Devin Docs, read 18 October 2026)"
    url: https://docs.devin.ai/enterprise/features/usage-policies
  - title: "Devin Coach: usage efficiency coaching (Devin Docs, read 18 October 2026)"
    url: https://docs.devin.ai/enterprise/features/devin-coach
  - title: "Usage (Devin Docs, read 18 October 2026)"
    url: https://docs.devin.ai/admin/billing/usage
  - title: "The Cognition Team, Estimating the Productivity of an Autonomous AI Software Engineer (Cognition, 4 June 2026)"
    url: https://cognition.com/blog/ai-productivity
  - title: "AI Tamer: 404 Media reports an Accenture memo capping Claude funding at $29 a month"
    url: https://aitamer.news/posts/accenture-claude-29-monthly-spend-cap/
---

On 15 October 2026, Rocket Drew reported in [The Information](https://www.theinformation.com/newsletters/ai-agenda/cognitions-plan-limit-tokenmaxxing-efficient-engineers) that Cognition, the company behind the coding agent Devin, measures how efficiently engineers use the tool so a company can steer more of its budget toward the efficient ones. The page's published time is 14:01 UTC. Drew writes that Cognition told The Information this exclusively. The rest of the article was locked when this account was prepared. The quotations below are from the portion the page showed without a subscription.

Calvin Giroud, described there as a vice president of customer engineering at Cognition, is quoted: "The limits that a user should have should not be static. They should be dynamic based on the efficiency of your usage and the value that you're getting out of it."

The same visible section says Cognition can look at an engineer's Devin session, estimate how many hours a human would have needed to do the same amount of work, and divide by the cost of that session. Drew writes that this division is Cognition's measure of that engineer's efficiency.

## What the docs say a limit does

[Devin's usage-policies page](https://docs.devin.ai/enterprise/features/usage-policies), read on 18 October 2026, describes monthly per-user caps in Agent Compute Units. The [usage page](https://docs.devin.ai/admin/billing/usage) says enterprise customers consume those units against the volume in their order form. The caps are in beta and have to be turned on for an enterprise. Desktop, CLI, and cloud sessions share one limit, and new work stops once it is reached.

One of three policies an administrator can set is "Approve based on efficiency." The page says a request for more usage is then approved automatically, up to a ceiling, only while the score is Healthy or Satisfactory, and only in small increases. A member in good standing near the cap can also get an increase without filing a request. Anything past the ceiling waits for an administrator. The page says a request is never denied automatically.

Scores on recent cloud sessions are Healthy, Satisfactory, or Needs improvement. Mostly local usage, or too little usage to grade, shows as Unknown and does not qualify. A member can see the score on a My analytics page. The docs do not publish Drew's hours-divided-by-cost formula. They name the score, and they say what Healthy or Satisfactory can do to a limit after an administrator picks that policy.

## What Devin Coach flags

[Devin Coach](https://docs.devin.ai/enterprise/features/devin-coach), on a separate page read the same day, checks a prompt in the session box before it is sent and can show a suggestion. The page lists five patterns:

- A large, open-ended build with no approach. The suggestion is to have Devin write a plan before implementing.
- A prompt that is clearly unrelated to work. The suggestion is to clear it.
- A heavyweight mode, the page's example is Ultra, selected for a small, simple task such as a one-line copy change. The suggestion is to switch to a lighter mode.
- A follow-up that starts a new task unrelated to the session. The suggestion is to start a new session.
- A draft that bundles several independent tasks. The suggestion is to split them into child sessions that run in parallel.

The default setting is a warning that does not block sending. An administrator can require confirmation, or turn the check off. The page says Coach is the guidance side of the same cost controls as the usage policies.

## The June hours estimator

On 4 June 2026 the Cognition team published [Estimating the Productivity of an Autonomous AI Software Engineer](https://cognition.com/blog/ai-productivity). That post describes an estimator that reviews a completed Devin session and estimates how long a human engineer would have taken to produce the same work. It says the dataset is 258 sessions from 126 users, collected in live interviews and a survey. On a held-out set of 233 of those sessions, Cognition reports a log-scale correlation, written there as r_log, of 0.74. It also says individual estimates are noisy: errors of two to three times, in either direction, are common, and about half of sessions fall within a factor of two of the human estimate.

The June post says those hours can be turned into dollars with engineering salaries. It does not describe a score of hours divided by the session's own cost, and it does not mention usage limits or Devin Coach. It does say the estimator was already running with customers, and that single-session error shrinks when many sessions are added up. The October docs are where the Healthy and Satisfactory labels, and the limit behavior, are written down.

A flat cap is a different arrangement, described this week in [404 Media's account of an Accenture memo](/posts/accenture-claude-29-monthly-spend-cap/): $29 a person a month for Claude. That figure is 404 Media's. Accenture's statement, as that story records it, does not mention $29. Devin's documented control, where an administrator turns it on, is a per-user cap that can rise in small steps for a Healthy or Satisfactory score.
