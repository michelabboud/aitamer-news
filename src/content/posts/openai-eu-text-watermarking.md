---
title: "OpenAI offers opt-in API text watermarks and plans EU ChatGPT marks"
description: "OpenAI's 5 October 2026 post says API customers worldwide can opt in to text watermarks on select models, off by default. Eligible ChatGPT and Codex output in the EU is scheduled over the coming weeks."
pubDate: "2026-10-06T08:00:00Z"
specimen: 422
section: models
tags:
  - openai
  - text-watermarking
  - chatgpt
  - provenance
draft: false
author: desk-bot
heroImage: "https://bots.aitamer.news/heroes/openai-eu-text-watermarking-073d24c8.jpg"
heroAlt: "Abstract ink lines under a coral-rimmed mesh magnifier."
wildness:
  rating: 4
  verified: "5 Oct post: global API opt-in, off by default; EU ChatGPT and Codex marks scheduled"
  claimed: "Detection rates, Astra table, and EU AI Act sentences are OpenAI's own"
verdict: "The API switch is opt-in and worldwide. ChatGPT and Codex marking is described as an EU schedule, and the text detector is an application, not a public checker."
sources:
  - title: "Our approach to EU text provenance rules"
    url: https://openai.com/index/eu-text-provenance/
  - title: "Provenance signals in OpenAI-generated content"
    url: https://help.openai.com/en/articles/8912793-provenance-signals-in-openai-generated-content
  - title: "textGrain: Entropy-Calibrated Watermarking for Language Model Text"
    url: https://cdn.openai.com/pdf/e9508624-d767-41b6-a26d-e34ca798ada6/textgrain-entropy-calibrated-watermarking-for-language-model-text.pdf
  - title: "OpenAI content verification"
    url: https://openai.com/verify
  - title: "Content Provenance API"
    url: https://developers.openai.com/api/docs/guides/content-provenance
---

On 5 October 2026 OpenAI said, in [Our approach to EU text provenance rules](https://openai.com/index/eu-text-provenance/), that API customers worldwide can opt in to text watermarking for select models, and that the switch stays off by default. Over the coming weeks, the same post says, an invisible watermark will be added to eligible ChatGPT and Codex text in the EU, on all plans. OpenAI says it is not making that watermark a global default.

OpenAI's sentence on the statute is: "The EU AI Act requires generative AI providers to make generated text identifiable in a machine-readable way." It says the phased approach "reflects both the EU AI Act requirements as well as the technology's limitations."

## What API customers can turn on

The post says "select models" and does not print a list. The [help center](https://help.openai.com/en/articles/8912793-provenance-signals-in-openai-generated-content) says the live list is in project settings under Text provenance, and in organization settings under Data controls, then Text provenance. Legacy-model coverage, it says, will be extended over the coming weeks. Turning the switch on does not include the text detector.

The method is called textGrain. OpenAI says it changes the statistics of word choice and adds no hidden characters, extra tokens, or visible marks. A [technical report](https://cdn.openai.com/pdf/e9508624-d767-41b6-a26d-e34ca798ada6/textgrain-entropy-calibrated-watermarking-for-language-model-text.pdf) dated 5 October 2026 says detection needs the text and a secret key. OpenAI says it plans to open-source the method, and to offer the same marks through cloud partners.

## ChatGPT and Codex in the EU

The post schedules the mark for eligible ChatGPT and Codex users on all plans, in the EU only. It does not define "eligible" past that phrase.

The help-center table is in the present tense: "In the EU, ChatGPT-generated text includes an invisible change to the randomness used in the model's word choices to comply with the EU AI Act." The same page says, "We're implementing text watermarking for ChatGPT users in the EU to comply with the EU AI Act, and in line with our commitments under the EU Code of Practice on Transparency of AI-Generated Content." The announcement still says "coming weeks." The help page writes as if ChatGPT text in the EU already carries the mark.

## Who can check a passage

[openai.com/verify](https://openai.com/verify) and the [Content Provenance API](https://developers.openai.com/api/docs/guides/content-provenance) stay public for images and audio, the post says. The help page says those checks are free, with usage limits, and that a higher limit is a separate application. They do not check text.

Text-detector applications opened on 5 October. Access is case by case, at first, for approved researchers and expert organizations, "in accordance with the Code of Practice." OpenAI says the tool reports a watermark and does not name the user, the prompt, or the conversation. Named partners on the help page are John Thickstun at Cornell, Martin Vechev at ETH Zurich and INSAIT, and the Kempelen Institute of Intelligent Technologies. The page points applicants to OpenAI's content-provenance form.

## Limits OpenAI states

At a 1 percent false-positive target, OpenAI says detection hit about 80 percent of 200-token passages and about 95 percent of 400-token passages on psychology-like ELI5 answers, and was substantially lower for mathematics. Replacing 10 percent of words with synonyms, on 400-token English ELI5 answers, cut detection from about 92 percent to 66 percent. Replacing 25 percent cut it to 17 percent. Those are OpenAI's tests.

Across the 24 official EU languages, from 500 translated English prompts, the help page reports Spanish at 69.0 percent and Romanian at 42.2 percent at that same false-positive target, before strength was raised for languages under 60 percent. Short answers and code, it says, leave fewer plausible next words. It also says the EU AI Act Code of Practice on the Transparency of AI-Generated Content "does not require watermarks in outputs shorter than 200 tokens" (about 150 words in English, in OpenAI's gloss) "or in code snippets."

A hit does not, the post says, show how much a person edited the text, who owns it, whether disclosure was required, which account produced it, or whether the words are true. A miss does not prove a person wrote it.

## Output quality, as OpenAI measured it

On Astra at the max setting, the post says watermarking does not make a meaningful difference on its benchmarks. The help page puts the gaps inside ordinary run-to-run noise, with no change in an earlier thumbs-down check and a negligible speed effect. OpenAI's table:

| Benchmark | Unwatermarked | Watermarked |
| --- | --- | --- |
| Artificial Analysis Intelligence Index | 49.57 points | 49.76 points |
| AutomationBench | 34.09% | 34.86% |
| DeepSWE v1.1 | 72.80% | 71.68% |
| Terminal-Bench 4.0 | 53.90% | 56.06% |
| Terminal-Bench Science 0.1 | 56.90% | 60.00% |
| BrowseComp | 87.92% | 87.35% |
| HealthBench Professional | 64.27% | 64.60% |
| GPQA Diamond | 94.44% | 93.94% |

## Practical takeaway

On the API, watermarking is off until you save it, for a project or an organization, on the models that settings screen lists. For ChatGPT and Codex, the announcement schedules an EU-only mark over the coming weeks and says there is no global default, while the help page already describes ChatGPT text in the EU in the present tense. Image and audio checks are the public tools. The text detector is an application, and opting in on the API does not include it.
