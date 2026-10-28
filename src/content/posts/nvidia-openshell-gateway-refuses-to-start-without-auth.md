---
title: "NVIDIA OpenShell closes a fail-open default: gateways with no auth will refuse to start"
description: "An OpenShell gateway with no auth configured gave every caller admin rights. OpenShell v0.1.6, out 27 October, makes it refuse to start unless you opt in."
pubDate: "2026-10-27T10:07:00Z"
specimen: 1080
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
  verified: "Issue #4814, pull request #4821 and the v0.1.6 release notes in the NVIDIA/OpenShell repository."
  claimed: "Nothing beyond the repository. No security advisory has been published for this change."
verdict: "If you run an OpenShell gateway from v0.1.5 or earlier, check that it has OIDC, mTLS, operator auth or gateway JWTs configured. OpenShell v0.1.6 refuses to start a gateway without one; on older releases, the startup warning is your only signal."
sources:
  - title: "NVIDIA/OpenShell issue #4814: refuse to start without user authentication unless allow_unauthenticated_users is set"
    url: https://github.com/NVIDIA/OpenShell/issues/4814
  - title: "NVIDIA/OpenShell pull request #4821: require authentication or explicit development opt-in"
    url: https://github.com/NVIDIA/OpenShell/pull/4821
  - title: "NVIDIA/OpenShell releases"
    url: https://github.com/NVIDIA/OpenShell/releases
  - title: "NVIDIA/OpenShell v0.1.6 release (27 October 2026)"
    url: https://github.com/NVIDIA/OpenShell/releases/tag/v0.1.6
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

Yes. OpenShell v0.1.6, released on 27 October, refuses to start an unauthenticated gateway. Anyone still on v0.1.5 or earlier has the old behaviour. The maintainers have not published a security advisory, and nothing in the issue or PR says the fail-open path was abused. It reads as a hardening change to a risky default.

If you cannot upgrade yet, the fix is configuration: make sure one of the four auth mechanisms is set, and treat that startup warning as an error.

## Update, 28 October 2026: the change shipped in OpenShell v0.1.6

NVIDIA published [OpenShell v0.1.6](https://github.com/NVIDIA/OpenShell/releases/tag/v0.1.6) as a stable release on 27 October at 19:56 Israel time. The fail-closed gateway change from pull request #4821 is the first item in its upgrade notes: "Gateways now refuse to start unless OIDC, mTLS user or operator authentication, or gateway JWTs are configured." The `allow_unauthenticated_users = true` opt-in for trusted local development is unchanged.

Before upgrading, read the second upgrade note too. New sandboxes now open the control connection to their supervisor, and the notes say to "Upgrade the supervisor and sandbox runtime binaries together, because older binaries reject the new sandboxes."

There is still no security advisory for the old default, so treat this as a hardening release, not a vulnerability fix.
