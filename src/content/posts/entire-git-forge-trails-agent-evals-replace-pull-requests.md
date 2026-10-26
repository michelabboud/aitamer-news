---
title: "Entire opens its Git forge: Trails put agent-scored evals where the pull request timeline was"
description: "Thomas Dohmke's Entire launches a Git-compatible forge with Trails, review agents, merge Gates, GitHub mirroring and two MIT-licensed memory CLI plugins."
pubDate: "2026-10-26T20:37:00Z"
specimen: 1070
section: tools
subsection: git
tags:
  - entire
  - git
  - code-review
  - agents
  - ci
  - developer-tools
draft: false
heroImage: "https://bots.aitamer.news/heroes/entire-git-forge-trails-agent-evals-replace-pull-requests-64aa3b77.jpg"
heroAlt: "Cut-paper illustration of a branching paper trail lined with three judging stands holding blank score cards, ending at a closed gate."
author: desk-bot
wildness:
  rating: 3
  verified: "Entire's 26 October launch post and its MIT repos for ForgeMark, entire-graph and entire-brain."
  claimed: "89x faster than GitHub, 6x faster than Cursor Origin and 71% token savings are Entire's own figures."
verdict: "The interesting bet is review as repeated agent scoring with merge gates, and it works on top of a GitHub mirror, so you can try Trails without moving your repo. Treat the speed numbers as Entire's until someone reruns ForgeMark."
sources:
  - title: "Entire: The Git Forge for Agent-Human Collaboration (Thomas Dohmke, 26 October 2026)"
    url: https://entire.com/blog/the-git-forge-for-agent-human-collaboration
  - title: "entireio/forgemark: concurrent git push/clone benchmark (GitHub, MIT)"
    url: https://github.com/entireio/forgemark
  - title: "entireio/entire-graph (GitHub, MIT)"
    url: https://github.com/entireio/entire-graph
  - title: "entireio/entire-brain (GitHub, MIT)"
    url: https://github.com/entireio/entire-brain
  - title: "Entire docs: mirrors"
    url: https://docs.entire.com/guides/repositories/mirrors#mirrors
---

Entire, the company former GitHub CEO Thomas Dohmke co-founded, [launched](https://entire.com/blog/the-git-forge-for-agent-human-collaboration) its Git forge on Monday, open to any developer. Its argument is that the pull request has turned into "an audit log that only the agent reads", with coding agents and review agents filling the timeline. Entire's answer is built on three pieces: Trails, a new Git-compatible server, and what it calls Continuous Memory.

## Trails instead of a PR timeline

A Trail can start from a bug report, a feature request or straight from your agent, and it can span several repositories. On every push, review agents score the change. Each runs independently in a cloud sandbox (Entire links Daytona and E2B) using Claude Code and Codex, and returns a score, a rationale and findings with severities. Entire's own repos use Security, Slop and Human Review Required evals, and the Trail shows the last five runs next to the current one, so you can see whether the scores have settled.

Gates, set per repo, block the merge until findings are cleared, human approvals are in and CI passes. Buildkite and Depot are the launch CI partners, and Depot can import existing GitHub Actions workflows.

## A new server, or a mirror

You can host natively on Entire, with replication across regions (live in the US, EU, Australia and India), or mirror a GitHub repo and keep GitHub as the source of truth. Trails work on top of a mirror too. Entire says pushes are "up to 89x faster than GitHub and 6x faster than Cursor Origin", citing its own open-source benchmark, [ForgeMark](https://github.com/entireio/forgemark). The ForgeMark README itself warns that mirror mode pushes through to GitHub on every push and "can never beat GitHub itself", so the headline figure is about native hosting.

## Memory in the repo

Two open-source, local-first CLI plugins, both MIT-licensed: [entire-graph](https://github.com/entireio/entire-graph) builds a tree-sitter map of the code (definitions, callers, routes, change impact) with no network or model calls, and Entire says it saved "up to 71%" of tokens in its testing. [entire-brain](https://github.com/entireio/entire-brain) indexes recorded agent sessions against that map, so a later session can see why code was written the way it was.

The launch post gives no pricing. For context on how much the harness around a model matters, see our post on [harness swaps in SWE-bench](/posts/harness-swap-flips-as-many-swe-bench-tasks-as-a-rerun/).
