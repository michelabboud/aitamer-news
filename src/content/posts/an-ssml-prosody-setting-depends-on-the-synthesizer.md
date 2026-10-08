---
title: An SSML Prosody Setting Depends on the Synthesizer
description: SSML can request a slower, softer or higher voice, but the synthesizer decides how to render it. Design voice prompts around audible outcomes and a usable fallback.
pubDate: "2026-10-08T18:30:00Z"
specimen: 500
section: dev
tags:
  - ssml
  - text-to-speech
  - voice-interfaces
  - accessibility
draft: false
heroImage: https://media.aitamer.news/heroes/an-ssml-prosody-setting-depends-on-the-synthesizer-91a24d8c.jpg
heroAlt: One request strip feeds two paper sound boxes that produce differently shaped waveforms.
author: ari
wildness:
  rating: 1
  verified: SSML prosody requests rate, pitch and volume; processors may limit or ignore some requests.
  claimed: No claim that the example sounds the same across synthesizers or has a fixed duration.
verdict: Use SSML prosody to guide a prompt, then audition each supported voice and engine for intelligibility. Preserve clear text when audio rendering varies.
sources:
  - title: W3C Speech Synthesis Markup Language 1.1, prosody element
    url: https://www.w3.org/TR/speech-synthesis11/#S3.2.4
---

A voice assistant reads a confirmation while someone is deciding whether to send a message. The product team wants the destination and action spoken slowly, without making the whole interaction drag. SSML offers a local request:

```xml
<speak version="1.1" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
  Send the message to <prosody rate="85%" volume="soft">the support team</prosody>?
</speak>
```

The [SSML 1.1 prosody specification](https://www.w3.org/TR/speech-synthesis11/#S3.2.4) gives `rate`, `pitch`, and `volume` distinct jobs. `rate` changes speaking speed relative to a voice's default. `pitch` addresses the baseline pitch of the contained speech. `volume` can request a labelled level such as `soft` or a signed decibel change relative to the current level. These are controls on the enclosed text, so a prompt can focus an important phrase without imposing the same treatment on every sentence.

The markup expresses intent, while the synthesis processor produces the sound. A rate of `85%` is relative to a default that depends on the voice, language and dialect. A `soft` label can cause a different kind of adjustment from a numerical volume change. The specification permits a processor to limit an unsupported value or substitute another value, and in some circumstances to ignore prosodic markup it considers redundant, erroneous or harmful to speech quality. An accepted SSML document therefore does not establish an exact duration, frequency or perceived loudness.

Interactions between controls matter too. Within one `prosody` element, `duration` takes precedence over `rate`, and `contour` takes precedence over `pitch` and `range`. If an application emits both settings, its author should know which one governs the requested rendering. Avoid stacking controls merely because the interface exposes them.

For a voice product, keep the critical wording clear before adjusting its sound. Audition the complete prompt with each supported synthesizer, voice and language. Listen for intelligibility, clipping, awkward emphasis and whether the user can distinguish the action from the destination. Keep the visible confirmation text available when audio cannot carry the distinction reliably. Treat a change of engine or voice as a reason to repeat that listening check. Judge the prompt by whether people understand the decision across supported voices and engines.
