---
title: The Transcript Shown to a Reader Can Differ From the Recognized Words
description: Azure Speech can turn spoken words into formatted display text. Keep the recognized wording and reader-facing transcript separate when building voice applications.
pubDate: "2026-10-09T23:30:00Z"
specimen: 596
section: dev
tags:
  - speech-recognition
  - azure-speech
  - transcripts
  - text-normalization
draft: false
heroImage: https://media.aitamer.news/heroes/the-transcript-shown-to-a-reader-can-differ-from-the-recognized-words-cf5e253a.jpg
heroAlt: An irregular speech ribbon passes through a blue paper press into a neat blank display card while the original remains attached.
author: ari
wildness:
  rating: 1
  verified: Azure formats recognized speech with inverse text normalization, capitalization and punctuation.
  claimed: No claim that a display value proves the exact spoken wording.
verdict: Keep the recognized and displayed text separately, and confirm high-impact parsed values before acting.
sources:
  - title: Display text formatting with speech to text - Azure Speech
    url: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/display-text-format
---

“Six point five” can appear in a transcript as “6.5.” That change is useful for a reader, yet it matters to a developer who needs to know what the speaker actually said. An AI assistant might use the formatted value to fill a numeric field, while an audit view or a correction workflow needs the recognized wording alongside it.

[Azure Speech's display formatting documentation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/display-text-format) describes several transformations. Inverse text normalization turns spoken number and symbol sequences into written forms, including times, currencies, phone numbers, and email addresses. The service performs this conversion automatically, and the page says it is not configurable. Capitalization can turn a recognized city name into a proper noun. Punctuation adds sentence marks and separators that were inferred from speech. Azure can also remove disfluencies such as repeated words and fillers from display text. Each step improves legibility, but the visible sentence can conceal a choice made after word recognition.

Consider a caller saying, “send it to support at help dot com.” A formatted transcript may contain an email address. A downstream agent should not treat the presence of `@` as proof that the caller uttered that symbol. If the destination controls a sensitive action, confirm it with the caller or compare the relevant recognition forms before sending anything. The same principle applies to a monetary amount: a readable `$900` is convenient, but any decision involving money should retain a route back to the input that produced it.

Azure's page explicitly distinguishes the result's `Text` and `MaskedNormalizedForm` properties from `LexicalForm` and `NormalizedForm` when describing profanity filtering. The filter applies to the former pair, while the latter pair are outside that filtering step. That is a practical warning against assuming all text fields are interchangeable. It also means an application handling these fields must set its own access and retention rules; a reader-friendly transcript is not a safe substitute for a policy on more literal forms.

Store the form used for display and the form used for analysis as separately named values, with a link to the same recognition result. In the user interface, show the readable text and give reviewers a deliberate way to inspect the underlying wording when a correction matters. For actions triggered by parsed dates, addresses, or amounts, validate the interpreted value before execution. Formatting is a presentation feature; treating it as evidence of exactly what was spoken makes errors harder to find.
