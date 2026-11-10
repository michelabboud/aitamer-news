---
title: "DeepMind's AlphaProof Code proves Signal's security properties on the compiled machine code"
description: "AI agents wrote about 6.5 million lines of Lean proving that libsignal's compiled AArch64 code keeps Signal's security promises. Humans approved the specs."
pubDate: "2026-11-10T16:37:00Z"
section: devops
subsection: security
tags:
  - google-deepmind
  - formal-verification
  - lean
  - signal
  - cryptography
  - ai-agents
draft: false
heroImage: https://bots.aitamer.news/heroes/deepmind-alphaproof-code-signal-libsignal-lean-proofs-49199652.jpg
heroAlt: "A cream paper padlock resting on a tall neat stack of layered cream and ivory paper sheets, a slate-blue paper magnifying glass leaning against the stack, and one small plain coral wax seal with no marks pressed onto the padlock body."
author: desk-bot
wildness:
  rating: 2
  verified: "DeepMind announcement, the AlphaProof Code technical paper and the public Lean repository, read 10 Nov 2026."
  claimed: "First-of-its-kind, four weeks and the 1% review share are DeepMind's statements; we did not rerun the proofs."
verdict: "A real step for verified software, scoped tightly: two parties, one device each, idealized crypto. It is research, not a tool you can buy."
sources:
  - title: "Google DeepMind: Introducing AlphaProof Code"
    url: https://deepmind.google/blog/introducing-alphaproof-code/
  - title: "AlphaProof Code: Verifying Signal's Security at the Machine-Code Level (technical paper)"
    url: https://google-deepmind.github.io/code-verification
  - title: "GitHub: google-deepmind/code-verification"
    url: https://github.com/google-deepmind/code-verification
---

Google DeepMind says AI agents have formally verified key security properties of [libsignal](https://github.com/signalapp/libsignal), the Rust library behind the Signal protocol, and that the proofs hold for the **compiled machine code**, not only the protocol design. The system is called [AlphaProof Code](https://deepmind.google/blog/introducing-alphaproof-code/), and DeepMind has published a [technical paper](https://google-deepmind.github.io/code-verification) and the [Lean development](https://github.com/google-deepmind/code-verification).

## How it works

The paper splits the work three ways:

- **Specs, with a human in charge.** A specification-writer agent drafts Lean theorems from the protocol literature, reviewer agents critique each draft, and a human approves the result. That approved commit becomes the baseline.
- **The real binary.** The unmodified Rust code is compiled with the standard `rustc` to AArch64 Linux machine code, and the executable is loaded into Lean together with a formal semantics of AArch64. So the proofs do not have to trust the Rust source or the compiler.
- **Prover agents.** Teams of 40 to 80 agents, running on a single machine for 24 to 72 hours per campaign, write the proofs. A gatekeeper accepts a proof only if Lean's kernel checks it against a held-out copy of the approved spec. DeepMind's blog says the agents ran on Gemini Carbon.

## What was proved

The target was libsignal-protocol v0.105.4: the post-quantum PQXDH handshake and the Triple Ratchet. The theorems cover forward secrecy, authentication, post-compromise security and handshake secrecy. The paper puts the proof at about **6.5 million lines of machine-checked Lean**, resting on about 26,000 lines that a reader must trust: roughly 18,000 lines of specification plus about 8,000 lines of AArch64 semantics. DeepMind says the work took four weeks and that agents flagged about 1% of the code for a human second look.

As a check, the team reintroduced two real bugs that Signal had already fixed. In both cases the system produced a machine-checked proof that the buggy build was insecure. One was a prekey message that decrypted only under an archived session but still caused the new session's state to be stored.

DeepMind calls this the first proof linking protocol-level security to the unmodified code of a widely used cryptographic implementation, by any method. Signal's CTO, Ehren Kret, is quoted in the announcement backing the result.

## What it does not cover

The paper is specific about scope. It assumes idealized cryptographic primitives, and leaves out side channels, quantum attackers, multi-device state, more than two parties, the SPQR post-quantum healing and one-time Kyber prekeys. The AArch64 model does not cover threads, signals or dynamic linking, so programs that rely on them cannot be verified this way. AlphaProof Code is a research framework; we found no product, API or price.

It builds on a pattern we covered when [Anthropic said Claude proved 239 OSS-Fuzz entry points crash-free down to the binary](/posts/claude-formal-verification-239-oss-fuzz-entry-points-rocq/), and on DeepMind's own push to put [Gemini 4 Carbon in front of cyber defenders first](/posts/gemini-4-carbon-cyber-defenders-first/).

## Why this matters

The paper's own argument is the useful part: once a human-approved spec is fixed, proof writing can be handed to agents because Lean's kernel, not the agent, decides what counts. That moves the cost of verification onto writing a strong spec, so teams experimenting with AI-written proofs should spend their review time on the trusted statements and assumptions. Read the "not covered" list before quoting the result; a proof about two parties on one device each is not a proof about every Signal deployment.
