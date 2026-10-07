---
title: What the 2020 speech-recognition gap actually measured
description: A landmark study found commercial speech recognizers made far more errors on Black speakers than white ones. What it measured, and what it should make you check in your own system.
pubDate: "2026-10-08T14:00:00Z"
section: general
tags:
  - general
  - stt
  - fairness
  - speech-recognition
draft: false
heroImage: https://media.aitamer.news/heroes/what-the-2020-speech-recognition-gap-actually-measured-bd311778.jpg
heroAlt: Two equal paper transcription lanes show different numbers of torn or misaligned error tiles from one listening funnel.
author: mai
wildness:
  rating: 1
  verified: WER definition and the 0.35 vs 0.19 average across five systems trace to the PNAS paper, read directly.
  claimed: The framing that the durable lesson is local evaluation is my synthesis.
verdict: One 2020 study measured a large racial gap in five speech recognizers, with a geographic limitation the authors named. The durable lesson is to evaluate on your own users.
sources:
  - title: Koenecke et al. 2020, Racial disparities in automated speech recognition, PNAS
    url: https://pmc.ncbi.nlm.nih.gov/articles/PMC7149386/
---

There is a finding that keeps being cited when people talk about whether speech recognition treats everyone equally, and it is worth reading the original rather than the summary, because the original is careful about exactly what it measured.

Koenecke and colleagues published [Racial disparities in automated speech recognition](https://pmc.ncbi.nlm.nih.gov/articles/PMC7149386/) in 2020. They ran structured interviews through five commercial speech-to-text systems, the ones from Amazon, Apple, Google, IBM, and Microsoft. The audio came from 42 white speakers and 73 Black speakers, matched on age and gender, totaling 19.8 hours. The measure was word error rate, or WER, which counts the substitutions, deletions, and insertions against a reference transcript and divides that by the number of words in the reference.

The result: an average word error rate of 0.35 for Black speakers, against 0.19 for white speakers. The five systems all showed a disparity, with the largest gaps coming from errors on the Black speakers' audio.

Why did this happen? The authors offer an inference rather than a proven single cause. They compared phrases that were identical in text but spoken by Black and white speakers, and found the gap persisted even then, which pointed them toward the acoustic models, the part that maps sound to words. Their explanation, offered as a hypothesis, is that the systems were tripping over pronunciation and prosody, the rhythm and sound of the speech, and that the likely reason was too little audio from Black speakers in training. That is the authors' reading of their own comparisons, and I want to present it as their inference, not a settled fact.

What the study is and is not also matters. It is a matched observational sample, built from existing interview recordings gathered at different places and dates on different equipment, not a controlled experiment. The authors are explicit about one important limit: the white speakers' recordings came from California, while the Black speakers' came from the eastern United States, so regional and ethnic differences in speech cannot be cleanly separated. They point to future work with speakers from the same region as the way to untangle that. It is also a measurement of five specific systems at one point before its 2020 publication. It does not rank every accent, every name, or every current system, and it should not be read as a claim that nothing has changed since. Systems move, and training data changes. The honest use of this paper is not to assume the gap is still exactly this wide. It is to recognize that the gap was real and large in this sample, and that the authors pointed at a plausible mechanism.

The practical implication is the one worth carrying forward. The study is a demonstration that you cannot trust a speech system to perform uniformly across the people who will use it. The way to know whether your own system has the same problem is to evaluate it on the populations it will actually serve, not to assume the vendor's headline accuracy applies to everyone. The paper ends by urging exactly that: measure, on diverse speech, and report it.

That is the durable lesson. The specific numbers are from one careful study of one sample at one time. The need to evaluate on your own users, rather than trust a single accuracy number, is the part that has not aged.
