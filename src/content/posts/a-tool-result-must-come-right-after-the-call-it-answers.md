---
title: A tool result must come right after the call it answers
description: Claude rejects requests whose history leaves a tool_use without its tool_result in the next user turn. Here is the shape the API expects and a loop that keeps it.
pubDate: "2026-10-11T02:30:00Z"
section: dev
tags:
  - claude-api
  - tool-use
  - agents
  - message-history
  - errors
draft: false
heroImage: https://media.aitamer.news/heroes/a-tool-result-must-come-right-after-the-call-it-answers-0655748f.jpg
heroAlt: A slate blue paper telephone receiver connects by a continuous paper cord to its matching cradle against a warm cream background.
author: quill
wildness:
  rating: 1
  verified: Ordering rules, 400 example and error text are quoted from Anthropic's tool use docs.
  claimed: Nothing beyond the docs; the Python loop is an illustration built on the documented shape.
verdict: Solid and narrow. Append every tool_result, errors included, as the first blocks of the very next user turn and most rejected-history bugs disappear.
sources:
  - title: Handle tool calls (Claude API docs)
    url: https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls
  - title: Parallel tool use (Claude API docs)
    url: https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use
  - title: Tool Runner (Claude API docs)
    url: https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner
---

When Claude calls one of your tools, the API expects your next message to carry the answer. If anything else sits in between, or the answer is in the wrong place inside the message, the request is rejected before the model reads it. This post shows the shape the [Claude tool use documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls) requires, and a small loop that keeps it.

## The error you will see

The [Handle tool calls page](https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls) names the message to look for: "tool_use ids were found without tool_result blocks immediately after". The same page says that putting text before a `tool_result` in the user message causes a 400 error.

Both come from one rule. An assistant turn that ends with `stop_reason: "tool_use"` is waiting for answers, and the very next user turn has to supply them.

## The three formatting rules

The documentation lists them under "Important formatting requirements":

1. Tool result blocks must immediately follow their corresponding tool use blocks. No message may sit between the assistant's tool use message and the user's tool result message.
2. In the user message that carries the results, the `tool_result` blocks come first in the content array. Any text goes after all of them.
3. If the same assistant turn also called a server tool that has no result block yet, the user message must contain only `tool_result` blocks.

Each `tool_result` points back to its call through `tool_use_id`. That value must equal the `id` of the `tool_use` block it answers.

## A rejected turn and a correct one

The docs give this turn as an example that causes a 400 error, because the text comes first:

```json
{
  "role": "user",
  "content": [
    {"type": "text", "text": "Here are the results:"},
    {"type": "tool_result", "tool_use_id": "toolu_01", "content": "15 degrees"}
  ]
}
```

The fix is to swap the order:

```json
{
  "role": "user",
  "content": [
    {"type": "tool_result", "tool_use_id": "toolu_01", "content": "15 degrees"},
    {"type": "text", "text": "What should I do next?"}
  ]
}
```

The other common breakage is structural. A reminder from your app, a queued user message or a debug note gets appended to the history between the assistant turn and the results. That breaks the first rule even when every block is well formed.

## One loop that keeps the shape

Build the result turn in one place, right after the response arrives, and append it before anything else touches the history. In this sketch, `run_tool` is your dispatcher and returns a string.

```python
response = client.messages.create(
    model=MODEL, max_tokens=1024, tools=tools, messages=messages
)
messages.append({"role": "assistant", "content": response.content})

if response.stop_reason == "tool_use":
    results = []
    for block in response.content:
        if block.type != "tool_use":
            continue
        try:
            results.append({"type": "tool_result",
                            "tool_use_id": block.id,
                            "content": run_tool(block.name, block.input)})
        except Exception as exc:
            results.append({"type": "tool_result",
                            "tool_use_id": block.id,
                            "content": f"{type(exc).__name__}: {exc}",
                            "is_error": True})
    messages.append({"role": "user", "content": results})
```

Three details carry the weight. Appending the full `response.content` keeps the `tool_use` blocks and their ids in the history. Every `tool_use` block gets a result, including the ones that failed. Any extra text for the model goes into `results` after the loop, never before it.

## Several calls in one turn

Claude may call more than one tool in a single response. The [parallel tool use page](https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use) says to return one `tool_result` for each `tool_use` block, all together in the next user message, with every `tool_result` before any text. The page also says the API does not prescribe an execution order, so you can run the calls concurrently or one after another.

If you choose not to run one of the calls, for example because an earlier call in the batch failed, the page says to still return a result for it with `is_error: true` and a short explanation:

```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_02",
  "is_error": true,
  "content": "Not executed: the preceding write_file call failed."
}
```

The same page lists a separate user message for each result as the wrong format. The effect it names is that this "teaches" Claude to avoid parallel calls. The page does not say that form returns an error, so it is a different failure from the 400 above, and still worth avoiding.

## Errors go inside the result

When a tool fails, the Handle tool calls page shows the error text in `content` with `"is_error": true`. Claude then works the error into its reply. The page recommends instructive messages, such as "Rate limit exceeded. Retry after 60 seconds.", in place of a bare "failed". A history that drops the result because the tool crashed is a common way to end up with an orphaned `tool_use` id.

## Where this advice stops

- **Server tools.** Claude runs these itself, and the docs say you do not need to handle `is_error` results for them. When one response mixes a client `tool_use` with a `server_tool_use` that has no result yet, reply with only the client `tool_result` blocks and keep the same `tools` array.
- **Computer use and browser use.** A result for a member of these toolsets must also echo the `toolset_name` from the `tool_use` block, or it is rejected. Its content is limited to `text` and `image` blocks, and a browser use result may add one `browser_state` block.
- **Tool Runner.** The SDK's [Tool Runner](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner) manages this loop and the result formatting for you. The manual pattern is for cases where you need direct control over execution.
- **Histories from other APIs.** The docs note that the Claude API has no separate `tool` or `function` role. Results travel inside `user` messages, so a history built for an API with a tool role needs converting first.

The pages linked here do not publish a full list of error strings for malformed histories. Match on the 400 status, read the message, and check the three rules above.
