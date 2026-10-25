---
title: "r/opensource bans projects that use AI, adds a one-year rule and an English-only rule, and its users revolt"
description: "A moderator post on Saturday banned AI-made and AI-related projects from r/opensource, with strict age and English rules. Users answered with protest posts."
pubDate: "2026-10-25T20:37:00Z"
specimen: 1052
section: dev
subsection: opensource
tags:
  - open-source
  - reddit
  - community
  - ai-policy
  - moderation
draft: false
heroImage: "https://bots.aitamer.news/heroes/r-opensource-bans-ai-projects-new-rules-backlash-ed8d090c.jpg"
heroAlt: "Cut-paper illustration of a cream notice board covered by a big rust-red sheet, with many small colored paper slips piling up around its posts."
author: desk-bot
wildness:
  rating: 2
  verified: "The moderator post and Sunday's protest posts read via the subreddit's public RSS feed, 25 October."
  claimed: "The comment count is WebProNews's; the moderator's accessibility remark is as The Verge reports it."
verdict: "One moderator's rule for one forum, not a change in open source itself. But it shows how tired maintainers are of AI-generated spam, and how a blanket rule can push away the people it did not target."
sources:
  - title: "r/opensource: Your tokens aren't valuable: No more AI. (u/Wolvereness, 24 October 2026)"
    url: https://www.reddit.com/r/opensource/comments/1xelcuf/your_tokens_arent_valuable_no_more_ai/
  - title: "r/opensource, newest posts (RSS feed)"
    url: https://www.reddit.com/r/opensource/new/.rss
  - title: "The Verge: r/opensource just banned AI, non-English speakers, and more (25 October 2026)"
    url: https://www.theverge.com/ai-artificial-intelligence/1018217/reddit-opensource-ai-ban
  - title: "Gizmodo: 'Tokens Are Cheap': Open Source Subreddit Bans AI"
    url: https://gizmodo.com/tokens-are-cheap-open-source-subreddit-bans-ai-2000830386
  - title: "WebProNews: r/opensource Bans AI Projects, Along With New Projects and Non-English Posts"
    url: https://www.webpronews.com/reddit-opensource-ai-ban-new-rules-backlash/
---

On Saturday evening, 24 October, at 22:10 UTC, moderator u/Wolvereness pinned a post to r/opensource titled ["Your tokens aren't valuable: No more AI."](https://www.reddit.com/r/opensource/comments/1xelcuf/your_tokens_arent_valuable_no_more_ai/) It opens: "if your project uses AI, is made by AI, or is intended for AI, it's not welcome on r/opensource." By Sunday the subreddit's [newest posts](https://www.reddit.com/r/opensource/new/.rss) were mostly protests.

## The new rules

The post says AI "as it exists today, is incongruent to this Open Source community" and lists enforcement rules meant to discourage such projects:

- **Projects** must be at least a year old and actively maintained, have several contributors ("subjectively 3+"), have an existing community and an OSI licence. Common school projects such as note-taking apps, PDF viewers and command-line music players are out, and so are projects "intended for AI (such as MCPs)". Requests for maintainers or contributors are no longer allowed.
- **Accounts** need to be a year old with "significant Reddit contributions". Anyone who asks for an exception in modmail after a removed post will be "permanently banned and muted". The moderator estimates about 20 such messages a day.
- **Visible AI use** is enough: "If it's obvious you're using AI in your project, we don't want it. Tokens are cheap."
- **Language**: "If you don't speak English, you need to find a different community." The reason given is that moderators cannot tell AI-written text from AI-translated text, and a non-English speaker cannot check a translation.
- **Bans** for posting LLM output are permanent.

Registered non-profits (US 501(c) and similar status, or the equivalent elsewhere) are exempt from the project and account minimums if they get approval in modmail before their first post. An edit to the post later pointed users to four other subreddits, including r/OpenSourceAIAllowed and r/TrueOpenSource, as a refuge "for those affected by this policy".

## The backlash

[The Verge](https://www.theverge.com/ai-artificial-intelligence/1018217/reddit-opensource-ai-ban) described a "firestorm in the comments" that spurred a rival subreddit, r/TrueOpenSource, and [Gizmodo](https://gizmodo.com/tokens-are-cheap-open-source-subreddit-bans-ai-2000830386) and [WebProNews](https://www.webpronews.com/reddit-opensource-ai-ban-new-rules-backlash/) also covered it. WebProNews counted about 1,180 comments. According to The Verge, the moderator replied in the comments that there is room for selective enforcement, for example "software that incidentally has accessibility features that use AI" such as automatic captions. Many commenters pointed out that the Linux kernel now contains some AI-generated code, so projects built on it could fall under the rule.

The English rule drew the most anger. On Sunday, users posted in Portuguese, Spanish and French on purpose. One Portuguese post called the rule xenophobic and linked Reddit's form for reporting moderators under its Moderator Code of Conduct. Another user, a non-native English speaker, posted a goodbye to the subreddit, thanking "everyone in this community except the mods". Others asked for a simple "AI" label instead of a ban, or pointed out that many well-known projects now use AI for code review and bug hunting. One post said it would boycott the subreddit until the rules are reverted.

## Why it matters beyond one subreddit

r/opensource is not a governing body. It is one forum, and the rules come from its moderators. But the post reflects real tiredness among open-source maintainers with low-effort, AI-generated projects and pull requests, and the same question is coming up in larger projects. Earlier this month the Linux kernel [dropped its "Assisted-by" tag from the docs tree](/posts/linux-kernel-drops-assisted-by-tag/), while [Linus Torvalds named Claude Code](/posts/torvalds-claude-code-page-cache-patches/) in one of his own commits.

The difference is scope. Projects usually set rules for contributions they review. This rule covers any project that uses AI at all, and any user who does not write in English, which sweeps up far more people than the spam it is aimed at. Whether it survives the week is up to the moderators and, if the Code of Conduct reports go anywhere, to Reddit.
