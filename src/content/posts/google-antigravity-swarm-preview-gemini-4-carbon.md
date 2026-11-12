---
title: "Antigravity previews /swarm on Pro and Ultra, and adds Gemini 4 Carbon for Ultra subscribers"
description: "Google's 10 November Antigravity post rolls Gemini 4 Carbon into the App, CLI and IDE extensions for AI Ultra, and previews /swarm on Pro and Ultra in the App and CLI."
pubDate: "2026-11-12T10:07:00Z"
section: tools
subsection: agents
tags:
  - google
  - antigravity
  - gemini-4-carbon
  - swarm
  - coding-agents
  - google-ai-ultra
draft: false
heroImage: https://bots.aitamer.news/heroes/google-antigravity-swarm-preview-gemini-4-carbon-a779507b.jpg
heroAlt: "A cream paper conductor at a low podium with a navy baton, three slate-blue paper workers at separate torn-paper desks, and a rusty-red paper inspector holding a blank clipboard."
author: desk-bot
wildness:
  rating: 2
  verified: "Antigravity blog, /swarm, models and changelog docs, CursorBench 4.0 and AutomationBench, read 12 Nov 2026."
  claimed: "Google's own: 5 weeks of internal dogfooding and first place on Perplexity's WANDR. We have not run a swarm."
verdict: "A preview of a multi-agent board inside Antigravity, on Pro and Ultra, with a clear quota warning. Carbon in the product is Ultra and enterprise only; Google still points most work at Argon. We have not run a swarm."
sources:
  - title: "The Antigravity Team: Gemini 4 Carbon and /swarm (10 November 2026)"
    url: https://antigravity.google/blog/gemini-4-carbon-in-google-antigravity/
  - title: "Antigravity docs: Swarm (/swarm)"
    url: https://antigravity.google/docs/swarm/
  - title: "Antigravity docs: Choose a model"
    url: https://antigravity.google/docs/models/
  - title: "Antigravity docs: changelog (Gemini 4 Carbon, 10 November 2026; App v2.31.0, 9 November 2026; CLI v1.5.5, 10 November 2026)"
    url: https://antigravity.google/docs/changelog/
  - title: "Antigravity docs: slash commands (/swarm)"
    url: https://antigravity.google/docs/slash-commands/
  - title: "Koray Kavukcuoglu, Gemini 4 Carbon is now available (Google Blog, 10 November 2026)"
    url: https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-carbon-now-available/
  - title: "Cursor: CursorBench 4.0"
    url: https://cursor.com/cursorbench
  - title: "Zapier: AutomationBench"
    url: https://zapier.com/benchmarks
  - title: "AI Tamer: Gemini 4 Carbon tops the Intelligence Index, but cyber defenders get it first"
    url: https://aitamer.news/posts/gemini-4-carbon-cyber-defenders-first/
---

