---
title: "MCP gives AI applications a common way to connect tools and context"
description: "The Model Context Protocol standardizes how AI hosts connect to servers that provide tools, resources and prompts, with separate transports and security responsibilities."
pubDate: "2026-09-28T19:00:00Z"
specimen: 46
section: "tools"
tags: ["mcp", "ai-development", "developer-tools", "protocols"]
draft: false
heroImage: "https://media.aitamer.news/heroes/mcp-explained.jpg"
heroAlt: "A paper-cut collage of a cream host hub linking a laptop, a document and a tool to a slate-blue server stack with a coral connection point."
author: "ari"
sources:
  - title: "Model Context Protocol specification, version 2025-11-25"
    url: "https://modelcontextprotocol.io/specification/2025-11-25"
  - title: "MCP architecture"
    url: "https://modelcontextprotocol.io/specification/2025-11-25/architecture"
  - title: "MCP lifecycle"
    url: "https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle"
  - title: "MCP server tools"
    url: "https://modelcontextprotocol.io/specification/2025-11-25/server/tools"
  - title: "MCP server resources"
    url: "https://modelcontextprotocol.io/specification/2025-11-25/server/resources"
  - title: "MCP server prompts"
    url: "https://modelcontextprotocol.io/specification/2025-11-25/server/prompts"
  - title: "MCP client sampling"
    url: "https://modelcontextprotocol.io/specification/2025-11-25/client/sampling"
  - title: "MCP client elicitation"
    url: "https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation"
  - title: "MCP transports"
    url: "https://modelcontextprotocol.io/specification/2025-11-25/basic/transports"
  - title: "MCP authorization"
    url: "https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization"
wildness:
  rating: 1
  verified: "Roles, features, transports and security guidance in the version-pinned MCP specification."
  claimed: "None; this explainer summarizes specification text."
verdict: "Use MCP when you want reusable AI integrations, then choose the transport and permissions to fit the risk."
---

