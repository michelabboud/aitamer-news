---
title: When Dependabot Puts Several Fixes in One PR
description: Dependabot grouping rules decide which security fixes arrive together. Review the configuration and each affected dependency before merging.
pubDate: "2026-10-06T01:30:00Z"
specimen: 292
section: devops
tags:
  - dependabot
  - github
  - dependency-security
  - code-review
draft: false
heroImage: https://media.aitamer.news/heroes/when-dependabot-puts-several-fixes-in-one-pr-24a8e183.jpg
heroAlt: A paper robot groups gears and other parts into one box beside a checklist.
author: ari
wildness:
  rating: 2
  verified: GitHub documents broad grouping, file rules, and first-match ordering.
  claimed: Grouping changes which dependency fixes reviewers approve together.
verdict: Treat each grouped pull request as one combined change with several package-level decisions. Check the grouping rules, review each alert, and test affected code before merging.
sources:
  - title: Configuring Dependabot security updates
    url: https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/configure-security-updates
  - title: Dependabot pull requests
    url: https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-pull-requests
  - title: Viewing and updating Dependabot alerts
    url: https://docs.github.com/en/code-security/how-tos/manage-security-alerts/manage-dependabot-alerts/view-dependabot-alerts
---

A grouped Dependabot pull request may update several vulnerable dependencies at once. GitHub can group available security updates across directories within an ecosystem through a repository or organization setting. A `dependabot.yml` file offers more specific rules. The result is a wider unit of review: approving one pull request accepts every dependency change it contains. [GitHub's configuration guide](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/configure-security-updates) describes both controls.

## Where the group boundary comes from

The broad setting tries to combine as many available security updates as possible per ecosystem. In `dependabot.yml`, `groups` with `applies-to: security-updates` can select packages by name, dependency type, or version change type. Rules are evaluated in file order. If an update matches several groups, it goes into the first matching group. That makes rule order part of the review boundary. [GitHub documents the matching rules](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/configure-security-updates).

The two controls can coexist. GitHub says configured directories follow their file rules. Repository or organization grouping applies to directories outside that configuration only when the broader setting is enabled. A configuration also needs paths that match the manifest files, and GitHub says you should not specify a `target-branch`. [These limits appear in GitHub's guide](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/configure-security-updates).

## What a grouped review contains

A security pull request can include vulnerability details, release notes, changelog entries, and commit information. GitHub recommends automated checks before merging, especially when a proposed version adds functionality or breaks project code. [Its pull request guide](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-pull-requests) explains what reviewers receive. A passing check covers the combined change. Review each package and affected application path to understand what that combined result includes.

GitHub's Dependabot tab lists alerts and their related security updates. Reviewers can filter alerts by package, ecosystem, or manifest and open each alert for details. [GitHub's alert guide](https://docs.github.com/en/code-security/how-tos/manage-security-alerts/manage-dependabot-alerts/view-dependabot-alerts) describes those views. One pull request can therefore require several alert decisions.

## What to do

1. Check the repository or organization grouping setting and the `groups` rules in `dependabot.yml`. Read overlapping rules in order.
2. For each changed dependency, open its alert, inspect the proposed version and release notes, and review the manifest and lockfile diff.
3. Run the project's checks, including tests for code paths that use the changed packages. If the group is too broad to diagnose or review, tighten its package patterns or use `exclude-patterns`.
4. After merging, check the Dependabot tab for alerts that remain open. GitHub says merging a security update marks its corresponding alert resolved; the alert list shows what still needs attention. [GitHub documents that behavior](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-pull-requests).
