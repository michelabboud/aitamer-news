---
title: A Chat Role Becomes Part of the Token Sequence
description: A chat template turns role-labeled messages into the token sequence a model expects. The markers and the start of a reply depend on the model.
pubDate: "2026-10-06T22:00:00Z"
specimen: 331
section: models
tags:
  - chat-templates
  - tokenization
  - language-models
  - transformers
draft: false
heroImage: https://media.aitamer.news/heroes/the-chat-role-is-a-token-sequence-6646b82c.jpg
heroAlt: Role cards pass through a tokenizer and emerge as colored tokens entering a model profile.
author: ari
wildness:
  rating: 2
  verified: Chat templates render role-labeled messages into model-specific token sequences.
  claimed: A role field is easiest to understand by inspecting its rendered sequence.
verdict: Use the model’s chat template and inspect its output when the boundaries between messages matter.
sources:
  - title: Chat templates | Hugging Face Transformers
    url: https://huggingface.co/docs/transformers/chat_templating
---

A chat request often starts as a list of messages. Each item has a `role` and `content`. The role names the speaker. The content holds the message. Common roles are `system`, `user`, and `assistant`. Before a causal language model generates a reply, a chat template turns that list into the sequence the model expects. [Hugging Face’s chat template guide](https://huggingface.co/docs/transformers/chat_templating) describes this conversion.

## The template marks each turn

The formatted sequence contains message text and markers for its structure. A marker can identify a speaker or end a message. The model then continues that sequence of tokens. The visible message list and the model input have different shapes, even though they carry the same conversation. [The guide](https://huggingface.co/docs/transformers/chat_templating) shows message dictionaries and their formatted output side by side.

The markers depend on the model. In the guide, Mistral-7B-Instruct surrounds a user message with `[INST]` and `[/INST]`. Zephyr-7B uses markers such as `<|user|>` and `<|assistant|>`. These models share a base model, yet their chat formats differ. A template supplies the format each model expects. The guide warns that using the wrong control tokens can sharply hurt performance.

## The ending sets up the reply

The final tokens matter. With `add_generation_prompt=True`, `apply_chat_template` can append the start of an assistant message. The model can then continue from that point as the assistant. Some models do not use a separate generation prompt, so this option has no effect for them. [The examples](https://huggingface.co/docs/transformers/chat_templating) show the added assistant prefix and explain the exception.

A different option, `continue_final_message=True`, removes the ending that would close the last message. It lets generation continue that message, for example when an assistant reply has already been started. The two options serve different continuations and cannot be used together.

## What to do

1. Use the chat template supplied with the model’s tokenizer. Pass messages as `role` and `content` dictionaries.
2. Inspect the formatted output with `apply_chat_template(..., tokenize=False)`. Check how it marks speakers and where it leaves the assistant turn.
3. When tokenizing with `apply_chat_template`, use `tokenize=True`. If you format first and tokenize later, set `add_special_tokens=False` to avoid duplicate special tokens. [Hugging Face explains this tokenization detail](https://huggingface.co/docs/transformers/chat_templating).
