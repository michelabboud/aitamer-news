---
title: "Architecture decision records: write down why, not only what"
description: "An architecture decision record is a short file in your repository that explains one design choice: its context, the decision, its status and its consequences."
pubDate: "2026-10-14T09:00:00Z"
specimen: 770
section: general
tags:
  - architecture
  - documentation
  - adr
  - software-design
  - git
draft: false
heroImage: https://media.aitamer.news/heroes/architecture-decision-records-why-bb233364.jpg
heroAlt: An open cream paper notebook holds a forked blue road with a red pin securing one branch and a magnifying glass beside the other.
author: quill
wildness:
  rating: 1
  verified: Format, numbering, superseding and quotes checked against Nygard's post and adr.github.io
  claimed: Nygard's report of positive feedback from six to ten developers is anecdotal, not measured
verdict: A small, durable habit. Five short sections in a numbered Markdown file give future readers the reasons behind a design. Keep it to significant decisions and supersede, never rewrite.
sources:
  - title: Documenting Architecture Decisions (Michael Nygard, Cognitect, 2011)
    url: https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions
  - title: Architectural Decision Records (ADR GitHub organization)
    url: https://adr.github.io/
---

Code shows what a system does. It rarely shows why it was built that way. Months later, a new teammate or a coding agent reading the repository finds a choice that looks odd, and nothing nearby explains it.

## The failure: a decision nobody can explain

Michael Nygard described this problem in his 2011 post [Documenting Architecture Decisions](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions). A newcomer "may be perplexed, baffled, delighted, or infuriated by some past decision." Without the rationale, he wrote, that person has two choices: blindly accept the decision or blindly change it. Too many blind acceptances and the team "becomes afraid to change anything." A blind change can break something the decision was quietly protecting, such as a non-functional requirement nobody has tested yet.

An architecture decision record (ADR) is the fix: one short text file per decision. The [ADR GitHub organization](https://adr.github.io/) says an ADR "captures a single AD and its rationale", where an architectural decision (AD) is "a justified design choice that addresses a functional or non-functional requirement that is architecturally significant." The collection of ADRs in a project, the same page says, constitutes its decision log.

## Which decisions deserve a record

Nygard's test is a decision that affects "the structure, non-functional characteristics, dependencies, interfaces, or construction techniques." Picking a database, a wire format or an authentication approach qualifies. Naming a helper function does not. He also wrote that "One ADR describes one significant decision for a specific project."

## The five parts

Nygard's format has five sections:

- **Title.** A short noun phrase with a number, such as "ADR 9: LDAP for Multitenant Integration".
- **Context.** The forces at play, "technological, political, social, and project local". The language here is value-neutral and describes facts.
- **Decision.** The response to those forces, in full sentences and active voice: "We will …".
- **Status.** "proposed" before stakeholders agree, "accepted" once they do. A later ADR can mark it "deprecated" or "superseded", with a reference to its replacement.
- **Consequences.** The resulting context after the decision. "All consequences should be listed here, not just the 'positive' ones."

He set a size limit of one or two pages, and asked for each record to read "as if it is a conversation with a future developer", in full sentences organized into paragraphs.

## A small example

This record is invented for illustration:

```markdown
# ADR 7: SQLite for the background job queue

## Status
Accepted

## Context
The service runs on one host. Jobs are email retries and report
exports, a few hundred per day. Nobody is on call for a separate
queue server. Jobs must survive a process restart.

## Decision
We will store pending jobs in a table in the service's existing
SQLite file and process them with a single worker.

## Consequences
Jobs survive restarts with no new infrastructure. Only one worker
can run safely, so scaling workers out is ruled out. If the service
moves to more than one host, this decision must be superseded.
```

Look at the last paragraph. It names the cost (one worker) and the condition that would make the decision wrong (a second host). A future reader can check that condition against today's system. Nygard put it this way: "the time to change old decisions will be clear from changes in the project's context."

## Keep the records in the repository

Nygard kept ADRs in the project repository under `doc/arch/adr-NNN.md`, written in a lightweight markup language such as Markdown. The exact path is his team's choice. The useful part is that the records live in version control beside the code they explain. A decision can then land in the same pull request as the change it justifies, and its history sits in the same log.

Numbers run "sequentially and monotonically" and are never reused. When a decision is reversed, the old record stays and is marked superseded. In Nygard's words, "It's still relevant to know that it was the decision, but is no longer the decision." The old record points forward:

```markdown
## Status
Superseded by ADR 12: Postgres-backed job queue
```

ADR 12 can then cite ADR 7 in its context. Nygard noted that the consequences of one ADR are very likely to become the context for later ones.

## Write it while the decision is open

The "proposed" status means a record can exist before anyone agrees. That makes the ADR a natural place to hold the discussion, with the context and the rejected options still fresh. Writing it weeks later tends to lose the forces that made the choice hard.

## Where this advice stops

- **Trivial choices.** An ADR log full of small calls stops being read. Nygard's case for ADRs rests on small documents, because "Nobody ever reads large documents, either."
- **System overviews.** An ADR records one decision and its reasons. Explaining how the whole system fits together needs separate documentation.
- **Readers outside the repository.** Nygard raised this objection himself. His teams shared links to the hosted Markdown, which GitHub renders. If your stakeholders never open the repository host, plan for that.
- **Template choice.** adr.github.io points to other forms, such as the Y-statement from Zdun et al.'s "Sustainable Architectural Decisions", and keeps separate pages on templates and tools. The sources do not name one best template.

The evidence for ADRs in these sources is modest. Nygard's report covers a few projects in their first months, where six to ten developers rotated through and all said they valued the context. The ADR index also links to Michael Keeling and Joe Runde's presentation, describing it as including empirical numbers. The index does not reproduce those numbers, so it does not establish a measured benefit on its own.
