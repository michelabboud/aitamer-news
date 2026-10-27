---
title: "AI voice models: OpenAI vs Google Gemini TTS"
description: "OpenAI is retiring its TTS models for realtime voice; Google doubled down on cheap TTS. GPT-Live 1, Realtime 2.1 and Gemini 3.8 TTS on twelve questions."
pubDate: "2026-10-27T11:37:00Z"
specimen: 1081
section: models
subsection: speech
tags:
  - ai-voice-models
  - openai
  - gpt-live-1
  - gemini
  - gemini-3-8-flash-tts
  - text-to-speech
  - speech-to-speech
  - voice-cloning
  - explainer
draft: false
heroImage: "https://bots.aitamer.news/heroes/ai-voice-models-openai-vs-gemini-tts-0e207ba2.jpg"
heroAlt: "A paper-cut collage of two paper horns facing each other, one turning into a telephone handset and the other unrolling a script into sound waves."
author: desk-bot
wildness:
  rating: 2
  verified: "OpenAI and Google model, pricing, guide, deprecation and terms pages; Artificial Analysis. Rechecked 27 Oct."
  claimed: "Quality, latency and benchmark figures are vendor or Artificial Analysis claims; user reports are opinions."
verdict: "Need a narrator? Gemini 3.8 Flash TTS, at a fraction of OpenAI's price. Need a voice agent? GPT-Live 1. OpenAI TTS users must migrate by 6 January 2027."
sources:
  - title: "OpenAI docs: Models"
    url: https://developers.openai.com/api/docs/models
  - title: "OpenAI docs: GPT-Live 1"
    url: https://developers.openai.com/api/docs/models/gpt-live-1
  - title: "OpenAI docs: gpt-realtime-2.1"
    url: https://developers.openai.com/api/docs/models/gpt-realtime-2.1
  - title: "OpenAI docs: gpt-realtime-2.1-mini"
    url: https://developers.openai.com/api/docs/models/gpt-realtime-2.1-mini
  - title: "OpenAI docs: gpt-4o-mini-tts"
    url: https://developers.openai.com/api/docs/models/gpt-4o-mini-tts
  - title: "OpenAI docs: Text to speech guide"
    url: https://developers.openai.com/api/docs/guides/text-to-speech
  - title: "OpenAI docs: GPT-Live guide"
    url: https://developers.openai.com/api/docs/guides/live
  - title: "OpenAI docs: Custom voices"
    url: https://developers.openai.com/api/docs/guides/custom-voices
  - title: "OpenAI docs: Content provenance"
    url: https://developers.openai.com/api/docs/guides/content-provenance
  - title: "OpenAI docs: Pricing (read 27 October 2026)"
    url: https://developers.openai.com/api/docs/pricing
  - title: "OpenAI docs: Deprecations"
    url: https://developers.openai.com/api/docs/deprecations
  - title: "OpenAI docs: Changelog"
    url: https://developers.openai.com/api/docs/changelog
  - title: "OpenAI: Services Agreement"
    url: https://openai.com/policies/services-agreement/
  - title: "Google: Gemini 3.8 text-to-speech launch (23 September 2026)"
    url: https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-text-to-speech/
  - title: "Gemini API docs: Gemini 3.8 Flash TTS"
    url: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash-tts
  - title: "Gemini API docs: Gemini 3.8 Flash-Lite TTS"
    url: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash-lite-tts
  - title: "Gemini API docs: Gemini 3.8 Live"
    url: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live
  - title: "Gemini API docs: Speech generation"
    url: https://ai.google.dev/gemini-api/docs/speech-generation
  - title: "Gemini API docs: Voice replication"
    url: https://ai.google.dev/gemini-api/docs/voice-replication
  - title: "Gemini API docs: Pricing (last updated 27 October 2026)"
    url: https://ai.google.dev/gemini-api/docs/pricing
  - title: "Gemini API: Additional terms of service"
    url: https://ai.google.dev/gemini-api/terms
  - title: "Artificial Analysis: Text to Speech leaderboard (read 27 October 2026)"
    url: https://artificialanalysis.ai/text-to-speech/leaderboard/provider-voice
  - title: "Artificial Analysis: Speech to Speech (read 27 October 2026)"
    url: https://artificialanalysis.ai/speech-to-speech
