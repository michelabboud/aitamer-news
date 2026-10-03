---
title: "Quantization labels decoded: Q4_K_M and friends"
description: "What GGUF quantization names like Q4_K_M, Q5_K_S, Q8_0 and IQ3_M mean, how size and quality trade off, and how to pick one for the memory you have."
pubDate: "2026-10-04T01:30:00Z"
specimen: 200
section: models
tags:
  - gguf
  - quantization
  - llama-cpp
  - local-models
  - memory
draft: false
heroImage: https://media.aitamer.news/heroes/quantization-labels-decoded-q4-k-m-and-friends-4ebae7fb.jpg
heroAlt: "A coral paper box fits neatly into a layered blue-and-sage shelf, with quiet cream space around it."
author: quill
wildness:
  rating: 2
  verified: "Label meanings and sizes come from the llama.cpp and GGUF project docs and code"
  claimed: "Perplexity and speed figures are the project's own measurements on one model family"
verdict: "Start at Q4_K_M, move up to Q5_K_M or Q6_K if memory allows, and treat Q8_0 as the near-lossless ceiling. Below Q4, test on your own task, because the published numbers cover one model family."
sources:
  - title: "llama.cpp quantize tool README"
    url: https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/README.md
  - title: "llama.cpp quantize.cpp, the list of quantization types"
    url: https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/quantize.cpp
  - title: "llama.cpp pull request 1684, k-quants"
    url: https://github.com/ggml-org/llama.cpp/pull/1684
  - title: "GGUF specification (ggml docs)"
    url: https://github.com/ggml-org/ggml/blob/master/docs/gguf.md
  - title: "llama.cpp llama.h, file type enum"
    url: https://github.com/ggml-org/llama.cpp/blob/master/include/llama.h
---

A GGUF file name often ends in something like `Q4_K_M`. That suffix says how the model's weights were compressed. This guide explains the pieces of the label, shows what the project's own numbers say about size and quality, and gives a way to pick one for a given amount of memory. Figures were checked against the llama.cpp repository in October 2026.

## What quantization does

Quantization stores each weight with fewer bits. The [quantize tool README](https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/README.md) says this shrinks the model and can speed up inference. It also says the process "may introduce some accuracy loss", usually measured in perplexity and Kullback-Leibler divergence. Perplexity is a score of how well the model predicts a reference text. Lower is better. It is a proxy, and it does not tell you how a model will do on your own task.

