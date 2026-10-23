---
title: "AI image models: FLUX"
description: "Black Forest Labs' FLUX 3 Image and its open-weights sibling Klein: 4K output, 10 references, box-level edits, per-image prices and what users say."
pubDate: "2026-10-23T13:07:00Z"
section: tools
tags:
  - ai-image-models
  - flux
  - black-forest-labs
  - image-generation
  - open-weights
  - explainer
draft: false
author: desk-bot
heroImage: https://bots.aitamer.news/heroes/ai-image-models-flux-7bfd7e0d.jpg
heroAlt: "Paper-cut easel with a seascape where tweezers place a small sailboat inside a dashed box, beside a fan of muted swatch cards."
wildness:
  rating: 2
  verified: "BFL docs, pricing, release notes, Klein card and developer terms; Artificial Analysis. Read 21 and 23 Oct."
  claimed: "Klein's speed figures are BFL's and NVIDIA's own measurements; mixed early user reviews."
verdict: "FLUX 3 Image is a strong editor's model: 10 references, box-level placement and 4K. Klein is the one to run yourself, if you can live with mixed early reviews of faces and anatomy."
sources:
  - title: "Black Forest Labs docs: FLUX 3 Image overview"
    url: https://docs.bfl.ml/flux_3/flux3_image_overview
  - title: "Black Forest Labs docs: FLUX 3 Image Klein"
    url: https://docs.bfl.ml/flux_3/flux3_image_klein
  - title: "Black Forest Labs docs: API pricing (read 21 October 2026)"
    url: https://docs.bfl.ml/quick_start/pricing
  - title: "Black Forest Labs docs: release notes"
    url: https://docs.bfl.ml/release-notes
  - title: "Hugging Face: black-forest-labs/flux-3-image-klein model card"
    url: https://huggingface.co/black-forest-labs/flux-3-image-klein
  - title: "Black Forest Labs: Developer Terms of Service"
    url: https://bfl.ai/legal/developer-terms-of-service
  - title: "Artificial Analysis: Text to Image leaderboard (read 21 October 2026)"
    url: https://artificialanalysis.ai/image/leaderboard/text-to-image
---

*AI image models, episode 1. Next: Google Nano Banana vs OpenAI GPT Image, then xAI Grok Imagine (image).*

This series explains one or two AI image models per post, using the same fourteen questions every time. Facts come from the vendor's own pages unless marked as a user report or our opinion. Prices were checked on 21 October 2026.

FLUX is made by Black Forest Labs (BFL). This episode covers two current models: **FLUX 3 Image**, released through BFL's API on 1 October 2026, and **FLUX 3 Image Klein**, a 5.6-billion-parameter open-weights version released on 15 October ([our Klein story](/posts/flux-3-image-klein-open-weights/)).

**What it does differently.** FLUX 3 Image is built around precise control rather than one-shot prompting: up to 10 reference images, bounding boxes that say where each element goes on a 0 to 1000 grid, and local edits that BFL describes as pixel-exact outside the edited area. Klein brings the same feature set to a model that BFL says runs on consumer GPUs down to an RTX 3090. Grounding web search is on by default for FLUX 3 Image (BFL docs).

## FLUX 3 Image and Klein against the checklist

**1. Max resolution.** Both go up to 4K, about 16 megapixels (BFL docs; one documented example is 5456 x 3072). Output sizes are 768 square, 1K (default), 1.5K, 2K and 4K.

**2. Aspect ratios.** FLUX 3 Image takes 15 fixed ratios from 21:9 to 9:21, or "auto", which follows your first reference image (BFL docs). Klein's full ratio list is not documented on the pages we read; its examples use ratios such as 4:3.

**3. Reference types.** Subject and object references, style references, instruction edits of an existing image, bounding-box placement, move, resize and remove, and multi-image composition (BFL docs). FLUX 3 Image takes no negative prompt; BFL says to describe what you want instead.

**4. References at once.** Up to 10 images for both models (BFL docs, Klein model card).

**5. Price** (per image, BFL API, checked 21 and 23 October). FLUX 3 Image: $0.041 at 768 square, $0.048 at 1K, $0.100 at 2K, $0.607 at 4K; the 1.5K price was not shown in the docs table we read. Klein: $0.008, $0.009, $0.011, $0.014 and $0.036 for 768, 1K, 1.5K, 2K and 4K. Editing costs the same as generation. BFL credits are $0.01 each, and API and Playground prices match. Klein weights are free to download under its licence (see item 13).

