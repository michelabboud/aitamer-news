---
title: "Choosing a local runtime for open-weight models: llama.cpp, Ollama, vLLM, and LM Studio"
description: "A practical guide to choosing a local model runtime, understanding GGUF and memory needs, and deciding when a desktop setup is enough or a server makes sense."
pubDate: "2026-09-28T21:00:00Z"
specimen: 47
section: "models"
tags: ["open-weights", "local-inference", "llama-cpp", "ollama", "vllm", "gguf"]
draft: false
heroImage: "https://media.aitamer.news/heroes/running-open-weight-models-locally.jpg"
heroAlt: "A paper-cut collage of an abstract model block fitting into a small desktop computer, with layered memory trays and a coral paper stream connecting them."
author: "ari"
sources:
  - title: "Open Source Initiative on open weights"
    url: "https://opensource.org/ai/open-weights"
  - title: "Hugging Face model license guidance"
    url: "https://huggingface.co/docs/hub/repositories-licenses"
  - title: "llama.cpp README"
    url: "https://github.com/ggml-org/llama.cpp/blob/master/README.md"
  - title: "llama.cpp server documentation"
    url: "https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md"
  - title: "llama.cpp multi-GPU guide"
    url: "https://github.com/ggml-org/llama.cpp/blob/master/docs/multi-gpu.md"
  - title: "llama.cpp maintainer on memory allocations"
    url: "https://github.com/ggml-org/llama.cpp/discussions/9936"
  - title: "Ollama Quickstart"
    url: "https://github.com/ollama/ollama/blob/main/docs/quickstart.mdx"
  - title: "Ollama API introduction"
    url: "https://github.com/ollama/ollama/blob/main/docs/api/introduction.mdx"
  - title: "Ollama GPU support"
    url: "https://github.com/ollama/ollama/blob/main/docs/gpu.mdx"
  - title: "vLLM Quickstart"
    url: "https://docs.vllm.ai/en/latest/getting_started/quickstart/"
  - title: "vLLM OpenAI-compatible server"
    url: "https://docs.vllm.ai/en/latest/serving/online_serving/openai_compatible_server/"
  - title: "LM Studio as a Local LLM API Server"
    url: "https://lmstudio.ai/docs/developer/core/server"
  - title: "LM Studio, llmster, and lms"
    url: "https://lmstudio.ai/docs/app/basics/lmstudio-vs-llmster-vs-lms"
  - title: "GGUF file format"
    url: "https://github.com/ggml-org/ggml/blob/master/docs/gguf.md"
  - title: "Hugging Face quantization overview"
    url: "https://huggingface.co/docs/transformers/quantization/overview"
  - title: "Hugging Face quantization concepts"
    url: "https://huggingface.co/docs/transformers/quantization/concept_guide"
  - title: "Hugging Face key-value cache guide"
    url: "https://huggingface.co/docs/transformers/kv_cache"
  - title: "Apple on unified memory in Apple silicon Macs"
    url: "https://developer.apple.com/videos/play/wwdc2020/10686/"
  - title: "Apple Activity Monitor memory guide"
    url: "https://support.apple.com/en-au/guide/activity-monitor/-actmntr1004/mac"
wildness:
  rating: 4
  verified: "Open-weight terminology and memory basics checked against OSI, Hugging Face, and Apple."
  claimed: "Runtime capabilities rely on maintainer documentation; no hands-on comparison was performed."
verdict: "Start with a desktop runtime for exploration; move to a serving-focused stack when concurrency, deployment, or hardware control becomes a real requirement."
---

Running a model on your own machine can mean a chat window on a laptop, a local API for an application, or an inference service used by a team. Those are different jobs. The same model may run in each setting, but the useful choice is the runtime that fits the job and the memory you can give it.

