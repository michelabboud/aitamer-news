---
title: The Bug Report Your AI Sends to a Human
description: Generated bug reports should give maintainers a reproducible case, observed behavior, and the environment needed to investigate it.
pubDate: "2026-10-07T20:30:00Z"
specimen: 376
section: voices
tags:
  - bug-reports
  - ai
  - open-source
  - maintenance
draft: false
heroImage: https://media.aitamer.news/heroes/the-bug-report-your-ai-sends-to-a-human-5e0738a7.jpg
heroAlt: A small robot presents a bug report with a diagram and code excerpt to a human reviewer.
author: ari
wildness:
  rating: 2
  verified: GitHub and MDN document reproduction steps, outcomes, environment details, and issue forms.
  claimed: Generated reports should meet that standard before asking for a maintainer's attention.
verdict: A generated issue earns attention when its steps, observations, and environment let someone else investigate the same failure.
sources:
  - title: Issue manager - GitHub Docs
    url: https://docs.github.com/en/copilot/tutorials/customization-library/custom-instructions/issue-manager
  - title: When and how to file bugs with browsers - MDN
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/File_browser_bugs
  - title: About issue and pull request templates - GitHub Docs
    url: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates
  - title: Creating an issue - GitHub Docs
    url: https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue
---

A bug report is a request for someone else's attention. The person who receives it has to decide whether the problem exists, where it lives, and what to try next. Generated prose can make that request sound polished. Polish does not supply the missing evidence.

GitHub's [example instructions for an issue manager](https://docs.github.com/en/copilot/tutorials/customization-library/custom-instructions/issue-manager) ask for a clear description, exact steps to reproduce, expected and actual behavior, environment details, and relevant logs or screenshots. Those fields describe a reasonable price of admission for any bug report. When a report is generated, the writer should check each field against an actual observation before sending the issue to a human.

## Reproduction steps carry the handoff

A title saying that saving fails identifies a symptom. It leaves the maintainer to guess which screen, which input, and which action led to it. Exact steps transfer that missing work back to the reporter, who is closest to the event.

Start with the state that matters. Name the route, command, or feature. Give the input in a form another person can use, with private data removed. List actions in order. End at the first visible failure. If a step depends on a setting or an earlier action, include it. If the failure is intermittent, say which attempts succeeded and which failed, using only observations you recorded.

A small reproduction is especially valuable. MDN's [guide to filing browser bugs](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/File_browser_bugs) recommends a minimal test case and explains that removing unrelated code and dependencies helps isolate the source. That lesson travels beyond browsers. A short case gives a maintainer a place to start and gives the reporter a chance to discover whether the suspected component is involved at all.

Generated text must never fill a gap with plausible steps. If nobody has repeated the failure, the report should say so. The next useful action is to reproduce it or ask the original observer for the missing sequence.

## Observed behavior belongs beside expected behavior

A report should put the outcome next to the expectation. Describe what appeared on screen, what a command returned, or what the application stored. Then state the behavior the reporter expected, with the reason when it is known. A failed expectation alone does not show what happened. A surprising outcome alone does not show why it is a defect.

GitHub's [issue manager example](https://docs.github.com/en/copilot/tutorials/customization-library/custom-instructions/issue-manager) separates expected from actual behavior. That separation also keeps interpretation in its proper place. A reporter can observe that a request failed. Naming a root cause requires more evidence. If the cause is a hypothesis, label it as one and attach the log or code path that prompted it.

The same discipline applies to screenshots and logs. Attach the portion that demonstrates the result, explain when it was captured, and remove secrets and personal information. A long dump without a pointer makes the recipient search for the event again. A cropped image without context can hide the state needed to reproduce it.

## Environment details narrow the search

A reproducible sequence can still fail on another machine if the environment differs. Record the operating system, browser or client, application version, relevant dependencies, and configuration that bears on the failure. These are the environment details named in GitHub's [bug report essentials](https://docs.github.com/en/copilot/tutorials/customization-library/custom-instructions/issue-manager).

Include the exact value when you know it. If you do not know it, say that it is unknown. Do not let generated prose infer a version from a screenshot or fill an empty field with a likely default. An empty field is visible uncertainty. An invented value can send an investigation in the wrong direction.

Scope matters as much as completeness. A browser rendering issue may need a browser version and a small page. A command failure may need the command, its input, and the relevant runtime. Add details that help someone repeat or distinguish the failure. Leave out a machine inventory that adds noise without explaining the case.

## A form can enforce the pause

GitHub says [issue forms](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates) can collect structured information and mark inputs as required. A team can use that feature to ask for reproduction steps, observed behavior, expected behavior, and environment before submission. The form creates a moment to check the report.

Required fields cannot verify their contents. A generated paragraph can satisfy a field while leaving its claims untested. The useful rule is stricter: every factual sentence in the report should trace to an observation, a log, a test case, or a clearly identified source. Where that trail ends, the report should mark the gap.

Before opening a new issue, search for an existing one. MDN advises searching before filing browser bugs, then adding useful new findings to a matching report. GitHub's [issue creation guide](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue) also describes suggestions for potential duplicates while a new issue is being written. The same care applies to a generated draft: it should carry fresh evidence into the existing conversation when one already covers the problem.

## What to do

1. Reproduce the failure yourself, or identify the person who observed it and ask for their exact sequence. Record which parts you have verified.
2. Write numbered steps from a known starting state through the first failure. Reduce the case until each remaining step matters.
3. Put the actual result next to the expected result. Keep suspected causes in a separate, clearly labeled sentence.
4. Add the environment values that affect reproduction. Attach a focused screenshot or log excerpt when it shows the failure, after removing private data.
5. Search existing issues, then submit the report where it belongs. If a key fact is still missing, ask for it in the draft rather than manufacturing an answer.

A report should let a stranger attempt the same failure and judge the evidence. Generated language can organize that work. The responsibility for the facts stays with whoever sends the issue.
