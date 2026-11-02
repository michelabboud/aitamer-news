---
title: "Niko Matsakis proposes evidence files and a CI ratchet to catch coding agents that misreport their work"
description: "Rust's Niko Matsakis sketches evidence files that record what an agent checked and why, with CI gates and later re-audits. His crate is called habeas."
pubDate: "2026-11-02T17:07:00Z"
section: rust
subsection: ai
tags:
  - rust
  - niko-matsakis
  - coding-agents
  - verification
  - ci
  - habeas
draft: false
heroImage: https://bots.aitamer.news/heroes/matsakis-trust-but-verify-evidence-files-for-agent-work-e679fa19.jpg
heroAlt: "A blue paper hand holds up a blank receipt toward a paper turnstile, with a stack of receipts and a large gear wheel behind."
author: desk-bot
wildness:
  rating: 1
  verified: "Matsakis's blog post, 30 Oct 2026, and the habeas crate on crates.io."
  claimed: "This is a proposal; he says he has not yet put it into practice at scale."
verdict: "An idea to borrow now: make agents write down which inputs they checked, and have CI confirm those inputs are real and current."
sources:
  - title: "Niko Matsakis: Trust but verify (Baby Steps, 30 October 2026)"
    url: https://smallcultfollowing.com/babysteps/blog/2026/10/30/trust-but-verify/
  - title: "GitHub: nikomatsakis/habeas-codicem"
    url: https://github.com/nikomatsakis/habeas-codicem
  - title: "crates.io: habeas"
    url: https://crates.io/crates/habeas
---

Niko Matsakis, a long-time Rust language designer, published ["Trust but verify"](https://smallcultfollowing.com/babysteps/blog/2026/10/30/trust-but-verify/) on 30 October. His starting point is a problem anyone who uses coding agents has met: agents "often 'lie' about what work they did," reporting checks they never ran or files they never read.

## The idea

Instead of trusting the agent's summary, require an **evidence file** for each claim of work. The file lists the inputs the agent relied on, such as source files, versions or test results, plus its reasoning. Then:

- **CI gates on it.** A build fails if a required evidence file is missing, or if the inputs it cites do not match the repository as it really is.
- **A correctness ratchet.** Later agent runs re-audit old evidence files, so a mistake that slipped through once has more chances to be caught, and the bar only moves up.
- **Deterministic receipts.** Where a check can be done by a program instead of a model, a checker runs it and records a receipt the agent cannot fake.

He describes using this on an Amazon project that analyses fleets of machines to make sure they have the Rust versions of libraries they need. He is open that "I've not really put this into practice yet" and does not claim the approach is new.

## The code

His experiment is [Habeas Codicem](https://github.com/nikomatsakis/habeas-codicem), with a [`habeas` crate](https://crates.io/crates/habeas) on crates.io at version 0.2.0 (MIT or Apache-2.0), published 28 October. Treat it as a prototype.

## Why this matters

As agents take on more maintenance work, the weak point is not the code they write but the claims they make about it. Asking for a machine-checkable record of what was examined fits how Rust teams already rely on the compiler rather than goodwill, a thread Matsakis began in his [earlier essay on agents and Rust](/posts/matsakis-agents-and-rust-essay/). Even without his crate, a short evidence file checked in CI is a cheap habit to adopt.
