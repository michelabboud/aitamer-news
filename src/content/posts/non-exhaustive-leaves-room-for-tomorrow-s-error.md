---
title: "`#[non_exhaustive]` Leaves Room for Tomorrow's Error"
description: A Rust library can reserve room for new error variants. Downstream callers need a deliberate fallback when matching them.
pubDate: "2026-10-07T05:30:00Z"
specimen: 346
section: rust
tags:
  - rust
  - enums
  - error-handling
  - library-apis
draft: false
heroImage: https://media.aitamer.news/heroes/non-exhaustive-leaves-room-for-tomorrow-s-error-61407f84.jpg
heroAlt: A hand adds a new error symbol to an open box that already holds several error types.
author: ari
wildness:
  rating: 2
  verified: The Reference requires a wildcard arm for downstream matches of a non-exhaustive enum.
  claimed: A useful fallback can handle error variants added later.
verdict: Use the wildcard arm as a real error path, with behavior suited to the caller.
sources:
  - title: "The Rust Reference: Type system attributes"
    url: https://doc.rust-lang.org/reference/attributes/type_system.html
---

An error enum gives callers named cases to handle. A library can mark it `#[non_exhaustive]` to allow more variants in the future. The restriction applies outside the crate that defines the enum. Inside that crate, the attribute has no effect. The [Rust Reference](https://doc.rust-lang.org/reference/attributes/type_system.html) describes this boundary.

## A downstream match needs a fallback

Imagine a library exposes this error type:

```rust
#[non_exhaustive]
pub enum ParseError {
    Empty,
    InvalidDigit,
}
```

A caller in another crate can handle the named cases, but its `match` must also have a wildcard arm. Naming every variant that exists today does not make the match exhaustive. The caller can still construct an existing enum variant; the restriction concerns matching every possible variant. These are the [rules for a marked enum](https://doc.rust-lang.org/reference/attributes/type_system.html).

```rust
fn label(error: upstream::ParseError) -> &'static str {
    match error {
        upstream::ParseError::Empty => "empty input",
        upstream::ParseError::InvalidDigit => "invalid digit",
        _ => "other parse error",
    }
}
```

The fallback is a choice about behavior. A short label may suit a display function. Code that needs the full error can pass the unmatched value to a general reporting path instead. A fallback that assumes it can never run would be a poor fit for an enum expressly allowed to gain variants.

## A marked variant has different limits

The attribute can also appear on a struct or on one enum variant. For a marked struct-style variant, downstream code must include `..` when matching its fields. It cannot construct that variant with a struct expression. Marking the whole enum affects whether a downstream match is exhaustive; marking a variant also limits how downstream code uses that variant's fields. The [Reference lists these construction and pattern rules](https://doc.rust-lang.org/reference/attributes/type_system.html).

## What to do

When using a library error enum, check where `#[non_exhaustive]` appears. Match the cases that need special treatment, then give the wildcard arm useful behavior for future cases. If diagnostic detail matters, keep the unmatched error available to a general error path. When defining an error type, place the attribute on the enum if callers must allow future variants, and review variant-level annotations separately when fields may grow.
