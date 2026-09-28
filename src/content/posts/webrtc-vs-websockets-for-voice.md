---
title: "WebRTC and WebSockets carry voice AI audio differently"
description: "WebRTC is built for live media; WebSockets stream audio as ordered messages. Here is how the transport choice affects latency, loss, browser audio, and deployment."
pubDate: "2026-10-01T11:00:00Z"
specimen: 61
section: "dev"
tags: ["voice-ai", "webrtc", "websockets", "realtime-audio", "networking"]
draft: false
heroImage: "https://media.aitamer.news/heroes/webrtc-vs-websockets-for-voice.jpg"
heroAlt: "A paper-cut collage of a microphone sending flowing sound waves and small message cards toward a speech bubble."
author: "ari"
sources:
  - title: "OpenAI Realtime API: WebRTC connections"
    url: "https://platform.openai.com/docs/guides/realtime-webrtc"
  - title: "OpenAI Realtime API: WebSocket connections"
    url: "https://platform.openai.com/docs/guides/realtime-websocket"
  - title: "WebRTC peer connections"
    url: "https://webrtc.org/getting-started/peer-connections"
  - title: "RFC 8656: Traversal Using Relays around NAT"
    url: "https://www.rfc-editor.org/rfc/rfc8656.html"
  - title: "RFC 6455: The WebSocket Protocol"
    url: "https://www.rfc-editor.org/rfc/rfc6455.html"
  - title: "RFC 9293: Transmission Control Protocol"
    url: "https://www.rfc-editor.org/rfc/rfc9293.html"
  - title: "WebRTC statistics specification"
    url: "https://www.w3.org/TR/webrtc-stats/"
  - title: "MDN: echoCancellation media constraint"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/echoCancellation"
  - title: "MDN: MediaStreamTrack getSettings()"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/getSettings"
  - title: "Gemini Live API WebSockets reference"
    url: "https://ai.google.dev/api/live"
  - title: "Gemini Live API best practices"
    url: "https://ai.google.dev/gemini-api/docs/live-api/best-practices"
  - title: "LiveKit noise and echo cancellation"
    url: "https://docs.livekit.io/transport/media/noise-cancellation/"
  - title: "LiveKit Agents introduction"
    url: "https://docs.livekit.io/agents/"
  - title: "Pipecat: choosing a transport"
    url: "https://docs.pipecat.ai/client/concepts/choosing-a-transport"
wildness:
  rating: 2
  verified: "Protocol behavior and API transport options are documented in standards and provider docs."
  claimed: "Framework recommendations reflect each project's own guidance."
verdict: "Choose WebRTC for interactive browser voice; use WebSockets when message control, server workflows, or API support makes them the better fit."
---

A voice agent's pauses can come from more than model response time. The transport can be part of the delay too. **[WebRTC](https://webrtc.org/getting-started/peer-connections)** (Web Real-Time Communication) and **[WebSocket](https://www.rfc-editor.org/rfc/rfc6455.html)** both keep a connection open, but they treat audio differently. WebRTC carries real-time media. WebSocket carries ordered application messages. That difference shapes how much timing, buffering, and network recovery your app must manage.

The short version: start with WebRTC for a person speaking to an agent in a browser or mobile app. Choose WebSocket when your application already works in discrete audio chunks, needs a server-to-server connection, or depends on an application programming interface (API) that exposes voice through WebSockets. Neither choice makes a slow model fast, and neither removes the need to measure end-to-end turn latency.

## WebRTC sends media tracks

With WebRTC, the browser captures microphone audio into a media track and sends it as a stream. The receiver gets a remote media track for playback. The connection also supports a separate data channel for events such as transcripts, tool status, or conversation controls. OpenAI's [Realtime WebRTC guide](https://platform.openai.com/docs/guides/realtime-webrtc) uses media tracks for audio and a data channel for other session events.

The media path is built for conversation's timing problem: a late syllable is usually less useful than a missing one. WebRTC media can travel over User Datagram Protocol (UDP), which can deliver newer packets without waiting to retransmit an older lost packet. WebRTC can also use a TCP connection to a TURN relay. Its media stack handles timestamps and jitter buffering for you.

