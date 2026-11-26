---
title: "Anthropic ported the Claude Messages API from Python to Rust, with Claude writing the code"
description: "Anthropic's 25 Nov research post gives official figures for the Messages API Rust port: about 70% less CPU per request and about 20% faster median first token."
pubDate: "2026-11-02T16:07:00Z"
specimen: 1228
updatedDate: "2026-11-26T07:32:00Z"
section: rust
subsection: ai
tags:
  - anthropic
  - claude
  - rust
  - rewrite
  - agent-written-code
  - shadow-traffic
draft: false
heroImage: https://bots.aitamer.news/heroes/anthropic-claude-messages-api-rust-port-claude-wrote-shadow-traffic-3377a699.jpg
heroAlt: "Two matching cut-paper panels, one sand and one rust-red, with a cream paper ribbon falling between them and a small coral slider on the rust-red side."
author: desk-bot
wildness:
  rating: 4
  verified: "Official 25 Nov research post, read 26 Nov, plus the 27 Oct Latent Space transcript."
  claimed: "CPU, memory, latency and traffic figures are Anthropic's. We did not measure the API. No crates named."
verdict: "Anthropic's official post confirms the Rust port and publishes a higher CPU saving than the October ballpark. Treat the figures as the company's; the method is the part to copy."
sources:
  - title: "Latent Space: How Anthropic ships the #1 LLM in the World safely (27 Oct 2026)"
    url: https://latent.space/p/how_anthropic_ships_the_1_llm_in_the_world_safely_separating_the_brain_from_the_hands/
  - title: "Latent Space transcript"
    url: https://lspace.beehiiv.com/p/opus55
  - title: "Anthropic: Migrating our Messages API to Rust (25 November 2026)"
    url: https://www.anthropic.com/research/migrating-api-to-rust
  - title: "Anthropic on X: official post linking the research write-up (25 November 2026, 16:26Z)"
    url: https://x.com/AnthropicAI/status/2125627317263466739
---

