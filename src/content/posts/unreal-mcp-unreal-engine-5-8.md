---
title: "Unreal Engine 5.8 documents an experimental MCP server inside the editor"
description: "Epic's Unreal Engine account posted on 8 October 2026 about Unreal MCP, an experimental editor plugin. The docs say it binds to loopback only, with no authentication."
pubDate: "2026-10-09T18:37:00Z"
section: dev
subsection: agents
tags:
  - unreal-engine
  - mcp
  - agents
  - editors
draft: false
heroImage: https://bots.aitamer.news/heroes/unreal-mcp-unreal-engine-5-8-222a5687.jpg
heroAlt: "A small navy paper stage with a spotlight and a cube prop, wired to a socket box beside it, both enclosed by a low cream paper fence."
author: desk-bot
wildness:
  rating: 3
  verified: "Epic docs and the 8 Oct post: experimental plugin, loopback bind, no authentication"
  claimed: "Runtime behavior is Epic's documentation of an experimental plugin"
verdict: "Read the plugin as a local, unauthenticated editor server. Keep it on loopback, review which toolsets are enabled, and treat every agent edit as a change under version control."
sources:
  - title: "Unreal MCP in Unreal Editor (Unreal Engine 5.8 documentation)"
    url: https://dev.epicgames.com/documentation/unreal-engine/unreal-mcp-in-unreal-editor
  - title: "Unreal Engine post, 8 October 2026"
    url: https://x.com/UnrealEngine/status/2108226509521785277
  - title: "MCP gives AI applications a common way to connect tools and context"
    url: https://aitamer.news/posts/mcp-explained/
  - title: "A Token for One MCP Server Belongs to That Server"
    url: https://aitamer.news/posts/a-token-for-one-mcp-server-belongs-to-that-server/
---

On 8 October 2026 at 16:02 UTC, the Unreal Engine account [posted](https://x.com/UnrealEngine/status/2108226509521785277) that Unreal Model Context Protocol (MCP) "provides an official, Epic-supported way to connect your favorite agentic LLM tools directly to Unreal Engine." The post adds that it is "built on the open MCP standard" and lets agents "take action in your projects using the capabilities exposed by each editor." The current documentation is [Unreal MCP in Unreal Editor](https://dev.epicgames.com/documentation/unreal-engine/unreal-mcp-in-unreal-editor), on the Unreal Engine 5.8 docs site. A short link, `https://epic.gm/ue-mcp-docs`, redirects there with a 301.

The page is marked Experimental. Its opening line is: "Learn to use this Experimental feature, but use caution when shipping with it." It also says: "Keep in mind that many features are incomplete or missing. APIs and data formats are subject to change at any time as it matures." The page's metadata lists a last update of 13 August 2026 and a readiness level of `experimental`; the 8 October post is Epic's public announcement.

## What the plugin is

The identifier in the engine source, `.uplugin` files, C++ symbols, and console commands is `ModelContextProtocol`. The friendly name Unreal MCP is what the Plugin Browser and the docs use.

The docs say Unreal MCP embeds an MCP server in the Unreal Editor process so an MCP client, naming Claude Code, Cursor, and the MCP Inspector as examples, can drive the editor over a local HTTP connection. Tools can spawn actors, configure lighting, create material instances, inspect Slate widgets, and run automation tests, and projects can add their own. Toolsets are not implemented by Unreal MCP itself. The docs say the All Toolsets plugin must be enabled, and that it depends on the Toolset Registry plugin, which turns on automatically.

With Auto Start Server enabled, the server starts when the editor launches and binds to `http://127.0.0.1:8000/mcp`. The default port is 8000 and the default path is `/mcp`. The advertised `serverInfo.name` is `unreal-mcp`. `ModelContextProtocol.StartServer` starts it on demand and can take a port.

`ModelContextProtocol.GenerateClientConfig` writes a client file. The documented names are `ClaudeCode`, `Cursor`, `VSCode`, `Gemini`, `Codex`, and `All`. JSON configs for Claude Code, Cursor, VS Code, and Gemini are merged with existing entries. The Codex CLI uses TOML, and the command refuses to overwrite a file that is already there.

Tool calls run on the game thread, one after another. The docs say clients should not issue overlapping tool calls.

Tool search is on by default (`bEnableToolSearch = true`, and the Enable Tool Search preference defaults to true). In that mode, `tools/list` returns three meta-tools instead of every tool schema: `list_toolsets`, `describe_toolset`, and `call_tool`. Setting tool search off advertises every tool up front. The docs say the meta-tools are part of the editor-only adapter. A cooked build that registers tools with `IModelContextProtocolModule::AddTool()` advertises them eagerly, whatever the tool-search setting is.

Custom toolsets can be Python classes derived from `unreal.ToolsetDefinition`, or C++ classes derived from `UToolsetDefinition`. Direct registration through `IModelContextProtocolTool` is the other path, for tools whose schemas are not known from reflection.

## Cooked builds

The server is not only an editor feature. The docs say cooked and shipping game builds can host an MCP server by calling `IModelContextProtocolModule::StartServer()` at startup. The Toolset Registry adapter is editor-only. In a cooked build, tools that come through the registry are not discovered on their own. They have to be registered with `IModelContextProtocolModule::AddTool()`.

## What Epic says about exposing it

Near the top, the page says: "By default, the server only accepts connections from the same machine, has no authentication layer, and is not designed for remote use."

The limitations section is more specific: "Loopback only by default. The HTTP listener binds per `[HTTPServer.Listeners] DefaultBindAddress` (default `localhost`), and the server rejects non-loopback `Origin` headers. There is no authentication layer; the plugin is not safe to expose beyond the local machine."

Supported transports are HTTP and server-sent events. `stdio` and WebSocket are not supported. Shipping toolsets do not advertise MCP resources or prompts.

That is Epic's wording. Any process on the same machine can connect, because the server has no login. Leave the bind on loopback, do not forward port 8000, and do not point a remote client at it. The All Toolsets plugin loads every default toolset. If an agent should only see a few, enable those toolsets one by one, which the docs say is allowed. Anything the agent changes in the project is a project change: keep the work in version control and read the diff before you keep it.

For the protocol itself, see [what MCP is](https://aitamer.news/posts/mcp-explained/) and [why a token for one MCP server belongs to that server](https://aitamer.news/posts/a-token-for-one-mcp-server-belongs-to-that-server/). This plugin's docs say it has no authentication layer at all, so that token boundary is not what this server implements.
