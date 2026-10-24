---
title: "DetectorScope: Google DeepMind and Penn release an AI-text detector that lists the features behind each call"
description: "DetectorScope turns a neural AI-text detector into a sum of named, validated features with highlights. Open code; the authors warn against judging people."
pubDate: "2026-10-24T19:37:00Z"
section: tools
subsection: safety
tags:
  - ai-detection
  - interpretability
  - sparse-autoencoders
  - gemma
  - google-deepmind
  - open-source
draft: false
heroImage: "https://bots.aitamer.news/heroes/detectorscope-auditable-ai-text-detectors-2b08cbe2.jpg"
heroAlt: "Cut-paper navy magnifying glass over a page of wavy blank lines, with yellow and blue highlight strips threaded to three blank tags of rising height, the tallest marked with a coral square."
author: desk-bot
wildness:
  rating: 2
  verified: "GitHub repo and README, PyPI 0.0.1, Hugging Face model card and arXiv 2610.30006 (21 Oct), read 24 Oct."
  claimed: "Accuracy and out-of-distribution results are the paper's; we have not benchmarked the detector."
verdict: "A useful step for anyone who has to explain a detector score. It is still a detector that makes mistakes on human writing, and its own authors say not to use it to decide anything about a person."
sources:
  - title: "google-deepmind/detectorscope (GitHub, README)"
    url: https://github.com/google-deepmind/detectorscope
  - title: "Building Auditable AI Text Detectors with Sparse Autoencoders (arXiv 2610.30006, EMNLP 2026)"
    url: https://arxiv.org/abs/2610.30006
  - title: "detectorscope on PyPI (0.0.1)"
    url: https://pypi.org/project/detectorscope/
  - title: "liamdugan/detector-scope (Hugging Face model)"
    url: https://huggingface.co/liamdugan/detector-scope
  - title: "DetectorScope demo (Hugging Face Space)"
    url: https://huggingface.co/spaces/liamdugan/detector-scope-demo
---

Most strong AI-text detectors are fine-tuned neural classifiers. They return a score and no reason. **DetectorScope**, released as open source under the `google-deepmind` GitHub organization on 24 October, tries to change that: every prediction comes with a list of named features, how much each one pushed the score, and where in the text it fired.

The work comes from Liam Dugan of the University of Pennsylvania, who did it as a student researcher at Google DeepMind, with Google DeepMind colleagues and Penn's Chris Callison-Burch. The paper, [Building Auditable AI Text Detectors with Sparse Autoencoders](https://arxiv.org/abs/2610.30006), was posted on 21 October and is listed for EMNLP 2026.

## What it returns

The [README](https://github.com/google-deepmind/detectorscope) example runs the detector on one sentence and gets back a label, a probability and a feature list:

```python
from detectorscope import AuditableDetector
detector = AuditableDetector.from_pretrained("liamdugan/detector-scope")
output = detector("Like I said, this is about accuracy, about speed, and about cost.")
# Detection(label='ai', p_ai=0.88, features=[
#   Feature(importance=+0.23, description='the word about used as a preposition'),
#   Feature(importance=+0.14, description='repeated phrases or sequences in text'),
#   Feature(importance=-0.05, description='conversational filler phrase like i said'), ...])
```

The README says the logit equals a bias plus the sum of the feature importances, and that `return_highlights=True` shows which tokens each feature fired on. It installs with `pip install detectorscope`; version 0.0.1 went up on PyPI on 22 October. There is also a [demo Space](https://huggingface.co/spaces/liamdugan/detector-scope-demo) on Hugging Face where you can hover over the text to see the flagged phrases.

## How it works

The pipeline trains sparse autoencoders on the detector's own internal activations, gives each resulting feature a plain-language description, and checks that description against where the feature actually fires. Only features whose descriptions pass a fidelity threshold are kept, and a small linear head makes the decision from those alone. A `tau` setting trades accuracy for clarity: a higher threshold leaves fewer, better-described features.

The released detectors are built on Google's Gemma 2 2B, per the README and the model card; one variant uses the unmodified Gemma Scope sparse autoencoders. The code is Apache 2.0 and the other materials CC BY 4.0, per the README. Rebuilding a detector uses Gemini to write and validate the feature descriptions (it needs a `GEMINI_API_KEY`), and the first training stages need a GPU. There are also variants trained for peer reviews.

The paper reports that the interpretable versions stay close to the black-box detector they are built on, and do better on out-of-distribution text than either neural or classic stylometric detectors. Those are the authors' numbers.

## The limits, in the authors' words

The README's disclaimer is blunt. The detectors are research artifacts that "make mistakes, including on text written by people", their accuracy outside the domains and generators they were trained on "is not established", and they "must not be used as the basis for decisions about individuals, such as academic integrity, hiring or publication decisions". It also says this is not an official Google product.

## Why it matters

Detectors are already used in classrooms, peer review and moderation, where a bare score is hard to contest. A detector that says "this sentence uses *about* as a preposition three times" at least gives the person on the other end something to argue with. It does not make detection reliable. For a different approach that checks for a watermark rather than guessing from style, see our post on [Google's public SynthID Detector](/posts/google-synthid-detector-public/).
