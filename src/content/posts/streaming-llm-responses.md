---
title: "How to stream model responses to users"
description: "A practical guide to server-sent events, WebSockets, provider event streams, tool calls, disconnects and buffering in AI applications."
pubDate: "2026-10-01T07:00:00Z"
specimen: 60
section: "dev"
tags: ["llm-streaming", "server-sent-events", "websockets", "api-design", "developer-experience"]
draft: false
heroImage: "https://media.aitamer.news/heroes/streaming-llm-responses.jpg"
heroAlt: "A paper-cut collage of small cream and coral paper tiles flowing across layered slate-blue bands toward a paper screen, with a gap in the stream."
author: "ari"
sources:
  - title: "OpenAI: Streaming API responses"
    url: "https://developers.openai.com/api/docs/guides/streaming-responses"
  - title: "Anthropic: Streaming messages"
    url: "https://platform.claude.com/docs/en/build-with-claude/streaming"
  - title: "MDN: Using server-sent events"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events"
  - title: "MDN: WebSocket API"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API"
  - title: "Cloudflare: Response body inspection"
    url: "https://developers.cloudflare.com/rules/configuration-rules/response-body-inspection/"
  - title: "MDN: Using the Fetch API"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch"
  - title: "MDN: EventSource constructor"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/EventSource/EventSource"
  - title: "OpenAI: Function calling"
    url: "https://developers.openai.com/api/docs/guides/function-calling"
  - title: "Anthropic: Tool use"
    url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview"
  - title: "MDN: Cross-site scripting"
    url: "https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/XSS"
wildness:
  rating: 3
  verified: "Transport behavior checked against MDN's independent documentation."
  claimed: "Provider event formats and Cloudflare inspection behavior rely on vendor documentation."
verdict: "Use HTTP server-sent events for one-way model output, normalize provider events, and treat completion as a state you must verify."
---

Streaming makes an AI response visible before the model has finished producing it. A user sees the first words while later words are still being generated. This can make an interaction feel responsive, but it also changes the shape of the application: your server forwards a sequence of events, the browser renders partial state, and a disconnect can happen before a complete answer exists.

For a typical chat turn, use a regular HTTP request from the browser to your server, then stream the server's response with **[server-sent events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)**. SSE is a text event format carried over HTTP. It fits a flow where the browser sends a prompt and the server sends updates back. Use a **[WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)** when the client and server both need to send messages repeatedly over one live connection, such as collaborative editing or interactive voice control.

## Choose the direction of communication

SSE is one-way: the server sends events to the client. A browser's `EventSource` interface connects to an event URL and receives messages; the server uses the `text/event-stream` content type, with each event separated by a blank line. The browser reconnects when an `EventSource` connection drops, according to MDN's SSE guide. That behavior is handy for feeds, but it does not automatically resume a model generation from the exact point of interruption.

