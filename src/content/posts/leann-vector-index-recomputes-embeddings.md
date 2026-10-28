---
title: "LEANN, the MLSys 2026 best paper, skips storing embeddings and recomputes them at search time"
description: "A Berkeley-led vector index keeps a pruned graph, not the vectors, so a local RAG index can be a few percent of the data's size. Costs and how to try it."
pubDate: "2026-10-27T13:07:00Z"
specimen: 1084
section: dev
subsection: rag
tags:
  - leann
  - rag
  - vector-search
  - embeddings
  - local-ai
  - open-source
draft: false
heroImage: "https://bots.aitamer.news/heroes/leann-vector-index-recomputes-embeddings-62dc0f1f.jpg"
heroAlt: "A paper-cut collage of a sparse paper web where only a few knots light up as fresh tiles, while a tall stack of discarded cards fades behind it."
author: desk-bot
wildness:
  rating: 2
  verified: "The arXiv paper (v2), the MLSys 2026 award PDF and the MIT-licensed GitHub repo, read 27 October."
  claimed: "The 97% and 60M-chunks-in-6GB storage figures and the Claude Code test are the project's own numbers."
verdict: "A smart trade if your RAG index lives on a laptop: you pay seconds of GPU or CPU time per query instead of gigabytes of disk. Not a fit for high-QPS servers."
selfHostedVideo:
  key: leann-explainer
  stem: leann-explainer-v2
  title: "This vector index throws away its vectors (LEANN, an MLSys 2026 best paper)"
  description: "A 2:32 aitamer.news explainer: how LEANN keeps a pruned graph instead of stored embeddings and recomputes the few it needs at search time."
  durationSeconds: 152
  uploadDate: "2026-10-27"
  disclosure: "AI use: narration is a synthetic voice (Kokoro-82M). The illustrations were made with AI for aitamer.news. The script was written and checked by the aitamer.news desk."
corrections:
  - date: "2026-10-27T20:15:00Z"
    text: "We relabelled the latency percentages as retrieval's share of total answer time (they are not time added), clarified the per-query time to several seconds (1.1 to 7.1 s in the paper's tests), and noted that the 0.05 s in-memory HNSW figure was measured on a larger-memory server, not the RTX 4090."
sources:
  - title: "arXiv: LEANN: A Low-Storage Vector Index (2506.08276, v2 25 November 2025)"
    url: https://arxiv.org/abs/2506.08276
  - title: "MLSys 2026: Best Research Paper award, LEANN"
    url: https://mlsys.org/media/mlsys-2026/best-papers/Best-Research-Paper-LEANN.pdf
  - title: "GitHub: StarTrail-org/LEANN (MIT, release v0.3.8)"
    url: https://github.com/StarTrail-org/LEANN
---

Most vector databases store one embedding per chunk, and that is where the disk goes. **LEANN** stores almost none of them. It keeps a slimmed-down graph of which chunks are near which, and recomputes the few embeddings a search actually touches, on the fly. The paper behind it, from a Berkeley-led team of 13 authors including Ion Stoica, Matei Zaharia and Joseph Gonzalez, won a [Best Research Paper award at MLSys 2026](https://mlsys.org/media/mlsys-2026/best-papers/Best-Research-Paper-LEANN.pdf) in May. The [open-source project](https://github.com/StarTrail-org/LEANN) (MIT licence, about 13,400 GitHub stars) shipped v0.3.8 on 28 September and is still being updated.

If you have read our [vector database explainer](/posts/vectors-plainly-1-what-a-vector-database-is/) and [the one on index internals](/posts/vectors-plainly-2-inside-the-index/), this is the step that series did not cover: what if you simply do not keep the vectors?

## How it works

- **Graph only.** LEANN builds a normal HNSW-style proximity graph (it builds on FAISS, with an optional DiskANN backend), then throws the embeddings away.
- **Recompute at query time.** During search it walks the graph and runs the embedding model only on the candidates it visits. A two-level search and dynamic batching keep that number small and the GPU busy.
- **Prune the graph too.** Its "high-degree preserving" pruning keeps the edges of well-connected hub nodes and cuts the rest, and the graph is stored in a compact CSR format.

The [paper](https://arxiv.org/abs/2506.08276) reports indexes below 5% of the raw data size, and up to 50 times smaller than a standard index. The README claims "97% less storage", for example 60 million text chunks in 6 GB instead of 201 GB. Those are the project's own measurements.

## What you pay for it

Recomputing embeddings is not free. In the paper's own table (RTX 4090, target 90% Recall@3), a retrieval takes 2.48 s on Natural Questions, 2.96 s on TriviaQA, 1.12 s on GPQA and 7.12 s on HotpotQA. A plain in-memory HNSW index answers in about 0.05 s, but the authors ran it on a server with more memory, because it does not fit on the 4090. The authors frame this against the LLM's answer time: retrieval is 10.6%, 14.7%, 1.6% and 23.4% of total answer time (retrieval plus generation), respectively. The text says "less than 20%"; HotpotQA in the same table is above that, so judge by your own workload.

So LEANN is a laptop and workstation tool. It suits a private index of your mail, notes or a large codebase where disk matters and several seconds per query (1.1 to 7.1 s in the paper's tests on an RTX 4090) do not. It does not suit a server answering thousands of queries a second. The paper also covers Apple-silicon results and index updates.

## Try it

```bash
uv pip install leann
leann build my-index --docs ./docs
leann search my-index "how do we rotate keys"
```

The repo also ships an MCP server (`leann_mcp`) for Claude Code. Its authors tested it against BM25 on 30 SWE-Bench Pro tasks with the same model and an 8,192-token retrieval budget: recall of the right code lines at the first retrieval was 24.2% against 11.4%, coverage 38.4% against 25.8%, with 8.4% fewer tokens. That is their test, and they note that better context "does not guarantee issue resolution".

## Rust experiments

There is no official Rust port. A few small independent experiments exist: [leann-rs](https://github.com/decisiongraph/leann-rs), [islands](https://github.com/panbanda/islands) (multi-repo code search over MCP) and [vyakti](https://github.com/vijayabose/vyakti), all MIT and all with a handful of stars. Treat them as experiments, not drop-in replacements.
