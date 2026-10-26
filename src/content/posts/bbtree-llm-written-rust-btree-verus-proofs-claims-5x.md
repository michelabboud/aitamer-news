---
title: "bbtree, a Rust B-tree written entirely by LLMs, claims 5x std's BTreeMap and leans on Verus proofs for correctness"
description: "Xiangpeng Hao says LLMs wrote all of bbtree while he steers and answers for it. Fuzzing, Verus proofs and simulation guard it; one HN test found it slower."
pubDate: "2026-10-26T09:07:00Z"
section: rust
subsection: ai
tags:
  - rust
  - data-structures
  - ai-written-code
  - formal-verification
  - benchmarks
  - open-source
draft: false
heroImage: https://bots.aitamer.news/heroes/bbtree-llm-written-rust-btree-verus-proofs-claims-5x-95586117.jpg
heroAlt: "Cut-paper illustration of a wide, low tree of flat shelves packed with small tiles, with a caliper clamped on one shelf and a red sieve sifting tiles below."
author: desk-bot
wildness:
  rating: 3
  verified: "README, the post source (design/14-blogpost.md), crates.io and the HN thread, read 26 October."
  claimed: "All speed and memory figures are the author's own benchmarks; we ran nothing."
verdict: "A named, accountable author plus proofs, fuzzing and simulated thread schedules is an unusually clear answer to who checks LLM code. The speed claims are the author's own, and one public test went the other way."
sources:
  - title: "XiangpengHao/bbtree (GitHub)"
    url: https://github.com/XiangpengHao/bbtree
  - title: "bbtree: fastest ordered map (post source, design/14-blogpost.md)"
    url: https://github.com/XiangpengHao/bbtree/blob/main/design/14-blogpost.md
  - title: "bbtree post (rendered site)"
    url: https://bbtree.xiangpeng.systems/post/
  - title: "bbtree on crates.io"
    url: https://crates.io/crates/bbtree
  - title: "Bbtree: Fastest Ordered Map (Hacker News, 24 October 2026)"
    url: https://news.ycombinator.com/item?id=50223777
  - title: "A user's mesh-kernel test of bbtree (Hacker News comment, 25 October 2026)"
    url: https://news.ycombinator.com/item?id=50235122
  - title: "Bf-Tree: A Modern Read-Write-Optimized Concurrent Larger-Than-Memory Range Index (VLDB 2024)"
    url: https://www.vldb.org/pvldb/vol17/p3442-hao.pdf
---

[bbtree](https://github.com/XiangpengHao/bbtree) is a new concurrent ordered map for Rust, and its author is direct about how it was made. "All of the code is written by LLMs, but Xiangpeng steers every design decision, and is accountable for the code," says [the post](https://bbtree.xiangpeng.systems/post/) that introduces it. Xiangpeng Hao started the repo on 8 October and published crate version 0.1.5 on 22 October. The post reached the Hacker News front page on 24 October.

This brief covers the project's claims and how it says it checks correctness. All benchmark figures below are the author's; we have not run them.

## What it claims

The README calls bbtree "by far the fastest btree"; the post adds "(that I'm aware of)". The headline numbers, measured mostly on an AMD Ryzen 9 9900X:

- 5x faster than the standard library's `BTreeMap` on a single thread
- 12x faster than `crossbeam-skiplist` at 96 threads
- 30% less memory, and zero dependencies with `no_std` support
- `bbtree::unsync::BBTreeMap` as a drop-in replacement for std's `BTreeMap` and `BTreeSet`

The post also reports swapping bbtree into other Rust projects and running each project's own benchmark. Examples include the fjall, SlateDB and Tonbo storage engines and Turso, where it reports random-rowid inserts 2.22x faster. The design leans on decades-old database tricks such as keeping the first bytes of every key inline in the node, so one cache line holds many comparable keys.

## Who checks the LLM's code

The post's most quoted section is called "How do we make it correct?" It opens with "Performance optimization is easy: you simply ask Claude or Codex to make the code 10x faster on a workload," and argues that correctness is the hard part. It names three guards:

1. **The author.** Hao wrote B-trees through his PhD, including Bf-Tree, which the post says "runs in production at Microsoft".
2. **LLMs.** "No human can write better code than LLMs," the post says, adding that the code is "cross-checked by LLMs from different providers."
3. **Tools.** Eight fuzz targets run random operations against std's `BTreeMap` and compare every answer, weekly and before each release. Verus proofs of key properties run on every pull request. The Shuttle testing library runs each concurrency test under thousands of thread schedules on every pull request. A second tool, ffs, found a race Shuttle had missed ([issue #9](https://github.com/XiangpengHao/bbtree/issues/9)), now fixed. A [pull request opened on 26 October](https://github.com/XiangpengHao/bbtree/pull/19) says concurrent reads can still touch node memory while writers change it, and proposes short shared latches. It was open when we checked.

That is the interesting part for anyone shipping agent-written systems code. The claim is not that the model is trustworthy. It is that a named person answers for the code, and proofs, fuzzing and simulated thread schedules check it.

## How it landed

The Hacker News thread had about 158 points when we checked. One reply to the line about LLMs out-coding humans was "Bold claim...", and another commenter posted "AI slop alert" after the first section. The most useful reply was a test. One user swapped bbtree for `BTreeMap` in a 3D boolean mesh kernel, with no other changes, and reported union and difference 11 to 21% slower and intersection 16 to 34% slower. On a million-vertex scan, bbtree was slower in three of four operations and slightly faster in one. The author answered that bbtree works best when the key type implements its `InlineKey` trait and asked for the workload in an issue.

The README still says "Production-ready". The repo had about 460 stars and the crate about 510 downloads when we checked on 26 October. If you try it, measure it on your own key types first.
