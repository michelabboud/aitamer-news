---
title: "AI image models: Microsoft MAI-Image 2.6 (with the 2.7 editing preview)"
description: "Microsoft's MAI-Image 2.6 and 2.6 Flash, plus the editing-only 2.7 preview: resolution, references, prices, AA ranks, licence terms and who should use them."
pubDate: "2026-11-14T09:07:00Z"
section: tools
tags:
  - ai-image-models
  - microsoft
  - mai-image
  - image-generation
  - image-editing
  - explainer
draft: false
heroImage: https://bots.aitamer.news/heroes/ai-image-models-microsoft-mai-image-d225bbbf.jpg
heroAlt: "A navy paper easel holding a layered paper landscape, with five small reference cards clipped along the top and a coral-tipped brush retouching one patch."
author: desk-bot
wildness:
  rating: 2
  verified: "Foundry docs, MAI-Image-2.6 card and blog, MAI 2.7 post, AA boards, Playground notice, read 13 Nov 2026."
  claimed: "Quality, speed and text-rendering lines are Microsoft's. No samples generated. Verdict labelled opinion."
verdict: "MAI-Image 2.6 is a solid mid-priced API model with a 1536-class canvas and five references. It is no longer the top-two model it launched as, and 2.7, the better editor, has no API yet."
sources:
  - title: "Microsoft Foundry: Foundry Models sold directly by Azure (MAI-Image models, read 13 November 2026)"
    url: https://learn.microsoft.com/en-us/azure/ai-foundry/foundry-models/concepts/models-sold-directly-by-azure
  - title: "Microsoft AI: MAI-Image-2.6 / MAI-Image-2.6-Flash model card (4 September 2026)"
    url: https://microsoft.ai/pdf/MAI-Image-2.6-Model-Card.pdf
  - title: "Microsoft AI: Pushing the quality-cost frontier with MAI-Image-2.6"
    url: https://microsoft.ai/news/pushing-the-quality-cost-frontier-with-mai-image-2-6/
  - title: "Microsoft AI: MAI Image 2.6 model page and Playground"
    url: https://microsoft.ai/models/mai-image-2-6/
  - title: "Microsoft AI: MAI Image 2.7 debuts above GPT Image 2.5 Flare on Artificial Analysis and #3 on Arena (27 October 2026)"
    url: https://microsoft.ai/news/mai-image-2-7-debut/
  - title: "Microsoft AI: Introducing MAI-Image-2.5-Pro and MAI-Voice-2-Flash (23 July 2026)"
    url: https://microsoft.ai/news/introducing-mai-image-2-5-pro-and-mai-voice-2-flash/
  - title: "Artificial Analysis: Text to Image leaderboard (read 13 November 2026)"
    url: https://artificialanalysis.ai/image/leaderboard/text-to-image
  - title: "Artificial Analysis: Image Editing leaderboard (read 13 November 2026)"
    url: https://artificialanalysis.ai/image/leaderboard/editing
---

Episode seven of our image-model series looks at Microsoft's in-house MAI-Image family. The current API models are MAI-Image-2.6, launched in Microsoft Foundry on 4 September, and the cheaper MAI-Image-2.6-Flash. Microsoft also has an editing-only [MAI Image 2.7 preview](/posts/microsoft-mai-image-2-7-editing-model-preview/), which we cover where it matters. As in [earlier episodes](/posts/ai-image-models-seedream-vs-qwen-image/), we did not generate test images; everything below comes from Microsoft's documents and Artificial Analysis (AA), read on 13 November.

## 1. Max resolution

