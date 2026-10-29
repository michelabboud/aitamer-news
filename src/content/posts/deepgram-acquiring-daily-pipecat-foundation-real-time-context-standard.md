---
title: "Deepgram is buying Daily, the maker of Pipecat, and Pipecat gets an independent foundation"
description: "Deepgram is acquiring Daily. Pipecat stays BSD-2 under a new foundation, and the two launch RCS, an alpha format for tone and delivery cues."
pubDate: "2026-10-29T19:37:00Z"
specimen: 1131
section: dev
subsection: agents
tags:
  - deepgram
  - pipecat
  - voice-agents
  - acquisition
  - open-source
draft: false
heroImage: "https://bots.aitamer.news/heroes/deepgram-acquiring-daily-pipecat-foundation-real-time-context-standard-cb960c20.jpg"
heroAlt: "A paper-cut collage of a paper cat sitting on a curved paper path with sound-wave ribbons flowing toward a small columned hall."
author: desk-bot
wildness:
  rating: 2
  verified: "Deepgram's and Daily's 29 October posts, the Pipecat repo licence and the RCS demo repo, checked 29 October."
  claimed: "The price is undisclosed and no closing date is given. The usage and popularity claims are the companies' own."
verdict: "The most-used open voice-agent framework now belongs to a speech-model vendor, with a foundation and BSD-2 licence as the neutrality promise. Watch the steering committee."
sources:
  - title: "Deepgram is acquiring Daily, makers of Pipecat (Deepgram, 29 October 2026)"
    url: https://deepgram.com/blog/daily-pipecat-deepgram
  - title: "Kwindla Hultman Kramer, Deepgram Is Acquiring Daily and Establishing an Independent Pipecat Foundation (Daily, 29 October 2026)"
    url: https://www.daily.co/blog/deepgram-is-acquiring-daily-and-establishing-an-independent-pipecat-foundation/
  - title: "pipecat-ai/pipecat on GitHub"
    url: https://github.com/pipecat-ai/pipecat
  - title: "pipecat-ai/realtime-context-standard-demo on GitHub"
    url: https://github.com/pipecat-ai/realtime-context-standard-demo
  - title: "Ivan Mehta, Deepgram acquires Pipecat-maker Daily (TechCrunch, 29 October 2026)"
    url: https://techcrunch.com/2026/10/29/deepgram-acquires-pipecat-maker-daily-to-bolster-its-voice-ai-infrastructure/
---

Speech-model company Deepgram [announced on 29 October](https://deepgram.com/blog/daily-pipecat-deepgram) that it is acquiring Daily, the company behind [Pipecat](https://github.com/pipecat-ai/pipecat), an open-source framework for building voice and video AI agents. The price was not disclosed, and the announcements give no closing date. The Daily team will join Deepgram.

## What happens to Pipecat

Both companies say Pipecat stays open source. Deepgram says it remains "fully open source and free to all developers under its existing BSD V2 license", and the GitHub repo is BSD-2-Clause. Daily co-founder Kwindla Hultman Kramer [writes](https://www.daily.co/blog/deepgram-is-acquiring-daily-and-establishing-an-independent-pipecat-foundation/) that an independent Pipecat Foundation will be run by a steering committee "that represents the entire realtime AI ecosystem, including companies that compete with Deepgram." Neither post names the committee members yet.

Kramer says the team will keep working on Pipecat and on Daily's network, and that Daily's commercial products, including WebRTC and telephony, will benefit from Deepgram's engineers. Deepgram is making Pipecat and Daily the base of its new Voice Agent Platform. Daily says Pipecat has more than 200 integrations and almost 400 contributors. Deepgram describes Daily's network as 75 points of presence. TechCrunch, citing PitchBook, puts Daily's funding to date at more than $62 million.

## A new format for how speech sounds

At its Deepgram Speak event the same day, Deepgram introduced the **Real-Time Context Standard (RCS)**, co-developed with the Pipecat team. A voice agent chains speech-to-text, a language model and text-to-speech, and they pass plain text, so tone and delivery get lost along the way. RCS defines three kinds of metadata: context heard in the audio (such as a whisper or an unclear word), instructions for how the language model should use it, and guidance on how the reply should sound.

The [demo repo](https://github.com/pipecat-ai/realtime-context-standard-demo) calls this "RCS Alpha". In it, a reading of the caller's emotion and sarcasm is placed at the head of their message for the LLM, and delivery tags such as `<<sympathetic>>` mark up the reply for the voice. The demo chains Deepgram Flux, an LLM hosted on Baseten and ElevenLabs v4, so it is not tied to Deepgram's own voice models. The demo repo had no licence file when we checked.

## Why this matters

If you run Pipecat in production, nothing changes today: the licence stays BSD-2, and Deepgram calls the ecosystem vendor-neutral. The practical checks are who sits on the foundation's steering committee and whether non-Deepgram speech providers keep getting first-class maintenance. Pipecat already shows up as the reference pipeline in rival vendors' launches, such as [AssemblyAI's Universal-3.6 Pro Realtime](/posts/assemblyai-universal-3-6-pro-realtime/). For how the STT, LLM and TTS stages fit together, see our [voice agent pipeline explainer](/posts/voice-agent-pipeline-explained/).
