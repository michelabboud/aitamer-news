---
title: Cargo Features Add Up Across Dependencies
description: Two crates in an agent CLI can request different features from the same dependency. Here is how Cargo combines those requests and how to trace them.
pubDate: "2026-10-07T00:30:00Z"
specimen: 336
section: rust
tags:
  - rust
  - cargo
  - features
  - dependencies
draft: false
heroImage: https://media.aitamer.news/heroes/cargo-features-add-up-across-dependencies-ca8bbfc2.jpg
heroAlt: Two groups of crates feed one central crate containing their combined colored shapes.
author: ari
wildness:
  rating: 2
  verified: Cargo combines feature requests on a shared dependency package.
  claimed: The local crate names and manifests illustrate the documented behavior.
verdict: A useful way to debug surprising feature sets is to trace every path to the shared package, including paths that enable its defaults.
sources:
  - title: Features - The Cargo Book
    url: https://doc.rust-lang.org/cargo/reference/features.html
  - title: Dependency Resolution - The Cargo Book
    url: https://doc.rust-lang.org/cargo/reference/resolver.html
  - title: cargo tree - The Cargo Book
    url: https://doc.rust-lang.org/cargo/commands/cargo-tree.html
---

An agent CLI may depend on one crate for transport and another for saved data. Both crates may depend on the same codec crate. The transport crate asks for streaming support. The saved-data crate asks for JSON support. When both paths use the same dependency package in a normal build, Cargo enables both features on that package. The CLI does not need to request either feature directly. This is [Cargo feature unification](https://doc.rust-lang.org/cargo/reference/features.html): Cargo uses the union of features requested for a shared dependency.

## The requests start in separate manifests

Consider a CLI with two local dependencies:

```toml
[dependencies]
transport = { path = "../transport" }
archive = { path = "../archive" }
```

The `transport` crate declares its dependency this way:

```toml
[dependencies]
codec = { path = "../codec", default-features = false, features = ["stream"] }
```

The `archive` crate uses the same `codec` package and asks for a different feature:

```toml
[dependencies]
codec = { path = "../codec", default-features = false, features = ["json"] }
```

These names describe an example, not specific published crates. Each `features` entry requests a feature defined by `codec`. The [Cargo features reference](https://doc.rust-lang.org/cargo/reference/features.html) shows that dependency declarations can enable features this way. The path dependencies make the shared package explicit in this example.

## Cargo combines the requests on codec

For this build, `codec` receives `stream` from `transport` and `json` from `archive`. Cargo builds the shared dependency with both enabled. A feature belongs to the package that defines it: a `json` feature on another package would be a separate feature, even though its name matches. Cargo's [dependency resolution guide](https://doc.rust-lang.org/cargo/reference/resolver.html) also describes the union when different packages enable different features on one dependency.

This matters when reading a single manifest. The `transport` declaration tells you what that crate requests. It does not show the full feature set that `codec` receives in the CLI build. To understand the build, follow every path to the shared package.

## Defaults can add another request

The example sets `default-features = false` on both paths so that its two explicit requests are easy to see. In a real graph, check every declaration of the shared dependency. Dependencies enable their default features unless a declaration disables them. If another path leaves defaults enabled, the resulting feature set can include those defaults even when one path specifies `default-features = false`. The [features reference](https://doc.rust-lang.org/cargo/reference/features.html) calls out this behavior for dependencies that appear multiple times.

The `default` feature can itself enable other features. Read the shared crate's `[features]` table to see those links. A short dependency declaration may therefore activate more conditional code than its visible `features` list suggests.

## The shared set affects conditional code

A crate can use `#[cfg(feature = "stream")]` or `#[cfg(feature = "json")]` to include code when those features are enabled. A feature can also enable another feature or an optional dependency. Those effects depend on how the shared crate defines its features. The [Cargo features reference](https://doc.rust-lang.org/cargo/reference/features.html) describes both conditional compilation and optional dependencies.

The union is useful when features add independent capabilities. Cargo's guidance says features should be additive because packages elsewhere in the graph can enable combinations. If two features cannot safely coexist, the crate author must address that combination. The reference suggests detecting an incompatible pair with a compile error when the conflict cannot be avoided.

## Build context changes the picture

The example uses normal dependencies in one CLI build. Other dependency kinds need closer inspection. Cargo's [resolver documentation](https://doc.rust-lang.org/cargo/reference/resolver.html) explains that resolver version two avoids some feature unification across build dependencies, development dependencies, and dependencies for targets that are not being built. It also explains that features from dependencies of workspace packages are unified when those packages are built together. Separate Cargo invocations can produce different feature sets.

The selected target and command therefore belong in any feature investigation. A tree viewed while examining tests can differ from the dependencies relevant to a normal build. The [cargo tree documentation](https://doc.rust-lang.org/cargo/commands/cargo-tree.html) says its display is a useful view of feature unification, while cautioning that it does not guarantee an exact picture of every compilation.

## Trace the feature back to its source

From the CLI's directory, run `cargo tree -e features -i codec`. The `-e features` option shows feature edges. The `-i codec` option reverses the tree so you can follow the paths that enable features on `codec`. The [features reference](https://doc.rust-lang.org/cargo/reference/features.html) recommends this command for finding why a package has a feature. The [cargo tree guide](https://doc.rust-lang.org/cargo/commands/cargo-tree.html) explains how to read the reversed graph.

If the workspace contains other members that matter, add `--workspace` to include their reverse dependency paths. To scan enabled features more compactly, use `cargo tree -f "{p} {f}"`. When the same package appears repeatedly, the tree may abbreviate repeated branches with `(*)`; `--no-dedupe` expands them. These options are documented on the [cargo tree command page](https://doc.rust-lang.org/cargo/commands/cargo-tree.html).

## What to do

1. Find the shared package in each dependency path. Confirm that the paths resolve to the same package before combining their feature requests.
2. Read every dependency declaration that reaches it. Record explicit features and whether each path enables defaults.
3. Read the package's `[features]` table. Follow features that enable other features or optional dependencies.
4. Run `cargo tree -e features -i codec` for the package and build context you care about. Follow each enabled feature back to the crate that requested it.
5. Check the resulting combination against the shared crate's code and documentation. If two features conflict, fix the crate or the dependency graph instead of assuming one request takes priority.
