---
title: Borrow Prompt Text With Cow Until You Need Ownership
description: Trim and inspect borrowed prompt text, then make an owned copy only when an edit or a caller requires one.
pubDate: "2026-10-06T23:30:00Z"
specimen: 334
section: rust
tags:
  - rust
  - cow
  - borrowing
  - ownership
  - strings
draft: false
heroImage: https://media.aitamer.news/heroes/borrow-prompt-text-with-cow-until-you-need-ownership-fd849adc.jpg
heroAlt: A paper cow unrolls a strip of text while a person prepares to cut and revise a copy.
author: ari
wildness:
  rating: 2
  verified: Rust docs confirm trim returns &str and Cow::to_mut clones borrowed data.
  claimed: The example borrows unchanged text and owns text after an ASCII case edit.
verdict: Borrow through trimming and inspection. Call to_mut when an edit is needed, and use into_owned when a caller must retain a String.
sources:
  - title: Cow in std::borrow
    url: https://doc.rust-lang.org/stable/std/borrow/enum.Cow.html
  - title: str primitive type
    url: https://doc.rust-lang.org/stable/std/primitive.str.html
  - title: u8 primitive type
    url: https://doc.rust-lang.org/stable/std/primitive.u8.html
  - title: References and Borrowing
    url: https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html
---

A prompt may arrive as a `&str` borrowed from a request buffer or a caller's `String`. A cleanup function can remove surrounding whitespace, inspect the text, and sometimes change its case. The order of those operations determines when an owned copy is needed. Rust's [`trim`](https://doc.rust-lang.org/stable/std/primitive.str.html) returns another string slice, so trimming can keep the cleaned view tied to the original input.

[`Cow`](https://doc.rust-lang.org/stable/std/borrow/enum.Cow.html) means clone on write. For text, `Cow<'a, str>` holds either `Borrowed(&'a str)` or `Owned(String)`. Both forms support reading the text. When code asks for mutable access through `to_mut`, a borrowed value is cloned into an owned one. An owned value is used directly. This lets a function return one type whether it changed the text or kept a borrowed view.

## Trim the view first

Start with a borrowed slice. `trim` removes leading and trailing whitespace from the view and returns `&str`. Even when it removes characters from the view, it does not need to rewrite the caller's string. The returned slice still depends on the original input. If the input ends its lifetime, that borrowed result cannot remain valid. Rust's [borrowing rules](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html) make this relationship part of the function's type.

A prompt cleanup policy might also lowercase ASCII letters. It should copy only when an ASCII uppercase letter is present. The check can run on the trimmed slice before any request for mutable access. That ordering matters because `to_mut` clones a borrowed value when called, even if the following operation would leave the text unchanged. The [`Cow` documentation](https://doc.rust-lang.org/stable/std/borrow/enum.Cow.html) describes that conversion directly.

## Copy when the case edit is needed

```rust
use std::borrow::Cow;

fn prepare_prompt(input: &str) -> Cow<'_, str> {
    let mut prompt: Cow<'_, str> = Cow::Borrowed(input.trim());

    if prompt.bytes().any(|byte| byte.is_ascii_uppercase()) {
        prompt.to_mut().make_ascii_lowercase();
    }

    prompt
}
```

The `bytes` iterator examines the current text. [`is_ascii_uppercase`](https://doc.rust-lang.org/stable/std/primitive.u8.html) selects the ASCII capital letters. If it finds none, the function returns `Cow::Borrowed`, including when `trim` removed outer whitespace. If it finds one, `to_mut` creates the owned form from the trimmed slice. The subsequent edit changes that owned text. The original input stays available to its owner.

The method [`make_ascii_lowercase`](https://doc.rust-lang.org/stable/std/primitive.str.html) changes ASCII `A` through `Z` in place. It leaves non-ASCII letters alone. This example uses an ASCII policy. Applications that need language-aware lowercasing require another transformation. A prompt containing only non-ASCII capital letters takes the borrowed path and retains those letters. Choose the case policy your application needs.

These assertions show the two branches:

```rust
let plain = prepare_prompt("  hello  ");
assert_eq!(plain.as_ref(), "hello");
assert!(matches!(plain, Cow::Borrowed(_)));

let changed = prepare_prompt("  HELLO  ");
assert_eq!(changed.as_ref(), "hello");
assert!(matches!(changed, Cow::Owned(_)));
```

The first input loses surrounding whitespace in its view and stays borrowed. The second input reaches the case edit and becomes owned. The copy contains the trimmed text, since `Cow::Borrowed` was built from `input.trim()`. Neither branch needs the caller to hand ownership of its original input to `prepare_prompt`.

## Ownership can require a copy too

An edit is one reason to request ownership. A caller may need a `String` that outlives the input, even when no edit is needed. [`into_owned`](https://doc.rust-lang.org/stable/std/borrow/enum.Cow.html) supplies one. It clones a borrowed value and moves an already owned value out without cloning it. This copy serves the caller's ownership requirement. The return type's lifetime says a borrowed result cannot outlive the input it refers to.

If the next function only reads the prompt while the input is alive, pass `prompt.as_ref()` or use the `Cow` as readable text. If a queue or stored record must keep it after the input is gone, convert to an owned value at that boundary. Keep the conversion visible there. It makes the reason for the copy clear to the next reader.

There is also a cost to the guard: it scans for capital letters before the edit scans again. The benefit depends on how often prompts need the edit and how much text they contain. The code establishes when it copies. Speed for a particular workload requires measurement with representative prompts.

## What to do

1. Accept `&str` when the caller can keep the input alive for the result's lifetime. Use slice-returning operations such as `trim` before building an owned string.
2. Return `Cow<'_, str>` when the same function can produce a borrowed view or edited text. Check the exact condition that requires an edit before calling `to_mut`.
3. State the transformation's scope. In this example, the check and edit both target ASCII uppercase letters. Keep them aligned so the function does not copy for an edit it cannot make.
4. Call `into_owned` where an ownership boundary requires `String`. Treat that conversion as a possible copy, even if the text was never edited.
