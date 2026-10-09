---
title: Clearing Queued Audio Needs Playback Acknowledgements
description: Twilio buffers outbound media and returns matching marks after playback or clear. An AI voice agent needs that distinction to account for speech interrupted by a caller.
pubDate: "2026-10-10T00:00:00Z"
specimen: 597
section: dev
tags:
  - twilio
  - media-streams
  - voice-agents
  - barge-in
draft: false
heroImage: https://media.aitamer.news/heroes/clearing-queued-audio-needs-playback-acknowledgements-2aa65546.jpg
heroAlt: A paper speaker has delivered one tagged audio ribbon while two segments remain apart in a waiting pocket.
author: ari
wildness:
  rating: 1
  verified: Outbound media is buffered; marks return after playback or after clear empties buffered audio.
  claimed: A returned mark alone cannot prove a human heard or understood the audio.
verdict: Track each segment by mark name; after clear, treat unacknowledged delivery conservatively and confirm critical speech.
sources:
  - title: "Twilio Media Streams: WebSocket messages"
    url: https://www.twilio.com/docs/voice/media-streams/websocket-messages
---

The caller interrupts just as an AI voice agent says, “Your appointment is…” The server has already sent several audio chunks. Which words did the caller hear? Sending a stop signal to the speech generator does not answer that question, because some audio may already be buffered by the call platform.

For a bidirectional Twilio Media Stream, your server sends outbound `media` messages over the WebSocket. [Twilio's WebSocket message reference](https://www.twilio.com/docs/voice/media-streams/websocket-messages) says these messages are buffered and played in arrival order. After a media message, the server can send a `mark` with an application-chosen `name`. Twilio returns a `mark` carrying that name when the audio has completed playback. This gives the application a way to associate acknowledgement with a particular piece of generated speech.

Barge-in changes the interpretation. When the caller starts speaking, the server can send `clear` for the stream. Twilio empties its buffered audio and returns mark messages for marks still pending in that buffer. Those acknowledgements are evidence that the corresponding buffered media was cleared, not evidence that the caller heard it. A naive ledger that counts every returned mark as “played” will therefore overstate what the agent delivered.

A useful ledger assigns each utterance or audio segment a unique mark name and keeps its text, send order, and state. On a normal returned mark, move the corresponding segment to completed playback. When sending `clear`, record a clear boundary and treat still-unacknowledged segments as interrupted. Twilio returns marks for buffered audio it clears, but a mark already on its way back could have completed just before the clear took effect. Therefore a returned mark around that boundary should not be promoted to definitely heard without stronger timing evidence. Use a single ordered writer for outbound media, marks, and clear so local state reflects the order your server sent them. For example, if segments A, B, and C were sent and A was acknowledged before the interruption, A can be counted as completed; B and C remain uncertain until the clear-response bookkeeping is resolved.

The boundary is still limited. A playback acknowledgement says Twilio finished playback for a marked portion of audio; it does not prove the human understood or even listened. A clear event empties buffered audio, but it cannot retract sound already emitted. Network timing around an interruption also makes it important to record which marks were already acknowledged before clear, rather than infer playback solely from the order of generated text.

When the agent resumes, construct context from playback acknowledged before interruption and segments whose delivery remains uncertain. If a critical instruction was interrupted, repeat or confirm it instead of assuming delivery. The practical design is a small state machine keyed by mark names, with clear treated as a state transition, rather than as a fire-and-forget command.
