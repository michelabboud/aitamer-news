---
title: An Untagged Enum Chooses the First Match
description: Serde checks untagged enum variants in order. When two variants accept the same JSON object, their order decides which one the program receives.
pubDate: "2026-10-06T21:30:00Z"
specimen: 330
section: rust
tags:
  - rust
  - serde
  - deserialization
  - json
draft: false
heroImage: https://media.aitamer.news/heroes/an-untagged-enum-chooses-the-first-match-e5db747e.jpg
heroAlt: Shape-marked cards move past ordered gates, with the first fitting gate selected.
author: ari
wildness:
  rating: 3
  verified: Serde returns the first untagged variant that deserializes successfully.
  claimed: An overlapping API response can become a different variant after an enum reorder.
verdict: Treat untagged variant order as parsing behavior. Make response shapes distinct or use a tag, and test payloads that fit more than one variant.
sources:
  - title: Enum representations · Serde
    url: https://serde.rs/enum-representations.html
  - title: Container attributes · Serde
    url: https://serde.rs/container-attrs.html
  - title: Field attributes · Serde
    url: https://serde.rs/field-attrs.html
---

An untagged enum lets a Rust program accept several JSON shapes without a variant name in the response. Serde tries its variants in declaration order and returns the first one that deserializes successfully. That makes order part of how the program interprets an [ambiguous response](https://serde.rs/enum-representations.html).

## Where order takes over

Consider an API that returns either a record or an error:

```rust
#[derive(serde::Deserialize)]
#[serde(untagged)]
enum Reply {
    Record { id: String },
    Failure { id: String, error: String },
}
```

The JSON object `{"id":"42","error":"denied"}` has the fields needed by `Failure`. It also has the field needed by `Record`. Serde's [untagged matching rule](https://serde.rs/enum-representations.html) tries `Record` first. For self-describing formats such as JSON, Serde [ignores unknown fields by default](https://serde.rs/container-attrs.html). The `error` field therefore does not make `Record` fail. The result is `Reply::Record`, with no error text in the value the program receives.

Moving `Failure` above `Record` changes the result for the same object. The JSON has not changed. The enum's order has. That creates a fragile dependency when two variants can both accept one payload.

## Why shape changes matter

Suppose an API adds a field to a response while retaining its existing fields. With default unknown-field handling, an earlier, broader variant can still accept that response. A later variant may never get a chance. Defaults on fields can widen the overlap further: Serde's [field attribute](https://serde.rs/field-attrs.html) fills a missing value when `#[serde(default)]` is present. Review defaulted fields when deciding whether two shapes are distinct.

## What to do

Prefer an explicit discriminator when the API contract allows it. Serde documents [internally and adjacently tagged enums](https://serde.rs/enum-representations.html) for responses that carry a variant tag. If the wire format is fixed, give each variant required fields that distinguish it. Where rejecting extra fields fits the contract, `#[serde(deny_unknown_fields)]` makes an unknown field an error. Serde says this attribute cannot be combined with `flatten`, so [check that constraint](https://serde.rs/container-attrs.html) before using it.

Add a deserialization test for a payload containing fields from both shapes. Assert the chosen variant, then repeat with realistic added fields. The test makes a future enum reorder or schema change visible where the response enters the program.
