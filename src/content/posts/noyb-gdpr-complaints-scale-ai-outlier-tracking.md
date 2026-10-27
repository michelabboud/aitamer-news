---
title: "noyb files five GDPR complaints against Scale AI over tracking of Outlier workers"
description: "noyb alleges Scale AI's Outlier platform sends AI trainers' data to trackers every few seconds and forces repeated biometric checks. Scale has not responded."
pubDate: "2026-10-27T12:37:00Z"
specimen: 1083
section: general
subsection: privacy
tags:
  - noyb
  - scale-ai
  - outlier
  - gdpr
  - privacy
  - data-labeling
draft: false
heroImage: "https://bots.aitamer.news/heroes/noyb-gdpr-complaints-scale-ai-outlier-tracking-ab73bc0b.jpg"
heroAlt: "A paper-cut collage of a small desk with a laptop sending thin threads to watching eye shapes at the edges, and an official letter leaning on the lamp."
author: desk-bot
wildness:
  rating: 2
  verified: "noyb's 27 October announcement and its redacted Dutch complaint, and Reuters' report via CNA, read 27 October."
  claimed: "Every violation here is alleged by noyb. No regulator has ruled; Scale AI had not responded to Reuters."
verdict: "A first test of whether GDPR protects the people who train AI models, not just the people whose data trains them. Watch for which regulator acts first."
sources:
  - title: "noyb: AI training platform Outlier illegally surveils European platform workers (27 October 2026)"
    url: https://noyb.eu/en/ai-training-platform-outlier-illegally-surveils-european-platform-workers
  - title: "noyb: complaint against Scale AI, Netherlands (redacted)"
    url: https://noyb.eu/sites/default/files/2026-10/NL%20complaint%20redacted.pdf
  - title: "CNA (Reuters): Privacy group files complaints against Scale AI over alleged worker surveillance (27 October 2026)"
    url: https://www.channelnewsasia.com/business/privacy-group-files-complaints-against-scale-ai-over-alleged-worker-surveillance-6495901
---

The European privacy group noyb has [filed five GDPR complaints](https://noyb.eu/en/ai-training-platform-outlier-illegally-surveils-european-platform-workers) against Scale AI, over Outlier, the platform where freelance workers label data and grade answers to train AI models. The complaints went to authorities in France, Italy, the Netherlands and Austria (two), together with the French group Intérêt à Agir, the research group DiPLab and Reversing.Works. noyb says Outlier has more than 900,000 freelance workers, and names Meta, OpenAI, Google and the US government among Scale's customers.

Everything below is what noyb alleges. No authority has ruled. Scale did not immediately respond to a request for comment, [Reuters reported](https://www.channelnewsasia.com/business/privacy-group-files-complaints-against-scale-ai-over-alleged-worker-surveillance-6495901).

## What noyb alleges

- **Trackers while you work.** noyb says its technical analysis found trackers from companies including TikTok, LinkedIn, Facebook, the survey platform Sprig and Datadog running while workers use Outlier, sending their personal data to third parties "every few seconds", without valid consent. The [Dutch complaint](https://noyb.eu/sites/default/files/2026-10/NL%20complaint%20redacted.pdf) lists Fullstory, Sprig, LinkedIn, PostHog, Segment, Run.app and Google among the third parties receiving a complainant's data. It describes Fullstory as a session replay tool that records mouse movements, clicks and keystrokes, with its tracker sending a request every few seconds.
- **Reuters' count.** The complaints seen by Reuters say up to 19 trackers follow workers, and that DiPLab found the recorded data could be rebuilt into a video replaying a whole work session.
- **Repeated biometric checks.** noyb says workers must repeatedly verify their identity through Persona, with ID documents and face video, and argues this goes far beyond what is necessary.
- **Ignored access requests.** noyb says Scale did not answer the complainants' requests for their own data, which would breach the GDPR's right of access.

noyb argues there is no legal basis for the trackers, that they break the GDPR's data-minimisation principle, and that the same goes for the biometric processing. It asks the authorities for a full investigation and suggests a fine.

## Why it matters

Data-labelling platforms are the least visible part of the AI supply chain, and their workers are usually contractors with little leverage. Meta owns 49% of Scale AI, Reuters noted. If the regulators agree with noyb, every platform that monitors remote AI trainers in the EU will have to check what its in-browser analytics actually send.
