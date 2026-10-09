---
title: What “hallucination” gets wrong
description: A plausible falsehood is easier to inspect when you distinguish an unverified citation, an unsupported citation, and a fabricated source.
pubDate: "2026-10-10T19:00:00Z"
section: voices
tags:
  - voices
  - ai
  - hallucinations
  - verification
draft: false
heroImage: https://media.aitamer.news/heroes/what-hallucination-gets-wrong-dcfedaa2.jpg
heroAlt: A paper magnifying lens examines distinct damaged and mismatched evidence fragments beneath an empty quotation frame.
author: mai
wildness:
  rating: 2
  verified: The plausible-falsehood framing and evaluation account come from the paper's abstract and introduction.
  claimed: The citation categories, train premise, and repair list are my own framework.
verdict: Separate unverified, unsupported, and fabricated citations before deciding how to repair the answer.
sources:
  - title: Kalai et al., Why Language Models Hallucinate
    url: https://arxiv.org/html/2509.04664v1
---

“Hallucination” is a convenient word for an answer that sounds plausible and is false. It is also too broad to tell you what failed.

Kalai, Nachum, Vempala, and Zhang describe language-model hallucinations as plausible falsehoods and distinguish this error mode from human perceptual experience. Their statistical framework discusses errors learned by base models and argues that training and evaluation can preserve overconfident guessing when correct answers are rewarded while abstention is treated as failure. That is their research framework, not proof that every false answer has one cause, that every model behaves alike, or that a model is intentionally lying.

I find more useful labels at the point of inspection. An unverified citation is a reference I have not yet checked. An unsupported citation is a real source that does not support the claim attached to it. A fabricated source is a source presented as real when the cited work or record does not exist, or when the supposed source is invented. Those categories should not be collapsed: a real paper can be misused, while an invented paper cannot be checked as cited. A contradicted premise means the answer conflicts with a fact in the question. An unverifiable detail might be true, but the answer gives no route for checking it.

Consider a fully fictional prompt: “A train leaves at 10:00. The journey takes 40 minutes. What time does it arrive? The prompt also states that no timetable exists for this fictional train.” An answer saying 10:40 is checkable arithmetic. An answer saying “the fictional timetable confirms 10:40” presents a fabricated source because the premise explicitly says no such timetable exists. If an answer instead cites a real timetable that has simply not been checked, the citation is unverified. If that real timetable concerns another route and does not support the arrival claim, it is unsupported. An answer saying 11:40 contradicts the stated journey time. An answer saying “it will arrive on platform 3” adds an unverifiable detail because the premise says nothing about platforms.

The labels change the repair. Check an unverified citation. Correct or remove an unsupported one. Remove a fabricated source and investigate the claim independently. Return to the supplied facts when the premise is contradicted. Mark an unverifiable detail as uncertain or ask for evidence.

I prefer this vocabulary because it turns a dramatic noun into a work list. “Hallucination” can describe the symptom. The more useful question is what, precisely, went wrong.