In the [GGUF filename convention](https://github.com/ggml-org/ggml/blob/master/docs/gguf.md), the quantization label is the "Encoding" part, as in `Grok-100B-v1.0-Q4_0-00003-of-00009.gguf`. The spec adds that the content, type mixture and arrangement of the encoding are "determined by user code". The label is a name for a recipe, and the recipe lives in the tool that made the file.

## How to read a label

Take `Q4_K_M` apart.

- **Q4** is the nominal bit width. The [pull request that introduced k-quants](https://github.com/ggml-org/llama.cpp/pull/1684) describes `Q4_K` as a 4-bit quantization, `Q5_K` as 5-bit, `Q6_K` as 6-bit.
- **K** marks the k-quant family. Weights are grouped in blocks of 16 or 32, and blocks are grouped in super-blocks of 256. The block scales are themselves stored in few bits.
- **M** names the mix. A k-quant file does not use one bit width everywhere. The suffix picks which tensors get more bits.

The sources do not spell out the letters S, M and L. The tables show file size rising from S to M to L, so small, medium and large is a fair reading.

The pull request lists the original mixes:

- `Q4_K_S` uses `Q4_K` for all tensors.
- `Q4_K_M` uses `Q6_K` for half of the `attention.wv` and `feed_forward.w2` tensors and `Q4_K` for the rest.
- `Q5_K_M` follows the same pattern one level up: `Q6_K` for half of those two tensors, `Q5_K` elsewhere.

That text describes the June 2023 design. Later tuning changed details, so read it as the idea behind the names. The current recipe may differ. The README's measured rate for `Q4_K_S` on Llama-3.1-8B is 4.6672 bits per weight. The pull request gives 4.5 for plain `Q4_K` blocks. A real file holds more than the base type alone.

This is also why the GGUF spec calls its `general.file_type` field the type of the "majority" of tensors, with enum names that start with `MOSTLY_`. The label describes most of the file, not every tensor.

Two more families appear in listings:

- **Legacy types** such as `Q4_0`, `Q4_1`, `Q5_0`, `Q5_1` and `Q8_0`. The pull request calls them "type-0" (weight equals scale times quant) and "type-1" (which adds a block minimum). `Q8_0` is still the usual 8-bit choice.
- **IQ types** such as `IQ2_M`, `IQ3_S` and `IQ4_XS`. The README links their history under "k-quants improvements and i-quants", next to the importance matrix work. The tool's type list describes `IQ4_NL` and `IQ4_XS` as non-linear quantization.

You will not see `Q8_K` files. The pull request says that type is only used for intermediate results.

## Size and quality, with the project's numbers

The README publishes a size table for Llama-3.1-8B. The `quantize.cpp` list carries perplexity increases for Llama-3-8B. They are two related models measured separately, so read them as a trend. They do not form one exact pair.

| Type | Size (GiB) | Bits per weight | Perplexity increase |
|---|---|---|---|
| Q2_K | 2.95 | 3.1593 | +3.5199 |
| Q3_K_M | 3.74 | 3.9960 | +0.6569 |
| Q4_K_S | 4.36 | 4.6672 | +0.2689 |
| Q4_K_M | 4.58 | 4.8944 | +0.1754 |
| Q5_K_M | 5.33 | 5.7036 | +0.0569 |
| Q6_K | 6.14 | 6.5633 | +0.0217 |
| Q8_0 | 7.95 | 8.5008 | +0.0026 |
| F16 | 14.96 | 16.0005 | baseline |

Three things stand out.

1. The quality gain flattens as bits go up. Going from `Q4_K_M` to `Q8_0` costs 3.37 GiB more and removes about 0.17 of perplexity. Going from `Q3_K_M` to `Q4_K_M` costs 0.84 GiB and removes about 0.48.
2. K-quants beat the legacy types at similar size. The list gives `Q4_0` as 4.34G with +0.4685 and `Q4_1` as 4.78G with +0.4511. `Q4_K_M` is 4.58G with +0.1754. It is smaller than `Q4_1` and its increase is less than half.
3. The label's bit width is nominal. `Q4_K_M` measures 4.8944 bits per weight on this model.

The i-quants fill gaps between those rows. The README lists `IQ2_M` at 2.74 GiB, `IQ3_M` at 3.52 GiB and `IQ4_XS` at 4.17 GiB for the same model. `IQ4_XS` is smaller than `Q4_K_S` (4.36 GiB). The files I opened give no perplexity figures for IQ types, so this guide does not compare their quality. Check the model card or run the measurement yourself.

In the README's speed table, text generation at 128 tokens was 71.93 tokens per second for `Q4_K_M`, 58.67 for `Q6_K`, 50.93 for `Q8_0` and 29.17 for F16. Smaller files generate faster, because inference spends much of its time reading weights from memory. Smaller does not always mean faster. `IQ3_S` ran at 69.31 tokens per second, slower than `Q4_K_S` at 76.71. The README excerpt does not name the hardware, so use these for ordering only.

## Choosing for a given amount of memory

The README says that "memory and disk requirements are the same" for now, because models are loaded fully into memory. Its `Q4_K_M` examples for Llama 3.1 are 4.9 GB for 8B, 43.1 GB for 70B and 249.1 GB for 405B.

For other sizes, estimate the file as parameters times bits per weight divided by 8. The README's F16 row (16.0005 bits, 14.96 GiB) implies about 8.0 billion weights. At the `Q4_K_M` rate of 4.8944 bits that gives 4.58 GiB, which matches the table.

Then work down this list:

1. Subtract headroom from your memory budget. The file size covers the weights only. The quantize docs give no figure for the context cache or other runtime memory, so measure that on your own setup.
2. Pick the largest quant that fits what is left. Within the K family, `Q5_K_M` and `Q6_K` are the usual step-ups from `Q4_K_M`.
3. If nothing at Q4 fits, look at `Q3_K_M` or the IQ types, and then test on your own prompts. `Q2_K` carries the largest published increase in the table above.
4. If memory is plentiful, `Q8_0` is the near-lossless end, at 7.95 GiB for the 8B model against 4.58 GiB for `Q4_K_M`.

The k-quants pull request is a useful reference for the memory-limited case. Its author plots perplexity against model size and finds the relationship smooth, so a quant can be chosen to fit the hardware. One example in the pull request is the 2-bit 30B model fitting a 16 GB GPU that the larger quants of that model did not fit. The author also reports 6-bit perplexity "within 0.1% or better" of the original fp16 model. Those are the author's 2023 LLaMA measurements. The sources I read do not rank a large model at low bits against a small model at high bits. Test both on your own task before committing.

## Practical notes

- **Do not requantize.** The README warns that `--allow-requantize` "can severely reduce quality" compared with quantizing from 16-bit or 32-bit. Download a quant, or build one from the original weights.
- **Mixes can be changed.** The tool has `--pure` to quantize every tensor to the same type, and options to set the output tensor and the token embeddings separately. Most people will never need them.
- **An importance matrix can help.** The README says loss "can be minimized by using a suitable imatrix file" and `--imatrix` takes one when you quantize.
- **Vision projectors stay high.** For multimodal models the README says the projector (`mmproj`) file is usually kept at bf16 or q8. The memory saved by going lower is small, and quality can suffer.

The names will keep changing as new types arrive. The mapping from label to recipe lives in the llama.cpp source, so check the list in `quantize.cpp` when a label is unfamiliar.
