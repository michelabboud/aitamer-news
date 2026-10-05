---
title: Google moves DiarizationLM to Gemma 4 E4B, an open model that fixes speaker labels in transcripts
description: "Google posted DiarizationLM-Gemma-4-E4B-v1 on Hugging Face on 4 October 2026: an Apache 2.0 model that corrects which speaker said which words in ASR transcripts, fine-tuned on four diarization corpora."
pubDate: "2026-10-05T03:00:00Z"
specimen: 393
section: models
subsection: speech
tags:
  - speaker-diarization
  - diarizationlm
  - speech
  - gemma-4
  - google
  - open-weights
draft: false
heroImage: https://bots.aitamer.news/heroes/google-diarizationlm-gemma-4-e4b-aff4434b.jpg
heroAlt: A paper-cut collage of a cream transcript strip with two speaker lanes marked by slate-blue speech bubbles, where a paper hand lifts one coral word bar out of the upper lane, over faint sound-wave lines.
author: desk-bot
wildness:
  rating: 3
  verified: 4 Oct 2026 HF release, Apache 2.0, Gemma 4 E4B base, files and sizes, GitHub code update
  claimed: WDER and cpWER gains are Google-run results on its own baseline
verdict: A useful open clean-up step for speaker-labelled transcripts, labelled as not an officially supported Google product. Gains are strong on calls, small on meetings, and still need independent checks.
sources:
  - title: google/DiarizationLM-Gemma-4-E4B-v1 model card (Hugging Face)
    url: https://huggingface.co/google/DiarizationLM-Gemma-4-E4B-v1
  - title: "DiarizationLM: Speaker Diarization Post-Processing with Large Language Models (arXiv 2401.03506)"
    url: https://arxiv.org/abs/2401.03506
  - title: google/gemma-4-E4B model card (Hugging Face)
    url: https://huggingface.co/google/gemma-4-E4B
  - title: DiarizationLM source code (google/speaker-id on GitHub)
    url: https://github.com/google/speaker-id/tree/master/DiarizationLM
  - title: diarizationlm package (PyPI)
    url: https://pypi.org/project/diarizationlm/
---

Google published [`google/DiarizationLM-Gemma-4-E4B-v1`](https://huggingface.co/google/DiarizationLM-Gemma-4-E4B-v1) on Hugging Face on 4 October 2026. It is a speech post-processing model: it takes a transcript that already carries speaker labels and moves words that were assigned to the wrong speaker. The weights are under Apache 2.0 and the repository is not gated. The model card opens with a plain caveat: "This is not an officially supported Google product."

## What DiarizationLM does

DiarizationLM comes from a [2024 Google paper](https://arxiv.org/abs/2401.03506). An ASR system produces the words, a separate speaker diarization system decides who spoke when, and an orchestration step joins the two. Timing mismatches between those systems put words under the wrong speaker. DiarizationLM writes the joined result as compact text with speaker tokens, sends it to a fine-tuned language model, and maps the model's answer back onto the original ASR words, so the transcript text stays as recognised and only the speaker labels change.

The model works on text. It needs an existing ASR and diarization pipeline upstream and does not process audio itself.

## What changed in this release

Earlier open DiarizationLM checkpoints were built on Llama 2 and Llama 3 and trained on two-speaker telephone calls from the Fisher corpus. The new one is a fine-tune of [Gemma 4 E4B](https://huggingface.co/google/gemma-4-E4B) trained across four corpora: Fisher, Callhome American English, the ICSI meetings and the AMI meetings. The card lists 51,063 Fisher and 20,762 multi-corpus prompt and completion pairs, a rank-256 LoRA adapter merged into the base weights, and 10,000 training steps on eight Cloud TPU v5p chips. Google calls its target recipe locality-preserving oracle supervision: short turn-boundary and backchannel errors get corrected, while speaker labels on long monologues are kept.

The card describes the base as 4B dense parameters. Google's Gemma 4 card lists E4B as 4.5B effective parameters, 8B with embeddings, and the merged BF16 file on Hugging Face holds about 8.0B parameters. The repository ships that 16.0 GB BF16 file plus two 4-bit GGUF files of about 5.3 GB and 5.15 GB for llama.cpp and Ollama. Prompts are cut into 4,000-character segments.

The [DiarizationLM code on GitHub](https://github.com/google/speaker-id/tree/master/DiarizationLM) gained Gemma 4 support and the new data preparation on the same day. The newest release of the `diarizationlm` package on [PyPI](https://pypi.org/project/diarizationlm/) is still 0.1.5 from March 2025.

## Google's numbers

All results are Google's own, measured against a Google USM ASR plus turn-to-diarize baseline. Word diarization error rate (WDER) on Fisher goes from 5.32% to 2.99%, against 3.28% for the earlier Llama 3 8B checkpoint. On Callhome it goes from 7.74% to 4.92%. The meeting gains are smaller: 14.70% to 14.10% on ICSI and 15.68% to 14.89% on AMI. The card reports bootstrap confidence intervals and p < 0.0001 for each change. The meeting test sets are small, three ICSI meetings and 16 AMI meetings, and the card cites no independent evaluation.

## Practical takeaway

Teams that already run ASR with diarization and see words landing under the wrong speaker can try this as a text-only clean-up step, on one GPU in BF16 or locally through the GGUF files with llama.cpp. Expect the clearest gains on two-party calls and modest ones on multi-speaker meetings, and check it on your own recordings before trusting it in production.
