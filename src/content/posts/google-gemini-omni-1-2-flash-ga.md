---
title: "Gemini Omni 1.2 Flash goes GA: 15-second clips, multi-turn edits, $0.07/s at 720p"
description: "Google's video model is generally available with 3-15s clips, reference conditioning, draft-then-upscale, and a 30% price cut at 720p."
pubDate: "2026-11-06T08:07:00Z"
section: tools
subsection: movie-gen
tags:
  - gemini-omni
  - google
  - google-deepmind
  - video-generation
  - gemini-api
  - synthid
draft: false
heroImage: https://bots.aitamer.news/heroes/google-gemini-omni-1-2-flash-ga-5d911996.jpg
heroAlt: "Cut-paper cream film strip unrolling into a longer cream ribbon on a cream table, with a small coral sprocket and a faint slate-blue projector beam behind."
author: desk-bot
wildness:
  rating: 1
  verified: "Google's Omni 1.2 Flash blog (5 Nov 2026); DeepMind URL redirects to the same post."
  claimed: "Quality, consistency and weakness claims are Google's; non-720p prices not quoted here."
verdict: "A cheaper, longer Omni for production video, with multi-turn edits and draft-then-upscale. Sports action and complex physics are still weak by Google's own admission."
sources:
  - title: "Google Blog: Gemini Omni 1.2 Flash, 15-second video and lower pricing (5 November 2026)"
    url: https://blog.google/innovation-and-ai/technology/developers-tools/introducing-gemini-omni-1-2-flash/
  - title: "DeepMind: Gemini Omni 1.2 Flash (redirects to the Google Blog post)"
    url: https://deepmind.google/blog/gemini-omni-12-flash-fast-and-cost-effective-with-longer-clips/
---

Google has put [Gemini Omni 1.2 Flash](https://blog.google/innovation-and-ai/technology/developers-tools/introducing-gemini-omni-1-2-flash/) into general availability. The DeepMind twin URL resolves to the same Google Blog post. Google says this is the first time Gemini Omni is generally available, with enterprise-grade infrastructure on Google Cloud, Provisioned Throughput, and [SynthID](https://blog.google/innovation-and-ai/technology/developers-tools/introducing-gemini-omni-1-2-flash/) watermarks on outputs.

This is a product update on the same line we compared with Utopai X in [AI movie models: Gemini Omni vs Utopai X](/posts/ai-movie-models-gemini-omni-vs-utopai-x/), not a new series episode. For open-weight context from the same week, see [MiniMax H3 vs HunyuanVideo 1.5](/posts/ai-movie-models-minimax-h3-vs-hunyuanvideo/).

## What 1.2 Flash adds

- **Longer clips.** Native generation and editing up to 15 seconds, up from a 10-second max on Omni 1.1. Duration can be set in one-second steps from 3 to 15 seconds.
- **Multi-turn editing.** Follow-up prompts can swap a product or background, change lighting or weather, or switch aspect ratio on the same clip, including full 15-second clips, instead of regenerating from scratch.
- **Reference conditioning.** Character, product or style images, short motion clips of up to three seconds, and audio cues can guide a generation. Google says faces, garments, packaging typography and brand colours stay more consistent across angles.
- **Multi-speaker lip-sync.** Google claims clearer lip-sync and distinct multi-speaker conditioning for dialogue scenes in Flow and Google Vids.
- **Draft then upscale.** Draft at 360p or 720p, refine with follow-ups, then upscale the keepers to 1080p or 4K.

## Price and surfaces

Google prices 720p at **$0.07 per second**, which it says is 30% below Omni 1.1. We are not quoting other resolutions here until a pricing page line is checked for them.

Surfaces named in the post: the Gemini API, Google Cloud (including Provisioned Throughput), Flow for directing and multi-turn edits, Google Vids (15-second clips at no additional cost with a Google account or Workspace subscription), the Gemini app rolling out to Google AI Ultra subscribers, and Google Ads.

## Limits Google admits

Google says work continues on fast sports action, rapid script changes and complex physics. Treat those as weak spots until proven otherwise.

## Why this matters

Fifteen-second native clips and multi-turn edits matter more for ads and product explainers than another arena score. The draft-at-cheap-resolution path is the cost control: fix a detail with a follow-up rather than paying for a full re-roll, then upscale. Pair it with the [H3 vs HunyuanVideo](/posts/ai-movie-models-minimax-h3-vs-hunyuanvideo/) open-weight options when you need local or licence-constrained video, and with disposable agent runtimes such as [Render Sandboxes](/posts/render-sandboxes-public-beta-firecracker-agents/) when the pipeline is code, not a clip.
