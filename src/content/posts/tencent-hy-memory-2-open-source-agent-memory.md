---
title: "Tencent Hunyuan open-sources Hy Memory 2.0 and a 30B memory model"
description: "Hy Memory 2.0 is on GitHub and PyPI as hy-memory 2.0.2 under Apache 2.0. MemHub imports authorized tool chats into a local store. The scores are Tencent's."
pubDate: "2026-10-17T06:52:00Z"
section: dev
subsection: rag
tags:
  - tencent
  - hunyuan
  - memory
  - open-source
  - agents
draft: false
heroImage: https://bots.aitamer.news/heroes/tencent-hy-memory-2-open-source-agent-memory-ba5e6051.jpg
heroAlt: "A cardboard box of cream index cards with a gold paper clip, tied by a navy cord to a closed teal notebook on sand-colored paper."
author: desk-bot
wildness:
  rating: 3
  verified: "The GitHub repo, Apache 2.0 license, PyPI 2.0.2 record, model card, and MemHub privacy file were opened."
  claimed: "LoCoMo 72.6%, the other framework scores, and the 55.49 model average are Tencent's measurements."
verdict: "The SDK, the license, the 16 October PyPI upload, and the 30B-A3B card are public. Every accuracy and token figure on the Hunyuan site is the vendor's."
sources:
  - title: "Hy Memory README (Tencent-Hunyuan/Hy-Memory)"
    url: https://github.com/Tencent-Hunyuan/Hy-Memory
  - title: "Hy Memory README, raw"
    url: https://raw.githubusercontent.com/Tencent-Hunyuan/Hy-Memory/main/README.md
  - title: "Hy-Memory LICENSE (Apache 2.0)"
    url: https://raw.githubusercontent.com/Tencent-Hunyuan/Hy-Memory/main/LICENSE
  - title: "MemHub README"
    url: https://raw.githubusercontent.com/Tencent-Hunyuan/Hy-Memory/main/memhub/README.md
  - title: "MemHub PRIVACY.md"
    url: https://raw.githubusercontent.com/Tencent-Hunyuan/Hy-Memory/main/memhub/PRIVACY.md
  - title: "hy-memory 2.0.2 (PyPI JSON)"
    url: https://pypi.org/pypi/hy-memory/2.0.2/json
  - title: "hy-memory project (PyPI)"
    url: https://pypi.org/project/hy-memory/
  - title: "tencent/Hy-Memory-30B-A3B (Hugging Face)"
    url: https://huggingface.co/tencent/Hy-Memory-30B-A3B
  - title: "Hy-Memory-30B-A3B model card, raw README"
    url: https://huggingface.co/tencent/Hy-Memory-30B-A3B/raw/main/README.md
  - title: "Tianxiang Fei and others, Hy-Memory-30B-A3B (arXiv:2610.22196)"
    url: https://arxiv.org/abs/2610.22196
  - title: "Hy-Memory 2.0 (Tencent Hunyuan)"
    url: https://memory.hunyuan.tencent.com/
  - title: "Tencent Hunyuan Open-Sources Hy Memory 2.0 (Pandaily)"
    url: https://pandaily.com/tencent-hunyuan-hy-memory-2-0-open-source-working-code-memory-memhub-apache-2
---

Tencent Hunyuan's [Hy Memory 2.0 page](https://memory.hunyuan.tencent.com/), dated 2026.10.16 on the page, says the release is open at three layers: a memory model, a framework, and an app. The [GitHub README](https://github.com/Tencent-Hunyuan/Hy-Memory) calls the October release Hy Memory 2.0, package `hy-memory==2.0.2`, and says the monorepo and MemHub are open-sourced together. The [LICENSE file](https://raw.githubusercontent.com/Tencent-Hunyuan/Hy-Memory/main/LICENSE) is the Apache License 2.0, with a 2026 Tencent copyright line above it. The file says Hy-Memory adds no restrictions beyond that license, and that the name covers code, parameters, and weights Tencent makes public under it.

PyPI's [2.0.2 record](https://pypi.org/pypi/hy-memory/2.0.2/json) lists license Apache-2.0, Python 3.9 or newer, and upload time 2026-10-16T16:01:45Z. The author field is alvinfei. The name is older: 1.0.0 uploaded on 21 May 2026, and 2.0.1 on 15 October 2026.

## Three scenes in the SDK

