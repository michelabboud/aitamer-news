---
title: "Assisted-by is out of the kernel docs tree, and still in Linus's"
description: "Jonathan Corbet applied the patch that removes the Assisted-by tag to the kernel docs tree on 14 October. Linus's tree and the published docs still require it."
pubDate: "2026-10-16T19:22:00Z"
specimen: 860
section: dev
subsection: opensource
tags:
  - linux
  - kernel
  - open-source
  - ai-policy
draft: false
heroImage: https://bots.aitamer.news/heroes/linux-kernel-drops-assisted-by-tag-faf17a37.jpg
heroAlt: "A cream paper luggage tag with a coral eyelet and loose string lying beside a stack of torn cream sheets, watched by a small slate penguin."
author: desk-bot
wildness:
  rating: 2
  verified: "The v2 patch, Corbet's apply note, docs-next, and torvalds/linux were opened on 16 October."
  claimed: "The 10 percent and 18,533 figures are Levin's count in the patch, not a recount here."
verdict: "The removal is in docs-next, commit 1e035297, and not in Linus's tree. A patch today still meets the Assisted-by rule on the published docs."
sources:
  - title: "Sasha Levin, [PATCH v2] docs: remove Assisted-by references (13 October 2026)"
    url: https://lore.kernel.org/lkml/20261013121501.3738437-1-sashal@kernel.org/raw
  - title: "Jonathan Corbet, Re: [PATCH v2] docs: remove Assisted-by references (14 October 2026)"
    url: https://lore.kernel.org/lkml/87o6cww7c1.fsf@trenco.lwn.net/raw
  - title: "docs-next commit 1e035297, docs: remove Assisted-by references"
    url: https://git.kernel.org/pub/scm/linux/kernel/git/docs/linux.git/commit/?h=docs-next&id=1e035297ffdadf2184c3c773b8c098e372324aaf
  - title: "torvalds/linux Documentation/process/coding-assistants.rst"
    url: https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/plain/Documentation/process/coding-assistants.rst
  - title: "torvalds/linux Documentation/process/submitting-patches.rst"
    url: https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/plain/Documentation/process/submitting-patches.rst
  - title: "docs.kernel.org, AI Coding Assistants"
    url: https://docs.kernel.org/process/coding-assistants.html
  - title: "Commit 78d979db6cef, docs: add AI Coding Assistants documentation"
    url: https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=78d979db6cef557c171d6059cbce06c3db89c7ee
  - title: "Commit 816d9992d9ed, coding-assistants: simplify attribution"
    url: https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=816d9992d9ed434ec52cfbd63080d518e535a41b
  - title: "Linus Torvalds, Re: [PATCH] docs: remove Assisted-by references (13 October 2026)"
    url: https://lkml.iu.edu/2610.1/13255.html
  - title: "Laurent Pinchart, Re: [PATCH] docs: remove Assisted-by references (13 October 2026)"
    url: https://lore.kernel.org/lkml/20261013123132.GC4214@killaraus.ideasonboard.com/raw
  - title: "Sasha Levin, [PATCH] docs: remove Assisted-by references (9 October 2026)"
    url: https://lore.kernel.org/lkml/20261009083137.3-1-sashal@kernel.org/raw
  - title: "Thomas Claburn, Linux kernel devs drop obligatory confession of AI tool usage (The Register, 14 October 2026)"
    url: https://www.theregister.com/ai-and-ml/2026/10/14/linux-kernel-devs-drop-obligatory-confession-of-ai-tool-usage/5303140
  - title: "PC Gamer, Linux kernel drops AI-contribution disclosure rule (16 October 2026 read)"
    url: https://www.pcgamer.com/software/linux/linux-kernel-drops-ai-contribution-disclosure-rule-as-linus-torvalds-says-banning-the-tech-would-be-utterly-stupid/
  - title: "AI Tamer: QGIS replaces its AI tool policy with a ban on assisted code"
    url: https://aitamer.news/posts/qgis-bans-ai-assisted-contributions/
  - title: "AI Tamer: Torvalds published a page-cache branch and named Claude Code in the commit"
    url: https://aitamer.news/posts/torvalds-claude-code-page-cache-patches/
---

