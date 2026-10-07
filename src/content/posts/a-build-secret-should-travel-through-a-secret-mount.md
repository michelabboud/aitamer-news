---
title: A Build Secret Should Travel Through a Secret Mount
description: BuildKit secret mounts make credentials available only to the build instruction that needs them. ARG, ENV and copied files can disclose values through image metadata, layers or cache.
pubDate: "2026-10-08T17:30:00Z"
section: devops
tags:
  - docker
  - buildkit
  - secrets
draft: false
heroImage: https://media.aitamer.news/heroes/a-build-secret-should-travel-through-a-secret-mount-931af16b.jpg
heroAlt: A removable paper key reaches one workpiece inside a cream build chamber; finished image layers stand outside without it.
author: ari
wildness:
  rating: 1
  verified: BuildKit secret mounts expose credentials to requested build instructions without persisting in the image.
  claimed: Build commands may copy secret data into outputs or logs; a mount alone cannot prevent that.
verdict: Pass private build credentials with BuildKit secret mounts, consume them in the needed RUN instruction, and inspect outputs and cache paths for accidental disclosure.
sources:
  - title: "Docker documentation: Build secrets"
    url: https://docs.docker.com/build/building/secrets/
  - title: "Docker documentation: Build variables"
    url: https://docs.docker.com/build/building/variables/
  - title: "Docker documentation: Cache storage backends"
    url: https://docs.docker.com/build/cache/backends/
---

A private speech-model download makes an image build an authenticated client. Its credential belongs to the build operation. Passing it through `ARG`, setting it with `ENV`, or copying a credential file into the build context changes what the resulting image and its build records can disclose.

[Docker's build secret mechanism](https://docs.docker.com/build/building/secrets/) has two parts. The build client supplies a secret with `docker build --secret`, using a local file or an environment variable as the source. A Dockerfile `RUN` instruction requests that secret with `--mount=type=secret,id=...`. By default the instruction sees a file at `/run/secrets/<id>`; it can choose another target path or receive the value as an environment variable for that instruction. The mount exists for the instruction's duration. A later `RUN` step must request it separately if that step also needs it.

For example, a builder could supply a credential file under the ID `model_repo`, and the artifact-fetching `RUN` instruction could read `/run/secrets/model_repo`. The build should write the fetched model to the intended output path while leaving the credential out of that output. The same credential will not appear in the runtime container merely because the build used it. Runtime access to a model provider requires its own deployment credential path.

The distinction among alternatives matters. [Docker's build variable documentation](https://docs.docker.com/build/building/variables/) says `ENV` values persist in containers made from the image. `ARG` values are not automatically runtime environment variables, yet they may appear in image history or provenance metadata. Treating an argument as temporary secret storage is therefore unsafe. [Docker's cache documentation](https://docs.docker.com/build/cache/backends/) also warns that managing credentials with `COPY` or `ARG` can leak them, including when build cache is exported. Deleting a copied file in a later instruction is not a reliable repair for having put it into an earlier layer.

A secret mount protects the delivery path, but it cannot control what the command does after reading the credential. A package manager or fetch script could still write authentication data into a generated config, output artifact, or build log. Review the build command's outputs and logs, keep the mount limited to the instruction that needs it, and check exported image and cache contents as part of the release procedure. Choose a build secret mount for private build inputs, and give runtime credentials a separate lifecycle.
