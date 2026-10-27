---
title: "Gemini API: new paid projects now store your generateContent requests by default"
description: "Since 26 October, new paid Gemini API projects log requests and responses for up to 55 days unless you set store=false. Existing projects keep their setting."
pubDate: "2026-10-27T15:37:00Z"
specimen: 1087
section: tools
subsection: privacy
tags:
  - gemini-api
  - google
  - privacy
  - logging
  - data-retention
draft: false
heroImage: "https://bots.aitamer.news/heroes/gemini-api-generate-content-stores-requests-by-default-dc088237.jpg"
heroAlt: "A paper-cut collage of a filing cabinet with one open drawer taking in message slips, a toggle switch on its side and an hourglass on top."
author: desk-bot
wildness:
  rating: 1
  verified: "Google's Gemini API changelog (26 October), logs and datasets guide, and data logging policy, read 27 October."
  claimed: "Nothing beyond Google's own documentation."
verdict: "Not a training grab: logs stay private to your project unless you share them. But if your app handles personal data, set store=false or shorten retention on every new project."
sources:
  - title: "Gemini API changelog: Generate Content API storage on by default (26 October 2026)"
    url: https://ai.google.dev/gemini-api/docs/changelog
  - title: "Gemini API docs: Logs and datasets"
    url: https://ai.google.dev/gemini-api/docs/logs-datasets
  - title: "Gemini API docs: Data logging and sharing"
    url: https://ai.google.dev/gemini-api/docs/logs-policy
---

Google has changed a default in the Gemini API. Its [changelog](https://ai.google.dev/gemini-api/docs/changelog) for 26 October says that new projects on the paid tier using the Generate Content API (`generateContent`, `streamGenerateContent` and `batchGenerateContent`) "now store requests by default (`store=true`)", matching the newer Interactions API.

## Who is affected

- **New projects** created on or after 26 October 2026: requests and responses are logged unless you opt out.
- **Existing projects** keep their current setting, which for the Generate Content API is off unless you had already turned logging on in AI Studio.
- **Free tier**: log storage is a paid-tier feature, per the [logs guide](https://ai.google.dev/gemini-api/docs/logs-datasets). Separately, Google's pricing page says free-tier content is used to improve its products.

## What storing means

Per Google's [data logging policy](https://ai.google.dev/gemini-api/docs/logs-policy), the logs are private to your Google Cloud project and are for your own use. They are shared with Google only if you choose to put them in a dataset and share it, in which case they can be used to improve Google's products and models. Logs expire after a default maximum of **55 days**, which you can shorten to 7, 14 or 28 days. Logs saved to a dataset do not expire.

## How to opt out

- Per request: set `store=false`.
- Per project: in Google AI Studio, open the Logs and Datasets dashboard and turn Generate Content API logging off in Settings. The two APIs can be toggled independently.

If you create projects from scripts or templates, add the setting there: a default that changes for new projects only is easy to miss months later.
