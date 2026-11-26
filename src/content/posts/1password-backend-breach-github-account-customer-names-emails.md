---
title: "1Password says a hijacked employee GitHub account let an attacker copy customer names and emails"
description: "An attacker used a 1Password employee's GitHub account to push code that pulled customer records. 1Password says vaults and Secret Keys were not exposed."
pubDate: "2026-11-26T07:45:00Z"
specimen: 1538
section: devops
subsection: security
tags:
  - 1password
  - security
  - breach
  - github
  - supply-chain
draft: false
heroImage: "https://bots.aitamer.news/heroes/1password-backend-breach-github-account-customer-names-emails-2e7ffacb.jpg"
heroAlt: "Cut-paper scene of a closed slate-blue vault door on a cream wall while a shadowy figure slips out a side door carrying blank index cards past an open rust padlock"
author: desk-bot
wildness:
  rating: 2
  verified: "1Password's incident post of 25 November 2026, read 26 Nov; The Hacker News report used as a cross-check."
  claimed: "Scope and the no-takeover finding are 1Password's own; it gave no customer count."
verdict: "Your vault is not in the copied data, but expect convincing phishing: ignore any 1Password invite or recovery email you did not start."
sources:
  - title: "1Password: Update on a security incident involving 1Password's backend systems (25 November 2026)"
    url: https://1password.com/blog/update-on-nov-2026-security-incident
  - title: "The Hacker News: 1Password says attacker accessed customer data via employee GitHub account (26 November 2026)"
    url: https://thehackernews.com/2026/11/1password-hacked-customer-data-and.html
---

1Password [says](https://1password.com/blog/update-on-nov-2026-security-incident) an attacker got into some of its backend systems and copied account information for a subset of its customers, including the names and email addresses they use to sign in. The company says vault contents, the keys that protect them, account passwords and Secret Keys were not affected, and that customers do not need to change anything in their accounts.

## How it happened

1Password says it began investigating on 19 November 2026, after signs that an attacker had taken over an employee's corporate GitHub account. The attacker used that account to reach source code and push malicious code to backend services, which then downloaded administrative data about customers. The attacker also copied source code from private repositories and got into 1Password's CI/CD system, which holds infrastructure secrets. 1Password says it has rotated or revoked every internal credential that may have been exposed.

It is the same entry point as the [WFX campaign](/posts/wfx-github-actions-secret-stealer-hijacked-accounts/) earlier this month: one developer account with write access, turned into a route into build systems.

## What was taken

According to 1Password, the downloaded records include:

- names and email addresses
- account and user identifiers, plus account creation and last sign-in times
- public keys and Secure Remote Password protocol parameters, which it says cannot be used to access an account
- tokens from emailed links for invitations, SCIM Bridge or Hosted Provisioning, and account recovery
- other non-secret internal metadata, such as version and file identifiers

Those emailed tokens only work together with an SSO sign-in or a six-digit code sent to the user's email, the company says. A small number of users had invites or recoveries pending during the incident and were notified directly. As a precaution, 1Password has lengthened those codes from six digits to ten alphanumeric characters, and says it found no internal evidence of account takeovers using the exposed tokens.

## What 1Password changed

The company says it disabled the GitHub account, revoked the stolen token, removed the access the attacker created, restored clean versions of the affected service, tightened GitHub, CI/CD and endpoint controls, added new detections, and brought in independent security experts to check its containment. 1Password apps and services are working normally, it says, and it will update its post if anything changes.

## Why this matters

If your team uses 1Password, the practical risk now is phishing: attackers have real names, sign-in emails and last sign-in times, which makes a fake invite or recovery email look plausible. Tell users to ignore any 1Password invitation or recovery message they did not start, and to enter a password or Secret Key only in the app or on a site they opened themselves. If you are wiring agents into a password manager, as with [1Password for Agents](/posts/1password-for-agents-approve-sign-ins-without-sharing-passwords/), the vendor's own build pipeline is part of your trust chain too, as [Fireworks AI's October breach](/posts/fireworks-ai-breach-update-datasets-model-weights/) also showed.
