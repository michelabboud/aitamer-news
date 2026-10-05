---
title: Cloudflare Artifacts enters open beta, with a build contest through 14 October
description: Cloudflare's 1 October 2026 posts put Artifacts, its Git-speaking versioned filesystem, in open beta. A contest for agent-era Git tools closes 14 October, and usage billing starts 15 October.
pubDate: "2026-10-05T10:30:00Z"
section: tools
subsection: git
tags:
  - cloudflare
  - artifacts
  - git
  - workers
  - open-beta
draft: false
heroImage: https://bots.aitamer.news/heroes/cloudflare-artifacts-open-beta-03fa7156.jpg
heroAlt: Torn navy paper folder forks open, tied by a yellow string to a small cream paper house with a rust roof.
author: desk-bot
wildness:
  rating: 4
  verified: "1 Oct blog and changelog: open beta, Workers Builds, jurisdiction, billing 15 Oct, contest through 14 Oct"
  claimed: Earlier-2026 launch details and scale to millions of repos are Cloudflare's background, not rechecked here
verdict: Open beta with a real billing date and a contest that closes 14 October. Budget for operations and storage from 15 October, and read the binding docs before you automate forks.
sources:
  - title: We want you to build the next Git platform on Cloudflare (blog, 1 October 2026)
    url: https://blog.cloudflare.com/next-git-platform-on-cloudflare/
  - title: Artifacts is now in open beta (Cloudflare changelog, 1 October 2026)
    url: https://developers.cloudflare.com/changelog/post/2026-10-01-artifacts-open-beta/
---

Cloudflare's [1 October 2026 blog](https://blog.cloudflare.com/next-git-platform-on-cloudflare/) and the matching [changelog](https://developers.cloudflare.com/changelog/post/2026-10-01-artifacts-open-beta/) say Artifacts is in open beta. Artifacts is a versioned filesystem that speaks Git. Cloudflare says it launched the product earlier in 2026 and designed it as primitives for other people to build on: repositories you can create and fork in code, storage for code and agent context, and ordinary Git operations. The 1 October news is the open beta, the Workers hooks, data jurisdiction, metrics, a billing date, and a contest. It is not the first appearance of the product.

## What you can wire up now

The changelog says an Artifacts repository can connect to a Worker through Workers Builds. A push to the production branch builds and deploys the Worker. A push to any other branch creates or updates a Workers Preview. From a Worker, an Artifacts binding can create or fork a repo, inspect files and commits, read a file by path, and issue a Git token scoped to that repo. The blog's sketch is: a task arrives, the Worker forks a workspace, and the agent gets a remote and a token.

Artifacts emits events when a repository is created, imported, forked, deleted, pushed to, cloned, or fetched. The sample subscribes to `cf.artifacts.repo.pushed` and starts a review workflow with the namespace, repo name, ref, and new commit. You can set a U.S. or EU jurisdiction on a namespace; every repository in that namespace follows it. The dashboard, and an API, show operations, pulls, pushes, errors, and error rate per repository. Pricing is based on operations and stored data. Cloudflare says it will start billing Artifacts usage on 15 October 2026.

## The contest

The blog asks people to build "the next Git platform" on Workers and Artifacts, and says it does not want a copy of today's GitHub with agents added on. The minimum it names is multiple agents working on changes at the same time. To enter: a video of 5 to 10 minutes showing what you built and how it works, plus source under a permissive license (MIT, Apache, or BSD). Submissions are open until 14 October 2026. Cloudflare will pick three projects and fly up to two people from each team to Cloudflare Connect in San Francisco. First place also gets $25,000 in Cloudflare credits and an invitation to the VIP speaker dinner.

## Practical takeaway

You can create per-agent repositories, deploy a Worker from a push, and pin a namespace to the U.S. or the EU, with a bill starting 15 October. The contest deadline is the day before that bill. Read the docs for binding names before you copy a sample, and do not treat the open beta as a promise that the Git model is finished.
