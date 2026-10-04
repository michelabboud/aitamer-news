---
title: A Token for One MCP Server Belongs to That Server
description: MCP resource indicators name the server a token is for. Audience checks and separate upstream tokens keep that boundary intact.
pubDate: "2026-10-05T01:00:00Z"
specimen: 244
section: dev
tags:
  - mcp
  - oauth
  - security
  - access-tokens
draft: false
heroImage: https://media.aitamer.news/heroes/a-token-for-one-mcp-server-belongs-to-that-server-255ba64d.jpg
heroAlt: Separate paper doors each have a distinct matching key, with coral accents on an indigo background.
author: ari
wildness:
  rating: 2
  verified: MCP requires resource indicators, audience validation, and no inbound token passthrough.
  claimed: The server URI is a practical boundary for token use across connected services.
verdict: Request a token for the exact MCP server, verify that server is its audience, and use a separately issued token when an upstream API requires authorization.
sources:
  - title: MCP Authorization Specification
    url: https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization
  - title: "RFC 8707: Resource Indicators for OAuth 2.0"
    url: https://www.rfc-editor.org/rfc/rfc8707.html
  - title: "RFC 9068: JSON Web Token Profile for OAuth 2.0 Access Tokens"
    url: https://www.rfc-editor.org/rfc/rfc9068.html
  - title: MCP Security Best Practices
    url: https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices
---

An access token has a destination. In the [Model Context Protocol (MCP) authorization specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization), the client requests a token for a particular MCP server, and that server checks that it is the intended recipient. If the server then calls another service, it uses a separate token for that service. This rule matters most when an MCP server sits between a client and an API. The same user may be involved in both calls, but the two services have different trust boundaries.

## The resource parameter names the destination

MCP uses the OAuth `resource` parameter to tell the authorization server where the client intends to use an access token. For HTTP authorization, the client must include that parameter in both the authorization request and the token request. Its value must identify the MCP server through its canonical URI. The specification tells clients to send it even when the authorization server does not support the parameter. [MCP authorization specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization).

Consider a client connecting to `https://mcp.example.com/mcp`. That URI can identify the MCP server in the `resource` parameter. A path matters when several MCP servers share one host. The MCP specification gives both host-level and path-specific URI examples and advises clients to use the most specific URI they can. The URI needs a scheme and cannot contain a fragment. [MCP authorization specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization).

OAuth's [resource indicators standard](https://www.rfc-editor.org/rfc/rfc8707.html) explains what the parameter buys: the authorization server can issue a token restricted to the named recipient. It also distinguishes the target resource from scope. Scope describes the access being requested; the resource identifies where that access will be used. A token with a useful scope can still be wrong for the server receiving it. [RFC 8707](https://www.rfc-editor.org/rfc/rfc8707.html).

## The MCP server checks the recipient

Sending `resource` is only one side of the boundary. An MCP server must validate that each access token was issued specifically for that server. It must reject a token intended for another service before processing the request. The authorization specification requires a 401 response for invalid or expired tokens and a 403 response for insufficient permissions. It also says the client must send its bearer token in the Authorization header on every HTTP request, including requests within the same logical session. [MCP authorization specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization).

For a JSON Web Token that follows the [OAuth access token profile](https://www.rfc-editor.org/rfc/rfc9068.html), the `aud` claim identifies the audience. That profile requires a resource server to reject a token whose audience does not include an identifier it expects for itself. It also requires checks of the issuer, signature, and expiry. The MCP rule is broader than this one token format: the server must verify its intended audience, using the validation method appropriate to the token it accepts. [RFC 9068](https://www.rfc-editor.org/rfc/rfc9068.html); [MCP authorization specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization).

A client asking for the right resource does not prove that the token it received has the right audience. The MCP specification describes audience binding when the authorization server supports resource indicators, while still requiring the MCP server to validate tokens presented to it. That makes the receive-side check essential, including when an authorization server ignores the client's requested resource. [MCP authorization specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization).

## The next service needs its own token

Suppose an MCP server reads records from an upstream API. The token presented by the MCP client is for the MCP server. The authorization specification says that, when the MCP server calls the upstream API, it may act as an OAuth client and use a separate access token issued by that API's authorization server. It explicitly forbids passing through the token received from the MCP client. [MCP authorization specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization).

That separation lets each recipient validate a token intended for itself. It also keeps the MCP server responsible for the request it accepted. The [MCP security guidance](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices) warns that passing a client token downstream can bypass controls tied to token audience and make audit trails harder to interpret. The guidance also says the downstream server's logs may show requests that appear to come from a different source and identity than the MCP server that actually forwarded the token, which makes incident investigation and auditing harder. [MCP security guidance](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices).

## A wide token weakens the boundary

OAuth permits a request to name multiple resources, but its [resource indicators standard](https://www.rfc-editor.org/rfc/rfc8707.html) encourages a single resource where possible. A bearer token valid at several recipients can be used by any one of them at the others. That requires a high degree of trust among those recipients. The standard also notes that some servers host user content or are multi-tenant, and advises a specific resource URI that includes any portion identifying the tenant, such as a path component, so one tenant cannot use a token against another. [RFC 8707](https://www.rfc-editor.org/rfc/rfc8707.html).

This is why a successful signature check alone is too small a test. In the JWT access token profile, the server also has to match the audience to itself. The MCP specification then requires the server to reject tokens issued for other resources and forbids it from forwarding the inbound token to an upstream service. [RFC 9068](https://www.rfc-editor.org/rfc/rfc9068.html); [MCP authorization specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization).

## What to do

1. Give each MCP server a stable, specific canonical URI. Use that URI as `resource` in both authorization and token requests. [MCP authorization specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization).
2. Validate each incoming token before handling the request. Check that it came from the expected issuer, remains valid, and names this server as its intended audience. Reject a token for another service. [MCP authorization specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization); [RFC 9068](https://www.rfc-editor.org/rfc/rfc9068.html).
3. Keep the inbound token out of downstream API calls. Obtain and use a separate token for each upstream service the MCP server calls. [MCP authorization specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization).
4. Test a wrong-audience token as a failure case. A token for a sibling service should be rejected even when its issuer and signature look valid. That test follows the MCP audience rule and the JWT profile's explicit rejection requirement. [MCP authorization specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization); [RFC 9068](https://www.rfc-editor.org/rfc/rfc9068.html).
