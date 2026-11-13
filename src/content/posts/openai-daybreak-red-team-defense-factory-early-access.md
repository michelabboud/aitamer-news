---
title: "OpenAI launches Daybreak Red Team for agent pen-testing, plus Defense Factory for patch PRs"
description: "Daybreak Red Team sends a team of agents at your web apps and is in early access. Defense Factory turns findings into patches that engineers approve."
pubDate: "2026-11-13T08:07:00Z"
section: devops
subsection: security
tags:
  - openai
  - daybreak
  - penetration-testing
  - ai-security
  - codex
  - appsec
draft: false
heroImage: https://bots.aitamer.news/heroes/openai-daybreak-red-team-defense-factory-early-access-14eeee71.jpg
heroAlt: "Three small paper scouts test the hinges of a sand-colored paper gate inside a fenced perimeter, beside a workbench holding a rusty-red mended patch."
author: desk-bot
wildness:
  rating: 2
  verified: "OpenAI Daybreak Red Team page and cybersecurity hub, read 13 Nov; The Register keynote report."
  claimed: "Early access per The Register. No pricing or results published; capability lines are OpenAI's."
verdict: "Two more vendor routes into AI-run appsec. Worth a trial on an app you already pen-test, so you can compare the agents with findings you know."
sources:
  - title: "OpenAI: Daybreak Red Team, AI penetration testing for web applications"
    url: https://openai.com/daybreak/red-team/
  - title: "OpenAI: Frontier intelligence for cybersecurity (Daybreak hub)"
    url: https://openai.com/business/solutions/cybersecurity/
  - title: "The Register: OpenAI launches security products (12 November 2026)"
    url: https://www.theregister.com/security/2026/11/12/openai-launches-security-products-tells-orgs-theyre-doomed-if-they-dont-use-them/5309500
---

OpenAI used its "Cyber at the Frontier" keynote on 12 November to add two products to Daybreak, its security platform. [Daybreak Red Team](https://openai.com/daybreak/red-team/) points a coordinated team of agents at your web applications. Daybreak Defense Factory scans codebases and drafts patches. [The Register reports](https://www.theregister.com/security/2026/11/12/openai-launches-security-products-tells-orgs-theyre-doomed-if-they-dont-use-them/5309500) that Red Team is in early access, and neither OpenAI page lists a price.

## Red Team: agents that attack, validate and retest

OpenAI's product page describes three jobs:

- **Test applications.** Agents use source code and app context to investigate attack paths and confirm vulnerabilities.
- **Validate reported findings.** Feed it results from code scanners, bug bounty submissions and disclosure reports, and use the evidence to decide what to fix first.
- **Check that fixes hold.** Rerun the attack against a patch, and repeat the assessment as the app changes.

Scope control is the part security teams will ask about first. OpenAI says assessments run in isolated environments with "Guardian review", and that you control which apps and endpoints the agents can reach. It does not publish detection rates or comparisons with human testers, so treat the capability claims as the vendor's until you have run it on an app whose weaknesses you already know.

## Defense Factory: findings to merge-ready patches

On OpenAI's [cybersecurity hub](https://openai.com/business/solutions/cybersecurity/), Defense Factory goes "from findings to fixes at the push of a button", with scans and patching workflows running remotely. According to The Register, its agents run on OpenAI's latest cyber model, currently [GPT-6 Cyber](/posts/openai-gpt-6-cyber/), and engineers review and approve each proposed fix before it reaches production. Nancy Wang, who leads cyber applied AI at OpenAI, said engineers get "a merge-ready pull request with the patch and a test that shows that it works."

The hub also lists the pieces around it:

| Piece | Where it runs |
| --- | --- |
| Daybreak plugin | In Codex; scans run and findings are stored locally |
| PR review | Checks pull requests for reintroduced vulnerabilities |
| Codex Security CLI | Your terminal, or your CI pipeline |
| Codex Security SDK | TypeScript apps, with structured findings and coverage data |

Model access sits underneath: Daybreak Blue for defensive work on general models, and Daybreak Red for specialized cyber models with extra verification. If you use Daybreak on a personal account, note the [training and API changes OpenAI set for 20 and 29 November](/posts/openai-daybreak-blue-personal-accounts-training-api-change/).

OpenAI President Greg Brockman framed the pitch bluntly in the keynote: "companies will be secure only to the extent of the frontier model that they use to defend themselves and how well they utilize that." He also said security fundamentals are "not to be discounted."

## Why this matters

AI bug-finding is moving from research reports into products you can buy. Microsoft's [MDASH kernel numbers](/posts/microsoft-mdash-59-linux-kernel-bugs-33-cves/) showed the hard part is validation and patching, which are exactly the steps Red Team and Defense Factory claim to automate. Before granting either product source access, check the scope controls and keep human approval on every patch, as OpenAI's own Defense Factory flow does.
