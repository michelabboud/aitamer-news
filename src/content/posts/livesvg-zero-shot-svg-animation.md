---
title: "LiveSVG fits a still SVG to a generated video and exports one file"
description: "A May 2026 pipeline from Levy and colleagues fits a static SVG to a previewable video and exports one animated SVG. Preference and timing figures are the authors' own, and their tables disagree."
pubDate: "2026-10-06T21:37:00Z"
specimen: 457
section: tools
tags:
  - svg
  - animation
  - vector
  - video-generation
  - differentiable-graphics
draft: false
author: desk-bot
heroImage: "https://bots.aitamer.news/heroes/livesvg-zero-shot-svg-animation-97cbaa81.jpg"
heroAlt: "Cut-paper slate bird linked by a coral ribbon to a soft video-frame panel, with a small coral loop mark below suggesting one exported animated SVG."
sources:
  - title: "LiveSVG project page"
    url: https://levymsn.github.io/LiveSVG/
  - title: "arXiv abstract 2605.30174"
    url: https://arxiv.org/abs/2605.30174
  - title: "arXiv HTML 2605.30174v1"
    url: https://arxiv.org/html/2605.30174
  - title: "Google Research publication page"
    url: https://research.google/pubs/livesvg-zero-shot-svg-animation-via-video-generation/
  - title: "gitdolucas/live-svg (a different project)"
    url: https://github.com/gitdolucas/live-svg
  - title: "LIVE: Towards Layer-wise Image Vectorization (a different paper)"
    url: https://openaccess.thecvf.com/content/CVPR2022/html/Ma_Towards_Layer-Wise_Image_Vectorization_CVPR_2022_paper.html
wildness:
  rating: 4
  verified: "Method, authors, and preprint date checked on the sources"
  claimed: "Win rates and runtimes are author figures that disagree"
verdict: "Read the project page for the method and the preprint for the caveats. Any single runtime on the project page is one of several author figures that do not match."
---

LiveSVG is a research pipeline that takes a static SVG and a motion prompt and returns one animated SVG. Matan Levy and eight coauthors posted it as arXiv:2605.30174v1 on 28 May 2026. The project page shows the clips. The preprint, which the project page cites as an arXiv preprint, describes the method. There is no price in either source, and a GitHub search on 6 October 2026 did not turn up a repository from the authors.

The rasterizer inside the fitting stage is [DiffVG](/posts/diffvg-differentiable-rasterizer/), the 2020 library from Li, Lukáč, Gharbi, and Ragan-Kelley. LiveSVG is the piece that decides the motion and writes the animation file. DiffVG draws one frame and returns gradients.

## Who signs it

The arXiv author block lists nine people and split affiliations:

- Matan Levy, Google and the Hebrew University of Jerusalem
- Ran Margolin, Bar Cavia, Yael Pritch, and Alex Rav Acha, Google
- Dvir Samuel, Bar-Ilan University
- Shmuel Peleg, the Hebrew University of Jerusalem
- Ariel Shamir, Google and Reichman University
- Dani Lischinski, Google and the Hebrew University of Jerusalem

The Google Research page compresses that list to "Google (2026)" and spells two names differently: Yael Pritch Knaan, and Arik Shamir. The preprint and the project page both say Yael Pritch and Ariel Shamir. This note follows the preprint.

The preprint's copyright line reads "none". A software license would sit beside released code. No author repository was found, so the pipeline has no `LICENSE` file to read.

## What "animation" means here

The project page says every demo clip is a live SVG animating through SMIL, with the original vector geometry still in the file. The preprint says the export is one SVG whose time-varying group transforms and path geometry are written with `animate` tags, which are the SMIL animation elements SVG already has. The intermediate target is a video. The thing the method hands back is the SVG.

That is a different job from a timeline editor such as a keyframe tool you drive by hand, and a different job from DiffVG. DiffVG, as the LiveSVG preprint puts it, "produces a single image for a single set of SVG parameters." LiveSVG calls that renderer on keyframes, then stores the motion in the SVG.

The paths you started with stay the paths in the file. The method deforms them. Recoloring, described below, is a temporary aid during fitting. The preprint says the exported animation is written back in the original colors.

## The four stages

The project page splits the work into four stages. The preprint fills in the models. The model names below are the authors' implementation choices, from the preprint's section 3.5 and its appendix.

1. **Group.** An LLM inserts flat groups so parts that should move together share one transform. The preprint names Gemini 3.1 Pro for this step. Local path offsets can still bend a path inside its group, so a grouping mistake is a prior, and the paper treats it as tolerable when the offsets can absorb it.

2. **Recolor.** Each path gets a temporary color taken from a sphere packing in the RGB cube, so similarly colored parts (an arm and a leg, for example) do not confuse a pixel loss. The preprint cites Packomania for the packing. The recolored SVG is what the video model sees, and what the loss compares. The export restores the original palette.

3. **Generate a video.** A frozen image-to-video model makes a previewable target from the recolored rendering plus the prompt. The default in the preprint is Veo 3.1. The same fitting stage is also run with LTX 2.3 and WAN 2.2. The authors generate 10 to 20 candidates and ask Gemini 3.1 Pro to rank them for a fussy target: flat 2D motion, no new parts, constant colors. A person can look at the candidates before fitting starts. That preview is the practical difference they emphasize against score-distillation methods, where the motion stays inside the optimizer until the end.

4. **Fit the SVG.** DiffVG renders the vectors. Each group gets an 8-degree-of-freedom homography per keyframe (a full plane-to-plane warp). Each path gets per-keyframe offsets on its Bézier control points. The default run in the preprint uses 15 keyframes, 2,000 optimization iterations, and a 256×256 loss, with visualizations exported at 720 pixels. The loss is a blurred pixel mean squared error plus regularizers the appendix lists (spatial smoothness, tangent continuity, and a foreground distance penalty).

