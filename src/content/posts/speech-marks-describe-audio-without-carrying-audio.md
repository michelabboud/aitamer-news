---
title: Speech Marks Describe Audio Without Carrying Audio
description: Amazon Polly speech marks give timing and UTF-8 byte ranges for synthesized words and sentences. Audio and marks require separate output choices, so a highlighting UI must keep their inputs aligned.
pubDate: "2026-10-08T22:00:00Z"
section: dev
tags:
  - amazon-polly
  - speech-synthesis
  - captions
  - developer-tools
draft: false
heroImage: https://media.aitamer.news/heroes/speech-marks-describe-audio-without-carrying-audio-fd425d28.jpg
heroAlt: An audio waveform ribbon and a separate timing-tab ribbon share one aligned starting clip.
author: ari
wildness:
  rating: 1
  verified: Polly emits line-delimited JSON marks with millisecond times and byte offsets.
  claimed: Timing may differ with the voice; no claim of universal frame-accurate captions.
verdict: Request speech marks and audio from the same text and voice, preserve the exact input bytes, and map byte offsets carefully before highlighting text.
sources:
  - title: "Amazon Polly: speech mark output"
    url: https://docs.aws.amazon.com/polly/latest/dg/output.html
  - title: "Amazon Polly: requesting speech marks"
    url: https://docs.aws.amazon.com/polly/latest/dg/speechmarksconsole.html
  - title: "Amazon Polly API: SynthesizeSpeech"
    url: https://docs.aws.amazon.com/polly/latest/APIReference/API_SynthesizeSpeech.html
---

A voice assistant can speak a generated answer while highlighting each word on screen. The highlighter needs two coordinates: when a word begins in the audio, and where that word appears in the text. Amazon Polly's [speech marks](https://docs.aws.amazon.com/polly/latest/dg/output.html) provide those coordinates as line-delimited JSON objects.

Each mark has a time in milliseconds from the start of the corresponding audio stream and a type such as sentence, word, viseme, or SSML. For word and sentence marks, start and end locate the marked text in the input. These positions count UTF-8 bytes, not characters. A mark also carries a value, which for a word or sentence is the corresponding input substring. Viseme marks describe mouth shapes and do not carry text offsets.

Consider the input “café now.” In UTF-8, “é” occupies two bytes. A display component that treats start and end as JavaScript string indexes, Unicode scalar positions, or grapheme positions can highlight the wrong span after that character. Keep the exact input sent to Polly, interpret offsets against its encoded bytes, and convert the resulting range to the indexing scheme of the UI. Do the conversion once in a tested adapter, especially if the UI normalizes or edits text before rendering. The displayed answer and synthesized answer must refer to the same text snapshot.

The mark stream does not contain audio. Polly's [SynthesizeSpeech API](https://docs.aws.amazon.com/polly/latest/APIReference/API_SynthesizeSpeech.html) selects an output format: an audio format such as MP3 for sound, or JSON for speech marks. The [request guide](https://docs.aws.amazon.com/polly/latest/dg/speechmarksconsole.html) describes requesting marks with JSON output and selected mark types. An application that needs playback and highlighting therefore makes an audio request and a marks request, then stores or associates both results with the same input and synthesis settings.

Voice choice is particularly important. Polly notes that timing metadata can differ for another voice even with the same text. An application should bind the marks to the exact voice used for the audio and avoid reusing a mark file after changing the voice or input. The times are useful cues for a player timeline; they are not a promise that every listener or playback device presents a visually perfect boundary at that millisecond.

For captions, sentence marks can establish coarse segments and word marks can drive a reading highlight. The playback clock should determine the current mark, while the byte range determines the highlighted text. If either input changes, regenerate the paired artifacts. This simple pairing rule prevents a plausible-looking but misleading interface, especially in AI applications where answers are regenerated frequently.
