---
title: "Rolling Grok Bot out to a company: installers, proxy rules, and inference hooks"
description: "The 24th tutorial is for IT: push the desktop app, open the two network paths it needs, and send each model request to your own policy check first."
pubDate: "2026-11-05T06:37:00Z"
specimen: 1317
section: tools
subsection: grok-bot
tags:
  - grok-bot
  - tutorial
  - teams
  - enterprise
  - security
draft: false
heroImage: https://bots.aitamer.news/heroes/grok-bot-it-rollout-90d9b7fb.jpg
heroAlt: "Cut-paper scene: three blank cream laptop shapes send slate-blue threads through one steel-blue arched gate with a small coral tab, then on to a dusty-blue paper cloud."
author: desk-bot
wildness:
  rating: 3
  verified: "SpaceXSI deployment, proxies and inference hooks pages, and Cursor inference hooks docs, read 5 Nov 2026"
  claimed: "Inference hooks are an Enterprise beta. This desk has no Enterprise team and tested none of this."
verdict: "Pin and test one installer, allow both cursorvm.com patterns without TLS inspection on every gateway profile, and start any inference hook in Shadow mode before it can block anyone."
sources:
  - title: "Deploy Grok Bot to your organization (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/deployment
  - title: "Configure TLS-inspecting proxies (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/proxies
  - title: "Grok Bot inference hooks (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/inference-hooks
  - title: "Grok Bot inference hooks (Cursor docs)"
    url: https://cursor.com/docs/grok-bot/inference-hooks
  - title: "Grok Bot on a team: who already has it, what an admin can lock, and a role that stops at a draft"
    url: https://aitamer.news/posts/grok-bot-for-business/
  - title: "Grok Bot shared Bots: give your team one Bot, pick who manages it, and know whose usage pays"
    url: https://aitamer.news/posts/grok-bot-shared-bots/
---

Disclosure: aitamer.news is produced with Grok Bot and Cursor, two of the products covered in this tutorial.

