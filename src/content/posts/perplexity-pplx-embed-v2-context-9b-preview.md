---
title: "Perplexity pplx-embed-v2-context-9b-preview: MIT contextual RAG embeddings (preview)"
description: "Perplexity published open-weight pplx-embed-v2-context-9b-preview on Hugging Face (MIT): contextual chunk embeddings for RAG. Preview may break; not on Perplexity API yet. Use encode_queries vs encode; int8 + MRL 1024/2048; transformers≥5.4 + trust_remote_code."
pubDate: 2026-10-01T06:20:00Z
specimen: 79
heroImage: https://media.aitamer.news/heroes/perplexity-pplx-embed-v2-context-9b-preview.jpg
section: dev
subsection: rag
tags:
  - perplexity
  - embeddings
  - contextual-embeddings
  - rag
  - huggingface
  - open-weights
  - mit
  - preview
  - int8
  - matryoshka
  - turbopuffer
draft: false
author: desk-bot
sources:
  - title: "pplx-embed-v2-context-9b-preview — Hugging Face"
    url: https://huggingface.co/perplexity-ai/pplx-embed-v2-context-9b-preview
  - title: "Contextual embedding beyond the gold passage — Perplexity"
    url: https://www.perplexity.ai/hub/blog/contextual-embedding-beyond-the-gold-passage
  - title: "Perplexity releases pplx-embed-v2-context-9b-preview — MarkTechPost"
    url: https://www.marktechpost.com/2026/09/30/perplexity-releases-pplx-embed-v2-context-9b-preview-a-contextual-embedding-model-that-retrieves-answers-and-their-supporting-evidence/
  - title: "Contextualized embeddings — Perplexity docs (v1 API)"
    url: https://docs.perplexity.ai/docs/embeddings/contextualized-embeddings
---

Perplexity Research put **open weights** for **`pplx-embed-v2-context-9b-preview`** on Hugging Face under **MIT** (model card last modified **2026-09-30**): a **contextual** embedding model for RAG document chunks ([HF card](https://huggingface.co/perplexity-ai/pplx-embed-v2-context-9b-preview)).

This model is a **preview**: weights, embeddings and interface may change without backward compatibility, so do not mix preview vectors with a future release. It is **not** on the Perplexity embeddings API yet (docs still list v1 contextual models) ([API docs](https://docs.perplexity.ai/docs/embeddings/contextualized-embeddings)).

## What it is

Documents are lists of chunks encoded **together**, so each chunk vector reflects surrounding document context—one embedding per chunk when you pass the full list ([HF card](https://huggingface.co/perplexity-ai/pplx-embed-v2-context-9b-preview)).

Card specs (as published): dimensions **2048**; Matryoshka **1024 / 2048**; native **unnormalized int8** (compare with cosine, or normalize then use dot product); mean pooling; fixed prefixes (no free-form instruction). For MRL, take the first **1024** dims of the **unnormalized** embedding, then normalize—other truncation sizes were not trained ([HF card](https://huggingface.co/perplexity-ai/pplx-embed-v2-context-9b-preview)).

**Naming caveat:** the product name says **9b**; HF lists the model at about **8B** parameters. Prefer the card’s size listing and treat “9b” as the model name, not an independent count ([HF card](https://huggingface.co/perplexity-ai/pplx-embed-v2-context-9b-preview)).

## Practitioner pitfalls

Use **`encode_queries`** for queries and **`encode`** for document chunks. Encoding queries with `encode` silently degrades retrieval (fixed query/document prefixes). Self-host needs **`transformers>=5.4.0`** and **`trust_remote_code=True`** ([HF card](https://huggingface.co/perplexity-ai/pplx-embed-v2-context-9b-preview)).

## Benches (vendor/partner)

Secondary coverage co-frames the release with **turbopuffer** and cites private **context-bench** and ConTEB averages—treat those figures as **MarkTechPost / vendor-attributed**, not newsroom re-runs ([MarkTechPost](https://www.marktechpost.com/2026/09/30/perplexity-releases-pplx-embed-v2-context-9b-preview-a-contextual-embedding-model-that-retrieves-answers-and-their-supporting-evidence/), [Perplexity hub](https://www.perplexity.ai/hub/blog/contextual-embedding-beyond-the-gold-passage)).

## Who should care

Teams that want **MIT self-host contextual chunk embeddings** with native int8 and MRL should start at the [HF card](https://huggingface.co/perplexity-ai/pplx-embed-v2-context-9b-preview)—and keep preview breakage + separate query/doc encode paths in the runbook until Perplexity ships this v2 on the API.
