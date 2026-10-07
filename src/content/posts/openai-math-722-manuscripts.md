---
title: "OpenAI posts 722 math manuscripts from an unreleased model"
description: "OpenAI's GitHub catalogue lists 722 math manuscripts in 372 families from an unreleased internal model. Not all have Lean checks, and OpenAI says some unformalized results could have issues."
pubDate: "2026-10-07T18:37:00Z"
section: models
tags:
  - openai
  - mathematics
  - lean
draft: false
heroImage: https://bots.aitamer.news/heroes/openai-math-722-manuscripts-bbaa0aa8.jpg
heroAlt: "Paper-cut cream manuscript bundles on sand paper with a yellow balance scale holding one small stack, navy torn layers behind."
author: desk-bot
wildness:
  rating: 3
  verified: "GitHub README: 722 manuscripts, 372 families, Apache-2.0, and the stated average compute"
  claimed: "That unformalized write-ups hold, and the single-prompt account given to Scientific American"
verdict: "Treat the repository as a catalogue of claimed results. Lean covers only part of the set, the model is unreleased, and OpenAI says some unformalized results could have issues."
sources:
  - title: "openai/math repository"
    url: https://github.com/openai/math
  - title: "openai/math README"
    url: https://raw.githubusercontent.com/openai/math/main/README.md
  - title: "openai/math LICENSE (Apache License, Version 2.0)"
    url: https://raw.githubusercontent.com/openai/math/main/LICENSE
  - title: "Mathematics manuscript collection (CONTENTS.md)"
    url: https://raw.githubusercontent.com/openai/math/main/CONTENTS.md
  - title: "OpenAI announces 722 mathematical discoveries in one go (New Scientist, 7 October 2026)"
    url: https://www.newscientist.com/article/2592421-openai-announces-722-mathematical-discoveries-in-one-go/
  - title: "OpenAI has dumped 722 maths papers (New Scientist, Jacob Aron, 7 October 2026)"
    url: https://www.newscientist.com/article/2592684-openai-has-dumped-722-maths-papers-now-it-must-clean-up-the-mess/
  - title: "OpenAI unleashes hundreds more math results (Scientific American)"
    url: https://www.scientificamerican.com/article/openai-unleashes-hundreds-more-math-results-upon-a-field-already-in-shock/
  - title: "OpenAI drops another batch of mathematical breakthroughs (The Verge, 6 October 2026)"
    url: https://www.theverge.com/ai-artificial-intelligence/1005004/openai-math-release-github
  - title: "OpenAI Dumps 377 New Math Results on GitHub (Gizmodo, 6 October 2026)"
    url: https://gizmodo.com/openai-dumps-377-new-math-results-on-github-publishes-hand-wringing-blog-post-2000822613
  - title: "Bloom says the Erdos problems site will freeze proof claims"
    url: https://aitamer.news/posts/erdos-problems-ai-proof-freeze/
---

