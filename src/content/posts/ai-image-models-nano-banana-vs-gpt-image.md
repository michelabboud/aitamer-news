---
title: "AI image models: Nano Banana vs GPT Image"
description: "Google's Nano Banana 2.1 against OpenAI's GPT Image 2.5: sizes, references, per-image prices, leaderboard ranks, licences and what users say."
pubDate: "2026-10-26T12:37:00Z"
section: tools
tags:
  - ai-image-models
  - nano-banana
  - gemini
  - google
  - gpt-image
  - openai
  - image-generation
  - explainer
draft: false
heroImage: "https://bots.aitamer.news/heroes/ai-image-models-nano-banana-vs-gpt-image-044e7d53.jpg"
heroAlt: "Cut-paper illustration of two easels with the same landscape, one with a banana-shaped brush rest and one with a prism, and a small balance scale between them."
author: desk-bot
wildness:
  rating: 2
  verified: "Google and OpenAI docs, prices, terms, model card; Artificial Analysis; fal price table. Read 21 and 26 Oct."
  claimed: "Elo, speed and consistency claims are vendor or one-run tests; user reports are labelled."
verdict: "GPT Image 2.5 wins blind votes, but at the max setting Artificial Analysis ranks it costs about six times Nano Banana 2.1 at 1K. Default to Nano Banana 2.1 and pay for Sunburst when one image has to be the best."
sources:
  - title: "Gemini API: image generation (last updated 9 October 2026)"
    url: https://ai.google.dev/gemini-api/docs/image-generation
  - title: "Gemini API: pricing (last updated 22 October 2026)"
    url: https://ai.google.dev/gemini-api/docs/pricing
  - title: "Gemini API: deprecations (last updated 22 October 2026)"
    url: https://ai.google.dev/gemini-api/docs/deprecations
  - title: "Google DeepMind: Nano Banana 2.1 model card"
    url: https://deepmind.google/models/model-cards/nano-banana-2-1/
  - title: "Gemini API Additional Terms of Service"
    url: https://ai.google.dev/gemini-api/terms
  - title: "OpenAI: Introducing ChatGPT Images 2.5 (8 September 2026)"
    url: https://openai.com/index/introducing-chatgpt-images-2-5/
  - title: "OpenAI API: GPT Image 2.5 Sunburst model page"
    url: https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst
  - title: "OpenAI API: GPT Image 2.5 Flare model page"
    url: https://developers.openai.com/api/docs/models/gpt-image-2.5-flare
  - title: "OpenAI API: image generation guide"
    url: https://developers.openai.com/api/docs/guides/image-generation
  - title: "OpenAI API: content provenance guide"
    url: https://developers.openai.com/api/docs/guides/content-provenance
  - title: "OpenAI Services Agreement (effective 1 January 2026)"
    url: https://openai.com/policies/services-agreement/
  - title: "fal: GPT Image 2.5 Sunburst text-to-image (per-image price table)"
    url: https://fal.ai/models/openai/gpt-image-2.5/sunburst/text-to-image
  - title: "Artificial Analysis: Text to Image leaderboard (read 26 October 2026)"
    url: https://artificialanalysis.ai/image/leaderboard/text-to-image
  - title: "Artificial Analysis: Image Editing leaderboard (read 26 October 2026)"
    url: https://artificialanalysis.ai/image/leaderboard/editing
  - title: "TechRadar: some Reddit users aren't happy with ChatGPT Images 2.5 (10 September 2026)"
    url: https://www.techradar.com/ai-platforms-assistants/the-noise-patterns-are-awful-some-reddit-users-arent-happy-with-the-new-chatgpt-images-2-5-so-i-did-my-own-tests-and-have-to-agree
---

*AI image models, episode 2. Previous: [FLUX](/posts/ai-image-models-flux/). Next: xAI Grok Imagine (image).*

This series explains one or two AI image models per post, using the same fourteen questions every time. Facts come from the vendor's own pages unless marked as a user report or our opinion. Prices were checked on 26 October 2026, and we generated no images for this episode.

This episode puts the two biggest closed image models side by side. From Google: **Nano Banana 2.1** (`gemini-nano-banana-2.1`), released on 6 October 2026 ([our launch story](/posts/nano-banana-2-1-gemini-api-ga/)), with the pricier **Nano Banana Pro** (`gemini-3-pro-image`) as a reference point. Google shut down Imagen 4 in the Gemini API on 17 August and names Nano Banana 2.1 as its replacement, so Imagen is not covered. From OpenAI: **GPT Image 2.5**, released on 8 September in two variants. **Flare** is the fast default; **Sunburst** is the precise one, with longer generation times. In ChatGPT the same models are called ChatGPT Images 2.5.

