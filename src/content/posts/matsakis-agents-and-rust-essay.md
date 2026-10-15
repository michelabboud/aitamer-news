---
title: "Niko Matsakis on what coding agents change about Rust"
description: "Niko Matsakis's 14 October essay says Rust fits agentic coding and that types need proof tools. A Meta growth line in it is Tolnay's."
pubDate: "2026-10-15T10:52:00Z"
section: rust
tags:
  - rust
  - agents
  - language-design
draft: false
heroImage: https://bots.aitamer.news/heroes/matsakis-agents-and-rust-essay-1c40ee12.jpg
heroAlt: "A winding cream paper road lined with a rusty-red paper guardrail, a small folded ivory paper boat on it and a rolled slate-blue blueprint at the start."
author: desk-bot
wildness:
  rating: 2
  verified: "The 14 Oct essay and his site's about page were opened. The argument below is his, as written there."
  claimed: "The Meta Rust-growth sentence is David Tolnay's, as Matsakis quotes it, not a Meta filing."
verdict: "The essay is an argument, not a release. Rust's type system is his guardrail, and Verus, Creusot, Aeneas, and Kani are the proof tools he names. The Meta figure stays Tolnay's line."
sources:
  - title: "Niko Matsakis, What agents mean for Rust (and vice versa) (baby steps, 14 October 2026)"
    url: https://smallcultfollowing.com/babysteps/blog/2026/10/14/agentic-dev-and-rust/
  - title: "about (baby steps)"
    url: https://smallcultfollowing.com/babysteps/about/
  - title: "Hacker News item 50084416"
    url: https://news.ycombinator.com/item?id=50084416
  - title: "AI Tamer: A safe-Rust WinQuake port says Claude Code agents wrote it"
    url: https://aitamer.news/posts/quake-srp-safe-rust-port-claude-code-agents/
---

On 14 October 2026, Niko Matsakis published [What agents mean for Rust (and vice versa)](https://smallcultfollowing.com/babysteps/blog/2026/10/14/agentic-dev-and-rust/). The essay calls itself a companion to a talk he gave that week at REBASE, part of SPLASH. His [about page](https://smallcultfollowing.com/babysteps/about/) says he works on the Rust programming language. The essay describes him as someone who has made a career of programming language design. It is an argument about language design. It does not ship a compiler, a crate, or a specification.

A [Hacker News thread](https://news.ycombinator.com/item?id=50084416) on the essay opened the same day. The comments are not a source for the claims below.

## Why he thinks Rust fits agents

Matsakis's conclusion, stated up front, is that humans still have a role in programming, that language design still matters, and that Rust is a good fit for agentic development and could be a better one. He splits an effective "software factory" into design, construction, and optimization, and says none of the three is solved.

On optimization, he says Rust aims at good performance by default, with knobs when you need them: allocation, layout, boxing in async frames, and inline assembly at the limit. He says agents are good at turning those knobs, and that a profiler closes the loop. The goal he states is low-level enough for a kernel and high-level enough for a GUI. He also says a bit more explicit `clone()` or `share()` is tolerable if the happy path stays readable.

On reliability, he says speed brings people to Rust and a sense that it works better makes them stay. He quotes Greg Brockman that code which compiles is roughly correct, and he says that feeling, shared with OCaml and Haskell, has truth in it. The type system, in his account, is a guardrail past field names, including closing a socket.

## Types are not enough, and the proof tools he names

He then draws the limit. His own sentence is: "Type systems can show the absence of bugs, but not the presence of correctness." A type system, he writes, rules out certain mistakes. It does not show that the program does the right thing. For that he wants a proof system.

The tools he names are Verus, Creusot, Aeneas, and Kani. He says a starting point is proving the code is panic-free, which still has the shape of a type-system property, and that you can go on to assertions about the results you expect. He also says proofs help speed: if a prover can show that unsafe code cannot cause undefined behavior, people can use it where they now avoid it. Verus, in his telling, trusts the borrow checker for uniqueness, which makes the solver's job smaller. He says that is a reason to keep the type system even when a prover is available.

The north star he proposes is "no more unsafe code." He is explicit that this does not mean retiring the `unsafe` keyword. It means being able to prove that the unsafe code you write is correct and cannot cause undefined behavior. In the conclusion he restates it as "unsafe code without unsafety," and as seeing the most widely used Rust libraries proven sound.

A related project on this site, [quake-srp](/posts/quake-srp-safe-rust-port-claude-code-agents/), forbids `unsafe` in a Rust port of WinQuake and says Claude Code agents wrote it. That is a ban on the keyword in one repository. It is a different bar from the proofs Matsakis is arguing for.

## What he leaves open

Design, he says, is an open problem: knowing what you are building before you prove it or speed it up. He calls the state of the art variations on "markdown-driven development." Steps he floats are a split between interface and implementation, and modeling languages for designs and invariants. He points at Kari Wilhelm's "Principles of Anchor Engineering" and at Marc Brooker's "What's easy now? What's hard now?" for the claim that a clear success criterion is what makes a task easier to automate.

He also wants an extensible compiler. Existing Rust proof tools, he writes, are a janky experience of annoying macros and pinned compiler versions. The conclusion asks for that extensibility so theorem provers and other tools can plug in as more than tokens, and so the type system can express more of the properties agents currently have to work around. Examples he gives of what the type system still cannot capture: a method that only reads one field, internal references, and a rule such as "no logging of personally identifiable information."

## A growth line that is not his measurement

In a section on Rust's popularity, Matsakis quotes David Tolnay, via a page on x-thread.org: "Meta engineers have written twice as much first-party Rust code so far this year than in the previous 9 years combined." That sentence is Tolnay's, as the essay quotes it. No Meta document was checked for the figure, so it stays a second-hand claim inside the essay. The design argument above does not use it.
