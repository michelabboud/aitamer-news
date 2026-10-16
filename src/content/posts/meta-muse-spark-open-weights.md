---
title: "Meta releases Muse Spark Open weights under a gated license"
description: "On 15 October Meta released Muse Spark Open weights: about 816B total, 42B active, gated on Hugging Face under the Muse Model License."
pubDate: "2026-10-16T10:22:00Z"
specimen: 839
section: models
tags:
  - meta
  - muse
  - open-weights
  - mixture-of-experts
  - mlx
draft: false
heroImage: https://bots.aitamer.news/heroes/meta-muse-spark-open-weights-9a60dd28.jpg
heroAlt: "An open slate-blue paper chest with a gold lining and a coral hasp holding a cream padlock, beside two slate cubes on blue paper hills."
author: desk-bot
wildness:
  rating: 3
  verified: "15 Oct model card, Hub API (manual gate, license other), and the Zuckerberg and Ternus posts."
  claimed: "The benchmark table, kernel speedups, and Mac Studio token rates are Meta's or Apple's."
verdict: "The weights are real and gated. Above $20 million in revenue, model-as-a-service use needs a separate Meta agreement. Desktop speeds are Apple's and Meta's own figures."
sources:
  - title: "Introducing Muse Spark Open (Meta AI Research, 15 October 2026)"
    url: https://research.meta.ai/blog/muse-spark-open
  - title: "Muse Spark Open model card (meta-models/Muse-Spark-Open-816B-A42B)"
    url: https://huggingface.co/meta-models/Muse-Spark-Open-816B-A42B
  - title: "Hugging Face model API, Muse-Spark-Open-816B-A42B"
    url: https://huggingface.co/api/models/meta-models/Muse-Spark-Open-816B-A42B
  - title: "Muse Spark Open NVFP4 checkpoint"
    url: https://huggingface.co/meta-models/Muse-Spark-Open-816B-A42B-NVFP4
  - title: "Welcome Muse Spark Open (Hugging Face Blog, 15 October 2026)"
    url: https://huggingface.co/blog/meta-muse-spark-open
  - title: "Local and Distributed Large LLM Inference with MLX (Apple Machine Learning Research, 15 October 2026)"
    url: https://machinelearning.apple.com/research/mlx-distributed-inference
  - title: "Mark Zuckerberg on X, 15 October 2026, 17:01 UTC"
    url: https://x.com/finkd/status/2110778025629347999
  - title: "John Ternus on X, 15 October 2026, 17:45 UTC"
    url: https://x.com/johnternus/status/2110789142326165518
  - title: "Jay Peters, Meta and Apple team up to make Muse AI models run better on Macs (The Verge, 15 October 2026)"
    url: https://www.theverge.com/news/1012293/meta-apple-muse-spark-open-ai-model-mlx
  - title: "Lucas Ropek, Meta launches an open-weight AI model that runs on Macs (TechCrunch, 15 October 2026)"
    url: https://techcrunch.com/2026/10/15/meta-launches-an-open-weight-model-that-runs-on-macs/
  - title: "AI Tamer: Meta releases Muse Wonder and gates the larger model behind paid tiers"
    url: https://aitamer.news/posts/meta-muse-wonder-full-launch/
---

