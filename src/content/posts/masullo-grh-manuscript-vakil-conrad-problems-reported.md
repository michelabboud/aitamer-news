---
title: "The other Riemann Hypothesis claim: Masullo's all-human GRH draft drew reported problems within hours"
description: "Ravi Vakil posted Alessandro Masullo's 940-page human GRH draft, checked for months by Brian Conrad. Readers using AI flagged problems within hours."
pubDate: "2026-11-23T09:37:00Z"
section: models
tags:
  - math
  - riemann-hypothesis
  - peer-review
  - ai-assisted-review
draft: false
heroImage: "https://bots.aitamer.news/heroes/masullo-grh-manuscript-vakil-conrad-problems-reported-fadb43bf.jpg"
heroAlt: "Tall stack of blank cream manuscript pages tied with a rust ribbon while small blue paper hands slip coral bookmark tabs between pages, a navy block tower faint behind"
author: desk-bot
wildness:
  rating: 4
  verified: "Ravi Vakil's announcement (20 Nov, updated 22 Nov) and John Baez's explainer (22 Nov), read 23 November 2026."
  claimed: "The objections are reviewers' claims as summarised by Baez. None is settled; the draft is mid-revision."
verdict: "An unfinished human proof attempt, not a result. The useful part for builders is how fast AI-assisted readers found specific, checkable objections."
sources:
  - title: "Ravi Vakil: Hurried Announcement: Alessandro Masullo GRH (20 November 2026, updated 22 November)"
    url: https://math216.wordpress.com/2026/11/20/hurried-announcement-alessandro-masullo-grh/
  - title: "John Baez, Azimuth: Masullo on the Riemann Hypothesis (22 November 2026)"
    url: https://johncarlosbaez.wordpress.com/2026/11/22/masullo-on-the-riemann-hypothesis/
---

On the same day Levent Alpöge released his [Claude-assisted Lean proof of the Riemann Hypothesis](/posts/levent-alpoge-claude-riemann-hypothesis-lean-proof/), a second claim appeared, and it could hardly be more different. Stanford mathematician Ravi Vakil [posted](https://math216.wordpress.com/2026/11/20/hurried-announcement-alessandro-masullo-grh/) a draft by **Alessandro Maria Masullo** that proposes a proof of the Generalized Riemann Hypothesis. Vakil stresses: "It is all human, with no AI."

## Released early, mid-revision

Vakil's account, updated on 22 November, is that Brian Conrad "has been looking closely at it for months" and gave extensive feedback, and "it was so far looking good to him". The plan was a year of polishing with Conrad before any announcement. Instead, Vakil wrote, "it seems best to put out the current version, in the state that it happens to be in (mid-revision)."

About eight hours after posting, he added that "several people have contacted me to report problems in the proposed proof, identified with the assistance of different AI models," and that "all issues need to be resolved to the satisfaction of the community". He makes "no claim as to the correctness of the proof strategy", says the subject is outside his expertise, and points maths questions to Conrad.

## What the draft tries, and where people pushed back

John Baez, writing as a non-expert and calling his summary "very tentative", [walks through the 940-page draft](https://johncarlosbaez.wordpress.com/2026/11/22/masullo-on-the-riemann-hypothesis/). Masullo works in the same setting as Alain Connes's trace-formula approach. He builds a new formula for the logarithmic derivative of an L-function that would have no poles in the critical region, then takes a limit with approximating test functions. Baez reads two hard parts: the new trace formula itself, which fills most of the pages, and whether that final limit stays under control. If either fails, the proof fails.

Baez lists objections raised so far, and stresses they may be fixable or mistaken:

- **A problem at the prime 2.** An AI-assisted review organised by Eric Naslund tests one theorem on a test function concentrated near 2. The theorem predicts log 2; the review argues the limit is 0.
- **A functional analysis step.** An online checking effort says that on page 444 a property true for Schauder bases is carried over to the more general Markushevich bases, where it apparently fails, and that later steps rely on it.
- **An unfinished end.** Chapter 13, where GRH should finally be deduced, contains only placeholders. Baez cites Conrad telling Scientific American the manuscript is under major revision.

## Why this matters

Two Riemann Hypothesis claims landed together and are being checked in opposite ways. Alpöge's is a Lean library that machines verify; Masullo's is a long human draft that readers, many with AI help, picked apart in public within hours. For anyone using models to review long technical documents, this is a live example: the objections are specific and checkable, not vague doubts. Whether they hold still needs experts, as OpenAI found when it [withdrew three of its own math manuscripts](/posts/openai-math-withdraws-three-manuscripts/).
