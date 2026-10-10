---
title: Force or forbid a tool call with tool_choice
description: How to set tool_choice to auto, any, a named tool or none in the Claude and OpenAI APIs, and the costs of forcing a call.
pubDate: "2026-10-11T01:00:00Z"
section: dev
tags:
  - tool-use
  - claude-api
  - openai-api
  - function-calling
  - agents
draft: false
heroImage: https://media.aitamer.news/heroes/force-or-forbid-a-tool-call-with-tool-choice-675fefa0.jpg
heroAlt: A paper selector lever directs a wrench through an open gate while a paper barrier blocks a hammer.
author: quill
wildness:
  rating: 1
  verified: Options, defaults and forcing limits quoted from the Claude and OpenAI docs
  claimed: Claude docs say forced-call prefill should not reduce performance; no numbers given
verdict: Leave tool_choice on auto by default. Force a tool only for one known step, and check first that your Claude model accepts forced tool use.
sources:
  - title: Define tools (Claude API docs)
    url: https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools
  - title: Function calling (OpenAI API docs)
    url: https://developers.openai.com/api/docs/guides/function-calling
---

When you give a model a list of tools, it decides by itself whether to call one. That is usually right. Sometimes it is wrong for your code: an extraction step that must always return structured data, or a last turn where you want a plain answer and no more calls. The `tool_choice` parameter is the switch for both cases. The Claude API and the OpenAI API both have it, with different spellings.

## The four settings in the Claude API

The Claude [Define tools documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools) lists four options:

- `auto` lets Claude decide whether to call any of the tools. It is the default when you pass `tools`.
- `any` says Claude must use one of the provided tools, without forcing a particular one.
- `tool` forces Claude to use one named tool.
- `none` prevents Claude from using any tools. It is the default when you pass no tools.

Forcing a named tool is one extra field on a normal request:

```python
response = client.messages.create(
    model=MODEL,
    max_tokens=1024,
    tools=[weather_tool],
    tool_choice={"type": "tool", "name": "get_weather"},
    messages=[{"role": "user", "content": "What's the weather like in San Francisco?"}],
)
```

The other shapes are `{"type": "auto"}`, `{"type": "any"}` and `{"type": "none"}`.

## The same controls in the OpenAI API

The OpenAI [function calling guide](https://developers.openai.com/api/docs/guides/function-calling) uses plain strings for most cases. `"auto"` is the default and lets the model call zero, one or several functions. `"required"` means one or more calls. `{"type": "function", "name": "get_weather"}` means exactly one specific function. `"none"` imitates passing no functions at all.

It adds a fifth form, `allowed_tools`, which limits the model to a subset of the tools you sent:

```json
{
  "tool_choice": {
    "type": "allowed_tools",
    "mode": "auto",
    "tools": [
      {"type": "function", "name": "get_weather"},
      {"type": "function", "name": "search_docs"}
    ]
  }
}
```

The guide gives the reason: you keep the full tool list identical across requests, which helps prompt caching, and still narrow what the model may call on a given turn.

## When forcing a tool helps

Force a tool when your code cannot proceed without that call. Two common cases:

- **Structured extraction.** You defined a tool whose input schema is the record you want. A prose reply is useless to the next step, so you force the tool.
- **A step your code already decided.** A router picked the action. The model only needs to fill in the arguments.

The Claude docs add a tip for models that support forcing: combine `tool_choice: {"type": "any"}` with strict tool use (`strict: true` on the tool definitions). That guarantees one of your tools is called and that its inputs follow your schema.

## Where forcing hurts

**You lose the explanation.** The Claude docs state that with `any` or `tool`, the API prefills the assistant message to force a tool call, so the model will not write any text before the `tool_use` block, even if asked. The docs say testing has shown this should not reduce performance. If you want text and a tool call, use `auto` and ask in the user message, for example: "What's the weather like in London? Use the get_weather tool in your response."

**You lose thinking.** Per the same page, a forced call skips thinking on every model that accepts forced tool use. The response starts with the `tool_use` block and has no `thinking` block. With manual extended thinking (`thinking: {type: "enabled"}`), `any` and `tool` are not supported and return an error.

**Some models reject it outright.** The Claude docs list Claude Opus 5.5, Claude Sonnet 5.5, Claude Fable 5.1 and Claude Mythos 5.1 as models where `any` and `tool` return a 400 error. On those models the docs recommend `auto` with strict tool use for schema-valid inputs, or structured outputs when you need a fixed JSON response. `auto` and `none` still work, and the docs note that prompting still influences which tool `auto` picks. Check this table before you hard-code a forced call into a pipeline that may later switch models.

**Your agent loop cannot end.** This follows from the definitions. If every request in a loop forces a tool, every response is a tool call, and the model never gets a turn to answer in text. Force on the turn that needs it, then go back to `auto`.

**You may pay for cache misses.** The Claude docs note that changing `tool_choice` invalidates cached message blocks when you use prompt caching. Tool definitions and the system prompt stay cached, but message content is reprocessed. Flipping the setting on every turn of a long conversation has a cost.

## When to use none

Use `none` when you want a text answer and still need the tools in the request, for example a closing summary turn in an agent that has already gathered its data. Keeping the tool list unchanged keeps the request shape stable across turns.

## A short decision list

1. Start with `auto`, the default.
2. Use `tool` (Claude) or a named function (OpenAI) when your code needs one specific call and the model accepts forcing.
3. Use `any` (Claude) or `"required"` (OpenAI) when the model must act but should pick the tool.
4. Use `none` for a text-only turn.
5. On Claude models that reject forcing, use `auto` with strict tools or structured outputs instead.

## What the sources do not say

Neither page gives numbers on how often `auto` chooses a tool, or how much forcing changes answer quality. The Claude page says only that testing showed the prefill "should not reduce performance". The OpenAI guide does not say whether forcing a function affects the model's reasoning. If quality matters for your task, test both settings on your own prompts.
