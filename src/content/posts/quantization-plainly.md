---
title: "Quantization, plainly: what 16-bit, 8-bit and 4-bit models trade"
description: "A practical guide to model weight precision, memory estimates, common quantization formats, quality checks and choosing a quant for your workload."
pubDate: "2026-09-29T07:00:00Z"
specimen: 48
section: "models"
tags:
  - "quantization"
  - "large-language-models"
  - "inference"
  - "model-evaluation"
draft: false
heroImage: "https://media.aitamer.news/heroes/quantization-plainly.jpg"
heroAlt: "A paper-cut collage of a layered cream-and-slate lion sculpture beside a compact block of tiles, with a coral arrow and cut-paper edges."
author: "ari"
sources:
  - title: "Quantization concepts · Hugging Face Transformers"
    url: "https://huggingface.co/docs/transformers/quantization/concept_guide"
  - title: "Cache strategies · Hugging Face Transformers"
    url: "https://huggingface.co/docs/transformers/kv_cache"
  - title: "GPU memory usage · Hugging Face Transformers"
    url: "https://huggingface.co/docs/transformers/model_memory_anatomy"
  - title: "Selecting a quantization method · Hugging Face Transformers"
    url: "https://huggingface.co/docs/transformers/quantization/selecting"
  - title: "Perplexity of fixed-length models · Hugging Face Transformers"
    url: "https://huggingface.co/docs/transformers/perplexity"
  - title: "Bitsandbytes quantization · Hugging Face Transformers"
    url: "https://huggingface.co/docs/transformers/main/en/quantization/bitsandbytes"
  - title: "GGUF · Hugging Face Hub documentation"
    url: "https://huggingface.co/docs/hub/en/gguf"
  - title: "llama.cpp quantizer source"
    url: "https://github.com/ggml-org/llama.cpp/blob/master/src/llama-quant.cpp"
  - title: "AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration"
    url: "https://arxiv.org/abs/2306.00978"
  - title: "GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers"
    url: "https://arxiv.org/abs/2210.17323"
  - title: "NVFP4 · NVIDIA Transformer Engine documentation"
    url: "https://docs.nvidia.com/deeplearning/transformer-engine/features/low_precision_training/nvfp4/nvfp4.html"
  - title: "Accuracy considerations · NVIDIA TensorRT documentation"
    url: "https://docs.nvidia.com/deeplearning/tensorrt/latest/inference-library/accuracy-considerations.html"
wildness:
  rating: 3
  verified: "General format and evaluation claims are cross-checked against technical documentation."
  claimed: "AWQ, GPTQ and NVFP4 details come from their authors or vendor; no performance result is generalized."
verdict: "Start with the highest precision that fits your serving budget, then compare lower-bit candidates on the exact tasks and runtime you ship."
---

