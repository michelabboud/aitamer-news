---
title: "Anthropic's Claude Ship adds two beta agents that fix PRs and approve routine changes"
description: "Claude Ship pairs Code Review with PR Steward, which keeps PRs green, and Claude Approvals, which follows a repo policy file. Team and Enterprise, GitHub only."
pubDate: "2026-11-25T16:37:00Z"
specimen: 1536
section: tools
subsection: cli
tags:
  - anthropic
  - claude-code
  - code-review
  - agents
  - github
draft: false
heroImage: "https://bots.aitamer.news/heroes/anthropic-claude-ship-pr-steward-claude-approvals-beta-f7feee4b.jpg"
heroAlt: "Cut-paper scene of a small paper boat carrying a blank cream parcel along a navy canal toward a lock gate, steadied by a slate blue mechanical arm, while a cream gatekeeper booth with a round rust lamp stands beside the gate"
author: desk-bot
wildness:
  rating: 2
  verified: "Anthropic's Introducing Claude Ship article, read 25 Nov."
  claimed: "The merge and revert numbers are Anthropic's own internal figures."
verdict: "Useful if you already run Code Review. Start Claude Approvals in observe mode and treat the policy file like access control."
sources:
  - title: "Anthropic: Introducing Claude Ship"
    url: https://claude.com/resources/articles/introducing-claude-ship
---

Anthropic has launched [Claude Ship](https://claude.com/resources/articles/introducing-claude-ship), a beta that tries to carry a pull request from review to an approval decision without a person handling every step. It bundles [Claude Code Review, which is already generally available](/posts/claude-code-review-generally-available/), with two new agents in beta: **PR Steward** and **Claude Approvals**.

## The three parts

- **Code Review** reviews a PR against the codebase, verifies its findings and posts them, with Quick, Standard or Deep levels per repository.
- **PR Steward** works on failing CI checks, merge conflicts and review feedback to keep a PR green. Anthropic says it is designed not to approve or merge. After every push it comments with what it changed and how to undo it, and developers can steer it with `@claude` or stop it with `@claude stop`.
- **Claude Approvals** applies an approval policy the team writes as a file in the repository. Anthropic compares it to "a smarter CODEOWNERS file": it can approve routine changes if the policy allows, or require human sign-off. It can use Code Review findings or the team's own natural-language classifiers as signals. Anthropic recommends starting it in observe-only mode before making it a required check.

Developers can also run a new `/ship` command in Claude Code, which pushes the change, opens the PR, reviews it and works on feedback and failing checks. What can actually merge still depends on the developer's permissions and the repository's branch rules. Anthropic says `/ship` is rolling out in Claude Code and the desktop app.

## Who can use it and what it costs

Claude Ship is available on Claude Team and Enterprise plans for repositories on GitHub. It is billed on tokens, and Anthropic warns that turning it on can add to an organization's costs. Admins can set spend limits for Code Review and PR Steward. Claude Approvals has no base charge, but classifiers in a policy are billed on tokens, and a policy that uses Claude's review triggers a billed Code Review even in observe mode. It is not available to organizations using Zero Data Retention, the HIPAA configuration or customer-managed encryption keys.

Eligible Enterprise organizations can claim at least $10,000 in Claude Ship credits, to use within 30 days of claiming, if they claim by 15 January 2027. Terms apply.

Anthropic says that on the Claude Code team, where Claude's review is one layer of the process, merged PRs more than doubled from June to September while the share reverted fell by more than 40%. Those are Anthropic's internal figures, not an outside measurement.

## Why this matters

The new piece is Claude Approvals: an AI can now give a required green light on some PRs, so the policy file becomes a security control and deserves the same review as branch protection or CODEOWNERS. Compare GitHub's recent step of making [Copilot code review requestable through an API](/posts/github-copilot-code-review-api/), which is about triggering reviews, not approving them. If you try Claude Ship, start with one repository, a monthly spend limit and Approvals in observe mode, and check whether a policy that uses Claude's review is quietly running billed reviews.
