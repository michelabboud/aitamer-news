---
title: "Grok Bot for IT admins: private networks with Team Setup, Tailscale, and Cloudflare Tunnel"
description: "The 26th tutorial: route one desktop, or install your networking client on every hosted computer so Bots reach private services."
pubDate: "2026-11-07T06:37:00Z"
specimen: 1360
section: tools
subsection: grok-bot
tags:
  - grok-bot
  - tutorial
  - teams
  - enterprise
  - security
draft: false
heroImage: https://bots.aitamer.news/heroes/grok-bot-private-networks-32194a3e.jpg
heroAlt: "Cut-paper scene of a steel-blue box linked by a thread through a dusty-blue arch into cream shelves, with one coral accent on the arch"
author: desk-bot
wildness:
  rating: 3
  verified: "SpaceXSI private-networks page, read 7 Nov 2026"
  claimed: "Team Setup Scripts are Enterprise only. This desk has no Enterprise team and tested none of this."
verdict: "Pick desktop routing for one person's public allowlist, or a Team Setup manifest for private reach; keep credentials in Team Secrets, pilot one computer, and allowlist your client's endpoints."
sources:
  - title: "Connect to private networks (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/private-networks
  - title: "Grok Bot security (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/security
  - title: "Grok Bot for teams and enterprises (SpaceXSI docs)"
    url: https://docs.x.ai/grok-bot/teams-and-enterprises
  - title: "Grok Bot for IT admins: Okta and Entra sign-in, and managing every member's computer"
    url: https://aitamer.news/posts/grok-bot-sso-and-computers/
  - title: "Rolling Grok Bot out to a company: installers, proxy rules, and inference hooks"
    url: https://aitamer.news/posts/grok-bot-it-rollout/
---

Disclosure: aitamer.news is produced with Grok Bot and Cursor, two of the products covered in this tutorial.

