---
title: A safety classifier can check both the prompt and the reply
description: Llama Guard classifies user prompts and model replies against a hazard taxonomy. Here is where to place it in a request path and how to read its category labels.
pubDate: "2026-10-11T14:30:00Z"
section: models
tags:
  - safety
  - llama-guard
  - content-moderation
  - guardrails
  - classifiers
draft: false
heroImage: https://media.aitamer.news/heroes/a-safety-classifier-can-check-both-the-prompt-and-the-reply-08511de3.jpg
heroAlt: A cream prompt and muted teal reply pass through a slate blue paper classifier gate.
author: quill
wildness:
  rating: 2
  verified: One model classifies prompts and replies; output lists violated categories
  claimed: Matches or exceeds other moderation tools on two public benchmarks
verdict: A practical layer for both ends of a request. Parse labels strictly, fail closed on odd output, and check the taxonomy fits your policy. It has known gaps.
sources:
  - title: "Llama Guard: LLM-based Input-Output Safeguard for Human-AI Conversations (arXiv 2312.06674)"
    url: https://arxiv.org/abs/2312.06674
  - title: Llama Guard paper, HTML version
    url: https://arxiv.org/html/2312.06674
  - title: meta-llama/LlamaGuard-7b model card
    url: https://huggingface.co/meta-llama/LlamaGuard-7b
  - title: Llama Guard 3 8B model card (PurpleLlama)
    url: https://github.com/meta-llama/PurpleLlama/blob/main/Llama-Guard3/8B/MODEL_CARD.md
  - title: meta-llama/Llama-Guard-3-8B model card
    url: https://huggingface.co/meta-llama/Llama-Guard-3-8B
---

A filter that checks only user input misses the case where a harmless-looking prompt produces a harmful reply. A filter that checks only output spends a model call on requests you would have refused anyway. Llama Guard is built to run at both points with one model.

## What Llama Guard is

The paper [Llama Guard: LLM-based Input-Output Safeguard for Human-AI Conversations](https://arxiv.org/abs/2312.06674) (Inan et al.) describes a safeguard model built on Llama2-7b and instruction-tuned on a small, high-quality dataset. It uses a safety risk taxonomy to classify both user prompts and model responses. The authors report that it matches or exceeds existing content moderation tools on the OpenAI Moderation Evaluation dataset and ToxicChat, and they released the weights.

The [full paper](https://arxiv.org/html/2312.06674) says the two tasks are separated "simply by change of wording in the instruction tasks for the same model". The instruction states whether to classify the user messages, which the paper calls prompts, or the agent messages, which it calls responses.

## How to read the output

The model answers in text. Per the paper, the output starts with `safe` or `unsafe`. If unsafe, "the output should contain a new line, listing the taxonomy categories that are violated." The original model writes each category as a letter followed by its 1-based index in the policy, such as `O3`. A flagged result looks like this:

```text
unsafe
O3
```

The [original model card](https://huggingface.co/meta-llama/LlamaGuard-7b) names six categories: Violence & Hate, Sexual Content, Guns & Illegal Weapons, Regulated or Controlled Substances, Suicide & Self Harm, and Criminal Planning.

Later releases changed the taxonomy. The [Llama Guard 3 8B model card](https://github.com/meta-llama/PurpleLlama/blob/main/Llama-Guard3/8B/MODEL_CARD.md) lists fourteen hazard codes, from S1 "Violent Crimes" to S14 "Code Interpreter Abuse", including S7 "Privacy" and S13 "Elections". It lists English, French, German, Hindi, Italian, Portuguese, Spanish and Thai as supported languages. That card says the model lists the violated categories when a result is unsafe. It does not spell out the line layout, so write a parser that accepts either code style, and map codes to names from the card of the exact model you deploy.

## Where it sits in the request path

Run two checks around the main model call:

1. Classify the user turn. If unsafe, refuse and skip the main model.
2. Call the main model.
3. Classify the conversation including the reply. If unsafe, withhold the reply.

The Hugging Face model cards, including the one for [Llama Guard 3 8B](https://huggingface.co/meta-llama/Llama-Guard-3-8B), show a `moderate(chat)` helper that applies the tokenizer's chat template, generates up to 100 new tokens and decodes only the new text. A request handler around it can look like this, where `refusal` and `generate_reply` are your own functions:

```python
import re

def parse_verdict(text):
    lines = text.strip().splitlines()
    head = lines[0].strip() if lines else ""
    if head not in ("safe", "unsafe"):
        raise ValueError(f"unexpected guard output: {text!r}")
    if head == "safe":
        return "safe", []
    return "unsafe", re.findall(r"[A-Z]\d+", " ".join(lines[1:]))

def handle(user_msg, generate_reply):
    chat = [{"role": "user", "content": user_msg}]
    verdict, codes = parse_verdict(moderate(chat))
    if verdict == "unsafe":
        return refusal(codes)
    reply = generate_reply(chat)
    chat.append({"role": "assistant", "content": reply})
    verdict, codes = parse_verdict(moderate(chat))
    if verdict == "unsafe":
        return refusal(codes)
    return reply
```

Three choices in that sketch are deliberate. An output the parser does not recognise raises an error, so the caller can fail closed instead of treating noise as safe. The category codes travel to `refusal` and into your logs, which tells you which policy fired. And the second check sends the whole conversation, as the model card's own example does with a user message and an assistant reply. The paper says the instruction wording decides which role is assessed, so confirm in your chat template that the reply is the turn under assessment.

## Using a score instead of the label

Both model cards say they take the probability of the first generated token as the "unsafe" class probability. The paper notes that this score can be read off directly and that the area under the precision-recall curve helps select a threshold that balances precision and recall. Neither source gives a recommended threshold for production. If you use the score, pick the threshold on labelled traffic from your own product.

## Where this stops

The paper lists its own limits. Its common sense knowledge is limited by its training data. Its fine-tuning data and most of its pretraining data are in English. The authors do not claim perfect coverage of their policy. The model may be susceptible to prompt injection, and the Llama Guard 3 card repeats that risk. That card adds that some hazard categories may need up-to-date factual knowledge to judge.

The original model card warns that comparisons with other tools are not exactly apples-to-apples, because each tool uses a different taxonomy, and that the taxonomy does not necessarily reflect Meta's own internal policies. Check that the categories match your own policy. The paper says instruction tuning lets you customize the taxonomy through zero-shot or few-shot prompting. The sources do not cover streaming. A full-reply check implies you hold the reply until the check passes. Treat the classifier as one layer next to your other controls.
