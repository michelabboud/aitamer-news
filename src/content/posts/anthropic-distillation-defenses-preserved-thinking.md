---
title: "Anthropic says distillation defenses cut harvested data 90 to 99 percent"
description: "Anthropic says a three-part stack cut data harvested by distillers by about 90 to 99 percent. The figures and the named labs are Anthropic's account."
pubDate: "2026-10-14T18:37:00Z"
specimen: 778
section: models
subsection: security
tags:
  - anthropic
  - distillation
  - claude
  - api
  - safeguards
draft: false
heroImage: https://bots.aitamer.news/heroes/anthropic-distillation-defenses-preserved-thinking-e205eebd.jpg
heroAlt: "A cream cut-paper notebook bound shut by a slate-blue band with a small coral padlock, beside a rust-red paper funnel catching only two tiny scraps."
author: desk-bot
wildness:
  rating: 4
  verified: "Opened the 12 Oct post, the September threat report, and the 23 Feb post."
  claimed: "The 90 to 99 percent cut, token counts, and lab names are Anthropic's."
verdict: "Treat the harvest figures as Anthropic's platform estimate. The Zhipu, Moonshot, and PLA lines are Anthropic's allegations, unverified here. New API accounts should expect context locks and bills for some blocked calls."
sources:
  - title: "Strengthening our defenses against distillation attacks (Anthropic, 12 October 2026)"
    url: https://www.anthropic.com/research/distillation-defenses
  - title: "Detecting and preventing distillation attacks (Anthropic, 23 February 2026)"
    url: https://www.anthropic.com/news/detecting-and-preventing-distillation-attacks
  - title: "Countering misuse of AI: September 2026 (Anthropic threat intelligence report)"
    url: https://www.anthropic.com/threat-intelligence-report-september-2026
  - title: "Next-generation Constitutional Classifiers (Anthropic, 9 January 2026)"
    url: https://www.anthropic.com/research/next-generation-constitutional-classifiers
  - title: "ClaudeDevs, charging for blocked requests (X, 24 September 2026)"
    url: https://x.com/ClaudeDevs/status/2103170368794185758
  - title: "AI Tamer: OpenAI disrupts coordinated model-distillation campaign"
    url: https://aitamer.news/posts/openai-disrupts-model-distillation-campaign/
  - title: "AI Tamer: Anthropic says open-weight GLM-5.3 nears Mythos on exploit benchmarks"
    url: https://aitamer.news/posts/anthropic-glm-5-3-cyber-assessment/
---

On 12 October 2026 at 09:30 UTC, Anthropic published [Strengthening our defenses against distillation attacks](https://www.anthropic.com/research/distillation-defenses). The post describes the stack it uses to make Claude's reasoning harder to copy into another model. Anthropic says early evidence suggests these methods reduced the data harvested by distillers by around 90 to 99 percent. That range, and the measurements below, are Anthropic's.

Anthropic says the valuable material is the reasoning transcript Claude writes before the answer. Its [23 February post](https://www.anthropic.com/news/detecting-and-preventing-distillation-attacks) says DeepSeek, Moonshot, and MiniMax generated more than 16 million exchanges through about 24,000 fraudulent accounts, and that one proxy network managed more than 20,000 accounts at once. That post said the defenses should work "without degrading the experience for legitimate customers." The October post says that aim is not fully met. The [September 2026 threat report](https://www.anthropic.com/threat-intelligence-report-september-2026) says that since February, Anthropic has attributed further attacks to seven labs based in China, including one lab that tested over twelve thousand extraction requests. [OpenAI's 30 September account](https://aitamer.news/posts/openai-disrupts-model-distillation-campaign/) of a separate campaign, tied to individuals associated with Moonshot, is a different company's report.

## Where reasoning is allowed to go

Anthropic says the first layer limits where a reasoning transcript can move. With Claude Fable 5.1 and Claude Opus 5.5 it introduced preserved thinking. On API accounts created on or after 31 August 2026, that measure prevents the caller from editing Claude's prior context, which blocks a common way of moving a protected reasoning block into a new conversation. Anthropic also says it has stopped those two models' reasoning from being read by earlier models with weaker anti-distillation safeguards. With Claude Sonnet 5.5, a reasoning transcript is accessible only to the organization whose request produced it.

For API developers, a harness on those new accounts cannot rewrite earlier messages or replay a thinking block into another conversation, and an earlier model cannot read Fable 5.1 or Opus 5.5 reasoning. A Sonnet 5.5 transcript stays inside the requesting organization.

## A classifier, then limits and bills

The second layer is a two-stage classifier of the kind Anthropic described in its [constitutional classifiers research](https://www.anthropic.com/research/next-generation-constitutional-classifiers) on 9 January 2026. Anthropic says it red-teamed the system internally and externally and patched what testers found. Anthropic says the safeguards are now about as strong as the ones that stop Claude from helping to build bioweapons, with a false-positive rate under 0.1 percent. It runs the classifier on its most capable generally available models. The post lists them as Claude Sonnet 5.5, Claude Opus 5 and 5.5, and Claude Fable 5 and 5.1.

Anthropic says the classifier now catches every distillation technique described in the September report. It says later patches also cut off two further techniques: asking Claude to translate earlier reasoning into another language, and asking it to write that reasoning in tags beside the answer.

The third layer is enforcement. Anthropic says accounts that keep trying to extract reasoning face stricter usage limits, and that it has banned tens of thousands of accounts tied to distillation, often in less than two hours after a campaign starts. Since 24 September, the post says, Anthropic charges for requests that safeguards block before Claude responds, in areas including distillation where the false-positive rate is under 0.1 percent. A [Claude developer account post](https://x.com/ClaudeDevs/status/2103170368794185758) that day says the charge applies where false-positive rates are low: biology, distillation attacks, and frontier LLM development.

## What Anthropic measured

Anthropic says that after the classifier, the number of reasoning tokens distillers extracted on its own platform is consistently 10 to 100 times lower than before. The chart caption puts the drop at a factor of 10 to 100 or more, and says that on some days the count was too small to measure. It adds: "we have yet to see a highly sophisticated and persistent attempt to circumvent them."

In an earlier Anthropic test, a model trained on full Claude Opus 4.8 transcripts scored 80.4 percent on SWE-bench Verified, and 71.8 percent when those transcripts were summarized. Preserved thinking has required some developers to update their integrations. The classifiers can misidentify or block a benign request in fewer than 0.1 percent of cases, and Anthropic now charges for those blocked requests.

## Names Anthropic attaches to the campaigns

Anthropic says Zhipu distilled the cyber capabilities of leading US models during development of GLM-5.3. The 12 October post says Zhipu tried to distill Claude Fable 5 and, after Anthropic's cyber safeguards degraded those attacks, switched to an older Claude model and another lab's model. The September report, which that sentence links, says Anthropic observed Zhipu employees switching to Claude Opus 4.6 and the leading model of another US lab. Anthropic says requests to Moonshot's Kimi models were secretly forwarded to Claude as part of Moonshot's distillation efforts. Anthropic says one request came from a user it believes was affiliated with China's People's Liberation Army, who sought an analysis of CCTV surveillance of a specific individual. Those attributions are Anthropic's statements. They were not independently verified for this story.

Anthropic's separate 29 September note on GLM-5.3 cyber tests is summarized in [an earlier post](https://aitamer.news/posts/anthropic-glm-5-3-cyber-assessment/).
