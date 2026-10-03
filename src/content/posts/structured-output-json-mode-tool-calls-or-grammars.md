---
title: "Structured output: JSON mode, tool calls or grammars"
description: "Three ways to get machine-readable output from a model. What JSON mode, strict tool calls and grammar-constrained decoding each guarantee, what they leave open, and how to validate."
pubDate: "2026-10-03T21:30:00Z"
specimen: 192
section: dev
tags:
  - structured-output
  - json-schema
  - tool-use
  - llama-cpp
  - validation
draft: false
heroImage: https://media.aitamer.news/heroes/structured-output-json-mode-tool-calls-or-grammars-a9190abd.jpg
heroAlt: "A paper-cut collage of three distinct paper channels guiding blank slips into a single open drawer, in a calm palette of blue, coral, cream, sand, sage, and slate."
author: quill
wildness:
  rating: 3
  verified: "Guarantees and limits as written in each provider's docs and the llama.cpp README"
  claimed: "That the guarantees hold is the vendors' word; no independent test was run"
verdict: "Constrained output fixes syntax and shape. It cannot fix wrong content, so keep a validator and a plan for refusals and cut-off replies."
sources:
  - title: "OpenAI: Structured Outputs guide"
    url: https://developers.openai.com/api/docs/guides/structured-outputs
  - title: "OpenAI: Function calling guide"
    url: https://developers.openai.com/api/docs/guides/function-calling
  - title: "Anthropic: Structured outputs"
    url: https://platform.claude.com/docs/en/docs/build-with-claude/structured-outputs
  - title: "llama.cpp: GBNF grammars"
    url: https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md
  - title: "JSON Schema: object type reference"
    url: https://json-schema.org/understanding-json-schema/reference/object
---

A program that calls a model usually wants data, not prose. There are three common ways to get it: JSON mode, tool or function calls, and grammar-constrained decoding. They sound alike and they promise different things. This post covers what each one guarantees, what it leaves to you, and where each one breaks. Limits quoted here are as of October 2026, so check the linked docs before you rely on a number.

## What "valid" can mean

Three levels of correctness get mixed up in this topic.

1. **Syntax.** The text parses as JSON.
2. **Shape.** The JSON matches your schema: the right keys, the right types, only allowed enum values.
3. **Content.** The values are true and make sense.

No structured output feature reaches level 3. A model can return a perfectly shaped object with a wrong invoice total. The three techniques below differ in whether they reach level 1 or level 2.

## JSON mode: syntax only

