---
title: Python evaluates a default argument once, when the def statement runs
description: A mutable default such as a list is created once at definition time and shared by every call that omits the argument, so use None and build the object inside the function.
pubDate: "2026-10-31T10:30:00Z"
specimen: 1161
section: dev
tags:
  - python
  - functions
  - default-arguments
  - mutability
  - pitfalls
draft: false
heroImage: https://media.aitamer.news/heroes/python-default-argument-evaluated-once-833c45c6.jpg
heroAlt: A single paper tray holds a pile of folded notes in several colours, all gathered in one shared container.
author: quill
wildness:
  rating: 1
  verified: Defaults are evaluated once when def runs and kept in __defaults__; None fix (Python reference, FAQ).
  claimed: Using is None rather than a truth test is the post's own reasoning.
verdict: Use immutable defaults or None, build mutable objects inside the body, and keep a shared default only when the sharing is the point.
sources:
  - title: "Python language reference: Function definitions"
    url: https://docs.python.org/3/reference/compound_stmts.html#function-definitions
  - title: "Python data model: User-defined functions"
    url: https://docs.python.org/3/reference/datamodel.html#user-defined-functions
  - title: "Python tutorial: Default Argument Values"
    url: https://docs.python.org/3/tutorial/controlflow.html#default-argument-values
  - title: "Python programming FAQ: Why are default values shared between objects?"
    url: https://docs.python.org/3/faq/programming.html#why-are-default-values-shared-between-objects
---

A function with a list as its default argument can appear to remember earlier calls. Nothing is cached by accident. Python creates the default value once, when the `def` statement runs, and every call that omits the argument receives that same object. This post shows the rule in the language reference, what it does to a mutable default, and the standard fix.

## What the reference says

The [Python language reference](https://docs.python.org/3/reference/compound_stmts.html#function-definitions) states that default parameter values are evaluated from left to right when the function definition is executed. It spells out the consequence: the expression is evaluated once, when the function is defined, and the same "pre-computed" value is used for each call.

A `def` statement is executed like any other statement. It builds a function object, and at that moment it evaluates each default expression and stores the result on the function. The [data model reference](https://docs.python.org/3/reference/datamodel.html#user-defined-functions) lists the attribute that holds them: `__defaults__`, a tuple of default parameter values. A call that leaves the parameter out binds it to the object in that tuple. It does not run the expression again.

## The shared list

For immutable defaults such as numbers, strings or `None`, this is invisible. A mutable default is different, because a call can change the stored object:

```python
def add_item(item, items=[]):
    items.append(item)
    return items

print(add_item("a"))
print(add_item("b"))
print(add_item.__defaults__)
```

Under Python 3.12 this prints:

```text
['a']
['a', 'b']
(['a', 'b'],)
```

The second call never asked for `"a"`, yet it received it. Both calls appended to the one list that `def` created, and `__defaults__` shows that list with both items in it. The [Python tutorial](https://docs.python.org/3/tutorial/controlflow.html#default-argument-values) gives the same example with numbers and calls it an important warning: the default value is evaluated only once, which matters when the default is a mutable object such as a list, a dictionary, or an instance of most classes.

## The None sentinel

The fix the reference and the [programming FAQ](https://docs.python.org/3/faq/programming.html#why-are-default-values-shared-between-objects) both recommend is to use `None` as the default and create the new object inside the body:

```python
def add_item_fixed(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items

print(add_item_fixed("a"))
print(add_item_fixed("b"))
```

This prints `['a']` and then `['b']`. The body runs on every call, so each call that omits `items` gets a fresh list. Test with `is None` rather than a truth test: `if not items` would also replace an empty list the caller passed on purpose, and the caller would never see the items appended to it.

## When sharing is the point

The FAQ notes that the behavior can be useful. Its example keeps a memo cache in a keyword-only default, `_cache={}`, so results survive between calls. That is a deliberate use of the same rule, and the leading underscore and keyword-only position signal that callers should not pass it.
## The rule

Treat a default value as part of the function object, created once at definition time. Use immutable defaults, or use `None` and build the mutable object inside the body. Keep a shared mutable default only when you want the sharing, and name it so readers can see that.
