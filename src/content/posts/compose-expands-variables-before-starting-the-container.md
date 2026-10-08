---
title: Compose Expands Variables Before Starting the Container
description: A voice service can receive a different setting from the one Compose used to build its configuration. Learn how defaults, host inputs and escaped dollar signs cross that boundary.
pubDate: "2026-10-08T23:00:00Z"
specimen: 509
section: devops
tags:
  - docker-compose
  - environment-variables
  - configuration
  - voice-applications
draft: false
heroImage: https://media.aitamer.news/heroes/compose-expands-variables-before-starting-the-container-78eae153.jpg
heroAlt: An external piece fills a configuration stencil before the resolved piece reaches a separate container box.
author: ari
wildness:
  rating: 1
  verified: Compose resolves file values before startup; service environment passes selected values into the container.
  claimed: The YAML service is illustrative; no container run or behavior measurement is claimed.
verdict: Render Compose configuration before launch, then explicitly pass each value the voice process needs through its service environment.
sources:
  - title: "Docker Docs: Set, use, and manage variables in a Compose file with interpolation"
    url: https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/
  - title: "Docker Docs: Compose file interpolation"
    url: https://docs.docker.com/reference/compose-file/interpolation/
---

A voice application may use one language during local testing and another in a deployed container, even though both runs use the same `compose.yaml`. The first place to inspect is the rendered Compose configuration. Compose substitutes variables while it reads the file, before it creates the container. The resulting service definition determines what Docker starts.

Consider this illustrative service:

```yaml
services:
  voice:
    image: example/voice:${IMAGE_TAG:-stable}
    environment:
      LANGUAGE: ${LANGUAGE:-en}
    command: ["sh", "-c", "exec voice-server --lang \"$${LANGUAGE}\""]
```

If `IMAGE_TAG` is absent, Compose selects `stable`. If `LANGUAGE` is absent or empty, it selects `en`. The colon matters: `${LANGUAGE-en}` would use `en` only when the variable is unset, preserving an explicitly empty value. These forms are specified in [Docker's interpolation guide](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/). Use `${LANGUAGE:?Set LANGUAGE}` when an empty language would be a deployment error rather than a useful default.

Compose takes interpolation inputs from the shell environment, then from an explicit `--env-file`, or from its default `.env` lookup. A value in `.env` is available to Compose for substitution; it does not automatically become a process variable. Here, `LANGUAGE` reaches the voice process because the service declares it under `environment`. `IMAGE_TAG` only selects an image. This distinction matters when a model downloader or speech worker expects a setting inside the container: adding a value to `.env` alone may leave that process unaware of it.

The command contains `$${LANGUAGE}` for a different reason. The doubled dollar sign tells Compose to leave a literal dollar sign for the container's shell. The shell then expands `${LANGUAGE}` after startup, using the container environment. [The Compose specification](https://docs.docker.com/reference/compose-file/interpolation/) documents this escape. It only postpones expansion; it does not supply the variable. If the image invokes a program directly rather than a shell, a literal `$LANGUAGE` argument remains literal unless that program interprets it.

Before starting a voice stack, run `docker compose config --environment` to inspect interpolation inputs, then `docker compose config` to inspect the resolved service. Treat real output as sensitive if it contains credentials. Decide separately which values choose the Compose model and which ones the application must receive at runtime, and declare the latter in the service configuration.
