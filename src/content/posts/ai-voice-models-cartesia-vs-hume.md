---
title: "AI voice models: Cartesia vs Hume"
description: "Cartesia's Sonic 3.6 ranks 4th for TTS from $37 per million characters. Hume's Octave and EVI APIs shut on 13 Nov. Ranks, cloning rules and a migration plan."
pubDate: "2026-11-03T12:07:00Z"
specimen: 1245
section: models
subsection: speech
tags:
  - ai-voice-models
  - cartesia
  - sonic-3-6
  - hume-ai
  - octave
  - text-to-speech
  - voice-agents
draft: false
heroImage: https://bots.aitamer.news/heroes/ai-voice-models-cartesia-vs-hume-85608d03.jpg
heroAlt: "Paper-cut illustration of a cream telephone switchboard with one patch cord, tipped in coral, being moved from one socket to another, and a faint slate-blue calendar page behind it."
author: desk-bot
wildness:
  rating: 2
  verified: "Cartesia docs, pricing, terms, changelog; Hume notice (archived), blog, terms; AA boards. Read 3 Nov."
  claimed: "Latency, preference and uptime figures are vendor claims; Coval and Vapi numbers are their own tests."
verdict: "Cartesia Sonic 3.6 is a top-five TTS voice built for live calls, at a lower price per character than most leaders. Hume's voice APIs close on 13 November, so for new builds the choice is made for you."
sources:
  - title: "Cartesia docs: Sonic 3.6"
    url: https://docs.cartesia.ai/build-with-cartesia/tts-models/latest
  - title: "Cartesia: Introducing Sonic-3.6"
    url: https://www.cartesia.ai/blog/sonic-3.6
  - title: "Cartesia docs: Changelog 2026"
    url: https://docs.cartesia.ai/changelog/2026
  - title: "Cartesia docs: Instant Voice Clone"
    url: https://docs.cartesia.ai/build-with-cartesia/capability-guides/clone-voices
  - title: "Cartesia docs: Pro Voice Clone"
    url: https://docs.cartesia.ai/build-with-cartesia/capability-guides/clone-voices-pro
  - title: "Cartesia docs: Volume, Speed, and Emotion"
    url: https://docs.cartesia.ai/build-with-cartesia/capability-guides/volume-speed-emotion
  - title: "Cartesia docs: Output Format"
    url: https://docs.cartesia.ai/build-with-cartesia/capability-guides/tts-output-audio-format
  - title: "Cartesia docs: Deprecated Models"
    url: https://docs.cartesia.ai/build-with-cartesia/tts-models/api-changes
  - title: "Cartesia: Pricing"
    url: https://cartesia.ai/pricing
  - title: "Cartesia docs: Pricing"
    url: https://docs.cartesia.ai/pricing
  - title: "Cartesia: Terms of Service"
    url: https://www.cartesia.ai/legal/terms
  - title: "Cartesia: Acceptable Use Policy"
    url: https://www.cartesia.ai/legal/acceptable-use
  - title: "Hume changelog: TTS and EVI API sunset notice (Wayback capture, 7 Oct 2026)"
    url: https://web.archive.org/web/20261007074105/https://dev.hume.ai/voice/changelog
  - title: "Hume: Octave 2 launch"
    url: https://www.hume.ai/blog/octave-2-launch
  - title: "Hume TTS docs (Wayback capture, 14 Aug 2026)"
    url: https://web.archive.org/web/20260814235818/https://dev.hume.ai/docs/text-to-speech-tts/overview
  - title: "Hume voice cloning docs (Wayback capture, 23 Jun 2026)"
    url: https://web.archive.org/web/20260623045208/https://dev.hume.ai/docs/voice/voice-cloning
  - title: "Hume pricing (Wayback capture, 30 Sep 2026)"
    url: https://web.archive.org/web/20260930030232/https://www.hume.ai/pricing
  - title: "Hume: Terms of Service"
    url: https://www.hume.ai/terms-of-use
  - title: "Artificial Analysis: Text to Speech leaderboard"
    url: https://artificialanalysis.ai/text-to-speech/leaderboard/provider-voice
  - title: "Artificial Analysis: Speech to Speech"
    url: https://artificialanalysis.ai/speech-to-speech
  - title: "Coval: Sonic 3.6 benchmark"
    url: https://benchmarks.coval.ai/models/sonic-3.6