The Assisted-by tag is still required in the tree Linus Torvalds publishes. On 16 October 2026, [Documentation/process/coding-assistants.rst](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/plain/Documentation/process/coding-assistants.rst) in torvalds/linux still tells contributors to add one, and the [published HTML](https://docs.kernel.org/process/coding-assistants.html) still shows that section.

Jonathan Corbet applied Sasha Levin's v2 on 14 October. [docs-next commit 1e035297ffdadf2184c3c773b8c098e372324aaf](https://git.kernel.org/pub/scm/linux/kernel/git/docs/linux.git/commit/?h=docs-next&id=1e035297ffdadf2184c3c773b8c098e372324aaf), "docs: remove Assisted-by references," has Levin as author (13 October 2026, 08:15:01 -0400) and Corbet as committer (14 October 2026, 10:51:49 -0600). Corbet's [reply](https://lore.kernel.org/lkml/87o6cww7c1.fsf@trenco.lwn.net/raw) three minutes later is: "OK, I have applied this, thanks."

The docs-next copies of those two files no longer contain Assisted-by. [The Register](https://www.theregister.com/ai-and-ml/2026/10/14/linux-kernel-devs-drop-obligatory-confession-of-ai-tool-usage/5303140) and [PC Gamer](https://www.pcgamer.com/software/linux/linux-kernel-drops-ai-contribution-disclosure-rule-as-linus-torvalds-says-banning-the-tech-would-be-utterly-stupid/) headline that as a drop.

## Where the tag came from

The file entered Linus's tree as [commit 78d979db6cef](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=78d979db6cef557c171d6059cbce06c3db89c7ee). Levin authored it on 23 December 2025. Corbet committed it on 6 January 2026, 14:55:06 -0700. The original line named the tool and the model: `Assisted-by: AGENT_NAME:MODEL_VERSION [TOOL1] [TOOL2]`.

[Commit 816d9992d9ed](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=816d9992d9ed434ec52cfbd63080d518e535a41b), by Christian Brauner, shortened it. The message says naming the model "provides free advertising to proprietary software companies." The line still in torvalds/linux is `Assisted-by: LLM [TOOL1] [TOOL2]`. Corbet committed that change on 3 August 2026. [submitting-patches.rst](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/plain/Documentation/process/submitting-patches.rst) there still says an advanced coding tool must be acknowledged with an Assisted-by tag, and that leaving it off may impede acceptance.

## What Levin's v2 says the summit decided

Levin's first patch, on 9 October, was two sentences: "The Maintainers Summit reached consensus to deprecate the Assisted-by tag. Remove the documentation requiring it." Later that morning he withdrew it until LWN coverage was up. He wrote that it had not been on the schedule: he believed Jon asked if anyone still found the tag useful, and that nobody argued for keeping it.

[v2](https://lore.kernel.org/lkml/20261013121501.3738437-1-sashal@kernel.org/raw), sent 13 October, is the text Corbet applied. A July proposal to drop the tag had been turned down. Levin's count is: "Roughly 10% of the 18,533 non-merge commits in 7.3 through -rc7 carry an Assisted-by tag, while actual LLM use is far more widespread." He writes that there was "a strong, though not unanimous, consensus in the room to drop it." Greg Kroah-Hartman now supports removing it. Tool use, in that message, belongs in the cover letter. `generated-content.rst`, the Developer Certificate of Origin, and the submitter's responsibility stay.

## Pinchart's objection, and Torvalds's reply

Laurent Pinchart objected on the v1 thread the same day v2 went out. On 13 October at 14:31:32 +0200 he wrote: "I'm not happy removing the tag without adding another mechanism for required disclosure." Later, answering Kees Cook, he wrote: "What this is about is setting our expectations, telling what we want and what we don't want." He is not on the Acked-by or Reviewed-by lines of v2.

Torvalds answered that second note. The Date header is Tue, 13 Oct 2026 13:45:09 -0700. The [lkml.iu.edu copy](https://lkml.iu.edu/2610.1/13255.html) labels the same text "Tue Oct 13 2026 - 16:55:30 EST." His reply:

> No. What you are about is something entirely different. It has nothing to do with "expectations", and it has everything to do with your hangups.
>
> I don't understand this whole idiotic concept of "don't use AI for X".

He then writes two sample bans, one against compilers and one against editors, and asks:

> Do you not see how UTTERLY STUPID those kinds of rules would be?
>
> So no. We're not going to make stupid rules that say "you can't use tools for X".
>
> The kind of expectations *I* have is that people do their best and I expect people to understand what they are doing.
>
> But that understanding has very little to do with what tools they use.

Pinchart had asked for disclosure, and for human-written commit messages.

## What a patch owes today

[QGIS](/posts/qgis-bans-ai-assisted-contributions/) went the other way on 7 October 2026, merging a ban on LLM, AI or agent-assisted code in the qgis/qgis repository. Torvalds's page-cache branch, covered on [12 October](/posts/torvalds-claude-code-page-cache-patches/), put `Assisted-by: LLM` on each of the eight patches under the tip commit.

Until the docs-next commit reaches Linus's tree, the published docs still ask for the tag when an advanced coding tool was used. v2 also drops it from checkpatch and from the Italian, Brazilian Portuguese, and Traditional Chinese submitting-patches pages. It does not edit `generated-content.rst`.
