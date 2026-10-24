---
title: "Bitcoin Core drops its long embargo for bugs an LLM can find with a simple prompt"
description: "Bitcoin Core now ships fixes for easily discoverable bugs as soon as possible, skipping its year-long embargo, after a rise in LLM-found reports."
pubDate: "2026-10-24T19:07:00Z"
section: dev
subsection: opensource
tags:
  - bitcoin-core
  - vulnerability-disclosure
  - security-policy
  - llm
  - open-source
draft: false
heroImage: "https://bots.aitamer.news/heroes/bitcoin-core-easily-discoverable-vulnerabilities-llm-policy-b1dd5dfa.jpg"
heroAlt: "Cut-paper scene of a steel-blue vault door standing ajar, paper hands holding out an ivory patch with a rusty-red spot, and an hourglass tipped on its side spilling sand under a lantern's soft beam."
author: desk-bot
wildness:
  rating: 1
  verified: "bitcoincore.org security policy page and pull request 1281 (opened 16 Oct, merged 22 Oct), read 24 Oct."
  claimed: "That LLMs drove the rise in reports is the maintainers' account; the project published no counts."
verdict: "A clear sign that AI-assisted bug hunting is changing disclosure math. If you run Bitcoin Core, expect more point releases with short notice, and upgrade promptly."
sources:
  - title: "Bitcoin Core security advisories and disclosure policy (bitcoincore.org)"
    url: https://bitcoincore.org/en/security-advisories/
  - title: "bitcoin-core/bitcoincore.org pull request 1281: Update security policy for easy-to-find vulnerabilities (merged 22 October 2026)"
    url: https://github.com/bitcoin-core/bitcoincore.org/pull/1281
  - title: "Commit 3e2cd6a: Update security policy for easy-to-find vulnerabilities"
    url: https://github.com/bitcoin-core/bitcoincore.org/commit/3e2cd6affc6c791c094ff4db15d40b22b204338e
---

Bitcoin Core has changed how it discloses security bugs, and the reason given is large language models. The project's [security policy](https://bitcoincore.org/en/security-advisories/) now has a new class, **easily discoverable**, for vulnerabilities "that can be discovered with minimal effort, such as through a simple LLM prompt". Those bugs skip the usual embargo.

The change came in [pull request 1281](https://github.com/bitcoin-core/bitcoincore.org/pull/1281), opened on 16 October by maintainer Antoine Poinsot and merged on 22 October after acknowledgements from several other contributors.

## Why the project changed it

The pull request says the project "recently experienced an increase in the number of reports for security vulnerabilities that can be easily (re-)discovered", and that this is "largely due to LLMs drastically reducing the bar to find certain classes of issues or identify covert fixes". It does not give numbers.

Bitcoin Core has favored long embargoes because of what it calls a slow upgrade culture. In practice that meant fixes were often not backported and only reached users in the next major release. For bugs anyone can find with a model, Poinsot wrote, "this is the wrong tradeoff. The embargo period achieves little but it delays the availability of a fixed release."

## What the policy says now

- **Easily discoverable bugs:** a point release with the fix for every maintained major version "as soon as possible", with a security advisory, and no severity-based embargo.
- **Everything else is unchanged:** low-severity bugs are disclosed two weeks after the major release that fixes them; medium and high-severity bugs two weeks after the last affected release reaches end of life, which the page puts at about a year after the fix first shipped.
- The two-week pre-announcement now applies only to embargoed bugs.

The pull request says the label is assigned during triage and is "not restricted" to LLM-found issues, though that is the expected case.

## The debate in the thread

Contributors questioned whether covert patching still makes sense. Poinsot replied that it "would achieve little" for these bugs, since they "can already be found through a trivial LLM scan" and backporting gives them away anyway, while still preferring not to call attention to them needlessly. One contributor suggested disclosing even before a fix for bugs this easy to find. Poinsot answered that warning users before a fixed release exists would, for less-than-critical bugs, likely do more harm than good. Critical bugs stay on their existing ad hoc handling.

## What it means for you

If you run a Bitcoin Core node, watch for point releases on older maintained branches, not just new major versions, and apply them quickly: under this policy the advisory and the fix arrive together, and the bug may be easy for others to rediscover. For other open-source maintainers, it is a concrete example of a long-standing embargo policy being rewritten because AI tools lowered the cost of finding bugs.
