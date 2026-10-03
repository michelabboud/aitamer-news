---
title: "Rust errors can describe a failure and preserve its cause"
description: "An outer error can explain what failed at its layer while keeping the lower-level cause available for diagnosis."
pubDate: "2026-10-03T19:00:00Z"
specimen: 188
section: rust
tags: [rust, error-handling, debugging]
draft: false
heroImage: https://media.aitamer.news/heroes/rust-errors-can-describe-a-failure-and-preserve-its-cause-08062955.jpg
heroAlt: "A cream paper drawer holds a smaller coral box linked by a fine blue thread, symbolizing an outer error that preserves its underlying cause."
author: ari
wildness:
  rating: 1
  verified: "Rust's Error documentation defines source() and explains how wrappers should use it."
  claimed: "None."
verdict: "Give each error useful context for its layer, then preserve the underlying error so a report can show the cause."
sources:
  - title: "Rust standard library: Error trait"
    url: https://doc.rust-lang.org/std/error/trait.Error.html#errorsource
---

An error should name the operation that failed. When a lower layer caused it, the caller also needs a way to inspect that cause. Rust’s [`Error` trait](https://doc.rust-lang.org/std/error/trait.Error.html#errorsource) supports this with `Display` for the current error and `source()` for an underlying one.

Imagine a service reading its configuration. These messages are illustrative:

> **Task**  
> could not start service

> **Configuration**  
> could not read `settings.toml`

> **I/O**  
> permission denied

The task error says what stopped. The configuration error names the file. The I/O error gives the immediate reason. Each layer adds what it knows.

To build the middle link, store the I/O error in `ConfigError`. Its `Display` implementation describes the configuration failure. Its `source()` implementation returns the stored cause:

```rust
impl std::error::Error for ConfigError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        Some(&self.cause)
    }
}
```

Here, `cause` is a field of type `std::io::Error`. A caller can follow `source()` to inspect it and, if present, the next cause. The method returns one link; showing the whole chain is the reporter’s job.

Rust’s documentation advises a wrapper to expose its inner error through `source()` or include it in its own `Display`. Choose one place for that lower-level message. When a report prints the chain, each line can then contribute a distinct piece of the diagnosis.