Network delay also varies from packet to packet. That variation is **jitter**. A jitter buffer holds incoming packets briefly and releases them at a steadier pace. The [WebRTC statistics specification](https://www.w3.org/TR/webrtc-stats/) exposes packet loss, jitter, and jitter-buffer delay so an application can inspect the media path. WebRTC can conceal some loss in audio playback, though concealment cannot restore every missing sound. The buffer is a trade-off: more buffering can smooth rough networks, but it also adds delay.

## WebSockets send messages

A WebSocket is a full-duplex connection for exchanging messages. A voice application commonly captures audio, divides it into chunks, encodes the bytes, and sends each chunk in an application message. The server sends audio chunks back; the client must decode, queue, and play them. OpenAI's [Realtime WebSocket guide](https://platform.openai.com/docs/guides/realtime-websocket) describes audio as base64 data inside JavaScript Object Notation (JSON) events, with clients responsible for queuing returned chunks in order.

WebSocket rides over [TCP](https://www.rfc-editor.org/rfc/rfc9293.html), which provides reliable, ordered delivery. That is useful for commands and text: if a packet is lost, TCP retransmits it and preserves the byte sequence. For live audio, the same guarantee can mean a later chunk waits behind a missing earlier one. Pipecat's [transport guide](https://docs.pipecat.ai/client/concepts/choosing-a-transport) calls out this head-of-line blocking and the fact that applications need to handle audio timestamps and jitter buffering themselves.

This does not make WebSockets unusable for voice. They can fit when predictable message delivery matters more than immediately playing every chunk, when both endpoints are servers on stable networks, or when the provider's realtime API is designed around them. For a conversational browser client, a custom audio-over-WebSocket path means you own more media plumbing: chunk sizing, clocks, resampling, playback scheduling, interruption handling, and recovery after disconnects.

## Echo cancellation belongs to capture

When a laptop speaker plays the agent's reply, its microphone may pick up that sound again. **Acoustic echo cancellation (AEC)** tries to remove the speaker's sound from the microphone input. In a browser, this is a microphone-capture feature: request `echoCancellation` through `getUserMedia()` constraints, then check the track's selected setting with [`getSettings()`](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/getSettings). The [MDN media constraints reference](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/echoCancellation) documents the constraint and supported modes.

AEC is not automatically a property of the transport. A WebSocket client can capture audio with browser echo cancellation before sending chunks; a WebRTC client can do the same while sending a track. Verify capture behavior across browsers, headsets, speaker volume, and mobile devices. LiveKit's [noise and echo cancellation docs](https://docs.livekit.io/transport/media/noise-cancellation/) distinguish client-side WebRTC echo cancellation from additional processing their hosted service can apply. LiveKit advises against applying a frontend noise cancellation model before its agent-side model because the latter expects raw audio.

## NAT traversal is a WebRTC concern

Many clients sit behind network address translation (NAT), which hides private device addresses behind a router. WebRTC uses Interactive Connectivity Establishment (ICE) to find a working route. ICE gathers candidates with help from Session Traversal Utilities for NAT (STUN) and can relay media through Traversal Using Relays around NAT (TURN) when direct paths fail. When a firewall blocks UDP, a client can use TCP or Transport Layer Security (TLS) over TCP to reach a TURN relay; under RFC 8656, that relay forwards media to the peer over UDP. That fallback can reintroduce TCP's waiting-on-retransmission behavior on the client-to-relay leg. The [WebRTC peer connection guide](https://webrtc.org/getting-started/peer-connections) explains ICE candidates, and the [TURN specification](https://www.rfc-editor.org/rfc/rfc8656.html) documents its transport options.

This makes WebRTC more involved to deploy than opening a WebSocket endpoint: signaling must exchange connection details, and applications serving restrictive networks need a reachable relay. Managed services and frameworks can hide much of that machinery, but not the underlying network dependency. A secure WebSocket uses TLS and defaults to port 443 under [RFC 6455](https://www.rfc-editor.org/rfc/rfc6455.html), which can simplify deployment when the network permits WebSocket connections. The application then handles media timing itself.

## Realtime APIs expose different paths

An API's transport support is a product decision, not a universal standard. OpenAI documents both [WebRTC](https://platform.openai.com/docs/guides/realtime-webrtc) and [WebSocket](https://platform.openai.com/docs/guides/realtime-websocket) connections for its Realtime API. Its guide recommends WebRTC for browser and mobile clients and WebSockets for server-to-server use. That guidance reflects OpenAI's integration choices; benchmark your own app and network.

Google's [Gemini Live API WebSocket reference](https://ai.google.dev/api/live) defines a stateful WebSocket session that accepts realtime audio, video, and text. Its [best-practices guide](https://ai.google.dev/gemini-api/docs/live-api/best-practices) advises sending small audio chunks and avoiding large client-side input buffers. A provider may offer one native transport while an integration layer supplies another. Check whether the extra layer is doing signaling, media relaying, or simply converting messages; those designs have different operational costs.

## Frameworks can own the hard parts

[LiveKit Agents](https://docs.livekit.io/agents/) uses WebRTC between frontend participants and the agent, while agent code can connect to model providers through their APIs. This separates the user-facing media path from the model connection. [Pipecat's transport guide](https://docs.pipecat.ai/client/concepts/choosing-a-transport) lists WebRTC options such as Daily, SmallWebRTC, and LiveKit alongside a WebSocket transport. Pipecat recommends WebRTC for client-to-server voice and describes WebSockets as a fit for server-to-server or text-only scenarios. Treat those as framework guidance, then confirm the details against your scale, hosting, and provider.

## Choose by where the audio runs

For a voice user interface used by people on variable home, office, and mobile networks, choose WebRTC or a framework that manages it. You get media-oriented packet handling, browser audio integration, and a standard route through NAT traversal. Budget for signaling and TURN, whether you operate them or pay a service to do so.

Choose WebSockets for server-to-server voice flows or APIs that expose audio as events. Stream small chunks, keep input buffering low, queue output audio in order, and implement interruption and reconnect behavior. If using a browser, request echo cancellation independently of that transport.

Then test with realistic networks. Record the time from the first captured sample to audible agent playback, along with turn-taking delay, interruptions, packet loss or reconnects, and the quality of speech on speakers. Pick the transport that delivers acceptable conversation quality with the operational setup you can support.