OpenAI's guide puts the difference plainly. JSON mode outputs valid JSON but does not adhere to a schema. In the guide's words, ["Structured Outputs is the evolution of JSON mode. While both ensure valid JSON is produced, only Structured Outputs ensure schema adherence."](https://developers.openai.com/api/docs/guides/structured-outputs)

So JSON mode gets you past `JSON.parse` errors. It does not stop the model from naming a key `total_price` when you asked for `price`, or from leaving a field out. You still need to check the shape yourself.

## Schema-constrained output and strict tool calls: syntax and shape

Both OpenAI and Anthropic now offer a mode where you pass a JSON Schema and, by their own account, the reply matches it. Each exposes it in two places.

**As the response format.** You ask for the reply itself in a given shape. Anthropic calls this [JSON outputs, set through `output_config.format`](https://platform.claude.com/docs/en/docs/build-with-claude/structured-outputs). OpenAI uses a structured `text.format`.

**As tool arguments.** You define a function, the model decides to call it, and the arguments follow your schema. Anthropic's switch is `strict: true`. OpenAI's is also [`"strict": true`](https://developers.openai.com/api/docs/guides/function-calling), which makes calls "reliably adhere to the function schema, instead of being best effort."

OpenAI gives a rule of thumb for choosing between them. If you are connecting the model to tools, functions or data in your system, use function calling. If you want to structure the model's reply to the user, use the structured response format.

A tool call does not run anything. In OpenAI's description, the developer executes the function, and the model only produces the call and its arguments. Validate those arguments before you act on them, because they are still model output.

Anthropic describes its guarantee as coming from constrained decoding: valid output, guaranteed field types and required fields, and no retries for schema violations. The vendor also says it uses ["constrained sampling with compiled grammar artifacts."](https://platform.claude.com/docs/en/docs/build-with-claude/structured-outputs) Both vendors say the first request with a new schema is slower. Anthropic adds that compiled grammars are cached for 24 hours from last use.

### The schema subset is smaller than JSON Schema

Both vendors support only part of JSON Schema. That is the first place these modes break for real projects.

- **OpenAI strict function calling** requires `additionalProperties` to be `false` on every object, and every field in `properties` to be listed in `required`. An optional field is expressed by adding `"null"` as an allowed type.
- **Anthropic** lists as unsupported: recursive schemas, external `$ref`, numeric constraints such as `minimum` and `maximum`, string constraints such as `minLength` and `maxLength`, array `minItems` above 1, and any `additionalProperties` value other than `false`. It also caps complexity: at most 20 strict tools per request and 24 optional parameters across all schemas.

This changes how you write schemas. In plain JSON Schema, [by default any additional properties are allowed](https://json-schema.org/understanding-json-schema/reference/object), and the properties you declare are not required by default. The vendor modes flip both defaults. A schema that validates fine in your test suite can be rejected, or reshaped, when you send it to a provider.

Because range limits like `maxLength` are not enforced during generation on Anthropic's side, enforce them after the reply arrives.

### Replies the guarantee does not cover

Anthropic's docs name three cases where output may not match the schema:

1. **Refusals.** When the stop reason is `refusal`, the refusal message takes precedence over the schema.
2. **Cut-off replies.** If the stop reason is `max_tokens`, the JSON can be incomplete.
3. **Enum casing.** The model may return an enum or `const` value that differs from the schema only in capitalization.

OpenAI documents the same first two in its own terms. A refusal arrives in a dedicated `refusal` field. A reply that hit a token limit comes back with status `incomplete` and `incomplete_details.reason` set to `max_output_tokens`.

So the code that reads a structured reply should look at the stop reason or status first, and parse second. Treat a missing or truncated object as an expected result and decide what to do: retry with a larger limit, return an error, or fall back.

OpenAI also notes one case where strict mode switches off. When a fine-tuned model calls several functions in one turn, strict mode is disabled for those calls. Single calls keep it.

## Grammar-constrained decoding: you control the grammar

The third approach works at the sampler. llama.cpp lets you supply a grammar in GBNF, a format that [extends Backus-Naur Form](https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md) with regex-like features. During generation, only tokens that keep the output inside the grammar are allowed. You pass it with `--grammar` or `--grammar-file`.

You can also give llama.cpp a JSON Schema and it converts it to a grammar. The README says it supports a subset of JSON Schema, and it lists features that do not convert, including `uniqueItems`, `contains`, `patternProperties` and conditionals. It also says the schema only constrains the output and is not injected into the prompt, except for tool calling. That matters: the model does not see your field descriptions unless you put them in the prompt yourself.

Here `additionalProperties` defaults to `false`. The README says this produces faster grammars and reduces hallucinations, and that setting it to `true` may produce keys containing unescaped newlines. It also warns that grammars have performance gotchas, and advises writing `x{0,N}` in place of repeated `x? x? x?`.

The benefit over a hosted API is control. You are not limited to JSON. A grammar can force a date format, a fixed label set, or a small domain language. The cost is that you own the schema-to-grammar details, and a constraint that is too tight can push the model into producing something valid and wrong.

## How to validate

Constrained decoding reduces what you must check. It does not remove it.

- **Always check the stop reason first.** Refusals and truncation are the cases the guarantee excludes.
- **Validate with a real JSON Schema validator** against your own full schema, including the constraints the provider ignored.
- **Check meaning with ordinary code.** Totals add up, IDs exist, dates are in range.
- **Keep a failure path.** One retry with the error message appended is a common choice. Cap it.
- **Pin the schema in tests.** A vendor-side schema change or a new model should fail a test, not a customer.

## Which one to pick

| Situation | Reasonable choice |
|---|---|
| Hosted model, you need a shape | Schema-constrained response format |
| Model must pick and call your functions | Strict tool calls, then validate arguments |
| Model has only JSON mode | JSON mode plus a validator and retry |
| Local model, custom or non-JSON format | A grammar |

JSON mode alone is the weakest of these options. If the provider offers schema enforcement for your model, use that and keep the validator anyway.