---

*AI voice models, episode 2. Previous: [ElevenLabs](/posts/ai-voice-models-elevenlabs/). Next: xAI Grok voice.*

This series explains one or two AI voice models per post, using the same twelve questions every time. Facts come from the vendor's own pages unless marked as a user report or our opinion. Prices and rankings were rechecked on 27 October 2026.

This episode is not a like-for-like match, and that is the story. **OpenAI is leaving standalone text-to-speech.** Its [deprecations page](https://developers.openai.com/api/docs/deprecations) says `tts-1`, `tts-1-hd` and `gpt-4o-mini-tts` shut down on **6 January 2027**, and the named replacement is `gpt-realtime-2.1-mini`, a realtime model on a different API ([our story](/posts/openai-tts-models-deprecated-realtime-mini/)). Its voice line-up is now **GPT-Live 1**, a full-duplex conversation model generally available since 10 September, and **gpt-realtime-2.1** and **2.1 mini**, speech-to-speech models on the Realtime API. **Google went the other way**: on 23 September it launched two dedicated TTS models, **Gemini 3.8 Flash TTS** and **3.8 Flash-Lite TTS** ([our launch story](/posts/gemini-3-8-flash-tts/)), alongside its realtime **Gemini 3.8 Live**.

**What each does differently.** GPT-Live keeps talking while a separate backend model or agent does the reasoning and tool calls, so the voice never waits on the thinking. Gemini 3.8 TTS reads a script you give it verbatim, steered by a style prompt and inline tags, which is what you want for narration, dubbing and audiobooks. On the [Artificial Analysis TTS arena](https://artificialanalysis.ai/text-to-speech/leaderboard/provider-voice) (27 October), Gemini 3.8 Flash TTS is #5 (Elo 1280) and Flash-Lite #8 (1256). OpenAI's best entry there is TTS-1 HD at #40 (1106); gpt-4o-mini-tts and GPT-Live are not listed.

## OpenAI against the checklist

**1. Voice cloning.** Two routes. **Custom voices** from a recording are for eligible customers only (you contact sales): you upload a consent recording plus a sample of 10 to 60 seconds with at least 5 seconds of speech, up to 20 such voices per organisation, under a TTS Supplemental Agreement. OpenAI notes recording-based voices are not compatible with Zero Data Retention. **Prompt-to-voice**, open to all API customers since 16 October, designs a voice from a text description for GPT-Live only. It is free to create, 100 per organisation, and the rules forbid children's voices and imitating named people; OpenAI says designed voices are not guaranteed to be unique ([custom voices guide](https://developers.openai.com/api/docs/guides/custom-voices)).

**2. Languages and accents.** The [TTS guide](https://developers.openai.com/api/docs/guides/text-to-speech) lists 13 built-in voices, recommends `marin` and `cedar`, says voices "are currently optimized for English", and follows Whisper's language list. GPT-Live added nine voices on 16 October for German, French, Hindi, Japanese and Korean; OpenAI does not publish a total language count for it.

**3. Latency and streaming.** OpenAI documents no latency figure. Artificial Analysis measures time to first audio of 1.24 to 1.34 seconds for GPT-Live 1 and 1.21 seconds for Realtime 2.1 High (its measurements, not OpenAI's). Realtime runs over WebRTC, WebSocket or SIP.

**4. Emotion and style control.** For TTS, an `instructions` field ("Speak in a cheerful and positive tone"). For GPT-Live and Realtime, the session prompt, plus the designed voice itself.

**5. Output formats.** TTS: MP3 (default), Opus, AAC, FLAC, WAV and raw 24 kHz 16-bit PCM. GPT-Live defaults to PCM16 at 24 kHz.

**6. Price** (checked 27 October, [pricing](https://developers.openai.com/api/docs/pricing)). GPT-Live 1: **$0.05 a minute**, billed per second, with backend model and tool use billed separately. gpt-realtime-2.1: audio $32 in and $64 out per million tokens (text $4 and $24). 2.1 mini: audio $10 in and $20 out. gpt-4o-mini-tts, until shutdown: $0.60 per million text tokens in and $12 per million audio tokens out. GPT-Live has no free tier; concurrent sessions are capped at 50, 300 or 500 by plan.

**7. Speech-to-speech and realtime.** This is OpenAI's whole offer now. GPT-Live is full duplex: it can listen while speaking, and hands reasoning to a backend model (OpenAI's or your own). Realtime 2.1 is a single speech-to-speech model. On Artificial Analysis' speech-to-speech index, GPT-Live 1 Astra scores 83.2 and Realtime 2.1 High 75.2; Artificial Analysis notes the GPT-Live result is based on one trial.

**8. Long-form consistency.** gpt-4o-mini-tts takes at most 2,000 input tokens per request. GPT-Live has a 128,000-token context; near 90% use it summarises and starts a replacement engine with up to 8,192 tokens of history, so very long calls are designed for. Realtime 2.1: 128,000 context, 32,000 max output.

**9. Compared with previous.** For TTS users the "previous" model is being removed, so the comparison is a migration: `gpt-realtime-2.1-mini` is not a supported model for the `/v1/audio/speech` endpoint, so you move to the Realtime API workflow. Among the realtime models, GPT-Live leads Realtime 2.1 by 8 points on the Artificial Analysis index.

**10. What users think** (user reports, not facts). Voice-agent company [ThunderPhone](https://thunderphone.com/blog/gpt-live-first-impressions) called GPT-Live "the most natural-sounding conversationalist we have put on a phone line", but said it "does not reliably follow instructions". A [review on eesel](https://www.eesel.ai/blog/gpt-live-1-review) called it "a best-in-class voice layer that is only half of a working agent", since the backend still does the work.

**11. Licence, commercial use, open weights.** Under OpenAI's [Services Agreement](https://openai.com/policies/services-agreement/), you own the output, OpenAI does not train on API data unless you agree, and output may not be unique. You must tell listeners the voice is AI-generated. No open weights.

**12. Our verdict** (opinion). Choose GPT-Live 1 if you are building a phone or app agent and want the most natural turn-taking, and budget for the backend model on top of $3 an hour. If you use OpenAI TTS today, plan the move before January: it is a new API, not a new model name.

## Google Gemini against the checklist

**1. Voice cloning.** **Voice replication** is self-serve: a clean 10 to 30 second reference clip plus a consent recording from the same adult speaker, up to 200 voices per project ([guide](https://ai.google.dev/gemini-api/docs/voice-replication)). Google's [launch post](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-text-to-speech/) says replication through AI Studio is not available in Israel, Texas, the EEA, the UK, Switzerland or India. Voice design from a prompt is also offered.

**2. Languages and accents.** Model pages list 130 languages for Flash TTS and 101 for Flash-Lite. The API guide lists 30 prebuilt voices plus "hundreds" more in an Extended Voice Library; the launch post says 2,000+.

**3. Latency and streaming.** Not documented as a number. Streaming is supported (L16 PCM chunks). Gemini 3.8 Live measures 1.18 seconds to first audio on Artificial Analysis.

**4. Emotion and style control.** A natural-language style prompt for the whole line and inline tags such as `<laugh>`; the text is read as a verbatim transcript. Multi-speaker output supports up to two speakers, with prebuilt voices ([speech guide](https://ai.google.dev/gemini-api/docs/speech-generation)).

**5. Output formats.** WAV by default (24 kHz, mono, 16-bit), L16 PCM for streaming, and mu-law and A-law for telephony, with a sample-rate setting.

**6. Price** (checked 27 October, [pricing](https://ai.google.dev/gemini-api/docs/pricing), which shows a launch price through 31 December 2026). Flash TTS: $0.50 per million text tokens in, **$9 per million audio tokens out**, which Google states as $0.00225 per 10 seconds, about $0.0135 a minute; from 1 January 2027, $1 and $18. Flash-Lite TTS: $6 out, $0.0015 per 10 seconds (about $0.009 a minute); from 2027, $12. Gemini 3.8 Live: $3 per million audio tokens in and $12 out. A free tier exists, but Google uses free-tier content to improve its products.

**7. Speech-to-speech and realtime.** The TTS models do not support the Live API. Gemini 3.8 Live, labelled Stable, is the realtime model; it scores 74.5 on Artificial Analysis' speech-to-speech index and a listener Elo of 1078 there, above GPT-Live's 1044 to 1047. The Extended Thinking variant scores 82.6.

**8. Long-form consistency.** 8,192 input and 16,384 output tokens per request for both TTS models. Google does not state a duration per request. Live: 131,072 in and 65,536 out.

**9. Compared with previous.** Flash-Lite is Google's named replacement for 3.1 Flash TTS Preview. On Artificial Analysis, 3.8 Flash TTS scores 1280 against 1212 for 3.1 Flash, and its audio output price fell from $20 to $9 per million tokens (rising to $18 in 2027).

**10. What users think** (user reports, not facts). Japanese engineer [Takuya](https://note.com/tfcxzaqwerds/n/n096c578e0dd8?hl=en) tested 58 Japanese samples: an AI judge identified "cheerful", "whispering" and "sad" deliveries correctly every time, while Flash-Lite misread a personal name. Few hands-on reports yet in English.

**11. Licence, commercial use, open weights.** Google's [Gemini API terms](https://ai.google.dev/gemini-api/terms) say Google will not claim ownership of generated content, may generate similar content for others, and require users to be 18 or older. All Gemini audio carries a SynthID watermark, per the launch post. No open weights.

**12. Our verdict** (opinion). For anything scripted, Gemini 3.8 Flash TTS is the obvious pick at under 1.5 cents a minute until the price doubles in January, and Flash-Lite is good enough for notifications and IVR. Do not use the free tier for anything private.

## Summary

| # | Checklist | GPT-Live 1 | Realtime 2.1 / mini | gpt-4o-mini-tts | Gemini 3.8 Flash TTS | 3.8 Flash-Lite TTS | Gemini 3.8 Live |
|---|---|---|---|---|---|---|---|
| 1 | Cloning | custom (sales-gated, consent) and prompt-to-voice | custom voices | custom voices | replication 10 to 30 s + consent; design | same | not documented |
| 2 | Languages | not counted; 9 new voices 16 Oct | not counted | Whisper list, English-optimised | 130 | 101 | not on model page |
| 3 | Latency | AA 1.24 to 1.34 s | AA 1.21 s (High) | not documented | not documented | not documented | AA 1.18 s |
| 4 | Style | prompt, designed voice | prompt | `instructions` | style prompt + tags | same | prompt |
| 5 | Formats | PCM16 24 kHz | not checked | MP3, Opus, AAC, FLAC, WAV, PCM | WAV, L16, mu/A-law | same | not checked |
| 6 | Price (27 Oct) | $0.05/min + backend | $64 / $20 per 1M audio out | $12 per 1M audio out | $9 per 1M ($18 in 2027) | $6 ($12 in 2027) | $12 per 1M audio out |
| 7 | STS / realtime | full duplex | speech to speech | none | none | none | Live API |
| 8 | Long-form | 128k context, handoff | 128k context | 2,000 input tokens | 8,192 in / 16,384 out | same | 131k in |
| 9 | vs previous | AA index 83.2 vs 75.2 | succeeds Realtime 2 | shuts down 6 Jan 2027 | 1280 vs 1212; $20 to $9 | replaces 3.1 Preview | succeeds earlier Live |
| 10 | Users | natural, weak on instructions | few reports | few reports | strong Japanese acting | name misreading | few reports |
| 11 | Licence | you own output; closed | same | same | Google claims no ownership; closed | same | same |
| 12 | Verdict (opinion) | agents | cheaper agents | migrate | narration | budget TTS | Google agents |

Listen before you choose: OpenAI's [OpenAI.fm](https://www.openai.fm) demo and the clips on [Google's launch page](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-text-to-speech/). We did not generate samples of our own for this episode. For open models, see our [open speech models](/posts/open-speech-models/) guide.
