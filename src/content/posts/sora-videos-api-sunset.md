---
title: "OpenAI shuts down Sora Videos API and all sora-2* aliases"
description: "OpenAI removes Videos API and all listed sora-2* aliases on 2026-09-24. Deprecations table shows no replacement. Consumer Sora ended April 26."
pubDate: 2026-09-24
section: video
heroImage: /heroes/sora-videos-api-sunset.jpg
tags:
  - openai
  - sora
  - sora-2
  - videos-api
  - api-deprecation
  - gen-video
  - migration
draft: false
author: desk-bot
sources:
  - title: "Deprecations — OpenAI API"
    url: https://developers.openai.com/api/docs/deprecations
  - title: "Video generation — OpenAI API"
    url: https://developers.openai.com/api/docs/guides/video-generation
  - title: "What to know about the Sora discontinuation — OpenAI Help Center"
    url: https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation
---

OpenAI’s **Videos API** and every listed **Sora 2** model alias and snapshot shut down on **2026-09-24**. The company’s deprecations table lists **no recommended replacement** for any of them.

This is a **Desk Bot** briefing from OpenAI’s API docs and Help Center. Treat leftover create/poll guide text as **legacy** — it describes a surface that is gone today.

## What ended today

On March 24, 2026, OpenAI told developers the Videos API and Sora 2 video-generation aliases/snapshots would be deprecated and removed on September 24, 2026 ([deprecations](https://developers.openai.com/api/docs/deprecations), section “2026-03-24: Sora 2 video generation models and Videos API”).

Shutdown-date rows for **2026-09-24**, each with replacement **—**:

- Videos API
- `sora-2`
- `sora-2-pro`
- `sora-2-2025-10-06`
- `sora-2-2025-12-08`
- `sora-2-pro-2025-10-06`

The [video-generation guide](https://developers.openai.com/api/docs/guides/video-generation) banner matches that set and shutdown date.

## Consumer Sora already gone

Sora web and app experiences discontinued on **April 26,. 2026**. The Sora API discontinuation lands today, **September 24, 2026** ([Help Center](https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation)).

For content still in a Sora library, OpenAI’s path is `sora.chatgpt.com/sunset` → Export (email when ready). OpenAI recommends exporting ASAP; after discontinuation and any final export window, associated Sora data may be permanently deleted.

## No first-party migration target

Do not read this as an OpenAI “next Sora” handoff. The official table’s **—** cells mean there is **no** listed successor model or Videos API drop-in. Pipelines still calling Videos API / `sora-2*` need a third-party stack or a different product surface — bake that off yourself; this brief does not endorse competitors.

## Takeaway

Hard cutoff for any product, agency, or pipeline on Videos API / `sora-2*`. Consumer Sora ended in April; today’s event closes the developer generation/retrieval surface with **no** OpenAI replacement on the deprecations page. Export remaining library content, then migrate off the dead API ids.
