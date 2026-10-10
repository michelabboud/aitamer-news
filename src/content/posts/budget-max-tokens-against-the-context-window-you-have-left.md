---
title: Budget max_tokens against the context window you have left
description: Input and output share one context window. Count the input, give max_tokens what remains, and handle the two stop reasons that mean the answer was cut short.
pubDate: "2026-10-11T05:00:00Z"
section: dev
tags:
  - claude-api
  - context-window
  - max-tokens
  - stop-reason
  - agents
draft: false
heroImage: https://media.aitamer.news/heroes/budget-max-tokens-against-the-context-window-you-have-left-4e32ba73.jpg
heroAlt: A layered paper window shows input sheets filling part of a shared space, with a short answer strip in the remaining room.
author: quill
wildness:
  rating: 1
  verified: Overflow behaviour by model generation, 1M/128k limits and stop reasons read from Anthropic docs
  claimed: Python SDK needs streaming above about 21k max_tokens, per a docs code comment
verdict: On current models an oversized max_tokens fails quietly with a truncated answer. Count, budget the remainder, and check stop_reason on every turn.
sources:
  - title: Context windows (Claude API docs)
    url: https://platform.claude.com/docs/en/build-with-claude/context-windows
  - title: Handling stop reasons (Claude API docs)
    url: https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons
  - title: Token counting (Claude API docs)
    url: https://platform.claude.com/docs/en/build-with-claude/token-counting
---

A long conversation grows with every turn. The output limit you set on turn one fits at first, and then the room left in the context window shrinks under it. Anthropic's [context windows page](https://platform.claude.com/docs/en/build-with-claude/context-windows) is explicit that one window holds both sides of a request: "the system prompt, every message in `messages` (including tool results, images, and documents), and your tool definitions," plus the output Claude generates for the turn, including its extended thinking.

This post shows how to give `max_tokens` the space that is actually left, and how to recognise the response that was cut short when you get it wrong.

## The three outcomes when the sum is too big

The context windows page describes what the API does:

1. **The input alone exceeds the window.** The API returns a 400 `invalid_request_error` ("prompt is too long") on every model.
2. **Input plus `max_tokens` exceeds the window, on Claude 4.5 models and newer.** The API accepts the request. If generation then reaches the window limit, it stops with `stop_reason: "model_context_window_exceeded"`.
3. **The same case on earlier models.** The API returns a validation error. You can opt in to the second behaviour with the `model-context-window-exceeded-2025-08-26` beta header.

On current models, the second case is the one to watch. The request succeeds and the answer simply ends early. The [stop reasons page](https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons) says to treat such a response as truncated. A loop that reads the last text block without checking `stop_reason` will hand a half answer to the user or to the next tool call.

The familiar limit still applies too. When output reaches your own `max_tokens`, the stop reason is `max_tokens`. The stop reasons page warns that if the truncated response ends in an incomplete `tool_use` block, you need to retry the request with a higher `max_tokens` to get the full tool call.

## The numbers that go into the budget

The context windows page gives the limits. Claude Opus 5.5, Sonnet 5.5, Haiku 5.5 and several other current models have a 1M-token window, and a single request to any of them can generate up to 128k output tokens. Other models, including Claude Sonnet 4.5, have a 200k-token window. Keep the window size per model in your code.

Three things make the input larger than the visible chat text:

- **Thinking.** Thinking tokens are a subset of `max_tokens` and are billed as output. With adaptive thinking, Claude decides how much to think, so usage varies from request to request. A budget that suits a plain answer can be spent on thinking.
- **Earlier thinking blocks.** On Claude Opus 4.5 and later Opus models, Sonnet 4.6 and later Sonnet models, Haiku 5.5 and some others, the API keeps previous thinking blocks by default, and they count toward the window like any other input.
- **Cached prefixes.** With prompt caching, the input is split across `input_tokens`, `cache_read_input_tokens` and `cache_creation_input_tokens`, and all three count toward the window. Caching changes what you pay for those tokens, and they still take up space.

## Compute max_tokens each turn

Count the real request with the [token counting API](https://platform.claude.com/docs/en/build-with-claude/token-counting), subtract it from the window, and keep a margin, because the docs call the count an estimate that can differ "by a small amount."

```python
import anthropic

client = anthropic.Anthropic()

MODEL = "claude-sonnet-5-5"
CONTEXT_WINDOW = 1_000_000  # per the context windows page
MAX_OUTPUT = 128_000        # per-request output ceiling for this model
SAFETY_MARGIN = 2_000       # token counts are estimates
MIN_USEFUL_OUTPUT = 4_000   # below this, shrink the history instead

def budget_max_tokens(system, tools, messages):
    count = client.messages.count_tokens(
        model=MODEL, system=system, tools=tools, messages=messages
    )
    remaining = CONTEXT_WINDOW - count.input_tokens - SAFETY_MARGIN
    if remaining < MIN_USEFUL_OUTPUT:
        raise RuntimeError("history too long: compact or trim it first")
    return min(MAX_OUTPUT, remaining)
```

The margin and the minimum are your choices; the docs give no numbers for them. Large budgets need streaming: a comment in the stop reasons example notes that the Python SDK requires streaming for `max_tokens` above about 21k.

```python
budget = budget_max_tokens(system, tools, messages)

with client.messages.stream(
    model=MODEL, max_tokens=budget,
    system=system, tools=tools, messages=messages,
) as stream:
    response = stream.get_final_message()

if response.stop_reason == "max_tokens":
    ...  # raise max_tokens and retry, or continue the response
elif response.stop_reason == "model_context_window_exceeded":
    ...  # the window is full: shrink the history before the next turn
```

The stop reasons page notes that `model_context_window_exceeded` is currently typed only in the SDK's `beta` namespace, so compare the string. The two cases call for different fixes. After `max_tokens`, there may be room to raise the limit. After `model_context_window_exceeded`, the window itself is full, so the only way to get more output is a smaller input.

## Shrink the history before it fills

For long-running conversations and agents, the context windows page names server-side compaction as the primary strategy. It summarizes earlier parts of the conversation on the server so the conversation can continue past the limit, and it is in beta for Claude 4.6 and later models. Context editing offers narrower tools: clearing old tool results and clearing earlier thinking blocks.

The same page warns about context rot: as the token count grows, accuracy and recall degrade. A budget that technically fits can still give worse answers, so trimming early has value beyond avoiding errors.

## Where this advice stops applying

- On models before Claude 4.5, an oversized `max_tokens` is rejected up front, so the budget is a hard requirement there.
- With compaction enabled, the server manages the history for you. The context windows page does not describe how compaction interacts with a `max_tokens` you compute yourself, so test that combination before relying on it.
- A request can carry up to 600 images or PDF pages (100 on 200k-token models), and the docs say you may reach request size limits before the token limit.