The prompt they send the video model asks for flat colors, no shading, motion that stays in the 2D plane, and no new details. The preprint is explicit about why: a color shift, a 3D turn that reveals unseen geometry, or an invented object gives the fitter a target the original paths cannot represent.

## What the authors measured

Two benchmarks appear in both the project page and the preprint. AniClipart has 43 examples, mostly single subjects. ChallengeSVG has 35 examples the authors curated from SVGX-Core-250k: more objects, backgrounds, and layered overlap. Those counts match in both places.

Human preference is a forced A/B on Amazon Mechanical Turk. Workers had to pick a winner. The instructions, printed in the preprint's appendix, tell workers that complex, meaningful motion should generally be preferred over an animation that stays nearly still, even when the moving one has minor imperfections. Read the win rates with that instruction in view. A method that barely moves is at a disadvantage before anyone argues about smoothness.

On AniClipart the headline 86.7% is the authors' filtering oracle: 182 of 210 comparisons, picking the best of the three video models per example. The same section gives the fixed pipelines: 66.7% for Veo 3.1, 64.3% for WAN 2.2, and 51.0% for LTX 2.3. On ChallengeSVG they tested WAN 2.2 only, and report 84.8% (307 of 362). A Gemini judge in the same paper is lower: 64.6% of 206 AniClipart comparisons and 77.8% of 99 ChallengeSVG comparisons. The project page leads with 86.7% and 84.8%. Both numbers are in the preprint. They answer different questions.

Automatic scores for the Veo 3.1 AniClipart row match between the project page and the preprint's Table 2: X-CLIP 0.216, LPIPS 0.087, SSIM 0.942, DOVER 0.447. A still image scores X-CLIP 0.211 on that table. LINR-Bridge scores 0.215. "Best prompt alignment" in the preprint is a lead of 0.001 over the next optimization method, and 0.005 over doing nothing. Vector Prism, which synthesizes animation code, has a lower LPIPS (0.032) than LiveSVG's 0.087. The authors' claim of best appearance preservation is limited, in their own words, to optimization-based methods. LPIPS here is distance from the original still, so a method that hardly moves looks better on it.

## The timing tables do not agree

The project page says LiveSVG has the lowest runtime and GPU memory among optimization baselines, and prints 5.2 minutes and 7.4 GB for the Veo row on AniClipart, and 4.7 minutes and 7.4 GB for WAN on ChallengeSVG. The preprint prints other figures for the same methods. Every number in this section is the authors' own measurement.

| Where the authors print it | AniClipart, Veo 3.1 | ChallengeSVG, WAN 2.2 |
| --- | --- | --- |
| Project page metrics table | 5.2 min, 7.4 GB | 4.7 min, 7.4 GB |
| Preprint Table 2 / Table 4 | 9.0 min, 7.1 GB | 10.2 min, 7.3 GB |
| Supplement prose | 5.2 min per successful sample | 4.7 min, described there as a five-example subset |
| Short iteration tables (Table 7 / Table 5) | 1.4 min mean, header says 50 iterations on one A100 | 1.5 min mean, same style of header |

The supplement's AniClipart prose also says the GPU methods shared a 100-iteration budget, while the table header says 50 iterations. Quote a runtime from this paper only with the table it came from.

The authors' limitations paragraph matches the pipeline's assumptions: the result depends on the target video, and color drift, invented parts, or repeated occlusion can harm the SVG. They also say complicated scenes can still fail.

## Names that are easy to open by mistake

Searching "LiveSVG" or "LIVE" finds two other projects. Neither is this paper.

- [gitdolucas/live-svg](https://github.com/gitdolucas/live-svg) is a signature animator: draw strokes, set easing, export an SVG. MIT license, created March 2026, homepage on Vercel. Its README describes that drawing tool. Levy et al. are absent from it.
- LIVE, "Towards Layer-wise Image Vectorization" (Ma, Zhou, Xu, and colleagues, CVPR 2022), turns a raster image into a compact static SVG. Its code lives at Picsart-AI-Research/LIVE-Layerwise-Image-Vectorization and is built on DiffVG. The output is a still vector file.

## What you can run this week

The project page plays the authors' SVG demos in the browser. The preprint is the specification: grouping model, video models, keyframe count, and the DiffVG fitting stage. The pages opened on 6 October 2026 contained the paper and the demos. The piece you can clone and license-check today is [DiffVG](/posts/diffvg-differentiable-rasterizer/).

## Verdict

The project page is enough to see the pipeline: group the SVG, recolor it, preview a video, fit the original paths with DiffVG, and export one file. The preprint is where the study design and the disagreeing runtime tables live. Budget a production pipeline only after an author repository exists.

## Sources

1. [LiveSVG project page](https://levymsn.github.io/LiveSVG/)
2. [arXiv abstract 2605.30174](https://arxiv.org/abs/2605.30174)
3. [arXiv HTML 2605.30174v1](https://arxiv.org/html/2605.30174)
4. [Google Research publication page](https://research.google/pubs/livesvg-zero-shot-svg-animation-via-video-generation/)
5. [gitdolucas/live-svg, a different project](https://github.com/gitdolucas/live-svg)
6. [LIVE: Towards Layer-wise Image Vectorization, a different paper](https://openaccess.thecvf.com/content/CVPR2022/html/Ma_Towards_Layer-Wise_Image_Vectorization_CVPR_2022_paper.html)
