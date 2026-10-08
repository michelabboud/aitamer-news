---
title: An Iterator Can Resume After Returning None
description: Rust iterators can yield an item after None. Learn when fuse() makes exhaustion permanent, and why a temporary gap in a live stream needs a different signal.
pubDate: "2026-10-08T21:00:00Z"
specimen: 505
section: rust
tags:
  - rust
  - iterator
  - stream-processing
  - ai-applications
draft: false
heroImage: https://media.aitamer.news/heroes/an-iterator-can-resume-after-returning-none-d526202c.jpg
heroAlt: Folded blue paper shells continue after a blank slot with an open rust flap; a detached seal offers permanent closure.
author: ari
wildness:
  rating: 1
  verified: Iterator::fuse returns None on every call after the first None, subject to a sound FusedIterator contract.
  claimed: The transcript pipeline is an illustrative design example; no runtime behavior was measured.
verdict: Fuse a source when the consumer needs permanent exhaustion. If None means temporarily unavailable, change the stream signal so later data stays reachable.
sources:
  - title: Rust standard library Iterator::fuse
    url: https://doc.rust-lang.org/std/iter/trait.Iterator.html#method.fuse
---

Suppose a transcript pipeline presents speech segments through a Rust iterator. A consumer polls `next()`, sees `None`, stores a final transcript, then polls the same iterator again and receives another segment. The first `None` ended that traversal, but the iterator contract does not require every later call to remain empty.

The [standard library's `fuse()` documentation](https://doc.rust-lang.org/std/iter/trait.Iterator.html#method.fuse) states that an iterator may yield `Some(item)` after it has yielded `None`. A small stateful source makes the issue concrete:

```rust
let mut call = 0;
let source = std::iter::from_fn(move || {
    call += 1;
    match call {
        1 => Some("first segment"),
        3 => Some("late segment"),
        _ => None,
    }
});

let mut segments = source.fuse();
assert_eq!(segments.next(), Some("first segment"));
assert_eq!(segments.next(), None);
assert_eq!(segments.next(), None);
```

Without `fuse()`, the third call to this source would return `Some("late segment")`. The adapter records the first `None` and returns `None` on every later call through it. This gives a reusable consumer a stable terminal state even when the underlying iterator has unusual behavior. Ordinary traversal such as a `for` loop already stops at its first `None`; the distinction becomes important when code retains an iterator and calls it again, or passes it to another consumer.

That stability has a cost. Fusing the transcript source discards anything it would have produced after its first empty result. If `None` means "no audio chunk available yet", `Iterator` is carrying the wrong signal for a live producer. Represent a temporary gap as an item or use an interface that can explicitly express pending work; reserve `None` for actual end of input. Then decide whether a finalizing consumer should call `fuse()` at the boundary.

There is a further contract boundary: the standard library can avoid an extra wrapper for iterators that already implement `FusedIterator`, and an incorrect implementation of that trait can break the promised behavior. When writing an iterator, implement that trait only if every call after the first `None` truly remains empty. When consuming an iterator you do not control, use `fuse()` if permanent exhaustion is part of your algorithm, while checking that the producer has a sound end-of-stream meaning.
