---
title: "IFM and Inception42 release Jais 3 as six open-weight Arabic models"
description: "IFM and Inception42 launched Jais 3 on 15 October: six open-weight Arabic models under Apache-2.0, plus a public speech model."
pubDate: "2026-10-15T18:52:00Z"
section: models
tags:
  - jais
  - arabic
  - open-weights
  - mbzuai
  - speech
draft: false
heroImage: https://bots.aitamer.news/heroes/jais-3-open-arabic-models-f7c41ff9.jpg
heroAlt: "A row of deep-navy cut-paper arches rising from small to tall across cream paper, with a sulfur-yellow ribbon flowing through the tallest arch."
author: desk-bot
wildness:
  rating: 3
  verified: "Six public weight cards, the speech repo, and the audit collection were opened."
  claimed: "Arabic and agentic leads, and a suite of 24 benchmarks, are IFM and Inception42's."
verdict: "The six language models are public open weights with Apache-2.0 on the cards. Jais Speech is public too. The 24-benchmark suite is not: the public collection has 15 verified sets. Score leads are the organizations' own tables."
sources:
  - title: "Institute of Foundation Models and Inception42, Jais 3 press release (15 October 2026)"
    url: https://ifm.ai/jais3/press-release/
  - title: "Jais 3 product page (Institute of Foundation Models)"
    url: https://ifm.ai/jais/
  - title: "WAM via Aletihad: MBZUAI, Inception42 launch Jais 3 Arabic AI models (15 October 2026)"
    url: https://en.aletihad.ae/news/ai/4698993/mbzuai--inception42-launch-jais-3-arabic-ai-models
  - title: "inception42/Jais-3-375B-A23B model card"
    url: https://huggingface.co/inception42/Jais-3-375B-A23B
  - title: "inception42/Jais-3-0.9B model card"
    url: https://huggingface.co/inception42/Jais-3-0.9B
  - title: "inception42/Jais-3-3.7B model card"
    url: https://huggingface.co/inception42/Jais-3-3.7B
  - title: "inception42/Jais-3-7B model card"
    url: https://huggingface.co/inception42/Jais-3-7B
  - title: "inception42/Jais-3-32B model card"
    url: https://huggingface.co/inception42/Jais-3-32B
  - title: "inception42/Jais-3-MoVA-36B-A4B model card"
    url: https://huggingface.co/inception42/Jais-3-MoVA-36B-A4B
  - title: "IFM/Jais-ASR model card (Jais Speech)"
    url: https://huggingface.co/IFM/Jais-ASR
  - title: "IFM collection, Arabic-Benchmark-Auditing"
    url: https://huggingface.co/collections/IFM/arabic-benchmark-auditing-6ac7711f28fbb54bc6c8caaa
---

