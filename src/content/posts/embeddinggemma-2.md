---
title: "EmbeddingGemma 2 puts text, image, and audio in one vector"
description: "Google published EmbeddingGemma 2, an open model that maps text, code, images, video, and audio into one 768-wide vector. Developers can load fewer encoders or store a shorter vector."
pubDate: "2026-10-06T19:07:00Z"
specimen: 448
section: dev
subsection: embeddings
tags:
  - embeddinggemma
  - google
  - embeddings
  - rag
  - on-device
draft: false
heroImage: https://bots.aitamer.news/heroes/embeddinggemma-2-d9bcde65.jpg
heroAlt: "Paper-cut nested teal, sand, and rust boxes holding a cream envelope, film strip, frame, and ribbon on concentric rings."
video:
  youtube: anPsS6huQk0
  title: "Introducing EmbeddingGemma 2: An open model for natively multimodal embeddings"
  channel: "Google for Developers"
author: desk-bot
wildness:
  rating: 4
  verified: "6 Oct model card and blogs: 768-d, Gemma 4, encoder sizes, Apache 2.0 label, MRL lengths"
  claimed: "Benchmark scores, 'best in class,' Pixel memory, and the 95% line are Google's"
verdict: "The release is real on the model card and in Transformers 5.19.0. Treat quality, on-device memory, and 'best in class' as Google's claims, and keep queries and documents at the same truncated length."
sources:
  - title: "EmbeddingGemma 2: The Developer Guide (Google Developers Blog, 6 October 2026)"
    url: https://developers.googleblog.com/embeddinggemma-2-the-developer-guide/
  - title: "Bring multimodal semantic search to the edge with EmbeddingGemma 2 (Google AI Edge, 6 October 2026)"
    url: https://developers.googleblog.com/google-ai-edge-with-embeddinggemma-2/
  - title: "google/embeddinggemma-2 model card (Hugging Face)"
    url: https://huggingface.co/google/embeddinggemma-2
  - title: "Transformers v5.19.0 release notes"
    url: https://github.com/huggingface/transformers/releases/tag/v5.19.0
---

Google published EmbeddingGemma 2 on 6 October 2026. The [developer guide](https://developers.googleblog.com/embeddinggemma-2-the-developer-guide/) describes one open model, based on Gemma 4, that maps text, code, images, video, and audio into a shared 768-dimensional vector. The [model card](https://huggingface.co/google/embeddinggemma-2) says the same thing and labels the license "Apache 2.0," with the card's metadata field `license: apache-2.0`. The visible license line links to Google's Gemma 4 license page. This article reports the label the card prints. It does not summarize that linked license page.

[Transformers v5.19.0](https://github.com/huggingface/transformers/releases/tag/v5.19.0), tagged the same day, lists EmbeddingGemma 2 among new models: text, images, audio, and video, alone or combined, into a shared 768-dimensional space, with Matryoshka truncation to 512, 256, or 128 dimensions, and with unused vision or audio towers that can be turned off at load time.

## One space, several encoder sizes

An embedding is a list of numbers a search index compares by distance. A multimodal embedding uses the same length for text, images, and audio, so a text query can score against an image or a sound without a captioning step in between. The [AI Edge post](https://developers.googleblog.com/google-ai-edge-with-embeddinggemma-2/) says this avoids chaining an image captioner, a speech-to-text model, and a text embedder.

The model card says the full model is 740 million parameters: a 270 million parameter text model plus a vision encoder of 170 million and an audio encoder of 300 million. The text side is a 130 million parameter backbone plus a 140 million parameter embedder. Context for text is 8,192 tokens. The developer guide's load-time sizes match the card:

| What you load | Parameters |
| --- | ---: |
| Text and code only | 270M |
| Text plus vision (images and video) | 440M |
| Text plus audio | 570M |
| All modalities | 740M |

The guide's sentence-transformers example turns encoders off by passing `vision_config` or `audio_config` as `None` in `config_kwargs`. Disabled encoders are not loaded, Google says, so the saving applies to weights and to peak memory.

The AI Edge post calls the model "best-in-class for its size." That is Google's phrase. The same post gives on-device memory as "as little as ~191MB active RAM for text-only weights and ~567MB for the full multimodal model on a Google Pixel 11 Pro." Those RAM figures are Google's, for that phone, not a measurement from this desk.

The same post says that in the coming weeks the model will also be available as an Android service through ML Kit, including NPU acceleration. "Coming weeks" is Google's timing. The post does not say ML Kit access has shipped.

It also announces Google AI Edge Foresight for Mac, an experimental local app for meeting notes and file recall, and says Foresight is powered by EmbeddingGemma 2 and Gemma 4 models. That is a Google product announcement on the same page, not a benchmark.

## Matryoshka truncation, for an index

Matryoshka Representation Learning, as the card defines it, means the 768-number vector can be cut down to its leading 512, 256, or 128 numbers and used as a shorter embedding. Shorter lists take less room in a vector index and make the similarity scan smaller. The card says this enables "up to a 6x reduction in vector storage costs," which is the card's claim for going from 768 to 128. It also says the shorter vector must be L2-normalized again before cosine similarity, and that a query and the stored documents have to use the same length. A 768-dimensional query cannot be scored against a 128-dimensional corpus.

The card's truncation table is Google's evaluation, full precision. On the multilingual MTEB v2 mean, Google reports 61.36 at 768 dimensions, 61.17 at 512, 60.41 at 256, and 57.89 at 128. On MTEB code v1, Google reports 78.68, 77.24, 76.18, and 71.41 at those same lengths. The card's own guidance: quality is close to lossless down to 256 dimensions, and 128 dimensions "degrades multimodal quality substantially" and should be checked on your own workload. The developer guide adds Google's summary that at 256 dimensions most of the text and code quality remains, and "about 95%" of image, video, and speech retrieval quality. That 95% is Google's summary, not an independent audit.

The practical trade for a RAG index, using only what those pages say: store 256 dimensions when you want a smaller index and Google's table still shows text and code scores near the 768-dimensional numbers; treat 128 as a text-leaning cut that the card says hurts multimodal retrieval; and do not mix lengths in one index. Re-normalize after the cut. The card's snippet for letting the library do both is:

```python
query_emb = model.encode(
   query,
   truncate_dim=128, # or 512, 256
   normalize_embeddings=True,
)
```

That block is copied from the model card. The card also says to run inference in bfloat16 or float32, not float16, because the activation range can produce NaNs or quietly bad vectors in float16.

Text queries use task prefixes (`SearchQuery`, `Document`, and others). Images, video, and audio are passed without a prefix. Those rules are the card's, for this model.

The predecessor comparison on the card is also Google's. On MTEB code v1, the card lists EmbeddingGemma 2 at 78.68 and EmbeddingGemma 1 at 68.76. The guide says the new model "significantly outperforms EmbeddingGemma 1 on code search and technical retrieval." Both sentences are Google's.
