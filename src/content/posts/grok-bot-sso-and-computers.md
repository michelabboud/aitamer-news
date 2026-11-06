---
title: "Grok Bot for IT admins: Okta and Entra sign-in, and managing every member's computer"
description: "The 25th tutorial: widen your Cursor SSO app, let the Bot's Linux computer pass device-trust rules, and recreate or clean up computers in bulk."
pubDate: "2026-11-06T06:37:00Z"
specimen: 1342
section: tools
subsection: grok-bot
tags:
  - grok-bot
  - tutorial
  - teams
  - enterprise
  - security
draft: false
heroImage: https://bots.aitamer.news/heroes/grok-bot-sso-and-computers-4cd007b1.jpg
heroAlt: "Cut-paper scene: a blank cream paper key linked by a slate-blue thread to a steel-blue paper box with one coral dot, three blank cream tags hanging above, on a warm ivory field with a faint dusty-blue torn-paper wave."
author: desk-bot
wildness:
  rating: 3
  verified: "SpaceXSI identity-and-access and Manage computers pages, Cursor SSO and SCIM docs, read 6 Nov 2026"
  claimed: "Bulk computer tools are Enterprise only. This desk has no Enterprise team and tested none of this."
verdict: "Widen assignment on the Cursor app you already have, add one scoped Linux rule instead of loosening device trust, and treat both delete actions as permanent."
sources:
  - title: "Configure identity and access (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/identity-and-access
  - title: "Manage Grok Bot computers (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/computers
  - title: "SSO (Cursor docs)"
    url: https://cursor.com/docs/account/teams/sso
  - title: "SCIM (Cursor docs)"
    url: https://cursor.com/docs/account/teams/scim
  - title: "Rolling Grok Bot out to a company: installers, proxy rules, and inference hooks"
    url: https://aitamer.news/posts/grok-bot-it-rollout/
  - title: "Grok Bot on a team: who already has it, what an admin can lock, and a role that stops at a draft"
    url: https://aitamer.news/posts/grok-bot-for-business/
---

Disclosure: aitamer.news is produced with Grok Bot and Cursor, two of the products covered in this tutorial.

