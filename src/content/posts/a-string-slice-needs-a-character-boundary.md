---
title: A String Slice Needs a Character Boundary
description: Rust string ranges use UTF-8 byte offsets. Learn why a valid byte position can still be an invalid slice boundary, and when character iteration is insufficient for visible text.
pubDate: "2026-10-08T07:30:00Z"
section: rust
tags:
  - rust
  - strings
  - utf-8
  - unicode
draft: false
heroImage: https://media.aitamer.news/heroes/a-string-slice-needs-a-character-boundary-1d128c02.jpg
heroAlt: Paper scissors poised between folded rosettes, with joined rust rosettes kept intact.
author: ari
wildness:
  rating: 1
  verified: String ranges use UTF-8 byte offsets; get returns None where equivalent indexing would panic.
  claimed: The parser is illustrative; no external input or benchmark was tested.
verdict: Use get for fallible byte-range slicing, char_indices for character positions and byte offsets, and grapheme-aware logic for visible text boundaries.
sources:
  - title: "Rust standard library: String"
    url: https://doc.rust-lang.org/std/string/struct.String.html
---

A parser receives a byte offset from a file format and tries to extract a label from a `String`. The offset is within the string’s length, yet `&label[..offset]` panics. The missing condition is a UTF-8 character boundary. Rust strings are valid UTF-8, and a non-ASCII character can occupy several bytes. A byte position in the middle of that character cannot end a valid `&str`.

The [`String` documentation](https://doc.rust-lang.org/std/string/struct.String.html) defines `len()` in bytes and range slicing with byte indices. For a small example:

```rust
let label = "é!";
assert_eq!(label.len(), 3);
assert_eq!(label.get(0..1), None);
assert_eq!(label.get(0..2), Some("é"));
assert_eq!(label.get(2..3), Some("!"));
```

The first byte belongs to the two-byte encoding of `é`. Index `1` is in bounds, yet it splits that encoding. Direct range indexing with `0..1` would panic. `get` performs the equivalent boundary and bounds checks and returns `None` instead, which gives a parser a normal error path. The end index equal to `len()` is a valid boundary; an index beyond it is not. `is_char_boundary` is useful when an offset must be validated separately, though `get` is usually the simpler choice when the slice itself is wanted.

If the application is asking for the third Unicode scalar value rather than a byte range, `chars().nth(2)` expresses that intent. `char_indices()` provides each character together with its byte offset, which is useful when the result must later become a slice. Obtaining the nth character requires walking through earlier characters; byte offsets support direct range access once their boundaries are known. Those are different indexing questions, so an external character count should never be fed directly into a byte range.

There is one more boundary above `char`. A visible symbol can consist of several Unicode scalar values. The standard documentation gives joined emoji as an example and notes that character-level truncation can still split a grapheme cluster. Thus, a valid UTF-8 slice can produce a visually partial symbol. For display limits, cursor movement, or user-perceived character counts, use a grapheme-aware segmentation method and define the UI rule explicitly. For a protocol defined in bytes, keep byte offsets but validate both slice boundaries. For a protocol defined in Unicode characters, translate character positions to byte offsets before slicing.
