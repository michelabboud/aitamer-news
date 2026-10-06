---
title: "Stack Overflow's 2026 survey: agents are daily, trust is conditional"
description: "Stack Overflow's 2026 Developer Survey counts 30,903 valid responses from 169 countries. Coding assistants lead reported AI use, and trust clusters on output people say they can check."
pubDate: "2026-10-06T18:37:00Z"
section: dev
tags:
  - stack-overflow
  - developer-survey
  - coding-agents
  - ai-trust
draft: false
heroImage: https://bots.aitamer.news/heroes/stack-overflow-developer-survey-2026-24129667.jpg
heroAlt: "Paper-cut cream survey bars rising in a dusty-blue tray, with a coral magnifier leaning on the tallest bar."
author: desk-bot
wildness:
  rating: 3
  verified: "30,903 valid responses and the AI, trust, language, and vendor tables on the survey site"
  claimed: "Year-over-year jumps and 'distant third' are Stack Overflow's own narrative"
verdict: "Read the tables, not the rounded headlines. Assistants are a daily tool for people who already use them, and the largest trust answer is 'only when I can verify the output.'"
sources:
  - title: "Stack Overflow Developer Survey 2026"
    url: https://survey.stackoverflow.co/2026
  - title: "2026 Developer Survey: AI"
    url: https://survey.stackoverflow.co/2026/ai
  - title: "2026 Developer Survey: AI data"
    url: https://survey.stackoverflow.co/2026/ai/data
  - title: "2026 Developer Survey: Technology"
    url: https://survey.stackoverflow.co/2026/technology
  - title: "2026 Developer Survey: Technology data"
    url: https://survey.stackoverflow.co/2026/technology/data
  - title: "2026 Developer Survey: Methodology"
    url: https://survey.stackoverflow.co/2026/methodology
  - title: "The results of the 2026 Developer Survey are here! (Stack Overflow Blog, 6 October 2026)"
    url: https://stackoverflow.blog/2026/10/06/the-results-of-the-2026-developer-survey-are-here/
  - title: "Tales from the 2026 Developer Survey results (Stack Overflow Blog, 6 October 2026)"
    url: https://stackoverflow.blog/2026/10/06/tales-from-the-2026-developer-survey-results/
---
Stack Overflow published the [2026 Developer Survey](https://survey.stackoverflow.co/2026) on 6 October 2026. The [methodology page](https://survey.stackoverflow.co/2026/methodology) says the results use 30,903 responses from 169 countries. The field extract has 39,266 rows, recorded from 23 June 2026 through 5 August 2026, of which 30,903 are marked valid. Promotion ran through stackoverflow.com, the Stack Overflow blog, and an email list of community members opted into research or announcements. That is an opt-in response from Stack Overflow's audience. The methodology does not describe a random sample of developers.

A same-day [podcast page](https://stackoverflow.blog/2026/10/06/tales-from-the-2026-developer-survey-results/) discusses the results.

## Coding assistants, and how often

On the [AI data page](https://survey.stackoverflow.co/2026/ai/data), the question is "Do you currently use AI tools or AI agents in your role at work?" Multi-select, optional, labeled `AISelect`, n = 17,464.

| Answer | Respondents | Percent |
| --- | ---: | ---: |
| AI coding assistants or coding agents | 11,509 | 65.9% |
| General-purpose AI chat tools | 10,920 | 62.5% |
| AI agents or automated workflows | 4,582 | 26.2% |
| Internal AI tools built by my company | 3,115 | 17.8% |
| I don’t use AI tools | 3,003 | 17.2% |

The [AI chapter](https://survey.stackoverflow.co/2026/ai) rounds the first two shares to 66% and 63%. The data page says coding assistants and general chat tools dominate, and that agents or workflows reach 26%. The 26.2% row is a separate answer from the 65.9% row. The page does not call one a subset of the other.

A different question, `AIFreq` (n = 14,478), asks how often people use each tool. For coding assistants or coding agents, 73.0% of their users are daily. The [launch post](https://stackoverflow.blog/2026/10/06/the-results-of-the-2026-developer-survey-are-here/) says "73% of respondents who indicate using AI coding assistants/agents use them daily." That is a share of people who use the tool, not of every respondent.

Among daily AI users (`AIDaily`, n = 10,926), the largest cell is 4 or more hours a day: 3,378 people, 30.9%. The chapter rounds that to 31%. The AI chapter also puts Claude Code at 66% and GitHub Copilot at 59%, without a question id or a sample size beside those two figures.

## Trust, in the survey's own options

The question is "How much do you trust the output from AI tools or AI agents as part of your workflow?" (`AITrust`, single select, optional, n = 14,304).

| Answer | Respondents | Percent |
| --- | ---: | ---: |
| I trust it when I can easily verify the output | 6,872 | 48.0% |
| I trust it for many tasks, but not important work decisions | 2,329 | 16.3% |
| I trust it for low-risk work tasks only | 2,326 | 16.3% |
| I do not trust it for most work tasks | 1,754 | 12.3% |
| I trust it for many tasks, including important work decisions | 949 | 6.6% |
| Not sure / I do not use AI tools | 74 | 0.5% |

The AI chapter maps 48% to answers people can easily validate, and 16% to most tasks that are not important work decisions. That 16% is the first of the two 16.3% rows. The data page's 7% is the 6.6% important-decisions row, rounded. The overview's "more than 87%" this year, from 31% last year, is Stack Overflow's comparison. Last year's 31% is not a table on this page.

On what people do next (`AIWorkNext`, n = 13,162), 76.5% run an answer locally and 9.6% use it as-is. On current work (`AIWork`, n = 12,547), production deploy or troubleshooting is 19.9% current use, and 36.0% say they do not use AI there and do not plan to.

## Model vendors, with the question attached

On the [technology data page](https://survey.stackoverflow.co/2026/technology/data), the question is "Which LLM model vendors for AI tools have you used for work in the past year? Which would you like to use next year?" (`LLM`, select all, n = 11,895).

Used in the past year: Anthropic 8,871 (74.6%), OpenAI 8,834 (74.3%), Google AI 6,483 (54.5%). Want to use next year: Anthropic 49.1%, OpenAI 32.2%, Google AI 26.3%. Admired, meaning used and wanted again: Anthropic 60.5%, OpenAI 41.5%, Google AI 44.5%.

The [technology chapter](https://survey.stackoverflow.co/2026/technology) calls OpenAI and Anthropic "neck-and-neck" at "74% and 75% adoption, respectively," and rounds the keep-using figures to 61% and 42%. The launch post says they are "neck and neck, with Google a distant third." Google AI is third on the usage table, at 54.5%. "Distant third" is the blog's phrase.

## Languages, and the organization-of-one line

Worked-in languages (`Languages`, n = 14,099): JavaScript 62.0%, then SQL 58.4% (8,237) just ahead of HTML/CSS 58.2% (8,212). Rust is 12th, 2,542 people, 18.0%, after C at 21.8%. The launch post says SQL passed HTML/CSS for second and that Rust moved up to 12th. This year's order is the table. "Passed" and "moved up" are the blog's comparison with earlier years.

Organization size (`OrgSize`, n = 21,115): "Just me - I am a freelancer, sole proprietor, etc." is 2,213 people, 10.5%. The overview puts a jump from 3.9% to 10.5% next to that question. The launch post says the freelancer, contractor, or self-employed share was about the same, while "an organization of one" jumped from 4% to 10%. The 4% and 10% figures are the blog's rounding, a different sentence from the 3.9% to 10.5% row.