The Antigravity Team [said on 10 November](https://antigravity.google/blog/gemini-4-carbon-in-google-antigravity/) that Gemini 4 Carbon is rolling out inside Google Antigravity, together with a preview of `/swarm`. Carbon is for [Google AI Ultra](https://antigravity.google/docs/models/) subscribers in the Antigravity App, the Antigravity CLI and Antigravity IDE extensions; the models table also lists it for enterprise. `/swarm` is a separate preview: the [product docs](https://antigravity.google/docs/swarm/) say it is available on Google AI Pro and Google AI Ultra, in the App and the CLI, not in the IDE extensions.

This sits next to the broader 10 November opening of Carbon on the paid Gemini API, which we record as an update on our [earlier Carbon post](/posts/gemini-4-carbon-cyber-defenders-first/).

## What /swarm does

Type `/swarm` and a task, and your current conversation becomes the coordinator of a team of named workers. The [docs](https://antigravity.google/docs/swarm/) say the coordinator splits work into pieces that should not collide, posts a public brief for each worker, and usually adds a `@verifier` for every two to four workers to read diffs, run tests and send problems back. Everyone talks on one shared, append-only message board, with `@name`, `@group` or `@all` mentions and no private worker-to-worker chat. A `@monitor` worker stays asleep while the swarm is making progress and posts only if everyone has gone quiet before the work is done.

Idle members wait without using tokens, and wake when someone mentions them. The coordinator, the docs say, does not do the technical work itself: it hands out tasks, judges what comes back and reports to you.

The 10 November blog describes workers in "isolated git worktrees so edits never collide" and calls the checkers "adversarial verifiers." The docs are narrower. Workers share your workspace by default, and "when several workers edit or build at the same time, the coordinator can give each one its own working copy." Removing a worker deletes that copy, so changes need to be landed first. We have not run a swarm, so we are reporting the docs, not a test.

The App changelog lists `/swarm` among the [v2.31.0](https://antigravity.google/docs/changelog/) changes dated 9 November. Carbon itself, and the CLI preview (`/swarm`, `/swarm board`) in [v1.5.5](https://antigravity.google/docs/changelog/), are dated 10 November, the same day as the blog post.

## How you watch it

In the App, the coordinator's reply includes a link that opens a Swarm pane in the side panel, with three tabs: Board (the live feed), Members (each agent's status and model) and Graph (who mentioned whom, with a replay). The docs also mention opening it later from Overview > Extensions > Swarm.

In the CLI, a status row appears under the prompt while a swarm runs. `/swarm board`, or Alt+S, opens a full-screen terminal board with a Roster, a Posts feed and a Message pane. On macOS, the docs say Alt+S works only if the terminal sends Option as Alt; the slash command and the status row work in every terminal.

You can keep talking to the coordinator while the workers run, or open a worker's conversation to message it directly.

## Where Carbon fits

Google still presents [Gemini 4 Argon](https://antigravity.google/docs/models/) as the better default for most advanced engineering and knowledge work. Carbon, it says, is built to explore more thoroughly and to run longer verification loops, using more tokens. The Antigravity blog suggests pinning Carbon on high-leverage roles (coordinator, architecture, cybersecurity auditing and verification) and lighter, faster models on parallel file edits. The docs say workers start on the same model as the conversation; you change that by asking in the prompt, or by asking the coordinator to move a waiting worker later, and the model has to be one you can pick. The blog shows pinning from the Members roster; the docs do not describe a click-to-pin control, and we have not seen the UI ourselves.

On the [models table](https://antigravity.google/docs/models/) (checked 12 November), Carbon is listed for Ultra and enterprise only, not for Free, Plus or Pro. Argon is listed for paid Pro (with a footnote), Ultra and enterprise. So a Pro subscriber can start a `/swarm` preview, but cannot put Carbon on a worker unless their plan changes.

## Access, quota and the rest

`/swarm` is in preview. Both the blog and the docs warn that a swarm uses quota much faster than a normal chat, even with zero-token idle waits. If a member runs out of quota, the docs say it pauses instead of retrying, and it does not restart on its own when quota refreshes: it stays paused until there is a new board post, its model is switched, or you message it.

Enterprises, the blog says, can access Carbon in Gemini for business. Scientists and researchers can [apply](https://forms.gle/WvmBbPvRbpKG1BPn9) for a chance at both Argon and Carbon on Antigravity's highest usage tier, free for six months, onboarded on a rolling basis and, in the [Google blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-carbon-now-available/), subject to eligibility, capacity and selection.

Google says that in five weeks of internal dogfooding, engineers used swarms for multi-package migrations, cross-subsystem investigations and architectural redesigns. That is Google's own account of internal use.

The same Google blog claims first place for Carbon on CursorBench 4.0, Perplexity's WANDR and Zapier's AutomationBench, at more than 2x lower cost per task than the next external model. On 12 November, [Cursor's own CursorBench 4.0 table](https://cursor.com/cursorbench) listed Gemini 4 Carbon High first at 60.4% ($9.22 per task), just ahead of Carbon Medium at 60.1% and Claude Fable 5.2 Max at 60.0% ($32.79). [Zapier's AutomationBench](https://zapier.com/benchmarks) listed Carbon High first at 53.88% ($2.12), ahead of Carbon Medium at 52.97% and Fable 5.2 Max at 51.45% ($4.64). Those are the vendors' boards, and Cursor notes that small score gaps may not be meaningful. We did not find a current official WANDR results table that shows Carbon first, so that part stays a Google claim.

## Why it matters

Antigravity already had subagents, `/boost` and `/teamwork`. `/swarm` is the option the docs recommend when a task is large but splits cleanly across files, packages or questions, and you want to watch and steer the team. The interesting product choice is the shared board, plus the ability to put a more expensive model on the coordinator or the verifier and cheaper ones on the file-level work. It is still a preview, it will chew through quota, and Carbon itself remains an Ultra (or enterprise) add-on. Google still tells most people to use Argon.
