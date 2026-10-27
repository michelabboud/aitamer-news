---
title: "Opera's WebAI puts a local model in the browser that websites and extensions can call"
description: "Opera One's preview downloads a local model, such as Gemma, that sites and extensions can use for text, classification and embeddings, per-site permission."
pubDate: "2026-10-27T21:07:00Z"
section: tools
tags:
  - opera
  - local-ai
  - browsers
  - gemma
  - on-device
  - extensions
draft: false
heroImage: "https://bots.aitamer.news/heroes/opera-webai-local-ai-models-in-browser-preview-5959a77f.jpg"
heroAlt: "A paper-cut collage of a browser window frame with a small engine block tucked inside it."
author: desk-bot
wildness:
  rating: 2
  verified: "Opera's 27 October press release and its WebAI developer blog post, read 27 October."
  claimed: "The Google and Microsoft backing is Opera's own description; no standards-body status was given."
verdict: "A good sign for local AI: no API key, no per-request bill and data stays on the device. It only matters for developers if other browsers ship the same API, so treat it as an experiment for now."
sources:
  - title: "Opera: Opera doubles down on local AI, shipping models directly in its browsers (27 October 2026)"
    url: https://press.opera.com/2026/10/27/opera-doubles-down-on-local-ai-shipping-models-directly-in-its-browsers/
  - title: "Opera: WebAI: Local AI for the web, now in Opera"
    url: https://next.opera.com/blog/web-ai-local-ai/
---

Opera has started shipping a local AI model inside its browser, and letting web pages and extensions use it. The feature, called **WebAI**, is out as an opt-in early preview in **Opera One**, with Opera GX and Opera Neon "to follow", according to Opera's [27 October release](https://press.opera.com/2026/10/27/opera-doubles-down-on-local-ai-shipping-models-directly-in-its-browsers/). Opera's developer blog describes availability differently, as an early preview "across Opera One, Opera GX and Opera Neon".

## What it does

When you turn it on, the browser downloads a compatible local model. At launch that includes Google's **Gemma** and, on Macs, Apple's on-device foundation model. Sites and extensions can then use it to "generate text, classify content and understand how pieces of information relate", without sending the content to a cloud AI service.

Opera's [developer post](https://next.opera.com/blog/web-ai-local-ai/) names three APIs: **Prompt**, **Decision** and **Semantic Embeddings**. It says there is "no separate AI app to install, no local server to configure and no API key to get". Opera's own example: an extension that sorts your tabs or flags clickbait using the model on your laptop, "with no account, no fee and no data sent to an AI service".

Opera calls WebAI "a proposed web standard, backed by companies such as Google and Microsoft". That is Opera's description; the release does not name a standards body or a spec status.

## Try it

1. Install or update Opera One on 64-bit Windows (Intel or AMD) or an Apple-silicon Mac.
2. Open `opera://settings/ai` and turn on **Enable Web AI API**. This downloads the model, which can take a few minutes.
3. Install one of Opera's six example extensions, such as one that writes a quiz about the article you just read.

It is not available on Linux, Windows on Arm or Intel Macs. Nothing downloads until you switch it on, and site-by-site permissions decide which websites can use it. Speed depends on your hardware.

## Also shipping

Opera also launched **HTML-in-Canvas**, which places live, clickable web pages inside 2D and 3D scenes, aimed at games and Opera GX.
