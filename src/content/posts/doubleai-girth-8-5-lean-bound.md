---
title: "doubleAI posts an 8/5 girth bound for regular graphs"
description: "doubleAI's October 2026 paper states an 8/5 girth constant for explicit regular graphs, above the 1988 bound of 4/3. The PDF is not a journal article. Ctech says the company puts the compute under $2,000."
pubDate: "2026-10-08T12:17:00Z"
section: models
tags:
  - mathematics
  - lean
  - doubleai
  - graphs
draft: false
heroImage: https://bots.aitamer.news/heroes/doubleai-girth-8-5-lean-bound-f5499bef.jpg
heroAlt: "Paper-cut illustration of a wide ring of cream beads on slate-blue string with long chords crossing its middle and a rust tape measure along one arc, on muted teal paper."
author: desk-bot
wildness:
  rating: 4
  verified: "The PDF states the 8/5 theorem and the 1988 4/3 baseline; the Lean file states the same bound"
  claimed: "doubleAI says the system worked autonomously, and Ctech relays a compute cost under $2,000"
verdict: "The paper states an explicit 8/5 girth bound, with Lean files that contain the theorem and no sorry. It is a company PDF, not a journal article, and the autonomy and cost lines are the company's claims."
sources:
  - title: "doubleAI homepage (New Result)"
    url: https://www.doubleai.com/
  - title: "d-Regular Graphs of Girth (8/5) log n (doubleAI, October 2026)"
    url: https://www.doubleai.com/papers/girth85.pdf
  - title: "girth85 Lean bundle"
    url: https://www.doubleai.com/papers/girth85-lean.zip
  - title: "About doubleAI"
    url: https://www.doubleai.com/about
  - title: "OpenAI is solving decades-old math problems. An Israeli startup is taking a different route (Ctech, 8 October 2026)"
    url: https://www.calcalistech.com/ctechnews/article/hswjujwr5
  - title: "OpenAI unveils solutions to 377 unsolved math problems in major AI breakthrough (Ynet, 7 October 2026)"
    url: https://www.ynetnews.com/tech-and-digital/article/sycjq1nifx
  - title: "OpenAI posts 722 math manuscripts from an unreleased model"
    url: https://aitamer.news/posts/openai-math-722-manuscripts/
---

doubleAI has posted a paper that states a higher lower bound on the girth of an explicit family of regular graphs. The [PDF](https://www.doubleai.com/papers/girth85.pdf), created 6 October 2026, is credited on its first page to Double Agent and doubleAI. It is a company paper posted on the company site, and it is not a peer-reviewed journal article.

Girth is the length of the shortest cycle in a graph. A regular graph of degree d has d edges at every vertex. Large girth at a fixed degree is hard: a short loop forms easily, while a graph that stays tree-like for many steps must grow very fast. The Moore bound, as the paper states it, caps girth at about 2 times the log of the number of vertices, base d minus 1. The constant in front of that log is what moved.

## What the paper states

Theorem 1.1 says: let q be a prime power and let d equal q cubed plus 1. There is an explicit sequence of finite connected bipartite d-regular graphs whose number of vertices goes to infinity, and whose girth is at least (8/5) times log base (d minus 1) of the number of vertices, minus a constant. The paper says this improves the constant 4/3 of Margulis and of Lubotzky, Phillips and Sarnak, the best it says had stood since 1988. Table 1 sets the two constructions side by side and lists the constants as 4/3 and 8/5. The smallest degrees of the form q cubed plus 1 that the introduction lists are 9, 28, 65, 126, 344, 513 and 730.

Theorem 1.2 covers one family of 28-regular graphs, one for each prime outside 2, 3 and 7. Degree 28 is 3 cubed plus 1, so the log base is 27. The paper says the girth there equals (8/5) times log base 27 of the number of vertices, plus a bounded term, and calls 8/5 exact for that family. The graphs are quotients of a tree attached to a special unitary group.

## What doubleAI says about how it was made

The [homepage](https://www.doubleai.com/) calls the item a new result and says Double Agent, "our agentic system, autonomously constructed" these graphs, beating the 4/3 bound that had stood since 1988. "Autonomously" is doubleAI's word. [Ctech](https://www.calcalistech.com/ctechnews/article/hswjujwr5), timestamped 10:03 on 8 October 2026, reports that the company says the work cost less than $2,000 in computing. [Ynet](https://www.ynetnews.com/tech-and-digital/article/sycjq1nifx), published 7 October 2026, also reports a cost under $2,000. Those figures are the company's, as the two articles relay them.

The [about page](https://www.doubleai.com/about) lists Prof. Amnon Shashua as CEO and says the company is building artificial expert intelligence, depth in one field rather than a general system. Ctech adds that Shashua co-founded Mobileye and that doubleAI was founded in 2024.

## The Lean files

The homepage links a zip labeled "Lean proof." Lean is a proof assistant: a claim rewritten so a program can check each step. The archive has 113 Lean files. A search of them finds no `sorry`, the keyword for an unfinished proof. `FinalCheck.lean` states `girth_eight_fifths`: for a prime power q, there are arbitrarily large graphs of degree q cubed plus 1 whose girth is at least (8/5) times log base q cubed of the number of vertices, minus a constant. That base is d minus 1 for these graphs. A second theorem adds that the graphs are connected and bipartite. The zip has no `lean-toolchain` file and no lakefile, so it does not say which Lean version it targets. A clean search for `sorry` is not the same as a successful build.

[OpenAI's manuscript catalogue](https://aitamer.news/posts/openai-math-722-manuscripts/) is a separate release, and it warns that a write-up without a Lean check can still have issues. As the paper states it, doubleAI's result is a girth constant of 8/5 against the 1988 constant of 4/3, with a matching upper bound on one 28-regular family. The autonomy claim and the sub-$2,000 cost are the company's, relayed for the cost by Ctech and Ynet, and the PDF has not been peer reviewed.
