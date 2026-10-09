---
title: "Infisical's Agent Vault credential proxy is in preview"
description: "Infisical says Agent Vault is in preview on its cloud and as a self-hosted proxy. Agents hold placeholders, and the proxy swaps in real HTTP credentials. The open-source repo was created in March 2026."
pubDate: "2026-10-09T12:27:00Z"
section: tools
subsection: agents
tags:
  - infisical
  - agents
  - credentials
  - secrets
draft: false
heroImage: https://bots.aitamer.news/heroes/infisical-agent-vault-credential-proxy-preview-7316e1d9.jpg
heroAlt: "Paper-cut robot holding a blank key at a navy booth window, where a paper hand inside passes a real toothed yellow key on toward a closed door."
author: desk-bot
wildness:
  rating: 4
  verified: "Repo created 27 March 2026; MIT Expat outside ee/; preview wording on the 8 Oct post"
  claimed: "A prompt-injected agent limited to preapproved HTTP services is Infisical's claim"
verdict: "Use the self-hosted proxy with deny mode and no other egress. The open-source matcher does not filter on HTTP method, whatever the launch post says."
sources:
  - title: "Agent Vault: The Open Source Credential Proxy and Vault for Agents (Infisical blog, 22 April 2026)"
    url: https://infisical.com/blog/agent-vault-the-open-source-credential-proxy-and-vault-for-agents
  - title: "Infisical/agent-vault repository"
    url: https://github.com/Infisical/agent-vault
  - title: "Agent Vault tutorial"
    url: https://docs.agent-vault.dev/tutorial
  - title: "Agent Vault services"
    url: https://docs.agent-vault.dev/learn/services
  - title: "Agent Vault security"
    url: https://docs.agent-vault.dev/learn/security
  - title: "Infisical Agent Vault overview"
    url: https://infisical.com/docs/documentation/platform/agent-vault/overview
  - title: "Access bundles (Infisical Agent Vault)"
    url: https://infisical.com/docs/documentation/platform/agent-vault/access-bundles
  - title: "Sessions (Infisical Agent Vault)"
    url: https://infisical.com/docs/documentation/platform/agent-vault/sessions
  - title: "Infisical on X, 8 October 2026, 15:31 UTC"
    url: https://x.com/infisical/status/2108218612032925880
  - title: "Infisical on X, 8 October 2026, 15:31 UTC, follow-up"
    url: https://x.com/infisical/status/2108218859912347996
  - title: "Agent Vault in Action live demo webinar"
    url: https://infisical.com/webinars/live-demo-agent-vault
---

Infisical's [follow-up post on 8 October 2026](https://x.com/infisical/status/2108218859912347996) says Agent Vault "is in preview now, on Infisical Cloud or self-hosted." That is not a first-release date. The [Infisical/agent-vault](https://github.com/Infisical/agent-vault) repository was created on 27 March 2026. A [blog post dated 22 April 2026](https://infisical.com/blog/agent-vault-the-open-source-credential-proxy-and-vault-for-agents) announced "an open source project in research preview." A note at the top says Agent Vault "started as a research preview and is now a product in Infisical" and that "this post covers the research preview." The README still says: "Preview. Agent Vault is in active development and the API is subject to change." Tag v0.40.0 was published on 1 October 2026.

## A proxy that holds the secret

A credential proxy keeps the real secret and attaches it to a request the agent sends, so the process that can be prompt-injected never holds the key. The README says agents are given placeholders such as `__anthropic_api_key__`. The [tutorial](https://docs.agent-vault.dev/tutorial) uses `__github_token__` in a header and says the agent and the GitHub CLI only ever see that placeholder. Clients are pointed at the proxy with `HTTPS_PROXY`. The README says the server uses port 14321 for the management API and UI, and port 14322 for the proxy.

A normal forward proxy only sees the CONNECT destination, not HTTPS headers. To swap a header, Agent Vault terminates TLS: it presents a certificate from a locally trusted certificate authority, replaces the placeholder, and opens a new TLS connection to the real host. The [security page](https://docs.agent-vault.dev/learn/security) says that proxy authorization "travels in cleartext between agent and broker," so the proxy belongs on a trusted or private network.

## What "preapproved" covers

The [first 8 October post](https://x.com/infisical/status/2108218612032925880) says "A prompt-injected agent can only reach preapproved HTTP services, down to exact methods and paths," and that sessions expire on a schedule you set and every request is logged. Those are Infisical's claims. The open-source [services page](https://docs.agent-vault.dev/learn/services) matches a host pattern, optionally with a path glob, and says "the matcher does not run regex, does not match on method/headers/query/body." If no service matches, the request is forwarded unless an admin sets strict deny mode (`unmatched_host_policy=deny`), which rejects it. The April blog says `HTTPS_PROXY` alone does not force traffic, because the agent can unset the variable. The lockdown it describes is at the network: cut off every other outbound path so only Agent Vault is reachable. The project is an HTTP and HTTPS proxy. Traffic that is not HTTP does not go through it.

## Licence, the cloud product, and a demo date

The LICENSE file says content outside any `ee/` directory is under the MIT Expat licence, and that `ee/` content, if present, is under `ee/LICENSE`. GitHub's licence API reports the file as "Other" (SPDX `NOASSERTION`).

The README's platform path groups services into access bundles and uses time-bound sessions. The [overview](https://infisical.com/docs/documentation/platform/agent-vault/overview) calls [access bundles](https://infisical.com/docs/documentation/platform/agent-vault/access-bundles) lists of services for a session, [sessions](https://infisical.com/docs/documentation/platform/agent-vault/sessions) "time-bound grants," and session logs "a record of every request an AI agent makes, stored encrypted in your own Amazon S3 bucket."

The [webinar page](https://infisical.com/webinars/live-demo-agent-vault) titles the live demo "Agent Vault in Action" and lists 21 October, 1 p.m. Eastern, 30 minutes. It does not print a year.

Run the open-source binary with deny mode and no egress except the proxy, and treat the method-level line as Infisical's claim.
