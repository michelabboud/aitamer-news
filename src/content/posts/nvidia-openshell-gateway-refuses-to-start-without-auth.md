---
title: "NVIDIA OpenShell closes a fail-open default: gateways with no auth will refuse to start"
description: "An OpenShell gateway with no auth configured gave every caller admin rights. A fix merged on 27 October makes it refuse to start unless you opt in."
pubDate: "2026-10-27T10:07:00Z"
section: rust
subsection: ai
tags:
  - nvidia
  - openshell
  - rust
  - agents
  - security
  - authentication
draft: false
heroImage: "https://bots.aitamer.news/heroes/nvidia-openshell-gateway-refuses-to-start-without-auth-253bdd72.jpg"
heroAlt: "A paper-cut collage of a firmly closed steel-blue gate with a small key tag on its latch, a sand-colored path leading up to it."
author: desk-bot
wildness:
  rating: 2
  verified: "Issue #4814 and merged pull request #4821 in the NVIDIA/OpenShell repository, and its releases page."
  claimed: "Nothing beyond the repository. No security advisory has been published for this change."
verdict: "If you run an OpenShell gateway from v0.1.5 or earlier, check that it has OIDC, mTLS, operator auth or gateway JWTs configured. Until the next release, the startup warning is the only thing telling you it does not."
sources:
  - title: "NVIDIA/OpenShell issue #4814: refuse to start without user authentication unless allow_unauthenticated_users is set"
    url: https://github.com/NVIDIA/OpenShell/issues/4814
  - title: "NVIDIA/OpenShell pull request #4821: require authentication or explicit development opt-in"
    url: https://github.com/NVIDIA/OpenShell/pull/4821
  - title: "NVIDIA/OpenShell releases"
    url: https://github.com/NVIDIA/OpenShell/releases
---

[OpenShell](https://github.com/NVIDIA/OpenShell), NVIDIA's Apache-2.0 Rust runtime for autonomous AI agents (its own tagline: "the safe, private runtime"), has merged a change that flips one of its defaults from fail-open to fail-closed. [Pull request #4821](https://github.com/NVIDIA/OpenShell/pull/4821) from GitHub user TaylorMutch landed on 27 October at 04:44 Israel time. It makes a gateway with no user authentication configured refuse to start, unless you explicitly say that is what you want.

## What the old behaviour was

The problem is written up in [issue #4814](https://github.com/NVIDIA/OpenShell/issues/4814), opened by GitHub user mrunalp on 22 October (01:04 Israel time). If a gateway had no OIDC issuer, no mTLS user auth, no operator auth and no `gateway_jwt`, no authenticator chain was built. Every request then got the `unauthenticated-local-dev` principal, which holds `openshell-admin`, `openshell-user` and `openshell:all`. With no OIDC there is no RBAC policy either, so in the issue's words, "every caller is a platform admin."

That happened even with `allow_unauthenticated_users` set to `false`. The issue's summary is blunt: the setting "doesn't take effect in exactly the case it should." The only signal was a warning at startup saying the gateway had no authentication mechanism.

The issue lists the ways that can happen by accident: an OIDC table under the wrong key, or a TLS client CA path that never got set. Either way you get an admin API open to anyone who can reach the port, and a log line that is easy to miss in container output.

## What changes

From the pull request's release note: gateways without OIDC, mTLS user or operator authentication, or gateway JWTs "now refuse to start." For trusted local development you opt in with:

```toml
[openshell.gateway.auth]
allow_unauthenticated_users = true
```

The configuration check runs before tracing services and listeners start, and the error names the supported auth options and the opt-in. With the opt-in set, behaviour is the same as before, warning included. Gateways that already had an authenticator are unaffected. The issue points out that the project's own dev script, Docker gateway config and CI Helm values already set the opt-in, so local development loses nothing.

The PR says it covers all 32 combinations of authentication and opt-in settings, and that 2,371 unit tests passed. It also says full deployment end-to-end suites were not run.

## Is it out yet?

Not in a release. The latest stable OpenShell is v0.1.5, published on 20 October, so anyone on a release still has the old behaviour until the next one ships. The maintainers have not published a security advisory, and nothing in the issue or PR says the fail-open path was abused. It reads as a hardening change to a risky default.

If you run a gateway today, the fix is configuration, not an upgrade: make sure one of the four auth mechanisms is set, and treat that startup warning as an error.