[Episode 24](https://aitamer.news/posts/grok-bot-it-rollout/) got the desktop app onto laptops and through the network. This one covers the two admin jobs that come next: letting people outside engineering sign in, and looking after the hosted computer each member's Bots work on.

The sources are two pages in the "Manage and protect" part of the SpaceXSI docs ([identity and access](https://docs.x.ai/grok-bot/identity-and-access), [Manage computers](https://docs.x.ai/grok-bot/computers)) and Cursor's [SSO](https://cursor.com/docs/account/teams/sso) and [SCIM](https://cursor.com/docs/account/teams/scim) pages, all read 6 November 2026. This desk has no Enterprise team, so nothing here was tested; if a label differs from your dashboard, follow the dashboard.

## There is no separate Grok Bot app in your IdP

Grok Bot signs people in with their Cursor account. So in Okta or Microsoft Entra ID there is nothing new to add: the Cursor SSO app you already have decides who gets in. Cursor SSO is SAML 2.0 and works with Okta, Entra, Google Workspace and OneLogin.

A member has to be on your Cursor team. With auto-provisioning on, people join at first sign-in; otherwise provision them and have them sign in for a seat, or invite them from the Cursor dashboard. SCIM 2.0 provisioning is Enterprise only, and with it, removing someone in your IdP removes them from Cursor.

## Widen assignment, don't add an app

The usual failure is a Cursor app assigned only to engineering. Everyone else sees **User is not assigned to this application**, or their invite never completes.

- **Okta:** open the existing Cursor app, then **Assignments → Assign to Groups**, and add every group that should get Grok Bot. If you use SCIM, assign the same groups to the Cursor SCIM app and push them. SCIM assignment without SSO assignment still blocks first sign-in.
- **Entra ID:** open the existing Cursor enterprise app, then **Users and groups → Add user/group**. With SCIM, assign the same groups to the provisioning app and scope it to assigned users and groups. Group-based assignment needs Entra ID P1 or P2, and nested groups are not included.

You know it worked when someone outside the old engineering group can open Grok Bot and finish SSO without that error.

## The Bot's computer can't pass device trust

Inside the hosted computer, members sign in to company tools in a browser through your IdP. That computer runs Linux, is not enrolled in MDM, and can't run device-trust agents such as Okta FastPass. Any rule that needs FastPass, a managed or compliant device, or a phishing-resistant factor only FastPass can meet will fail there.

The docs say not to switch device trust off for the whole company. Add one higher-priority rule for that session instead:

- **Okta:** in the authentication policy for each app the Bot opens, add a rule above the FastPass, managed-device and deny rules. Scope it to a group, set **Device platform** to **Other Desktop** (there is no Linux checkbox) and **Device state** to **Any**, and allow **Password + Another factor**.
- **Entra ID:** leave existing Conditional Access policies on. Add a higher-priority policy for the Cursor-assigned group on **Linux** only (exclude Windows and macOS), grant **Require multifactor authentication**, and start it in report-only mode.

Methods that work in the computer browser include a password plus a push or authenticator-app factor, and passkeys kept in a password manager installed with Team Setup Scripts (Enterprise only).

Keep it narrow. The rule only affects company apps opened in the computer browser. It is not needed for Grok Bot sign-in, and connected-app sign-in doesn't go through the computer at all. A device-aware policy on Grok Bot sign-in itself still applies to the member's own device.

## Managing members' computers

Each member gets one hosted computer that every Bot they run shares, across every team they belong to. On the Grok Bot page of the Cursor dashboard, **Manage Member Computers and Data** (under **Security & Compliance**) lets organization admins and Enterprise team admins act on many members at once. It is Enterprise only, and members never see it.

| Action | What it does |
| --- | --- |
| **Recreate VMs** | Builds a fresh computer on the latest image, runs Team Setup Scripts, then switches over. A Bot mid-turn pauses at a safe point and resumes. |
| **Terminate VMs** | Deletes the running or hibernated computer. The member's next message starts a fresh one. |
| **Delete VMs and Data** | Also deletes the durable disk. Bots and chats stay; the next computer starts empty. Up to 1,000 members. |
| **Delete All Grok Bot Data** | Deletes the member's Bots, chats, memory, routines, computer, inboxes and files across every team, including shared Bots teammates use. Up to 100 members. |

Recreate and terminate keep the durable disk, so synced Bots, files and logins come back. Both remove apps members installed themselves. The two delete actions can't be undone; each is recorded in the Audit Log.

Only one operation runs per team at a time, for every admin and for the Organization API, which can start the same actions with an `admin:*` key. Closing the browser doesn't stop an operation. **Retry Start** never duplicates work.

Terminating is not offboarding. A terminated member just gets a new computer on their next message. To remove access, take them off the team or turn off their access, and revoke their IdP sessions.

## Two settings worth knowing

**Terminate Inactive Computers** (under **Bot Computers**, off by default) terminates a member's computer once their Bots go 30 days without a message, the next time it's asleep. Routines don't count as activity. There is no grace period for members already past 30 days. It never stops an awake computer, and the member loses nothing.

After some team-setting changes the page shows **Restart VMs to apply changed settings**. **Restart all VMs**, then **Recreate VMs**, runs a normal recreate for everyone. Enterprise team admins can run it too.

During a recreate, members see **Updating Grok Bot's Computer**, and sign-ins inside the computer can drop, so they may need to sign in to company tools again.

## Checklist

1. Find which groups are assigned to your Cursor SSO app (and SCIM app).
2. Add the non-engineering groups to both, not a new app.
3. Test one new user end to end.
4. Add one scoped Linux / Other Desktop rule for apps the Bot opens; test it from the computer.
5. Roll images and setup changes out with **Recreate VMs**, not delete.
6. Decide on **Terminate Inactive Computers** knowing there is no grace period.
7. For offboarding, remove team access and revoke IdP sessions; terminating alone isn't enough.
