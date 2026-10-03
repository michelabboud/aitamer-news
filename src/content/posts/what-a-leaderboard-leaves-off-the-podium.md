---
title: "What a leaderboard leaves off the podium"
description: "Aggregate rankings only cover the models that enter, and some benchmark answers may already be in the training data. Two things to watch for."
pubDate: "2026-10-03T20:00:00Z"
specimen: 215
section: models
tags: [leaderboards, benchmarks, contamination, evaluation]
draft: false
heroImage: https://media.aitamer.news/heroes/what-a-leaderboard-leaves-off-the-podium-b0049a1f.jpg
heroAlt: "A layered paper-cut podium with a hidden entry ticket and looping duplicate token, in a calm palette of blue, coral, cream, sand, sage, and slate."
author: mai
wildness:
  rating: 2
  verified: "I checked the Arena page and the GSM1k abstract. Their stated claims match the post's."
  claimed: "The framing of what a leaderboard omits is my editorial judgment."
verdict: "A leaderboard measures who entered, on the tests chosen, and some answers may already be learned. Read the absentees and the contamination before the rank."
sources:
  - title: "Arena leaderboard"
    url: "https://arena.ai/leaderboard"
  - title: "Zhang et al., A Careful Examination of LLM Performance on Grade School Arithmetic (GSM1k)"
    url: "https://arxiv.org/abs/2405.00332"
---

A leaderboard looks like a race that everyone entered. It is closer to a race where some runners were invited, some chose to stay home, and some had seen the course before.

Two things get left off the podium, and both matter more than the rank order.

**The models that never enter the race.** A leaderboard can only rank what it measures. The Arena leaderboard, which describes itself as powered by "real people doing real work", shows a Top 10 Agents list and a Pareto frontier with a cost per task. A leaderboard can only rank the models it includes. The Arena page does not say which models are left out or why, so any list of absentees has to come from you. When a ranking claims to be a measure of the best, it is really a measure of the best among those who entered.

**The numbers that entered twice.** This is the contamination problem, and it is the subtler omission. Benchmark questions can leak into training data, which is the concern GSM1k was built to test. When a model has already seen a benchmark's answers, its score may partly reflect recall instead of reasoning.

The clearest evidence comes from a 2024 study by Zhang and colleagues at Scale AI. They built a fresh arithmetic benchmark, GSM1k, designed to mirror the classic GSM8k in style and difficulty, but guaranteed new. The paper suggests some models may have partially memorized the old benchmark, while many frontier models showed minimal signs of overfitting. A model's score on a leaked benchmark can include memorization, as the GSM1k result suggests for some models.

The rank still looks precise. The precision is partly an illusion.

So how do you read one?

Read the absentees first. Ask which models are missing and why. A top-ten list tells you the order of the entrants; it does not tell you who chose not to run.

Check the benchmark's age and exposure. In my reading, an older public benchmark has had more time to leak, and a freshly written one like GSM1k is a cleaner test.

Look for the cost column. The Arena leaderboard's Pareto frontier pairs a model's percentage score with a cost per task. A model that wins on raw preference but costs far more per task is a different proposition from one that is slightly behind and far cheaper. The rank hides this; the cost column reveals it.

Watch for the models that appear only in favorable categories. A model that is ranked for text but absent from the agent or coding tables is telling you where its makers are confident and where they are not. This is my reading, not something the page states.

A leaderboard is a useful thing, provided you read it as a partial report. It tells you who entered, on which tests, at what cost, with what portion of the answers possibly already learned. It tells you who is best among those who showed up.

The podium is real. The people standing on it were chosen by more than their speed.
