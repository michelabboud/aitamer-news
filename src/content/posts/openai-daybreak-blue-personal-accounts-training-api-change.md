---
title: "OpenAI will train on personal Daybreak Blue sessions from 29 November, even with training turned off"
description: "OpenAI's data controls page says Daybreak sessions on personal accounts may train its models. Individual API access to Daybreak Blue ends 20 November."
pubDate: "2026-10-31T16:37:00Z"
section: general
subsection: privacy
tags:
  - openai
  - daybreak
  - privacy
  - ai-training
  - codex
  - security-research
  - api
draft: false
heroImage: https://bots.aitamer.news/heroes/openai-daybreak-blue-personal-accounts-training-api-change-681dc622.jpg
heroAlt: "A layered cream paper sunrise over a paper horizon, with an open notebook and a coral thread running from its page toward the sun."
author: desk-bot
wildness:
  rating: 2
  verified: "OpenAI data controls page and Daybreak help pages, read 31 Oct; OpenAI email as posted by recipients."
  claimed: "The 29 Nov and 20 Nov dates come from OpenAI's email, quoted by several recipients; not yet on a help page."
verdict: "Security researchers on personal accounts should assume Daybreak work can train OpenAI's models from 29 November, and plan any API workflows around 20 November."
sources:
  - title: "OpenAI Help Center: Data controls in ChatGPT"
    url: https://help.openai.com/en/articles/7730893-data-controls-in-chatgpt
  - title: "OpenAI Help Center: OpenAI Daybreak, Trusted Access for Cyber overview"
    url: https://help.openai.com/en/articles/20001258-openai-daybreak-trusted-access-for-cyber-overview
  - title: "OpenAI API docs: Use Daybreak in the Responses API"
    url: https://developers.openai.com/api/docs/guides/daybreak
  - title: "OpenAI Developer Community: Daybreak Blue data use to improve models"
    url: https://community.openai.com/t/daybreak-blue-data-use-to-improve-models/1411182
  - title: "Hacker News: Update on Daybreak Blue data usage and API access (full email)"
    url: https://news.ycombinator.com/item?id=50308875
---

OpenAI is changing the terms for Daybreak Blue, its trusted-access program that gives vetted security researchers models with fewer cyber refusals. Its [data controls help page](https://help.openai.com/en/articles/7730893-data-controls-in-chatgpt), updated on 30 October, now says: "During Daybreak sessions on your personal account, we may use content from your interactions to improve our models even when 'Improve the model for everyone' is off."

## Two changes, two dates

OpenAI's email to Daybreak Blue users, which recipients posted in full on [Hacker News](https://news.ycombinator.com/item?id=50308875) and described on the [developer forum](https://community.openai.com/t/daybreak-blue-data-use-to-improve-models/1411182), sets the dates:

- **From 29 November**, OpenAI "may use content from Daybreak Blue sessions on personal accounts to improve our models, including to help strengthen safeguards against cyber misuse", even with the training setting off. The email says this does not affect business or enterprise customers, non-Daybreak sessions, or its handling of Private Safety Processing and Zero Data Retention.
- **From 20 November**, individuals lose API access to Daybreak Blue. The Responses API will return standard responses with normal cyber refusals; API keys are not revoked. Daybreak Blue for individuals continues in Codex with Sign in with ChatGPT. To keep API access, OpenAI says to move to a business or enterprise account.

The email points out a twist: Daybreak already requires Advanced Account Security, which turns off "Improve the model for everyone". The new rule overrides that setting only inside Daybreak sessions. The help page says the setting "still applies to your other activity".

## What you can control

- **Keep Daybreak off when you do not need it.** OpenAI's [Daybreak overview](https://help.openai.com/en/articles/20001258-openai-daybreak-trusted-access-for-cyber-overview) says the Daybreak toggle in the Codex app's model picker is off by default. A forum poster says Codex CLI on personal accounts offers no clear switch. The same overview says Codex CLI 0.163.0 and later turns Daybreak on with `/daybreak` in interactive sessions or `daybreak=true` in headless use.
- **In the API**, until 20 November, setting `access_programs.cyber` to `standard` keeps normal refusals, per OpenAI's [Responses API guide](https://developers.openai.com/api/docs/guides/daybreak).
- **Work accounts:** by default OpenAI does not train on Business or Enterprise workspaces or API data, the same page says, and the email excludes them from this change.

Forum replies so far are critical: one user calls security research "sensitive information by nature" and says they will stop using Daybreak if there is no opt-out. Daybreak's models have featured in our coverage before, including [Vals AI's cyber range test of GPT-6 Sol](/posts/vals-deepseek-v4-1-flash-gpt-6-sol-cyber-range/). It is also the second question this month about how ChatGPT uses what people type, after [404 Media's report on ChatGPT ads](/posts/chatgpt-ads-target-email-phone-prompts/).

## Why this matters

Daybreak users handle exploit code, client systems and unpatched findings, so whether their sessions train models is a real confidentiality question, not a settings detail. From 29 November the training switch no longer protects those sessions on personal accounts, and the only clean opt-out OpenAI names is a business or enterprise account. Anyone doing client work through a personal Daybreak account should review that before the date.
