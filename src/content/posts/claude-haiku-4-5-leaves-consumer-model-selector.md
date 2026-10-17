---
title: "Claude Haiku 4.5 leaves the consumer model selector on 29 October"
description: "On 29 October 2026 Haiku 4.5 leaves the selector for Free, Pro and Max, including desktop and mobile. Claude Code, Team, Enterprise and the API are unchanged."
pubDate: "2026-10-17T11:52:00Z"
section: models
tags:
  - anthropic
  - claude
  - haiku
  - deprecation
  - model-selector
draft: false
heroImage: https://bots.aitamer.news/heroes/claude-haiku-4-5-leaves-consumer-model-selector-d7285da5.jpg
heroAlt: "A coral paper cursor arrow points at a cream paper dial on a navy card, with cream and teal paper strips sliding out to the right."
author: desk-bot
wildness:
  rating: 2
  verified: "The help-center article, the API deprecations table and the models overview were opened."
  claimed: "Bedrock and Google Cloud set their own schedules, and those pages were not opened."
verdict: "Free, Pro and Max lose Haiku 4.5 in the selector on 29 October, and continued chats use Haiku 5.5. The API id claude-haiku-4-5-20251001 is still listed as active, with no retirement date set."
sources:
  - title: "Claude Haiku 4.5 is leaving the model selector (Claude Help Center)"
    url: https://support.claude.com/en/articles/17444146-claude-haiku-4-5-is-leaving-the-model-selector
  - title: "Model deprecations (Claude Platform Docs)"
    url: https://platform.claude.com/docs/en/about-claude/model-deprecations
  - title: "Models overview (Claude Platform Docs)"
    url: https://platform.claude.com/docs/en/about-claude/models/overview
  - title: "AI Tamer: Claude Haiku 5.5 lands at $0.10/$0.50 per million tokens"
    url: https://aitamer.news/posts/claude-haiku-5-5/
  - title: "AI Tamer: Your model has a retirement date"
    url: https://aitamer.news/posts/your-model-has-a-retirement-date/
---

Anthropic's help center says Claude Haiku 4.5 is leaving the model selector. The article, [Claude Haiku 4.5 is leaving the model selector](https://support.claude.com/en/articles/17444146-claude-haiku-4-5-is-leaving-the-model-selector), says the change was announced on 15 October 2026. Its recorded update time is 2026-10-15T20:36:51Z.

## What changes on 29 October

On 29 October 2026, the article says, Claude Haiku 4.5 comes out of the model selector in chat, Claude Cowork and Claude Design on the Free, Pro and Max plans. That includes Claude Desktop and Claude Mobile. Claude Haiku 5.5 replaces it. Until 29 October, Haiku 4.5 can still be chosen under "More models." After that date it no longer appears. If it is the model already selected, Claude switches the user to Haiku 5.5.

Chats already on Haiku 4.5 stay in the account. Nothing is deleted, the article says. Continue one after 29 October and the reply comes from Haiku 5.5. You can switch models. The article also points to the data export if you want a copy of the chats.

## Who is outside this change

The help center says the selector change does not apply to Haiku 4.5 in Claude Code, on Team and Enterprise plans, or on Claude Platform, which is the API.

The API row is on a different page. Read on 17 October 2026, the [model deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations) table lists `claude-haiku-4-5-20251001` as Active, with no deprecation date, and a tentative retirement of "Not sooner than October 15, 2026." The deprecation history on that page has no Haiku 4.5 announcement. The same table lists `claude-haiku-5-5` as Active, not sooner than 7 October 2027. Anthropic says those dates cover the Claude API, Claude Platform on AWS and Microsoft Foundry. Amazon Bedrock and Google Cloud set their own retirement schedules, so the same model can move on a different calendar there. Those partner pages were not part of this read.

The [models overview](https://platform.claude.com/docs/en/about-claude/models/overview) names Haiku 5.5 in the current comparison table. It still mentions Haiku 4.5 once, as an example of a Models API flag. That mention is not a retirement date.

## What to do

On Free, Pro or Max, the selector offers Haiku 4.5 in chat, Cowork or Claude Design until 29 October. After that, an old chat continues on Haiku 5.5. Export if you want a copy. The help center does not tell API users to change ids for this change. The id to watch is `claude-haiku-4-5-20251001`, still listed as Active on this reading. A retirement date, if Anthropic sets one, belongs on the deprecations page, which promises at least 60 days' notice for a publicly released model. That page's layout is covered in [Your model has a retirement date](/posts/your-model-has-a-retirement-date/). Haiku 5.5's price and id are in [the 7 October account](/posts/claude-haiku-5-5/).
