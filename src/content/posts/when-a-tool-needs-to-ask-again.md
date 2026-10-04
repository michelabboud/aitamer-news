---
title: When a Tool Needs to Ask Again
description: MCP elicitation lets a server ask for missing input during a request. Ordinary answers use a form; credentials require a separate URL flow.
pubDate: "2026-10-08T02:30:00Z"
specimen: 388
section: tools
tags:
  - mcp
  - elicitation
  - security
  - user-input
draft: false
heroImage: https://media.aitamer.news/heroes/when-a-tool-needs-to-ask-again-2266252e.jpg
heroAlt: A robot holds a puzzle piece beside a question bubble and an unfinished permission form.
author: ari
wildness:
  rating: 2
  verified: The specification defines form and URL modes, response actions, and URL safety rules.
  claimed: No adoption, performance, or field result is claimed.
verdict: Use forms for ordinary missing details. Route credential entry through a consented URL, then verify completion and user identity.
sources:
  - title: Elicitation - Model Context Protocol
    url: https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation
  - title: Multi Round-Trip Requests - Model Context Protocol
    url: https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr
---

A useful tool sometimes reaches a point where it cannot finish without a person. It may need a username, a choice between formats, or permission to connect an outside account. The [Model Context Protocol (MCP) elicitation specification](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation) gives the server a way to ask through the client while the original request is still in progress. The client presents the request and keeps the person in control of the response.

## The request can pause for input

The exchange begins with a client request. If the server needs more information, it returns an input request. The client collects a response and retries the original request with that response. The server can then finish or ask again. This [multi round-trip pattern](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr) also lets a server carry context in an opaque state value. The client echoes that value on retry without interpreting it.

Consider a tool preparing a report. A request such as “make the report” may leave the output format undecided. A short form can ask the person to choose a format before the server continues. That is an illustration of the flow, not a required interface. The specification leaves presentation details to the client. It does require the client to show which server is asking and to give clear ways to decline or cancel. [Those user controls are part of elicitation](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation).

## Form mode handles ordinary answers

Form mode collects structured answers inside the client. The server sends a message explaining why it needs the input and a schema describing the expected fields. A form can ask for a string, number, boolean, or a choice from a defined set. The schema supports simple, flat data. The client can use it to build fields and check an answer before sending it. The person must be able to review and change the answer first. The [form rules](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation) allow contact details such as a name or email address, subject to the person's ability to review and decline.

That makes form mode useful for a missing parameter. A server can ask for the name of a project, a date, or a selected option. The answer travels through the client to the server. Anyone designing such a prompt should treat it as information the client will see. Clear field labels and a reason for the request help a person decide whether to send it. The specification requires a human readable message explaining why the interaction is needed. It also says clients should present what is requested and why. [These are explicit parts of the request and security guidance](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation).

## Credentials go through a separate URL

Passwords, API keys, access tokens, and payment credentials have a different route. The [elicitation rules](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation) forbid asking for them through form mode. A server uses URL mode to direct the person to an external page for that sensitive interaction. The client receives a URL and an explanation. The sensitive entry happens outside the client, so the entered value does not pass through the client or the model context.

For example, a server that needs an API key can point to its own secure page. The person enters the key there, and the server can store it for later requests. A separate account connection can use an external authorization flow. The specification distinguishes that connection from authorization between the MCP client and MCP server. It also says a server must keep third party credentials away from the MCP client. [The URL mode guidance describes both cases](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation).

A click on the URL is its own decision. The client must show the full address, obtain consent before opening it, and avoid fetching the page or its metadata in advance. The server must avoid putting secrets or personal information in the URL. These rules matter because a displayed link can be deceptive and a URL can carry data before any form appears. The [safe URL requirements](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation) put checks on both sides of the interaction.

## An accepted prompt may still be unfinished

Elicitation records three distinct responses: accept, decline, and cancel. In form mode, acceptance carries the submitted fields. In URL mode, acceptance carries no form content. It means the person agreed to the interaction; it does not prove that the external step succeeded. The server checks whether the outside interaction has completed when the client retries. If it has not, the server can ask again. The specification says clients should provide a way to retry or cancel the original request. [The response rules explain these states](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation).

This distinction helps avoid a misleading success message. A person may approve opening an account connection page, then leave before completing it. A server also has to handle decline, cancel, and client failure. The [elicitation error guidance](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation) explicitly requires those cases to be handled. The [multi round-trip rules](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr) say a server cannot assume the client will answer or retry.

## The handoff needs an identity check

A separate page protects credential entry from the client, but the server still needs to know whose request the page belongs to. The specification describes a phishing case in which one person sends an elicitation link to another. If the server binds the resulting authorization to the wrong session, the outside account may be connected to the wrong user. The server must verify that the person opening the URL is the same person who started the request. It must also bind elicitation requests to the client and user identity. [The phishing section states this requirement](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation).

A server carrying request context in a state value must treat that value as input an attacker can change. If it affects access or behavior, the server must protect its integrity and reject failed checks. The [multi round-trip security rules](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr) make that responsibility explicit. A polished prompt cannot replace those server checks.

## What to do

1. When a tool asks for ordinary missing information, read which server is asking and why. Review the filled fields before accepting. Use decline or cancel if the request is unnecessary or unclear.
2. When the request involves a password, key, token, or payment credential, expect a separate URL flow. Inspect the full address and its domain before consenting to open it. Enter the secret on the intended page.
3. If an outside connection is interrupted, use the client's retry or cancel control. Treat an accepted URL prompt as permission to start that step, then wait for the server's actual result. [These checks follow the elicitation and URL safety rules](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation).
