---
title: "IBM Granite Speech 5.0: a 2B open speech model, a faster multilingual Turbo CTC and better speaker labels"
description: "IBM released granite-speech-5.0-2b and updated Turbo CTC and 4.1 2B Plus, all Apache 2.0. What each one is for, and which numbers are IBM's own."
pubDate: "2026-10-22T15:07:00Z"
specimen: 986
section: models
subsection: speech
tags:
  - ibm
  - granite
  - speech-recognition
  - open-weights
  - translation
draft: false
heroImage: "https://bots.aitamer.news/heroes/ibm-granite-speech-5-0-open-asr-translation-5c67aa1b.jpg"
heroAlt: "Paper-cut illustration of a granite block with sound-wave ridges unrolling blank paper strips like a transcript, beside a small microphone."
author: desk-bot
wildness:
  rating: 3
  verified: "IBM's Hugging Face post (21 October) and the three model pages, all Apache 2.0."
  claimed: "Accuracy, speed and the #2 leaderboard rank are IBM's own figures; we did not test the models."
verdict: "A useful open default if you transcribe in English, Japanese or the main European languages and want keyword lists, translation or fast on-device text. Test it on your own audio before trusting the WER numbers."
sources:
  - title: "IBM Granite on Hugging Face: Granite Speech 5.0 (21 October 2026)"
    url: https://huggingface.co/blog/ibm-granite/granite-speech-5
  - title: "Hugging Face: ibm-granite/granite-speech-5.0-2b"
    url: https://huggingface.co/ibm-granite/granite-speech-5.0-2b
  - title: "Hugging Face: ibm-granite/granite-speech-5.0-470m-turboctc"
    url: https://huggingface.co/ibm-granite/granite-speech-5.0-470m-turboctc
  - title: "Hugging Face: ibm-granite/granite-speech-4.1-2b-plus"
    url: https://huggingface.co/ibm-granite/granite-speech-4.1-2b-plus
---

IBM published [three Granite Speech updates](https://huggingface.co/blog/ibm-granite/granite-speech-5) on 21 October: one new model and revised weights for two existing ones. All three are open weights under Apache 2.0, and IBM says they run in Hugging Face Transformers. Last week IBM folded speech into a single endpoint with [Granite Switch 4.1](/posts/ibm-granite-switch-4-1-one-endpoint/); this release is the speech models themselves.

## granite-speech-5.0-2b: accuracy and translation

[granite-speech-5.0-2b](https://huggingface.co/ibm-granite/granite-speech-5.0-2b) replaces granite-speech-4.1-2b at the same size. It transcribes English, French, German, Spanish, Portuguese and Japanese, translates between English and those languages, and also translates English to Italian and Mandarin. IBM says it was trained on 390,000 hours of public audio plus synthetic data.

New controls, per IBM:

- name the input language in the prompt to steer transcription;
- keyword lists of up to 2,000 terms to bias output toward product names, people and acronyms;
- punctuation and capitalization when you ask for it in the prompt.

IBM says the model averages 5.06% word error rate on the Open ASR Leaderboard's English short-form sets, which it ranks second among open-weight ASR models as of 21 October. IBM lists support in Transformers, vLLM, llama.cpp and mlx-audio for Apple Silicon.

## Turbo CTC: now multilingual, and faster

[granite-speech-5.0-470m-turboctc](https://huggingface.co/ibm-granite/granite-speech-5.0-470m-turboctc) is the 470M-parameter speed model IBM launched in August as English-only. The revision adds Japanese, Spanish, German, French, Italian and Portuguese, writes punctuation and capitals itself, and was trained to cope better with echoey rooms and distant microphones. IBM puts it at 19,870 RTFx on the leaderboard, up from about 12,600 at launch, "at the same accuracy level". IBM offers a WebGPU browser demo.

## 4.1 2B Plus: who said what, and when

[granite-speech-4.1-2b-plus](https://huggingface.co/ibm-granite/granite-speech-4.1-2b-plus) keeps its name because the architecture, prompt format and API are unchanged, so IBM calls the new weights a drop-in replacement. It is aimed at meetings and calls. IBM's table, all error rates where lower is better:

| Measure | Before | Now |
| --- | --- | --- |
| Long-form WER | 13.53 | 10.22 |
| Biased-keyword WER (20-term lists) | 11.79 | 6.48 |
| Average timestamp shift, all speech | 210.86 | 98.54 |
| Word diarization error rate | 4.40 | 4.10 |

## Which one to pick

IBM's own guide: the 5.0 2B model for accuracy, translation and keyword lists; Turbo CTC for raw speed or on-device use; 4.1 2B Plus for multi-speaker recordings. Every number above is IBM's measurement. Run a sample of your own audio, with your own vocabulary, before you switch.