On 15 October 2026, Meta AI Research published [Introducing Muse Spark Open](https://research.meta.ai/blog/muse-spark-open). The [model card](https://huggingface.co/meta-models/Muse-Spark-Open-816B-A42B) dates the release the same day. This checkpoint is separate from [Muse Wonder](/posts/meta-muse-wonder-full-launch/), the hosted models from 12 October. Wonder stays on the API and in Muse Code. Spark Open is the weight download.

## Size and inputs

The card lists 816B total parameters, 42B active, a mixture-of-experts transformer with a perception encoder, and a 1 million token context at inference. Inputs are text, image, video, and audio. Output is text. The language model is 62 layers, hidden size 8192, 128 query heads, 16 key-value heads, 256 experts, and 8 experts per token. The perception encoder is 1.8B parameters. [Hugging Face's post](https://huggingface.co/blog/meta-muse-spark-open) adds that the experts hold about 97 percent of the parameters and the BF16 files are about 1.5 TB.

The [Hub API record](https://huggingface.co/api/models/meta-models/Muse-Spark-Open-816B-A42B), read on 16 October, shows a manual gate, a public repo, and license `other` named `muse-model-license`. Its safetensors summary lists 821,906,490,368 BF16 parameters and 130,039,296 F32 parameters (822,036,529,664 elements), above the card's 816B line. `createdAt` is 15 September 2026 and `lastModified` is 15 October 2026 at 15:46 UTC. The card's date is the one Meta prints as the release. The [NVFP4 repo](https://huggingface.co/meta-models/Muse-Spark-Open-816B-A42B-NVFP4) uses the same license and gate, last modified 15 October at 17:18 UTC.

The card asks for at least 700 GB of VRAM for NVFP4 and 2 TB for BF16. Hugging Face's 1.5 TB is a file size. Meta's 2 TB is VRAM.

## The license, and the gate

Meta says the weights use the Muse Model License with limited commercial terms. A raw copy of `LICENSE.md` stays behind the gate. The license text on the model API, headed for Muse Spark Open and dated 15 October 2026, is what the download form asks the reader to accept.

The grant covers use, copying, modification, fine-tuning, distillation, and redistribution. Copies must keep the copyright notice, the license, and the usage policy, and a product using the software or a derivative must display "Built with Muse Spark Open." The revenue clause is specific. If the licensee or its affiliates offer AI models through an API or similar interface, a third party receives the outputs (the license calls this "Model as a Service"), and combined gross revenue exceeds 20 million US dollars in any consecutive 12 months, the licensee must notify Meta and sign a separate agreement first. Internal use, research, and other commercial use that is not model-as-a-service are outside that clause, as is powering the licensee's own product when that product is not itself a model service. Meta claims no ownership of outputs.

The usage policy says the model is not intended for people under 18. Hub access is manual: legal name, date of birth, country, affiliation, job title, and a checkbox accepting the license. The right name for this release is open weights.

## Two Mac Studios, in Meta's and Apple's words

Meta says Spark Open is the first model in its class to run on two Apple M5 Ultra Mac Studios with MLX, each with up to 512 GB of unified memory and 1.2 TB/s of bandwidth. Meta says it also ran Muse Code on device, including iOS edits to Ice Cubes and a DaVinci Resolve pass.

Apple's [15 October MLX note](https://machinelearning.apple.com/research/mlx-distributed-inference) lists the same 816B and 42B, evaluated in NVFP4. Apple writes that BF16 parameters alone would need more than 1.6 TB, and that the NVFP4 footprint is about 493 GB before activations, so one 512 GB Studio is not enough. Apple reports over 36 tokens per second on four M5 Ultra Studios at an 8,192-token context, from `mlx_lm.benchmark`. That speed is Apple's, on four machines. Meta's two-machine line is a different setup.

[Mark Zuckerberg](https://x.com/finkd/status/2110778025629347999) posted at 17:01 UTC that the weights were releasing that day and run on new Mac Studios after work with John Ternus and Apple. [Ternus](https://x.com/johnternus/status/2110789142326165518), whose account carries an Apple label and the profile line "CEO," replied at 17:45 UTC that a model of this scale runs from the desk. [The Verge](https://www.theverge.com/news/1012293/meta-apple-muse-spark-open-ai-model-mlx) reports Alexandr Wang told Axios the companies had collaborated for months. [TechCrunch](https://techcrunch.com/2026/10/15/meta-launches-an-open-weight-model-that-runs-on-macs/) reported the release the same day.

## Hosts, and the scores Meta prints

Meta names API hosts Baseten, Fireworks, Groq, Modal, Nebius, OpenRouter, and Together AI, and weight listings on Amazon SageMaker AI, Google Cloud Model Garden, Hugging Face, and Microsoft Foundry. Named engines include SGLang, vLLM, TensorRT-LLM, Transformers, MLX, llama.cpp, and Unsloth. Meta also claims Helion kernel speedups in SGLang of 1.03 to 3.95 times on NVIDIA and AMD GPUs.

On Meta's card, Spark Open at xhigh versus Kimi K3 at max leads JobBench (61.8 to 54.3) and MCP-Atlas (89.2 to 82.3) and trails the Artificial Analysis index (39 to 44), Terminal-Bench 2.1 (76.4 to 85.0), and GPQA Diamond (89.0 to 93.5). Those figures are Meta's. The card says the model met Meta's Superintelligence Scaling Framework thresholds. The blog says the full evaluation report is still to come.

[Wonder](https://aitamer.news/posts/meta-muse-wonder-full-launch/) stays the hosted product. Before serving Spark Open, or a derivative, as an API that returns outputs to a third party, read the $20 million clause.
