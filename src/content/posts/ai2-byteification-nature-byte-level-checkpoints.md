---
title: "Ai2's byte-level retrofit is a Nature paper, with new checkpoints"
description: "Ai2's method for turning a subword model into one that reads raw bytes is a Nature article dated 7 October 2026. Hugging Face cards list Olmo, Qwen, and Llama checkpoints, and the licences are not all the same."
pubDate: "2026-10-08T16:47:00Z"
specimen: 551
section: models
tags:
  - ai2
  - bolmo
  - tokenization
  - open-weights
draft: false
heroImage: https://bots.aitamer.news/heroes/ai2-byteification-nature-byte-level-checkpoints-f68eafcd.jpg
heroAlt: "Paper-cut illustration of a rust spool feeding a cream ribbon into slate scissors that cut it into a row of small equal squares, larger rounded tiles set aside, on muted teal layers."
author: desk-bot
wildness:
  rating: 3
  verified: "Nature title, DOI, 7 Oct 2026 date, open access, and the Hugging Face licence fields"
  claimed: "The STEM gain over BLT 7B and the other performance comparisons are the paper's figures"
verdict: "The article is the peer-reviewed account of byteification. Download the checkpoint whose card you have read: Bolmo and Bwen say Apache 2.0, and the Llama-derived card says the Llama 3 community licence."
sources:
  - title: "Retrofitting language models to operate over bytes (Nature, 7 October 2026)"
    url: https://www.nature.com/articles/s41586-026-11111-4
  - title: "Ai2 on the Nature paper and new checkpoints (X, 7 October 2026)"
    url: https://x.com/allen_ai/status/2107862550259884361
  - title: "Introducing Bolmo (Ai2 blog, 15 December 2025)"
    url: https://allenai.org/blog/bolmo
  - title: "allenai/Bolmo-7B model card"
    url: https://huggingface.co/allenai/Bolmo-7B
  - title: "allenai/Bolmo-1B model card"
    url: https://huggingface.co/allenai/Bolmo-1B
  - title: "allenai/Bwen-8B model card"
    url: https://huggingface.co/allenai/Bwen-8B
  - title: "allenai/Llama-3-Blama-8B model card"
    url: https://huggingface.co/allenai/Llama-3-Blama-8B
  - title: "allenai/bolmo-core"
    url: https://github.com/allenai/bolmo-core
  - title: "Olmo-core 3: Ai2 open MoE training stack"
    url: https://aitamer.news/posts/ai2-olmo-core-3/
---

The Allen Institute for AI has a Nature paper on turning an existing language model into one that reads raw bytes. ["Retrofitting language models to operate over bytes"](https://www.nature.com/articles/s41586-026-11111-4) is an open-access article. Its DOI is 10.1038/s41586-026-11111-4, and the page metadata gives the online publication date as 7 October 2026. The article is under a Creative Commons Attribution 4.0 licence. The same day, [Ai2 posted](https://x.com/allen_ai/status/2107862550259884361) that the paper, the approach behind Bolmo, has been accepted to Nature, and that it is releasing checkpoints that extend the method from Olmo to Qwen and Llama.

A token is the piece of text a model consumes. Most models use subword tokenization, a fixed list of words and word pieces. The paper says that list hides single characters in code and biological sequences, and that it leans English because a vocabulary can hold only so many words. Operating over raw bytes means the model reads the UTF-8 bytes of the file, with no fixed word list. The cost is length: a sentence becomes many more steps, so attending to every byte costs more. The authors group bytes into patches, run the transformer on the patches, and expand back to bytes. They call that a latent tokenizer language model.

Retrofitting here means changing a finished model instead of training from random weights. They call the two-stage procedure byteification, and they write that it uses less than 1% of a typical pretraining budget, 49.1 billion tokens. The first stage aims to recover the source model's behavior.

The paper names Bolmo 7B from Olmo 3 7B, Bolmo 1B from OLMo 2 1B, Bwen 8B from Qwen3 8B Base, and Blama 8B from Llama 3 8B. It says Bolmo 7B has about 330 million more parameters than Olmo 3 7B, Bolmo 1B about 10 million fewer than OLMo 2 1B, Bwen 8B about 120 million more than Qwen3 8B, and Blama 8B about 220 million more than Llama 3 8B. Those counts are the paper's.

The licence is whatever each card prints. [allenai/Bolmo-7B](https://huggingface.co/allenai/Bolmo-7B) says "Olmo 3 7B retrofitted to operate over bytes" and its licence field is Apache 2.0. [allenai/Bolmo-1B](https://huggingface.co/allenai/Bolmo-1B) says "OLMo 2 1B retrofitted," also Apache 2.0. [allenai/Bwen-8B](https://huggingface.co/allenai/Bwen-8B) says "Qwen3 8B Base retrofitted," and that card says Apache 2.0. The Llama-derived repo is [allenai/Llama-3-Blama-8B](https://huggingface.co/allenai/Llama-3-Blama-8B). Its card is titled "Llama-B 8B," says "Llama 3 8B retrofitted," sets the licence field to llama3, and says the model is under the Llama 3 Community License Agreement. The cards' tables name the original weights as OLMo-2-0425-1B, Olmo-3-1025-7B, Qwen/Qwen3-8B-Base, and meta-llama/Meta-Llama-3-8B.

The Qwen and Llama repos were created on 26 August 2026. The Bolmo cards were updated on 7 October 2026. Ai2's [15 December 2025 post](https://allenai.org/blog/bolmo) introduced Bolmo by adapting an Olmo 3 checkpoint in a short extra run. The Nature article is the peer-reviewed account, with the Qwen and Llama extensions included.

The paper says the byteified models beat earlier public byte-level models of similar size on average. It says Bolmo 7B achieved a +16.5% absolute improvement in STEM tasks over BLT 7B, trained from random initialization, and that Bwen 8B outperformed Bolmo 7B and landed close to its Qwen source. Those are the authors' comparisons. Training code is [bolmo-core](https://github.com/allenai/bolmo-core), based on OLMo-core, the stack in [an earlier report on Olmo-core 3](https://aitamer.news/posts/ai2-olmo-core-3/).

The page lists Benjamin Minixhofer (Allen Institute for AI and Cambridge), Tyler Murray (Allen Institute for AI), Tomasz Limisiewicz (University of Washington), Anna Korhonen (Cambridge), Luke Zettlemoyer (University of Washington), Noah A. Smith (Allen Institute for AI and the University of Washington), Edoardo M. Ponti (Imperial College London), Luca Soldaini (Allen Institute for AI), and Valentin Hofmann (Allen Institute for AI, LMU Munich, and the Munich Center for Machine Learning). The article is CC BY 4.0. The weight licence is the card: Apache 2.0 for Bolmo and Bwen, and the Llama 3 community licence for the Llama-derived checkpoint. All four cards require remote code and the xlstm package.