Quantization stores a model's numbers with fewer bits. The usual reason is practical: smaller weights take less storage and can require less memory bandwidth when a model runs, as [Hugging Face's quantization guide](https://huggingface.co/docs/transformers/quantization/concept_guide) explains. The trade-off is approximation. The compressed model may answer differently, and lower precision does not guarantee faster inference on every processor or software stack.

The labels can be confusing because they mix several ideas. A bit width says how many bits encode a value. A numeric format says what values those bits can represent. A quantization method says how the original values are mapped into the smaller format. A file format and an inference engine determine how those values are stored and used.

## The memory estimate starts with the weights

For a model with **N billion parameters**, multiplying parameter count by bits per parameter gives a useful first estimate. In decimal gigabytes, raw weights take about `N × bits ÷ 8` GB:

| Weight precision | Raw weight estimate for N billion parameters |
|---|---:|
| 16-bit | `2N` GB |
| 8-bit | `N` GB |
| 4-bit | `0.5N` GB |

So a hypothetical 10-billion-parameter model has about 20 GB of 16-bit weights, 10 GB at 8 bits, or 5 GB at 4 bits before overhead. These are arithmetic estimates, not a promise about a downloaded file or peak memory.

Real formats can need extra information such as scale values that map small integers back to approximate weights. Some tensors may remain at higher precision, and file metadata also takes space. At runtime, memory is needed for activations and temporary tensors, as [Hugging Face's memory guide](https://huggingface.co/docs/transformers/model_memory_anatomy) describes, and for the key-value (KV) cache that stores attention keys and values. [Hugging Face's cache guide](https://huggingface.co/docs/transformers/kv_cache) says a growing cache can take substantial memory during long-context generation; cache growth also depends on the model and cache strategy. The model weights are only one part of the budget.

## What 16-bit, INT8 and FP8 mean

Sixteen-bit weights commonly use floating-point formats such as FP16 or brain floating point (BF16). Each value gets 16 bits, at a larger memory cost than lower-bit formats. [NVIDIA's format comparison](https://docs.nvidia.com/deeplearning/tensorrt/latest/inference-library/accuracy-considerations.html) says BF16 has a wider range but less precision than FP16, so “16-bit” alone does not say which one a checkpoint uses.

Eight-bit can mean integer quantization (INT8) or an 8-bit floating-point format (FP8). INT8 represents integer values and typically uses scale information to approximate the original weights. FP8 allocates bits between sign, exponent and fraction; the E4M3 and E5M2 variants trade range against precision differently. Neither label tells you whether the method compresses weights alone or also quantizes activations, the intermediate values produced while the network runs.

LLM means large language model. Hugging Face's [bitsandbytes guide](https://huggingface.co/docs/transformers/main/en/quantization/bitsandbytes) describes the LLM.int8() method as keeping certain sensitive computations at higher precision while quantizing other parts. That is one method and implementation; it does not define every INT8 model.

## Four-bit names describe different recipes

Four-bit means each encoded value has 16 possible bit patterns. It does not mean all 4-bit models have the same quality, file size, or hardware requirements. Block quantizers store scaling data alongside the compact values, pushing their effective storage above four bits per weight.

**GGUF Q4_K_M** names a quantization preset for models in the GGUF file format, used by llama.cpp-compatible tools. GGUF is a container for tensors and metadata; the quantization label identifies how weights are represented. Hugging Face's [GGUF documentation](https://huggingface.co/docs/hub/en/gguf) lists the Q4_K tensor type as 4.5 bits per weight, including scale and minimum information. The [llama.cpp quantizer source](https://github.com/ggml-org/llama.cpp/blob/master/src/llama-quant.cpp) shows that its Q4_K_M preset can use Q5_K or Q6_K for selected tensors. Check the actual file rather than treating “Q4” as an exact half-byte-per-parameter size.

**AWQ**, short for Activation-aware Weight Quantization, is a weight-quantization method. Its authors use activation statistics to identify channels where quantization errors matter more, then scale those channels to reduce error. The [AWQ paper](https://arxiv.org/abs/2306.00978) describes this approach for low-bit weight-only quantization. **GPTQ** is another method: it quantizes weights after training while using approximate second-order information to limit the error introduced as weights are processed. The [GPTQ paper](https://arxiv.org/abs/2210.17323) reports experiments on particular models and datasets; those results do not guarantee the same quality for your fine-tuned model or workload.

**NVFP4** is NVIDIA's four-bit floating-point recipe, with one sign bit, two exponent bits and one mantissa bit. NVIDIA's [Transformer Engine documentation](https://docs.nvidia.com/deeplearning/transformer-engine/features/low_precision_training/nvfp4/nvfp4.html) describes block and global scaling. Its PyTorch and JAX examples specify SM100 (Blackwell) hardware or later. Its E2M1 encoding and scaling differ from GGUF's Q4_K integer block format. A matching digit in two format names does not make them interchangeable.

## Quality loss needs a workload-specific check

Quantization changes the numerical values inside a model. Small changes can leave one task looking the same while affecting another. A coding assistant might still complete ordinary functions but make more mistakes on a rare language feature, long context, or strict structured output. There is no single “quality loss” number that captures every use.

**Perplexity** measures how well a causal language model predicts a held-out sequence of tokens; lower is better on the same data and evaluation setup. [Hugging Face's perplexity guide](https://huggingface.co/docs/transformers/perplexity) notes that tokenization and context handling affect the score. Perplexity can spot changes in next-token prediction, but it does not directly measure whether your application follows instructions, calls tools correctly, or produces valid code. The GPTQ paper, for example, describes its dataset, tokenization and context setup when reporting perplexity, which is why results need their evaluation details.

Task evaluations test the behavior you care about: run the same prompts against the original and quantized checkpoints, use fixed decoding settings, and compare outcomes with a suitable rubric or executable checks. For a code tool, that may mean tests that compile and run generated patches. For retrieval-augmented answers, it could mean checking whether answers cite the right evidence. Keep a set of representative and difficult cases, and include regression tests for failure modes that matter to users. [Hugging Face's method guide](https://huggingface.co/docs/transformers/quantization/selecting) recommends benchmarking accuracy and speed on the target task and hardware.

## Choose by fit, then measure

First check what your inference engine and hardware support. If a model fits comfortably at 16-bit, that gives you a useful baseline. If memory is tight, test an 8-bit option. Move to 4-bit when the additional capacity or cost reduction matters enough to justify validating the behavior carefully. These are starting points, not universal rankings.

Compare candidate files from the same base model, with the same tokenizer, prompt template, context length and serving settings. Measure peak memory and tokens per second as well as task quality. Keep the exact model revision and quantizer settings in your notes, because “4-bit” is too vague to reproduce a result.

For most developer workloads, choose the smallest format that passes your task checks and fits with room for the KV cache and runtime overhead. If the 4-bit candidate fails a critical test, the saved memory is not a win. If every candidate passes and 4-bit allows a larger model or more concurrent users, that may be a useful trade. The benchmark for your application is the one that should decide.
