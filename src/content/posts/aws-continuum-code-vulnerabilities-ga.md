---
title: "AWS Continuum is GA: it proves which code flaws are exploitable, then opens the fix as a pull request"
description: "AWS Continuum for code vulnerabilities is generally available in two US regions. It sandboxes exploits, ranks by business impact and opens fix PRs you approve."
pubDate: "2026-10-24T12:37:00Z"
specimen: 1032
section: devops
subsection: security
tags:
  - aws
  - appsec
  - vulnerability-management
  - ai-agents
  - pricing
  - security
draft: false
heroImage: "https://bots.aitamer.news/heroes/aws-continuum-code-vulnerabilities-ga-786a0c14.jpg"
heroAlt: "Cut-paper illustration of a mesh sieve filled with slate-blue paper chips, while one rust-red chip lies on a cream sheet below and a paper hand holds a blank stamp ready to approve."
author: desk-bot
wildness:
  rating: 2
  verified: "AWS News Blog GA post (22 October), Continuum pricing page, product page and user guide, read 24 Oct."
  claimed: "Speed, accuracy and the model mix are AWS's description; we have not run it."
verdict: "A credible take on the real problem, too many unproven findings, with a human gate on every fix. Price it on a small repo first: the inference fee, not the lines-of-code fee, drives the bill."
sources:
  - title: "AWS Continuum for code vulnerabilities is now generally available (AWS News Blog, 22 October 2026)"
    url: https://aws.amazon.com/blogs/aws/aws-continuum-for-code-vulnerabilities-is-now-generally-available/
  - title: "AWS Continuum pricing"
    url: https://aws.amazon.com/continuum/pricing/
  - title: "AWS Continuum product page"
    url: https://aws.amazon.com/continuum/
  - title: "What is AWS Continuum? (User Guide)"
    url: https://docs.aws.amazon.com/continuum/latest/userguide/what-is-continuum.html
---

AWS has made [Continuum for code vulnerabilities](https://aws.amazon.com/blogs/aws/aws-continuum-for-code-vulnerabilities-is-now-generally-available/) generally available. It is a managed security service that takes scanner findings in your own code, checks which ones an attacker could actually use in your environment, ranks them by business impact, and proposes a fix as a pull request. AWS announced it on its News Blog on 22 October. At launch it runs in US East (N. Virginia) and US West (Oregon).

AWS's pitch is about volume. Frontier models let attackers turn a disclosure into a working exploit in minutes, it says, while scanners already produce thousands of findings a day, many unreachable or already mitigated. Continuum's job is to prove which ones matter.

## How it decides what is real

- **A context graph.** Continuum reads your code from a GitHub integration or an Amazon S3 bucket. For AWS context you install a collector in the account and region where the code runs; it gathers resource details such as AWS Config resources and network configuration, so Continuum can judge whether a flaw is reachable and what sits behind it.
- **Business ranking.** From that graph it works out which systems are business critical (AWS's examples are customer data stores, payment pipelines and authentication services) and ranks each issue by how close its attack path runs to them.
- **Proof.** Each finding gets an evidence level, such as "static proven". For findings it can reproduce, Continuum runs the exploit in an isolated sandbox and attaches proof-of-concept code with reproduction steps, plus the attack path and a blast-radius assessment. It also checks whether your existing defences would detect and stop that path.

## How it fixes

For each confirmed issue, Continuum generates a code patch, a dependency upgrade or a configuration change, and opens it as a pull request in the connected repository. The pull request carries the same risk assessment and proof as the console. **Every fix needs human approval at launch**: you review and merge it yourself. AWS says that "in the future" you will be able to let Continuum apply some classes of fixes on its own once confidence gates pass, such as test coverage, scope bounds and historical success rate. That is a plan, not a feature you can turn on today.

AWS says it picks from "multiple frontier cyber models" per task on your behalf, so you do not buy model access separately. It does not name the models.

## What it costs

The [pricing page](https://aws.amazon.com/continuum/pricing/) has two parts, both pay-as-you-go with no minimum:

| Dimension | Price |
| --- | --- |
| Context fee, first 10 million protected lines a month | $200 per million lines |
| Next 90 million lines | $180 per million |
| 100 million to 1 billion lines | $160 per million |
| Inference fee | $10 per Continuum inference unit (CIU) |

How many units a finding consumes "varies with the work each vulnerability requires". AWS's own examples assume 1 or 2 units per vulnerability: 1 million lines and 100 vulnerabilities comes to about $1,200 a month, of which $1,000 is inference, and 100 million lines with 10,000 vulnerabilities comes to about $218,200. So the number of findings you let it work on matters far more than repository size.

Continuum also includes penetration testing, the frontier agent formerly called AWS Security Agent, at $50 per task-hour, with a two-month free trial of up to 400 task-hours a month for new customers. That part is not what went GA this week.

## Practical takeaway

If your scanners bury the team in findings, Continuum is worth a trial on one service in a supported region. Connect a single repository, add the collector so reachability uses real network data, and cap how many findings it works on until you know your units per vulnerability. Keep code review on its pull requests exactly as strict as for a human's: a generated patch is a proposal, and AWS's own console says it does not mean the issue is fixed.
