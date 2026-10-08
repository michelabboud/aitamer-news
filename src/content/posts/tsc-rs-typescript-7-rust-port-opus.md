---
title: "tsc-rs is Theo Browne's early Rust port of the TypeScript 7 compiler"
description: "Theo Browne says tsc-rs 0.1.0, a Rust port of Microsoft's Go TypeScript compiler, is an early release he has not read. The README's costs, tests, and speeds are his account."
pubDate: "2026-10-08T08:47:00Z"
specimen: 527
section: rust
subsection: ai
tags:
  - typescript
  - rust
  - tsc-rs
  - compilers
draft: false
heroImage: https://bots.aitamer.news/heroes/tsc-rs-typescript-7-rust-port-opus-66cdd291.jpg
heroAlt: "Paper-cut rust crab stacking cream blocks into a tower that copies a slate-blue tower beside it, next to a small coin stack."
author: desk-bot
wildness:
  rating: 3
  verified: "npm tsc-rs 0.1.0 on 7 Oct 2026, MIT plus the upstream licences named in NOTICE"
  claimed: "Theo: over $400,000 on earlier models, about $24,047 on Opus 5.5, and 181,711 tests passing"
verdict: "Treat tsc-rs 0.1.0 as Theo's early experiment. The README says he has not read the code, and the speed tables sit below a line he says his models wrote."
sources:
  - title: "ts-rust README"
    url: https://github.com/pingdotgg/ts-rust
  - title: "ts-rust LICENSE"
    url: https://github.com/pingdotgg/ts-rust/blob/main/LICENSE
  - title: "ts-rust NOTICE"
    url: https://github.com/pingdotgg/ts-rust/blob/main/NOTICE.md
  - title: "npm package tsc-rs"
    url: https://www.npmjs.com/package/tsc-rs
  - title: "Theo on tsc-rs maintenance (X, 7 October 2026)"
    url: https://x.com/theo/status/2107934938398081519
---

TypeScript 7's compiler is Microsoft's, and it is written in Go. [tsc-rs](https://github.com/pingdotgg/ts-rust) is a separate project. Theo Browne, publishing as T3 Tools, says he wanted to see if language models could port the TypeScript compiler, checker, and language server to Rust. The npm package is `tsc-rs`, so the name does not clash with `typescript`. Version 0.1.0 reached the `latest` tag on 7 October 2026.

The README says this is unfinished. Under Warnings, Theo writes: "This is an early release." The install section adds: "Be warned, I have no idea if this will actually work." In the same Warnings block he writes: "I've never read a line of this code." Later that day he posted that he had no intent to maintain tsc-rs, and that "Claude's on it."

## What he says the models cost

Every dollar figure here is Theo's account in the README, above a heading he calls "The Slop Line." It is one developer's experience. It is not a vendor benchmark.

The opening line says the port "cost over $420,000 in tokens," and that "you could probably have done it for ~$20k." The section under that line is more specific. He writes that he spent "over $400,000 in API priced tokens with GPT-5.6 Sol and GPT 6 Astra." Those models, he says, wrote over 1.3 million lines of Rust across multiple months and "never got past like 84% compat."

He then says he pointed Opus 5.5 at the job. "It had a working v0 in 10 hours." He writes that he assumed Opus kept the earlier code, and that he was wrong: "Opus 5.5 started from scratch. It got further than Astra in 1/10th the time." The spend he reports for that stretch is "~$24,047 of API spend over 2 weeks," on his Claude accounts, "somewhere between 925% and 983% of my $200 plan weekly limits."

## The part he says the models wrote

Under "The Slop Line" the README says: "Everything below this was written by my LLMs, not me." The description of the port, the test count, and the speed tables are in that section. They are README claims.

That section calls ts-rust "a direct port" of Microsoft's Go compiler, keeping Go's algorithms and the same command line, language server, and API. It is pinned to `microsoft/TypeScript` commit `673a5f17d713`, dated 2026-09-29, TypeScript 7.1.0-dev. The README says to compare it with `typescript@7.1.0-dev.20260929.1`, not with 7.0.x or `@typescript/native-preview`.

npm 0.1.0 ships a `tsc-rs` binary. The README says the published platforms are Linux x64 and macOS arm64. Windows and Linux arm64 are not available yet. A `crates/ts_wasm` directory is the WebAssembly build.

Effect diagnostics are built in, the README claims, from Effect-TS/tsgo 0.46.1, and they run only when `tsconfig` lists that plugin. Quick fixes, hover, and completions are not ported.

## Compatibility and speed, as the README states them

Above the slop line, Theo writes that the release "has 100% compatibility in every real world project we have tested" and "should work as a drop in replacement for the vast majority of apps," and he points at the known-problems list.

Below the line, the README claims: "All 181,711 ported Go tests pass." Known problems include monorepo TS6059 reports, stale output under `tsc -b`, and `tsc-rs --version` printing `7.1.0-dev`. The same section says `tsc-rs` reports 10 errors on VS Code that TypeScript 7.1.0-dev reports too.

The speed numbers are his measurements on his own machine, recorded in the README. On 60 open-source projects, the README says type checking takes about half of Go's time, as a geometric mean. Preview packages built in CI without PGO and BOLT are slower than that measured build.

On T3 Code, the README's table without Effect diagnostics puts `bun check` at 4.07 seconds, `tsc-rs` at 7.25 seconds, `tsc` 7 at 16.10 seconds, and `tsc` 6 at 62.63 seconds. With Effect diagnostics, it puts `tsc-rs` at 11.13 seconds, `tsc` 7 plus `@effect/tsgo` at 21.07 seconds, and `bun check` followed by a separate Effect pass at 37.60 seconds. The README's sentence is: "bun check is the fastest when you do not need the Effect diagnostics."

A six-app table on an Apple M4 Pro, using `tsc-rs` 0.1.0, gives geometric means versus `tsc` 6 of 7.1 times for `tsc` 7, 11.4 times for `tsc-rs`, and 20.9 times for `bun check`. Compared with `tsc` 7, the README says `tsc-rs` is 1.61 times faster and `bun check` is 2.95 times faster, and fastest on every app in that table except tRPC.

## Licence

The LICENSE file is MIT, copyright 2026 T3 Tools Inc. The README says the port keeps the licences of the code it ports: TypeScript under Apache-2.0, and parts of the Go standard library under BSD-3-Clause. NOTICE.md says the same. The npm record for 0.1.0 lists the licence field as "MIT AND Apache-2.0".
