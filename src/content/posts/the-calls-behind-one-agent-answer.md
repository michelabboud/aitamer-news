---
title: The Calls Behind One Agent Answer
description: A trace can show which model calls and tool runs produced an agent response, where the time went, and how many tokens each call used.
pubDate: "2026-10-05T17:30:00Z"
specimen: 276
section: devops
tags:
  - opentelemetry
  - observability
  - tracing
  - genai
draft: false
heroImage: https://media.aitamer.news/heroes/the-calls-behind-one-agent-answer-8f0e0dfa.jpg
heroAlt: Paper inputs connect by threads to tokens, a clock, coins and a finished answer envelope.
author: ari
wildness:
  rating: 2
  verified: GenAI traces can expose agent, inference, and tool spans with per-call token attributes.
  claimed: A response-level ledger helps explain call count and latency when the trace is complete.
verdict: Count the recorded inference and tool spans under one response, sum per-call token totals without adding their breakdowns again, and label gaps in the trace.
sources:
  - title: "Inside the LLM Call: GenAI Observability with OpenTelemetry"
    url: https://opentelemetry.io/blog/2026/genai-observability/
  - title: Semantic conventions for generative client AI spans
    url: https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-spans.md
  - title: Semantic Conventions for GenAI agent and framework spans
    url: https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-agent-spans.md
  - title: OpenTelemetry Tracing API
    url: https://opentelemetry.io/docs/specs/otel/trace/api/
  - title: OpenTelemetry Sampling
    url: https://opentelemetry.io/docs/languages/js/sampling/
---

An agent can return one answer after several model calls and tool runs. The final text hides that sequence. If the answer is slow or costly, the useful unit of investigation is the work that produced it.

OpenTelemetry’s [GenAI observability walkthrough](https://opentelemetry.io/blog/2026/genai-observability/) shows an `invoke_agent` span with child `chat` spans for model calls and `execute_tool` spans for tool invocations. Open the trace for one response and those spans become a record of its path.

## Put a boundary around the answer

Start with the span that covers the response you want to explain. In the walkthrough, that is the top-level `invoke_agent` span. Follow its children and their children, rather than gathering every model call from the surrounding conversation. A conversation identifier can help find related activity, but a trace’s parent and child relationships show which operations belong to the selected response. [OpenTelemetry’s tracing specification](https://opentelemetry.io/docs/specs/otel/trace/api/) defines a span as one operation with start and end times, and describes how spans form a trace tree.

Keep the root span’s duration beside the list of child spans. It gives you the elapsed time for the observed operation. It also provides a boundary for checking whether the trace includes the final work that delivered the answer. If a child operation sits outside that boundary, inspect the instrumentation before drawing a conclusion from the timeline.

## Count model calls and tool runs

Within that boundary, count inference spans such as `chat` as model calls. Read `gen_ai.request.model` on each one; the model can differ across calls. Count `execute_tool` spans separately and read `gen_ai.tool.name` to see what ran. An `invoke_agent` span describes an agent invocation, so including it in the model-call count would inflate the answer. The [GenAI span conventions](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-spans.md) describe inference and tool execution as distinct operations, while the [agent span conventions](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-agent-spans.md) define `invoke_agent`.

Read the sequence as well as the totals. A model call may request a tool, followed by tool execution and another model call that uses the result. `gen_ai.response.finish_reasons` can show that a model stopped to request tool calls. The corresponding `execute_tool` span is the evidence that the tool ran. Its name and timing can explain a delay that the final answer never mentions. [OpenTelemetry’s walkthrough](https://opentelemetry.io/blog/2026/genai-observability/) shows both the finish reason and the tool span in its trace view.

Be precise about what a call count means. The [GenAI span conventions](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-spans.md) say that one inference span may cover a logical operation including automatic retries. A count of inference spans therefore counts observed logical calls. It cannot establish the number of underlying network attempts unless those attempts have their own instrumentation.

## Sum token use once

For each inference span, record `gen_ai.usage.input_tokens` and `gen_ai.usage.output_tokens`. Sum each field across the model calls in the selected response. Keep the per-call values next to the totals. A single growing prompt or an extra model call can then be identified without guessing from the final answer’s length. The [walkthrough](https://opentelemetry.io/blog/2026/genai-observability/) shows these token attributes on individual calls.

Treat detailed token fields as breakdowns. Under the [current GenAI span conventions](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-spans.md), cache-read input tokens should already be included in total input tokens, and reasoning output tokens should already be included in total output tokens. Adding those breakdowns to the totals counts them twice. Check which fields your instrumentation actually emits, since the conventions recommend a best effort when constructing totals from provider data.

A token total is useful for comparing responses and finding unexpectedly large calls. Turning it into a charge requires the pricing rules for the provider, model, and token categories involved. Keep that calculation separate from the trace’s token ledger.

## Follow the clock

Sort the child spans by start time. Compare each model call and tool run with the root span’s full duration. A long tool span points you toward that operation. Repeated model spans can reveal another round of generation. Gaps between children may point to application work that needs its own span. These are leads for investigation, not proof of a cause. The [tracing specification](https://opentelemetry.io/docs/specs/otel/trace/api/) says child spans measure their own operations within the larger trace.

Avoid adding every child duration and calling the sum response time. Child spans can overlap or sit inside other spans. Use the root span for elapsed time, then use the timeline to locate work on the path to completion. The [GenAI conventions](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-spans.md) also say a logical inference span should cover its operation through the received response, error, or cancellation.

## Treat gaps as gaps

A trace can only show recorded work. A missing tool span may mean the tool did not run, or that its execution was never instrumented. The [GenAI conventions](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-spans.md) encourage manual instrumentation for application tool calls that automatic instrumentation does not cover. Sampling can also limit which traces reach a backend; [OpenTelemetry’s sampling guide](https://opentelemetry.io/docs/languages/js/sampling/) describes selecting only a portion of traces.

Prompt and tool content needs a separate decision. The [walkthrough](https://opentelemetry.io/blog/2026/genai-observability/) says its default telemetry contains metadata such as model names, token counts, and durations without prompt content or tool arguments. The [conventions](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-spans.md) warn that captured messages and tool arguments can contain sensitive information. Counts and timing can answer many operational questions without recording that content.

## What to do

Choose one response whose behavior you need to explain. Open its trace and confirm the root span covers that response. Count the inference spans and tool execution spans beneath it. Record the model, tool name, duration, input tokens, and output tokens for each relevant span. Add token totals from the inference spans once, then inspect the timeline for repeated calls, long operations, and unaccounted gaps.

Write down any limits beside the result: missing attributes, uninstrumented tools, sampling, or retries hidden inside a logical call. That leaves you with an answer you can defend: how many recorded calls produced the response, what they used, and which parts still need measurement.