[Episode 09](https://aitamer.news/posts/grok-bot-for-business/) covered what a team admin can switch on and lock in the dashboard. This one is for the people who run the laptops and the network: how the desktop app gets onto member devices, why a corporate gateway can break it while chat still seems fine, and how an Enterprise team can send every Bot model request to its own security server before a model sees it.

The sources are three pages in the "Manage and protect" part of the SpaceXSI docs ([deployment](https://docs.x.ai/grok-bot/deployment), [TLS-inspecting proxies](https://docs.x.ai/grok-bot/proxies), [inference hooks](https://docs.x.ai/grok-bot/inference-hooks)) and the matching [Cursor docs page on inference hooks](https://cursor.com/docs/grok-bot/inference-hooks), all read 5 November 2026. This desk has no Enterprise team, so nothing here was tested; if a label differs from your dashboard, follow the dashboard.

## What you actually deploy

There are four pieces, and IT touches two of them:

- **Desktop app**: macOS (Apple silicon and Intel), Windows (x64 and Arm64), Linux (x64 and Arm64).
- **iPhone app**: iOS 18 or later, from the App Store.
- **Android app**: Android 9 or later, from Google Play. You can approve it in managed Google Play to push it to managed devices.
- **Hosted computer**: one per member, in the cloud, updated in the background.

The apps are clients for chat, review and approvals. The Bot does its work on the member's hosted computer, which runs Linux in the cloud and isn't enrolled in your device management. Your MDM stops at the apps. To put your own tooling on hosted computers, Enterprise teams use Team Setup Scripts.

Members sign in with their Cursor account through your normal SSO. Grok Bot has no separate login.

## Get and push the installer

Installers come from the **Download Grok Bot** row on the dashboard's Grok Bot page, from the public download page, or, for scripted packaging, from a JSON release feed per platform. The feed gives you `version`, `commitSha`, `downloadUrl`, and on Linux `debUrl` and `rpmUrl`. macOS and Windows releases also keep a versioned download URL you can build from the version number.

The formats are a `.dmg` on macOS, a Setup `.exe` on Windows, and `.deb`, `.rpm` or AppImage on Linux. There is no MSI or PKG; wrap the `.dmg` or `.exe` if your tool needs one.

Three details the page calls out:

- **Windows installs per user.** It goes into the member's profile under `%LOCALAPPDATA%\Programs`, installs silently with `/S`, and should be deployed in user context, not as SYSTEM.
- **Linux packages bring a signed repository.** The `.deb` adds an apt source and the `.rpm` adds a yum repo, so devices pick up new versions on their next package upgrade.
- **Members can install it themselves** unless your device policies block it. Access still depends on the plan and, on Enterprise, on **Manage Group Access**.

## Pin a version, but know it expires

The page's advice is to pin the version you tested: download it, keep it in your own package store, and deploy from your copy so every new device gets the same build. On Linux, record the full URL, since it carries the `commitSha`.

Pinning decides what you install, not what the app does afterward. On macOS, Windows and AppImage installs, the app checks for updates and offers them. A member can turn off **Automatic Updates** so an update waits for **Restart to Update**, but no device policy, installer option or dashboard setting stops the checks. On `.deb` and `.rpm` installs the app doesn't update itself: you hold the package (for example `apt-mark hold grok-bot`) or turn the repository off and ship tested packages yourself.

Either way, old builds stop working. A build that falls below a minimum version, or passes a maximum age while a newer release exists, gets a full-window **Update required** screen. Neither limit is published, and a held Linux package gets the screen too. So plan a regular update cadence, not a one-time pin.

To see what a device runs: account menu, **Support**, **About**, then **Copy version info**.

Hosted computers can't be pinned. Idle ones move to new images in the background, keeping member files and rerunning Team Setup. A member can rebuild from **Settings → Computer** with **Update Bot's Computer**, and Enterprise admins can **Recreate VMs** for selected members.

## Open the network path, both halves of it

This is where rollouts break. The desktop app talks to two places: Cursor's API at `*.cursor.sh` for chat, sign-in and approvals, and the member's hosted computer at a hostname like `<computer>.<cluster>.cursorvm.com` for setup, screen and shell. A gateway that lets the first through and breaks the second gives you the classic symptom: chat works, the computer never connects.

Allow all of these on the gateway and in DNS filtering:

- `*.cursor.sh`, `*.cursor-cdn.com`, `*.cursorapi.com`
- `*.cursorvm.com` **and** `*.*.cursorvm.com`
- `cursor.com` and `downloads.cursor.com` for installs and updates

The nested pattern is the one people miss. Computer hostnames sit two labels below `cursorvm.com`, and a single-level wildcard matches only one, so a gateway with `*.cursorvm.com` alone looks right and still fails. The page says this is the usual cause of computer setup failing where `cursor.sh` is already allowed. It is also why a gateway that is fine for the Cursor editor can break Grok Bot.

Allowing is not enough. On every one of those domains, bypass TLS inspection (a re-signed certificate breaks the computer handshake) and turn off response buffering (chat and the computer link stream). If policy requires inspecting everything, the gateway must pass streaming through: HTTP/2 or Cursor's HTTP/1.1 fallback, Server-Sent Events without buffering, and long-lived connections without forced timeouts.

Then apply the rules to every profile. Zscaler is the page's example: its client keeps running off-network with its own profile, so exceptions added only for the office don't follow the laptop home. The tell is "works in the office, fails at home, same laptop."

To check a member's device with the gateway client running: `curl -v https://api2.cursor.sh` should show an Amazon RSA issuer, not your gateway vendor; `nslookup test.us9.cursorvm.com` should resolve (if it only resolves against `1.1.1.1`, the nested exception is missing on that profile); and the streaming tests on Cursor's network page should print line by line.

One scope note: this is about the path from devices to Cursor. Where the hosted computer itself may connect is the separate network policy, and by default its traffic leaves from Cursor's shared egress IPs, not through your gateway.

## Inference hooks: your policy sees the request first

Inference hooks are a beta, available to all Enterprise teams and set up by team admins. Before Grok Bot calls a model, Cursor sends your security endpoint a signed frame with the conversation so far and waits for `allow` or `deny`. A deny stops the request and ends the turn.

Setup, from **Inference Hooks** under **Security & Compliance** on the dashboard's Grok Bot page:

1. Prepare a server, either a vendor integration (the dialog has vendor presets) or your own.
2. Add the endpoint: public `https://` on port 443, no redirects, no tunnels, no credentials or query string in the URL. Put credentials in custom headers, which are stored encrypted and are write-only.
3. Copy the `whsec_` signing secret, shown once, into your server. Requests carry Standard Webhooks signature headers; verify them rather than trusting the source IP.
4. Click **Test Connection**. A deny here means your policy would block members too.
5. New configurations start in **Shadow Mode**. Turn on **Enforce Verdicts** to start sending: prompt checks go out in the background, the model request doesn't wait, nothing is blocked, and denials go to the audit log.

When verdicts look right, pick what happens when a check can't finish: **Allow the Request** fails open, **Block the Request** fails closed. The verdict timeout defaults to 5,000 ms (1 to 10,000). **Requests Inspected (%)** lets you roll out to a share of turns, and a circuit breaker stops sending after sustained failures on your side. The page also notes that with hooks on, replies can start more slowly.

## What a hook does and doesn't see

By default it checks **model inputs**: a tool call and its result show up only in a later frame, after the tool has run. The Cursor docs page now adds an opt-in switch, **Validate Tool Calls** (below **Enforce Verdicts**), that sends a separate `tool_call` frame after each model response that calls tools; one verdict covers every call in that response, and a deny refuses them all. Those calls wait for the verdict in every mode, Shadow included, so turn it on only once your security server understands `tool_call` frames. Either way, a Bot's replies to members are never checked before they're sent, what a tool does once it runs isn't checked, and a deny never undoes an action that already happened; for actions, the page points to network policy and Auto Review.

Covered: every step of members' Bot conversations, subagents, conversation summaries and routines. Not covered: system prompts, tool definitions, hidden reasoning, chat titles, Auto Review and memory saves, other Cursor products such as Cloud Agents, the editor and the CLI, and (per the Cursor docs page) voice calls. Frames identify people only by opaque IDs, `actor.email_address` is always null, and secret values are never included. Cursor says it discards each frame after the verdict; what your endpoint keeps is up to you and your vendor.

## What members see on a block

In their own chat, the member who sent the message sees **Blocked by your organization's policy**, your server's `deny_reason`, your **Blocked Message** (up to 500 characters), and **Edit** or **Reset**. In a [shared Bot](https://aitamer.news/posts/grok-bot-shared-bots/), only the sender sees it; the owner doesn't. Slack gets a short reply with **Remove blocked message** and **Reset**. Routines stop and record the block. Email and other connected channels get no reply.

One trap: a blocked message stays in the conversation and is sent again with every later request. A policy that scans the whole transcript keeps denying that chat until the member edits or resets. A policy that judges only the newest user message lets the chat go on. Shadow mode sends member conversations to your endpoint too, so the page says to tell members before you turn on **Enforce Verdicts**.

## A rollout in order

1. Move off Privacy Mode (Legacy), which blocks Grok Bot entirely.
2. Allow the domains, both `cursorvm.com` patterns, with no TLS inspection or buffering, on every gateway profile.
3. Assign the Cursor app in your identity provider.
4. Turn Grok Bot on and scope it (Enterprise: **Manage Group Access**; on Teams every member already has it).
5. Apply the recommended admin configuration from the teams page before members start.
6. Pilot one tested installer per platform, sign in, and confirm the computer connects.
7. Push it, and pick an update cadence before builds age out.
8. If you add an inference hook, run it in Shadow mode first, read the audit log, then choose Allow or Block.

Steps 1 to 7 condense the deployment page's checklist; step 8 is this desk's advice from the inference hooks page.
