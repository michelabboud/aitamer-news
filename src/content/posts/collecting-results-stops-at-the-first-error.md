---
title: Collecting Results Stops at the First Error
description: Collecting an iterator of Result values into Result<Vec<T>, E> stops on the first Err. Choose that behavior for fail-fast loading, or collect errors explicitly for a full report.
pubDate: "2026-10-08T10:30:00Z"
specimen: 484
section: rust
tags:
  - rust
  - result
  - iterators
  - validation
draft: false
heroImage: https://media.aitamer.news/heroes/collecting-results-stops-at-the-first-error-95a8a3f6.jpg
heroAlt: A torn rust paper cue card halts a conveyor while later cards remain untouched and earlier cards sit in a blue basket.
author: ari
wildness:
  rating: 1
  verified: Result collection stops taking iterator items at the first Err and returns Ok only if all succeed.
  claimed: The narrated-caption import is illustrative; no rendering or validation timing is claimed.
verdict: Use Result collection for fail-fast render inputs. For an authoring report, visit every cue and accumulate errors with their indices.
sources:
  - title: "Rust standard library: Result FromIterator implementation"
    url: https://doc.rust-lang.org/std/result/enum.Result.html#impl-FromIterator%3CResult%3CA,+E%3E%3E-for-Result%3CV,+E%3E
---

Before rendering narrated captions, a voice application imports cue offsets in milliseconds. The submitted fields contain `128`, `later`, and `256`. The rendering job needs a valid sequence; the authoring interface needs to tell the editor what to correct. These two consumers need different error behavior.

Rust implements [`FromIterator` for `Result`](https://doc.rust-lang.org/std/result/enum.Result.html#impl-FromIterator%3CResult%3CA,+E%3E%3E-for-Result%3CV,+E%3E). Its `collect` implementation turns an iterator of `Result<T, E>` into `Result<Vec<T>, E>`:

```rust
fn parse_cue_offsets(
    raw: &[&str],
) -> Result<Vec<u32>, std::num::ParseIntError> {
    raw.iter().map(|text| text.parse::<u32>()).collect()
}
```

The `map` is lazy. As `collect` requests each item, a successful parse contributes a number to the vector under construction. At the first `Err`, it returns that error and requests no more items. Given `["128", "later", "256"]`, the third offset is never parsed by this pipeline. If every parse succeeds, the result is `Ok(Vec<u32>)`. If one fails, the return value contains the error rather than a partial vector.

That is a sensible boundary for a renderer that cannot use an incomplete cue list. There is still an operational limit: `collect` does not undo work done before the error. A closure that wrote a file or sent an event for the first cue has already produced that effect. If the `Result` values were built eagerly before collection, all of that earlier parsing has happened as well; collection only stops taking items from its iterator.

The authoring interface needs a different pass. Walk every submitted field, retain each failure with its cue index, and return a report such as `Result<Vec<u32>, Vec<CueError>>`. This also leaves room for checks beyond integer syntax, such as whether the offsets are in the required order. A plain `collect::<Result<Vec<_>, _>>()` cannot find all those errors because it stops at the first one. Decide explicitly whether an error report may also carry valid partial data; the simple `Result<Vec<_>, Vec<_>>` shape does not.

Use short-circuiting collection when a single bad cue makes the whole render input unusable. For an editor that should show every correction in one response, visit every cue and accumulate located errors.
