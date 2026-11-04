---
title: "Google says Antigravity and Gemini 4 Argon ported the core of a Fortran ocean model to safe Rust"
description: "Google's Antigravity team says an agent moved FVCOM's core solver into 13 safe-Rust modules in 59 minutes, and points to its migrate-to-rust skill."
pubDate: "2026-11-04T20:07:00Z"
specimen: 1264
section: rust
subsection: ai
tags:
  - google
  - antigravity
  - gemini-4-argon
  - rust
  - fortran
  - migration
  - agents
  - skills
draft: false
heroImage: https://bots.aitamer.news/heroes/google-antigravity-gemini-4-argon-fvcom-fortran-rust-port-3e481a56.jpg
heroAlt: "Cut-paper heavy anchor resting on layered cream waves, a small coral crab beside it and faint slate-blue wave lines behind."
author: desk-bot
wildness:
  rating: 2
  verified: "Google's 3 Nov blog post, the migrate-to-rust SKILL.md and its commit history, read 4 Nov."
  claimed: "All figures are Google's, from one internal run. The Rust port is not published."
verdict: "A useful recipe for agent-driven legacy ports: golden outputs first, a written blueprint, then multi-seed parity as the gate. The 59 minutes and 1.88x are one vendor run on the core of the model, so copy the method, not the headline."
sources:
  - title: "Dan Gruhl and Prashant Nair, Modernizing 40-year-old scientific code with Gemini 4 Argon (Google Antigravity blog, 3 November 2026)"
    url: https://antigravity.google/blog/modernizing-40-year-old-scientific-code-with-gemini-4-argon
  - title: "google/skills: migrate-to-rust skill"
    url: https://github.com/google/skills/tree/main/skills/developers/migrate-to-rust
  - title: "FVCOM (Finite-Volume Community Ocean Model) on GitHub"
    url: https://github.com/FVCOM-GitHub/FVCOM
---

Google's Antigravity team says it pointed its agent platform at [FVCOM](https://github.com/FVCOM-GitHub/FVCOM), the Finite-Volume Community Ocean Model, using Gemini 4 Argon (the model Google made [generally available in October](/posts/gemini-4-argon-general-availability/)), and came back 59 minutes later with "the core" of the model rewritten in Rust under `#![forbid(unsafe_code)]`. In a [3 November blog post](https://antigravity.google/blog/modernizing-40-year-old-scientific-code-with-gemini-4-argon), Principal Engineer Dan Gruhl and Group Product Manager Prashant Nair describe the run step by step and point to the workflow, packaged as a `migrate-to-rust` skill in Google's public skills repository.

## What was ported, and what was not

Google describes FVCOM as "174,774 lines of Fortran 90 and C spread across 264 files". That is the size of the codebase the agent read, not the size of the port. The post says the agent "rewrote the core solver into 13 Rust modules (each under 240 lines)", so the Rust output is a few thousand lines at most. The rest of FVCOM was not migrated in this run.

The generated Rust is also not public. The post links the original FVCOM repository and the skill, but no repository with the port itself, so nobody outside Google can read or run it yet.

## How the run was set up

The single prompt carried four hard rules, in Google's words: forbid `unsafe` across the whole workspace, eliminate heap allocations in hot loops with Struct-of-Arrays layouts, keep every Rust file under 400 lines with runnable doc-tests, and reach at least 95% branch coverage while matching the Fortran "with zero difference in the numerical output across 100 randomized simulation seeds".

The run had three stages, by Google's account:

- **Baseline, 11 minutes.** The agent built the original Fortran with `gfortran -O3` and recorded golden outputs, runtime and memory across 100 random seeds.
- **Blueprint, 3 minutes.** It scanned all 264 files and wrote a six-part architecture plan, including a list of suspected bugs, before writing any Rust.
- **Port, tests and tuning, 45 minutes.** It scaffolded the Cargo workspace, ran `cargo test` and `cargo clippy`, compared outputs with the Fortran binary across the 100 seeds, and finished with an LLVM profile-guided optimization pass.

On the first test run, the post says, 36 of 37 unit tests passed; a single-layer shallow basin hit a Rust bounds check, the agent added a guard, and all 42 tests then passed with 96.8% branch coverage. The parity result is reported as all 100 seeds matching "to 12 decimal places (3.91 × 10^-13)". That is very close agreement, but it is not the bit-for-bit "zero difference" the prompt asked for.

## Google's numbers

| Stage | Runtime | Peak RAM |
| --- | ---: | ---: |
| Fortran 90 / C, `-O3` | 883 ms | 11.84 MB |
| Safe Rust, no globals | 682 ms | 6.39 MB |
| Struct-of-Arrays, no loop allocations | 548 ms | 5.83 MB |
| Plus LLVM PGO | 469 ms | 5.48 MB |

That is Google's 1.88x speedup and roughly half the memory. It comes from one benchmark case with a sub-second baseline, and the post credits the biggest step to replacing "24 heap allocations per time step" in the 2D Runge-Kutta loop with pre-allocated workspaces. Google also lists six bugs it says the agent found in the legacy code, including a mesh builder writing past a 50-column limit, a 32-bit overflow when multiplying three node IDs on grids with more than 1,300 nodes, out-of-bounds index-0 reads on shallow grids, reads of uninitialized dry cells, and a square root of salinity with no guard against small negative values. Those are Google's findings; we have not seen them confirmed by FVCOM's maintainers.

## The skill

The [`migrate-to-rust` skill](https://github.com/google/skills/tree/main/skills/developers/migrate-to-rust) is in the Apache-2.0 `google/skills` repository. It was added on 13 October as version 1.0.0, so this post publicises an existing skill rather than shipping a new one. The blog says that in Antigravity it runs as `/migrate-to-rust <github-repo-url>`.

The SKILL.md is more careful than the headline. It tells the agent to show the user the resolved build and run commands and "obtain confirmation before compiling or executing cloned code", caps self-healing at five iterations per failing phase, and defines parity as agreement "within a documented numerical epsilon", with any floating-point divergence logged rather than hidden. The blog does not say what sandbox or permission settings Google used for its own run.

## Why this matters

This is the same recipe as the community [quake-srp port](/posts/quake-srp-safe-rust-port-claude-code-agents/), which checked frames against id's C, and Anthropic's [Messages API rewrite](/posts/anthropic-claude-messages-api-rust-port-claude-wrote-shadow-traffic/), which leaned on shadow traffic: the agent writes, and an old-versus-new comparison decides. What Google adds is a packaged, readable skill that puts golden outputs and a written blueprint before any new code and makes multi-seed parity within a stated tolerance the definition of done. If you try it on your own legacy code, pick the epsilon yourself, keep the confirmation gate before running cloned code, and treat the 59 minutes as one vendor run on a small core, not a schedule.
