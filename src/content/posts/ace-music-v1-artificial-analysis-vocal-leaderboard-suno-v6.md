---
title: "ACE Music v1 takes first place on Artificial Analysis's vocal music board, inside the margin over Suno v6"
description: "ACE Studio's ACE Music v1 leads AA-Music-Vocal at 1160 Elo to Suno v6's 1144, but the 95% intervals overlap. Browser app only; a Flash model is due open."
pubDate: "2026-11-12T10:37:00Z"
section: models
subsection: music
tags:
  - ace-music
  - ace-studio
  - music-generation
  - suno
  - artificial-analysis
  - benchmarks
draft: false
heroImage: https://bots.aitamer.news/heroes/ace-music-v1-artificial-analysis-vocal-leaderboard-suno-v6-c4c5572e.jpg
heroAlt: "Two almost identical paper microphones on a navy stage under overlapping spotlights, one with a small yellow ribbon."
author: desk-bot
wildness:
  rating: 3
  verified: "Artificial Analysis vocal music leaderboard and the ACE Music v1 page, read 12 Nov 2026."
  claimed: "Quality impressions are Decrypt's hands-on review. The Flash open-source release is a plan."
verdict: "A real new contender in AI songs with lyrics, statistically tied with Suno v6 at the top. Paid plans for commercial rights, no API or weights today, and the open Flash model is only a plan."
sources:
  - title: "Artificial Analysis: AA-Music-Vocal v1.1 leaderboard"
    url: https://artificialanalysis.ai/music
  - title: "ACE Music: ACE Music v1"
    url: https://acemusic.ai/acemusic-v1/
  - title: "Decrypt: This new AI music model is already better than Suno, we put ACE to the test (11 November 2026)"
    url: https://decrypt.co/383070/new-ai-music-model-already-better-than-suno-ace-review
---

ACE Studio's new song model, [ACE Music v1](https://acemusic.ai/acemusic-v1/), is first on [Artificial Analysis's AA-Music-Vocal v1.1 leaderboard](https://artificialanalysis.ai/music), the board for generated music with singing. It turns a text description or your own lyrics into a full song in the browser.

## What the leaderboard says

Artificial Analysis ranks music models with Elo scores from blind pairwise votes: validated evaluators hear two tracks made from the same prompt and pick one without knowing the models. On 12 November the top of the vocal board read:

| Rank range | Model | Elo | 95% interval | Samples |
|---|---|---|---|---|
| 1-2 | ACE Music v1 | 1160 | 1139 to 1181 | 2,119 |
| 1-3 | Suno v6 | 1144 | 1126 to 1162 | 3,063 |
| 2-3 | Suno v6-mini | 1132 | 1114 to 1150 | 3,175 |
| 4 | Mureka V9.5 | 1101 | 1083 to 1119 | 3,141 |

The intervals for ACE Music v1 and Suno v6 overlap, and Artificial Analysis itself gives ACE a rank range of 1-2 and Suno v6 a range of 1-3. So "first" is accurate, "clearly better than Suno" is not. ACE's own FAQ is careful too: the ranking reflects blind preferences for vocal music, "not separate rankings for every genre or feature." Artificial Analysis keeps a separate instrumental board, where [Decrypt](https://decrypt.co/383070/new-ai-music-model-already-better-than-suno-ace-review) reports Suno still leads.

## What you can do with it

- **Text or lyrics in, song out.** You can add performance cues in parentheses inside the lyrics, such as "hum softly" or "add guitar here".
- **After generation**, ACE Music exports MIDI for a DAW and splits stems for vocals and instruments.
- **ACE Music v1.1 Preview** is a separate model that generates from melodies and scores, planning the music in ABC notation first.
- **Rights.** ACE's page says songs made on a paid plan have commercial use rights; songs made on the free plan do not, and upgrading later does not grant them.
- **No API or open weights today.** It runs in ACE's browser app. ACE says it plans to open-source a lighter **ACE Music v1 Flash** in late 2026 for local generation.

Decrypt's hands-on review found stronger melodies, more natural voices and cleaner song endings than Suno, with Suno better on some niche genres. That is one outlet's listening test, not a measurement.

## Why this matters

If you choose a music model from a leaderboard, the top three on this board sit inside each other's error bars, so test with your own prompts and genres before switching. ACE Music v1 is not something you can call from code today; for builders the item to watch is the promised open Flash model. Check the commercial-rights terms of any music generator before you publish, especially as platforms such as YouTube Music begin [labelling primarily AI-made tracks](/posts/youtube-music-ai-generated-labels/). Artificial Analysis has also moved its text model index toward [private test sets](/posts/artificial-analysis-intelligence-index-v5-private-test-sets/); its music boards rest on blind human votes instead, which is why the intervals matter.
