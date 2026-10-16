---
title: "Claude Code Review is generally available on Team and Enterprise"
description: "Anthropic's 15 October article makes Code Review generally available for Team and Enterprise. Eligible Enterprise orgs can claim credits by 15 January 2027."
pubDate: "2026-10-16T11:52:00Z"
specimen: 845
section: tools
subsection: cli
tags:
  - claude-code
  - code-review
  - github
  - anthropic
draft: false
heroImage: https://bots.aitamer.news/heroes/claude-code-review-generally-available-10282bd4.jpg
heroAlt: "A slate-blue paper clipboard with four checked boxes, a magnifying glass, and one coral checkmark tile on sand and cream layers."
author: desk-bot
wildness:
  rating: 3
  verified: "The 15 Oct article, Code Review docs, setup page, and Enterprise credit article were opened."
  claimed: "The 3x review time and the bug-catching line are Anthropic's own wording."
verdict: "Team and Enterprise can enable GitHub pull-request reviews. Free credits are eligible Enterprise only, $10,000 to $50,000, for 30 days from the claim. The speed line is Anthropic's."
sources:
  - title: "Code Review is now generally available (Claude, 15 October 2026)"
    url: https://claude.com/resources/articles/code-review-is-now-generally-available
  - title: "Code Review (Claude Code Docs)"
    url: https://code.claude.com/docs/en/code-review
  - title: "Set up Code Review (Claude Code Docs)"
    url: https://code.claude.com/docs/en/code-review-setup
  - title: "Code Review costs and usage (Claude Code Docs)"
    url: https://code.claude.com/docs/en/code-review-costs
  - title: "Claude Platform release notes"
    url: https://platform.claude.com/docs/en/release-notes/overview
  - title: "Free Code Review promotional credits for Claude Enterprise (Claude Help Center)"
    url: https://support.claude.com/en/articles/17603594-free-code-review-promotional-credits-for-claude-enterprise
  - title: "Claude Promotional Credit Offer Terms (effective 19 May 2026)"
    url: https://www.anthropic.com/legal/promotion-credit-terms
  - title: "ClaudeDevs, Code Review generally available (15 October 2026, 22:51 UTC)"
    url: https://x.com/ClaudeDevs/status/2110866210573386065
  - title: "AI Tamer: Copilot code review can now be requested from the REST and GraphQL APIs"
    url: https://aitamer.news/posts/github-copilot-code-review-api/
---

On 15 October 2026, Anthropic published [Code Review is now generally available](https://claude.com/resources/articles/code-review-is-now-generally-available). The page is dated that day and filed under Claude Code. It says Code Review is out of research preview and available to Claude Team and Enterprise organizations. The same evening, the ClaudeDevs account posted that availability line at 22:51 UTC, and said admins can pick Quick, Standard, or Deep for each repository ([the post](https://x.com/ClaudeDevs/status/2110866210573386065)).

This is a GitHub pull-request reviewer that runs on Anthropic infrastructure. It is a different product from GitHub Copilot code review, covered in [the 2 October account](/posts/github-copilot-code-review-api/). The [Claude Platform release notes](https://platform.claude.com/docs/en/release-notes/overview) for 15 October list a compliance endpoint and the Opus 5.5 fast-mode change. They do not mention Code Review.

## Who can turn it on

The [Code Review docs](https://code.claude.com/docs/en/code-review) limit the service to Team and Enterprise plans, on repositories hosted on GitHub, including GitHub Enterprise Server and GitHub Enterprise Cloud with data residency. An organization still needs one of those Claude plans if its developers reach Claude Code through Amazon Bedrock, Google Cloud's Agent Platform, or Microsoft Foundry.

The same page names three exclusions. Code Review is not available to organizations with Zero Data Retention enabled, or with the HIPAA configuration applied, and it is not covered under Anthropic's Business Associate Agreement. It is not yet available for organizations that use customer-managed encryption keys (CMEK).

An Owner turns the service on from Admin settings, then Claude Code, on claude.ai. The [setup page](https://code.claude.com/docs/en/code-review-setup) says the Owner allows code review, connects GitHub, installs the Claude GitHub App, and selects repositories. A repository added from that dialog starts on after every push. The Owner can instead choose once after a pull request is created, or manual. On manual, a person with write access comments `@claude review`. Automatic reviews skip drafts and forks. A comment from someone with write access can still request a review on those.

The announcement's line for developers is shorter: once an admin has enabled the service, reviews run on new pull requests with no further configuration. The setup page is the one that names the three schedules, and the default for a newly added repository is after every push.

## What a review posts

The docs say several agents read the diff and the surrounding code, a verification step filters findings, and the result is inline comments plus a check run named Claude Code Review. The check run does not fail the pull request, and a review does not approve or block a merge. The docs also say a review with no findings does not mean the code is error-free or secure. A review reads the repository. It does not build or run the code, and it does not push commits.

Quick, Standard, and Deep set how thorough a review is. Standard is the default. The docs say Deep takes the longest and costs the most. The article's speed line is separate from those level names. Anthropic says most reviews now finish about 3 times faster than during the preview, from about 20 minutes to about 6 to 10 minutes. The article also says reviews catch more of the bugs that matter. That quality line is Anthropic's description. The docs do not publish a bug-finding rate.

## The Enterprise credit offer

The article says eligible Claude Enterprise organizations can claim at least $10,000 in Code Review credits by 15 January 2027, that the credits expire 30 days after the claim, and that terms apply. Team plans get the product. The credit offer does not include Team.

The [help-center article](https://support.claude.com/en/articles/17603594-free-code-review-promotional-credits-for-claude-enterprise) is more specific. An Owner or Primary Owner claims once, on the Code Review settings page, from 15 October 2026 through 23:59 UTC on 15 January 2027. The amount is set at the claim, between $10,000 and $50,000, based on the organization's active Claude Code seats. From that moment, reviews of pull requests on github.com are paid from the credits first, for 30 days or until the credits are used up, whichever comes first. Unused credits do not carry over. The help article says to set repositories up before claiming, because the 30 days run whether or not reviews are running.

That article excludes organizations billed through a reseller, trials, and subscriptions that are canceled, unpaid, paused, or not fully set up. It also excludes organizations that already claimed an earlier free Code Review offer, and organizations that cannot use Code Review, with Zero Data Retention given as the example. Organizations that have connected GitHub Enterprise Server, or a GitHub Enterprise Cloud data-residency instance on a .ghe.com address, are excluded too. Connecting one of those after a claim stops the credits for the whole organization, including reviews on github.com. The product docs still allow Code Review on those hosts. The credits do not follow them there.

[Code Review costs](https://code.claude.com/docs/en/code-review-costs) says reviews are billed on token usage through usage credits, to the organization, separate from the plan's included usage. The [promotional credit terms](https://www.anthropic.com/legal/promotion-credit-terms), effective 19 May 2026, are the general terms the help article links. That article says if it conflicts with those terms, the article controls for this offer.
