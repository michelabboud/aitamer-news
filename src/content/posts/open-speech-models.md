---
title: "Open speech models: choosing local transcription and text-to-speech"
description: "A practical guide to Whisper, Parakeet, Canary, Kokoro, and Piper, with a clear way to compare word error rate and check model licenses."
pubDate: "2026-09-29T19:00:00Z"
specimen: 53
section: "models"
tags: ["speech-to-text", "text-to-speech", "open-weights", "whisper", "wer"]
draft: false
heroImage: "https://media.aitamer.news/heroes/open-speech-models.jpg"
heroAlt: "A paper-cut collage of a cream waveform flowing into blank transcript cards and a paper speaker, on a slate-blue field with a coral accent."
author: "ari"
sources:
  - title: "Whisper README"
    url: "https://github.com/openai/whisper/blob/main/README.md"
  - title: "faster-whisper README"
    url: "https://github.com/SYSTRAN/faster-whisper"
  - title: "whisper.cpp README"
    url: "https://github.com/ggml-org/whisper.cpp/blob/master/README.md"
  - title: "NVIDIA NeMo ASR introduction"
    url: "https://github.com/NVIDIA-NeMo/Speech/blob/main/docs/source/asr/intro.rst"
  - title: "NVIDIA Parakeet TDT 0.6B v3 model card"
    url: "https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3"
  - title: "NVIDIA Canary 1B v2 model card"
    url: "https://huggingface.co/nvidia/canary-1b-v2"
  - title: "NIST OpenASR21 evaluation paper"
    url: "https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=934557"
  - title: "Kokoro-82M model card"
    url: "https://huggingface.co/hexgrad/Kokoro-82M"
  - title: "Piper TTS README"
    url: "https://github.com/OHF-Voice/piper1-gpl/blob/main/README.md"
  - title: "Piper TTS license"
    url: "https://github.com/OHF-Voice/piper1-gpl/blob/main/COPYING"
  - title: "Piper package license metadata"
    url: "https://github.com/OHF-Voice/piper1-gpl/blob/main/setup.py"
  - title: "Whisper.cpp license"
    url: "https://github.com/ggml-org/whisper.cpp/blob/master/LICENSE"
  - title: "faster-whisper license"
    url: "https://github.com/SYSTRAN/faster-whisper/blob/master/LICENSE"
  - title: "Piper Lessac medium voice model card"
    url: "https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/lessac/medium/MODEL_CARD"
wildness:
  rating: 4
  verified: "Source documents and license metadata were checked; model performance was not independently tested."
  claimed: "Model capabilities, speed, and quality rely on project documentation; no local benchmark was run."
verdict: "Pick a model by testing your own audio and checking the exact code, weight, and voice licenses before deployment."
---

Speech models can keep audio on a machine you control, run without a per-minute service, and fit into applications with different hardware budgets. The trade is that “open” covers several separate things: source code, model weights, runtime, and sometimes a voice pack each have their own license and requirements.

For transcription, start with the audio you need to support and compare a few models on it. For spoken output, choose a text-to-speech (TTS) voice whose terms and pronunciation suit the application. Neither task has a universal winner.

## Transcription models solve the same task in different ways

