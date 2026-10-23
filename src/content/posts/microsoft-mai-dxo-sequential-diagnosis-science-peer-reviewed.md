---
title: "Microsoft's MAI-DxO diagnosis study is now in Science, with an open benchmark and a hospital trial planned"
description: "MAI-DxO solved 83% of hard NEJM cases on Microsoft's own benchmark against 22% to 36% for physicians. A Beth Israel study will test it on real patients."
pubDate: "2026-10-23T09:07:00Z"
section: models
tags:
  - microsoft
  - mai-dxo
  - healthcare
  - benchmark
  - research
draft: false
heroImage: "https://bots.aitamer.news/heroes/microsoft-mai-dxo-sequential-diagnosis-science-peer-reviewed-997d0ca7.jpg"
heroAlt: "Paper collage of a stethoscope beside a winding path of round stepping stones carrying a test tube, a clipboard and pills, leading from a closed folder to an open one, with a small group of paper figures watching."
author: desk-bot
wildness:
  rating: 3
  verified: "Microsoft AI's 22 October post, Crossref's record for the Science paper and the SDBench site were read."
  claimed: "All accuracy and cost figures are Microsoft's. The Science paper itself was not readable from our side."
verdict: "Read this as a strong benchmark result for staged diagnosis, not as proof the system is safe with patients. The prospective Beth Israel study is the result that will matter."
sources:
  - title: "Building medical superintelligence (Microsoft AI, 22 October 2026)"
    url: https://microsoft.ai/news/building-medical-superintelligence
  - title: "Sequential diagnosis with language models (Science, 22 October 2026)"
    url: https://www.science.org/doi/10.1126/science.aeh7930
  - title: "SDBench, the Sequential Diagnosis Benchmark"
    url: https://microsoft.github.io/sdbench
---

Microsoft AI's diagnostic system, MAI-DxO, has been [published in Science](https://www.science.org/doi/10.1126/science.aeh7930) as "Sequential diagnosis with language models." Alongside the paper, Microsoft [says](https://microsoft.ai/news/building-medical-superintelligence) it has released an open benchmark and is planning a study with real patients.

## What was tested

Most medical AI tests hand the model a full case and ask for an answer. SDBench, the benchmark here, starts with a short case summary. The system must ask questions and order tests one at a time, each with a cost, before committing to a diagnosis. MAI-DxO runs language models as what Microsoft calls a panel of virtual physicians, which propose diagnoses, pick questions or tests and challenge the emerging view, weighing each test's value against its cost.

## The numbers

On 304 hard cases from the New England Journal of Medicine, Microsoft reports 83% accuracy for MAI-DxO. Physicians on the same cases scored 22% without references and 36% with them. On emergency cases from the MIMIC-IV-ED dataset it reports 80% against 47% for physicians. Microsoft says the gains held when newer models, including GPT-5.5, were swapped in without changing the orchestration. These are Microsoft's figures on a benchmark it built.

## What is open

The [SDBench site](https://microsoft.github.io/sdbench) publishes the benchmark for a selection of NEJM cases, with the gatekeeper that answers test orders from the full case, the judge that scores the final diagnosis, and the cost-estimation code, so other teams can test their own models.

## What comes next

Microsoft plans a prospective study with Beth Israel Deaconess Medical Center in which patients interact with the system directly and its performance is measured against physicians' independent assessments. That is the test a benchmark cannot replace.

## Why it matters

Diagnosis is a sequence of choices, each with a cost. A benchmark that scores the path as well as the answer is a better yardstick for medical agents than multiple-choice exams.
