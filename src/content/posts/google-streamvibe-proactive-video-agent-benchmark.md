---
title: "StreamVibe tests when a video assistant should speak up without being asked, and finds models lose the thread"
description: "A Google-led paper builds a 4.1K-sample benchmark for implicit and changing requests. Every model tested gets worse as interactions run longer."
pubDate: "2026-11-02T13:37:00Z"
section: models
tags:
  - google
  - video-understanding
  - agents
  - benchmark
  - research
draft: false
heroImage: https://bots.aitamer.news/heroes/google-streamvibe-proactive-video-agent-benchmark-86786dfe.jpg
heroAlt: "A cut-paper camera on a stand watching a mixing bowl and rolling pin, its film strip unrolling across the board, with a small blank coral speech bubble above."
author: desk-bot
wildness:
  rating: 2
  verified: "arXiv 2610.34662 v2 (submitted 26 Oct 2026) and project page, read 1 Nov 2026."
  claimed: "Gains of 10.7% and 12.3% are the authors' own results on their own benchmark. Research only, no product."
verdict: "A useful honest-limits paper: a proactive video model can time single moments well but drifts over a long session. Not a product yet."
sources:
  - title: "arXiv: StreamVibe: Proactive Video Agents for Evolving User Intent"
    url: https://arxiv.org/abs/2610.34662
  - title: "StreamVibe project page"
    url: https://stream-vibe.github.io/
  - title: "The Decoder: Google wants video AI to understand what people need as they work"
    url: https://the-decoder.com/google-wants-video-ai-to-understand-what-people-need-as-they-workgoogle-researchers-are-teaching-a-video-assistant-when-to-offer-help/
---

Streaming video assistants today mostly wait for a request that names what to watch for, such as "let me know when the water starts boiling". A new paper, [StreamVibe](https://arxiv.org/abs/2610.34662), asks the harder question: can an assistant that watches you work figure out when to help from a vague goal, and keep up when you change your mind? The authors are mostly from Google, with others from Stanford, Oxford and UC Santa Barbara. The paper was submitted to arXiv on 26 October.

## The benchmark

StreamVibe-Bench has 4,100 evaluation samples and 85,000 training samples, built from 183.4 hours of physical and digital task videos, according to the [project page](https://stream-vibe.github.io/). It grades three levels of intent:

- **Explicit:** the user names an event ("tell me when the water boils").
- **Implicit:** the user gives a goal and the assistant must decide when to speak.
- **Dynamic:** the request is revised, extended or interrupted mid-task.

Each second, the model sees only the past and chooses to stay silent or respond. The project page says Gemini 3.8 Flash proposed the help points and reference replies, and a sample was kept only if four human reviewers all approved it.

## The model and the harness

The team trained StreamVibe-VL, a streaming model that decides when and what to say, and StreamVibe-Harness, a memory layer that tracks open requests, task progress and past replies. The abstract reports a 10.7% improvement in response timing and answer quality over existing baselines, and a further 12.3% gain in proactive interaction from the harness. The paper says the model beats open-source baselines on its benchmark and stays competitive with proprietary models, which include Gemini 3.8 Flash and GPT-Realtime-2.1.

## The finding that matters

The most useful result is a limit. When models are scored on single moments, timing F1 sits at 63.5 to 75.6. When they run a whole video and build on their own earlier replies, performance "drops markedly" across every subtype, and timing gets steadily worse as the interaction grows longer. Requests that are revised or combined fare worse than interruptions. In the authors' words, "correct individual judgments are thus insufficient" for sustained help.

This is the research side of the proactive assistants already shipping, such as [Guided Vision in Gemini Live](/posts/gemini-live-guided-vision-android/) and Anthropic's [Claude Duet](/posts/claude-duet-proactive-agent-claude-security-continuous-scans/).

## Why this matters

If you are building an assistant that watches a screen or a camera and offers help unprompted, test it over whole sessions with its own history, not on isolated clips, because that is where this paper finds every model breaking down. Keeping open requests in an explicit state, as the harness does, is a practical pattern to copy. Treat the headline gains as the authors' results on their own benchmark until others reproduce them.
