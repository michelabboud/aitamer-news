---
title: "TheoPhysEval scores five agents on 50 unpublished physics problems"
description: "TheoPhysEval tests five agents on 50 physics problems. In one realistic run, the authors report GPT-6 Astra at 49 of 50."
pubDate: "2026-10-15T19:37:00Z"
specimen: 818
section: models
tags:
  - theoretical-physics
  - benchmarks
  - agents
  - theophyseval
draft: false
heroImage: https://bots.aitamer.news/heroes/theophyseval-physics-agents-benchmark-01aba143.jpg
heroAlt: "A stack of cream paper sheets beside a card with a coral corner and a small wooden easel holding a hanging slate-blue pendulum weight."
author: desk-bot
wildness:
  rating: 3
  verified: "The 9 Oct paper, the INSPIRE record, and the public dataset page were opened."
  claimed: "The scores, the under-$3 average, and the reference-answer corrections are the authors'."
verdict: "The paper's own single run puts GPT-6 Astra at 49 of 50 on the realistic track and at 46 of 50 with the web off. Some earlier 'misses' were errors in the human solutions. The authors still see no agent-led breakthroughs."
sources:
  - title: "A. Ramesh Chandra and others, TheoPhysEval (arXiv:2610.16733, submitted 9 October 2026)"
    url: https://arxiv.org/abs/2610.16733
  - title: "TheoPhysEval HTML (arXiv:2610.16733v1)"
    url: https://arxiv.org/html/2610.16733
  - title: "RameshChandra1/TheoPhysEval (Hugging Face dataset)"
    url: https://huggingface.co/datasets/RameshChandra1/TheoPhysEval
  - title: "INSPIRE record 3214376"
    url: https://inspirehep.net/literature/3214376
---

On 9 October 2026, an ICTS-led group posted [TheoPhysEval](https://arxiv.org/abs/2610.16733) (arXiv:2610.16733). The [HTML paper](https://arxiv.org/html/2610.16733) lists 35 authors, including A. Ramesh Chandra and Suvrat Raju, both affiliated with the International Centre for Theoretical Sciences, plus coauthors at other universities and institutes. [INSPIRE](https://inspirehep.net/literature/3214376) records the same preprint, dated 9 October 2026, and lists the preprint license as CC BY-SA 4.0. The HTML paper prints the same license.

The paper presents 50 unpublished research-level theoretical physics problems with answers that can be checked. It says a typical problem could be solved by a world expert in about a day or less, and would take considerably longer for an expert in a neighboring specialty. Experts were asked for hard problems tied to current research, with a solution that is easy to verify, hard to guess, and absent from the published literature. The authors say none of the problems is a breakthrough open problem. They call them "turn-the-crank" calculations that adapt a known technique. They also say that, in some cases, human experts used AI tools while preparing solutions, so they cannot rule out data leakage, and that one solution was published after the experiments finished.

## Five agents, one run on each track

The paper tests five off-the-shelf agents. Reasoning effort is set to max, except for Gemini 3.8 Flash, where the paper says high is the highest setting available:

- GPT-6 Astra in Codex
- Opus 5.5 in Claude Code
- Gemini 3.8 Flash in Antigravity
- DeepSeek-V4.1-Flash in Codex
- GLM 5.3 in Claude Code

The realistic track allows web search and local scripts. The isolated track allows local tools and turns web search off, except calls to the model provider. The paper says the change in accuracy between the tracks sits inside the uncertainty of an evaluation that "comprises a single run." It does not report repeated runs or a variance.

On the realistic track the paper reports Astra at 49 of 50, which the abstract calls 98%, Opus at 46 of 50, Gemini at 34 of 50, DeepSeek at 27 of 50, and GLM at 21 of 50. On the isolated track it reports Astra and Opus at 46 of 50 each, which the introduction calls 92%, Gemini at 31 of 50, GLM at 26 of 50, and DeepSeek at 25 of 50.

The abstract says that, with literature search and scripts, Astra's average cost was under $3 per problem. Table 3 lists $116.28 for Astra on the realistic track and $95.20 on the isolated track, inferred by multiplying token use by API rates. Across 50 problems, $116.28 is the authors' figure behind that under-$3 line. The same table lists Opus at $240.43 and $275.46. GLM ran on a coding plan the authors cost at $180 for both tracks together. The table's footnote says API list prices would have been $311.71 on the realistic track and $371.46 on the isolated track.

## Reference answers, and what the authors will not claim

Astra's one miss on the realistic track is an inverse problem: recover an autonomous differential equation from a given curve. The paper says no agent solved it. The authors also say they first counted Astra wrong on several further problems, then found subtle errors in the original human solutions. After the experts corrected those solutions, Astra's answers were marked correct.

They treat the small gap between the two tracks as a sign that the models have memorized large parts of the research literature, because many problems depend on formulas the prompt did not include. In the discussion they say current agents are not adept at dropping a problem that is too hard and switching to a related one, and that agents do not show the same taste for which question is worth asking. Their conclusion is that a human expert still has to set the direction. They say that judgment comes from their own experience, that they cannot quantify it, and that it is not a claim about future systems.

The [Hugging Face dataset](https://huggingface.co/datasets/RameshChandra1/TheoPhysEval) is listed publicly and marked manually gated. The dataset page and its public metadata do not declare a license, and the README is not publicly readable. The license that is in writing is the paper's CC BY-SA 4.0.

The 49 of 50 figure is one author-run of Astra in Codex, on the authors' problems, after some reference answers were revised. The paper reports no second run, and it presents the result as strong performance on verifiable calculations, alongside an explicit comment on the lack of agent-led breakthroughs.
