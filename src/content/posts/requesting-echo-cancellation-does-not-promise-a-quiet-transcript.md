---
title: Requesting Echo Cancellation Does Not Promise a Quiet Transcript
description: Browser echo-cancellation constraints negotiate a track setting. Learn what supportedConstraints, ideal, exact, and getSettings reveal, then test the microphone route that users actually use.
pubDate: "2026-10-10T02:00:00Z"
specimen: 601
section: dev
tags:
  - browser-audio
  - voice-agents
  - webrtc
  - media-constraints
draft: false
heroImage: https://media.aitamer.news/heroes/requesting-echo-cancellation-does-not-promise-a-quiet-transcript-fa199910.jpg
heroAlt: A cream voice silhouette sends sound toward a microphone through a teal barrier, while one rust echo loops around it.
author: ari
wildness:
  rating: 1
  verified: echoCancellation accepts preferences and exact requirements; getSettings reports the selected setting.
  claimed: The setting alone does not establish transcript quality on a particular audio route.
verdict: Inspect the selected track setting, handle exact-constraint failures, and test speaker-to-microphone leakage on real routes.
sources:
  - title: "MDN: MediaTrackConstraints.echoCancellation"
    url: https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/echoCancellation
  - title: "MDN: Capabilities, constraints, and settings"
    url: https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API/Constraints
  - title: "MDN: MediaDevices.getUserMedia()"
    url: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
---

The agent reads a reply aloud, and its own next transcript contains part of that reply. A developer sees `echoCancellation: true` in the microphone request and assumes the browser broke its promise. The request is a preference, while the transcript reflects sound captured through a particular microphone and playback route.

The [echoCancellation constraint](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/echoCancellation) accepts a boolean and, where supported, the modes `"all"` and `"remote-only"`. A plain `true` asks the browser to perform cancellation; the browser decides which audio to remove. `"remote-only"` targets audio from remote tracks represented by `RTCPeerConnection`, so it is a poor assumption for locally played agent speech. `"all"` asks to remove system-generated audio more broadly, but availability depends on browser support. Those mode names describe requested behavior, not a measured promise about transcription quality.

Three API views answer different questions. `navigator.mediaDevices.getSupportedConstraints().echoCancellation` says whether the browser recognizes that constrainable property. It does not say the chosen microphone and output path will suppress playback. A track's `getConstraints()` reports requests; `getSettings().echoCancellation` reports the setting actually selected for that track. The [MDN constraints guide](https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API/Constraints) explicitly distinguishes the requested constraints from current settings.

```js
const supported = navigator.mediaDevices.getSupportedConstraints();
const stream = await navigator.mediaDevices.getUserMedia({
  audio: { echoCancellation: { ideal: true } }
});
const track = stream.getAudioTracks()[0];
console.log(supported.echoCancellation, track.getSettings().echoCancellation);
```

`ideal: true` favors cancellation without making capture fail solely because that preference cannot be met. If cancellation is a hard prerequisite, check support and request `{ exact: true }`, then handle rejection. An unsatisfied mandatory constraint can yield `OverconstrainedError`, whose `constraint` field identifies an impossible requirement; permission and device failures have other error paths in [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia). An unknown constraint can be ignored, so a support check still matters before relying on `exact`.

Even a reported enabled setting is not an acoustic test. Play the agent's real output through the routes users take, such as built-in speakers, a headset, and a changed Bluetooth device. Capture the resulting microphone audio and inspect whether the agent's speech appears in the transcript, especially during simultaneous user speech. Record the browser, input, output, selected setting, and observed failure together. Treat cancellation as one negotiated input condition; make the voice interaction resilient when audible playback still reaches recognition.
