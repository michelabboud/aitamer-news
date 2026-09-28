---
title: "A field guide to ten open-weight model families"
description: "Who makes ten open-weight model families, what licenses their representative checkpoints carry, and what their model cards say they are built to do."
pubDate: "2026-10-02T07:00:00Z"
specimen: 66
section: "models"
tags: ["open-weights", "model-families", "licensing", "llms", "multimodal"]
draft: false
heroImage: "https://media.aitamer.news/heroes/open-weight-model-families.jpg"
heroAlt: "A paper-cut collage of cream paths branching between layered slate-blue paper shapes, with one coral circle at the center."
author: "ari"
sources:
  - title: "DeepSeek-V3.2 model card and license"
    url: "https://huggingface.co/deepseek-ai/DeepSeek-V3.2"
  - title: "DeepSeek-V3.2 MIT license"
    url: "https://huggingface.co/deepseek-ai/DeepSeek-V3.2/blob/main/LICENSE"
  - title: "Qwen3.5-397B-A17B model card"
    url: "https://huggingface.co/Qwen/Qwen3.5-397B-A17B"
  - title: "Qwen team and Alibaba Group"
    url: "https://github.com/QwenLM/Qwen3/blob/main/docs/source/index.rst"
  - title: "Qwen3.5-397B-A17B license"
    url: "https://huggingface.co/Qwen/Qwen3.5-397B-A17B/blob/main/LICENSE"
  - title: "GLM-5 model card"
    url: "https://huggingface.co/zai-org/GLM-5"
  - title: "Kimi-K2.6 model card"
    url: "https://huggingface.co/moonshotai/Kimi-K2.6"
  - title: "Kimi-K2.6 license"
    url: "https://huggingface.co/moonshotai/Kimi-K2.6/blob/main/LICENSE"
  - title: "MiniMax-M2.5 model card"
    url: "https://huggingface.co/MiniMaxAI/MiniMax-M2.5"
  - title: "MiniMax-M2.5 model license"
    url: "https://huggingface.co/MiniMaxAI/MiniMax-M2.5/blob/main/LICENSE-MODEL"
  - title: "Mistral Large 3 model card"
    url: "https://huggingface.co/mistralai/Mistral-Large-3-675B-Instruct-2512"
  - title: "Meta Llama 4 model card"
    url: "https://github.com/meta-llama/llama-models/blob/main/models/llama4/MODEL_CARD.md"
  - title: "Llama 4 Community License Agreement"
    url: "https://github.com/meta-llama/llama-models/blob/main/models/llama4/LICENSE"
  - title: "Gemma 4 model card"
    url: "https://huggingface.co/google/gemma-4-12B"
  - title: "OpenAI gpt-oss-120b model card"
    url: "https://huggingface.co/openai/gpt-oss-120b"
  - title: "OpenAI gpt-oss-120b Apache 2.0 license"
    url: "https://huggingface.co/openai/gpt-oss-120b/blob/main/LICENSE"
  - title: "NVIDIA Nemotron-3-Super model card"
    url: "https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-FP8"
  - title: "Open Source AI Definition 1.0"
    url: "https://opensource.org/ai/open-source-ai-definition"
wildness:
  rating: 4
  verified: "Checkpoint identities and posted license labels match the cited maker repositories."
  claimed: "Each family's stated strengths and intended uses come from its maker."
verdict: "Pick a checkpoint for its task and license, then test it on your workload; a family name alone tells you too little."
---

