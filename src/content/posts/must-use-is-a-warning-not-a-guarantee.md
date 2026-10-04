---
title: "`#[must_use]` Is a Warning, Not a Guarantee"
description: Rust warns when important results or futures are ignored. Callers can still discard them explicitly, so the warning cannot guarantee that an outcome was handled.
pubDate: "2026-10-07T04:30:00Z"
specimen: 344
section: rust
tags:
  - rust
  - must-use
  - compiler-warnings
  - results
  - futures
draft: false
heroImage: https://media.aitamer.news/heroes/must-use-is-a-warning-not-a-guarantee-278d1286.jpg
heroAlt: A warning sign and lit marker sit beside a person discarding an unchecked result over a cliff.
author: ari
wildness:
  rating: 1
  verified: Rust documents the warning, future behavior, and explicit discard forms.
  claimed: Reviewing intentional discards is editorial advice.
verdict: "Treat the warning as a prompt: handle results, drive needed futures, and explain intentional discards."
sources:
  - title: Attribute must_use - Rust
    url: https://doc.rust-lang.org/stable/core/attribute.must_use.html
  - title: Warn-by-default Lints - The rustc book
    url: https://doc.rust-lang.org/stable/rustc/lints/listing/warn-by-default.html#unused-must-use
  - title: The must_use attribute - The Rust Reference
    url: https://doc.rust-lang.org/stable/reference/attributes/diagnostics.html#the-must_use-attribute
  - title: Future - Rust
    url: https://doc.rust-lang.org/stable/core/future/trait.Future.html#runtime-characteristics
---

A Rust call can finish while its outcome goes unread. The [`#[must_use]` documentation](https://doc.rust-lang.org/stable/core/attribute.must_use.html) describes a compiler warning for this case. A warning asks the caller to look again. It does not force the caller to handle the value.

## The warning catches discarded results

`Result` is marked `#[must_use]`. If a function returns `Result` and a caller writes only `save_record();`, Rust's `unused_must_use` lint warns that an error may have been ignored. The [rustc lint guide](https://doc.rust-lang.org/stable/rustc/lints/listing/warn-by-default.html#unused-must-use) shows this warning and says the lint is on by default.

The attribute can also mark a function or method. Then ignoring that call's return value triggers the warning. A library author can include a short message, such as an instruction to call a finishing method. That message explains the intended next step to callers. The [Rust Reference](https://doc.rust-lang.org/stable/reference/attributes/diagnostics.html#the-must_use-attribute) describes where the attribute applies and when the lint fires.

## Futures need an action

Future values are also marked `#[must_use]`. Calling an async function creates a future. Dropping that future can mean the intended work never happens. The [`Future` documentation](https://doc.rust-lang.org/stable/core/future/trait.Future.html#runtime-characteristics) says a future alone is inert and needs polling to make its own computation progress. It also notes that some futures convey a value from work already running in another task. The warning still deserves attention, since the call alone does not establish that its result was used.

## An explicit discard stays possible

Rust permits `let _ = save_record();` and `drop(save_record());` for a deliberately ignored value. The `#[must_use]` documentation shows both forms. Neither checks whether a `Result` contains an error. For a future, discarding it does not poll it. The attribute prompts a decision, without proving that the program made the right one.

## What to do

Read each `unused_must_use` warning at the call site. If the value is a `Result`, inspect or handle the error. If it is a future whose work you need, await it or arrange for it to be polled. When discarding a value is intentional, use an explicit discard and leave a short comment explaining why the outcome can be ignored. Review those discards during code review: the compiler cannot tell whether the decision still fits the surrounding code.
