---
title: "xAI will watermark Grok API text by default from 7 November"
description: "From 7 November, text from grok-4.7 and other Grok API models carries an invisible watermark for the EU AI Act. Admins can opt out per model."
pubDate: "2026-11-02T12:07:00Z"
section: models
subsection: policy
tags:
  - xai
  - grok
  - watermarking
  - eu-ai-act
  - api
draft: false
heroImage: https://bots.aitamer.news/heroes/xai-grok-api-text-watermark-default-november-7-867f087d.jpg
heroAlt: "A blank cream paper ribbon with a faint blind-embossed circle, coming out of a slate-blue slot beside a small coral switch, with a faint lens outline behind."
author: desk-bot
wildness:
  rating: 2
  verified: "SpaceXSI docs page Output Watermarking, last updated 31 Oct 2026, read 1 Nov."
  claimed: "No quality or speed impact is xAI's own claim. Detection is by application only; we could not test it."
verdict: "The third big lab to mark text by default for the EU AI Act. If you ship Grok output, check the x-watermark header and decide on opt-out before 7 November."
sources:
  - title: "SpaceXSI docs: Output Watermarking (last updated 31 October 2026)"
    url: https://docs.x.ai/developers/advanced-api-usage/watermarking
  - title: "The AI Pin: xAI to watermark Grok API text by default from November 7"
    url: https://theaipin.com/science/xai-to-watermark-grok-api-text-by-default-from-november-7
---

*aitamer.news is produced with Grok Bot, an xAI product. xAI has no say over this story.*

xAI will add an invisible watermark to text from its Grok API models, switched on by default. The company's [developer docs](https://docs.x.ai/developers/advanced-api-usage/watermarking), which now carry the SpaceXSI name and were last updated on 31 October, say: "Starting November 7, 2026, responses from these models include a watermark. It's on by default, and you can opt out per model." The stated reason is to comply with the EU AI Act.

## Which models and outputs

The list is `grok-4.7`, `grok-4.6`, `grok-4.5`, `grok-4.3`, `grok-4.20-reasoning`, `grok-4.20-non-reasoning` and `grok-4.20-multi-agent`. The watermark covers text from both the Responses API and the Chat Completions API, including structured outputs and tool call arguments, and it applies on the global endpoint and every regional endpoint.

Nothing changes in your requests. There is no parameter to send. To see whether a response was marked, read the `x-watermark` response header: `true` means watermarked, and any other value or no header means it was not.

## Opting out

- **Who:** team admins, in the SpaceXSI Console, model by model.
- **Scope:** the setting belongs to the team, so it applies to every API key on it.
- **Condition:** opting out asks you to confirm that "an exception under applicable law applies to your use", and that you are solely responsible for any marking or disclosure the law requires.
- **Timing:** changes apply to new requests within 5 minutes, and every change is recorded in the team audit log.
- **Locked models:** some models "may be locked on" for a team and cannot be turned off from the Console.

## Detection

xAI says detection is statistical and reports watermarked, not watermarked or uncertain, with longer text giving a stronger signal. Access to the detection API "is granted by application", so most developers cannot check text themselves. The docs say watermarking does not change response quality or speed. That is xAI's claim; we have not tested it.

OpenAI went the other way in October, with [opt-in API text watermarks and planned EU marks in ChatGPT](/posts/openai-eu-text-watermarking/). xAI makes it the default for the whole current lineup, including [Grok 4.7](/posts/grok-4-7/).

## Why this matters

If your product passes Grok output to users in the EU, the marking is now handled for you unless you opt out, and opting out shifts the legal duty to your team. Before 7 November, decide per model whether you need an exception, tell whoever holds the admin role, and log the `x-watermark` header in production so you can show which responses were marked. If you post-process text heavily, ask whether the mark survives, because xAI has not published that.
