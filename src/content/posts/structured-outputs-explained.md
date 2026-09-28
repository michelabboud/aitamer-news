---
title: "Structured outputs: JSON mode, schemas, and tool calls explained"
description: "A practical guide to JSON mode, schema-constrained output, and tool calling, with the limits that still require validation in your application."
pubDate: "2026-09-30T17:00:00Z"
specimen: 58
section: "dev"
tags: ["structured-outputs", "llm-apis", "json-schema", "tool-calling", "validation"]
draft: false
heroImage: "https://media.aitamer.news/heroes/structured-outputs-explained.jpg"
heroAlt: "A paper-cut collage of loose slate and cream shapes passing through a layered stencil into three orderly cards, with one coral circle among the shapes."
author: "ari"
sources:
  - title: "Structured model outputs | OpenAI API"
    url: "https://developers.openai.com/api/docs/guides/structured-outputs"
  - title: "Introducing Structured Outputs in the API | OpenAI"
    url: "https://openai.com/index/introducing-structured-outputs-in-the-api/"
  - title: "Structured outputs | Claude Platform Docs"
    url: "https://platform.claude.com/docs/en/build-with-claude/structured-outputs"
  - title: "Tool use with Claude | Claude Platform Docs"
    url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview"
  - title: "Structured outputs | Gemini API"
    url: "https://ai.google.dev/gemini-api/docs/structured-output"
  - title: "Function calling with the Gemini API"
    url: "https://ai.google.dev/gemini-api/docs/function-calling"
wildness:
  rating: 5
  verified: "Provider documentation checked; no independent API tests."
  claimed: "Output guarantees and limits come from the providers' own documentation."
verdict: "Choose a schema for data, a tool for an action, and validate every value before it reaches your application."
---

A model can return a response that looks like JSON and still break the code that consumes it. A field may be missing, a value may have the wrong type, or the model may wrap the object in an explanation. Developers now have several ways to constrain output. They solve different problems, and each leaves work for the application.

## JSON mode targets valid syntax

OpenAI's [JSON mode](https://developers.openai.com/api/docs/guides/structured-outputs#json-mode) requests a valid JavaScript Object Notation (JSON) object, though an interrupted response can be incomplete. JSON is a text format built from objects, arrays, strings, numbers, booleans, and null. Syntax alone does not say which keys an object needs or what a value means.

For example, a response like `{"date":"next Thursday"}` can be valid JSON even when the application expects an ISO date and a required `customer_id`. The parser accepts the text; the business logic may not.

OpenAI's [JSON mode documentation](https://developers.openai.com/api/docs/guides/structured-outputs#json-mode) describes it as valid JSON without a guarantee that the result matches a schema. The guide also tells developers to include an instruction to produce JSON and to handle incomplete output. Treat JSON mode as a syntax aid when the shape is flexible or you must use a compatible older model. Parse the result, then validate it yourself.

## Schema-constrained output controls the shape

A schema describes the allowed structure: fields, types, required properties, and sometimes enumerated values. With schema-constrained output, the API is asked to produce a result in that shape. It is useful for extracting records, classifying text into known categories, or returning data for a user interface.

