---
title: Error types for a Rust library, and a different answer for a binary
description: A library's error type is public API that callers match on. A binary mostly needs a clear message with context. thiserror and anyhow fit those two jobs.
pubDate: "2026-10-14T07:30:00Z"
specimen: 767
section: rust
tags:
  - rust
  - error-handling
  - thiserror
  - anyhow
  - api-design
draft: false
heroImage: https://media.aitamer.news/heroes/rust-library-binary-error-types-e18e91da.jpg
heroAlt: Three differently shaped teal puzzle pieces sit in a cream tray beside a red paper megaphone and a blank cream speech bubble.
author: quill
wildness:
  rating: 1
  verified: anyhow's library/application split, C-GOOD-ERR, std Error source rule, non_exhaustive
  claimed: Variant count and internal crates are judgment calls the sources do not cover
verdict: Mainstream Rust practice, backed by the crates' own docs and the API Guidelines. The split blurs for internal workspace crates, where the sources give no rule.
sources:
  - title: anyhow README on GitHub
    url: https://github.com/dtolnay/anyhow
  - title: "Rust API Guidelines: Interoperability (C-GOOD-ERR)"
    url: https://rust-lang.github.io/api-guidelines/interoperability.html
  - title: "Rust standard library: trait std::error::Error"
    url: https://doc.rust-lang.org/std/error/trait.Error.html
  - title: thiserror documentation on docs.rs
    url: https://docs.rs/thiserror/latest/thiserror/
  - title: "The Rust Reference: Type system attributes (non_exhaustive)"
    url: https://doc.rust-lang.org/reference/attributes/type_system.html
  - title: anyhow documentation on docs.rs
    url: https://docs.rs/anyhow/latest/anyhow/
---

Rust code often meets one of two error-handling mistakes. A library returns `anyhow::Error` or `Box<dyn Error>` from its public functions, and every caller that wants to treat "file not found" differently from "bad syntax" has to downcast or match on message strings. Or a command-line tool defines a forty-variant error enum that no code ever matches on, and each new failure means another variant and another `From` impl.

Both mistakes come from treating every crate the same way. The useful question is who handles the error. For a library, that is the caller's code, which may need to branch. For a binary, it is usually a person reading a message, plus a few places where the program decides to retry or exit.

The [anyhow README](https://github.com/dtolnay/anyhow) gives the same split: "Use Anyhow if you don't care what error type your functions return, you just want it to be easy. This is common in application code. Use thiserror if you are a library that wants to design your own dedicated error type(s) so that on failures the caller gets exactly the information that you choose."

## A library returns an error its callers can match

The [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/interoperability.html) set the baseline in C-GOOD-ERR. Error types should implement `std::error::Error`, and should be `Send` and `Sync`. Never use `()` as an error type, even when there is nothing more to say; a unit struct works instead. Display messages should be "lowercase without trailing punctuation" and "typically concise."

The [standard library documentation for `Error`](https://doc.rust-lang.org/std/error/trait.Error.html) adds a rule for wrapped errors: the underlying error "should be either returned by the outer error's `Error::source()`, or rendered by the outer error's `Display` implementation, but not both." If you break it, reporters that walk the source chain print the same cause twice.

[thiserror](https://docs.rs/thiserror/latest/thiserror/) writes the boilerplate for you. `#[error("...")]` generates `Display`, `#[from]` generates a `From` impl, and `#[source]` (or a field named `source`) becomes the return value of `source()`. Its documentation states that thiserror "deliberately does not appear in your public API," so you can later replace the derive with handwritten impls without breaking callers.

```rust
use std::path::PathBuf;

#[derive(Debug, thiserror::Error)]
#[non_exhaustive]
pub enum ConfigError {
    #[error("unable to read configuration at {}", .path.display())]
    Read {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
    #[error("missing required key `{0}`")]
    MissingKey(String),
    #[error("invalid value for key `{key}`")]
    InvalidValue { key: String },
}
```

The `Read` message names the path and leaves the I/O error to `source()`, as the standard library rule asks. A caller can now write `Err(ConfigError::MissingKey(k)) => ...` and fall back to defaults for that one case.

The `#[non_exhaustive]` attribute does the versioning work. The [Rust Reference](https://doc.rust-lang.org/reference/attributes/type_system.html) says it "indicates that a type or variant may have more fields or variants added in the future," and that outside the defining crate, matching on its variants does not count toward exhaustiveness. Downstream code must include a wildcard arm, so adding a variant in a later release does not break anyone's build.

## A binary uses one error type and adds context

An application rarely needs to branch on most of its errors. It needs to stop and say clearly what went wrong and why. [anyhow](https://docs.rs/anyhow/latest/anyhow/) provides `anyhow::Error`, which its documentation describes as "a wrapper around a dynamic error type," and a `Context` trait that attaches a higher-level message to any error as it travels up.

```rust
use anyhow::{Context, Result};

fn main() -> Result<()> {
    let path = std::env::args().nth(1).context("usage: app <config-path>")?;
    let config = mylib::load_config(&path)
        .with_context(|| format!("failed to load config from {path}"))?;
    run(config)
}
```

`?` converts the library's `ConfigError` into `anyhow::Error` and keeps its source chain. When `main` returns an error, anyhow prints the top message followed by a "Caused by:" list of the underlying errors. The anyhow documentation also says that on Rust 1.65 or newer it captures a backtrace when the underlying error does not provide one. You turn it on with `RUST_BACKTRACE=1` for panics and errors, or with `RUST_LIB_BACKTRACE=1` for errors only.

When the binary does need to branch, the typed error is still there. `err.downcast_ref::<mylib::ConfigError>()` gets it back for one decision, without forcing the whole program into an enum.

## Where the split blurs

- **Internal library crates.** A workspace crate that only your own binary uses is a library in form and part of the application in practice. The sources above do not address this case. If no caller matches on its errors, anyhow there costs little. A typed error starts to pay off once a second consumer appears or the crate is published.
- **Callers that need kinds, not variants.** An enum is one shape for a library error. `std::io::Error` shows another: an opaque struct with a `kind()` method that returns a non-exhaustive `ErrorKind`. That lets the library change what it stores internally while callers still branch on a small, stable set of cases.
- **No rule on size.** None of these sources says how many variants a library error should have. One workable test is to give a case its own variant only when you expect a caller to handle it differently, and to fold the rest into a variant that carries a source.

The rule that holds across all of them: a library's error type is part of its public API, and an application's error type is mostly a message for a person.