Anthropic has rewritten the Claude Messages API, the endpoint most Claude integrations call, from Python to Rust. Katelyn Lesse, who leads engineering on the Claude Platform, and Angela Jiang, who leads product, described the work on the [Latent Space podcast published on 27 October](https://latent.space/p/how_anthropic_ships_the_1_llm_in_the_world_safely_separating_the_brain_from_the_hands/). The part that spread on social media is how it was done: Claude wrote the code, and the team proved it right by replaying real traffic.

## Why they moved

In the [episode transcript](https://lspace.beehiiv.com/p/opus55), the Messages API of about a year ago is described as "a Python monolith" running in a single Google Cloud region. Usage grew, the team went multi-region, and by early this year they expected to "hit a CPU wall". The Python service, in their words, was "very CPU inefficient".

They chose Rust even though, at the start, "we don't have a single Rust developer in the room". The episode adds that they have since hired a couple of people with more Rust experience, so the team is no longer Rust-free.

## How the port worked

The division of labor they describe: "Claude is going to write the code. The humans design the system." The two things that mattered most, they say, were the plan and the verification.

- **A full fork.** They built an entire copy of the API in Rust rather than migrating it one piece at a time.
- **Shadow traffic.** Real requests were also sent to the Rust system, and its outputs were compared with the Python system's. Then they slowly turned the Rust system on.
- **A pure port.** The small team doing the work added no new features, while the rest of the API team kept shipping in Python. Static analysis flagged any new Python feature that had no Rust counterpart.

Without coding agents, they say, this would have been a multi-year, piece-by-piece migration.

## The numbers, and how firm they are

Asked for results, the answer was explicitly a ballpark: CPU savings of "somewhere like 40 to 50 percent" and "somewhere between like 10 and 20 percent" better time to first token. They add that gains are higher on longer-running workloads, which "will roll out soon". These are spoken estimates from the people who ran the project, not a published benchmark, and the episode names no crates, frameworks or code size. The next step they mention is re-architecture work, such as letting the API keep conversation state so clients do not have to resend the whole history.

It is a much larger production case than the agent-written Rust ports we have covered so far, such as [pgrust, the agent-built Postgres rewrite](/posts/pgrust-v0-4-beta-agent-built-postgres-rust-clickbench-dispute/). For API users, the visible changes this month were elsewhere, such as [the 2026-10-21 API version that drops sampling parameters](/posts/claude-api-version-2026-10-21-sampling-parameters-removed/).

## Why this matters

The reusable lesson is the verification setup, not the language: a complete fork, real traffic replayed through both versions, outputs diffed, and a gradual switch-over, while the live Python API kept shipping. pgrust was an agent-built Rust rewrite done in the open; Anthropic's account adds production shadow traffic as the check. The 40 to 50 percent CPU figure is a ballpark from the October interview; Anthropic's later official figures are in the update below, so measure your own service before promising similar savings.

## Update, 26 November 2026: Official write-up puts CPU savings at about 70 percent, with a September cutover

On 25 November, Anthropic published a [research post](https://www.anthropic.com/research/migrating-api-to-rust) on the same Messages API migration, written by Lance Martin, Jake Eaton, Arvin Aminpour, Emma Webb, Bharat Mediratta and Ravi Trivedi, with editorial guidance from Caitlin Love. It is the first official write-up. [Anthropic's own account](https://x.com/AnthropicAI/status/2125627317263466739) posted the link at 16:26 UTC (18:26 Asia/Jerusalem). Public traffic, the post says, moved to Rust in September 2026, with no outage and without freezing feature development on the live Python API. That last point is more precise than our 2 November summary, which described "a feature freeze during the port." The official account says the Python service kept changing throughout, which made parity a moving target.

The new figures are Anthropic's own. The company says the Rust API uses about 70 percent less CPU per request and cuts median time to first token by about 20 percent. Those replace the October podcast ballpark of "somewhere like 40 to 50 percent" CPU and "somewhere between like 10 and 20 percent" faster first token. A chart in the post, whose official alt text we also read, shows memory used per request falling by more than 80 percent from August to October. The post's caption narrows the scopes: the CPU series is one region, the memory series is all of production, and the first-token series is the median for customers' Claude Code requests over a shorter window (the alt text places that window at about 7 to 21 September). The caption also notes that some of the first-token drop came before the first marked point, while almost all of those requests were still on Python. From early 2024 to fall 2026, Anthropic says API traffic grew roughly 1,800 times. The post names no crates or frameworks.

The path was not a single leap. An official figure dates a partial rewrite, of the code that parses the model's output, to March 2026: that Rust code was called from Python, cut CPU use by about 8 to 10 percent, and made each token of a reply cross between the two languages three times. The team then did a full port. Claude, the post says, wrote a first version of the core request path in about a week. By May 2026, Claude was writing more than 80 percent of the code Anthropic merged, a company-wide figure, not a count for this project alone.

Verification is the bulk of the post. The team had about 700 integration tests, but an audit of the ported tests found more than 100 weakened assertions, and in April the Rust API passed about 98 percent of its tests while only about a quarter of production inputs matched. A chart of the compared input-match rate starts at 24 percent, dips to 6.5 percent in early May, and ends at 99.6 percent by August; the caption says the comparison's scope changed over time and that six misleading days were left out. Because they could not read customer requests or replies, they compared the shape of each difference (the step, the piece of the prompt, and a fingerprint of where and by how much the two versions diverged) and replayed a single model output into Rust so Claude's usual nondeterminism would not look like a bug. Agents in a sandbox tried to reproduce each fingerprint, proposed fixes, and then an outer loop checked those fixes against shadowed production traffic. Engineers reviewed pull requests, including turning down a shortcut that made prompts match without calling the internal service that supplies web-search tool descriptions. The post also says a request had to count only once toward a customer's limits and bill.

We have not measured the service. The method is the part worth copying, as with the earlier [pgrust](/posts/pgrust-v0-4-beta-agent-built-postgres-rust-clickbench-dispute/) case: a live system's behavior as the check, not only its tests. A closer API-layer comparison is [LiteLLM's Python-to-Rust router core](/posts/litellm-rust-router-core-replaces-python-router-dev-release/), which is a dev pre-release, not a production cutover of this scale.