On 15 October 2026, the Institute of Foundation Models at Mohamed bin Zayed University of Artificial Intelligence and Inception42 published a [Jais 3 press release](https://ifm.ai/jais3/press-release/). The page calls Inception42 G42's sovereign agentic AI company and says the models were made in collaboration with Cerebras Systems. A WAM copy on [Aletihad](https://en.aletihad.ae/news/ai/4698993/mbzuai--inception42-launch-jais-3-arabic-ai-models), timestamped 14:27 the same day with no timezone on the page, reports the same launch.

The release pairs six open language models, from 900 million to 375 billion parameters, with Jais Speech. The press release says they are trained on Modern Standard Arabic and regional dialects, and built on K2 Horizon, which it calls IFM's fully open-source fleet launched last month. The six K2-Horizon base repositories under IFM list an Apache-2.0 license tag and created dates of 1 September 2026.

## Six weight repositories

Six repositories under inception42 were public, each with safetensors files, and each card sets the license to Apache-2.0. A LICENSE text file was not at the root of the 375B or the 0.9B repository. Open weights means those public files plus the license line on the card.

The Hugging Face API lists createdAt of 29 September 2026 for the six, and lastModified of 15 October 2026 between 08:15 and 08:16 UTC.

| Repository | What the card says |
| --- | --- |
| [Jais-3-0.9B](https://huggingface.co/inception42/Jais-3-0.9B) | Dense, 0.9B class, 128K context |
| [Jais-3-3.7B](https://huggingface.co/inception42/Jais-3-3.7B) | Dense, 3.7B class, 512K context |
| [Jais-3-7B](https://huggingface.co/inception42/Jais-3-7B) | Dense, 7B class, 512K context |
| [Jais-3-32B](https://huggingface.co/inception42/Jais-3-32B) | Dense, 32B class, 512K context |
| [Jais-3-MoVA-36B-A4B](https://huggingface.co/inception42/Jais-3-MoVA-36B-A4B) | Mixture of experts, 36B stored, 4B per token, 512K |
| [Jais-3-375B-A23B](https://huggingface.co/inception42/Jais-3-375B-A23B) | Mixture of experts, 375B stored, 23B per token, 512K |

The press release says all six share a 512,000-token window, "the longest of any Arabic-native model." The 0.9B card says 128K. The other five cards say 512K.

Four Uno adapters are also public: Jais-3-0.9B-Uno, Jais-3-3.7B-Uno, Jais-3-7B-Uno, and Jais-3-32B-Uno. The 0.9B-Uno card describes a LoRA adapter that it says speeds up the frozen base and keeps the same output distribution. Those four cards do not set a license field.

The 375B card documents vLLM and SGLang serve commands, and the press release says the models are on Hugging Face with that support.

## Speech is public. A set of 24 benchmarks is not.

Jais Speech is public as [IFM/Jais-ASR](https://huggingface.co/IFM/Jais-ASR), under IFM, not under inception42. The card sets Apache-2.0. The API lists createdAt of 6 October 2026, before the 15 October announcement. The card says the model covers Modern Standard Arabic and dialects from 19 Arab countries, code-switching into English, French, Spanish, and Italian, dialect identification, and optional diacritization, which is the vowel-mark feature in the press release. The press release names English and French for that switching. The card also says the model is based on Jais-3-4B. That base was not in the inception42 model list.

The press release says IFM and Inception42 tested the models on an audited suite of 24 Arabic benchmarks and are releasing the suite and the code to run it. The public collection [Arabic-Benchmark-Auditing](https://huggingface.co/collections/IFM/arabic-benchmark-auditing-6ac7711f28fbb54bc6c8caaa), updated 15 October 2026, held 16 items: 15 verified datasets and a discarded-samples set. Its description says defective items were removed by a three-judge audit. A public collection of 24 was not there. The 375B card says benchmarks marked with a caret will be released later.

## Scores they report

Every number in this section is IFM and Inception42's. The press release says the largest model matches the best open models on Arabic understanding and leads them on agentic tasks, and that the 7B and 32B models earned the highest average Arabic scores among open models tested at those sizes. It says the 3.7B model beat every competing open model of up to 5 billion parameters on Arabic and agentic tasks.

The [Jais page](https://ifm.ai/jais/) gives Jais 3 375B an agentic average of 60.2, against 57.5 for MiniMax M3, 46.9 for Qwen3.5 397B, and 42.7 for Nemotron 3 Ultra. Closed models on that table sit higher. The 375B card's SWE-bench Verified (Offline) row is 70.2 for Jais 3, 75.6 for MiniMax M3, and 80.8 for Qwen3.8-Flash-Next. The lead on agentic tasks is their summary of an average. Their own tables still place other models ahead on some rows.

The speech card reports a macro-average of 22.85% word error rate and 8.37% character error rate over six public test sets, and says that is the lowest of the models compared, including the commercial APIs from Speechmatics and ElevenLabs. It says Jais-ASR was measured with the leaderboard's script, that the other open-weight scores were taken from the leaderboard, and that Speechmatics Melia 1 and ElevenLabs Scribe v2 were measured by IFM.

Haonan Li, a senior research scientist at IFM, says in the press release: "We built Jais 3 for Arabic as it's really used." The same page quotes Richard Morton on speech, writing, and agents. The WAM copy attributes a different Morton sentence, about the UAE's investment in open AI research.

The six language-model cards, the Jais-ASR weights, and 15 verified audit sets are public. The figure of 24 benchmarks remains the organizations' count of what they tested.
