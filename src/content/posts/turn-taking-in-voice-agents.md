---
title: "How voice agents decide when you are done speaking"
description: "Voice activity detection finds speech and silence; turn detection, endpointing and interruption rules decide what an agent should do with those signals."
pubDate: "2026-10-01T13:00:00Z"
specimen: 62
section: "tools"
tags: ["voice-agents", "speech", "vad", "turn-taking", "pipecat", "livekit"]
draft: false
heroImage: "https://media.aitamer.news/heroes/turn-taking-in-voice-agents.jpg"
heroAlt: "A paper-cut collage of two slate-blue and cream speech waves approaching a pause, with a coral marker showing the handoff between speakers."
author: "ari"
sources:
  - title: "Silero VAD README"
    url: "https://github.com/snakers4/silero-vad/blob/master/README.md"
  - title: "LiveKit turn-taking tuning"
    url: "https://docs.livekit.io/agents/logic/turns/tuning/"
  - title: "LiveKit turn detector"
    url: "https://docs.livekit.io/agents/logic/turns/turn-detector/"
  - title: "LiveKit adaptive interruption handling"
    url: "https://docs.livekit.io/agents/logic/turns/adaptive-interruption-handling/"
  - title: "LiveKit turns overview"
    url: "https://docs.livekit.io/agents/logic/turns/"
  - title: "LiveKit function tools"
    url: "https://docs.livekit.io/agents/logic/tools/definition/"
  - title: "Pipecat Smart Turn overview"
    url: "https://github.com/pipecat-ai/docs/blob/main/api-reference/server/utilities/turn-detection/smart-turn-overview.mdx"
wildness:
  rating: 4
  verified: "Primary docs confirm the listed features and limits; runtime behavior was not independently tested."
  claimed: "Framework behavior is vendor-documented; performance claims were not independently tested."
verdict: "Treat turn-taking as several decisions, then tune them against real conversation clips: pauses, brief acknowledgments, noise and genuine interruptions."
---

When a voice agent answers too soon, it feels impatient. When it waits through a long silence, it feels sluggish. When a listener says “right” and the agent stops mid-sentence, the system has mistaken an acknowledgment for a handoff.

These are turn-taking errors. The decision to speak is its own part of a voice pipeline. The pipeline must detect speech activity, decide whether the person's turn is complete, and decide whether the agent should yield when speech overlaps its own.

Those decisions are related, but they are not the same decision.

## Voice detection finds activity, not intent

Voice activity detection (VAD) estimates whether an audio segment contains speech. It can mark when speech starts and when it appears to stop. VAD can locate speech segments in audio.

