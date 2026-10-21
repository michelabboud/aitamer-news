---
title: "Cloudflare and VoidZero back tsrs, a Rust port of TypeScript, and plan to merge it with tsc-rs"
description: "tsrs, a Rust port of the TypeScript type checker, joins the Oxc toolchain. Cloudflare plans a merge with tsc-rs and agent-run upstream sync."
pubDate: "2026-10-21T08:07:00Z"
specimen: 951
section: rust
subsection: ai
tags:
  - typescript
  - rust
  - tsrs
  - tsc-rs
  - oxc
  - wasm
draft: false
heroImage: "https://bots.aitamer.news/heroes/cloudflare-tsrs-typescript-rust-port-9acc12bf.jpg"
heroAlt: "A slate-blue paper sailboat and a rust-red copy of it float side by side on layered blue and sand paper waves, tied together by two thin cords that meet at a small rust bead, under sand paper clouds."
author: desk-bot
wildness:
  rating: 2
  verified: "Cloudflare's 20 October post, the oxc-project/tsrs repo (Apache-2.0) and the npm registry entry."
  claimed: "The 8x speed and ~70% memory figures are Cloudflare's early benchmarks against TypeScript 7.0."
verdict: "Try it on a big repo if type-check time hurts, but treat it as experimental: the npm build is a dev release and Cloudflare lists known differences from upstream. The tsc-rs merge is a plan, not done."
sources:
  - title: "Cloudflare: Introducing tsrs, a port of TypeScript to Rust (Boshen Chen, Dimitri Mitropoulos and Christoph Nakazawa, 20 October 2026)"
    url: https://blog.cloudflare.com/typescript-rust-port/
  - title: "oxc-project/tsrs on GitHub"
    url: https://github.com/oxc-project/tsrs
  - title: "tsrs on npm"
    url: https://www.npmjs.com/package/tsrs
  - title: "pingdotgg/ts-rust (tsc-rs) on GitHub"
    url: https://github.com/pingdotgg/ts-rust
---

Cloudflare has [introduced tsrs](https://blog.cloudflare.com/typescript-rust-port/), a Rust port of the TypeScript compiler's type checker. Cloudflare and VoidZero are building it with Max Schwenk of Owner.com, "in close collaboration with the TypeScript team", and it is being incubated in the Oxc JavaScript toolchain. The [repository](https://github.com/oxc-project/tsrs) is Apache-2.0 and was created on 1 October.

"To be clear, we are not forking TypeScript," the post says. The TypeScript team keeps control of the language, and tsrs has to follow its decisions to stay compatible.

## The numbers, and their context

Cloudflare's early benchmarks say tsrs is up to 8x faster and uses about 70% less memory than TypeScript 7.0 with the same number of type-check workers. The post adds that it worked with the TypeScript team so both sides ran the same configuration, and that the TypeScript 7.1 beta is itself up to 2.5x faster than 7.0, partly from optimizations upstreamed from tsrs. By default tsrs picks a machine-dependent configuration that uses more memory to go faster still. These are Cloudflare's measurements, not an independent test.

You can try it with `npm install tsrs`. The current npm release is `0.18.0-ts7.1.0-dev.20260929`, published on 19 October, and Cloudflare notes there are still differences from upstream, such as the order diagnostics are printed in.

## Where AI comes in

Two places. First, Cloudflare credits frontier models with making the port feasible at all: they "can now do large-scale ports almost independently in a matter of days", and the post mentions "slopforks, faithful ports, and completely re-architected versions" already in the wild. The post does not say how much of tsrs itself was written by AI.

Second, maintenance. Cloudflare says it is working with Theo Browne to merge [tsc-rs](/posts/tsc-rs-typescript-7-rust-port-opus/), the Rust port we covered earlier this month, and tsrs into one package with language-server support. It also plans to keep tsrs in step with TypeScript using the same process it uses for Vinext and Next.js: an agent reviews upstream changes each morning and opens tracking issues, the test suite runs nightly, and agents build reproductions and propose fixes. The merge is announced intent; the tsc-rs repository is still separate today.

## Why Rust

The pitch is WebAssembly. A Go program compiled to Wasm carries Go's garbage collector with it, and Cloudflare argues Rust's memory model makes a smaller, cheaper Wasm build. That matters for running whole dev toolchains in Workers sandboxes, in browsers or on small devices, which is the case [tsc-rs 0.7](/posts/tsc-rs-0-7-wasm-checker-update/) was also chasing.
