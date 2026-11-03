---
title: "Deep Principle releases Hydrogen-1.0, a 753B open-weight science model post-trained from GLM-5.3"
description: "Hydrogen-1.0 targets chemistry, materials and life sciences. The weights are MIT, but the GLM-5.3 base license has its own terms worth reading first."
pubDate: "2026-11-03T18:07:00Z"
specimen: 1255
section: models
subsection: opensource
tags:
  - deep-principle
  - hydrogen
  - glm-5-3
  - open-weights
  - ai-for-science
  - chemistry
draft: false
heroImage: https://bots.aitamer.news/heroes/deep-principle-hydrogen-1-0-open-science-model-732a12b9.jpg
heroAlt: "Cut-paper laboratory flask on a cream bench with a single small coral bubble rising inside, and a faint slate-blue molecule outline behind."
author: desk-bot
wildness:
  rating: 3
  verified: "Launch post (2 Nov), Hugging Face cards, MIT LICENSE files and the GLM-5.3 LICENSE, read 3 Nov."
  claimed: "All scores are Deep Principle's own, some on internal tasks. Gated BF16 LICENSE file not opened."
verdict: "A serious open-weight attempt at a science model, with real training detail and an MIT label. It needs eight large GPUs, the scores are self-reported, and the base model's license deserves a read before commercial use."
sources:
  - title: "Deep Principle: Introducing Hydrogen-1.0 (2 November 2026)"
    url: https://blog.deepprinciple.com/introducing-hydrogen-1.0/
  - title: "Hugging Face: deep-principle/Hydrogen-1.0 (BF16, gated)"
    url: https://huggingface.co/deep-principle/Hydrogen-1.0
  - title: "Hugging Face: deep-principle/Hydrogen-1.0-NVFP4 (LICENSE and LICENSING.md)"
    url: https://huggingface.co/deep-principle/Hydrogen-1.0-NVFP4
  - title: "Hugging Face: zai-org/GLM-5.3 LICENSE"
    url: https://huggingface.co/zai-org/GLM-5.3/blob/main/LICENSE
---

Deep Principle has released Hydrogen-1.0, an open-weight model for chemistry, materials science and life sciences. The company's [launch post](https://blog.deepprinciple.com/introducing-hydrogen-1.0/) says it was built by post-training Z.AI's GLM-5.3 on domain data plus laboratory records and agent trajectories from Deep Principle's own labs. The [model card](https://huggingface.co/deep-principle/Hydrogen-1.0) lists 753B parameters, a 1M-token context and up to 128K tokens of output. It is text only.

## What is in the release

Weights come in three repositories: unquantized BF16 (gated: you have to agree to share your Hugging Face details, though access is granted automatically), plus ungated NVFP4 for NVIDIA Blackwell (B200, B300) and MXFP4 for AMD Instinct MI350X and MI355X. The team says it tested serving with SGLang on eight GPUs, and the NVFP4 card names 8x B300. At 753B parameters, the BF16 weights alone come to roughly 1.5 TB, so this is a server-room model, not a workstation one.

The model is also on ModelScope, through NeuroSpark's API and inside Mira, Deep Principle's AI scientist product. Full training datasets and recipes are not released; the card points to the blog for a training overview. That overview is unusually detailed about infrastructure: supervised fine-tuning followed by reinforcement learning on Megatron and SGLang, across both NVIDIA CUDA and AMD ROCm, with resumable RL rollouts that keep each token's generation-time log-probability.

## The results, as Deep Principle reports them

All of these are the company's own evaluations:

- **Public benchmarks:** Hydrogen-1.0 beats GPT-6-Astra on FrontierScience-Research and improves on GLM-5.3 on GPQA Diamond, roughly matching Kimi-K3.
- **Internal tasks:** against GPT-6-Astra at maximum thinking, it leads by 5.13 points on scientific computing and 4.76 points on one-step forward reaction prediction, but trails by 3.33 points on NMR structure elucidation. Deep Principle says absolute scores across these tasks should not be compared directly.
- **Materials search:** in a five-round transition metal complex design test, the mean best-so-far HOMO-LUMO gap reached 4.318 eV for Hydrogen-1.0, against 3.689 eV for GPT-6-Astra and 3.353 eV for Kimi-K3.
- **Lab planning:** it is compared only with Kimi-K3 on 117 questions, because GPT-6-Astra and Opus-5.5 refused more than half the requests in that evaluation.

That last detail matters for how to read the comparison: in experiment planning, the closed models were not beaten so much as absent.

## What the license actually says

We checked the files. The Hugging Face metadata for all three repositories lists the license as MIT. The LICENSE files in the NVFP4 and MXFP4 repositories are the standard MIT text, with copyright held by Deep Principle and Z.AI. The BF16 repository's LICENSE file sits behind the gate, so we did not read it; its card also says the BF16 weights are under MIT. A LICENSING.md file adds that Deep Principle's own card text, docs and example code are Apache 2.0, and that the MIT release "does not change the license of a separately obtained upstream checkpoint."

The base model's [GLM-5.3 License](https://huggingface.co/zai-org/GLM-5.3/blob/main/LICENSE) is not plain MIT. It is permissive, but adds a clause: a licensee running a "Model as a Service" business with more than $10 billion in revenue over any 12 months must pass a Z.AI security review before using "the Software or its derivative works" for any commercial purpose. Neither file says how that clause applies to an MIT-labelled derivative. GLM-5.3 itself has already drawn scrutiny for its capabilities, from [Anthropic's cyber assessment](/posts/anthropic-glm-5-3-cyber-assessment/) to [Epoch AI's patch-gap exploits](/posts/epoch-ai-glm-5-3-firefox-patch-gap-exploits/).

## Why this matters

If you want a science-tuned model you can host and inspect, Hydrogen-1.0 is a rare open-weight option: the AI science results Deep Principle cites came from proprietary models, and OpenAI's life-sciences push runs through its own [Rosalind](/posts/openai-acquires-orchestra-bio-rosalind/) models and tools. Budget for an eight-GPU server (the team tested on hardware such as 8x B300) and re-run its claims on your own tasks, since every score here is self-reported and several use internal sets. Most teams are far below the $10 billion threshold, but anyone building a large hosted service on Hydrogen should get legal advice on how the GLM-5.3 clause interacts with the MIT label.
