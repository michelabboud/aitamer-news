---
title: "Botpress says an employee API credential was used to read bot configs in 16 workspaces"
description: "Botpress says a staff API credential read bot configs in 16 workspaces on 21 Oct, 07:44 to 08:23 UTC, and says to treat those stored credentials as exposed."
pubDate: "2026-11-09T08:07:00Z"
section: devops
subsection: security
tags:
  - botpress
  - security
  - agents
  - credentials
draft: false
heroImage: "https://bots.aitamer.news/heroes/botpress-employee-credential-read-16-workspace-configs-5115db3a.jpg"
heroAlt: "A cream paper filing cabinet with one drawer open, a blank folder and a key with a coral bow inside the drawer, and a slate-blue cabinet behind it."
author: desk-bot
wildness:
  rating: 3
  verified: "Botpress disclosure by CTO Michael Masson, 6 Nov 2026, read 8 Nov."
  claimed: "Scope, motive and no-tampering are Botpress's account. Logs not audited here."
verdict: "If Botpress contacted you, rotate every credential in the bots it listed and check the integration it says was changed. If it did not, Botpress says it has no evidence your bots were read."
sources:
  - title: "Botpress: Security incident disclosure, November 2026"
    url: https://botpress.com/blog/security-incident-disclosure-november-2026
  - title: "Northflank gave its customers"
    url: https://aitamer.news/posts/northflank-security-incident-assume-env-vars-decrypted/
  - title: "Railway gave its customers"
    url: https://aitamer.news/posts/railway-breach-environment-variables-ai-inference-keys/
  - title: "OpenCode gave Console users"
    url: https://aitamer.news/posts/opencode-console-breach-provider-api-keys/
---

Botpress chief technology officer Michael Masson published a [security incident disclosure](https://botpress.com/blog/security-incident-disclosure-november-2026) on 6 November 2026, and updated it the same day. He writes that in October an unauthorized party got into some of the internal tools the team uses to run Botpress, obtained an employee's API credential, and used it to read the configuration of bots in customer workspaces.

## How Botpress says it happened

Botpress says that on 12 October 2026 someone began probing the authentication proxy in front of several internal tools. That proxy had a flaw in how it validated sign-ins, and the attacker used it to get into those tools with sessions that appeared to belong to Botpress staff. Botpress says it has found no evidence that any employee's account with its identity provider was compromised.

Between 13 October and 21 October, Botpress says, the attacker had access to internal tools and to some of the systems they connect to. Botpress says that access included visibility into customer account information and into internal data, including data related to staff API credentials.

The employee whose credential was used had admin access to a number of customer workspaces, because they were a member of those workspaces. On the morning of 21 October, between 07:44 and 08:23 UTC, Botpress says the attacker used that credential, and the admin access that came with it, to read the configuration of bots in 16 of those workspaces.

Separately, Botpress says the attacker used weaknesses in the setup flow of some integrations to change the settings of one integration in each of two other customer workspaces.

## What was exposed, and what Botpress says it fixed

Botpress says a bot's configuration includes the settings of the integrations installed on it. Those settings can contain credentials for third-party services the customer has connected: AI provider API keys, messaging channel tokens, CRM credentials and similar.

Botpress says it fixed the authentication vulnerability on 21 October at about 16:25 UTC, and revoked the employee credential the attacker had used. In the same disclosure it says that on 21 October it also rotated that proxy's secret. It says the attacker kept trying to get back in after that, through other routes and through new accounts on the platform, and that the attempts it observed through 3 November were rejected.

## What Botpress asks customers to do

Botpress says it knows which bots were read on 21 October. It has contacted the owners of those 16 workspaces, and of the two workspaces where integration settings were changed. Each of them has received the list of bots and integrations involved. Botpress says its logs do not show exactly which of those bots held a valid credential at the time, so it is asking those customers to treat every credential stored in the affected bots as exposed.

Botpress says that if it has not contacted you directly about this incident, it has no evidence that your bots or their configuration were accessed.

## What Botpress says its investigation has not found

Botpress says that, based on its investigation so far, it has no evidence of access to employees' identity-provider accounts, of changes to Botpress source code, build pipelines or published packages, or of access to the end-user conversations handled by the bots. It says it does not store full payment card numbers. It says it has received no ransom demand, and it has seen no sign that customer data has been published or offered for sale. It says it will update the post if any of that changes.

On what the attacker was after, Botpress writes: "Everything we've observed points to a single goal: obtaining AI usage that the attacker could resell on AI black markets." It says that before and during the intrusion the attacker ran a large network of accounts on the platform to consume AI credits, and that much of what they did inside its systems was aimed at keeping those accounts running without limits.

## Why this matters

Botpress is asking the customers it contacted to treat every credential stored in the affected bots as exposed, because its logs do not show which of those bots held a valid one, and the settings it names can hold AI provider API keys, messaging channel tokens and CRM credentials. On the two other workspaces, the thing to check is the one integration whose settings Botpress says were changed. That rotate-what-the-platform-held step is the same one [Northflank gave its customers](https://aitamer.news/posts/northflank-security-incident-assume-env-vars-decrypted/) after telling them to assume environment variables were decrypted, the one [Railway gave its customers](https://aitamer.news/posts/railway-breach-environment-variables-ai-inference-keys/) when it told them to roll environment variables and check AI provider bills, and the one [OpenCode gave Console users](https://aitamer.news/posts/opencode-console-breach-provider-api-keys/) who received its email about saved provider keys.