“[Open weights](https://opensource.org/ai/open-weights)” means you can obtain a model’s learned parameters. It does not guarantee that its training data, code, or license is open, or that every use is permitted. Check the model’s [license and terms](https://huggingface.co/docs/hub/repositories-licenses) before building a product around it.

## Choose the job before the runtime

For trying models interactively on a personal computer, a desktop application removes setup steps. For connecting your own code to a model on the same machine, a local server with an application programming interface (API) is usually enough. For a service with multiple users, predictable throughput, and deployment controls, use a serving stack designed around that role.

An API-compatible endpoint can make an existing client easier to reuse. [Features and request parameters can differ](https://docs.vllm.ai/en/latest/serving/online_serving/openai_compatible_server/). Test the exact calls your application depends on before treating a local server as a drop-in replacement.

## What the four runtimes are for

[llama.cpp's README](https://github.com/ggml-org/llama.cpp/blob/master/README.md) describes a C/C++ inference engine with command-line and server modes. It lists CPU and several accelerator backends, including Metal on Apple silicon and CUDA for NVIDIA GPUs, plus CPU/GPU hybrid inference. This makes it a choice when you want to control model files, quantization, and hardware use, or run a small local API. Its [server guide](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md) lists localhost as the default listening address. Exposing it to a network requires thinking about access controls and deployment, rather than assuming a local default is safe for a shared service.

[Ollama's quickstart](https://github.com/ollama/ollama/blob/main/docs/quickstart.mdx) shows a command-line workflow that downloads a model and starts a chat. Its [API documentation](https://github.com/ollama/ollama/blob/main/docs/api/introduction.mdx) describes a local server for applications. The quickstart lists macOS, Windows, and Linux downloads. Choose it when you want a short path from model selection to experimentation without assembling the inference stack yourself. Hardware support depends on the platform and installed backend; Ollama documents GPU acceleration and supported options in its [GPU guide](https://github.com/ollama/ollama/blob/main/docs/gpu.mdx).

[LM Studio's documentation](https://lmstudio.ai/docs/app/basics/lmstudio-vs-llmster-vs-lms) describes a desktop application for finding, loading, and chatting with local models. Its [server guide](https://lmstudio.ai/docs/developer/core/server) describes a local API server, including OpenAI-compatible endpoints. The company's documentation says its command-line tool, `lms`, manages models and starts the server. LM Studio also documents a headless daemon for machines where a graphical desktop is not practical. Pick it when a graphical workflow is useful for comparing models and settings, while keeping an API path available for development.

[vLLM's quickstart](https://docs.vllm.ai/en/latest/getting_started/quickstart/) describes an HTTP inference server with OpenAI-compatible endpoints; its [server guide](https://docs.vllm.ai/en/latest/serving/online_serving/openai_compatible_server/) lists supported routes and limitations. Consider it when you need to serve requests to an application or multiple users and want a stack built around serving. Check its current hardware and supported-model requirements before choosing a machine.

These roles overlap. Each project documents a server workflow; LM Studio documents a headless option; vLLM's quickstart includes local development. Your boundary is operational: who starts it, who can reach it, what happens after restart, and how you monitor and secure it.

## Understand the model file and memory budget

[GGUF](https://github.com/ggml-org/ggml/blob/master/docs/gguf.md) is a binary format for storing models for inference with GGML-based software. It can bundle tensor data with metadata and vocabulary information. The llama.cpp README uses a GGUF model in its quickstart. Confirm that the runtime supports the model architecture and file format before downloading a large checkpoint.

Model files are often [quantized](https://huggingface.co/docs/transformers/quantization/overview): weights are represented with fewer bits to reduce their storage and memory cost. Quantization can make a model fit on a smaller machine. Its effect on accuracy and speed depends on the [method and hardware](https://huggingface.co/docs/transformers/quantization/concept_guide). File size is a rough starting point for weight memory, as a [llama.cpp maintainer explains](https://github.com/ggml-org/llama.cpp/discussions/9936). It is not a complete hardware requirement.

The runtime also needs memory for the active context: the prompt and generated tokens the model is handling. The [key-value (KV) cache](https://huggingface.co/docs/transformers/kv_cache) stores intermediate attention data for that context. Longer context and simultaneous requests can increase this working memory, as the [llama.cpp guide](https://github.com/ggml-org/llama.cpp/blob/master/docs/multi-gpu.md) notes. [Compute buffers](https://github.com/ggml-org/llama.cpp/discussions/9936) need room too. A model that barely fits by file size may fail to load, slow down, or leave too little space for a useful context.

With a discrete graphics processing unit (GPU), model layers can be placed in video random-access memory (VRAM), the GPU’s dedicated memory. If the full working set does not fit, llama.cpp can keep some layers in system memory; its [guide warns](https://github.com/ggml-org/llama.cpp/blob/master/docs/multi-gpu.md) that running those layers on the CPU can be much slower. With Apple silicon, the GPU and CPU share a unified memory pool, as [Apple explains](https://developer.apple.com/videos/play/wwdc2020/10686/). The operating system and other applications also use memory, so [total installed memory](https://support.apple.com/en-au/guide/activity-monitor/-actmntr1004/mac) is not all available to the model.

## A practical way to choose

Start by writing down the model, the longest context you expect, whether one person or multiple requests will use it, and whether the machine is a laptop or a server. Then choose a quantized model format supported by the runtime and leave memory headroom for context and other processes. Do not buy hardware from a parameter-count rule of thumb alone; measure the model and request shape you intend to use.

For a first local experiment, use LM Studio if you want a graphical model browser, or Ollama if you prefer a concise command-line workflow. Choose llama.cpp when you want explicit control over supported hardware, quantization, and CPU/GPU placement. Choose vLLM when the main task is hosting an API for application traffic and its model and hardware requirements fit your environment.

Before you integrate a runtime, try representative prompts, your expected context length, and the number of concurrent users you need. Record whether the model loads, response latency, memory use, and output quality on your own tasks. Keep the server bound to localhost while developing; if you need other machines to reach it, configure and verify authentication and network exposure deliberately. Pick the simplest runtime that meets the measured requirement, then revisit the choice when usage shows a need to move.
