---
title: One Request ID Through Many Coroutines
description: Python context variables let asynchronous tasks read a request ID without passing it through every function call. The key is when each task receives its context.
pubDate: "2026-10-05T15:00:00Z"
specimen: 272
section: dev
tags:
  - python
  - asyncio
  - contextvars
  - observability
draft: false
heroImage: https://media.aitamer.news/heroes/one-request-id-through-many-coroutines-8df3f89d.jpg
heroAlt: One coral request marker branches across several task circles and stays attached to each.
author: ari
wildness:
  rating: 2
  verified: Python documents context-local values, reset tokens, and task context copying.
  claimed: A request ID example connects those rules to concurrent child coroutines.
verdict: Set the ID before creating child tasks, read it where needed, and reset the handler’s binding when the request ends.
sources:
  - title: "Python documentation: contextvars — Context Variables"
    url: https://docs.python.org/3/library/contextvars.html
  - title: "Python documentation: Coroutines and Tasks"
    url: https://docs.python.org/3/library/asyncio-task.html
  - title: "Python documentation: asyncio.create_task"
    url: https://docs.python.org/3/library/asyncio-task.html#asyncio.create_task
  - title: "Python documentation: asyncio.Task"
    url: https://docs.python.org/3/library/asyncio-task.html#asyncio.Task
---

An asynchronous request handler may call several coroutines before it sends a response. A request ID is useful in each one, especially when writing logs. Python’s [context variables](https://docs.python.org/3/library/contextvars.html) let code read a value from its current context without adding an ID argument to every call.

## The value belongs to a context

Declare one `ContextVar` at module level. At the start of a request, call `set()` with that request’s ID. Code running in the current context can then call `get()`. `set()` returns a token that `reset()` can use to restore the previous value. Python recommends module-level declarations because contexts retain strong references to context variables. [These behaviors are documented in `contextvars`](https://docs.python.org/3/library/contextvars.html).

The distinction matters when requests overlap. An `asyncio` task runs with a context. By default, [creating a task copies the current context](https://docs.python.org/3/library/asyncio-task.html#asyncio.create_task). Create child tasks after setting the request ID, and each starts with that binding. Another request can set a different ID in its own context.

## The ID reaches child coroutines

```python
import asyncio
from contextvars import ContextVar

request_id = ContextVar("request_id")

async def read_id():
    await asyncio.sleep(0)
    return request_id.get()

async def handle_request(identifier):
    token = request_id.set(identifier)
    try:
        first = asyncio.create_task(read_id())
        second = asyncio.create_task(read_id())
        return await asyncio.gather(first, second)
    finally:
        request_id.reset(token)
```

Both child tasks are created while `identifier` is set, so both can read it. The `finally` block restores the handler’s previous binding even if the awaited work raises an exception. The example follows the documented behavior of [`ContextVar` tokens](https://docs.python.org/3/library/contextvars.html) and [`asyncio` task creation](https://docs.python.org/3/library/asyncio-task.html#asyncio.create_task).

Task creation is the point to watch. A task receives a copy of the current context when it is created, unless a context is supplied explicitly. Setting a different ID in the parent afterward does not replace the binding already copied into that task. `ContextVar.get()` reads the value in the context where the code runs. [Python documents both sides of that behavior](https://docs.python.org/3/library/asyncio-task.html#asyncio.Task).

## What to do

1. Define the request ID variable once at module level.
2. Set it when the request starts, before creating child tasks.
3. Read it where a log entry or diagnostic message needs the ID.
4. Keep the token and reset it in a `finally` block.
5. Check where your application creates tasks. That moment determines which context each task copies.