[Silero VAD](https://github.com/snakers4/silero-vad/blob/master/README.md), for example, is a pretrained detector with examples for locating speech timestamps in audio. Like any VAD, its output answers a narrow question: does this sound like speech? It does not know whether a speaker has finished a sentence, is pausing to think, or is about to add “because…” after a beat.

That distinction matters because people do not speak in evenly spaced blocks. A pause can signal a finished thought, a breath, a search for a word, or a deliberate dramatic beat. A VAD-only agent has to turn those ambiguous pauses into a yes-or-no choice using timing rules. A short silence threshold can make it quick to respond but eager to cut in. A longer threshold gives the speaker room but adds delay after completed turns.

## Endpointing turns a pause into a boundary

Endpointing is the policy that decides when to close the user's turn after speech activity changes. In a simple design, the system waits for a configured stretch of silence. Some speech-to-text services also provide end-of-turn signals. Either way, a signal must be converted into a decision about when to send the user’s turn to the model.

[LiveKit's tuning guide](https://docs.livekit.io/agents/logic/turns/tuning/) exposes endpointing delays separately from interruption settings. Its documented endpointing modes are fixed and dynamic; the guide describes a minimum delay and a maximum wait. This makes the tradeoff explicit: the minimum prevents an immediate response to a tiny pause, while the maximum limits how long the system waits when it expects the speaker to continue.

The best setting depends on the interaction. A short command such as “set a timer for ten minutes” has a fairly clear endpoint. A spoken explanation with clauses, hesitations, or a user thinking aloud needs more room. A single delay will be wrong for some conversations, so measure the cases where users trail off and where the agent cuts them off before changing it.

## Semantic turn detection uses conversational context

A semantic turn detector estimates whether an utterance sounds complete, rather than treating every pause as a completed turn. It may consider the audio, intonation, recognized words, or conversational patterns. “Let me check” can sound unfinished even when followed by a pause; “That’s everything” is more likely to be complete.

[LiveKit's turn detector](https://docs.livekit.io/agents/logic/turns/turn-detector/) adds turn-detection signals to VAD. LiveKit says its older text-based detector, now deprecated, requires a speech-to-text (STT) model to supply words; its current audio detector does not require a transcript. [Pipecat's Smart Turn documentation](https://github.com/pipecat-ai/docs/blob/main/api-reference/server/utilities/turn-detection/smart-turn-overview.mdx) describes its analyzer as using audio and conversational cues to classify turns as complete or incomplete, alongside VAD pauses.

This does not remove timing from the design. A detector may say “probably not done,” but a system still needs a fallback so a long, open-ended pause does not leave the conversation stuck. Pipecat documents such a fallback for an incomplete classification if silence continues. Think of semantic detection as better evidence for the endpointing policy, not an oracle that knows what every speaker intends.

There are also architectural costs. A text-based decision depends on transcript timing and quality. Audio models consume compute and may add processing time. Framework options differ in where inference runs and which speech pipeline they require. Choose based on the signals already available in your application, then evaluate turn errors and response delay together.

## Barge-in decides whether the agent should yield

Barge-in is a user's attempt to speak while the agent is speaking. A responsive agent usually stops its audio output so the person can correct it, redirect it, or ask a new question. But detecting any incoming voice as a barge-in is too blunt: it also catches “uh-huh,” “okay,” background speech, and noises that do not mean “stop.”

[LiveKit's adaptive interruption handling](https://docs.livekit.io/agents/logic/turns/adaptive-interruption-handling/) separates brief backchannels from intentional interruptions using an audio model after VAD detects speech. The documentation describes configurations where this is available and cases where the framework falls back to VAD-only handling. This is a framework feature, not a universal property of voice agents; verify what your chosen runtime actually supports.

An interruption also affects more than the speaker. The system may need to stop text-to-speech (TTS) playback, cancel or pause generation, and keep the conversation transcript aligned with what the user actually heard. [LiveKit's turns overview](https://docs.livekit.io/agents/logic/turns/) says it truncates the agent's conversation history to the portion played before interruption. [LiveKit's function tool documentation](https://docs.livekit.io/agents/logic/tools/definition/) says tools continue running by default when the agent is interrupted. Stopping speech does not automatically cancel an action. Treat “stop talking” and “cancel the action” as separate controls, especially around purchases, messages, or other writes.

False interruptions need a recovery path. A noise burst might trigger VAD, cause the agent to stop, and then produce no transcript. LiveKit's turn-handling options include a timeout and an option to resume the interrupted response in that case. Resuming can make sense when the interruption was clearly spurious; for some interfaces, the safer choice is to remain silent and wait. Decide deliberately, and make the behavior observable in logs or events.

## Backchannels are acknowledgments, not always new turns

Backchannels are small listener responses such as “mm-hm,” “right,” or “got it.” They help a conversation feel cooperative, but they do not always request a reply or mean the agent should yield. If VAD alone controls interruptions, a brief acknowledgment may cut off the agent even though the user was encouraging it to continue.

The distinction depends on timing and intent. “Right” during an explanation may be an acknowledgment; “right, stop there” is an interruption. Adaptive audio handling can help, but its classification can still fail near the beginning or end of an agent utterance, when overlapping speech and transcript timestamps are harder to interpret. LiveKit documents boundary cooldowns for these edge cases in its Python SDK. Your own evaluation set should include brief acknowledgments, corrections, overlapping speech, and environmental noise.

## Tune the whole interaction

Treat the pipeline as a few connected stages: VAD finds speech activity, endpointing estimates when a user turn ends, a semantic detector can refine that estimate, and interruption handling decides whether the agent yields during its own speech. Backchannels test the gap between “speech detected” and “the user wants the floor.”

Start with real recordings or carefully staged clips from your expected environment. Include short commands, long pauses mid-thought, sentence endings, acknowledgments, explicit interruptions, noise, and slow transcript delivery. Record two outcomes separately: whether the turn boundary was right, and how long the agent waited to respond. A system that only optimizes speed can talk over people; one that only optimizes avoiding interruptions can feel unresponsive.

If you are assembling the pipeline yourself, begin with VAD and a conservative endpointing policy, then add semantic turn detection when pause-based rules cut users off. Add interruption handling that can distinguish acknowledgment from a request to stop, and decide what happens to active generation and tools. If you are using a managed realtime model, first learn which turn-taking decisions it owns and which controls remain available to your application. The practical choice is the simplest configuration that passes your clips without either rushing the speaker or making the agent wait noticeably after a clear finish.
