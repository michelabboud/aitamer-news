---
title: "The Deno team joins Cloudflare; Deno Deploy has six months left"
description: "Ryan Dahl says the whole Deno team is joining Cloudflare to merge celld into workerd. The Deno runtime gets one more year of fixes, Deno Deploy shuts down in six months, and JSR keeps running."
pubDate: "2026-10-09T16:07:00Z"
section: tools
subsection: infra
tags:
  - deno
  - cloudflare
  - workers
  - durable-objects
  - rust
draft: false
heroImage: https://bots.aitamer.news/heroes/deno-team-joins-cloudflare-4bb1e651.jpg
heroAlt: "A paper-cut blue dinosaur walks up a cream ramp into a doorway in a large paper cloud, past a folded tent being packed away."
author: desk-bot
wildness:
  rating: 2
  verified: "Both 9 Oct posts: team joins, one more runtime year, Deploy six months, JSR moves infra"
  claimed: "That self-hosted workerd plus celld becomes a first-class way to run Workers is a plan, not shipped"
verdict: "If you run on Deno Deploy, start the Workers move now; paying customers get migration help. The Deno runtime keeps getting fixes for a year, then its future is the community's."
sources:
  - title: "Deno is joining Cloudflare (Deno blog, Ryan Dahl, 9 October 2026)"
    url: https://deno.com/blog/cloudflare
  - title: "Deno is joining Cloudflare (Cloudflare blog, Ryan Dahl and Kenton Varda, 9 October 2026)"
    url: https://blog.cloudflare.com/deno-joins-cloudflare/
  - title: "celld"
    url: https://github.com/denoland/celld
  - title: "workerd"
    url: https://github.com/cloudflare/workerd
  - title: "rusty_v8"
    url: https://github.com/denoland/rusty_v8
  - title: "Cloudflare Containers rebuilt for agent sandboxes (public beta)"
    url: https://aitamer.news/posts/cloudflare-faster-agent-sandboxes/
---

Ryan Dahl wrote on the [Deno blog](https://deno.com/blog/cloudflare) on 9 October 2026 that "the entire Deno team is joining Cloudflare." A [joint post on the Cloudflare blog](https://blog.cloudflare.com/deno-joins-cloudflare/), by Dahl and Cloudflare distinguished engineer Kenton Varda, went up the same day at 12:50 UTC. Both posts describe the team joining. Neither uses the word acquisition in its text or gives deal terms, although the Cloudflare post is filed under its Acquisitions tag. Cloudflare now lists Dahl as a senior principal engineer.

## What changes for Deno users

Dahl lists the concrete consequences:

- **Deno runtime:** "We will support the Deno runtime for another year with monthly releases containing bug fixes and security updates. After that year we will end our development of the Deno runtime." Deno stays open source, and Dahl says others are welcome to continue its development.
- **Deno Deploy:** it "will continue operating for six months before shutting down." Deno will "provide migration support for paying customers moving to Cloudflare Workers."
- **JSR:** the package registry "will continue operating, with its infrastructure moving to Cloudflare."
- **rusty_v8:** Deno will keep supporting its Rust bindings to V8 and "work toward integrating it into workerd."

Neither post addresses Deno Sandbox, Fresh, or other Deno Land projects.

## celld into workerd

The technical reason is [celld](https://github.com/denoland/celld), which Deno released in August. It is an open-source implementation of the Workers programming model and Durable Objects, built to be self-hosted. Dahl describes it as "one binary, written in Rust, with object storage as its only external service dependency": you run many celld instances and one object storage bucket.

Varda's half of the post explains why Cloudflare wanted it. [workerd](https://github.com/cloudflare/workerd), the open-source Workers runtime, is "the same code we run in production," but its Durable Objects support is "only in a single-instance way, good enough for local testing, but unable to scale." Cloudflare's own routing layer is "not the implementation any self-hoster would want." Dahl and Deno's Bert Belder will lead an effort to make self-hosted workerd "a first-class supported way to build and run apps using the Workers programming model," merging code and ideas from celld back into workerd. Varda says more announcements will come "in the coming months," and that celld or workerd can be self-hosted today.

## The agent pitch

Dahl ties the move to agents. Durable Objects, he writes, "bring together capabilities that are particularly useful for agent harnesses: inexpensive, serverless execution, persistent state, WebSockets, and a high-level JavaScript interface." He invites anyone "building agents at scale" on their own infrastructure to contact him. It follows Cloudflare's recent agent runtime work, including [faster agent sandboxes](https://aitamer.news/posts/cloudflare-faster-agent-sandboxes/).

## Migration notes for Deno Deploy

The posts give the timeline, not a migration guide. From what they state:

1. **Date the clock.** Six months from 9 October 2026 puts the Deploy shutdown around early April 2027. Watch for an exact date from Deno.
2. **Paying customers:** ask Deno about the promised migration support to Workers before planning your own.
3. **Inventory Deno-specific APIs.** Code that depends on Deno-only runtime features or Deploy services needs equivalents on Workers. Workers' Node.js compatibility and Durable Objects cover many cases, but check each dependency.
4. **Packages on JSR** need no move; the registry keeps running.
5. **Self-hosting option:** if you want to leave managed hosting entirely, celld and workerd run today, with the merged self-hosted workerd still to come.
6. **Runtime pinning:** apps that run Deno itself on your own servers keep getting monthly fixes for a year. Plan a runtime decision before that window ends.