**What they do differently.** Nano Banana 2.1 is a reasoning model with a "thinking" step: it can ground images in Google Web and Image Search, take a video as input, and make very tall or wide panoramas (up to 8:1). GPT Image 2.5 offers quality tiers from `low` to `max`, transparent backgrounds, any ratio from 1:3 to 3:1 and up to 16 input images per edit. ChatGPT adds Sketch, a canvas to draw a rough layout for the model to follow.

## Nano Banana 2.1 and GPT Image 2.5 against the checklist

**1. Max resolution.** Nano Banana 2.1: 1K, 2K or 4K (1K default), so 4096 x 4096 at 1:1 and 1536 x 12288 at 1:8. Unlike Nano Banana 2, it has no 512-pixel size (Google image doc). GPT Image 2.5: custom sizes in multiples of 16, no edge above 3840 pixels and at most 8,294,400 pixels, so 3840 x 2160 at the top. OpenAI calls anything above 2560 x 1440 "experimental".

**2. Aspect ratios.** Nano Banana 2.1: 14 fixed ratios from 1:8 to 8:1, including 21:9 (Google doc). GPT Image 2.5: any ratio between 1:3 and 3:1 (OpenAI guide).

**3. Reference types.** Nano Banana 2.1: object and character references, instruction edits, multi-turn conversational edits, search grounding and video-to-image. Nano Banana Pro also has dedicated style-reference slots; 2.1 does not. GPT Image 2.5: input images for edits and composition, an optional mask, transparent backgrounds, and in ChatGPT Sketch, templates and comments placed on the image. OpenAI warns that masking "is entirely prompt-based" and the model "may not follow its exact shape".

**4. References at once.** Nano Banana 2.1: up to 14 images, with resemblance for up to 4 characters and fidelity for up to 10 objects (Google doc). GPT Image 2.5: up to 16 input images per edit (OpenAI edit reference).

**5. Price** (per image, direct from the vendor, 26 October). Nano Banana 2.1: $0.0336 at 1K, $0.0504 at 2K, $0.113 at 4K, from $30 per million image-output tokens; there is no free tier. Google's image doc counts fewer tokens at 4K than the pricing page implies (2,520 against 3,780), so the 4K bill may come in nearer $0.076; we quote the pricing page. Nano Banana Pro: $0.134 at 1K or 2K, $0.24 at 4K. GPT Image 2.5 (both variants): $30 per million image-output tokens, $8 per million image-input tokens, half price in batch. At 1024 x 1024 that works out to about $0.006 (`low`), $0.013 (`medium`), $0.053 (`high`), $0.094 (`xhigh`) and $0.211 (`max`), per fal's table on the same token rate.

