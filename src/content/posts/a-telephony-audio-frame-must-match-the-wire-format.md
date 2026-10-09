---
title: A Telephony Audio Frame Must Match the Wire Format
description: Twilio outbound media expects base64-encoded raw μ-law audio at 8 kHz. A voice model’s PCM or WAV output needs explicit conversion before it reaches the call.
pubDate: "2026-10-10T08:00:00Z"
specimen: 613
section: devops
tags:
  - twilio
  - voice-ai
  - audio
  - websockets
  - telephony
draft: false
heroImage: https://media.aitamer.news/heroes/a-telephony-audio-frame-must-match-the-wire-format-4eb75689.jpg
heroAlt: A sleeved paper audio record is converted by a blue wheel into a raw rust ribbon fitting a teal telephone opening.
author: ari
wildness:
  rating: 1
  verified: Twilio outbound media requires raw μ-law at 8 kHz, base64 encoded, without file headers.
  claimed: No additional empirical claim; examples illustrate the documented mechanism.
verdict: Decode, resample and μ-law encode before base64; use marks and clear to manage playback.
sources:
  - title: Twilio Media Streams WebSocket messages
    url: https://www.twilio.com/docs/voice/media-streams/websocket-messages#send-a-media-message
  - title: "RFC 3551: PCMA and PCMU"
    url: https://www.rfc-editor.org/rfc/rfc3551.html#section-4.5.14
---

A voice agent generates an answer as a WAV file and sends the file bytes through a bidirectional Twilio Media Stream. The WebSocket message is valid JSON and its payload is valid base64, yet the caller hears distorted audio. Base64 only transports bytes; it cannot turn a file into the audio encoding expected on the call.

For media sent from a server to Twilio, the [Media Streams message specification](https://www.twilio.com/docs/voice/media-streams/websocket-messages#send-a-media-message) requires `audio/x-mulaw` at an 8,000 Hz sample rate, base64 encoded in `media.payload`. The message also carries `event: "media"` and the stream's `streamSid`. Twilio warns that payload bytes must not include an audio file header. A WAV or similar container begins with metadata that the media decoder would treat as sound, so forwarding the complete file is incorrect.

Conversion has an order. First decode the model's output according to its actual source format. If the model emits 24 kHz linear PCM, resample the samples to 8 kHz, then encode them as μ-law. If it emits a WAV file, parse the container to find the audio and its encoding; removing a header alone cannot convert PCM samples into μ-law. Base64-encode only the resulting raw μ-law bytes and put that string in the JSON payload. Validate the source format at the boundary instead of guessing from a filename or a byte array.

A byte-count sanity check can catch a mislabeled buffer. [RFC 3551 describes G.711 μ-law as eight bits per sample](https://www.rfc-editor.org/rfc/rfc3551.html#section-4.5.14). For mono 8 kHz audio, 160 raw μ-law bytes represent 20 milliseconds: 160 samples divided by 8,000 samples per second. That is calculated duration, not a requirement to send 160-byte messages. Twilio permits payloads of any size. The count applies before base64 encoding, and a plausible duration cannot prove that the bytes were encoded correctly. Listen to a decoded sample and compare it with the source speech in a controlled integration check.

The practical boundary is the encoded byte stream immediately before `media.payload`. Inspect its declared format, sample rate and container status there, then check that the outbound bytes are headerless μ-law at 8 kHz. Compare raw byte count with intended duration, and verify a decoded sample before sending it through the call. This isolates a format conversion problem from successful delivery of a WebSocket message.