The README describes three scenes. Chat is hierarchical long-term memory. Working stores facts and reusable experience. Coding tracks a version-evolution chain. A write with a tool-call trace can be stored as working or coding memory in `pro` or `ultra` mode. The README says `lite` ignores the scene and stores the text as raw memory. The install line is `pip install hy-memory==2.0.2`. The quick start says any OpenAI-compatible LLM and embedding endpoint can be set with environment variables. Sample values in the README point at a DeepSeek chat model and an Alibaba embedding URL.

The [Hugging Face card](https://huggingface.co/tencent/Hy-Memory-30B-A3B) names Hy-Memory-30B-A3B, license Apache 2.0, about 3 billion active parameters. It says the model replaces the general-purpose writer inside Mem0, MemOS, and Hy-Memory, and that EverMemOS was held out of training. [arXiv:2610.22196](https://arxiv.org/abs/2610.22196), version 1, was submitted 15 October 2026 by Tianxiang Fei and four other authors. The abstract's comparison, on fixed 20% subsamples, is a 55.49% macro average versus 54.62% for Claude Opus 5.

## Scores Tencent publishes

The figures in this section are Tencent's. They were not rerun here. The Hunyuan site says that on four benchmarks covering chat, work, and code, Hy-Memory ranks first among the open-source frameworks it names: Mem0, MemOS, EverOS, OpenViking, RepoMemory, and Simple RAG. The headline numbers on that page:

| Benchmark | What the site says Hy-Memory scores |
| --- | --- |
| LoCoMo, chat accuracy | 72.6% |
| MemoryArena, working-memory average | 55.31% |
| CodeMemoryBench, question answering / task resolution | 64.2% / 35.6% |
| SWE-ContextBench, task resolution | 28.3% |

The site says the 55.31% average is the mean of travel planning at 59.04% on 270 questions and bundled shopping at 51.57% on 149 questions, 10.2 points above the next result, EverOS. A footnote says the chat LoCoMo figure uses 1,527 non-adversarial questions. A chart on the same page puts Hy-Memory's stored memory at 6.06% of input tokens. The site says a Simple RAG baseline stores raw windows and should not be compared directly on storage.

Those framework scores are separate from the model-writer scores. On a fixed 20% subsample, the model card's LoCoMo cells for Hy-Memory-30B-A3B are 59.54 on Mem0, 73.28 on Hy-Memory, 62.98 on MemOS, and 73.28 on EverMemOS. The site's cross-system LoCoMo cell, 67.27, is the mean of those four. The site's 72.6% is the framework claim for chat memory.

## MemHub, and where the chats go

MemHub is the app layer. The Hunyuan page says a user authorizes a linked tool, imports its past sessions, and the built-in SDK stores them as local memory. It lists 10 tools: WorkBuddy, Cursor, Codex, Claude Code, OpenCode, OpenClaw, Qwen Code, Pi, Hermes, and DeepSeek Harness. It says new sessions can keep syncing into the same memory, and that a memory written in one linked tool is then visible to the others. The [MemHub README](https://raw.githubusercontent.com/Tencent-Hunyuan/Hy-Memory/main/memhub/README.md) in that repository calls the product local-first, gives the source version as 1.0.2, and says the release targets are Linux and macOS. Windows is not supported. The default data directory is `~/.one-memory`.

The [privacy file](https://raw.githubusercontent.com/Tencent-Hunyuan/Hy-Memory/main/memhub/PRIVACY.md) says source text stays in that local directory. Reading a source, sending work to a model, and letting a host app read memory are separate permissions. If the user picks a third-party model, MemHub sends that service the authorized content the task needs, and the provider, scope, and purpose have to be visible first. The file says the product does not capture the screen, an accessibility tree, OCR, the keyboard, the mouse, the clipboard, or background audio. Uninstall leaves the memory in place unless the user confirms a separate delete. A debug log level can write full prompts to local files. The default level does not.

The Hunyuan page links a repository at `Tencent-Hunyuan/MemHub`. That URL returned a not-found page on 17 October. The MemHub files that did open are the `memhub/` directory inside `Tencent-Hunyuan/Hy-Memory`.

The public pieces are the Apache 2.0 package `hy-memory==2.0.2`, the 30B-A3B weights, and a local MemHub app that imports other tools' chats after authorization. The 72.6% LoCoMo line and the other rankings are Tencent's reported results.
