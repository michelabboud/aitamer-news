---
title: A Synthesis Output Format Includes More Than a File Extension
description: Azure Speech lets applications choose encoded audio characteristics. Match the codec, sample rate, channels, and header format to the browser or phone pipeline before naming or forwarding the bytes.
pubDate: "2026-10-09T01:30:00Z"
specimen: 514
section: dev
tags:
  - azure-speech
  - text-to-speech
  - audio
  - application-design
draft: false
heroImage: https://media.aitamer.news/heroes/a-synthesis-output-format-includes-more-than-a-file-extension-db4ccb25.jpg
heroAlt: Blue audio-wave ribbons lie inside an open cream paper sleeve and bare beside it.
author: ari
wildness:
  rating: 1
  verified: Azure Speech offers explicit output formats, including headerless raw PCM and RIFF PCM.
  claimed: Browser and phone examples are integration scenarios; no universal consumer codec support is claimed.
verdict: Select synthesis format from each consumer's audio contract, and carry the codec, rate, channels, and framing with the bytes.
sources:
  - title: "Microsoft Learn: how to synthesize speech"
    url: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis
---

A voice assistant can produce audio that plays in a browser but fails when the same bytes are sent to a phone gateway. The filename may say `.wav` in both places. That name does not tell the receiver whether the stream contains MP3 frames, headerless PCM samples, or PCM inside a RIFF container. The receiving system needs the actual format contract.

In [Azure Speech synthesis guidance](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis), output format is an explicit choice. The REST example sets `X-Microsoft-OutputFormat` to `audio-16khz-128kbitrate-mono-mp3` and saves the response as an MP3 file. In the SDK, `SpeechConfig` can select a `SpeechSynthesisOutputFormat` enum; the guide demonstrates `Riff24Khz16BitMonoPcm`. These names carry properties beyond the extension: encoding, sample rate, bit depth or bit rate, channel count, and whether a container header is present. The available combinations come from the service's format list, rather than from arbitrary values assembled by the application.

Consider two consumers of one spoken reply. A browser path may accept an MP3 response and expose it as audio with the matching media type. A phone integration might require mono PCM at a particular sample rate and framing specified by its gateway. The right selection follows each consumer's documented input contract. If the available synthesis output does not match, the application needs an explicit conversion step, with its own latency and audio-quality costs. Renaming an MP3 response to `.wav`, or changing only the HTTP media type, leaves its encoded bytes unchanged.

Raw and RIFF PCM illustrate why header choice matters. The Azure guide says raw formats such as `Raw24Khz16BitMonoPcm` contain no audio header. A downstream decoder therefore needs the sample rate, bit depth, channel count, and PCM interpretation from an external contract. Azure's `Riff24Khz16BitMonoPcm` example places PCM in a RIFF form that a WAV-aware reader can interpret. A receiver expecting a bare PCM stream cannot simply consume those RIFF header bytes as samples; a receiver expecting a WAV file cannot infer a complete file from headerless samples alone. Pick the form that the integration actually accepts.

An in-memory synthesis result does not remove this distinction. The guide shows reading audio bytes from a synthesis result or stream, then handling them in application code. When a service forwards those bytes to a browser or phone API, it must preserve the selected format in the response metadata and in any downstream request. Store the format choice alongside cached audio; otherwise a future consumer may rely on a filename or a guessed default.

Before wiring a new output path, record the consumer's accepted codecs, sample rates, channels, and container or raw framing. Choose an Azure format from the documented options, then verify the returned bytes with that consumer. For a multi-channel voice product, separate browser and phone delivery formats at the boundary so each receives audio it can decode reliably.