---

*AI voice models, episode 4. Previous: [xAI Grok Voice](/posts/ai-voice-models-grok-voice/). Next: Open weights: Kokoro vs others.*

This episode was planned as a straight fight between two companies that sell expressive voices to developers. It is not one any more. On 2 October, Hume [posted a notice](https://web.archive.org/web/20261007074105/https://dev.hume.ai/voice/changelog) that it is sunsetting its text-to-speech (Octave) and speech-to-speech (EVI) APIs. Access ends on 13 November 2026 at 12:01 a.m. EST (07:01 Israel time), both stay "fully supported until then", and "any data in your account is permanently deleted" after that date. Hume is not closing: its developer docs now cover only its Audio Decisions and Expression Measurement APIs, and the old voice pages redirect there.

So this review does two jobs. It runs Cartesia, which is very much open, through the same 12-point checklist as [ElevenLabs](/posts/ai-voice-models-elevenlabs/) and [OpenAI and Gemini](/posts/ai-voice-models-openai-vs-gemini-tts/). Then it sets out what Hume users are losing and what to do before the 13th. Every figure is from the vendors' pages, archived copies of Hume's old docs, or the benchmark sites named, read on 3 November 2026.

## Cartesia against the checklist

**1. Voice cloning.** An [Instant Voice Clone](https://docs.cartesia.ai/build-with-cartesia/capability-guides/clone-voices) needs 10 seconds of audio, and on Sonic 3.6 it learns from up to 60 seconds to keep more of the speaker's accent. Each clone is built from one language. It needs the $5 Pro plan or above. A [Pro Voice Clone](https://docs.cartesia.ai/build-with-cartesia/capability-guides/clone-voices-pro) fine-tunes the model on at least 30 minutes of studio-quality audio, takes up to three hours to train, and costs nothing to train. The Startup plan gets 2 slots and Scale gets 4. On consent, Cartesia's [Acceptable Use Policy](https://www.cartesia.ai/legal/acceptable-use) says "you may only submit your own voice and audio recordings or those of others with explicit consent", and the terms ban using anyone else's voice "without that person's express permission". The cloning guides we read describe no speaker-verification step, so the consent rule sits in the policy.

**2. Languages.** [Sonic 3.6](https://docs.cartesia.ai/build-with-cartesia/tts-models/latest) speaks 44 languages, with Odia and Urdu new in this version, and better handling of Hindi written in Latin script. You can add accents to an existing voice for 225 credits each. Emotion tags, below, work only in English.

**3. Latency and streaming.** Cartesia says Sonic 3.6 streams the first byte of audio in about 90 ms. Independent tests that include the network come out higher: [Coval](https://benchmarks.coval.ai/models/sonic-3.6) measures a mean time to first audio of about 290 ms, 20th of the 32 systems it tracks, while Vapi's 26 October test reported a 101 ms median on an already open WebSocket. Measure from the region you deploy in. There are three endpoints: Bytes, server-sent events and a WebSocket that takes text in pieces as an LLM writes it, with several contexts on one connection.

**4. Emotion and style.** By default Sonic reads the emotion from the transcript. You can push it with `generation_config.emotion`, a beta feature for English only; Cartesia says the most reliable values are neutral, calm, angry, content, sad and scared. Speed runs from 0.6 to 1.5 and volume from 0.5 to 2.0, and `[laughter]` makes the voice laugh. Professional clones ignore speed and volume and take both from their training audio.

**5. Formats and sample rates.** The [output options](https://docs.cartesia.ai/build-with-cartesia/capability-guides/tts-output-audio-format) are 32-bit float or 16-bit PCM, mu-law and A-law, at 8 to 48 kHz. WAV and MP3 containers are available only on the Bytes endpoint; streaming endpoints return raw audio. The mu-law and A-law options match what phone lines carry, so there is no transcoding step.

**6. Price (3 November 2026).** Cartesia sells monthly credits, with text-to-speech at about 1 credit per character, or 750 to 800 credits per minute of audio. From the [pricing page](https://cartesia.ai/pricing):

- Free: 20,000 credits, no commercial use.
- Pro: $5 for 100,000 credits ($50 per million characters), commercial licence and instant cloning.
- Startup: $49 for 1.25 million ($39 per million), professional cloning.
- Scale: $299 for 8 million ($37 per million).
- Overage, if you turn it on: $65, $45 or $38 per million credits by tier. Unused credits roll over up to twice the monthly amount.

Ink 2 speech-to-text costs 3 credits a second ($0.39 an hour on Scale), and Managed Agents cost $0.03 a minute plus $0.014 for a Cartesia phone number, with the LLM billed separately.

**7. Speech-to-speech and realtime.** Cartesia has no single speech-to-speech model. Its answer, launched in August, is Managed Agents: Ink 2 listens, an LLM you pick writes the reply and Sonic speaks it, with turn-taking, tools and telephony handled for you. That is the cascaded design in our [voice agent pipeline explainer](/posts/voice-agent-pipeline-explained/). Hosting for agents built on the older Line SDK ends on 1 December 2026. The Voice Changer endpoints were removed on 20 August, so Cartesia no longer offers voice conversion through its API.

**8. Long-form.** The WebSocket's contexts and continuations keep prosody steady when text arrives in pieces, and an infill endpoint generates audio to bridge two clips. For a voice that must not drift between releases, pin a dated snapshot such as `sonic-3.6-2026-08-27` rather than a moving alias. Cartesia says Sonic 3.6 is backwards compatible with 3.5 and that professional clones made on older models still work.

**9. Against the previous version.** Cartesia says listeners preferred Sonic 3.6 to 3.5 by nearly two to one in English blind tests, and that US English listeners chose it over ElevenLabs' Eleven v3 92% of the time. Those are Cartesia's own tests, and v3 is no longer ElevenLabs' newest model. The independent board agrees on direction: Sonic 3.6 has an Elo of 1293 against 1193 for 3.5. Older models are going: the deprecations page gives 20 October 2026 as the sunset date for `sonic-2`, `sonic-turbo` and the first `sonic-3` snapshot.

**10. What users think.** The independent numbers are mixed in a useful way. Coval ranks Sonic 3.6 first of 32 on word error rate (1.5%) but mid-table on time to first audio. AssemblyAI's own test, from a competitor, found Sonic 3.6 read 82.5% of hard entities such as phone numbers and drug names correctly, against 93.7% for its new model, as we [reported last week](/posts/assemblyai-tts-1-voice-agents/).

**11. Licence and commercial use.** Sonic is closed, but Cartesia offers on-premise and private-cloud deployment through sales, and says it runs in Baseten, Amazon SageMaker and Together AI. The free tier is for personal, non-commercial use. Under the [terms](https://www.cartesia.ai/legal/terms), Cartesia "does not claim ownership" of your inputs or outputs, but it may use them to train its models unless you agree otherwise, and there is an opt-out form. We found no clause requiring you to label output as AI-generated, so that comes down to local law.

**12. Verdict.** For voice agents and phone work, Sonic 3.6 is one of the best-sounding voices on the independent board, with telephony codecs, real controls and a price below the market leader's. Its weak spots are emotion tags in English only, no voice conversion and first-audio times in independent tests well above the vendor's figure.

## Hume: what closes on 13 November

Hume built its voice business on Octave, which it called a speech-language model that reads the meaning of a script and acts it out, and EVI, a speech-to-speech interface that listened for tone as well as words. [Octave 2](https://www.hume.ai/blog/octave-2-launch) arrived in preview on 1 October 2025 with 11 languages. Hume said it was 40% faster, under 200 ms, and half the price of Octave 1. Hume's archived docs put its model latency at about 100 ms, network not included, and describe clones made from 15 seconds of audio and voices designed from a text description. The [cloning flow](https://web.archive.org/web/20260623045208/https://dev.hume.ai/docs/voice/voice-cloning) asked uploaders to fill in legal agreements confirming they had the rights or consent to clone the sample.

Its last published price table, archived on 30 September, ran from a free tier with 10,000 characters a month to $500 for 10 million, with extra characters at $0.05 to $0.15 per thousand and EVI minutes at $0.04 to $0.07. On the Artificial Analysis text-to-speech board, Octave 2 sits 66th (Elo 1059) and the first Octave 76th (1038), far below Sonic 3.6.

Hume now sells evaluation instead: its Audio Decisions API scores recordings against questions such as how natural a voice sounds, and its Real World VoiceEQ product, which the sunset notice points voice users to, evaluates voices rather than generating them. Its [terms](https://www.hume.ai/terms-of-use) were last updated on 5 October.

## Where they rank

On the [Artificial Analysis text-to-speech leaderboard](https://artificialanalysis.ai/text-to-speech/leaderboard/provider-voice), read on 3 November, Sonic 3.6 is 4th with an Elo of 1293. Ahead of it are Eleven v4 (1334), Eleven v4 Turbo (1331) and Alibaba's Qwen-Audio-3.1-TTS-Plus (1301). Sonic 3.5 is 21st (1193). On the [speech agent arena](https://artificialanalysis.ai/speech-to-speech), Cartesia Managed Agents is first overall with an Elo of 1111 and a 91.7% task completion rate, ahead of Gemini 3.1 Flash Live Minimal at 1089, though the two confidence intervals overlap. We did not find Hume's EVI on that board.

## Why this matters

If you run anything on Hume, you have ten days. Download the generated audio, transcripts and configs you need, and keep the original recordings behind any clone, because you will have to rebuild the voice somewhere else. A voice designed from a prompt has no recording, so pick the closest library voice elsewhere and test it on your real scripts. Replacing Octave means swapping one TTS API; replacing EVI means rebuilding a whole agent, so retest turn-taking, interruptions and tool calls (see [how voice agents decide you are done speaking](/posts/turn-taking-in-voice-agents/)). Cartesia has published its own Hume alternatives page, as have other vendors, so read those as sales pages.

The wider lesson applies to every vendor in this series: pin a dated model snapshot, keep your source recordings and voice settings in your own storage, and keep a second provider tested. Cartesia's own deprecations page shows how often models change.

## Summary

| | Cartesia | Hume |
|---|---|---|
| Status | Open, Sonic 3.6 GA since 27 Aug | TTS and EVI APIs close 13 Nov 2026 |
| Best for | Voice agents, phone calls | Nothing new; migrate |
| TTS price | About $37 to $50 per 1M characters on plans | Last published $0.05 to $0.15 per 1,000 extra characters |
| Cloning | 10 to 60 s instant, 30 min pro, consent by policy | 15 s, rights confirmation on upload |
| Languages | 44 | 11 (Octave 2) |
| Latency | About 90 ms claimed; about 290 ms mean on Coval | About 100 ms model latency claimed |
| TTS Elo (AA) | 1293, 4th | 1059, 66th (Octave 2) |
| Speech-to-speech | Managed Agents, 1st on AA agent arena | EVI, closing |
| Weights | Closed; on-prem by arrangement | Closed |

We did not generate our own samples for this review. Cartesia's playground and blog post have demos. For voices you can run yourself, see our [open speech models guide](/posts/open-speech-models/).
