---
title: Measure quantization damage with KL divergence alongside perplexity
description: Save full-precision logits once with llama.cpp's perplexity tool, then rank quantized builds by how far their token distributions drift.
pubDate: "2026-10-11T03:00:00Z"
section: models
tags:
  - quantization
  - llamacpp
  - kl-divergence
  - perplexity
  - evaluation
draft: false
heroImage: https://media.aitamer.news/heroes/measure-quantization-damage-with-kl-divergence-alongside-perplexity-f5fcae9b.jpg
heroAlt: A cream reference distribution and a shifted, flattened blue quantized distribution are compared with a small measuring tool and rust-colored drift ribbons.
author: quill
wildness:
  rating: 1
  verified: Flags, logit file sizes and every table value match the llama.cpp perplexity README.
  claimed: The README's reading of percentile asymmetry as real quality loss is its own judgment.
verdict: Keep an FP16 logits file per model and compare builds by KL divergence, its tails and same-top-token rate. Perplexity alone can misorder close builds.
sources:
  - title: llama.cpp perplexity README
    url: https://raw.githubusercontent.com/ggml-org/llama.cpp/master/tools/perplexity/README.md
---

When you compare quantized builds of a model, the usual number is perplexity on Wikitext. It is cheap and familiar, and it hides a lot. Two builds can land at almost the same perplexity while one of them shifts the model's next-token choices further from the original. The llama.cpp perplexity tool can measure that drift directly by comparing each token's probability distribution against the full-precision model.

## The limits of perplexity

The [llama.cpp perplexity README](https://raw.githubusercontent.com/ggml-org/llama.cpp/master/tools/perplexity/README.md) states them plainly. Perplexity "is **not** directly comparable between models, especially if they use different tokenizers." Fine-tunes "typically result in a higher perplexity value even though the human-rated quality of outputs increases." And llama.cpp numbers are not comparable to other projects' numbers because "the exact values depend strongly on the implementation details."

Perplexity is built only from the probability the model gives the correct next token. A quantization can raise that probability on some tokens and lower it on others, and the average can barely move while behavior changes.

## What KL divergence measures

Kullback-Leibler divergence compares two probability distributions. The README calls it "a measure of how similar the FP16 and the quantized logit distributions are with a value of 0 indicating that the distribution are the same." It uses the full distribution at every token position, so it also registers changes among the runner-up tokens.

## Run it in two steps

Step one records the full-precision logits once. Step two scores each quantized build against that file.

```bash
# 1. Save FP16 logits over the evaluation text
./llama-perplexity -m model-f16.gguf -f wiki.test.raw \
  --kl-divergence-base model-f16.kld

# 2. Compare a quantized build against the saved logits
./llama-perplexity -m model-q4_k_m.gguf \
  --kl-divergence-base model-f16.kld --kl-divergence
```

Plan for disk space. The README warns that the logit file "will be very large, 11 GiB for LLaMA 2 or 37 GiB for LLaMA 3 when using the Wikitext-2 test set."

The convention among llama.cpp contributors is the Wikitext-2 test set, fetched with `scripts/get-wikitext-2.sh`. Held-out text from your own workload is also a valid input, and it tells you more about the damage your users will see.

## Read more than the mean

With `--kl-divergence`, the README lists these outputs beside mean KL divergence:

- the ratio and the difference of FP16 and quantized perplexity
- the mean change in the probability of the correct token, and percentiles of that change
- the root mean square of that change
- "Same top p", how often both models give the highest probability to the same token

Read the percentiles carefully. The README says that if they "are symmetric then the quantization is essentially just adding noise. If the negative values are significantly larger than the positive values then this indicates that the model is actually becoming worse from the quantization."

## Two builds the metrics rank differently

The README's Llama 3 8B scoreboard (CUDA backend, one RTX 4090) contains this pair:

| Build | PPL | KLD |
|---|---|---|
| q4_0, no importance matrix | 6.700147 ± 0.041226 | 0.071940 ± 0.000491 |
| q3_K_L, Wikitext importance matrix | 6.671223 ± 0.041427 | 0.073077 ± 0.000529 |

By perplexity the 3-bit build looks a little better. By KL divergence it sits a little further from FP16. Look at the uncertainties: the perplexity gap of about 0.03 is smaller than the ±0.04 on each value, while the KL gap of about 0.001 is larger than the ±0.0005 on each. The README notes the metrics can disagree in general too: "K-quants score better on mean Δp than the legacy quants than e.g. KL divergence would suggest."

## The tails carry the damage

The same README compares Llama 2 7B and Llama 3 8B. For Llama 3 8B at q4_K_M, the median change in correct-token probability is -0.024% and the mean is -0.596%. At the 0.1% percentile the change is -56.054%. Most tokens barely move, while one token in a thousand loses more than half its probability. The quantized and FP16 models pick the same top token 91.901% of the time.

The table also shows that the same quantization type affects models differently. Mean KL divergence at q4_K_M is 0.012686 for Llama 2 7B and 0.031273 for Llama 3 8B. Measure each model you ship instead of borrowing another model's results.

## Where this stops

- KL divergence measures distance from the full-precision model. A build can never score better than the original on it, and it is the wrong tool for comparing different fine-tunes.
- You must run the FP16 or BF16 model once and store its logits.
- The saved logits are cast to 16-bit integers to save space. The README's f16 row reflects only that downcast, with a KL divergence of 0.000551. Treat that as the floor of the measurement.
- The README's uncertainty figures assume Gaussian distributions.
- The comparison runs token by token against one base file, so compare builds of the same model, on the same text, against the same logits file.
- The README does not claim that a given KL divergence predicts a given drop on downstream tasks. Pair it with a task evaluation before you ship.
