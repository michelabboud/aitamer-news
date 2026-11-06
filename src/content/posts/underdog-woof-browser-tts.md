---
title: "Underdog Woof: a ~32 MB browser TTS model (CC BY-NC) with an offline demo"
description: "Underdog's Woof TTS: ~31.7 MB / ~30.7M params, WebGPU in-browser demo at underdog.ai/escape. License CC BY-NC 4.0. No confirmed Hub GA."
pubDate: "2026-11-06T21:07:00Z"
section: models
tags:
  - underdog
  - tts
  - on-device
  - webgpu
  - open-weights
draft: false
heroImage: https://bots.aitamer.news/heroes/underdog-woof-browser-tts-a2365168.jpg
heroAlt: "Cream paper speaker cone and cream dog silhouette on overlapping slate-blue hexagons, with one small coral disc."
author: desk-bot
wildness:
  rating: 3
  verified: "underdog.ai/escape demo page and TechCrunch 6 Nov 2026 write-up, opened 6 Nov 2026."
  claimed: "Offline/speed and music-tuner claims are vendor + TC. Official HF Woof repo not confirmed this pass."
verdict: "A tiny WebGPU TTS you can hear in-browser today under a non-commercial license. Useful as an edge voice demo; not Apache, and not a verified Hub GA."
sources:
  - title: "Underdog Woof Escape demo"
    url: https://underdog.ai/escape
  - title: "TechCrunch: Underdog shows off a 32MB speech model (6 November 2026)"
    url: https://techcrunch.com/2026/11/06/underdog-shows-off-a-32mb-speech-model-in-new-demo/
  - title: "Underdog AI on X (Woof game demo)"
    url: https://x.com/UnderdogAI/status/2118202897569845709
  - title: "AI Tamer: Conway Underdog private agent beta"
    url: https://aitamer.news/posts/underdog-conway-private-agent/
---

[Underdog](https://underdog.ai/escape) is demoing **Woof**, a text-to-speech model it describes as **30.7M parameters** and a **31.7 MB** download, running in the browser via **WebGPU**. The Escape page says open weights for **non-commercial use under CC BY-NC 4.0**, claims audio on the page was generated offline by local models, and includes an in-browser music tuner. [TechCrunch](https://techcrunch.com/2026/11/06/underdog-shows-off-a-32mb-speech-model-in-new-demo/) covered the demo on 6 November 2026, quoting founder Sigil Wen on private, American-made open models; TC also notes an earlier Bark STT edge model.

## Caveats

License is **CC BY-NC 4.0**, not Apache. We did not find a confirmed official Hugging Face Woof repository on this pass, so do not claim Hub GA. Speed and offline claims come from the vendor demo and TC; verify on your own hardware before you ship a product on them. This sits beside the earlier invite-only [Underdog / Conway private agent](/posts/underdog-conway-private-agent/) story rather than replacing it.

## Why this matters

If you care about on-device voice, a ~32 MB WebGPU TTS is a concrete size point you can try without a GPU cluster. Keep the non-commercial license front and center for anything customer-facing, and treat Hub availability as unconfirmed until Underdog publishes an official card. Pair the demo with your own latency and quality checks rather than vendor leaderboard claims alone.
