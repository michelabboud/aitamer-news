---
title: Why an agent loop needs a step budget
description: An agent loop can end when the model finishes or when a limit fires. Three libraries document turn and step limits, and each counts something different.
pubDate: "2026-10-04T17:00:00Z"
specimen: 228
section: dev
tags:
  - agents
  - limits
  - claude-agent-sdk
  - openai-agents-sdk
  - langgraph
draft: false
heroImage: https://media.aitamer.news/heroes/why-an-agent-loop-needs-a-step-budget-d6d8a2c8.jpg
heroAlt: A paper robot follows a circular path of conversation and tool signs toward a stopping barrier.
author: quill
wildness:
  rating: 1
  verified: Limit options, defaults and error names, read on the vendors' own docs pages
  claimed: That an explicit step cap is a sensible default for every agent loop
verdict: Every loop that lets the model decide when to stop needs an outside limit. Set a step cap and a spend cap, learn what each counts, and handle the stop in code.
sources:
  - title: How the agent loop works (Claude Agent SDK)
    url: https://code.claude.com/docs/en/agent-sdk/agent-loop
  - title: Running agents (OpenAI Agents SDK)
    url: https://openai.github.io/openai-agents-python/running_agents/
  - title: Graph API, recursion limit (LangGraph)
    url: https://docs.langchain.com/oss/python/langgraph/graph-api
  - title: GRAPH_RECURSION_LIMIT (LangGraph)
    url: https://docs.langchain.com/oss/python/langgraph/errors/GRAPH_RECURSION_LIMIT
  - title: OpenAI Agents SDK runner source (default turn limit)
    url: https://github.com/openai/openai-agents-python/blob/main/src/agents/run.py
---

An agent loop is a cycle. A model reads the current state, asks for a tool call, receives the result, and reads again. A step budget is a hard cap on how many of those cycles one run may take. This post uses the documentation of three widely used libraries to show why that cap belongs in every agent you run.

## How an agent loop ends

The [Claude Agent SDK loop documentation](https://code.claude.com/docs/en/agent-sdk/agent-loop) describes the cycle in five steps. Claude receives the prompt, evaluates the state, the SDK executes the requested tools, and the results feed back for the next decision. The page says the cycle repeats "until it produces a response with no tool calls."

The [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/running_agents/) describes the same shape. The runner calls the model. If the output is a final answer, the loop ends. If the model asks for a handoff or a tool call, the runner acts on it and calls the model again.

The Claude SDK can run until the model finishes unless you configure a limit. The OpenAI runner has a default turn limit (`DEFAULT_MAX_TURNS`), though the running agents guide does not give its numeric value. The Claude page says: "Without limits, the loop runs until Claude finishes on its own, which is fine for well-scoped tasks but can run long on open-ended prompts."

Extra turns can carry more context. The same page says the context window "does not reset between turns within a session" and that conversation history "grows with each turn." Prompt caching can change the price of that context, so turn count alone does not determine cost.

## Three libraries, three units

Each library offers a limit, and each counts something different.

- **Claude Agent SDK.** `max_turns` (`maxTurns` in TypeScript) counts tool-use turns only. The docs give the default as no limit. A second option, `max_budget_usd`, caps spend and also defaults to no limit.
- **OpenAI Agents SDK.** `max_turns` is passed to the runner. The `Runner.run` reference defines a turn as "one AI invocation (including any tool calls that might occur)." Passing `max_turns=None` disables the limit. The page does not state a default value.
- **LangGraph.** The [graph API page](https://docs.langchain.com/oss/python/langgraph/graph-api) documents a recursion limit counted in super-steps, where a super-step is "a single iteration over the graph nodes." It states that starting in version 1.0.6 the default is 1000 steps.

A number that suits one library does not carry over to another. Ten Claude tool-use turns, ten LLM calls and ten super-steps describe different amounts of work. Read the unit before you pick a value.

## What happens when the cap fires

A cap is only useful if your code handles the stop.

The Claude SDK returns a `ResultMessage` whose subtype is `error_max_turns` or `error_max_budget_usd`. The `result` field is absent on those subtypes. Every result subtype has `total_cost_usd`, `usage`, `num_turns` and `session_id` fields. In Python, cost and usage are optional, and after a crash the cost fields may be zeroed. Check them before recording cost or deciding whether to resume. The docs also note that a single-shot `query()` call yields the final result message and then raises an error such as `Reached maximum number of turns`. Wrap the loop in a try block if the program needs to continue.

The OpenAI SDK raises `MaxTurnsExceeded`. LangGraph raises `GraphRecursionError`, and its [error page](https://docs.langchain.com/oss/python/langgraph/errors/GRAPH_RECURSION_LIMIT) says that "complex graphs may hit the default limit naturally."

That last point matters. A limit set too low can interrupt legitimate work. A limit set too high may allow costly or lengthy runs before it fires. Choose a value above the length of a normal successful run and below the point where you would want a person to look.

## Pair the step cap with a spend cap

A step cap bounds the count of turns. It does not bound the price of each turn, because that depends on how much context has built up and which tools return large outputs. The Claude SDK offers both caps for this reason. The docs call setting a budget "a good default for production agents."

Two details from the docs are worth knowing:

- The budget cap covers subagents. Their spend counts toward the total, and once spend reaches the cap, spawning another subagent fails with `Budget limit reached`. The docs say these cap-enforcement behaviors require Claude Code v2.1.217 or later.
- With streaming input, a message still queued when a turn ends at the max-turns limit starts a new turn, and the max-turns count starts over for that turn, while the budget total keeps accumulating across messages. A turn cap alone therefore does not bound a long conversation.

## What to do

1. Set a turn or step limit explicitly on every agent loop. Do not rely on a default, and check whether the library has one. The Claude SDK has none, and the OpenAI page does not state one.
2. Look up what the limit counts in your library: tool-use turns, LLM calls or super-steps.
3. Pick a starting value from the length of runs that finish normally, then leave headroom. The Claude docs use `max_turns=30` as an example for a bug-fixing task, which is an illustration and not a recommendation.
4. Add a spend cap where the library has one, and confirm that it includes subagents.
5. Handle the stop in code. Check the result subtype or catch the exception, log the turn count and cost, and keep the session identifier so the run can be resumed or reviewed.
6. Treat a cap hit as a signal. If healthy runs start hitting the limit, investigate the task or the tools before raising the number.
