---
title: Two Tool Calls, One Turn
description: A model can request several functions in one turn. The application must decide how to schedule them, match their results, and handle partial failure.
pubDate: "2026-10-07T08:00:00Z"
specimen: 351
section: models
tags:
  - function-calling
  - concurrency
  - api-design
  - reliability
draft: false
heroImage: https://media.aitamer.news/heroes/two-tool-calls-one-turn-6f0bed83.jpg
heroAlt: An AI agent activates two separate tool switches that feed a single result.
author: ari
wildness:
  rating: 2
  verified: OpenAI documents multiple calls per turn, call IDs, and a setting that limits calls to zero or one.
  claimed: Scheduling and failure policies are application decisions inferred from the documented interface.
verdict: Treat multiple calls as distinct requests. Run independent work together, preserve call IDs, and give dependent or state-changing work an explicit order and failure policy.
sources:
  - title: Function calling | OpenAI API
    url: https://developers.openai.com/api/docs/guides/function-calling
---

A request asks for a product’s price and stock level. The model returns two function calls in one turn: `get_price` and `get_stock`. Both requests look ready to run. Should the application start them together, run them in order, or wait for another model response between them?

[OpenAI’s function-calling guide](https://developers.openai.com/api/docs/guides/function-calling) says a model may return multiple calls in a single turn. It describes a loop in which the application executes functions, returns their outputs, and receives either an answer or more calls. That interface gives developers room to make an important decision: a batch of calls does not, by itself, define the application’s execution schedule.

## A call list is a request for work

The model supplies a function name and encoded arguments for each call. In the Responses API example, each call also has a `call_id`. The application sends each result back with the matching ID. The [guide’s example](https://developers.openai.com/api/docs/guides/function-calling) includes several calls in one output array and handles each one before continuing the conversation.

The array tells the application what the model requested. It does not tell the application that every request is safe to run at the same time. Nor does an earlier position in the array establish that its function must finish first. Those are decisions for the application, based on what the functions read or change.

For price and stock lookups, concurrent execution may be reasonable if each reads independent data. If the second operation needs a value produced by the first, it needs a later step. A function call cannot use a result the model has yet to receive. The guide’s loop allows another model response after outputs are returned, so a dependent call can happen in a subsequent turn.

## Dependency changes the schedule

Consider a different pair: `create_order` and `charge_order`. Charging requires an order identifier returned by creation. Starting both together would require guessing that identifier or hiding the dependency inside a function. Running the calls one after another still leaves a problem if the second call’s arguments were chosen before the first result existed.

A safer design is to expose the dependency plainly. Let the first operation finish, return its result, and then allow the next call. OpenAI’s [function design guidance](https://developers.openai.com/api/docs/guides/function-calling) also recommends combining functions that are always called in sequence. An application can therefore make one function responsible for a fixed, inseparable sequence, while keeping genuinely separate operations available as separate functions.

This is a design judgment, not a guarantee supplied by the model. A useful rule is to run calls together only when each can succeed correctly with the information already available and neither depends on the other’s side effects. If that condition is unclear, choose an explicit sequence.

## Results need identities

Concurrent work often finishes in a different order from the order in which it started. Suppose stock returns first and price returns later. The application should keep each output tied to its originating call, rather than pairing results with requests by arrival order. The `call_id` in OpenAI’s [Responses example](https://developers.openai.com/api/docs/guides/function-calling) exists for that matching step.

This also matters when the model calls the same function twice. Two `get_stock` calls for different products have the same function name, but they remain distinct requests. Keep the call ID, arguments, and result together. The function name alone cannot identify which output belongs to which request.

The guide shows the application returning function outputs to the model. It does not prescribe a universal policy for sorting independently completed results. A practical policy is to record completion as it happens while preserving each call’s identity. The model can then receive accurate outputs without the application treating completion order as meaning.

## Failure needs its own rule

Imagine that price succeeds and stock times out. The successful lookup does not make the missing stock value known. The application must decide whether to retry, return a clear failure for that call, or stop the workflow. It should not turn the missing result into a plausible stock count.

Side effects require a stricter decision. If one call creates an order and another sends a confirmation, a failed confirmation does not undo the order. A retry can also repeat an action unless the application has a way to recognize an earlier attempt. These are consequences of the example workflow, rather than behavior promised by the function-calling guide. They belong in the application’s function contracts and failure handling.

The [guide](https://developers.openai.com/api/docs/guides/function-calling) explains how to return outputs and continue the model conversation. It does not specify a rollback, retry, or transaction policy for a batch of functions. Developers need to choose those policies for the systems their functions touch.

## Controls limit the call shape

OpenAI documents `parallel_tool_calls: false` as a way to limit a turn to zero or one tool call. Its `tool_choice` setting can also restrict which functions the model may call or require a particular choice. These controls shape what the model can request. They do not replace checks inside a function that reads private data or changes state. The [documented settings](https://developers.openai.com/api/docs/guides/function-calling) are useful when a workflow needs one visible step at a time.

There is a further distinction in the guide: supported models can make function calls in parallel when built-in tools are available, but built-in tools cannot join a parallel function-call batch. Check the capabilities of the specific tools in a workflow before treating every tool request alike.

## What to do

1. List what each function reads, changes, and needs from earlier work.
2. Run independent lookups together only when their results remain correct under either completion order.
3. Put dependent actions in separate turns, or combine an inseparable sequence inside one well-defined function.
4. Match every output to its call ID. Keep the arguments and outcome with that ID, including when the same function is called twice.
5. Define what happens when one call fails after another succeeds. Make retries safe for actions that change state.
6. Use `parallel_tool_calls: false` when the workflow requires at most one call per turn. Test the application’s behavior with multiple calls even when the usual path returns one.

Two calls in one turn offer an opportunity to save waiting time. The gain is sound only when the application has made ordering, identity, and failure explicit.
