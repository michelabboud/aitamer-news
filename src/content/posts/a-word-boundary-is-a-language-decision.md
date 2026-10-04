---
title: A Word Boundary Is a Language Decision
description: Space-based splitting can put transcript highlights around the wrong text. Intl.Segmenter offers locale-sensitive word boundaries and text offsets.
pubDate: "2026-10-05T02:00:00Z"
specimen: 246
section: dev
tags:
  - javascript
  - internationalization
  - transcripts
  - accessibility
draft: false
heroImage: https://media.aitamer.news/heroes/a-word-boundary-is-a-language-decision-fac3e807.jpg
heroAlt: Two satellites illuminate different divisions in paper word strips above a globe.
author: ari
wildness:
  rating: 2
  verified: MDN documents locale-sensitive word segments, offsets, and isWordLike.
  claimed: Those segments can guide transcript highlights when aligned with timing data.
verdict: Use locale-sensitive segments for display boundaries, then align them with the transcript's timed tokens.
sources:
  - title: Intl.Segmenter - JavaScript | MDN
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter
  - title: Intl.Segmenter() constructor - JavaScript | MDN
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter/Segmenter
  - title: Intl.Segmenter.prototype.segment() - JavaScript | MDN
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter/segment
---

A transcript player needs to know which span of text to highlight as speech plays. Calling `split(" ")` makes an early decision: a word is whatever sits between spaces. [MDN's `Intl.Segmenter` reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) shows why that rule fails for languages including Japanese, Chinese, and Thai, where words are not necessarily separated by whitespace.

## Where spaces fail

MDN uses a Japanese sentence to make the problem visible. Splitting it on spaces returns the whole string as one item. A player using that result has no useful word spans to highlight. Adding more punctuation rules to the same split still leaves the application responsible for deciding where each language places a boundary. [The reference example](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) instead creates a Japanese word segmenter and receives separate segments.

## What the segmenter gives you

Create an `Intl.Segmenter` with the text's locale and `{ granularity: "word" }`, then iterate over `segmenter.segment(text)`. The [constructor documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter/Segmenter) says the locale guides word boundaries. If you omit the granularity, the default is grapheme boundaries, which serve a different purpose.

Each result includes its text and its starting `index`. The [segment method's example](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter/segment) uses `index + segment.length` for the ending offset. It also shows `isWordLike`: spaces and punctuation remain in the sequence, while that flag identifies the segments to consider as words. Keeping every segment lets a renderer preserve the original spacing and punctuation while highlighting selected spans.

## Boundaries and timing are separate

`Intl.Segmenter` describes positions in a string. Its documented segment records contain no timestamps. A timed transcript therefore needs an alignment step between its time data and the displayed segments. Treat a matching word count as a check to investigate, rather than proof of alignment. Keep the original text and offsets so a mismatch can be inspected without rebuilding the line from split words. [MDN's segment example](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter/segment) shows the offsets available for that work.

## What to do

1. Choose a locale for each transcript passage and create a word segmenter for it.
2. Render from the original string, using segment offsets to identify highlight spans. Use `isWordLike` when selecting words.
3. Compare those spans with the transcript's timed tokens before linking a highlight to playback. Check passages without spaces as well as ones with them.