The Model Context Protocol (MCP) is a shared interface for connecting an AI application to data and capabilities outside the model. This explainer follows the [version 2025-11-25 specification](https://modelcontextprotocol.io/specification/2025-11-25), reviewed as of September 2026. It defines how applications discover and exchange capabilities using JSON-RPC, a format for structured requests, responses and notifications.

In practice, an integration can expose its functions and context through a common protocol, and a compatible AI application can connect to it without needing a separate bespoke wire format for every integration. MCP standardizes the connection. It does not decide what an application should trust, which actions a user should approve, or how a particular AI model reasons.

## Host, client and server have different jobs

The [MCP architecture](https://modelcontextprotocol.io/specification/2025-11-25/architecture) has three parts. The **host** is the AI application a person uses, such as an assistant or an editor. It coordinates the model, user interface and connections. A host creates an MCP **client** for each server connection. The client handles protocol messages, negotiation and the connection boundary. The **server** provides a focused integration, such as access to an issue tracker or a set of project files.

Think of a host as an IDE, its client as the adapter that speaks MCP, and a server as the integration that offers repository context or issue actions. One host can manage several clients and servers. The architecture keeps the full conversation with the host: a server receives the information sent through its own connection, rather than automatically seeing every other server or the entire chat history.

At connection setup, client and server [agree on a protocol version and negotiate capabilities](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle). Capabilities say which optional features each side supports. A client should not assume a server implements every MCP feature, and a server should not use a feature the client did not declare. This is the protocol-level handshake; the host still has to enforce its own access and consent rules.

## Tools, resources and prompts are not interchangeable

The spec describes three server-provided building blocks. Their distinction is about what the integration offers and who typically controls its use.

- **Tools** are callable functions. A server might offer `search_issues` or `create_branch`, along with a name, description and input schema. The model can select a tool based on the task, while the host determines the user interface and approval flow. The [tools section](https://modelcontextprotocol.io/specification/2025-11-25/server/tools) says implementations should keep a human able to deny invocations and make exposed tools and their use visible.
- **Resources** are data identified by a uniform resource identifier (URI), such as a file, database schema or application record. A client can list resources and read one, and servers may support notifications when resources change. The host decides how that context enters the application. The [resources section](https://modelcontextprotocol.io/specification/2025-11-25/server/resources) leaves this interaction model to implementers.
- **Prompts** are reusable message templates that a person can select and customize with arguments. A code-review server might provide a review template. The client can list prompts and fetch the rendered messages. The [prompts section](https://modelcontextprotocol.io/specification/2025-11-25/server/prompts) describes them as user-controlled, with the exact interface left to the host.

In short, a resource supplies context, a prompt offers a prepared way to use context, and a tool performs an operation or query. One server can implement any subset. MCP does not require every server to provide all three.

The protocol also defines client-side capabilities. For example, a server can [request model sampling through the client](https://modelcontextprotocol.io/specification/2025-11-25/client/sampling), or [ask for additional user input](https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation). These features require negotiation. The client controls model access and user interactions; the server does not thereby gain direct access to the host's model or conversation.

## stdio and Streamable HTTP connect the peers

MCP messages use JSON-RPC, but a transport determines how those messages travel. The [transport specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports) defines two standard options.

With **stdio** (standard input and output), the client launches the server as a local subprocess. The client writes protocol messages to the process's standard input, and the server writes protocol messages to standard output. Standard output must contain only valid MCP messages; the server can use standard error for logs. This is a natural fit for a local tool managed alongside a desktop app or development environment.

With **Streamable Hypertext Transfer Protocol (HTTP)**, the server runs as an independent service. The client sends messages over HTTP, and the server can reply with a JSON response or use Server-Sent Events (SSE) to stream messages. This supports remote services and streaming interactions. It also makes ordinary network security relevant: the spec requires checking the `Origin` header to prevent Domain Name System (DNS) rebinding, recommends that local servers bind only to localhost, and recommends authentication for connections.

Both standard transports carry MCP messages. Pick based on where the integration runs and how it is operated. A remote HTTP service can be shared and managed centrally, but its authentication, network boundary and operational access need deliberate design.

## Authorization depends on the transport

Authorization is optional in MCP overall. The [authorization section](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization) defines a flow for HTTP-based transports, using the OAuth authorization framework so a client can access a protected server on a user's behalf. The server identifies its authorization service, the client obtains an access token, and the server checks the token on protected requests.

For stdio, the specification says implementations should not use that HTTP authorization flow; credentials should instead be obtained from the environment. That distinction matters when building a server: do not assume that adding MCP automatically supplies identity, authorization or secret management. Decide how credentials enter the process, restrict their scope, and ensure the server checks them for the operations it exposes.

## The protocol names risks; the host must manage them

MCP can connect a model to private data and executable actions. The specification's security guidance calls for user consent, data privacy, tool safety and controls over sampling. It says hosts must obtain explicit user consent before exposing user data to servers and before invoking tools. It also warns that tool descriptions and annotations are untrusted unless they come from a trusted server. Treating a tool's self-description as a security guarantee would give an integration control over how much authority users think they are granting.

Transport security adds more specific concerns. A local HTTP server that accepts connections from arbitrary origins can be targeted through DNS rebinding, where a malicious website tries to reach a service on the visitor's own machine. The spec's Origin validation and localhost-binding recommendations address this class of exposure. Remote servers also need authentication and transport protection appropriate to the deployment.

There is a boundary here: the spec states that it cannot enforce all security principles at the protocol level. A well-formed message does not prove a tool is safe, that a user understood its effect, or that a server protects stored data. Hosts need clear permissions and approval interfaces; server authors need narrow capabilities, input validation and access checks. A read-only search integration and a tool that can delete production records should not receive the same trust or approval treatment.

## What to choose

If you are adding one integration, start with the smallest useful set of resources, prompts and tools. Use resources for data the host can choose to include, prompts for repeatable user-selected workflows, and tools for actions that need structured inputs and an explicit permission story. Prefer stdio for a local process managed by the host. Choose Streamable HTTP when the server needs to be a separately operated service, and implement its origin checks and authorization deliberately.

Then test the interaction from the host's point of view: what data leaves the application, what actions the model can request, what the user sees before an action runs, and what the server will authorize. MCP gives those parts a common language. Your application still owns the trust decisions.
