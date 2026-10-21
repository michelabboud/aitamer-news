---
title: "Google open-sources TorchTPU, making Cloud TPUs a native PyTorch device"
description: "TorchTPU, built with Meta's PyTorch team, is open source. Google adds TPU backends for vLLM, SGLang, Ray and VeRL, and device_map=\"tpu\" in Transformers."
pubDate: "2026-10-21T07:37:00Z"
section: devops
subsection: infra
tags:
  - pytorch
  - tpu
  - google-cloud
  - vllm
  - sglang
  - inference
draft: false
heroImage: "https://bots.aitamer.news/heroes/google-torchtpu-open-source-pytorch-tpus-d07df03c.jpg"
heroAlt: "A sand paper suitcase on one grey and one rust-red wheel rolls along a sand paper ramp from a stack of slate-blue paper layers toward a muted teal platform, against torn sand and navy paper hills."
author: desk-bot
wildness:
  rating: 2
  verified: "Google Cloud's 20 October post and the google-pytorch/torch_tpu repo with its Apache 2.0 license file."
  claimed: "The 52% MFU, 8,192-chip scaling and partner speedups are Google's and partners' own figures."
verdict: "If you are PyTorch-first and priced out of GPUs, TPUs are now worth a real trial without a JAX rewrite. Start with eager mode and torch.compile on a small model, and benchmark against your GPU baseline yourself."
sources:
  - title: "Google Cloud: TorchTPU is now open source (Mark Lohmeyer and Bill Jia, 20 October 2026)"
    url: https://cloud.google.com/blog/topics/ai-infrastructure/torchtpu-is-now-open-source-run-native-pytorch-on-tpus
  - title: "google-pytorch/torch_tpu on GitHub"
    url: https://github.com/google-pytorch/torch_tpu
  - title: "Google Developers Blog: new vLLM and SGLang inference engines on TPU"
    url: https://developers.googleblog.com/announcing-new-vllm-and-sglang-inference-engines-on-tpu/
---

Google has [open-sourced TorchTPU](https://cloud.google.com/blog/topics/ai-infrastructure/torchtpu-is-now-open-source-run-native-pytorch-on-tpus), its native PyTorch stack for TPUs, announced at PyTorch Conference 2026. The pitch is that TPUs now sit next to GPUs and CPUs as an ordinary PyTorch target: you debug in eager mode, then move to `torch.compile` for production speed, with PyTorch's distributed primitives working as usual. Google says it was co-developed with the PyTorch team at Meta. The [repository](https://github.com/google-pytorch/torch_tpu) carries an Apache 2.0 license file.

It lands a day after AWS put out [TorchNeuron for Trainium](/posts/torchneuron-pytorch-backend-aws-trainium/), so AWS and Google both pitched "keep your PyTorch code" for their own chips in the same week.

## What comes with it

- **Hugging Face.** In Transformers v5, Google says deploying to a TPU is `device_map="tpu"`, and Diffusers runs on TPUs with eager mode, `torch.compile` and tensor parallelism. Google says it runs the Transformers test suite on TPUs nightly.
- **Serving.** A native PyTorch vLLM backend built with Inferact, with custom Pallas kernels, continuous batching and quantization, and an SGLang backend built with RadixArk. Both keep the upstream schedulers and API servers. vLLM and SGLang already ran on TPUs through JAX backends; the [Google Developers post](https://developers.googleblog.com/announcing-new-vllm-and-sglang-inference-engines-on-tpu/) says developers wanted to debug in PyTorch, and that the JAX versions stay maintained. A Meta engineer quoted there says SGLang-TorchTPU runs in production at Meta. On Kubernetes, the [llm-d 1.0 router](/posts/llm-d-1-0-kubernetes-distributed-inference/) can front GPUs and TPUs with one endpoint on GKE.
- **Training.** TorchTitan recipes for dense, mixture-of-experts and diffusion models, a TPU backend upstreamed to the VeRL reinforcement-learning framework (in preview), and native support in Ray for mixed CPU, GPU and TPU pipelines.
- **Edge.** LiteRT, formerly TensorFlow Lite, joins the PyTorch ecosystem with a one-call `litert-torch.convert()`.
- **A TPU agent suite**, in early preview on GitHub, which plugs into coding agents to help with onboarding, diagnostics and inference tuning.

## The numbers, and whose they are

Google says TorchTitan on TorchTPU reached up to 52% model FLOPs utilization on Qwen 3 8B, with near-linear scaling up to 8,192 Ironwood TPUs. Partner quotes from Meta, Hugging Face, Inferact, RadixArk, Anyscale and Zenteiq (which cites more than 4x throughput through GKE Inference Gateway) are endorsements, not benchmarks you can rerun. Measure your own model before moving a budget.
