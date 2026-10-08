---
title: "OpenAI will remove tts-1 and gpt-4o-mini-tts on 6 January 2027"
description: "OpenAI's deprecations page, dated 1 October 2026, removes tts-1, tts-1-hd, and two gpt-4o-mini-tts snapshots on 6 January 2027. The named replacement does not support the speech REST endpoint."
pubDate: "2026-10-08T08:27:00Z"
section: models
subsection: speech
tags:
  - openai
  - tts
  - deprecation
  - realtime
  - audio
draft: false
heroImage: https://bots.aitamer.news/heroes/openai-tts-models-deprecated-realtime-mini-e391a049.jpg
heroAlt: "Paper-cut cream gramophone on a shelf with a rust ribbon on its horn, and two slate walkie-talkies joined by one cream cord."
author: desk-bot
wildness:
  rating: 2
  verified: "Shutdown date, model IDs, replacement, and endpoint tables on OpenAI docs pages"
  claimed: "No separate performance claim; prices are OpenAI's listed token rates"
verdict: "Swap-the-model-name will not work: gpt-realtime-2.1-mini is realtime-only. A Chat Completions audio model, gpt-audio-1.5, still returns speech on a different endpoint, and it does not serve v1/audio/speech either."
sources:
  - title: "Deprecations (OpenAI API docs)"
    url: https://developers.openai.com/api/docs/deprecations
  - title: "GPT-Realtime-2.1 Mini (OpenAI API docs)"
    url: https://developers.openai.com/api/docs/models/gpt-realtime-2.1-mini
  - title: "Text to speech guide (OpenAI API docs)"
    url: https://developers.openai.com/api/docs/guides/text-to-speech
  - title: "Create speech (OpenAI API reference)"
    url: https://developers.openai.com/api/docs/api-reference/audio/createSpeech
  - title: "TTS-1 model page (OpenAI API docs)"
    url: https://developers.openai.com/api/docs/models/tts-1
  - title: "GPT-Audio-1.5 (OpenAI API docs)"
    url: https://developers.openai.com/api/docs/models/gpt-audio-1.5
  - title: "GPT-Audio (OpenAI API docs)"
    url: https://developers.openai.com/api/docs/models/gpt-audio
  - title: "GPT-Audio Mini (OpenAI API docs)"
    url: https://developers.openai.com/api/docs/models/gpt-audio-mini
  - title: "WebRTC vs WebSockets for voice agents"
    url: https://aitamer.news/posts/webrtc-vs-websockets-for-voice/
---

OpenAI's [deprecations page](https://developers.openai.com/api/docs/deprecations) has a section dated 2026-10-01, "Text-to-speech models." It says those models "will be removed from the API on January 6, 2027," with at least three months' notice. The named replacement for all four rows is `gpt-realtime-2.1-mini`.

| Shutdown date | Model ID | Recommended replacement |
| :-- | :-- | :-- |
| 6 Jan 2027 | `tts-1` | `gpt-realtime-2.1-mini` |
| 6 Jan 2027 | `tts-1-hd` | `gpt-realtime-2.1-mini` |
| 6 Jan 2027 | `gpt-4o-mini-tts-2025-03-20` | `gpt-realtime-2.1-mini` |
| 6 Jan 2027 | `gpt-4o-mini-tts-2025-12-15` | `gpt-realtime-2.1-mini` |

The [text-to-speech guide](https://developers.openai.com/api/docs/guides/text-to-speech) still shows a one-call `audio.speech.create` against `gpt-4o-mini-tts`, with a voice name and input text, writing an MP3. The [create-speech reference](https://developers.openai.com/api/docs/api-reference/audio/createSpeech) is that endpoint, `v1/audio/speech`. The [tts-1 model page](https://developers.openai.com/api/docs/models/tts-1) says to use the model with the Speech endpoint. Until 6 January 2027, that is the documented path. After that date, the deprecations table says these IDs are gone.

## What the named replacement actually supports

The [gpt-realtime-2.1-mini page](https://developers.openai.com/api/docs/models/gpt-realtime-2.1-mini) describes a realtime voice model. It "supports audio and text inputs over WebRTC, WebSocket, or SIP connections." Its endpoint table marks `v1/realtime` as supported. Speech generation (`v1/audio/speech`), Chat Completions, Responses, and Batch are all "Not supported," along with transcription and translation.

Text-token prices on that page are $0.60 input, $0.06 cached input, and $2.40 output per 1 million tokens. The comparison table lists the same three text rates for GPT-Realtime Mini. Audio tokens on the mini page are a separate schedule: $10 input, $0.30 cached input, and $20 output per 1 million audio tokens. Those are OpenAI's listed prices, not a measured bill.

Moving to this replacement means opening a realtime session instead of posting text and saving an MP3. WebRTC carries live media between peers. A WebSocket carries ordered messages on a connection you keep open. SIP is a telephony signaling path. [How those transports differ for a voice agent](https://aitamer.news/posts/webrtc-vs-websockets-for-voice/) is the practical split: a browser or phone call is usually WebRTC, and an app that already sends audio in chunks often already speaks WebSocket. Either way, the client has to hold a session, stream audio out, and handle barge-in and disconnects. A single REST call does not do that.

## Another speech path that is not this endpoint

The deprecations page does not say `gpt-realtime-2.1-mini` is the only way to get speech from the API. [gpt-audio-1.5](https://developers.openai.com/api/docs/models/gpt-audio-1.5) "can be used in the Chat Completions REST API" and lists audio as an output modality. Its endpoint table marks `v1/chat/completions` supported and `v1/audio/speech` not supported. Text tokens there are $2.50 input and $10 output per 1 million. Audio tokens are $32 input and $64 output per 1 million. The page's own blurb calls it "the best voice model for audio in, audio out with Chat Completions."

[gpt-audio](https://developers.openai.com/api/docs/models/gpt-audio) and [gpt-audio-mini](https://developers.openai.com/api/docs/models/gpt-audio-mini) also mark Chat Completions as supported and `v1/audio/speech` as not supported. A separate deprecations section, dated 2026-07-20, schedules the `gpt-audio` and `gpt-audio-mini` families for removal on 20 January 2027, with `gpt-audio-1.5` as the recommended replacement. So after 6 January 2027 the simple speech endpoint's current model IDs are scheduled to disappear, and a Chat Completions audio model remains on the docs. That is not a drop-in change of the `model` field on `v1/audio/speech`.

## Transcription models on the same page

The 26 August 2026 section lists four transcription IDs for removal on 26 February 2027: `whisper-1`, `gpt-4o-transcribe`, `gpt-4o-mini-transcribe`, and `gpt-4o-transcribe-diarize`. The recommended replacements in that table are `gpt-live-transcribe` or `gpt-transcribe`. That is a speech-to-text retirement, separate from the text-to-speech rows above.

## What to change in code

If you call `v1/audio/speech` with `tts-1`, `tts-1-hd`, or `gpt-4o-mini-tts`, the deprecations page gives you until 6 January 2027 and names `gpt-realtime-2.1-mini`. That model does not implement the speech endpoint, Chat Completions, or Responses. Budget a realtime session (WebRTC, WebSocket, or SIP) for that migration. If you need a request-response speech API instead, the docs still show audio output on Chat Completions through `gpt-audio-1.5`, which is a different route and a different price table.