“Open-weight” tells you that trained model parameters are available. It does not by itself tell you what you may do with them, what code or training information is available, or whether the release meets a formal definition of open-source artificial intelligence. The [Open Source Initiative’s definition](https://opensource.org/ai/open-source-ai-definition) includes training-data information and code alongside weights. For developers, the practical first checks are narrower: find the exact checkpoint, read its license, and treat capability summaries as the maker’s claims.

This is a dated field guide, **as of September 2026**. Each row names one representative checkpoint because a family can contain checkpoints with different licenses and capabilities. The task descriptions summarize what the maker says in that checkpoint’s model card; they are not an independent ranking. Licenses below are labels and terms as posted by their makers, not legal advice.

## Ten families at a glance

| Family and maker | Representative checkpoint and posted license | What the maker says it is for |
|---|---|---|
| [DeepSeek, DeepSeek-V3.2](https://huggingface.co/deepseek-ai/DeepSeek-V3.2) | [MIT License](https://huggingface.co/deepseek-ai/DeepSeek-V3.2/blob/main/LICENSE) | DeepSeek presents it as a reasoning and agentic model, highlighting its sparse-attention approach for long contexts. |
| [Qwen, Alibaba Group’s Qwen team](https://github.com/QwenLM/Qwen3/blob/main/docs/source/index.rst), [Qwen3.5-397B-A17B](https://huggingface.co/Qwen/Qwen3.5-397B-A17B) | [Apache License 2.0](https://huggingface.co/Qwen/Qwen3.5-397B-A17B/blob/main/LICENSE) | Its card describes multimodal text-and-image input, with examples for processing an image alongside a prompt. |
| [GLM, Z.ai, GLM-5](https://huggingface.co/zai-org/GLM-5) | [MIT](https://huggingface.co/zai-org/GLM-5) | Z.ai targets complex systems engineering and long-horizon agent tasks. |
| [Kimi, Moonshot AI, Kimi K2.6](https://huggingface.co/moonshotai/Kimi-K2.6) | [Modified MIT License](https://huggingface.co/moonshotai/Kimi-K2.6/blob/main/LICENSE) | Moonshot describes native multimodal support, long-horizon coding, autonomous execution, and swarm-style task orchestration. |
| [MiniMax, MiniMax AI, MiniMax-M2.5](https://huggingface.co/MiniMaxAI/MiniMax-M2.5) | [MiniMax Model License](https://huggingface.co/MiniMaxAI/MiniMax-M2.5/blob/main/LICENSE-MODEL); the repository also labels it “modified-MIT.” | MiniMax highlights coding, tool use, search, and office work. These are the company’s own descriptions and reported evaluations. |
| [Mistral, Mistral AI, Mistral Large 3 Instruct](https://huggingface.co/mistralai/Mistral-Large-3-675B-Instruct-2512) | [Apache License 2.0](https://huggingface.co/mistralai/Mistral-Large-3-675B-Instruct-2512) | Mistral describes a general-purpose multimodal model with vision, multilingual text, function calling, and structured output. |
| [Llama, Meta, Llama 4 Scout](https://github.com/meta-llama/llama-models/blob/main/models/llama4/MODEL_CARD.md) | [Llama 4 Community License Agreement](https://github.com/meta-llama/llama-models/blob/main/models/llama4/LICENSE), which incorporates an acceptable-use policy. | Meta describes native text-and-image understanding, visual reasoning, and a long context window. |
| [Gemma, Google DeepMind, Gemma 4 12B Unified](https://huggingface.co/google/gemma-4-12B) | [Apache License 2.0](https://huggingface.co/google/gemma-4-12B) | Google DeepMind describes text, image, audio, and video input for this unified variant; modalities differ across Gemma 4 sizes. |
| [gpt-oss, OpenAI, gpt-oss-120b](https://huggingface.co/openai/gpt-oss-120b) | [Apache License 2.0](https://huggingface.co/openai/gpt-oss-120b/blob/main/LICENSE) | OpenAI presents the series for reasoning and agentic tasks, with configurable reasoning effort and support for tool use. |
| [Nemotron, NVIDIA, Nemotron-3-Super-120B-A12B-FP8](https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-FP8) | [NVIDIA Nemotron Open Model License](https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-FP8) | NVIDIA positions Super for agent workflows, long-context reasoning, tool use, and retrieval-augmented generation (RAG). |

## Read the license attached to the checkpoint

The labels in the table are not interchangeable. Apache 2.0 and MIT are familiar software licenses, while “modified MIT,” a vendor model license, or a community license may add terms specific to model use or redistribution. The label in a model repository is a useful pointer, not a substitute for reading the license file and any linked policies.

MiniMax is a useful example of why the actual terms matter: the M2.5 repository carries a “modified-MIT” tag, while its included license file is titled “MiniMax Model License.” It sets out attribution, redistribution, and prohibited-use conditions. Meta’s Llama 4 uses a custom community agreement and acceptable-use policy. NVIDIA’s Nemotron checkpoint points to NVIDIA’s own model license. Read these documents before choosing a model for a product, especially if you redistribute weights or serve customers.

Apache 2.0 or MIT in a model card does not settle every question about a release. It tells you the posted license for that checkpoint. It does not establish what training data was used or whether a release satisfies the Open Source Initiative’s broader definition. The initiative defines open-source AI to include the code and information needed to understand how training data was prepared, as well as parameters. Checkpoint availability and training transparency are separate facts.

## Turn “known for” into a test plan

Model cards are useful for forming hypotheses. They are written or adopted by the organizations releasing the models, and some of their descriptions are promotional. In the table, “reasoning,” “agentic,” “coding,” “multimodal,” and “long context” should be read as task areas the maker emphasizes, not guarantees that one family will win your evaluation.

Translate the terms into a small evaluation set from your own application. For a coding assistant, use representative bug reports, code changes, and repository questions. For a tool-using workflow, measure whether it calls the right tool, passes valid arguments, and recovers from tool errors. For a vision feature, use the actual document or screenshot types your users provide. Keep the prompt, tools, and scoring rubric stable when comparing checkpoints.

Also check what the word “multimodal” means for the specific variant. A model may accept images but return only text; another size in the same family may add audio or video. A family label is not an application programming interface (API) specification. Verify the model card, chat template, supported inputs, and serving stack for the exact checkpoint you plan to run.

## Choose by task, terms, and deployment fit

Start with your task and shortlist two or three checkpoints whose cards point in the right direction. Remove any whose license or redistribution terms do not fit your product. Then compare quality, latency, operating cost, hardware, language coverage, and tool-call reliability in your own setup. For a hosted service, also assess where prompts and outputs are stored and processed.

The best starting point is the smallest candidate that meets your measured quality bar and whose terms you can follow. Keep the model card and license for the exact revision beside your evaluation results: family names help you navigate, but a deployed checkpoint is what your code and legal review actually depend on.
