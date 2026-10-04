---
title: Why OAuth Sends the Challenge Before the Verifier
description: Proof Key for Code Exchange ties an authorization code to a secret the client created. Following that secret through the flow shows why a stolen code is insufficient.
pubDate: "2026-10-06T12:00:00Z"
specimen: 312
section: dev
tags:
  - oauth
  - pkce
  - authentication
  - security
draft: false
heroImage: https://media.aitamer.news/heroes/why-oauth-sends-the-challenge-before-the-verifier-8f5d830a.jpg
heroAlt: A laptop sends a token toward a protected service while a stolen token takes a blocked route.
author: ari
wildness:
  rating: 2
  verified: The server binds a challenge to the code and checks the verifier during token exchange.
  claimed: A stolen code alone cannot satisfy the check without its matching verifier.
verdict: Send a fresh S256 challenge before the redirect, keep its verifier with the request, and require that verifier when the code is redeemed.
sources:
  - title: "RFC 7636: Proof Key for Code Exchange by OAuth Public Clients"
    url: https://datatracker.ietf.org/doc/html/rfc7636
  - title: "RFC 6749: The OAuth 2.0 Authorization Framework"
    url: https://datatracker.ietf.org/doc/html/rfc6749
  - title: "RFC 9700: Best Current Practice for OAuth 2.0 Security"
    url: https://datatracker.ietf.org/doc/html/rfc9700
---

An OAuth client starts an authorization code flow by sending a user to an authorization server. After the user grants access, the server redirects the browser back with an authorization code. The client then exchanges that code for a token. The code passes through the browser and a redirect before the exchange is complete. [RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749) describes those steps.

Proof Key for Code Exchange, or PKCE, adds a check to that exchange. The client creates a secret for this authorization request. It sends a value derived from the secret at the start and reveals the secret when it presents the code. Following those two values explains the order.

## The redirect can expose a code

[RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636) describes an interception attack against public clients. In its native app example, a malicious app registers as a handler for the same custom URI scheme as the legitimate app. It can receive the authorization code when the operating system handles the redirect. The connection to the authorization server can still use Transport Layer Security. The vulnerable point in this example is the handoff on the device.

Authorization codes must expire quickly and be used only once under [RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749). Those rules limit their use, but a code that reaches an attacker before redemption can still be presented to the token endpoint. PKCE makes redemption depend on a second value that the redirect does not carry.

## The client creates a verifier first

Before opening the authorization request, the client generates a fresh `code_verifier`. [RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636) defines it as a high entropy cryptographic random string created for each request. The allowed length is 43 to 128 characters. The specification recommends generating 32 random octets and encoding them with base64url, which produces a 43 character verifier.

The client must retain this verifier until it receives the authorization code. It also derives a `code_challenge` from the verifier. With the `S256` method, it hashes the verifier with SHA-256 and encodes the result with base64url:

`code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))`

The client puts the challenge and `code_challenge_method=S256` in the authorization request. It keeps the verifier for the later token request. The challenge gives the server a value to check without placing the verifier in the initial request.

## The server binds the challenge to the code

When the authorization server issues a code, it associates that code with the challenge and its method. [RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636) requires this association so the token endpoint can check the verifier later. The specification leaves the server's storage method open. What matters to the exchange is that the challenge used for the check belongs to the code being redeemed.

An attacker who receives the redirect code cannot replace its associated challenge by choosing a new verifier in the token request. The server checks against the challenge recorded when it issued that code.

## The verifier completes the exchange

The client sends the authorization code and its original `code_verifier` to the token endpoint. For `S256`, the server applies the same hash and encoding to the received verifier, then compares the result with the challenge associated with the code. A mismatch produces an `invalid_grant` error. A match lets normal OAuth token processing continue. These steps are specified in [RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636).

This is why the challenge comes first. It lets the server bind a future proof to the code before the code travels through the redirect. Revealing the verifier only during the token request lets the legitimate client satisfy that proof. An attacker who has only the code lacks the value needed to satisfy it.

## The transformation protects the verifier

PKCE also defines a `plain` method, where the challenge equals the verifier. That exposes the verifier to anyone who can observe the initial authorization request. [RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636) says clients capable of `S256` must use it and must not fall back to `plain` after an `S256` attempt fails. The specification explains that `S256` protects against an observer who can see the challenge as well as intercept the code.

The strength of this check depends on a fresh, unguessable verifier. [RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636) makes that assumption explicit. If an attacker learns the verifier along with the code, this check cannot distinguish the attacker from the client.

## What to do

1. Generate a new cryptographically random verifier for each authorization request. Keep it with that request until the code exchange finishes. Follow the format in [RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636).
2. Send an `S256` challenge in the authorization request. Send the corresponding verifier with the code to the token endpoint. Do not retry with `plain` after an `S256` failure.
3. If you operate an authorization server, bind each challenge and method to its issued code, enforce the verifier check, and reject a token request that supplies a verifier for a code issued without a challenge. [RFC 9700](https://datatracker.ietf.org/doc/html/rfc9700) requires that last check to prevent a PKCE downgrade attack.
4. Keep the other redirect protections in place. [RFC 9700](https://datatracker.ietf.org/doc/html/rfc9700) requires exact redirect URI matching, with its stated exception for native app localhost ports. It also requires protection against cross-site request forgery. Rely on PKCE for that protection only when you have ensured the server supports it.
