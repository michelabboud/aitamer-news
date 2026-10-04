---
title: The Person Who Never Opened the AI App
description: An AI output can shape someone’s life even if that person never used the system. Risk reviews need to follow the output to the people it reaches.
pubDate: "2026-10-07T21:30:00Z"
specimen: 378
section: voices
tags:
  - ai-risk
  - affected-communities
  - accountability
  - product-design
draft: false
heroImage: https://media.aitamer.news/heroes/the-person-who-never-opened-the-ai-app-b19321d9.jpg
heroAlt: An AI-generated document branches toward professionals and institutions around a person who did not open the app.
author: ari
wildness:
  rating: 2
  verified: NIST says affected communities are not always direct users of an AI system.
  claimed: Following an output can reveal people a user list misses.
verdict: Review the path from output to decision. Give people affected by that path a way to find errors, challenge outcomes, and receive a response.
sources:
  - title: "NIST AI Risk Management Framework: Framing Risk"
    url: https://airc.nist.gov/airmf-resources/airmf/1-sec-risk/
  - title: "NIST AI Risk Management Framework: AI RMF Core"
    url: https://airc.nist.gov/airmf-resources/airmf/5-sec-core/
---

Imagine a manager using an AI app to draft an employee review. The manager sees the prompt and can reject the draft. The employee sees only the finished review. If the draft contains a mistake that survives editing, the employee may have to explain it without ever knowing where it began.

This is a hypothetical case. Its point is simple: the person using a system and the person living with its output can be different people. A risk review that counts only users can miss the person with the most at stake.

## The user list leaves people out

A user list can tell a team who has an account. It cannot show every place an output goes. A summary can be copied into a decision. A recommendation can be repeated in a meeting. A generated description can become part of someone’s record. Each step puts distance between the system and the person described by it.

The [National Institute of Standards and Technology’s risk framework](https://airc.nist.gov/airmf-resources/airmf/1-sec-risk/) says that harms may affect individuals, groups, communities, organizations, and wider society. It also says that communities who may be harmed are not always direct users of a system. That observation changes whose perspective belongs in a review.

In the employee example, asking the manager whether the draft was useful answers one question. Asking how the employee could spot and challenge a wrong claim answers another. Both questions matter. They concern different people with different access to the output and different power over its use.

## Follow the output into the decision

A team can start by tracing what happens after an output appears. Who reads it? Who can edit it? Where is it stored? Does it help someone make a decision about another person? Could the person concerned see the claim and correct it?

These are questions about a proposed use, not claims that every AI system works the same way. An output used as a private writing aid has a different path from one placed in a case file. The same words can carry different consequences in those settings.

NIST’s [framework core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/) calls for understanding the setting in which a system is used, including potential impacts on individuals and communities. It says that engagement with people outside the team can help check assumptions about that setting. A team that follows the output can see where its own knowledge ends and whose account is missing.

## Give affected people a way to speak

People outside a user list may have no account, feedback button, or contact with the team that built the system. A feedback route has to meet them where the output reaches them. In the employee example, that could mean a clear way to contest a statement in the review and a person responsible for examining the contest.

A form alone is weak if nobody can change the result. The route needs an owner, a response, and a record of what happened. It also needs to account for people who cannot identify the system behind a decision. The organization using the output may be the only place they know to raise a concern.

NIST’s [framework core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/) includes feedback and appeal processes for end users and impacted communities. It also calls for input from outside the development team and for communicating incidents and errors to affected communities. These are useful tests for a feedback route: can a concern arrive, can it affect a decision, and can the people concerned learn what followed?

## Count the cost of being wrong

A risk review needs more than a tally of mistakes. It needs to ask what a mistake would mean for each person it reaches. The manager in the example might spend time correcting a draft. The employee might face a disputed claim in a review. Those costs differ even when they begin with the same sentence.

NIST describes risk in terms of both the likelihood of an event and the magnitude of its consequences. It cautions that measures can miss differences between affected groups and settings. It also says that measurements made in controlled settings may differ from risks that emerge in use ([framing risk](https://airc.nist.gov/airmf-resources/airmf/1-sec-risk/)). A team should therefore look beyond whether an output appears accurate during a test. It should examine how the output will be used, who can correct it, and what happens when correction comes late.

## What to do

Start with one real use of the system. Draw the path from output to action. Name each person who can receive, rely on, or be described by that output, including people without accounts.

Next, ask someone outside the product team to challenge that map. Include people who understand the setting and, where appropriate, people who may be affected. Record what the team learned and what remains uncertain.

Then make correction possible at the point where the output matters. Give the person affected a clear route to report an error or appeal an outcome. Assign someone to review the concern and change the record or decision when warranted. Check whether that route works after the system is in use.

Finally, revisit the map when the use changes. A new audience, a new decision, or a new place to store outputs can bring new people into their path. The person who never opened the app still belongs in the review.
