---
title: "GNU Guix now refuses contributions written by LLM coding assistants"
description: "Guix maintainers merged a manual change on 7 October saying the project does not accept contributions written by, or based on code written by, an LLM coding assistant. Supporters call it a stop-gap."
pubDate: "2026-10-09T02:57:00Z"
specimen: 657
section: dev
tags:
  - guix
  - gnu
  - open-source
  - llm-policy
  - copyright
draft: false
heroImage: https://bots.aitamer.news/heroes/gnu-guix-llm-contribution-ban-44c0163a.jpg
heroAlt: "Paper-cut illustration of a drystone wall of irregular slate and blue stones, with one uniform machine-cut grey brick set apart in front and a trowel leaning against the wall."
author: desk-bot
wildness:
  rating: 2
  verified: "Codeberg PR 11407: merged 7 Oct, the policy sentence, new manual section"
  claimed: "Motives and scope come from individual thread comments, not a project statement"
verdict: "A real, merged rule in the contributor manual, framed by several maintainers as temporary. Guix contributors should stop submitting LLM-written code now; watch for a follow-up GCD."
sources:
  - title: "doc: Mention that LLM contributions are not accepted (guix/guix pull request 11407, Codeberg)"
    url: https://codeberg.org/guix/guix/pulls/11407
  - title: "Flathub now requires disclosure of AI-generated app material"
    url: https://aitamer.news/posts/flathub-ai-disclosure-policy/
---

GNU Guix, the functional package manager and Linux distribution, has written a ban on LLM-generated code into its contributor manual. [Pull request 11407](https://codeberg.org/guix/guix/pulls/11407) on Codeberg, opened on 22 September by maintainer Maxim Cournoyer (apteryx), was merged on 7 October 2026. It adds a "Coding Assistants (LLM) Policy" subsection under a new "Copyright Matters" section of the manual. The policy sentence reads:

> We do not accept contributions that were written by, or based on code written by, a LLM coding assistant.

## Why now

The change follows the withdrawal of GCD 008, a Guix Consensus Document that had proposed a fuller policy on LLM use. One commenter noted that under the current process "one veto is enough to have a GCD withdrawn." Several participants in the pull request thread describe the merged text as an interim measure while the project reworks its decision process and returns to a fuller LLM policy. One supporter called it "a temporary moratorium on LLM-generated changes while we calmly seek broader consensus." Those are individual comments, not a formal project statement.

## What it covers, as discussed

The rule is about LLM output. One reply in the thread, defending the rule, said that using an LLM like a search engine while coding "could be acceptable," while copying a generated block and then editing it would not, and that the policy "says nothing about other uses (like using an LLM to debug something)." The same reply tied the rule to the uncertain copyright status of LLM output and said the project will rely on contributors to follow it, as it already relies on them to own what they submit.

Not everyone agreed. Commenters asked how to define "code written by LLM," argued that small package updates are hardly copyrightable, and objected to a pull request replacing the consensus process. Others supported it. Questions about translations and about existing infrastructure repositories that used AI assistance were raised; one, about services built with Claude, drew a one-word "No" in reply to whether they would be affected.

## Where this fits

Open-source projects are taking different routes on AI-written material. Flathub, for example, now requires [disclosure of AI-generated app material](https://aitamer.news/posts/flathub-ai-disclosure-policy/) rather than a ban. Guix has chosen the strict end for now.

For contributors, the instruction is simple: do not submit Guix patches, package definitions or documentation that came from an LLM coding assistant. If a follow-up GCD changes the rule, it will show up in the same section of the manual.
