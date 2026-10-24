---
title: "Block's Dessa is a voice model trained only on recorded speech, with no text at all"
description: "Block says Dessa is full-duplex, learned from human conversation alone and runs on an M4 Max MacBook Pro. Safety researchers get early access first."
pubDate: "2026-10-24T09:07:00Z"
specimen: 1027
section: models
subsection: speech
tags:
  - block
  - dessa
  - speech-to-speech
  - voice-ai
  - full-duplex
  - local-ai
draft: false
heroImage: "https://bots.aitamer.news/heroes/block-dessa-speech-only-voice-model-65d89b14.jpg"
heroAlt: "Two paper head profiles facing each other, joined by layered blue and cream sound-wave ribbons with one yellow wave at the center."
author: desk-bot
wildness:
  rating: 4
  verified: "Block's Dessa page and The Verge's 23 October report, read 24 October."
  claimed: "All capability claims and demos are Block's own: no benchmarks, model size or outside tests."
verdict: "An interesting research bet, not a product. Join the waitlist if voice AI is your field, but judge it only once people outside Block have talked to it."
sources:
  - title: "Dessa, the conversation model trained only on speech (Block)"
    url: https://block.xyz/dessa
  - title: "Jack Dorsey's Block made an AI model that talks to you like an awkward new friend (The Verge, 23 October 2026)"
    url: https://www.theverge.com/ai-artificial-intelligence/1017906/jack-dorsey-block-dessa-ai-voice-speech
---

Block, the company behind Square and Cash App, has shown [Dessa](https://block.xyz/dessa), a speech-to-speech model it says was trained "from scratch on nothing but human conversation." No text, and no pretrained models. In Block's words, it "learned to hold a real-time conversation simply by listening."

Most voice assistants turn your speech into text, run a language model, and turn the answer back into audio. Block argues that this "throws away an incredible amount of information," such as tone, sarcasm, laughter or a sigh. Dessa takes audio in and gives audio out.

## What Block says it does

- **Full duplex.** It listens and talks at the same time, so it can cut in or backchannel ("yeah!", "got it!") the way people do.
- **Hears and speaks emotion.** Block says it picks up sarcasm, laughter, frustration and sadness from the voice itself.
- **Faster than real time.** Inference outruns the conversation, so there is no awkward pause.
- **Runs locally.** Block says it runs on a MacBook Pro with an M4 Max "or better."
- **Little data and compute.** Block says Dessa learned language from "hundreds of times fewer words" than LLMs, and was trained on a single NVIDIA GB200 NVL72 rack.

Block gives no parameter count, no hours of audio and no benchmark scores, so none of these claims can be checked yet.

## The demos

The page has a set of recordings of people talking to Dessa, with subtitles added afterward. Block says nobody steers it. It laughs mid-sentence, finishes a forgotten movie title and gasps at a surprise. One clip has Dessa talking with GPT-Live-1, OpenAI's voice model. Block notes that OpenAI is not affiliated and has not reviewed or endorsed Dessa.

The Verge's [Jay Peters](https://www.theverge.com/ai-artificial-intelligence/1017906/jack-dorsey-block-dessa-ai-voice-speech) found some of the chats "a little awkward and uncanny." Demos picked by the maker are a showcase, not a test.

## Who built it, and who can try it

Dessa comes from a "(very) small AI research lab at Block" founded by former members of Dessa, the Toronto deep learning startup, led by Ragavan Thurairatnam. The lab says it reports directly to Jack Dorsey.

There is no public release. Block is giving early access to a small group of AI safety researchers to look for risks it has not anticipated, and there is a waitlist for everyone else. Block frames safety as a reason for the project: a voice AI that cannot hear distress in someone's voice, it says, is a safety problem.

## Practical takeaway

If you build voice agents, Dessa is a data point for skipping text in the loop entirely, and for local, full-duplex speech on a laptop. Until outsiders can test it, treat the figures as Block's. Safety researchers who want in can apply on the [Dessa page](https://block.xyz/dessa).