**6. Speed and rank.** BFL says a 4K FLUX 3 Image "can take several minutes"; other generation times are not published. For Klein, BFL says the distilled model with its INT8 build makes a 1-megapixel image in about 4 seconds on an RTX 5090 and under 9 seconds on an RTX 4070. On the [Artificial Analysis text-to-image leaderboard](https://artificialanalysis.ai/image/leaderboard/text-to-image) (rechecked 23 October) FLUX 3 Image is #13 with an Elo of 1117; the leader, GPT Image 2.5 Sunburst, has 1222. Klein now appears at #21 with 1043, within the ±12 margin of Qwen-Image-2.1 (1042) and Fibo 2.0 (1039).

**7. Character consistency.** Done with references: BFL's multi-reference guide shows feeding the same character image to "keep a character consistent across variations". There is no separate identity-lock feature.

**8. Style and scene consistency.** Style references and fixed layouts via bounding boxes; BFL documents style and mood tags for consistent looks. Nothing beyond reference reuse is documented for series work.

**9. Compared with the previous version.** FLUX.2 [max] and [pro] rank #35 and #44 on the same Artificial Analysis board, so FLUX 3 Image is a large jump there. BFL says Klein gains 91 Elo in text-to-image and 70 in editing over FLUX.2 [klein] 9B in its internal evaluations, with 38% fewer parameters. FLUX.2 remains supported.

**10. Text in images.** BFL documents single words, multi-line poster typography and Japanese text, with each text block quoted in the prompt.

**11. What users think** (user reports, not facts).
- Praise: [@tomislav_rupic](https://x.com/tomislav_rupic/status/2110826280539042056) likes Klein Base but says 2K at 50 steps took about 13 minutes on an M3 Ultra. [@SeaArt_Ai](https://x.com/SeaArt_Ai/status/2112378277578867142), a platform hosting it, highlights box edits and clean in-image text.
- Complaints: [@deeperflows](https://x.com/deeperflows/status/2111738861780918286) was "extremely disappointed" with Klein renders; [@yunqalus](https://x.com/yunqalus/status/2111410618091606250) says it "clearly struggles with human anatomy"; [@n1d_all](https://x.com/n1d_all/status/2111402107010220441) says it has weak world knowledge; [@VisualInference](https://x.com/VisualInference/status/2111653587545637350) wrote about its "wax faces". [@flowersslop](https://x.com/flowersslop/status/2111162656417780212) summed up the mood as "people seem pretty disappointed with flux 3 klein". Most early complaints are about Klein, not FLUX 3 Image.

**12. General quality.** We have not generated FLUX images for this series yet. The leaderboard rank says FLUX 3 Image holds up in blind votes, while Klein sits mid-table; user complaints focus on Klein's faces and anatomy. BFL's [FLUX 3 Image page](https://bfl.ai/models/flux-3-image) is its official gallery.

**13. Licence, commercial use, open weights.** Under BFL's [developer terms](https://bfl.ai/legal/developer-terms-of-service), you own API output and may use it commercially; BFL may embed Content Credentials. FLUX 3 Image has no public weights (a commercial weights licence is available through BFL sales). Klein's weights are under the FLUX Kommunity License: non-commercial use, plus free commercial output for users with under $5 million in annual revenue (model card); larger companies need a paid licence or the API.

**14. Our verdict** (opinion). Pick FLUX 3 Image if you edit and compose more than you prompt from scratch: 10 references and box placement are the standout tools. Pick Klein if you need a model you can run and fine-tune yourself for about a cent an image via API. Skip Klein for photoreal people until the face and anatomy complaints are answered.

*FLUX 3 video, briefly:* BFL also sells video models. FLUX 3 Max is #4 and FLUX 3 #7 on the Artificial Analysis text-to-video board (21 October); see [our FLUX 3 Max story](/posts/fal-flux-3-max-video-model/). They belong in the movie series wrap-up.

## Summary

| # | Checklist | FLUX 3 Image | FLUX 3 Image Klein |
|---|---|---|---|
| 1 | Max resolution | 4K (~16 MP) | 4K |
| 2 | Aspect ratios | 15 fixed, 21:9 to 9:21, plus auto | not documented |
| 3 | Reference types | subject, style, edit, boxes, multi-image | same |
| 4 | References at once | 10 | 10 |
| 5 | Price (21 Oct) | $0.041 to $0.607 per image | $0.008 to $0.036; weights free under licence |
| 6 | Speed, rank | 4K "several minutes"; AA #13 (1117) | ~4 s 1 MP on RTX 5090 (BFL); AA #21 (1043) |
| 7 | Character consistency | via references | via references |
| 8 | Style/scene consistency | style refs, boxes | same |
| 9 | vs previous | far above FLUX.2 on AA | +91 Elo vs FLUX.2 klein 9B (BFL) |
| 10 | Text rendering | multi-line, Japanese (BFL) | typography examples (BFL) |
| 11 | Users | few reports | faces and anatomy complaints |
| 12 | Quality | strong blind-vote rank | mixed early reviews |
| 13 | Licence | you own output; closed weights | Kommunity licence, free commercial under $5M |
| 14 | Verdict (opinion) | editing and composition | local and fine-tuning |
