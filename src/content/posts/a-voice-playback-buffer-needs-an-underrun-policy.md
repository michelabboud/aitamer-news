---
title: A Voice Playback Buffer Needs an Underrun Policy
description: Network audio arrives asynchronously while an AudioWorklet must fill each render block on time. A bounded ring buffer and explicit silence policy turn missing samples into predictable behavior.
pubDate: "2026-10-08T13:30:00Z"
specimen: 490
section: dev
tags:
  - web-audio
  - audioworklet
  - streaming-audio
  - voice-agents
draft: false
heroImage: https://media.aitamer.news/heroes/a-voice-playback-buffer-needs-an-underrun-policy-12b11e32.jpg
heroAlt: A blue paper carousel feeds waveform pieces onto a ribbon, with a blank spacer filling one missing sample slot.
author: ari
wildness:
  rating: 1
  verified: MDN defines synchronous render callbacks; Chrome documents ring buffers and silent underflow.
  claimed: Buffer targets, fade behavior, and latency effects are design choices, not measured results here.
verdict: Use a bounded sample buffer, fill missing output frames explicitly, and choose overflow, recovery, and latency policies before shipping.
sources:
  - title: MDN AudioWorkletProcessor.process()
    url: https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process
  - title: "Chrome for Developers: Audio worklet design pattern"
    url: https://developer.chrome.com/blog/audio-worklet-design-pattern
---

A browser voice agent receives synthesized speech in network chunks. One chunk arrives late while the previous chunk is almost exhausted. The speaker still needs the next samples at the next audio render callback. The network cannot promise to deliver them on that schedule, so playback needs an answer for the moment its buffer runs dry.

[MDN’s `AudioWorkletProcessor.process()` reference](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process) says the callback runs synchronously on the audio rendering thread for each render quantum. Its output channel arrays are filled with zeros by default; the processor writes samples into them to produce sound. Current render blocks are 128 frames, but MDN cautions that block size may change, even during processing. Use `channel.length` for each callback rather than treating 128 as an eternal contract.

The bridge from network arrival to this callback is a bounded queue of decoded, output-rate sample frames. A producer receives a chunk, decodes it and performs any needed channel conversion or resampling before making those frames available to the renderer. The render callback consumes exactly as many frames as the output arrays request. This separates bursty delivery from a steady consumption clock. A circular buffer can hold frames without moving an entire array on every callback. [Chrome’s Audio Worklet design guidance](https://developer.chrome.com/blog/audio-worklet-design-pattern) uses ring buffers to reconcile different block sizes and describes silence when an output ring underflows.

Consider a mono stream at 48,000 frames per second whose producer delivers 20 millisecond chunks. Each chunk holds 960 frames, while a current 128-frame render block covers about 2.7 milliseconds. Seven full callbacks and part of an eighth consume one chunk. A single late network chunk can therefore span multiple render callbacks. Those numbers illustrate the clocks involved; they are not a target buffer size or a measured latency. The actual sample rate, decoded format, and output block length must come from the running audio graph.

The most important policy is what happens when the buffer contains fewer frames than the callback needs. A simple mono processor sketch is:

```js
process(inputs, outputs) {
  const channel = outputs[0][0];
  const copied = this.ring.readInto(channel); // Returns frames copied.
  channel.fill(0, copied);                     // Explicit underflow silence.
  return true;                                 // More speech may arrive.
}
```

Here `readInto` represents a preallocated ring buffer operation, not a built-in Web Audio method. The callback always fills the requested output, even when it has only part of a chunk. Silence is a clear fallback, but an abrupt boundary can click or sound like a dropout. A product may add a short fade at the transition; that needs its own state and testing. The code also assumes one output channel. Multichannel playback needs coherent frame positions across channels and a defined way to fill each one.

Do not wait inside `process()` for the next network message or a worker to finish. Chrome’s guidance explicitly keeps its worklet callback from synchronously blocking on a worker and warns that a ring buffer does not add time to the render deadline. In a heavier pipeline, a worker and shared memory can move decoding or processing off the render thread; asynchronous `MessagePort` delivery is simpler for some designs but brings message and allocation overhead. Whichever bridge is chosen, keep callback work bounded and avoid allocations or decoding there.

Buffer sizing is a latency decision. Starting playback only after a small reserve absorbs some arrival variation, but every extra queued frame delays what the caller hears. A maximum capacity prevents a stalled consumer or fast producer from accumulating seconds of obsolete speech. Choose what to do at that ceiling: reject stale frames, pause the producer if the protocol permits, or replace queued audio when the conversation has moved on. Each choice changes the audible result, so document it alongside the underrun choice.

Make the failure visible to the application. Count underflowed frames and occurrences, track the minimum and maximum queued duration, and distinguish a deliberate pause from an unexpected starvation event. During interruption or barge-in, clear or replace buffered speech according to the conversation state; otherwise the assistant may speak an old answer after the user has already changed the subject. When the stream has truly ended and the buffer is drained, the processor can stop asserting that it will produce future output. MDN explains that returning `true` keeps a source processor active, while returning `false` lets the browser end an inactive node.

The engineering test is a controlled late or missing chunk, followed by a burst. Verify that the callback stays bounded, missing frames become the intended silence, recovery does not replay obsolete audio, and queued duration stays within the chosen limit. A ring buffer makes the clocks meet; the underrun and overflow policies determine what the listener actually experiences.
