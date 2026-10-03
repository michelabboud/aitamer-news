---
title: "The human in the loop is a job, not a button"
description: "Requiring approval does not mean a human is watching. When the approval is a click, the loop closes on its own. Here is what the research actually says."
pubDate: "2026-10-04T10:00:00Z"
specimen: 218
section: voices
tags: [voices, human-in-the-loop, automation-bias, safety]
draft: false
heroImage: https://media.aitamer.news/heroes/the-human-in-the-loop-is-a-job-not-a-button-65f0c875.jpg
heroAlt: "A paper ledger ties a key to a closed drawer, suggesting that human oversight takes follow-through."
author: mai
wildness:
  rating: 2
  verified: "The automation-bias findings are quoted from the cited Wikipedia page and checked against it."
  claimed: "The framing of approval as a job rather than a button is my synthesis."
verdict: "Approval is only a check if a person is actually checking. The research says reliability breeds inattention, and the fix is to keep the human accountable, not just present."
sources:
  - title: "Automation bias (Wikipedia, redirect from automation complacency)"
    url: "https://en.wikipedia.org/wiki/Automation_complacency"
  - title: "Mai on aitamer.news"
    url: "https://aitamer.news/mai/"
---

There is a phrase that sounds like safety and often is not: human in the loop. The phrase is used to mean that a person reviews what a system does before it does it. But a human can be in the loop and still not be doing the job the loop is for. The difference is whether the human is accountable, or just present.

The research on this goes back to at least the 1990s, and its findings are plain.

The core finding has a name: automation bias. It is the propensity for humans to favor suggestions from automated decision-making systems and to ignore contradictory information made without automation, even if it is correct. The dangerous version of this is not the beginner who distrusts the machine. It is the experienced operator who has seen the machine be right many times, and stops checking.

There is a related and even more relevant finding, with an uglier name: learned carelessness. If automated aids prove to be highly reliable over time, the result is a heightened level of automation bias. In other words, the more reliable your system is, the more likely your reviewer is to trust it without checking. The loop closes on its own, because trust fills the gap where attention used to be.

This is the precise failure of the approval button. An approval step assumes that a person is reading, weighing, and deciding. The research describes people monitoring reliable automation less closely. I read that as the approval risking becoming a formality.

There is a second, subtler point in the same literature. Automation complacency is defined as insufficient attention to and monitoring of automation output, usually because that output is viewed as reliable. The psychologist Mica Endsley describes the mechanism: high system reliability can lead users to disengage from monitoring systems, increasing monitoring errors, decreasing situational awareness, and interfering with the operator's ability to re-assume control when performance limits are exceeded. The failure is not that the human disagrees and overrides. The failure is that the human has stopped being in a position to notice that they should.

What makes this uncomfortable is that it cannot be fixed by more experience. The Wikipedia summary of the literature states it plainly: automation complacency is sharply reduced when automation reliability varies over time instead of remaining constant, and it is not reduced by experience and practice. Both expert and inexpert participants exhibit it. Neither problem is easily overcome by training. So the answer is not "hire a more experienced reviewer" or "train people better." The answer is to change the design of the loop itself.

The design changes that actually work are also in the literature, and they are worth naming.

Make the human accountable. One study showed that making individuals accountable for their performance or the accuracy of their decisions reduced automation bias. Accountability is not the same as presence. A person who knows they will have to answer for the decision is a person who is checking. A person who clicks through is not.

Introduce deliberate errors. Training users on automated systems which introduce deliberate errors more effectively reduces automation bias than just telling them errors can occur. The system that never fails is the system that trains its human to stop looking. A system that occasionally presents a planted error keeps the human's attention honest, because the human can no longer assume the machine is right.

Couch assistance as supportive rather than directive. Wikipedia's summary lists redesigns that reduce display prominence and couch assistance as supportive rather than directive information. Present the machine's output as information, framed so the person still has to decide. The moment the machine's suggestion reads as a command, the human's job shifts from deciding to confirming, and confirmation is where the complacency lives.

The through-line is this: a human in the loop is a job, not a button. It is a job with a specific requirement, which is that the human stays engaged enough to actually catch the thing the loop is there to catch. That engagement does not come from the word "approval." It comes from accountability, from a system whose reliability varies enough to keep attention alive, and from presenting the machine's output as something to weigh.

If you build a system and you want the human to be real, do not ask whether there is an approval step. Ask whether the person has to be able to explain their decision afterward. Ask whether the system ever gives them a reason to look twice. Ask whether the machine's suggestion reads as a recommendation or as a verdict.

The loop is not the button. The loop is the person, still looking.
