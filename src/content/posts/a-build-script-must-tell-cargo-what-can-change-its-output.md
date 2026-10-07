---
title: A Build Script Must Tell Cargo What Can Change Its Output
description: Generated Rust bindings can go stale when a build script watches too few inputs. Declare the files and external environment variables that affect generation, and keep diagnostics separate from Cargo directives.
pubDate: "2026-10-09T01:00:00Z"
section: rust
tags:
  - rust
  - cargo
  - build-scripts
  - code-generation
draft: false
heroImage: https://media.aitamer.news/heroes/a-build-script-must-tell-cargo-what-can-change-its-output-256eccd8.jpg
heroAlt: Cords connect a cream sheet and rust card to the lever of a blue paper binding press beside its output booklet.
author: ari
wildness:
  rating: 1
  verified: Cargo rerun directives narrow build-script change detection; file watches use modification times.
  claimed: The binding scenario illustrates a failure mode; no project-specific stale-output incident is claimed.
verdict: Declare every input that changes generated bindings, write outputs to OUT_DIR, and use verbose build output to check reruns when results look stale.
sources:
  - title: "Cargo Book: build scripts and change detection"
    url: https://doc.rust-lang.org/cargo/reference/build-scripts.html#change-detection
---

Imagine a voice application generating Rust bindings from `proto/voice.proto`. A developer changes an imported schema or a generator option, runs `cargo build`, and keeps seeing the old interface. The generator may be correct. Cargo first has to decide whether the package's `build.rs` needs another run. That decision depends on the inputs the script reports.

Cargo's [build-script change detection](https://doc.rust-lang.org/cargo/reference/build-scripts.html#change-detection) starts broad: without rerun instructions, a change to a file in the package can cause the script to run again. Once the script emits a `rerun-if` instruction, Cargo narrows that watch to the declared values. For bindings, the script could print `cargo::rerun-if-changed=proto/voice.proto` and `cargo::rerun-if-env-changed=VOICE_BINDINGS_MODE` to standard output. The first names a source file; the second names a global environment variable supplied to the Cargo invocation. These lines are instructions to Cargo, not a record that generation succeeded.

The list must match the generator's real inputs. If `voice.proto` imports `proto/common.proto`, watch that file too. Watching the `proto` directory is an option when imports change often; Cargo then scans the directory for modifications, which trades a simpler declaration for a broader trigger. If a generator configuration file affects output, include it. If a command-line tool or external schema outside the watched paths changes independently, the two example lines do not cover it; incorporate that input into the generation process and its rerun strategy. On the other hand, a variable such as `TARGET`, which Cargo provides to build scripts, is outside the intended use of `rerun-if-env-changed`. The reference says that directive tracks global values received by Cargo.

There is a subtle boundary in file detection: Cargo currently uses file modification times for `rerun-if-changed`. A content change whose timestamp is preserved may escape this check. The script itself is handled separately: changes to its source or dependencies cause a rebuild, and a rebuilt script runs again. Generated files should go into `OUT_DIR`; Cargo does not empty that directory between runs, so generation code must manage any stale files it owns. That matters when a schema removes a binding: simply writing new outputs alongside old ones can leave a misleading artifact.

For diagnostics, use ordinary output or error output deliberately. Cargo interprets lines beginning with `cargo::` on standard output as instructions, while other standard-output lines are ignored as instructions. Normal builds hide build-script output; `cargo build -vv` shows it when the script actually runs, and Cargo retains script output under its build directory. A log line such as `generating voice bindings` helps a developer understand a run, but it does not register a watched input. A `cargo::warning=` line is a Cargo diagnostic directive, not a substitute for a rerun rule.

Audit the generator by listing every file and invocation-level variable that can alter its bytes, then emit a matching rerun directive for each. Change one input at a time and inspect a verbose build to see whether the script ran and produced the expected bindings. This keeps incremental builds responsive while making schema edits visible to the compiler.