Automatic speech recognition (ASR), also called speech-to-text (STT), turns audio into text. [OpenAI’s Whisper](https://github.com/openai/whisper/blob/main/README.md) is a multilingual model family. Its documentation describes transcription and translation, and reports that performance varies by language. That variation is a reason to test the language, accent, and recording conditions you actually expect. The default `turbo` model is not trained for translation; the README directs users to another multilingual model for that task.

Several projects are alternative ways to run Whisper weights rather than new recognition models. [faster-whisper](https://github.com/SYSTRAN/faster-whisper) reimplements Whisper inference using CTranslate2, a runtime for Transformer models. Its maintainers report speed and memory improvements over the original implementation; treat those as a project claim and measure on your hardware. [whisper.cpp](https://github.com/ggml-org/whisper.cpp/blob/master/README.md) is a C/C++ implementation with CPU and GPU options, including a command-line program and server. Both can be useful when deployment constraints matter as much as the model itself.

As of September 2026, NVIDIA’s [Parakeet TDT 0.6B v3 model card](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3) offers another ASR family, with a Transformers loading example and downloadable model files. NVIDIA’s [Canary 1B v2 card](https://huggingface.co/nvidia/canary-1b-v2) describes a multilingual model that supports transcription and speech translation. The [NeMo ASR guide](https://github.com/NVIDIA-NeMo/Speech/blob/main/docs/source/asr/intro.rst) documents model loading and timestamp output. Check each model card for supported languages, formats, and license before choosing: names in the same toolkit do not guarantee identical abilities or terms.

## WER is useful only when the test is comparable

Word error rate (WER) compares a machine transcript with a human reference. [NIST’s OpenASR21 paper](https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=934557) defines it as deletions plus insertions plus substitutions, divided by the number of words in the reference. A deletion is a missed word, an insertion is an extra word, and a substitution is a word replaced by another. Lower is better on the same test. Since insertions can outnumber reference words, WER can exceed 100 percent.

The score depends on what was recorded and how the reference is prepared. NIST’s OpenASR21 evaluation used case-insensitive scoring for all 15 languages and offered an optional case-sensitive track for three. Other evaluations may apply different text handling. Language, accents, noise, speaking style, segmentation, punctuation, and names can all make results differ. So a leaderboard number is a description of one evaluation setup, not a promise about your application.

Build a small evaluation set from representative, permissioned recordings and accurate human transcripts. Keep the same clips, reference text, and normalization rules for every candidate. Calculate WER with a consistent scorer, then listen to errors rather than treating the one aggregate number as the whole result. Also check latency, memory use, and whether timestamps or translation are needed. If you compare published numbers, first confirm that the datasets and scoring rules match.

## Run locally, then measure the actual deployment

The simplest way to start is usually a project’s own documented inference path. Whisper offers command-line transcription; faster-whisper documents a Python install and usage; whisper.cpp documents downloading a model and passing a 16-bit WAV file to `whisper-cli`. For NVIDIA’s models, the model cards show how to load them through Transformers or NeMo. These are different software stacks, so do a small install and inference trial before you design an application around one.

"Local" describes where inference runs, not how easy it is to operate. A model still needs enough memory and compute for the chosen precision and throughput. A graphics processing unit (GPU) path may require platform-specific drivers or libraries; a central processing unit (CPU) build may be simpler to deploy but slower. Record the exact model revision, runtime, hardware, and settings alongside your evaluation. For a service, test concurrent requests and long recordings, too. The published speed claims for faster-whisper, for example, are not a substitute for timing your own workload.

TTS turns text into generated speech. As of September 2026, the [Kokoro-82M model card](https://huggingface.co/hexgrad/Kokoro-82M) describes an open-weight TTS model and lists the Apache 2.0 license, with usage and voice information. The [Piper project](https://github.com/OHF-Voice/piper1-gpl/blob/main/README.md) is a local neural TTS engine with a documented Python package. Its [package metadata](https://github.com/OHF-Voice/piper1-gpl/blob/main/setup.py) identifies GPL-3.0-or-later terms. In either case, listen for names, numbers, abbreviations, and the languages your product will speak. A technically successful audio file can still pronounce crucial text badly.

## Check the license at every layer

Whisper’s repository says its code and model weights use the MIT License. The [faster-whisper implementation](https://github.com/SYSTRAN/faster-whisper/blob/master/LICENSE) and [whisper.cpp](https://github.com/ggml-org/whisper.cpp/blob/master/LICENSE) also carry MIT licenses; record each runtime and its model weights separately. NVIDIA’s Parakeet and Canary cards identify their model terms as Creative Commons Attribution 4.0 (CC BY 4.0). Kokoro’s card lists Apache 2.0. Piper’s [package metadata](https://github.com/OHF-Voice/piper1-gpl/blob/main/setup.py) identifies GNU General Public License version 3 or later (GPL-3.0-or-later); its [COPYING file](https://github.com/OHF-Voice/piper1-gpl/blob/main/COPYING) contains the license text. These licenses differ in their conditions. Read the actual license and attribution requirements for the exact artifact you plan to ship.

TTS has another layer: voice assets and the material used to train them. Piper’s [Lessac medium voice card](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/lessac/medium/MODEL_CARD) names a dataset and links to that dataset’s license. Check the exact voice card and its linked conditions rather than assuming the engine license covers every asset. More generally, review code, weights, voices, and referenced datasets independently, and record their versions and notices in your application’s dependency process.

## Choose with a small bake-off

For transcription, compare Whisper through one runtime with Parakeet or Canary if their language and task support fit. Include faster-whisper or whisper.cpp when runtime portability, resource use, or integration is the deciding factor. Score your test set, inspect failure cases, and measure on the hardware you will deploy.

For generated speech, start with Kokoro or Piper, listen to representative text, and verify the voice terms. Keep speech local when privacy or offline operation is a requirement you can support operationally. If the model misses domain terms, test vocabulary adaptation or another model before adding a correction layer. Choose the simplest candidate that meets your quality, latency, privacy, and license constraints, then pin and re-evaluate its artifacts as you update them.
