---
title: Interim Speech Results Can Revise Words Already Shown
description: Streaming captions need a committed transcript and a replaceable interim suffix. Learn what isFinal, stability, and confidence each say about a result.
pubDate: "2026-10-08T11:30:00Z"
section: dev
tags:
  - speech-recognition
  - streaming
  - voice-interfaces
draft: false
heroImage: https://media.aitamer.news/heroes/interim-speech-results-can-revise-words-already-shown-edeaff4c.jpg
heroAlt: Four blue paper tiles are stitched down while two loose rust tiles form a replaceable tail.
author: ari
wildness:
  rating: 1
  verified: Streaming responses distinguish interim and final results; stability concerns partial-result change.
  claimed: The UI state model is design guidance; no latency or accuracy measurement is claimed.
verdict: Commit text on isFinal, replace the provisional suffix as it changes, and keep stability separate from confidence.
sources:
  - title: "Google Cloud Speech-to-Text V1: streaming responses"
    url: https://cloud.google.com/speech-to-text/docs/speech-to-text-requests#streaming_responses
---

Imagine a voice interface displaying a partial phrase while someone is still speaking. The next recognition response changes a word near the end of that phrase. If the interface appended both versions, the transcript would show a repetition the speaker never said. The temporary line has to be replaceable.

In Google Cloud Speech-to-Text V1, streaming recognition sends audio and receives responses over a bidirectional stream. Its [streaming response documentation](https://cloud.google.com/speech-to-text/docs/speech-to-text-requests#streaming_responses) says `interim_results` is an optional request setting, off by default. With it enabled, result entries can carry provisional text marked `isFinal=false`; a final entry marks the recognizer's last, best result for that section of audio. A stream can contain multiple final entries for successive sections. A final result is guaranteed only after the client closes its write side of the stream.

A useful display model has two parts: committed segments and an interim suffix. Keep committed segments in their received order. When a response supplies a revised interim hypothesis for the unfinished section, replace its displayed suffix instead of appending another copy. When that section arrives with `isFinal=true`, add its final text to the committed sequence and remove the superseded interim text. A response can contain several result entries, so handle each entry rather than treating one network message as one sentence. A marker-only response should not erase text by accident.

`stability` rates the volatility of a partial result, on a scale from zero to one in this API. It is absent for final results. A high stability value can help decide how prominently to show provisional captions, but it does not make them final. `confidence` addresses a different question: the estimated correctness of a transcription. The documentation says it is typically supplied only for the top hypothesis on final results and is not guaranteed to be present or accurate. Treating either value as a commit flag confuses presentation with transcript state.

That distinction matters when recognized words drive an AI assistant or a voice command. Show provisional text for responsiveness, but wait for `isFinal` before storing a durable transcript. A final result is still a recognition hypothesis, so an irreversible command can also warrant user confirmation. If the product needs earlier action, label the interpretation tentative. The cost of waiting is latency; the benefit is that a revised interim phrase does not silently become a permanent user instruction.
