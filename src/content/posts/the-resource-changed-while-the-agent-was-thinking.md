---
title: The Resource Changed While the Agent Was Thinking
description: A resource update names what changed. The client still needs to read it again before relying on its contents.
pubDate: "2026-10-08T01:30:00Z"
specimen: 386
section: tools
tags:
  - mcp
  - resources
  - subscriptions
  - data-freshness
draft: false
heroImage: https://media.aitamer.news/heroes/the-resource-changed-while-the-agent-was-thinking-dd89ee5a.jpg
heroAlt: A person compares a newer document against an older stack before acting on a changed resource.
author: ari
wildness:
  rating: 3
  verified: An update notification names the changed resource URI and carries a subscription ID.
  claimed: A pending answer can use an older copy unless the client reads the resource again.
verdict: Treat the update as a signal to reread the named URI. Check that the subscription was acknowledged, and restore it after a disconnect.
sources:
  - title: Resources - Model Context Protocol
    url: https://modelcontextprotocol.io/specification/2026-07-28/server/resources
  - title: Subscriptions - Model Context Protocol
    url: https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions
---

An application reads a resource, then spends time preparing an answer from it. During that time, the resource changes. The answer may now depend on an older copy. A resource subscription gives the application a way to learn which URI needs another read.

### A subscription names the resource

In the Model Context Protocol (MCP), each resource has a URI. Clients retrieve its contents with `resources/read`. A server can advertise support for resource-specific update notifications through its `subscribe` capability. [The resource specification](https://modelcontextprotocol.io/specification/2026-07-28/server/resources) describes these as separate operations: reading gets content; subscribing requests notice of changes.

To watch a resource, the client sends `subscriptions/listen` with its URI in `resourceSubscriptions`. That request opens a stream for notifications. The server first acknowledges the subscription and states which requested notifications it agreed to send. The client should check that acknowledgment before the initial read; reading first would leave a gap in which a change could go unnoticed. [The subscription specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions) shows the request and acknowledgment.

### The update identifies what changed

When a watched resource changes, the server sends `notifications/resources/updated`. The notification includes the resource URI and a subscription ID. Its example contains no replacement content. The client can use the URI to request the resource again with `resources/read`. [The resource specification](https://modelcontextprotocol.io/specification/2026-07-28/server/resources) shows both messages.

There is a related signal for a different event. `notifications/resources/list_changed` concerns the list of available resources. The server may support list changes and resource-specific updates independently. A client watching a document should therefore handle an update to that document separately from a change to the resource list. [The resource specification](https://modelcontextprotocol.io/specification/2026-07-28/server/resources) defines both capabilities.

### What to do

1. Check that the server advertises resource subscription support. Open `subscriptions/listen` for the URI and check that the acknowledgment includes the requested subscription.
2. Read the URI whose contents the application needs with `resources/read`. Keep the subscription active while using that content. [The subscription specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions) describes this check.
3. When an update names the URI, mark the earlier copy stale and call `resources/read` again before using that content in a pending answer.
4. If the stream closes, restore the subscription. A client using stdio must send a new listen request after reconnecting. [The subscription specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions) describes how subscriptions end.