[Episode 24](https://aitamer.news/posts/grok-bot-it-rollout/) got the desktop app onto laptops. [Episode 25](https://aitamer.news/posts/grok-bot-sso-and-computers/) covered sign-in and bulk computer management. This one is the private-network step: how a Bot on a hosted Linux computer reaches services that never sit on the public internet.

The source is the SpaceXSI [Connect to private networks](https://docs.x.ai/grok-bot/private-networks) page, with the related [security](https://docs.x.ai/grok-bot/security) and [teams and enterprises](https://docs.x.ai/grok-bot/teams-and-enterprises) pages, all read 7 November 2026. Team Setup Scripts and Network Controls are Enterprise only. This desk has no Enterprise team, so nothing here was tested; if a label differs from your dashboard, follow the dashboard.

## Two different jobs

Hosted computers reach the internet through Cursor's [shared static egress IPs](https://docs.x.ai/grok-bot/security#static-egress-ips). That is fine for public sites. It is not enough when the systems your Bots need live on a private network.

The docs give two methods:

| Method | Use it when |
| --- | --- |
| **Route traffic through a desktop** | One member needs public sites to see their device's IP, such as a site that allowlists office IPs |
| **Install a networking client with Team Setup** | Your Enterprise team needs a consistent private connection on every hosted computer |

Desktop routing does not open your private network to the Bot. Sites that resolve to a private or VPN address stay blocked unless they have been allowed for your organization. To reach private services, install a networking client.

## Route through one desktop

In the Grok Bot desktop app, open **Settings → Computer** and, under **Your computer**, turn on **Route traffic through this computer**. Traffic then uses that device's network and IP. It stops when the member turns the setting off, or when an Enterprise admin disables **Allow Local Egress Routing** for the team from the Grok Bot page of the Cursor dashboard.

Each member controls their own desktop route. The setting also shows how many sites were blocked this session. Use this for the public-allowlist case, not for private reach.

## Install a client with Team Setup

Team Setup Scripts is the Cursor hook: manifests of install scripts that run on every team computer. You own everything else: installing the client, configuring it, authenticating computers, and keeping up with your vendor. Cursor installs nothing by default, does not operate or monitor your client, and the dashboard shows no client status.

Before you start you need: an Enterprise team admin seat; a networking client that installs and runs on Debian-based Linux from a shell script (`sudo` is available); a gateway, exit node, or tunnel connector inside the network you want to reach; and a plan for how computers authenticate. Keep credentials out of scripts; if a script needs one, store it as a [Team Secret](https://docs.x.ai/grok-bot/teams-and-enterprises#team-secrets).

**Team Setup Scripts** lives under **Bot Computers** on the Grok Bot page of the Cursor dashboard. Each manifest holds one or more entries with an **ID**, a **Setup Script**, and an optional **Check Script**. To limit a manifest to one cohort, add it under that group's Grok Bot tab instead.

Scripts run as the computer user when a computer starts, and on a periodic refresh (roughly daily) while it runs. If a Check Script exits 0, Setup is skipped. Entries run one at a time, each with a 30-minute timeout. A failed script does not block the computer; it is retried later. Team Secrets appear as environment variables only while the script runs, and script output is redacted before it is logged. A computer whose setup comes from more than one team receives no secrets.

## Create the manifest

1. Open **Team Setup Scripts** under **Bot Computers**.
2. Next to **Manifests**, select **+**, enter a **Manifest ID** (for example `private-network`).
3. Set the entry **ID** (for example `install-network-client`) and write the **Setup Script**: install your client per the vendor's Linux docs, then start it and connect it.
4. Optionally add a **Check Script** (for example `command -v <your-client>`).
5. **Save**. You can also edit the same structure as JSON.

Do not paste secret values into scripts. Manifests are plain text applied to your whole fleet. Prefer interactive browser login where the vendor supports it, so your identity provider's policies apply inside the computer browser (the same path [episode 25](https://aitamer.news/posts/grok-bot-sso-and-computers/) covered for company tools).

## Tailscale and Cloudflare Tunnel

Both use the same Team Setup mechanics. Tailscale is the configuration the docs say has been exercised on team computers; Cloudflare Tunnel has not been exercised the same way, so validate it on a pilot first.

**Tailscale.** Run it on each computer and route through an [exit node](https://tailscale.com/docs/features/exit-nodes) inside your network. Subnet routers can expose specific private ranges; pilot that too. Setup installs Tailscale for Linux; Check is `command -v tailscale`. Authenticate each computer (browser login URL, or a reusable tagged [auth key](https://tailscale.com/docs/concepts/auth-keys) stored as a Team Secret and passed as `"$TS_AUTHKEY"`, never pasted into the script). Confirm the machine in your Tailscale admin console, then ask a Bot to reach an internal hostname.

**Cloudflare Tunnel.** A `cloudflared` connector inside your network publishes private services through Cloudflare's edge, protected by Cloudflare Access. Only the client goes on the computer. Setup installs `cloudflared`; Check is `command -v cloudflared`. Reach private HTTP services at the routed hostname; for private TCP (databases, SSH), run `cloudflared access tcp` to open a local listener when needed (listeners do not persist across sessions). Prefer identity-based Access; store service tokens as Team Secrets if you use them.

Tailscale gives network-level reach and, with an exit node, egress from your network. Cloudflare Tunnel publishes specific services behind Access: per-service rather than whole-network, and other services still see Cursor's shared egress. Other Debian-Linux clients follow the same Team Setup steps; pilot yours before a fleet rollout.

## Rollout, allowlists, and limits

New computers apply manifests at start. Running ones pick up changes on the roughly daily refresh. To apply immediately, recreate the computer (Enterprise admins can do this from the dashboard; the durable disk is kept) or have the member reset it. Image updates also recreate computers and re-apply scripts; network-client sign-ins may need to be redone afterwards.

If your team uses **Team allowlist only**, add the destinations your client needs (coordination servers, relays, gateways) from the vendor's docs. Running computers apply policy changes within about a minute; sleeping ones apply them on wake. You do not need to recreate for a policy change alone.

Limits the docs call out: this is a pattern you operate, not a Cursor-managed network mode; regular internet traffic still egresses through shared static IP ranges unless you route it yourself (dedicated per-customer egress IPs are not available); there is no fleet view of script results today; and this is not the Cloud Agents Tailscale / Cloudflare Tunnel setup: those recipes are a different product surface. If a Bot delegates work to Cloud Agents, those agents use Cloud Agent network settings, not your computer's client.

## Checklist

1. Decide: desktop route for one person's public allowlist, or Team Setup for private reach.
2. Confirm Enterprise (Team Setup Scripts and Network Controls).
3. Pick the client, write Setup + Check, store any credential as a Team Secret.
4. Pilot one or two computers; confirm in your vendor console; ask a Bot to hit an internal hostname.
5. Allowlist the client's endpoints if you use Team allowlist only.
6. Recreate (or wait for daily refresh) to push the manifest to the rest of the fleet.
7. Remember Cloud Agents do not inherit this client.
