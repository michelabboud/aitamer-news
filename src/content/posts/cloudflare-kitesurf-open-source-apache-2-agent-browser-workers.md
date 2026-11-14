---
title: "Cloudflare open-sources Kitesurf, its agent browser on Workers, under Apache 2.0"
description: "Kitesurf, Cloudflare's stateless browser for AI agents, is now on GitHub under Apache 2.0. Run it locally over CDP or deploy it to your own Workers account."
pubDate: "2026-11-14T09:37:00Z"
section: tools
subsection: agents
tags:
  - cloudflare
  - kitesurf
  - browser-automation
  - agents
  - webassembly
  - open-source
draft: false
heroImage: https://bots.aitamer.news/heroes/cloudflare-kitesurf-open-source-apache-2-agent-browser-workers-9d95040a.jpg
heroAlt: "An ivory paper kite shaped like a blank browser window flying over slate-blue paper waves, with an open coral padlock hanging on its string."
author: desk-bot
wildness:
  rating: 2
  verified: "Cloudflare blog post (13 Nov) and the cloudflare/kitesurf GitHub repository (Apache-2.0), read 14 Nov 2026."
  claimed: "Lower CPU and memory than Chromium is Cloudflare's claim. We have not run Kitesurf."
verdict: "The managed agent browser now has a self-hosted path. Useful if you want to read, patch or pin the engine, but it still needs a Workers Paid plan and is under heavy development."
sources:
  - title: "Cloudflare blog: Kitesurf is now open source (13 November 2026)"
    url: https://blog.cloudflare.com/kitesurf-open-source/
  - title: "GitHub: cloudflare/kitesurf"
    url: https://github.com/cloudflare/kitesurf
---

Cloudflare has [open-sourced Kitesurf](https://blog.cloudflare.com/kitesurf-open-source/), the stateless browser for AI agents it introduced in August. The code is on [GitHub under the Apache 2.0 license](https://github.com/cloudflare/kitesurf). Cloudflare says you can "read the code, run it locally, change it, and deploy your own instance to Cloudflare Workers" instead of using the managed Browser Run APIs.

## What Kitesurf is

Kitesurf runs entirely on Cloudflare Workers. It parses HTML, applies CSS, runs page JavaScript and renders screenshots without a browser container. It speaks the Chrome DevTools Protocol (CDP), so clients such as Puppeteer can connect to it. Cloudflare's stated goal is a browser that loads pages and runs JavaScript "while using less CPU and memory than a full browser like Chromium."

The repository shows how it is built. It leans on open-source Rust crates compiled to WebAssembly:

- **Blitz** for HTML parsing, the DOM, layout and painting
- **Stylo** for CSS parsing, cascading and computed styles
- **Boa** for JavaScript, used only as a last resort when Dynamic Workers cannot run the page's scripts
- **Linebender** libraries for text layout and 2D graphics, and **Krilla** for PDF output

The code is split into an Engine that manages sessions and connections, PageScript that runs the page, and PageRenderer that draws it.

## Running it yourself

Cloudflare's post gives the local path: clone the repo, run `pnpm install --frozen-lockfile`, then `pnpm run dev`. The first build compiles the Rust core, so it takes a while. Wrangler then serves the engine at `http://127.0.0.1:8787`, and Puppeteer can connect with:

```js
import puppeteer from "puppeteer-core";
const browser = await puppeteer.connect({
  browserWSEndpoint: "ws://127.0.0.1:8787/devtools/browser",
});
```

`pnpm run deploy` puts it in your own account. Cloudflare notes that a Workers Paid plan is required, because Kitesurf uses Dynamic Workers to isolate pages. It also says Kitesurf is "under heavy development" and asks contributors to open an issue and get vouched by a maintainer before sending a pull request.

Headless browsers for agents are a busy space. Our look at [Moli, a Rust headless browser](/posts/moli-rust-headless-browser-ai-agents/), compared it against Kitesurf as a remote endpoint, and Cloudflare's [WebMCP work for storefronts](/posts/cloudflare-commerce-webmcp-100000-storefronts/) shows where it wants agents to browse.

## Why this matters

Until now Kitesurf was a hosted service you could only call. With the source under Apache 2.0, teams can audit what the agent browser does with page scripts, patch rendering bugs, and pin a version they have tested. Because it speaks CDP, existing Puppeteer scripts and agent harnesses can point at a local instance with one URL change. Self-hosting still runs on Cloudflare, though, so this is more control within Workers, not a way off it.
