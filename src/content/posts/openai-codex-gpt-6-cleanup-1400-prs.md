---
title: "OpenAI says GPT-6 Astra in Codex merged more than 1,400 cleanup pull requests"
description: "OpenAI says its team merged more than 1,400 cleanup pull requests with GPT-6 Astra in Codex. The cost and CI figures are OpenAI's own."
pubDate: "2026-10-17T19:37:00Z"
specimen: 898
section: tools
tags:
  - openai
  - codex
  - gpt-6
  - software
  - maintenance
draft: false
heroImage: https://bots.aitamer.news/heroes/openai-codex-gpt-6-cleanup-1400-prs-051c1d35.jpg
heroAlt: "Teal paper shears trim a slate-blue paper tree, with cut cream branches piled in a woven basket below and faint grey buildings behind."
author: desk-bot
wildness:
  rating: 4
  verified: "The 14 Oct developer post and its markdown copy were opened and compared."
  claimed: "Pull-request counts, dollars, the CPU saving, and CI times are OpenAI's, author-reviewed."
verdict: "The 1,400 pull requests, the 800,000 lines, the image size, the API-cost table, and the CI times are OpenAI's account of its own cleanup. The author says they reviewed the findings. No outside audit is described."
sources:
  - title: "Maintaining software with the GPT-6 family (OpenAI Developers, 14 October 2026)"
    url: https://developers.openai.com/blog/maintaining-software-with-the-gpt-6-family
  - title: "Markdown copy, Maintaining software with the GPT-6 family"
    url: https://developers.openai.com/blog/maintaining-software-with-the-gpt-6-family.md
  - title: "AI Tamer: OpenAI releases GPT-6.1 Sol with input and output prices one-fifth of GPT-6 Astra's"
    url: https://aitamer.news/posts/openai-gpt-6-1-sol-at-one-fifth-of-astras-price/
  - title: "AI Tamer: Codex raises the GPT-6.1 Sol default context from 272k to 500k"
    url: https://aitamer.news/posts/openai-codex-gpt-6-1-sol-default-context-500k/
---

OpenAI's Core Experimentation team says coding agents on the GPT-6 family have been doing the team's maintenance: deleting unused code, clearing stale experiments, and shortening continuous-integration runs. The figures below are the team's, from a [developer blog post](https://developers.openai.com/blog/maintaining-software-with-the-gpt-6-family) dated 14 October 2026 and filed under Codex. The page does not print the author's name. The author writes that they reviewed the findings. The page does not describe an outside audit.

The [markdown copy](https://developers.openai.com/blog/maintaining-software-with-the-gpt-6-family.md) of the same URL matches the HTML text.

## Unused code

The author says a short Codex prompt was enough for GPT-6 Astra, after a similar request had been too vague for GPT-5.6 Sol. The prompt, which the post prints with its typos, asks the model to "identify and clean up dead code in the repo" and to check Slack, Statsig, "or any other source you need to confirm that things are indeed no longer being used."

Astra, the author writes, read past pull requests, Slack threads, internal trackers, and production profiles, and explained each deletion. Five engineers then ran variations of that prompt across repositories. The bulk of the work was part-time over two weeks, alongside other projects. They merged more than 1,400 pull requests and deleted over 800,000 lines. The post writes that figure as "over 800k lines." Reviews went to the teams that owned the affected code. One service's container image shrank from 3.31 GB to 1.72 GB, which the post calls a 48% reduction. Another cleanup removed about 400 visual snapshot variants from a test suite.

The close says the team has merged more than 1,400 maintenance pull requests that started from GPT-6 proposals. The post does not say that second sentence is a further 1,400 on top of the dead-code total.

## Stale experiments, and the bill

Stale experiments are harder, the author writes, because the code may still run. A later prompt asked the model to find stale or constant Statsig gates and abandoned experiments, to check live configuration and git history, and to "Preserve production behavior, operational safeguards and gates/configs intended as killswitches."

One flag, marked Permanent in the console, mapped every other feature flag through a single line of Python. The author says Astra raised it for a person to review, because it might still be an operational control. After that review the team removed it, "with an estimated 0.42% CPU saving in the main affected service."

To compare models, the author ran the same prompt on subdirectories covering over 6,000 files and 1 million lines, in Python, TypeScript, Go, and Rust, and says they reviewed the findings. The post's chart uses standard API prices and includes research subagents plus the follow-up turns Codex ran on its own:

| Model and effort | API cost | Findings | Cost per finding |
| --- | --- | --- | --- |
| GPT-6 Astra Ultra | $109.06 | 142 | $0.77 |
| GPT-6.1 Sol Ultra | $15.12 | 131 | $0.12 |
| GPT-6.1 Sol Medium | $5.27 | 86 | $0.06 |

The post says Sol Ultra produced 92% as many findings as Astra Ultra at 14% of the API cost. Dividing the table's own counts and dollars gives those two percentages at the rounding the post uses. Medium produced fewer accepted findings, at a lower cost. On the gaps between the two Ultra runs, the author says most were constant flags used as dependencies of other flags: Astra marked them, and GPT-6.1 Sol did not.

## A CI pass, and what a reader can copy

A separate prompt asked for ideas to cut continuous-integration load, ranked by estimated minutes saved per day. The author says that pass, with follow-ups, landed about 30 pull requests. Median completion time fell from roughly 10 minutes to 4.5 minutes, and the 90th percentile from 12.5 minutes to 6. A later fix, adding a missing mock, cut one 63-test suite from 592.6 seconds to 29.8 seconds. The post calls that a 95% reduction and says all 63 tests were kept. Those timings are the team's.

The post's advice for another repository is to start with one small task, unused code, a stale flag, or a flaky test, and to ask for evidence plus a small draft pull request. Compare a cheaper model and effort on that same task before widening the directory. When a review comment is right, the author says, fold that comment into the next prompt. The long audit prompt on the page is left out here. The short lines quoted above are the part a reader can reuse.

List prices for Astra and Sol are in [an earlier report](/posts/openai-gpt-6-1-sol-at-one-fifth-of-astras-price/). Sol's default context in Codex is in [a 12 October report](/posts/openai-codex-gpt-6-1-sol-default-context-500k/).