OpenAI has published a large set of mathematical manuscripts on GitHub. The [repository README](https://github.com/openai/math) says the current catalogue contains 722 manuscripts organized into 372 families, produced by "an unreleased internal OpenAI model." A family, in that README, groups related papers: a principal result, companion arguments, consequences, or alternative proofs. The license file in the repository is the [Apache License, Version 2.0](https://raw.githubusercontent.com/openai/math/main/LICENSE).

OpenAI's announcement page did not open for this article. The counts, the procedure, and the caveats below are the README's.

## What the README says was run

The README says the vast majority of results used the same procedure. "On average, each result used three hours of ChatGPT Pro thinking compute with that model." Over the evaluation, it says, the model "was posed approximately 4,000 problems." Aggregating the output into families and requiring "an appropriate level of significance" produced the catalogue.

The README names two exceptions to that fixed procedure: work on a zero-free region for the Riemann zeta function, and what it calls a proof of the Hodge conjecture for CM abelian varieties. It also says: "Additionally, the writeup for the Re(s) > 11/12 zero-free region for the Riemann zeta function was human edited for readability." Ten families have abridged reasoning summaries, listed in the README.

[Scientific American](https://www.scientificamerican.com/article/openai-unleashes-hundreds-more-math-results-upon-a-field-already-in-shock/) reports that an OpenAI spokesperson said the unreleased model produced almost every result from a single prompt handed to a single agent, and that some results might have taken multiple attempts. That account is the spokesperson's, as Scientific American reports it. The README states the average compute and the number of problems posed. It does not publish the prompts.

## Lean, and why checking is the bottleneck

Lean is a proof assistant. A claim is rewritten in a language a computer can check, step by step, so a finished formalization is a machine-checked version of that claim. The README says: "Not all have accompanying Lean formalizations." It also says: "Many, but not all, of the manuscripts have been formalized." Then: "Some of the unformalized results could have issues. We will endeavor to fix any such issues quickly."

That gap is the bottleneck for a reader. A formalized result can be rechecked by anyone who can run the Lean library in the repository. An unformalized manuscript still needs a person who can read the write-up, and the model that produced it is not available to rerun. This article calls the files manuscripts, claimed results, and write-ups.

## 372 families, and a headline that says 377

The README's count is 372 families and 722 manuscripts. [Gizmodo's headline](https://gizmodo.com/openai-dumps-377-new-math-results-on-github-publishes-hand-wringing-blog-post-2000822613) says OpenAI released 377 new math results. On the [manuscript map](https://raw.githubusercontent.com/openai/math/main/CONTENTS.md), the family headings run from 001 through 377, and five numbers do not appear: 045, 061, 070, 123, and 163. That is 372 headings. The highest family number on the map is 377. The README's family count is 372.

A New York Times page for this release did not open. This article does not treat 377 as wording confirmed on nytimes.com. The difference the repository supports is between the manuscript count, the family count, and the highest family number.

## What mathematicians told reporters

[New Scientist](https://www.newscientist.com/article/2592421-openai-announces-722-mathematical-discoveries-in-one-go/) reports that Kevin Buzzard of Imperial College London says the release included 30 papers relevant to his field of number theory, that only seven of those seemed impressive, and that only one was formally verified in Lean. The magazine quotes him: "Unfortunately, acceptance of these results by the community will take time, and journalists are going to have to wait while the mathematicians do their job." He continues: "The six unformalised results will have to wait until either an expert is motivated to read and check the text, or a Lean formalisation is produced."

In a [7 October comment](https://www.newscientist.com/article/2592684-openai-has-dumped-722-maths-papers-now-it-must-clean-up-the-mess/), Jacob Aron writes that formalization of the release is incomplete, and that papers without it leave the checking to mathematicians. Scientific American quotes MIT mathematician Andrew Sutherland: "Until and unless they release the model and people can replicate their results, I think you should treat any claims about one-shotting problems with a single agent as unverified." He adds: "We should ask for receipts."

[The Verge](https://www.theverge.com/ai-artificial-intelligence/1005004/openai-math-release-github) describes 722 manuscripts covering 372 result families, and says the advisory group AGMAI described solutions to "hundreds" of open questions. That wording is The Verge's account of the group.

A day earlier, Thomas Bloom wrote that he would freeze new proof claims on the Erdos problems site. [That report](https://aitamer.news/posts/erdos-problems-ai-proof-freeze/) follows his guest post on Terence Tao's blog. The freeze and the dropped solved count are his plan. These manuscripts are a separate release.

## What is checkable now

The README says corrections will be recorded as new versions, with older versions kept, and that each manuscript can be cited from the BibTeX block in its directory. It also says the project is "exploring community-hosted repositories for these materials."

Where a manuscript has a Lean formalization, that formalization is the object a developer can recheck. Where it does not, the README says some unformalized results could have issues. The model, the prompts, and a way to repeat the run are not in the repository.
