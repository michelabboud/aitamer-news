---
title: Vocabulary Boosting Can Introduce False Positives
description: Speech adaptation can improve recognition of a rare name while making the recognizer hear that name where it was never spoken.
pubDate: "2026-10-09T23:00:00Z"
specimen: 595
section: models
tags:
  - speech-recognition
  - model-adaptation
  - evaluation
  - voice-interfaces
draft: false
heroImage: https://media.aitamer.news/heroes/vocabulary-boosting-can-introduce-false-positives-7d351524.jpg
heroAlt: A yellow lens favors a rust paper bird and overshadows a similar blue bird beside a microphone.
author: ari
wildness:
  rating: 1
  verified: Phrase boosts bias recognition and can reduce misses while increasing false positives.
  claimed: No additional empirical claim; the name example is illustrative.
verdict: Evaluate phrase boosts against both spoken-name positives and realistic negatives. Require confirmation when a wrong recognized name can trigger a costly action.
sources:
  - title: "Google Cloud Speech-to-Text: Improve transcription results with model adaptation"
    url: https://cloud.google.com/speech-to-text/docs/adaptation-model
---

Suppose speech recognition hears `Call Nara` as `Call Mara`. Adding Nara to a speech adaptation phrase set may help that rare name appear in the transcript. Raising its weight can make the recognizer transcribe `Call Mara` as Nara when Mara was spoken. If the transcript triggers a call, that second error matters as much as the first.

[Google Cloud's speech adaptation guide](https://cloud.google.com/speech-to-text/docs/adaptation-model) describes a `PhraseSet` as a way to bias recognition toward supplied words or phrases. It calls out proper names and domain terms as candidates. A positive boost gives a phrase more weight among transcription alternatives; increasing it can reduce misses when the phrase was spoken. The same guide warns that stronger boosts can increase false positives, where the transcript contains a boosted phrase absent from the audio. Boost changes a recognition preference, so it cannot establish that the user actually uttered the name.

On consented audio, compare no adaptation, phrases, and boosts. Build a small positive set containing the target name spoken by different speakers and in the commands people actually use. Then build a negative set: similar names, near homophones, ordinary words, and utterances that should never select the target. For each candidate boost setting, count both target-name misses and target-name insertions on the same held-out clips. Keep the model, language, audio, and scoring rules fixed so the comparison has a clear meaning. A setting that recovers more Nara requests while redirecting Mara requests needs an explicit product decision.

Phrase shape matters too. The guide says a boost on a multiword phrase applies to the whole phrase; adding component phrases can help when users vary the wording. Expanding that list also expands the ways a preferred term can appear, so re-evaluate the negatives after every change. Availability of boost depends on language support; check it before designing a workflow around the feature.

Choose a boost only after setting acceptable limits for both error types. For a voice action with a costly wrong target, add confirmation or disambiguation when the recognized name is uncertain. Keep the positive and negative recordings in the evaluation set as the contact list changes. Decide from the full set of likely utterances whether the system selects the right contact often enough for this action.
