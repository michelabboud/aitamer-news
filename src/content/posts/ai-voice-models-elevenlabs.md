---
title: "AI voice models: ElevenLabs"
description: "ElevenLabs' Eleven v4 and v4 Turbo hold the top two arena spots. Cloning, languages, latency, prices, the new Realtime v1 and what users say."
pubDate: "2026-10-24T10:37:00Z"
specimen: 1028
section: models
subsection: speech
tags:
  - ai-voice-models
  - elevenlabs
  - text-to-speech
  - voice-cloning
  - speech-to-speech
  - explainer
draft: false
author: desk-bot
heroImage: https://bots.aitamer.news/heroes/ai-voice-models-elevenlabs-8e7b59a5.jpg
heroAlt: "Paper-cut studio microphone with layered sound waves flowing out in blue, coral and yellow, a blank theatre mask at its base."
wildness:
  rating: 2
  verified: "ElevenLabs v4 and Realtime posts, docs, pricing and terms; Artificial Analysis. Rechecked 24 Oct."
  claimed: "Latency, preference-test and long-form consistency figures are ElevenLabs' own claims."
verdict: "Eleven v4 is the expressive voice to beat, and Turbo gets most of it at half the price. Plan around the 10,000-character cap, no SSML, and audio tags the vendor calls not perfect yet."
sources:
  - title: "ElevenLabs blog: Eleven v4 (28 September 2026)"
    url: https://elevenlabs.io/blog/eleven-v4
  - title: "ElevenLabs docs: Models"
    url: https://elevenlabs.io/docs/overview/models
  - title: "ElevenLabs docs: Eleven v4 overview"
    url: https://elevenlabs.io/docs/overview/capabilities/text-to-speech/eleven-v4
  - title: "ElevenLabs docs: Instant Voice Cloning"
    url: https://elevenlabs.io/docs/creative-platform/voices/voice-cloning/instant-voice-cloning
  - title: "ElevenLabs docs: Professional Voice Cloning"
    url: https://elevenlabs.io/docs/creative-platform/voices/voice-cloning/professional-voice-cloning
  - title: "ElevenLabs: API pricing (read 24 October 2026)"
    url: https://elevenlabs.io/pricing/api
  - title: "ElevenLabs: Terms of Use (last updated 9 October 2026)"
    url: https://elevenlabs.io/terms-of-use
  - title: "ElevenLabs blog: Eleven Realtime (20 October 2026)"
    url: https://elevenlabs.io/blog/realtime
  - title: "Artificial Analysis: Text to Speech leaderboard (read 24 October 2026)"
    url: https://artificialanalysis.ai/text-to-speech/leaderboard/provider-voice
---

*AI voice models, episode 1. Next: OpenAI vs Google Gemini TTS, then xAI Grok voice.*

This series explains one or two AI voice models per post, using the same twelve questions every time. Facts come from the vendor's own pages unless marked as a user report or our opinion. Prices and rankings were rechecked on 24 October 2026.

ElevenLabs launched **Eleven v4** and the low-latency **Eleven v4 Turbo** on 28 September 2026 ([our launch story](/posts/elevenlabs-eleven-v4/)). On 20 October it added **Eleven Realtime v1** (Mini and Max), a speech-to-speech agent model, which we cover briefly in item 7.

