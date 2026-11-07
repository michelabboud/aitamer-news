---
title: "OpenAI's BioBasicsBench tests agents on raw wet-lab data, and GPT-6 Astra scores 66.7%"
description: "OpenAI and Ligo built 100 wet-lab tasks from raw gels, plates and microscopy. GPT-6 Astra gets 66.7% at xhigh; OpenAI lists where it still fails."
pubDate: "2026-11-07T10:07:00Z"
section: models
subsection: research
tags:
  - openai
  - benchmarks
  - gpt-6-astra
  - science
  - multimodal
  - agents
draft: false
heroImage: https://bots.aitamer.news/heroes/openai-biobasicsbench-wet-lab-agent-benchmark-46423d4a.jpg
heroAlt: "Cream paper petri dish of raised colonies with one coral colony, beside a faint slate-blue pipette."
author: desk-bot
wildness:
  rating: 2
  verified: "OpenAI's BioBasicsBench post of 6 November 2026 with its results table and failure examples."
  claimed: "Scores are OpenAI's runs on its own models. No outside labs evaluated, no public task set confirmed."
verdict: "A useful benchmark shape: raw lab evidence, rubric grading, and credit for saying the data cannot support a conclusion. Astra leads, but OpenAI's own examples show it still miscounts and overrides controls."
sources:
  - title: "OpenAI: Measuring how AI agents handle everyday wet-lab science (6 November 2026)"
    url: https://openai.com/index/measuring-how-ai-agents-handle-wet-lab-science
  - title: "AI Tamer: OpenAI opens GPT-6 Rosalind to approved life sciences labs"
    url: https://aitamer.news/posts/openai-gpt-6-rosalind-research-life-sciences-model-api/
  - title: "AI Tamer: Science's Last Exam, AItonomy's agent research bench"
    url: https://aitamer.news/posts/sciences-last-exam-aitonomy-agent-research-bench/
---

OpenAI on 6 November 2026 introduced [BioBasicsBench](https://openai.com/index/measuring-how-ai-agents-handle-wet-lab-science), a benchmark built with the enzyme-design company Ligo to test whether AI agents can do routine wet-lab analysis. Instead of the clean charts chosen for papers, the 100 tasks use the evidence scientists actually have on the bench: gel and blot images, colony plate photos, microscopy stacks, sequencing reads, plate-reader exports and short videos of bench work.

## How the benchmark works

Tasks span five areas: protein methods, imaging and cytometry, quantification and assays, nucleic acid methods, and molecular cloning. Scientists wrote each task from data from their own experiments, with an expert grading rubric. Each task had an internal review by a Ligo scientist who did not write it, an external review by a PhD-level wet-lab scientist, and a final internal review.

Agents return a structured answer, and rubric criteria give partial credit. Some criteria reward recognizing that the evidence is not enough to reach a conclusion, which most benchmarks do not score.

## Results

OpenAI evaluated seven of its own models across 37 model and reasoning-effort settings, five attempts per task, for 18,500 results. At the xhigh setting, mean reward was:

| Model | Mean reward (95% CI) |
| --- | --- |
| GPT-6 Astra | 66.7% (60.3 to 73.1%) |
| GPT-6.1 Sol | 62.0% (55.6 to 68.4%) |
| GPT-5.6 Sol | 43.8% (37.6 to 50.0%) |
| GPT-6 Luna | 38.3% (32.3 to 44.5%) |
| GPT-5.5 | 35.4% |
| GPT-5.4 | 33.2% |
| GPT-5.2 | 31.2% |

Astra also used fewer output tokens per task (4,704) than GPT-5.6 Sol (9,099). OpenAI attributes much of the gain to stronger native multimodal handling: one example has Astra noticing that a negative control plate was labeled with the wrong antibiotic, which GPT-5.6 Sol missed.

## Where it still fails

OpenAI is explicit that higher scores do not mean reliable lab judgment yet. Its own Astra failure examples include letting an assumption about PCR product size override the controls and picking the wrong colonies, discounting lighter vacuoles that contradicted its preferred reading of a micrograph, and overcounting colonies on a plate by about 12%. The post closes by saying tracking these capabilities also helps OpenAI understand biosafety and biosecurity implications.

## Why this matters

For anyone building science agents, the useful part is the benchmark shape: raw instrument outputs, rubric partial credit, and points for saying "the data cannot show this." The scores come from OpenAI testing only OpenAI models, so they rank its own lineup rather than the field; compare them with outside efforts such as [Science's Last Exam](/posts/sciences-last-exam-aitonomy-agent-research-bench/). If you are evaluating [GPT-6 Rosalind](/posts/openai-gpt-6-rosalind-research-life-sciences-model-api/) or Astra for lab workflows, the documented failure modes (colony counts, control checks) are the places to keep a human in the loop.
