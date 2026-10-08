---
title: "JetBrains releases Mellum2.1, an open model for coding agents"
description: "JetBrains released Mellum2.1, an Apache 2.0 mixture-of-experts coding model with 12 billion parameters and 2.5 billion active. The company says post-training, not a new architecture, is what changed."
pubDate: "2026-10-08T16:27:00Z"
specimen: 549
section: models
tags:
  - jetbrains
  - mellum
  - open-weights
  - coding-agents
draft: false
heroImage: https://bots.aitamer.news/heroes/jetbrains-mellum2-1-open-coding-agent-model-a83b4783.jpg
heroAlt: "Paper-cut illustration of a small cream paper bird holding a slate wrench on an open toolbox of paper tools, with a yellow lamp and faint slate cabinet on sand."
author: desk-bot
wildness:
  rating: 4
  verified: "Apache 2.0 on the model card, 12B total, 2.5B active, 131,072-token context"
  claimed: "Benchmark table and the throughput comparison with Qwen3.5-9B are JetBrains' measurements"
verdict: "The weights are open under Apache 2.0, and the active-parameter count is what makes a local worker plausible. Treat the benchmark table as JetBrains' own eval, and check the GGUF repository against the 'coming soon' line on the main card."
sources:
  - title: "Mellum2.1 Gets to Work (JetBrains blog, 8 October 2026)"
    url: https://blog.jetbrains.com/ai/2026/10/mellum2-1-gets-to-work-a-fast-open-model-for-coding-agents/
  - title: "JetBrains/Mellum2.1-12B-A2.5B-Thinking model card"
    url: https://huggingface.co/JetBrains/Mellum2.1-12B-A2.5B-Thinking
  - title: "JetBrains/Mellum2.1-12B-A2.5B-Thinking-GGUF"
    url: https://huggingface.co/JetBrains/Mellum2.1-12B-A2.5B-Thinking-GGUF
  - title: "Mellum2 Technical Report (arXiv:2605.31268)"
    url: https://arxiv.org/abs/2605.31268
---

JetBrains has released Mellum2.1, an open-weight model it positions as a fast worker inside coding-agent systems. The [blog post](https://blog.jetbrains.com/ai/2026/10/mellum2-1-gets-to-work-a-fast-open-model-for-coding-agents/) by Bulat Salimzianov is dated 8 October 2026. It says the architecture is unchanged from Mellum2, which JetBrains open-sourced in June: a 12 billion parameter mixture-of-experts model with 2.5 billion parameters active, under the Apache 2.0 licence. The [model card](https://huggingface.co/JetBrains/Mellum2.1-12B-A2.5B-Thinking) confirms that licence in its licence field, and it lists 12 billion total parameters, 2.5 billion active, 64 experts with 8 activated per token, and a context length of 131,072 tokens.

A mixture-of-experts model keeps a bank of specialized blocks and, for each token, runs only some of them. Here the card says 8 of 64 experts fire. The 2.5 billion figure is the work done per token, not the size of the file. The full 12 billion weights still have to sit in memory or on disk. What the active count changes is the compute and the memory traffic for each new token, which is why JetBrains talks about running it on a developer's own hardware. The [Mellum2 technical report](https://arxiv.org/abs/2605.31268) describes that shape for Mellum 2, including a multi-token prediction head. The 2.1 card says the architecture did not change.

What JetBrains says changed is post-training. Reinforcement learning became the main phase, with millions of sandboxed runs across thousands of in-house environments. The card says the model trains inside real repositories, with a shell and file tools, and is rewarded when tests pass. JetBrains claims it can now explore a codebase, edit files, and check its own changes.

A sub-agent, in this post, is that worker. A larger agent holds the plan and hands one piece to a smaller model: find why a test failed, draft a fix, check the change. JetBrains calls Mellum2.1 "a capable worker inside agentic systems." The post also says a team can run it locally so code and data stay on the team's own infrastructure.

The speed claims are JetBrains'. The blog says post-training did not touch the architecture, so Mellum2.1 is as fast as Mellum2, and multi-token prediction makes it faster. Under heavy load, JetBrains says it is the fastest of the models it compared (Mellum2, Qwen3.5-9B, and Gemma 4 E4B) and serves almost twice as many tokens as Qwen3.5-9B. For a single request, JetBrains says multi-token prediction makes it about 1.6 times faster.

The quality numbers are also JetBrains', printed in a table on the model card. The card says every model was run in thinking mode on the same pipeline, and that the values are self-reported. On the agentic rows, Mellum2.1 Thinking scores 47.0 on SWE-bench Verified, 17.4 on Terminal-Bench 2.1, and 28.0 on SWE-bench Pro. The same table lists Mellum2 Thinking at 2.0, 0.6, and 0.0 on those three, Gemma 4 (E4B) at 23.0, 3.4, and 4.0, and Qwen3.5 (9B) at 50.0, 21.7, and 38.0. Coding rows on the same card include LiveCodeBench v6 at 82.0 and HumanEval+ at 91.5. The card notes that agentic runs used the Pi v0.73.1 harness with shell and file tools, a 114,000-token context, and up to 16,000 tokens per turn. Qwen3.5-9B is ahead of Mellum2.1 on several of those agentic and knowledge rows in JetBrains' own table. The speed claim and the quality table are different comparisons.

How to get the weights depends on which card you read. The main card and the blog both say GGUF builds for llama.cpp, Ollama, and LM Studio, and the multi-token prediction head for vLLM, are coming soon. A second repository, [JetBrains/Mellum2.1-12B-A2.5B-Thinking-GGUF](https://huggingface.co/JetBrains/Mellum2.1-12B-A2.5B-Thinking-GGUF), already lists GGUF files and says they are under Apache 2.0. That card describes the same 64-expert, 8-active, 131,072-token model, and it lists a Q4_K_M file at 8.1 GB as the balanced download. The safetensors weights named on the main card are the ones the blog points to as available now.