**What it does differently.** v4 is built for performance rather than plain reading: inline audio tags such as `[laughs]` or `[said angrily in French accent]` direct delivery and even add sound effects, and multi-speaker dialogue is generated as one scene so speakers react to each other (ElevenLabs). Turbo brings the same model family down to a vendor-stated median inference latency of about 100 ms. On the [Artificial Analysis TTS arena](https://artificialanalysis.ai/text-to-speech/leaderboard/provider-voice) (24 October), v4 Turbo is #1 (Elo 1336) and v4 is #2 (1332); the arena lists both with a rank range of 1 to 2, so treat them as tied.

## Eleven v4 and v4 Turbo against the checklist

**1. Voice cloning.** Instant Voice Cloning (IVC) needs no training step. ElevenLabs' v4 blog says IVC can capture a voice "using just 10 seconds of audio", but its own cloning docs still say to record at least 1 minute, with 1 to 2 minutes recommended and little gain past 3. We would follow the docs. IVC starts on the $6 Starter plan, and you must confirm you have the right and consent to clone the voice. Professional Voice Cloning (PVC) needs at least 30 minutes of audio (2 to 3 hours is better), a Creator plan or higher, and works only for **your own voice**: "Even with their consent, you cannot clone someone else's voice." A voice-captcha step checks this (ElevenLabs docs).

**2. Languages and accents.** Both models support 90+ languages (v3 had 70+). v4 speaks every language with a native accent while keeping the speaker's identity; this is always on, and ElevenLabs calls it "a deliberate change... not a bug" for anyone who wanted the source accent carried over. ElevenLabs' voice docs say voice *creation* (the source recording) is supported in 32 languages. The [Realtime announcement](https://elevenlabs.io/blog/realtime) puts the Voice Library at 17,000+ voices.

**3. Latency and streaming.** v4 Turbo: median inference latency of about 100 ms, excluding application and network latency (models page), and about 150 ms median time to first speech in ElevenLabs' own September test. v4 latency is not documented. Per the models page, v4 runs through the Text to Dialogue API and Turbo through the Text to Dialogue WebSocket for streaming.

**4. Emotion and style control.** Audio tags plus natural-language direction; Stability and Similarity settings, and a Clone Strength setting for PVC. Style and Speed sliders are not available in v4, and SSML is not supported. ElevenLabs says the tags are "not perfect yet".

**5. Output formats.** MP3 at 22.05 to 44.1 kHz and up to 192 kbps (192 kbps needs Creator or higher), PCM and WAV at 8 to 48 kHz (44.1 kHz PCM/WAV needs Pro or higher), Opus at 48 kHz, and 8 kHz mu-law and a-law for telephony (API reference). The plan needed for 48 kHz is not stated.

**6. Price** (checked 24 October). API: v4 $0.08 and v4 Turbo $0.04 per 1,000 characters, the same as v3 and Flash respectively. That is $80 or $40 per million characters. Plans: Free (10,000 credits, non-commercial), Starter $6 (30,000), Creator $22 (121,000; $11 first month), Pro $99 (600,000), Scale $299 and Business $990.

**7. Speech-to-speech and realtime.** Voice Changer converts one voice to another for $0.12 a minute. The new Eleven Realtime v1 Mini and Max ([our launch story](/posts/elevenlabs-eleven-realtime-speech-to-speech/)) are complete voice agents (speech recognition, turn-taking, an LLM and speech) in 90+ languages, served over a WebSocket API that ElevenLabs designed to be compatible with OpenAI's Realtime API. Both cost $0.08 a minute plus LLM usage (pricing page).

**8. Long-form consistency.** v4 takes up to 10,000 characters per request, about 10 minutes of audio (models page). ElevenLabs says v4 preserves speaker identity across generations and that request stitching for longer work is "significantly more reliable"; those are its claims.

**9. Compared with v3.** More languages (70+ to 90+), double the character limit (5,000 to 10,000), full PVC support, native accent handling and better IPA pronunciation, at the same price. On Artificial Analysis, v3 scores 1184 against v4's 1332. ElevenLabs also claims about 75% listener preference over competing models in its own blind tests.

**10. What users think** (user reports, not facts).
- Praise: [@kunalstwt](https://x.com/kunalstwt/status/2105620062422134898) says his v4 clone was the first AI voice that "sounds exactly like me". [@eddiejaoude](https://x.com/eddiejaoude/status/2105290597292515349) was impressed by cloning but "used my credits already". [@aishotstudio](https://x.com/aishotstudio/status/2105352139463966982) compared v4 with v3 on a clone and found v3 "was never good with my clone".
- Complaints: [@GuptaAnubhav12](https://x.com/GuptaAnubhav12/status/2109010348162392204) says his first clone "sounded like an Indian guy faking a US accent" and needed a language-setting workaround. [@naumowf](https://x.com/naumowf/status/2110248694184550834) points to a cheaper open-weights model scoring higher on an Artificial Analysis pronunciation test.

**11. Licence, commercial use, open weights.** Under ElevenLabs' [terms](https://elevenlabs.io/terms-of-use) (9 October 2026), free users may only use the service non-commercially; paid users may use it commercially. You grant ElevenLabs a licence to use your content, including to improve its services. No open weights. ElevenLabs says it blocks cloning of high-risk voices and offers an AI speech classifier ([safety page](https://elevenlabs.io/safety)). Note that ElevenLabs' original Default voices expire on 31 December 2026 (voices docs).

**12. Our verdict** (opinion). Pick v4 for narration, characters and dubbing where delivery matters, and v4 Turbo for agents, where half the price buys a model voters rank just as high. Skip it if you need SSML or speed control, very long single requests, or open weights. Listen to the demos on the [v4 launch page](https://elevenlabs.io/blog/eleven-v4) before committing.

## Summary

| # | Checklist | Eleven v4 | Eleven v4 Turbo |
|---|---|---|---|
| 1 | Cloning | IVC (docs: 1 to 2 min; blog: 10 s), PVC own voice only, 30 min+ | same |
| 2 | Languages | 90+, native accent always on | 90+ |
| 3 | Latency | not documented | ~100 ms inference (vendor) |
| 4 | Emotion/style | audio tags; no SSML, no speed slider | audio tags |
| 5 | Formats | MP3 to 192 kbps, PCM/WAV to 48 kHz, Opus, mu/a-law | same API |
| 6 | Price (24 Oct) | $0.08 / 1K chars | $0.04 / 1K chars |
| 7 | STS / realtime | Voice Changer $0.12/min; Realtime v1 $0.08/min + LLM | TTD WebSocket streaming |
| 8 | Long-form | 10,000 chars per request | not documented |
| 9 | vs v3 | more languages, 2x length, same price | faster than v3 Conversational (vendor) |
| 10 | Users | cloning praised; accent and cost gripes | few reports |
| 11 | Licence | paid commercial, free non-commercial; closed | same |
| 12 | Verdict (opinion) | expressive work | agents |