The [`EventSource` constructor](https://developer.mozilla.org/en-US/docs/Web/API/EventSource/EventSource) takes a URL and an optional `withCredentials` setting; it offers no request-body or custom-header options. A chat application can instead send its prompt with [**`fetch`**](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), then read the response body as a stream. This keeps the prompt in a normal POST request and lets your server return SSE-formatted events. With `fetch`, the client must decode the response and parse SSE messages itself. Another option is to create a generation first and connect to its event URL, with authentication and replay designed explicitly.

A WebSocket opens a two-way interactive session. The browser and server can both send messages without opening a new HTTP request each time. That extra flexibility is useful when the user must interrupt, steer, or send frequent updates during generation. It also means you own a bidirectional protocol, connection lifecycle, and message handling. The standard browser `WebSocket` interface does not provide automatic backpressure, MDN notes, so a client that cannot process arriving messages can accumulate buffered data.

For a request-and-answer chat turn, SSE is usually the smaller design. A stop button does not require WebSockets: the browser can abort its `fetch` request, and the server can cancel the upstream model request if its HTTP client and provider SDK support cancellation.

## Provider streams are event protocols

Streaming is more than splitting a string into token-sized pieces. Providers send typed events that describe the response lifecycle, content blocks, tool calls, and errors. Do not build logic that assumes every event is user-visible text.

The [OpenAI Responses API streaming guide](https://developers.openai.com/api/docs/guides/streaming-responses) says setting `stream` to `true` produces semantic server-sent events. It lists `response.created`, repeated `response.output_text.delta` events, a terminal `response.completed`, and an `error` event. OpenAI also documents output-item events and [function-call argument events](https://developers.openai.com/api/docs/guides/function-calling). Handle the types your application needs and tolerate unknown types so an added event does not break your stream parser.

Anthropic's [Messages API streaming guide](https://platform.claude.com/docs/en/build-with-claude/streaming) describes a different sequence: `message_start`, content blocks that start, receive deltas and stop, one or more `message_delta` events, and `message_stop`. Text arrives as `text_delta` within a `content_block_delta`. The block index matters because a message may have multiple content blocks. Anthropic also documents `ping` and in-stream error events.

These event names are not interchangeable. Put a small adapter between each provider and your application. It can translate provider events into a stable set such as `text_delta`, `tool_call_started`, `tool_arguments_delta`, `completed`, and `failed`, along with a generation identifier. Keep provider-specific details available for logs and debugging, but let the browser depend on your contract. That makes switching models less likely to rewrite your UI.

## Tool calls need a complete input

Tool calls are part of the generated response, not permission to execute every partial fragment immediately. OpenAI's function-calling guide shows function-call argument deltas and a corresponding arguments-done event. Anthropic's streaming guide shows `input_json_delta` fragments for tool-use blocks; it says these are partial JSON strings, while the final tool input is an object.

Accumulate argument fragments for the correct call or content-block index. Wait until the provider signals that the arguments are complete, then parse the whole value, validate it against your own schema, check authorization, and only then run the tool. A fragment can end halfway through a string or object, so parsing each fragment as a standalone JSON document will fail. Rendering a draft status such as “Preparing a tool call” is fine; treating unfinished arguments as an executable command is not.

For client-side tools, [OpenAI](https://developers.openai.com/api/docs/guides/function-calling) and [Anthropic](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) document a follow-up model request with the tool result. The application can stream that continuation. Keep that cycle visible in your application state. The first generation may finish with a tool-use outcome rather than a final answer for the user. A complete tool call does not finish the assistant turn.

## Partial output is not a completed answer

Keep a generation state separate from its accumulated text. At minimum, distinguish connecting, streaming, completed, failed, and cancelled. A network close before a terminal success event means the answer is partial, even if it ends at a period. Mark it as interrupted and give the user a clear retry or resume action.

Do not blindly retry the same model request after a disconnect. The provider may have finished even though the browser never received the final event, and rerunning can produce a different answer or repeat tool side effects. If you need reliable resume, persist the generation identifier and events on your server, assign event sequence IDs, and replay events after the client's last acknowledged position. This is application-level recovery; browser reconnection alone does not establish that a provider can resume its generation.

Treat streamed text as untrusted output. [MDN's cross-site scripting guide](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/XSS) warns that inserting untrusted strings as HTML can execute attacker-controlled code. Render the output as text or sanitize any HTML before insertion. If you render Markdown progressively, account for unfinished code fences, links, and formatting delimiters. The UI should also preserve a visibly partial state until the terminal event confirms success.

## Check every hop for buffering

A provider can emit events promptly while the user still receives one large block at the end. Your application server, compression middleware, reverse proxy, security inspection, or content delivery network (CDN) may buffer the response. Confirm that your server flushes incrementally and that intermediaries preserve the stream.

[Cloudflare says](https://developers.cloudflare.com/rules/configuration-rules/response-body-inspection/) response inspection can hold part of a response, making data arrive later or in larger groups than the origin sent. Its documented features mainly inspect HTML and plain-text streams; an explicit inspection rule can also select other responses. Cloudflare's troubleshooting steps start by checking incremental delivery at the origin, then response headers and applicable features. If inspection is responsible, a path-specific rule setting Response Body Buffering to None streams the body without inspection. Cloudflare warns that the setting can prevent security, optimization, and analytics features from working on matching responses, so apply it narrowly. Send the correct `Content-Type: text/event-stream` for SSE, and test through the deployed proxy path rather than only against localhost.

Measure the delay to the first visible event and the gaps between later events at both the origin and browser. A stream that works in a local development server is not proof that the production route streams. Include an integration check through the same proxy and CDN configuration users will traverse.

## A practical default

Start with a POST request and an SSE response for ordinary chat. Normalize provider events on the server, forward only the application events the client needs, and cancel upstream work when the user disconnects or presses Stop. Track terminal completion explicitly; validate complete tool arguments before execution; label interrupted output as partial. Add WebSockets when the product truly needs sustained messages in both directions. Finally, verify event timing through the actual proxy and CDN path. That design keeps the common case simple while making failures visible instead of presenting a truncated answer as finished.
