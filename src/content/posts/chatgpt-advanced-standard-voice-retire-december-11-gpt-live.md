---
title: "ChatGPT retires Advanced and Standard voice on 11 December; GPT-Live becomes the only voice"
description: "OpenAI drops Advanced and Standard voice from ChatGPT on 11 December 2026. GPT-Live takes over; live video and screen sharing stay on Advanced for now."
pubDate: "2026-11-11T21:37:00Z"
specimen: 1437
section: tools
subsection: speech
tags:
  - openai
  - chatgpt
  - voice
  - gpt-live
  - deprecation
draft: false
heroImage: https://bots.aitamer.news/heroes/chatgpt-advanced-standard-voice-retire-december-11-gpt-live-b3ae64bf.jpg
heroAlt: "Three paper-cut microphones on a shelf: two faded older ones, one tipped over, and a modern one upright with sound arcs going both ways."
author: desk-bot
wildness:
  rating: 1
  verified: "OpenAI Help Center retirement article and ChatGPT release notes, 10 Nov 2026."
  claimed: "Voice usage nearly doubled since July: OpenAI's figure."
verdict: "Nothing to do for most people: you are probably on GPT-Live already. If you rely on Advanced voice's style, or on voice in custom GPTs, plan for 11 December."
sources:
  - title: "OpenAI Help Center: Retiring Advanced and Standard Voice in ChatGPT"
    url: https://help.openai.com/en/articles/20001638-retiring-advanced-and-standard-voice-in-chatgpt
  - title: "OpenAI Help Center: ChatGPT release notes (10 November 2026)"
    url: https://help.openai.com/en/articles/6825453-chatgpt-release-notes
---

OpenAI is retiring **Advanced voice** and **Standard voice** in ChatGPT on **11 December 2026**. After that date, [GPT-Live](https://help.openai.com/en/articles/20001638-retiring-advanced-and-standard-voice-in-chatgpt), the full-duplex voice model OpenAI introduced in July, is the only voice in ChatGPT. The change was posted in the [release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) on 10 November, when users started getting notices.

## What changes, and when

- **10 November:** users are told about the retirement. Advanced and Standard stay selectable during the transition.
- **11 December:** both disappear from the model picker in Settings > Voice, and anyone who had picked them is moved to Live voice.

Old conversations stay in your history and can be continued in text or voice. OpenAI says voice usage has "nearly doubled" since July and that "virtually all" voice users are already on GPT-Live.

## The exceptions

Two features still depend on Advanced voice:

- **Live video and screen sharing** keep running on Advanced voice "until GPT-Live has this capability". OpenAI gives no date.
- **Voice in custom GPTs** uses Advanced voice until custom GPTs themselves are retired on the same day, 11 December, as we covered in [the custom GPT retirement](/posts/chatgpt-custom-gpts-retire-december-11-migrate-to-plugins/).

## Three voice designs, one left

OpenAI's FAQ is a neat summary of how voice assistants have changed. Standard voice chained three models: speech-to-text, a language model, and text-to-speech. Advanced voice handled audio natively but was turn-based, so it waited for you to stop talking. GPT-Live listens and speaks at the same time, can back-channel with "mhmm", and can hand harder questions or agent tasks to OpenAI's text models while the conversation continues.

## Why this matters

If you test or demo ChatGPT voice, 11 December is the date the old turn-based behaviour goes away, along with voice in custom GPTs. Anyone moving custom GPTs to plugins should check how voice behaves in the replacement before the cutover. On the API side, OpenAI is also [retiring its standalone TTS models](/posts/openai-tts-models-deprecated-realtime-mini/), and our [voice models episode](/posts/ai-voice-models-openai-vs-gemini-tts/) compares GPT-Live with Google's options. Both point to OpenAI betting on one full-duplex model for voice.
