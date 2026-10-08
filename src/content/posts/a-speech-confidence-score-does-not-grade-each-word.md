---
title: The Top Speech Alternative Has Its Own Confidence Score
description: Google Speech-to-Text V1 scores the top recognition alternative, can optionally return word confidence, and uses a separate stability signal for interim text.
pubDate: "2026-10-09T04:00:00Z"
specimen: 557
section: models
tags:
  - speech-recognition
  - confidence
  - voice-interfaces
draft: false
heroImage: https://media.aitamer.news/heroes/a-speech-confidence-score-does-not-grade-each-word-5a0cc410.jpg
heroAlt: A blue measuring arc cradles a five-tile speech ribbon containing one rust-colored tile, with a small microphone nearby.
author: ari
wildness:
  rating: 1
  verified: V1 distinguishes top-alternative confidence, optional word confidence, and interim stability.
  claimed: No universal action threshold is established; it requires application-specific evaluation.
verdict: Treat confidence as an optional estimate at a defined scope. Confirm consequential names and commands, and evaluate thresholds on your own audio.
sources:
  - title: Google Cloud Speech-to-Text request guide
    url: https://cloud.google.com/speech-to-text/docs/speech-to-text-requests#confidence_values
  - title: Google Cloud Speech-to-Text V1 recognize response reference
    url: https://cloud.google.com/speech-to-text/docs/reference/rest/v1/speech/recognize
  - title: Google Cloud Speech-to-Text V1 RecognitionConfig reference
    url: https://cloud.google.com/speech-to-text/docs/reference/rest/v1/RecognitionConfig
---

A voice assistant hears “send the report to Mara” and shows a transcript with confidence 0.82. That number should not make every word equally trustworthy. A mistaken name can matter more than the rest of an otherwise plausible sentence.

In Google Cloud Speech-to-Text V1, a recognition result may contain several transcript alternatives. The first is the recognizer's top-ranked hypothesis. The result's alternative-level confidence estimates how likely its recognized words are correct in aggregate; Google says this value is set only for the top alternative of a non-streaming result or a final streaming result. Ranking also uses signals beyond this score, so the top alternative need not have the highest confidence value. The [request guide](https://cloud.google.com/speech-to-text/docs/speech-to-text-requests#confidence_values) and [V1 response reference](https://cloud.google.com/speech-to-text/docs/reference/rest/v1/speech/recognize) describe these boundaries.

The API can also provide word-specific information. With enableWordConfidence set in the [V1 recognition configuration](https://cloud.google.com/speech-to-text/docs/reference/rest/v1/RecognitionConfig), the top result includes words with confidence values; the default is false. This gives an application a more local signal for a name or command verb. It does not turn the alternative-level score into a guarantee about any particular word. The REST reference says confidence is not guaranteed to be accurate or always supplied. Its default 0.0 is a sentinel for an unset value, so code should not silently interpret zero as a measured failure.

Live transcription adds another field with a different job. Interim results can change as more audio arrives. Their stability estimates how likely that partial text is to change; it does not estimate correctness. The guide says stability is absent on final results, while alternative confidence is typically available only on the final top hypothesis. A stable partial phrase can still be wrong, and a low stability value says little about the eventual transcription.

For a voice action with a costly mistake, display interim words as provisional and wait for a final result before using confidence. If the action depends on a person's name, inspect available word confidence and ask the user to confirm the name when evidence is weak or absent. Keep a separate path for missing scores. Any numerical threshold should be chosen from labeled examples of the application's own accents, noise, names, and error costs; the documentation defines fields, not a universal safe cutoff.
