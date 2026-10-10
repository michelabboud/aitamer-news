---
title: Test Pydantic AI agents with a fake model instead of the live API
description: Swap TestModel or FunctionModel in for the real model and block real model requests, so Pydantic AI agent tests run fast, free and the same way every time.
pubDate: "2026-10-11T06:30:00Z"
section: dev
tags:
  - pydantic-ai
  - testing
  - pytest
  - agents
  - python
draft: false
heroImage: https://media.aitamer.news/heroes/test-pydantic-ai-agents-with-a-fake-model-instead-of-the-live-api-04b52d86.jpg
heroAlt: A paper test agent uses a small model stage as a safe stand-in for a distant live API.
author: quill
wildness:
  rating: 1
  verified: APIs, defaults and RuntimeError behaviour match the official guide and API reference.
  claimed: Nothing beyond the documentation; the post states plainly what fake-model tests cannot cover.
verdict: Do this in every Pydantic AI project. Blocking real requests turns a forgotten model swap into an immediate error, and the fakes make agent tests deterministic. Keep real-model evals as a separate suite.
sources:
  - title: "Pydantic AI: Unit testing guide"
    url: https://pydantic.dev/docs/ai/guides/testing/
  - title: "Pydantic AI API reference: pydantic_ai.models"
    url: https://pydantic.dev/docs/ai/api/models/base/
  - title: "Pydantic AI API reference: pydantic_ai.models.test"
    url: https://pydantic.dev/docs/ai/api/models/test/
---

Agent tests that call a live model have three problems. Each run costs money, each run waits on the network, and the model can answer differently every time, so exact assertions turn flaky. The [Pydantic AI testing guide](https://pydantic.dev/docs/ai/guides/testing/) addresses this by swapping the real model for a fake one in tests and blocking real model requests outright. This post walks through both steps.

## Start by blocking real model requests

The guide sets one flag at the top of each test module, directly after the async test marker:

```python
import pytest
from pydantic_ai import models

pytestmark = pytest.mark.anyio
models.ALLOW_MODEL_REQUESTS = False
```

The guide calls this a safety measure against accidental real requests. The [API reference for `pydantic_ai.models`](https://pydantic.dev/docs/ai/api/models/base/) adds the details. The flag defaults to `True`. The request check raises `RuntimeError` when requests are not allowed. `TestModel`, `FunctionModel`, `TestEmbeddingModel` and `TestImageGenerationModel` ignore the flag, so the fakes keep working while any real provider call fails loudly.

That loud failure is the point. Without the flag, a test where you forgot to swap the model still passes, slowly, and bills you. With it, the forgotten swap shows up as an error on the first run.

If you need a real call in one place, such as an opt-in integration test, the same reference documents `override_allow_model_requests(allow_model_requests: bool)`, a context manager that changes the setting temporarily.

## The agent under test

The examples below test a small agent defined in application code:

```python
# my_app/support.py
from pydantic_ai import Agent

agent = Agent("openai:gpt-4o", instructions="Report the order status.")

@agent.tool_plain
def order_status(order_id: str) -> str:
    return f"order {order_id} shipped"
```

## TestModel checks the plumbing

`TestModel` involves no machine learning. According to the guide, it calls every tool the agent has by default, builds the tool arguments from each tool's JSON schema with procedural code, and then returns text or structured output that matches the agent's output type. The guide is candid that this data is usually unrealistic but usually passes Pydantic validation.

You swap it in with `agent.override`, which the guide uses because it replaces the model without needing access to the code that calls `agent.run`. `capture_run_messages` records the messages from the run so you can assert on them.

```python
from pydantic_ai import ToolCallPart, capture_run_messages
from pydantic_ai.models.test import TestModel
from my_app.support import agent

async def test_agent_calls_order_tool():
    with capture_run_messages() as messages:
        with agent.override(model=TestModel(custom_output_text="Shipped")):
            result = await agent.run("Where is order 42?")
    assert result.output == "Shipped"
    calls = [p for m in messages for p in m.parts if isinstance(p, ToolCallPart)]
    assert [c.tool_name for c in calls] == ["order_status"]
```

`custom_output_text` fixes the final answer. The [`TestModel` API reference](https://pydantic.dev/docs/ai/api/models/test/) lists a few other options: `call_tools` takes a list of tool names or `'all'` (the default), `custom_output_args` supplies arguments for a structured output tool, and `seed` (default `0`) controls the generated data.

A test like this catches broken wiring: a tool that is not registered, a signature whose schema fails, an output type that does not validate, dependencies that are not passed through. It cannot tell you how your tool handles a specific input, because the guide notes that `TestModel` does not extract values from the prompt. The `order_id` it sends is a generated string.

## FunctionModel scripts the model's decisions

When the test depends on specific tool arguments, use `FunctionModel`. You write a function that receives the message history and an `AgentInfo` describing the agent's tools, and returns a `ModelResponse`. The guide's example returns a tool call on the first request and a text answer built from the tool's result on the next one:

```python
from pydantic_ai import ModelResponse, TextPart, ToolCallPart
from pydantic_ai.messages import ModelMessage
from pydantic_ai.models.function import AgentInfo, FunctionModel
from my_app.support import agent

def lookup_order_42(messages: list[ModelMessage], info: AgentInfo) -> ModelResponse:
    if len(messages) == 1:
        return ModelResponse(parts=[ToolCallPart("order_status", {"order_id": "42"})])
    tool_return = messages[-1].parts[0]
    return ModelResponse(parts=[TextPart(f"Status: {tool_return.content}")])

async def test_order_42_status():
    with agent.override(model=FunctionModel(lookup_order_42)):
        result = await agent.run("Where is order 42?")
    assert result.output == "Status: order 42 shipped"
```

Now the tool runs with a real argument and the assertion is exact. Every run gives the same messages, so the test is deterministic. For a fake that needs state across requests, the guide says `FunctionModel` also accepts a callable instance with an `async def __call__`.

To apply an override to many tests, the guide shows a pytest fixture that enters `agent.override(model=TestModel())` and yields.

## Where this advice stops

- These tests cover your code around the model. They say nothing about whether the real model picks the right tool or writes a good answer. That needs evaluations against the real model, run as a separate suite where real requests are allowed on purpose.
- `TestModel` cannot emulate tools that the provider executes itself. The guide suggests `agent.override(model=TestModel(), native_tools=[])` unless the test is checking that those tools reach the model.
- A `FunctionModel` is only as faithful as the script you write. If the script calls a tool in a way the real model never would, the test passes while production breaks. Keep scripts close to transcripts of real runs.
- Asserting full message lists gets long. The guide recommends `inline-snapshot` for long assertions and `dirty-equals` for large data structures.
