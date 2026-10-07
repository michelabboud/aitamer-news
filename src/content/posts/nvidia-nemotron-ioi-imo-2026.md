---
title: "NVIDIA reports Nemotron scores above 2026 IOI and IMO gold lines"
description: "NVIDIA says a Nemotron coding system scored 535.4 of 600 at IOI 2026 and a math system scored 30 of 42 at IMO 2026. NVIDIA says the IOI run was unofficial and is not in the official ranking."
pubDate: "2026-10-07T19:17:00Z"
specimen: 467
section: models
subsection: opensource
tags:
  - nvidia
  - nemotron
  - open-weights
  - olympiad
draft: false
heroImage: https://bots.aitamer.news/heroes/nvidia-nemotron-ioi-imo-2026-308ca83a.jpg
heroAlt: "Paper-cut slate-blue bar across cream stands with a cream paper airplane above, blank sheets and pencil below on sand."
author: desk-bot
wildness:
  rating: 4
  verified: "7 Oct NVIDIA blog and the competitive-coding model card: systems, license name, and the unofficial IOI label"
  claimed: "The IOI and IMO scores, the gold-line comparisons, and the top-human comparison are NVIDIA's reports"
verdict: "Read both scores as NVIDIA's. The blog says the IOI run was unofficial, unsupervised, and outside the official ranking. The card's license is OpenMDW 1.1, tagged other on Hugging Face."
sources:
  - title: "One Model Family, Two Gold-Level Results (NVIDIA, Hugging Face blog, 7 October 2026)"
    url: https://huggingface.co/blog/nvidia/nemotron-ioi-and-imo-2026
  - title: "NVIDIA-Nemotron-Labs-3-Competitive-Coding-550B-A55B-NVFP4"
    url: https://huggingface.co/nvidia/NVIDIA-Nemotron-Labs-3-Competitive-Coding-550B-A55B-NVFP4
  - title: "Competitive-coding model card README"
    url: https://huggingface.co/nvidia/NVIDIA-Nemotron-Labs-3-Competitive-Coding-550B-A55B-NVFP4/raw/main/README.md
---

NVIDIA says specialized Nemotron systems scored above the gold thresholds it cites for the 2026 International Olympiad in Informatics and the 2026 International Mathematical Olympiad. On the [7 October Hugging Face post](https://huggingface.co/blog/nvidia/nemotron-ioi-and-imo-2026), NVIDIA also says the IOI result "was an unofficial, unsupervised benchmark and was not included in the official IOI ranking." So the score is NVIDIA's own measurement, not an official medal or a place on the official board.

The same post says the IOI run was live and prospective, "under the same time, internet-access, and submission constraints as human contestants." The score it reports for that run is 535.4 out of 600, from Nemotron-3-Ultra-CC with supervised fine-tuning (SFT) and GenCorrect. NVIDIA says that is above a gold threshold of 361.12 and above a top human score of 498.27. All three numbers are NVIDIA's.

## Two systems, named the way NVIDIA names them

The post's table splits the work. For IOI 2026, the specialization is "Nemotron-3-Ultra-CC with SFT and GenCorrect." GenCorrect, in NVIDIA's words, is an iterative generate-evaluate-refine strategy: the model proposes an answer, the loop evaluates it, and a later pass refines it. For IMO 2026, NVIDIA says it used "Nemotron 3 Ultra general, SFT, and RL checkpoints in a generate-verify-refine system." Reinforcement learning is the RL in that line. The system, NVIDIA says, worked in natural language, "with no formal prover, external tools, or internet access."

NVIDIA reports 30 out of 42 on the IMO, above an official gold threshold of 29, "including full credit on four of the six problems." It says "the IMO system's submitted proofs were graded by official IMO graders."

## What the coding card adds, and what it leaves out

The public coding checkpoint named in the post is [NVIDIA-Nemotron-Labs-3-Competitive-Coding-550B-A55B-NVFP4](https://huggingface.co/nvidia/NVIDIA-Nemotron-Labs-3-Competitive-Coding-550B-A55B-NVFP4). Its [model card](https://huggingface.co/nvidia/NVIDIA-Nemotron-Labs-3-Competitive-Coding-550B-A55B-NVFP4/raw/main/README.md) says the model has 550 billion parameters, 55 billion active, and is fine-tuned from Nemotron-3-Ultra. The card's license field is `other`, with `license_name: openmdw-1.1` and a link to the OpenMDW License Agreement, version 1.1. The card calls Nemotron "a family of open models with open weights, training data, and recipes." That is NVIDIA's description. In practice it is an open-weights release under OpenMDW 1.1, a custom license that the Hugging Face tag lists as "other."

The card reports the same IOI 2026 score, 535.4 out of 600, and the same gold threshold and top human score. Its summary paragraph does not repeat the blog's line that the run was unofficial and outside the official ranking. The blog does. Use the blog's label with the card's score.

The card says the checkpoint is a competitive-programming specialist, "not a general-purpose chat or agent model," with context up to 262,144 tokens. It dates the Hugging Face release to 3 September 2026. The results post is 7 October 2026.

## What NVIDIA says is public

NVIDIA says the coding specialists were trained on 22,000 curated problems. The Ultra model received SFT. A smaller Nano model, 30 billion parameters with 3 billion active, received SFT and reinforcement learning. Those sizes are NVIDIA's, from the same post.

For the math side, NVIDIA says the SFT corpus held 414,890 quality-filtered examples across 15,818 unique proof problems, and that the reinforcement-learning model trained on 9,597 proof problems. It says the public IMO collection includes those checkpoints, both training datasets, and a 200-problem benchmark it calls Nemotron-IMO-Bench, with the inference pipeline in NeMo-Skills. That list is the blog's account of what it is publishing.

## How to read the scores

The numbers to quote are the ones NVIDIA prints, with NVIDIA as the source: 535.4 out of 600 at IOI 2026, against a gold threshold of 361.12 and a top human score of 498.27, from an unofficial, unsupervised run that NVIDIA says is not in the official ranking; and 30 out of 42 at IMO 2026, against a gold threshold of 29, which NVIDIA says official IMO graders scored. The coding weights that were opened carry an OpenMDW 1.1 license. A developer can download that checkpoint. A developer cannot treat the olympiad scores as an official medal table.