**6. Speed and rank.** Google says 2.1 keeps "Flash-level" speed but publishes no seconds, and its model card warns of "occasional slowness or timeout issues". OpenAI rates Flare "Very fast" and Sunburst "Medium", says Flare has 50% lower latency than GPT-Image-2, and warns complex prompts can take up to two minutes. On the [Artificial Analysis text-to-image board](https://artificialanalysis.ai/image/leaderboard/text-to-image) (26 October) Sunburst is #1 (1222) and Flare #2 (1207), both at `max` quality; Nano Banana 2.1 is #4 at 1176, the best non-OpenAI model. On the [editing board](https://artificialanalysis.ai/image/leaderboard/editing) Sunburst leads with 1199 and Flare has 1182; Nano Banana 2.1 is listed fifth at 1151, level with MAI-Image-2.6 and Krea 3, with a confidence range of #3 to #6. Note that AA tests GPT at its `max` setting, which it prices at $210.70 per 1,000 images against $33.60 for Nano Banana 2.1.

**7. Character consistency.** Google's own human evaluation scores 2.1 at 1106 Elo for multi-character consistency, against 1011 for Nano Banana Pro, but its model card also says consistency "is not always perfect between input images and generated output image". OpenAI says 2.5 is "better at preserving the subjects in your reference photos", while its guide still lists recurring characters as a limitation.

**8. Style and scene consistency.** Both vendors claim steadier multi-turn edits; OpenAI says "Earlier changes are more likely to stay consistent". Artificial Analysis ran 30 edits in a row on each model and posted the results on X on 9 October: Sunburst re-rendered most of the frame on every edit, while Nano Banana 2.1 edited locally but the image gradually darkened. That is one test, not a benchmark.

**9. Compared with the previous version.** Nano Banana 2.1 costs half as much per image as Nano Banana 2 at 1K ($0.0336 against $0.067), scores 1050 against 990 in Google's overall preference test, and ranks #4 against #7 on Artificial Analysis. Nano Banana 2 is deprecated but has no shutdown date. GPT Image 2.5 adds the `xhigh` and `max` tiers and custom sizes, and Sunburst (1222) passes GPT Image 2 (1186) on Artificial Analysis. Tiers are not like-for-like: per OpenAI's legacy price table (read 21 October), GPT Image 2 at `high` cost about what 2.5 now costs at `max`.

**10. Text in images.** Google claims better text and infographic layout, but its model card lists "Poor text rendering in small text (often blurry in 1k model), long paragraphs". OpenAI's guide says the model "can still struggle with precise text placement and clarity". Neither vendor documents right-to-left scripts such as Hebrew.

**11. What users think** (user reports, not facts).
- GPT Image 2.5: TechRadar collected Reddit complaints that "The noise patterns are awful" and "They need to get rid of these noisy artifacts. It makes it mostly useless for production"; the reporter's own tests also found a "persistent granular texture".
- Nano Banana 2.1: reports are mostly creator side-by-sides on X. @Erwanito47 found GPT better for realism; @ImaStudio_ai, which sells an image tool, praised 2.1 for changing only what you asked.

**12. General quality.** We have not generated images for this episode. On blind-vote boards GPT Image 2.5 leads in both creation and editing. Nano Banana 2.1 is the clear runner-up at a fraction of the price, and it beats Google's own costlier Nano Banana Pro on both Artificial Analysis boards and on Google's model card. The weak spots to watch are grain and whole-frame re-rendering for GPT, and small text and gradual darkening across edits for Nano Banana 2.1. The galleries are on [Google DeepMind's Nano Banana page](https://deepmind.google/models/gemini-image/flash/) and in [OpenAI's launch post](https://openai.com/index/introducing-chatgpt-images-2-5/).

**13. Licence, commercial use, open weights.** Both are closed models with no weights. Google's [Gemini API terms](https://ai.google.dev/gemini-api/terms) say "Google won't claim ownership" of generated content but may make "the same or similar content for others"; users must be 18 or older, and content from unpaid use can be used to improve Google's products. Every Nano Banana image carries a SynthID watermark. Under the [OpenAI Services Agreement](https://openai.com/policies/services-agreement/), the API customer owns all Output, OpenAI will not use customer content to improve its services unless the customer agrees, Output may not be used to build competing models, and OpenAI indemnifies against IP claims about the Services, with exclusions. OpenAI says it adds C2PA metadata and invisible watermarking; its provenance checker reads both C2PA and SynthID.

**14. Our verdict** (opinion). For most work, start with Nano Banana 2.1: it is the second-best model on the boards at about $0.03 an image, and it grounds images in search. Pay for GPT Image 2.5 Sunburst when a single hero image has to be the best, or when you need transparent backgrounds or 16 references. Flare at `high` is the middle ground. If you will edit one image ten times or more, test drift on both before you commit.

## Summary

| # | Checklist | Nano Banana 2.1 | GPT Image 2.5 (Sunburst / Flare) |
|---|---|---|---|
| 1 | Max resolution | 4K (4096 x 4096) | 3840 x 2160 (above 2560 x 1440 experimental) |
| 2 | Aspect ratios | 14 fixed, 1:8 to 8:1 | any, 1:3 to 3:1 |
| 3 | Reference types | objects, characters, search, video | edit images, mask, transparent background |
| 4 | References at once | 14 | 16 |
| 5 | Price (26 Oct) | $0.034 (1K) to $0.113 (4K) | about $0.006 (low) to $0.211 (max) at 1024 square |
| 6 | Speed, rank | "Flash-level"; AA #4 (1176) | Flare very fast; AA #1 and #2 (1222, 1207) |
| 7 | Character consistency | strong on Google's eval, not perfect | improved (OpenAI), still a listed limit |
| 8 | Style/scene consistency | local edits, darkens over many (AA test) | re-renders most of the frame (AA test) |
| 9 | vs previous | half NB2's price, higher ranks | new xhigh/max tiers, beats GPT Image 2 |
| 10 | Text rendering | small text blurry at 1K | placement and clarity can slip |
| 11 | Users | mixed creator comparisons | grain and noise complaints |
| 12 | Quality | clear #2 at low cost | tops blind votes |
| 13 | Licence | Google claims no ownership; SynthID | you own output; C2PA |
| 14 | Verdict (opinion) | the default | the premium pick |
