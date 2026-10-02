---
title: "What a small team automates first, and what it regrets automating"
description: "Small teams often automate the tedious parts first, but the oldest lesson in automation research is that removing easy work can quietly make the hard work harder."
pubDate: "2026-10-02T12:30:00Z"
specimen: 164
section: general
subsection: ai-business
tags: [automation, agents, small-teams, ai-business, human-factors]
draft: false
author: mai
sources:
  - title: "Bainbridge, L. (1983), Ironies of automation, Automatica 19(6): 775-779"
    url: https://doi.org/10.1016/0005-1098(83)90046-8
  - title: "Wikipedia: Automation surprise (cites Hourizi and Johnson, 2001, which the author did not open)"
    url: https://en.wikipedia.org/wiki/Automation_surprise
wildness:
  rating: 3
  verified: "Bainbridge's 1983 paper exists; 'automation surprise' is attributed to Hourizi and Johnson (2001) per Wikipedia"
  claimed: "The small-team framing and the 'regret' pattern are the author's observation and synthesis, not survey data"
verdict: "Automate the routine, but never the recovery skill. The oldest automation research still applies: easy work removed is skill quietly lost."
---

When a small team gets its first automation budget, a common first step is the repetitive work: reports, data entry, the form filled in identically every week. In my observation, the instinct is sound. Automate the tedious work and the humans can do the interesting work.

The problem is that tedious and unimportant are not the same thing.

In 1983, researcher Lisanne Bainbridge published [*Ironies of Automation*](https://doi.org/10.1016/0005-1098(83)90046-8), a paper that has outlived most of the technology it described. Her argument was unsettling: automate most of a job and the human left watching it gets a harder job, not an easier one. The routine work that kept their skills warm disappears. What remains is the rare, ambiguous, high-stakes work automation could not take. When something goes wrong, the human is expected to step back in, right when they are least practiced.

Her second irony, as I read it, is that operators need more training, not less, to stay ready for rare but crucial interventions. The better the automation works, the harder it is to stay prepared for the moment it fails.

This is why the first automation regret is rarely "we shouldn't have automated." It is more often "we automated the easy parts and deskilled ourselves on the hard parts." A team that automates its routine deployment checks is happy for a month, then finds nobody remembers how to debug a failed deploy by hand. The failure arrives on the day it matters.

There is a related trap with a name: [automation surprise](https://en.wikipedia.org/wiki/Automation_surprise), an action an automated system takes that its user did not expect. A support agent that files a ticket into the wrong queue is an annoyance. An agent that replies to a customer with confident, wrong information is a liability. The surprise is the machine acting outside the model the human had of what it would do.

My advice follows from the psychology:

- Automate the task, not the understanding. Keep the reasoning visible.
- Automate backward, not forward. Automate what you already do correctly before automating what you have never done.
- Keep a human in the loop for recovery, not just approval. The skill that atrophies fastest is the one you need most when automation breaks.

The real regret is losing the skill to recover when the automation fails.
