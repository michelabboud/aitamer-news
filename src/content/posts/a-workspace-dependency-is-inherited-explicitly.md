---
title: A Workspace Dependency Is Inherited Explicitly
description: Cargo workspace.dependencies centralizes dependency declarations, but each member opts in through its own manifest. See how that keeps an AI application's crates honest about what they use.
pubDate: "2026-10-08T22:30:00Z"
section: rust
tags:
  - rust
  - cargo
  - workspaces
  - dependencies
draft: false
heroImage: https://media.aitamer.news/heroes/a-workspace-dependency-is-inherited-explicitly-e549c605.jpg
heroAlt: Two tool baskets hook into a shared dependency spool; a third basket's eyelet stays unconnected.
author: ari
wildness:
  rating: 1
  verified: Cargo workspace dependencies are inherited only when a member declares workspace = true.
  claimed: No claim that central declarations reduce binary size or force identical feature sets.
verdict: Put shared dependency settings in the workspace root, then opt in from each member that uses the crate. Review feature additions at the member level.
sources:
  - title: "The Cargo Book: Workspaces"
    url: https://doc.rust-lang.org/cargo/reference/workspaces.html
---

An AI voice application might have two Rust crates: a transcription adapter and a playback server. Both live in one Cargo workspace. The team adds serde to the root manifest's workspace.dependencies table to keep the version declaration in one place. The playback server still cannot use serde merely because that line exists at the root.

The [Cargo workspace reference](https://doc.rust-lang.org/cargo/reference/workspaces.html) defines workspace.dependencies as a source of declarations that member packages may inherit. A member opts in through its own dependencies table. The root entry is a shared definition; the member entry is the declaration that this package actually depends on the crate. The same pattern applies under build-dependencies or dev-dependencies when that is the appropriate role.

~~~toml
# workspace Cargo.toml
[workspace]
members = ["crates/transcribe", "crates/playback"]

[workspace.dependencies]
serde = { version = "1", features = ["derive"] }

# crates/transcribe/Cargo.toml
[dependencies]
serde = { workspace = true }
~~~

In this example, transcribe inherits serde. Playback has no serde dependency until its manifest declares one. That distinction helps reviewers answer a practical question: which part of the application can call into a dependency? It also keeps a shared version choice from becoming an implicit dependency of every package.

The central table has constraints worth knowing. Cargo says a workspace dependency cannot itself be marked optional. Features named in a member's inherited declaration are additive with those in the root declaration. Therefore, putting a feature in the root can make it available to every opting-in member, while a member can request an additional feature for its own use. Do not infer that each member gets a perfectly isolated feature set from this layout. Cargo's reference also documents edition and version-sensitive behavior for default-features overrides, so review that rule before relying on a member to switch defaults off.

For the voice application, a root serde declaration makes sense if multiple crates need a common version and baseline features. The transcription adapter might opt in for a wire message; the playback server might not need it at all. When a new member needs JSON handling, add the explicit member declaration and check its feature needs. A workspace gives the team one place to maintain shared settings while leaving each crate's dependency surface visible where the crate is defined.