Some providers implement this with constrained decoding. The model generates one token at a time. A decoding layer tracks which tokens can still lead to a schema-valid completion, then removes invalid choices from the next-token selection. [OpenAI describes](https://openai.com/index/introducing-structured-outputs-in-the-api/) compiling a supplied JSON Schema into a grammar and masking tokens that would violate it. [Anthropic documents](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) grammar-constrained sampling for JSON outputs and strict tool inputs. This limits structural mistakes while the response is being generated; it does not establish that the chosen facts are true.

The details matter across APIs. As of September 2026, OpenAI documents Structured Outputs with a supported subset of JSON Schema, alongside JSON mode for syntax-only JSON. In the Responses API, structured output uses `text.format` with `type: "json_schema"`; the Chat Completions API uses `response_format`. See the [OpenAI guide and schema limits](https://developers.openai.com/api/docs/guides/structured-outputs#supported-schemas) before relying on a particular keyword.

Anthropic documents JSON outputs through `output_config.format` with `type: "json_schema"`, and strict tool use through `strict: true` on a tool definition. The [Claude guide](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) says both use a subset of schema features; for example, recursive schemas and numeric bounds are unsupported. It also calls out refusals and output cut off at the token limit as cases where the response may not match the requested schema.

Google's [Gemini structured output guide](https://ai.google.dev/gemini-api/docs/structured-output) describes providing a schema with a JSON response format. Google lists supported schema features and warns that very large or deeply nested schemas may be rejected. Its [function-calling guide](https://ai.google.dev/gemini-api/docs/function-calling) separately describes functions and controls for choosing whether a function call is allowed or required. Provider-specific schema subsets and request fields change, so check the docs for the model and API you actually deploy.

## Tool calling requests an operation

A client-defined function or tool call is a structured request from the model to your application. It can name an operation and supply its arguments, such as `lookup_order` with an order identifier. Your code decides whether to run it, executes it if allowed, and sends the result back to the model. Anthropic's [tool-use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) distinguishes client tools from server tools, which Anthropic executes.

That makes tool calling different from asking for a final data object. A schema-constrained answer might describe an action for display or storage. A tool call asks the runtime to do something. The distinction is clearest in Google's documentation: structured output formats a final response, while function calling connects the model to a tool or data system. Anthropic similarly separates JSON response formatting from strict validation of tool parameters; the two features can be used together.

A valid client-tool call is not permission to perform every requested operation. Check authorization, arguments, and side effects in application code. If a tool can send a payment, delete a record, or publish content, put the relevant policy checks at the tool boundary. A strict schema can require `amount` to be a number; it cannot decide whether this caller may spend it.

## Validation still belongs in the application

A schema-valid output can be semantically wrong. The model can choose a valid enum value that does not fit the input, omit evidence by filling a field with an empty string, or infer a date that the source never gave. Google explicitly warns that structured output can be syntactically correct while remaining semantically incorrect.

Build a validation boundary before using generated data:

1. Check the API result status and completion state. Handle refusal, filtering, timeout, and token-limit outcomes separately from a successful answer. OpenAI and Anthropic document refusal and truncation cases that can fall outside the schema.
2. Parse the response and validate it with your own runtime schema. This catches provider behavior your application depends on and makes validation repeatable across providers.
3. Apply domain checks: identifiers exist, dates fall in allowed ranges, totals reconcile, and referenced records belong to the current user. These rules are usually stricter than JSON Schema.
4. Decide what failure means. Ask the model to repair a specific validation error only when another attempt is safe and useful. Bound retries, preserve the original input, and avoid repeating side-effecting tools automatically.

Retries need care. A second generation can produce a different answer, and blindly retrying a refusal or malformed tool action can hide a policy or integration problem. For extraction, a bounded retry that includes a concise validation error may help. For actions, validate before execution and use idempotency controls or explicit confirmation where repeating the action could cause harm.

## Common failure modes

**A schema that the API does not support.** The schema may work in local validation and fail at request time because the provider supports only a subset. Start with the smallest schema that expresses the contract, and test it against the actual endpoint.

**Confusing required with meaningful.** A required string can still be empty, fabricated, or irrelevant. Add application-level checks and make uncertainty explicit in the data model, for example with a nullable value and a reason field.

**Treating truncation as valid completion.** A response cut off by an output limit can be partial JSON. Check the provider's finish or stop reason before parsing or storing it.

**Treating tool arguments as an executed result.** A client-tool call is a request from the model. Your application must validate it, decide whether it is authorized, run the function, and handle its result. The model may then need another turn to produce a final answer.

**Assuming every provider means the same thing by “strict.”** APIs expose different modes, schema subsets, request formats, and failure signals. Keep provider adapters narrow and run shared application validation after each one.

## Choose the narrowest useful guarantee

Use JSON mode when you only need parseable JSON and schema matching is unavailable. Use schema-constrained output when your application needs a predictable data shape. Use tool calling when the model should request an operation from your code. Combine a structured final response with tools when the workflow needs both and the chosen model supports them together.

In every case, validate the result at the boundary where your application accepts it. Keep authorization and domain rules in ordinary code, make retries bounded, and treat structured generation as a way to reduce formatting failures rather than a proof that the content is correct.
