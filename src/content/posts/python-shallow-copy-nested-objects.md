---
title: A shallow copy leaves nested objects shared
description: Copying the outer dictionary does not isolate the lists and dictionaries inside it.
pubDate: "2026-11-08T12:00:00Z"
section: dev
tags:
  - python
  - standard-library
  - practical-programming
draft: false
heroImage: https://media.aitamer.news/heroes/python-shallow-copy-nested-objects-01c9a448.jpg
heroAlt: Two cream paper folders are linked to the same teal basket of coral circles.
author: ari
wildness:
  rating: 1
  verified: A shallow container copy still refers to nested objects held by the original.
  claimed: No workload benchmark or universal resource guarantee is claimed.
verdict: Make the ownership and boundary behavior explicit before relying on the convenience API.
sources:
  - title: Python official documentation
    url: https://docs.python.org/3/library/copy.html
---

A copied configuration can still change its original. In Python, copying a container usually creates a new outer container while leaving references to its contained objects in place. Whether that is useful or surprising depends on which level the caller expects to edit.

Take a dictionary holding a list of recipients:

```python
original = {"recipients": ["Ada"], "mode": "preview"}
working = original.copy()
working["recipients"].append("Lin")
working["mode"] = "send"
print(original)
# {'recipients': ['Ada', 'Lin'], 'mode': 'preview'}
```

Replacing mode changed only the copy. Appending a recipient changed the list both dictionaries refer to. The [copy module reference](https://docs.python.org/3/library/copy.html) explains the distinction between making a new compound object and recursively copying its components.

This bug often appears in request defaults. A service copies a template dictionary, adds a recipient, then passes the result to a client. A later request starts from a template that already contains the earlier addition. The copy operation was real, but the intended isolation boundary was deeper than the operation provided.

Choose the boundary explicitly. If only the recipients list needs to vary, copy that list while constructing the request dictionary. Doing so documents which part is private to this request and which values are intentionally shared. It can be clearer than recursively copying an entire graph whose ownership rules nobody has written down.

Deepcopy is another tool, with its own tradeoffs. It recursively handles compound data and uses bookkeeping for repeated references and cycles, but it is not a universal way to duplicate a running system. Open files, sockets and other external resources do not become independent resources merely because an object containing them passes through a copy function. User-defined classes can also customize copying behavior.

A safe test changes a nested value after the copy and then checks both objects. Comparing the dictionaries immediately after copying proves only that they begin with equivalent contents. It says little about whether later changes remain isolated.

The reverse problem matters too: copying something intended to be shared can break coordination or waste resources. Shared objects are not inherently a mistake. The mistake is leaving their sharing accidental when later code treats them as independent.

When a reviewer sees copy in a data path, follow the references one level further. Identify what the code will mutate, then make the copy at that level. A new outer object is a useful operation, but it is not evidence that all reachable state now belongs to one caller.
