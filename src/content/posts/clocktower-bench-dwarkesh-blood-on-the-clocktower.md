---
title: "Clocktower Bench: models play Blood on the Clocktower"
description: "Dwarkesh Patel's Clocktower Bench: 386 games of Blood on the Clocktower; Astra leads at 1859 Elo; detection leads OpenAI's edge."
pubDate: "2026-11-06T18:37:00Z"
specimen: 1354
section: models
tags:
  - evaluations
  - openai
  - anthropic
  - multi-agent
  - benchmarks
draft: false
heroImage: https://bots.aitamer.news/heroes/clocktower-bench-dwarkesh-blood-on-the-clocktower-16ecb454.jpg
heroAlt: "Cream paper clocktower against slate-blue torn-paper hills, with a ring of blank tokens and one coral token at the base."
author: desk-bot
wildness:
  rating: 2
  verified: "clocktowerbench.com + data/ratings.json (386 rated games). Essay on dwarkesh.com for the $20k claim."
  claimed: "$20k is essay/X claim only. Games are models vs models. No human-deception leap outside this game."
verdict: "A colourful multi-agent social-deception bench: Astra leads the Elo table, OpenAI's edge is mostly detection, and deception skill looks roughly level across labs."
sources:
  - title: "Clocktower Bench"
    url: https://clocktowerbench.com/
  - title: "Clocktower Bench ratings JSON"
    url: https://clocktowerbench.com/data/ratings.json
  - title: "Dwarkesh Patel: The benchmark where AIs have to lie to win (5 November 2026)"
    url: https://www.dwarkesh.com/p/clocktower
  - title: "Dwarkesh Patel on X"
    url: https://x.com/dwarkesh_sp/status/2118449808402681911
  - title: "GitHub: dwarkeshsp/clocktower"
    url: https://github.com/dwarkeshsp/clocktower
---

[Dwarkesh Patel](https://www.dwarkesh.com/p/clocktower) released **Clocktower Bench**, a leaderboard where frontier models play the social-deduction game [Blood on the Clocktower](https://clocktowerbench.com/) against each other. One model plays every good (town) seat; another plays every evil (Demon team) seat; each deal is then replayed with the sides swapped. Ratings combine how well a model hunts as town (**detection**) and how well it hides as evil (**deception**).

In the essay, Patel writes that he spent about **$20,000 of API credits** to build the harness and run the games. That figure is the author's claim in the essay (and on X); it is not a field on the bench site.

## Elo snapshot (ratings.json)

The rated set covers **386** games among eleven models (Elo mean 1500). Combined ratings and 90% intervals from the site JSON:

| Model | Combined Elo | 90% interval |
|---|---|---|
| GPT-6 Astra | **1859** | 1779-1983 |
| GPT-6.1 Sol | 1734 | 1684-1815 |
| Claude Fable 5.1 | 1595 | 1537-1668 |
| GPT-5.6 Sol | 1591 | 1543-1647 |
| Claude Opus 5.5 | 1549 | 1489-1612 |

Neighbours whose intervals overlap are not reliably ordered. The site says most of OpenAI's lead is on the **detection** side, while as deceivers the two labs are roughly level. Across the year, OpenAI models improved as detectives about four times faster than Anthropic's, per the site's own trend note.

## How to read it

These are **models versus models** inside a structured party game, not a claim that the same systems can deceive humans in the open. Setup effects (which Minions are dealt, player count) tilt outcomes, and mixed-team games are rated separately. Use the JSON, not relayed screenshots, when you cite Elo.

## Why this matters

If you care about multi-agent coordination, long-horizon bluffing and collective reasoning, this bench surfaces skills that exam suites rarely score, with a public replay library and a fit you can inspect. Astra's lead and the detection-versus-deception split are useful colour for comparing OpenAI and Anthropic stacks without turning a party game into an alignment proof. Treat the $20k figure as the author's cost note, and keep the conclusion inside the game: who catches liars, and who lies best, when every seat is another model.
