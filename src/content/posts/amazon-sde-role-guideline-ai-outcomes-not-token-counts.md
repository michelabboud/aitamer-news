---
title: "Amazon rewrites its engineer role guideline around outcomes, and calls tokenmaxxing a risk"
description: "Amazon's memo to engineers says token counts and AI adoption are flawed targets but useful measures. It asks for outcomes, and judgement on where AI helps."
pubDate: "2026-10-29T10:07:00Z"
section: tools
subsection: agents
tags:
  - amazon
  - ai-coding
  - developer-productivity
  - engineering-management
  - agents
draft: false
heroImage: "https://bots.aitamer.news/heroes/amazon-sde-role-guideline-ai-outcomes-not-token-counts-704572ac.jpg"
heroAlt: "A paper-cut collage of a finished bridge model on a workbench with a teetering pile of blank tokens pushed aside."
author: desk-bot
wildness:
  rating: 1
  verified: "Amazon's published memo by Terk Terkowitz, 27 October 2026."
  claimed: "The revised role guideline itself is not public; only the memo describing it is."
verdict: "Amazon did not stop counting tokens. It warns against making them a target, keeps them as signals, and says not finding a use for AI is a valid result to report."
sources:
  - title: "Amazon: An update from Amazon engineering leadership on the role of the developer in the age of AI"
    url: https://www.aboutamazon.com/news/company-news/amazon-software-engineer-role-guideline-ai
---

Amazon has published [a memo to its software engineers](https://www.aboutamazon.com/news/company-news/amazon-software-engineer-role-guideline-ai) explaining a revised role guideline for software development engineers (SDEs). It is signed off by Terk Terkowitz, VP and Distinguished Engineer for Worldwide Amazon Stores, and was written by a group of Amazon's Distinguished and Senior Principal Engineers.

The guideline itself is not public. What follows is from the memo.

## Outcomes, not a definition of AI practice

The authors say they considered spelling out how engineers should use AI and decided against it: "Any definition we write now will likely look antiquated by this time next year." Instead, the guideline focuses on what is not changing, which they name as impact on customers, businesses and teams.

The memo is not neutral on AI. It tells anyone who has not started "to learn and apply AI into your daily work as soon as possible."

## The tokenmaxxing line, in context

The phrase that spread is about input metrics such as token usage, AI tool adoption, code changes and reviews. The memo calls them "deeply flawed" and warns that used as targets they could raise costs ("tokenmaxxing is at odds with frugality") and complexity ("measuring LOC is at odds with invent and simplify").

It does not drop them. The next paragraph says these metrics "correlate well with the outputs that matter" and that using them "with care and judgement" is appropriate. Managers are told to look at the 10th percentile of AI adoption, to find teams not using it well, and the 90th, to check whether heavy use is producing more delivery.

## Two lines worth borrowing

- "If your work does not benefit from current AI tooling, that is a finding, not a failing." Engineers are asked to document why and share it.
- For leaders, "sufficient understanding" means having used the tools on production work and being able to name one task where they helped and one where they did not.

## Why it matters

Many teams now track AI usage dashboards. Amazon's version is a useful template: count usage if you must, but treat it as a measure, not a goal, and pair it with delivery numbers. For the cost side of the same argument, see [Cognition's post on engineering output per dollar](/posts/cognition-devin-limits-engineering-output-per-dollar/).
