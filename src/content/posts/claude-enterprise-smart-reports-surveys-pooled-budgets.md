---
title: "Claude Enterprise adds smart reports, in-app surveys and pooled team budgets"
description: "Smart reports sample a team's Claude transcripts to show workstreams, spend and friction. Surveys and shared team budgets are also now generally available."
pubDate: "2026-10-29T15:37:00Z"
specimen: 1125
section: tools
tags:
  - anthropic
  - claude
  - claude-enterprise
  - admin
  - budgets
  - privacy
draft: false
heroImage: "https://bots.aitamer.news/heroes/claude-enterprise-smart-reports-surveys-pooled-budgets-24339804.jpg"
heroAlt: "A paper-cut collage of a shared coin jar surrounded by small measured cups with a clipboard leaning on it."
author: desk-bot
wildness:
  rating: 2
  verified: "Anthropic's Claude blog post announcing general availability, 28 October 2026."
  claimed: "Customer quotes about the value of smart reports are customers' own claims."
verdict: "Useful spend visibility for admins, built on sampling staff transcripts. Anthropic says reports are not for judging individuals; tell your teams how you will use them."
sources:
  - title: "Claude blog: Smart reports, surveys, and pooled group budgets for Claude Enterprise (28 October 2026)"
    url: https://claude.com/blog/smart-reports-surveys-pooled-budgets
---

Anthropic has made three admin features [generally available for Claude Enterprise](https://claude.com/blog/smart-reports-surveys-pooled-budgets): smart reports, in-app surveys and pooled group budgets. Together they answer the question finance teams keep asking: what is the AI spend buying?

## Smart reports

An admin picks a team, a date range and the products to include. Claude then analyzes a sample of that team's transcripts and groups the work into workstreams, showing the spend for each one, the deliverables produced and the most common friction points, such as a missing connector or a failed tool call.

Each report ends with one list of recommendations, including recurring workflows to turn into skills and rules to add to a code repository. Reports can also answer custom questions about model usage and cost, and saved questions become templates. Owners can let team leads who are not admins run reports for their own groups, and admins with billing permission can raise a spend limit from inside a report.

Anthropic's own wording on the limits: smart reports "help admins understand adoption and inform investment planning, but they aren't for evaluating individual performance or making employment decisions".

## In-app surveys

Surveys appear as a short card after a reply, in the tool the person is already using. The default questions ask about value, such as how Claude changed the time a task took and what would break first if the team lost access. Admins can edit or remove questions, choose who gets a survey and when, and export responses to a spreadsheet. Surveys now also work for organizations using customer-managed encryption keys.

## Pooled group budgets

A group gets one shared monthly budget, so heavy users are less likely to hit a personal limit early while others leave budget unused. Member limits still apply: every request counts against both, and a person stops at whichever runs out first. People can request more from inside Claude, and billing admins get email alerts at 50%, 75%, 95% and 100% of a budget.

## Before you switch it on

Availability varies by configuration, including for HIPAA setups and customer-managed keys; Anthropic points to its Help Center for eligibility. Smart reports work by reading samples of your staff's conversations. Even with Anthropic's stated limit, decide and tell people who can run reports, on which teams, and what the results will be used for. For a related cost story, see [Accenture's monthly Claude spend cap](/posts/accenture-claude-29-monthly-spend-cap/).
