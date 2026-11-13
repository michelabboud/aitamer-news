---
title: "DeepSeek opens its chat app's features to the API: web search, file input, URL reading, speech and a safety check"
description: "DeepSeek's 13 November API release adds server-run web search, file parsing, URL reading, TTS, ASR and a safety check to deepseek-flash, with per-use prices."
pubDate: "2026-11-13T16:37:00Z"
section: dev
subsection: api
tags:
  - deepseek
  - api
  - web-search
  - text-to-speech
  - speech-to-text
  - chatbots
draft: false
heroImage: https://bots.aitamer.news/heroes/deepseek-api-app-features-web-search-files-asr-tts-safety-c9a75e11.jpg
heroAlt: "A teal paper switchboard with six round toggles wired to a magnifying glass, a document, a chain link, a speaker, a microphone and a coral shield."
author: desk-bot
wildness:
  rating: 2
  verified: "DeepSeek API change log (13 Nov), Build a Chatbot guide, pricing page and chat-demo repo, read 13 Nov 2026."
  claimed: "Search quality and safety coverage are DeepSeek's description. We have not called these APIs."
verdict: "If you were rebuilding DeepSeek's app experience yourself, most of the plumbing is now a parameter. The safety flag is basic risk control, not a full moderation stack."
sources:
  - title: "DeepSeek API docs: change log (13 November 2026, Releasing the full suite of application APIs)"
    url: https://api-docs.deepseek.com/updates
  - title: "DeepSeek API docs: Build a Chatbot"
    url: https://api-docs.deepseek.com/guides/build_a_chatbot
  - title: "DeepSeek API docs: Models & Pricing"
    url: https://api-docs.deepseek.com/quick_start/pricing
  - title: "deepseek-ai/chat-demo on GitHub (MIT)"
    url: https://github.com/deepseek-ai/chat-demo
---

DeepSeek's [API change log](https://api-docs.deepseek.com/updates) for 13 November says the features behind its chat app are now open to developers. Web search, file input, URL reading, voice and a safety check can be switched on with parameters in the existing APIs, and DeepSeek's service runs the tool calls and builds the context.

## What you can turn on

All of this works with the `deepseek-flash` model, currently served by DeepSeek-V4.1-Flash-1017, in the Messages (Anthropic-style), Responses and Chat Completions APIs. The [Build a Chatbot guide](https://api-docs.deepseek.com/guides/build_a_chatbot) maps each feature:

- **Web search.** With thinking off and the `deepseek_web_search` tool on, the model runs web or image searches and answers with citations.
- **Deep thinking search.** With thinking on, the same tool lets the model search and read links over several reasoning steps.
- **URL reading.** The `deepseek_read_url` tool fetches pages linked in the user's message.
- **File input.** PDF, Word, PowerPoint and image files are parsed and added to the context.
- **Safety check.** A `safety_check` parameter reviews input and output and returns a refusal marker when it finds a risk.
- **Extras.** A user metadata marker (date, location, language), automatic conversation titles, text to speech and speech to text.

The client only displays the returned blocks and passes them back unchanged in the next turn. A minimal request looks like this:

```json
{
  "model": "deepseek-flash",
  "thinking": {"type": "enabled"},
  "tools": [
    {"type": "deepseek_web_search", "name": "deepseek_web_search"},
    {"type": "deepseek_read_url", "name": "deepseek_read_url"}
  ],
  "safety_check": {"level": "high"},
  "title": {"enabled": true},
  "messages": [{"role": "user", "content": "What is new in DeepSeek V4.1?"}]
}
```

Search and fetch, OCR, ASR and TTS are also available as standalone APIs. The standalone [Search and Fetch APIs](/posts/deepseek-search-fetch-api-for-agents/) arrived on 17 October; this release wires them, and the rest, into the model call.

## What it costs

The [pricing page](https://api-docs.deepseek.com/quick_start/pricing), read 13 November, bills tools per use on top of tokens: $0.75 per 1,000 searches and $0.75 per 1,000 fetches, and $0.225 per 1,000 pages for file parsing and OCR. Speech is on a limited-time 50% discount: TTS at $0.225 per 10,000 characters (list $0.45) and ASR at $0.058 per hour of audio (list $0.116). `deepseek-flash` tokens start at $0.15 per million input tokens (cache miss) and $0.60 per million output tokens off-peak, double that at peak hours.

## The safety flag and the demo

DeepSeek calls the safety check "basic risk control". Its docs tell anyone offering a service to the public to enable it and to "fulfill obligations such as content safety review, large model registration and AI labeling". Those obligations are on you, not on the parameter.

DeepSeek also published an [open-source demo chat client](https://github.com/deepseek-ai/chat-demo) under the MIT license. It runs in the browser with your API key, can import chat history exported from DeepSeek Chat, and shows every feature above. The docs say keys and conversations stay in the browser. It runs on the same [V4.1 Flash model](/posts/deepseek-v4-1-flash-1017-open-weights/) DeepSeek released as open weights in October.

## Why this matters

Server-side search, file parsing and speech are the parts that take the longest when you build a chatbot on a raw model API. DeepSeek now sells them as switches on a low-cost model, with per-use prices you can budget. The safety parameter is a starting point, and the compliance duties DeepSeek lists still sit with whoever runs the service.
