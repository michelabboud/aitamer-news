---
title: Choose the Arithmetic Failure You Want to Handle
description: Checked, saturating and wrapping arithmetic encode different overflow policies. Pick one for the meaning of a counter, image dimension or protocol sequence.
pubDate: "2026-10-08T21:30:00Z"
specimen: 506
section: rust
tags:
  - rust
  - integer-overflow
  - error-handling
  - ai-applications
draft: false
heroImage: https://media.aitamer.news/heroes/choose-the-arithmetic-failure-you-want-to-handle-83642470.jpg
heroAlt: Three paper tapes show a gap at a limit, a firm endstop, and a returning loop from one measuring spool.
author: ari
wildness:
  rating: 1
  verified: u32 checked arithmetic returns None, saturation clamps, and wrapping arithmetic cycles at the type bound.
  claimed: The image service and request counter are illustrative; no allocation or benchmark was run.
verdict: Use checked arithmetic for dimensions and exact accounting, saturation only for intentional caps, and wrapping only for values whose contract is modular.
sources:
  - title: Rust standard library u32 arithmetic methods
    url: https://doc.rust-lang.org/std/primitive.u32.html#method.checked_add
---

An image service accepts a width and height before passing a frame to a vision model. Another part of the same service counts requests. Both values are unsigned integers, yet overflow should lead to different decisions. If a computed frame size exceeds its representation, the service should reject the input before allocating or indexing. A displayed request count might reasonably stop at its maximum value if the interface explicitly presents it as capped.

Rust's [`u32` arithmetic methods](https://doc.rust-lang.org/std/primitive.u32.html#method.checked_add) make those decisions visible. `checked_add` and `checked_mul` return `None` when the result cannot fit. `saturating_add` clamps to the numeric bound. `wrapping_add` computes modulo the type's range, so adding one to `u32::MAX` yields zero. The same mathematical overflow thus becomes an error, a cap or a wrap, depending on the method.

For dimensions, checked arithmetic gives the caller a place to reject oversized input:

```rust
fn rgba_bytes(width: u32, height: u32) -> Option<u32> {
    width.checked_mul(height)?.checked_mul(4)
}
```

This computes a byte count only when both multiplications fit in `u32`. Real allocation still needs conversion to the platform's size type and a separate resource limit; representability alone does not make a huge frame affordable. If width and height arrive from an untrusted request, report an input error rather than falling through to an allocation with a corrupted size.

A capped display counter can use `shown = shown.saturating_add(1)`, provided the interface labels the maximum as a cap. Saturation hides how many requests occurred after that point, so it is a poor choice for billing, quotas or a metric that claims an exact lifetime total. Those paths need an explicit overflow response or a wider representation.

Wrapping belongs where the protocol explicitly defines a modular sequence, such as a 32-bit sequence field that cycles through its range. It also requires a plan for reused values: a sequence number alone cannot distinguish an old outstanding operation from a new one after wraparound. Avoid applying wrapping arithmetic to dimensions or monetary totals just to keep processing.

Choose the method at the point where the value's meaning is known. That makes the policy independent of build profile overflow settings and gives reviewers a direct question to ask: should this quantity fail, cap or cycle when its type runs out of numbers?
