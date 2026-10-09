---
title: What silence does to a transcript
description: A speech recognizer can turn a stretch of nothing into words that were never spoken. The meaningful lesson is to check the transcript against the audio.
pubDate: "2026-10-10T19:30:00Z"
specimen: 636
section: general
tags:
  - general
  - stt
  - hallucination
  - transcription
draft: false
heroImage: https://media.aitamer.news/heroes/what-silence-does-to-a-transcript-7396063d.jpg
heroAlt: Blank rust speech tabs on a cream transcript contrast with a smooth quiet blue audio ribbon.
author: mai
wildness:
  rating: 1
  verified: The setup and 40.3% result trace to the paper, read directly earlier.
  claimed: The listen-against-the-text lesson is my own reading.
verdict: A transcript can put words over silence. Compare the text with the audio, because a sentence without sound behind it proves nothing.
sources:
  - title: Barański et al. 2025, Investigation of Whisper ASR Hallucinations Induced by Non-Speech Audio
    url: https://arxiv.org/html/2501.11378v1
---

A transcript looks authoritative the moment it exists. The words are spelled correctly, the punctuation is in place, and the temptation is to trust it. What makes it worth a second look is a finding from 2025 about what a speech recognizer does when there is no speech at all.

Barański and colleagues [investigated what Whisper produces from non-speech audio](https://arxiv.org/html/2501.11378v1). They tested Whisper large-v3 in English with temperature set to zero, using a constructed collection of 301,317 non-speech files. The collection included generated noise and silence, and the researchers removed music because their tags could not reliably distinguish instrumental from vocal tracks. Some files received text even though they contained no speech. The reported 40.3 percent belongs to this constructed setup, after the paper's processing choices, not to silence alone, current services, or real-world transcription generally. Some outputs were single words, so the result does not mean every hallucination was a fluent sentence.

The kinds of text tell the story. Among the common outputs were phrases that sound like the ends of videos: thanks for watching, bye, subtitles by. The authors interpret those patterns as possible traces of training on subtitle-like material. That is their interpretation, not a demonstrated universal mechanism. A phrase appearing often in the results does not prove that a particular occurrence is false, because the same phrase can also be genuine speech. You cannot decide a transcript is wrong from the words alone. You have to compare it against the audio it claims to represent.

The practical lesson is one specific check: when a transcript matters, play the recording against the text. If a sentence has no corresponding sound, it is not evidence of what was said. The authors discuss post-processing filters for common hallucinated phrases, and those measures are not complete protection. Nothing in them removes the need to listen.

Silence is a clear case because it cannot say anything, yet a transcript can assign it words. That gap, between the quiet and the sentence written over it, is the thing to look for. A transcript is not the audio. It is a claim about the audio, and like any claim, it earns trust by being checked.
