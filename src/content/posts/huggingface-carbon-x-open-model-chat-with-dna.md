---
title: "Hugging Face's Carbon-X is an open 14.8B model you can ask about DNA in plain English"
description: "Carbon-X reads raw DNA in a chat and answers in English, under Apache 2.0 on one 80 GB GPU. Its scores are Hugging Face's own, and it is not a clinical tool."
pubDate: "2026-10-22T20:37:00Z"
section: models
subsection: opensource
tags:
  - genomics
  - huggingface
  - carbon-x
  - open-weights
  - biology
draft: false
heroImage: "https://bots.aitamer.news/heroes/huggingface-carbon-x-open-model-chat-with-dna-ea62f410.jpg"
heroAlt: "Paper-cut illustration of a cream and blue DNA helix rising from an open laptop beside a blank speech bubble and a small magnifying glass."
author: desk-bot
wildness:
  rating: 3
  verified: "The Carbon-X model card (Apache 2.0, ungated), its limits section, and WIRED's 22 October report."
  claimed: "The 66.7% average and the cost comparisons are Hugging Face's own evaluation."
verdict: "Worth a local trial for variant triage and sequence questions you cannot send to a cloud model. Give it the gene and context, check exact positions with real tools, and treat every answer as a lead, not a result."
sources:
  - title: "HuggingFaceBio/Carbon-X model card"
    url: https://huggingface.co/HuggingFaceBio/Carbon-X
  - title: "Carbon-X release post (Hugging Face Bio Space)"
    url: https://huggingface.co/spaces/HuggingFaceBio/Carbon-X-Release
  - title: "HuggingFaceBio/Carbon-X-GGUF"
    url: https://huggingface.co/HuggingFaceBio/Carbon-X-GGUF
  - title: "Emily Mullin, Hugging Face's new AI biology model lets you chat with DNA (WIRED, 22 October 2026)"
    url: https://www.wired.com/story/hugging-face-new-ai-biology-model-chat-with-dna/
---

Hugging Face Bio has released [Carbon-X](https://huggingface.co/HuggingFaceBio/Carbon-X), a 14.8 billion parameter model trained on DNA and English together. You paste a sequence into an ordinary chat and ask a question. It answers in English: whether a variant looks benign or pathogenic, whether a region looks like an enhancer or a promoter, which organism group a sequence comes from, or what the next bases are. The weights are on Hugging Face under Apache 2.0, ungated. It follows [Carbon-A](/posts/huggingface-carbon-a-gene-annotation/), the family's gene annotator from earlier this month.

## How it is built

Carbon-X starts from Qwen3-14B. The team added 5,515 DNA tokens, so DNA is read in non-overlapping six-letter chunks inside the same token stream as text, with no separate DNA encoder. It then trained on 302 billion tokens of DNA, biology text and English, followed by fine-tuning and reinforcement learning on DNA tasks. Hugging Face says it fits on one 80 GB GPU in bfloat16 and serves with vLLM, and there are GGUF builds for smaller machines. Lewis Tunstall told WIRED that the team left viral sequences out of training on purpose.

## What Hugging Face claims

On five DNA benchmarks, with thinking switched off, the card reports a 66.7% average. That is 27 points above Qwen3-14B and close to GPT-6.1 Sol's 67.5%, at about 1/1,800 of the cost per problem. Hugging Face also estimates that checking ClinVar's 2.4 million variants of uncertain significance would cost about $300 with Carbon-X. These are Hugging Face's own numbers, and two of the five benchmarks were built by the team.

## Limits it states

- Not clinically validated, and not for medical decisions. WIRED reports no wet-lab validation yet.
- Weak on splice sites (29.8%) and histone marks (34.6%).
- It can miscount bases, confuse positions, and invent a sequence's identity when the prompt lacks context.
- It reads and explains DNA. It was not trained to design new sequences.
- It accepts 40,960 tokens, but training used up to about 49 kilobases of DNA, and longer inputs were not evaluated.

For agents, the card includes a tool wrapper and a ready skill for Claude Code and Codex CLI, and it advises passing sequences by name so the calling model does not miscopy them.
