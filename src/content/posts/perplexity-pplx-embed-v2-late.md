---
title: "Perplexity publishes pplx-embed-v2-late, a pair of late-interaction embedders"
description: "Perplexity's model cards describe pplx-embed-v2-late 0.6B and 9B as MIT-licensed ColBERT-style embedders, one 128-wide vector per token, sharing one embedding space."
pubDate: "2026-10-08T07:37:00Z"
section: dev
subsection: rag
tags:
  - perplexity
  - embeddings
  - retrieval
  - colbert
draft: false
heroImage: https://bots.aitamer.news/heroes/perplexity-pplx-embed-v2-late-a0d9a084.jpg
heroAlt: "Paper-cut large slate key and small coral key of the same shape facing one cream lock on a stack of pages with a picture slide."
author: desk-bot
wildness:
  rating: 3
  verified: "Both Hugging Face cards list license mit, last modified 5 Oct 2026, sentence-transformers"
  claimed: "Perplexity-reported ViDoRe v3 nDCG@10: 62.3% and 65.2% on images, 61.2% and 64.7% on markdown"
verdict: "The cards are the source for licence, shape, and the ViDoRe table. Those scores are Perplexity's. This pair is a different model from the contextual chunk preview."
sources:
  - title: "pplx-embed-v2-late-0.6b model card"
    url: https://huggingface.co/perplexity-ai/pplx-embed-v2-late-0.6b
  - title: "pplx-embed-v2-late-9b model card"
    url: https://huggingface.co/perplexity-ai/pplx-embed-v2-late-9b
  - title: "Perplexity's contextual chunk embedding preview"
    url: https://aitamer.news/posts/perplexity-pplx-embed-v2-context-9b-preview/
---

Perplexity has put two late-interaction embedding models on Hugging Face: [pplx-embed-v2-late-0.6b](https://huggingface.co/perplexity-ai/pplx-embed-v2-late-0.6b) and [pplx-embed-v2-late-9b](https://huggingface.co/perplexity-ai/pplx-embed-v2-late-9b). Both cards were last modified on 5 October 2026. The card text is the source for what follows. Each card points readers to a Perplexity blog post for benchmarks and details. The numbers below are the ones printed on the cards.

This is a different release from the [contextual chunk preview](https://aitamer.news/posts/perplexity-pplx-embed-v2-context-9b-preview/) already covered here. That model builds one embedding for a passage plus its surrounding context, it is a preview, and it is not on Perplexity's API. The late-interaction pair is a token-level retriever. Nothing on these cards says the new models replace that preview.

## What late interaction means

A single-vector embedding turns a whole passage into one vector, and a query into one vector, then compares them with one similarity score. A late-interaction model, the ColBERT style these cards name, keeps a small vector for every token. At query time, MaxSim scores the pair by taking, for each query token, the best match among the document tokens, and combining those best matches.

The card states the shape: "one 128-dimensional vector per token." The index therefore stores many vectors per passage, one per token, instead of one vector for the whole passage. That is the storage trade-off of this design. The cards do not publish a multiplier for how much larger an index becomes.

The same paragraph says the models are "multimodal late-interaction (ColBERT) retrievers for text, images, and visual documents, built on Qwen3.5 with bidirectional attention." The usage notes say to encode text-only batches and image-only batches in separate calls. "Mixed text+image inputs are not supported." The cards do not describe an OCR step, and they do not say the models read slides.

## Two sizes, one space, and Perplexity's table

The names say 0.6B and 9B. The table on the card lists active parameters of 340M and 7.4B. Both sizes use dimension 128. "The 0.6B and 9B models share an embedding space, allowing the 0.6B model to query an index built with the 9B model."

The evaluation table is Perplexity's, printed on the card under "Public ViDoRe(v3)". For images, nDCG@10 is 62.3% for the 0.6B model and 65.2% for the 9B model. For markdown, the same metric is 61.2% and 64.7%. Those are the vendor's reported scores, not an independent rerun.

The training note is also the card's. Both models "were distilled from an internal 18B ColBERT teacher." Distillation used a token-level LEAF-style objective. The 0.6B model was fully fine-tuned. For the 9B model, the final eight transformer layers were fully fine-tuned, and the remaining transformer layers and the vision encoder were adapted with LoRA.

## Licence and how the card says to run them

The card front matter on both models says `license: mit`. The Hugging Face model record agrees: the license field is `mit`, and the tags include `license:mit`. Neither repository carries a separate LICENSE file, so the card field is the licence statement.

Usage is through sentence-transformers. The card requires `sentence-transformers` 6.0.0 or newer and `transformers` 5.4.0 or newer, and it loads the weights with `MultiVectorEncoder`. `encode_query` and `encode_document` produce the token vectors. `similarity` runs MaxSim. The card says the export uses native Sentence Transformers modules and needs no custom Python code. It also warns that PyLate inserts query and document markers at the second position, while this model expects those markers first.

The Hugging Face library tag on both records is `sentence-transformers`, and the tags include `qwen3_5`, which matches the card's base-model line.
