---
title: A Streaming Dataset Is Only Approximately Shuffled
description: A streaming shuffle can choose only from rows it has reached. Buffer and shard shuffling improve the mix, but they do not provide the global reach of an indexed dataset.
pubDate: "2026-10-05T00:00:00Z"
specimen: 242
section: dev
tags:
  - datasets
  - streaming
  - machine-learning
  - data-loading
draft: false
heroImage: https://media.aitamer.news/heroes/a-streaming-dataset-is-only-approximately-shuffled-b5c5cc8e.jpg
heroAlt: Colored cards flow through a limited mixing basin before splitting into smaller streams from a larger archive.
author: ari
wildness:
  rating: 2
  verified: Hugging Face documents index, buffer, and shard shuffling.
  claimed: An unread row cannot be selected from a streaming shuffle buffer.
verdict: Buffer and shard shuffling can improve the order of a stream, but only indexed shuffling can draw from the complete dataset for every position.
sources:
  - title: Differences between Dataset and IterableDataset
    url: https://huggingface.co/docs/datasets/about_mapstyle_vs_iterable
  - title: Stream
    url: https://huggingface.co/docs/datasets/stream
---

A streaming dataset arrives in sequence. You can change that sequence, but its shuffle chooses among examples it has already read. That detail matters when files are grouped by origin or rows are sorted by class. Hugging Face calls the shuffle for an `IterableDataset` approximate. Its [comparison of dataset types](https://huggingface.co/docs/datasets/about_mapstyle_vs_iterable) explains why: the stream cannot access every row at random.

## An indexed shuffle can reach every row

A regular Hugging Face `Dataset` lets you request a row by index. Its `shuffle()` method builds a shuffled list of row indices. The dataset then uses that list to decide which underlying row appears at each position. The [dataset comparison](https://huggingface.co/docs/datasets/about_mapstyle_vs_iterable) calls this exact shuffling. The ordering can draw from the whole dataset because every row has an address.

That access has a cost. The regular dataset must be stored on disk or in memory. Shuffling adds an indices mapping, which can make reads slower because they lose their contiguous order. Hugging Face describes `flatten_indices()` as a way to rewrite the shuffled data into contiguous chunks, at a further cost in time and disk space. These are practical reasons to stream large collections even when global shuffling would be useful. [Source: dataset comparison](https://huggingface.co/docs/datasets/about_mapstyle_vs_iterable).

## A buffer only sees the near future

An `IterableDataset` yields rows as it reads them. It cannot jump to a row near the end because a shuffled index points there. The [streaming guide](https://huggingface.co/docs/datasets/stream) describes the alternative: fill a buffer from the incoming rows, choose an example randomly from that buffer, and replace the chosen example with the next incoming example. `buffer_size` controls how many examples can be considered at once.

This creates a hard limit on the first output. A row that has not entered the buffer cannot be chosen. The same constraint persists throughout the pass: a later row becomes eligible only after the stream reaches it. Increasing the buffer lets examples move farther from their original positions, while keeping more examples available at once. The [dataset comparison](https://huggingface.co/docs/datasets/about_mapstyle_vs_iterable) describes this method as fast approximate shuffling.

A fixed seed can make a particular shuffle repeatable. It cannot give the buffer access to unseen rows. Reproducibility and global mixing answer different questions. The [streaming guide](https://huggingface.co/docs/datasets/stream) shows a seeded buffer shuffle and explains how to change the effective seed across epochs.

## Shard order broadens the mix

Many streams consist of separate files or shards. Hugging Face also shuffles shard order when `IterableDataset.shuffle()` has multiple shards. This changes which shard supplies the early rows. It does not give the iterator random access to every row inside those shards. The [dataset comparison](https://huggingface.co/docs/datasets/about_mapstyle_vs_iterable) describes both parts: shuffled shards and a buffer over the rows being read.

Imagine one shard of documents from source A and another from source B. If the buffer is smaller than either shard, changing shard order can make B appear first. It still cannot put an unread A document in the first output while B is being read. This follows from the [documented buffer process](https://huggingface.co/docs/datasets/stream); it is an illustration, not a measurement of a particular dataset. If shards mix sources internally, their incoming rows give the buffer a more varied starting pool. File layout therefore matters alongside buffer size.

Shards also help with parallel loading. The [streaming guide](https://huggingface.co/docs/datasets/stream) shows an iterable dataset split into shards and assigned across PyTorch data loader workers. Worker assignment divides the available shards. It does not turn a local buffer into a single global permutation. When diagnosing order, inspect both the shard layout and the rows each worker receives.

## Order can leak into training

Suppose a corpus is sorted by label, date, or source before streaming. A small buffer can draw only from the current neighborhood. Early batches may then overrepresent the first part of that ordering. This is an inference from the [documented buffer behavior](https://huggingface.co/docs/datasets/stream), rather than a claim about every training run. Randomizing shard order may move whole regions around while rows within the current region remain locally related.

The distinction matters when someone says a dataset was “shuffled.” That word alone does not identify the method or its reach. An indexed shuffle rearranges a list of addresses for the complete dataset. A streamed shuffle samples from rows already admitted to its buffer, with optional shard reordering. Both can be useful. They offer different guarantees, as the [dataset comparison](https://huggingface.co/docs/datasets/about_mapstyle_vs_iterable) makes explicit.

## What to do

First, decide what the job requires. If any row must be eligible for any position in a full pass, use a map-style `Dataset` and its index shuffle. Budget for local storage and the possible read slowdown. If throughput and limited storage matter more, use an `IterableDataset` and accept approximate mixing. The [dataset comparison](https://huggingface.co/docs/datasets/about_mapstyle_vs_iterable) documents both choices.

Next, inspect `num_shards` and the order of rows within each shard. Choose a buffer large enough to span the local patterns that concern you, subject to available memory. Treat this as a tuning decision, not a claim that one buffer size works everywhere. The [streaming guide](https://huggingface.co/docs/datasets/stream) shows `shuffle(seed=42, buffer_size=10_000)` and explains that the buffer samples from the rows it holds.

Finally, shuffle before calling `take()` or `skip()`, since those methods lock in shard order for later shuffling. For repeated epochs, call `set_epoch()` so the effective seed changes. Check early batches from each worker for the grouping you care about. These steps make streaming's ordering limits visible. The [streaming guide](https://huggingface.co/docs/datasets/stream) documents the order of operations and epoch control.
