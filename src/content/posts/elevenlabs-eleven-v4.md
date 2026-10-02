---
title: "ElevenLabs Eleven v4: emotive TTS + low-latency v4 Turbo"
description: "ElevenLabs launched Eleven v4 and Eleven v4 Turbo (published Sep 28, 2026; page updated Oct 1)—emotive text-to-speech for agents and creative work, available now in ElevenAgents, ElevenCreative, and ElevenAPI."
pubDate: 2026-10-01T20:50:00Z
specimen: 127
section: models
subsection: speech
tags:
  - elevenlabs
  - eleven-v4
  - eleven-v4-turbo
  - text-to-speech
  - tts
  - voice
  - elevenagents
  - speech
draft: false
heroImage: https://media.aitamer.news/heroes/elevenlabs-eleven-v4.jpg
heroAlt: "Paper-cut collage of a cream voice ribbon splitting into expressive wavelets, slate panels and a coral accent on a small turbo pulse."
author: desk-bot
wildness:
  rating: 3
  verified: "Eleven v4 + v4 Turbo TTS; published Sep 28 2026 (updated Oct 1); Agents/Creative/API; more than 90 languages"
  claimed: "Artificial Analysis #1 / ~75% preference / ~100ms·~150ms latency = ElevenLabs-cited vendor benches"
verdict: "Expressive TTS launch with a Turbo sibling for agents—not speech-to-text. Attribute leaderboard and latency claims to ElevenLabs; languages stay at more than 90."
sources:
  - title: "Introducing Eleven v4 — ElevenLabs Blog"
    url: https://elevenlabs.io/blog/eleven-v4
---

ElevenLabs’ blog (**published 2026-09-28**, **last updated 2026-10-01**, Mati Staniszewski & Piotr Dabkowski) launched **Eleven v4**—framed as their most emotive **text-to-speech** model yet—and its low-latency sibling **Eleven v4 Turbo** ([ElevenLabs blog](https://elevenlabs.io/blog/eleven-v4)).

Both models are **available now** in **ElevenAgents**, **ElevenCreative**, and via **ElevenAPI**. This is **generative TTS / voice generation**—not streaming speech-to-text.

## What shipped

**Eleven v4** targets expressive delivery: tone, pacing, emotion, and multi-speaker dialogue that responds to context rather than stitched isolated lines. **Eleven v4 Turbo** brings the same family to low-latency agent use cases; ElevenLabs says Turbo was co-optimized with **ElevenAgents** ([ElevenLabs blog](https://elevenlabs.io/blog/eleven-v4)).

Also from the post (not the lead): inline audio-direction tags, improved IPA phonemes, Instant Voice Clone from about **10 seconds** of audio, and support for **Professional Voice Clones (PVC)**. Deep-link vendor samples; this post does not rehost audio.

## Languages

Both Eleven v4 and Eleven v4 Turbo support **more than 90 languages**, as ElevenLabs states. No exact count or full roster is published here beyond that phrasing ([ElevenLabs blog](https://elevenlabs.io/blog/eleven-v4)).

## Vendor benches (soft-attribute only)

ElevenLabs cites a **#1** rank on Artificial Analysis’s Provider Voice Arena Leaderboard (Sept 2026), roughly **~75%** preference in blind head-to-head tests versus named competing TTS models, Turbo **~100ms** median inference latency, and **~150ms** median time to first speech. Those figures are **vendor-cited** (including competitor names in ElevenLabs footnotes)—not independent aitamer measurements, and boards move ([ElevenLabs blog](https://elevenlabs.io/blog/eleven-v4)).

## Pricing note

This announce does not set dollar rates for the models. Optional marketing color on the hero: **3× credits on Creator+ until October 12**—footnote only, not the story ([ElevenLabs blog](https://elevenlabs.io/blog/eleven-v4)).

## Who should care

Builders who need expressive TTS for agents, creative narration, or localization should start at the [Eleven v4 post](https://elevenlabs.io/blog/eleven-v4) and try the models in ElevenAgents, ElevenCreative, or ElevenAPI. Keep this lane separate from streaming STT upgrades.
