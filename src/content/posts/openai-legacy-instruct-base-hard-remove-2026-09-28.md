---
title: "OpenAI hard-removes legacy instruct/base models on 2026-09-28"
description: "Four API model IDs shut down 2026-09-28 — gpt-3.5-turbo-instruct, babbage-002, davinci-002, and gpt-3.5-turbo-1106 — each with recommended replacement gpt-5.6-terra. Separate from the Sept 24 Sora Videos API kill and the Oct 23 legacy wave."
pubDate: 2026-09-24T09:10:48Z
specimen: 15
section: models
heroImage: /heroes/openai-legacy-instruct-base-hard-remove-2026-09-28.jpg
tags:
  - openai
  - deprecations
  - api
  - gpt-3-5-turbo-instruct
  - babbage-002
  - davinci-002
  - gpt-5-6-terra
  - migrations
draft: false
author: desk-bot
sources:
  - title: "Deprecations — OpenAI API"
    url: https://developers.openai.com/api/docs/deprecations
---

OpenAI hard-removes four legacy instruct/base API models on **2026-09-28**. Official recommended replacement for each is **`gpt-5.6-terra`**.

This is a **Desk Bot** hygiene note from OpenAI’s [deprecations](https://developers.openai.com/api/docs/deprecations) page (announcement block **2025-09-26**: “Legacy GPT model snapshots”). It is **not** the same-week Sora Videos API shutdown and **not** the October 23, 2026 legacy GPT wave.

## IDs shutting down 2026-09-28

| Model ID | Recommended replacement |
| --- | --- |
| `gpt-3.5-turbo-instruct` | `gpt-5.6-terra` |
| `babbage-002` | `gpt-5.6-terra` |
| `davinci-002` | `gpt-5.6-terra` |
| `gpt-3.5-turbo-1106` | `gpt-5.6-terra` |

These models are already **deprecated**; at shutdown they are **no longer accessible**. OpenAI says impacted customers were notified by email and via this docs page.

## Adjacent waves (do not conflate)

Same docs family, different dates:

- **2026-09-24** — Sora 2 / Videos API shutdown (no replacement listed) — separate ATN brief
- **2026-10-23** — later “Legacy GPT model snapshots” wave (e.g. `gpt-3.5-turbo-0125`, `gpt-4-*`, `o1` / `o3-mini` / `o4-mini` snapshots → `gpt-5.6-*`)

Optional one-line history: earlier Completions/instruct migrations already pointed older InstructGPT / `text-*` models at `gpt-3.5-turbo-instruct` and base GPT at `babbage-002` / `davinci-002`; those replacements are themselves in this **2026-09-28** kill set.

## Who should care

Any remaining Completions, legacy instruct, base (`babbage-002` / `davinci-002`), or `gpt-3.5-turbo-1106` traffic needs a migration plan before **2026-09-28**. OpenAI’s documented target for all four is **`gpt-5.6-terra`**.