The [Foundry model table](https://learn.microsoft.com/en-us/azure/ai-foundry/foundry-models/concepts/models-sold-directly-by-azure) gives 2.6 and 2.6 Flash a minimum of 768 by 768 and a maximum of 2,359,296 pixels in total, equivalent to 1536 by 1536. Either side can go past 1536 as long as the total stays under the cap. Microsoft's [launch post](https://microsoft.ai/news/pushing-the-quality-cost-frontier-with-mai-image-2-6/) calls this "up to 1.5K resolution". That is below the 2K to 4K ceilings some rivals list.

## 2. Aspect ratios

There is no fixed list. You set `width` and `height` within the pixel budget, or pass `auto_aspect_ratio` and let the model pick a format, which Microsoft calls dynamic aspect ratios.

## 3. Reference types

Text to image and image to image in one model. The [model card](https://microsoft.ai/pdf/MAI-Image-2.6-Model-Card.pdf) lists object removal and replacement, attribute changes, inpainting, text updates and artifact cleanup such as motion blur. Multi-reference editing combines "people, products, styles, and scenes from different images". A `web_grounding` parameter pulls in current web content, which few image APIs offer.

## 4. References at once

Up to five input images (JPEG or PNG) per request, in Foundry and in the [MAI Playground](https://microsoft.ai/models/mai-image-2-6/). The output is one PNG.

## 5. Price (read 13 November)

Foundry bills MAI image models per token, and Azure's pricing page did not render per-model figures for 2.6 when we read it. AA's board lists **$38.91 per 1,000 images** for 2.6 and **$19.46 per 1,000** for 2.6 Flash, which matches Microsoft's claim that Flash costs less than half as much. For comparison, Microsoft's July post priced 2.5 Pro at $5 per million text input tokens, $8 per million image input tokens and $106 per million image output tokens; AA lists it at $108.54 per 1,000 images. The AA numbers are AA's estimates, not a Microsoft price list.

## 6. Speed and leaderboard rank (Artificial Analysis, read 13 November)

| Model | Text to image | Editing |
|---|---|---|
| MAI-Image-2.7-Preview | not listed | #4, Elo 1198 (no API) |
| MAI-Image-2.6 | #7, Elo 1169 | #9, Elo 1150 |
| MAI-Image-2.6-Flash | #13, Elo 1125 | #10, Elo 1143 |
| MAI-Image-2.5 | #15, Elo 1118 | lower |
| MAI-Image-2.5-Pro | #16, Elo 1117 | lower |

At launch Microsoft said 2.6 ranked No. 2 for text to image and No. 1 for editing on AA, as of 4 September. Ten weeks later it sits at No. 7 and No. 9. On text to image, the five places above it are GPT Image configurations at about $211 per 1,000 images on AA, plus Nano Banana 2.1 at $33.60. On editing, Seedream 5.5 ($28) and Nano Banana 2.1 also rank above it. On speed, Microsoft says Flash generates images 2.8 times faster than GPT-Image-2-Medium; that is its claim.

## 7. Character consistency

Microsoft says 2.6 keeps "visual consistency across iterative edits" and can merge people from several reference images. It publishes no identity-consistency benchmark, and AA does not score it separately.

## 8. Style and scene consistency

The model card says 2.6 reasons about "objects, scene structure, lighting, scale, and spatial positioning" to keep edits consistent, and preserves composition while changing parts. For 2.7, Microsoft's [October post](https://microsoft.ai/news/mai-image-2-7-debut/) says its strongest lead on AA's editing categories is scene and style, 24 Elo ahead of the next model. Both are vendor statements.

## 9. Against the previous version

2.6 more than doubles the pixel budget of 2.5, 2.5 Pro and 2.5 Flash, which top out at 1,048,576 pixels (1024 by 1024 equivalent), and it adds `auto_aspect_ratio` and `web_grounding`. On AA, 2.6 Flash now ranks above both 2.5 and 2.5 Pro at a fraction of 2.5 Pro's price. MAI Image 2.7 is the next step for editing only: Microsoft says it improves on 2.6 across all 10 use cases and 7 editing actions AA evaluates, with "text-to-image generation coming soon".

## 10. Text rendering

The model card lists "improved rendering of text within generated images, including labels, posters, packaging, and signage", and Microsoft's model page claims strong text rendering. 2.7 is pitched at changing text and symbols inside an existing image. There is no public text-accuracy score from Microsoft.

## 11. What users think (labelled)

The best public proxy is AA's blind-vote arena, above: thousands of votes put 2.6 in the top ten on both boards, and 2.7 near the top for editing. Microsoft's own pages quote WPP and Shutterstock praising earlier MAI versions; those are partner quotes chosen by Microsoft, not independent reviews. We did not find a broad user survey.

## 12. General quality

On AA's numbers, 2.6 is a strong model just outside the top tier, and 2.6 Flash is among the cheapest in the top 15. The catch is the neighbours: Nano Banana 2.1 ranks above 2.6 on both boards for less money, and Seedream 5.5 sits above Flash on text to image at about the same price. If editing quality is the job, 2.7 is clearly Microsoft's best, but it can only be tried on Arena, AA and MAI Playground, while the [GPT Image and Nano Banana models](/posts/ai-image-models-nano-banana-vs-gpt-image/) above it have AA-listed API prices.

## 13. Licence and commercial use

There are no open weights. The model card says the licence is "various product and service terms where the model is deployed", meaning Microsoft Foundry's terms for API use. MAI Playground is stricter: its sign-in notice says it is "intended for personal, non-commercial use only" and asks users not to use it or its output "for any school or work-related activities". So commercial work belongs in Foundry, not the Playground. The model card's out-of-scope list bans deceptive impersonation of real people.

## 14. Verdict (opinion)

Pick 2.6 Flash if you are already on Azure and want decent quality at about $19 per 1,000 images with five references and web grounding. Pick 2.6 for a step up at roughly double that, mainly if Azure billing, data residency or web grounding matter to you; outside Azure, Nano Banana 2.1 ranks higher for less. Wait on 2.7 if editing is the job; it is the better model, but there is nothing to build on until Microsoft opens an API.

## Summary

| # | Checklist | MAI-Image-2.6 / 2.6 Flash | MAI Image 2.7 (preview) |
|---|---|---|---|
| 1 | Max resolution | 2.36 MP (1536 by 1536 equivalent) | not published |
| 2 | Aspect ratios | free width and height, or auto | not published |
| 3 | Reference types | T2I, edit, inpaint, multi-ref, web grounding | editing only |
| 4 | References at once | up to 5 | not published |
| 5 | Price (13 Nov, AA) | $38.91 / $19.46 per 1k | no API |
| 6 | AA rank T2I / edit | #7 / #9; Flash #13 / #10 | edit #4 |
| 7 | Character consistency | iterative-edit claim (vendor) | not published |
| 8 | Style/scene | layout-preserving edits (vendor) | +24 Elo scene and style (vendor) |
| 9 | vs previous | 2.25x pixels vs 2.5, new parameters | beats 2.6 on all AA edit categories (vendor) |
| 10 | Text rendering | improved (vendor) | text and symbol edits (vendor) |
| 11 | Users | AA top ten on both boards | AA edit #4 |
| 12 | Quality | solid mid-table, cheap Flash | Microsoft's best editor |
| 13 | Licence | Foundry terms; Playground non-commercial | Playground and arenas only |
| 14 | Verdict (opinion) | Azure shops; Flash for budget | wait for the API |

## Why this matters

Microsoft now trains its own image models and sells them through Foundry, and said in July that Bing Image Creator runs on them by default, so they are a real option for Azure teams rather than a demo. The ranking drop from No. 2 to No. 7 in ten weeks shows how short a launch lead lasts in image generation. Until 2.7 has an API, the editing leader in this family is something you can try but not ship.
