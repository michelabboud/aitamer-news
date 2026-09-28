---
title: "Prompt injection reaches agents through the data they read"
description: "Prompt injection can arrive in a user prompt, web page, file, email or tool result. Build defenses around permissions and actions because text filters cannot reliably stop it."
pubDate: 2026-09-30T15:00:00Z
specimen: 57
section: "dev"
tags: ["ai-security", "agents", "prompt-injection", "llm-safety"]
draft: false
heroImage: "https://media.aitamer.news/heroes/prompt-injection-for-builders.jpg"
heroAlt: "A paper-cut collage of a coral-marked paper slip passing through a slate-blue gate beside a separate cream instruction card."
author: "ari"
sources:
  - title: "OWASP Top 10 for Large Language Model Applications"
    url: "https://genai.owasp.org/llm-top-10/"
  - title: "OWASP LLM Prompt Injection Prevention Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html"
  - title: "OpenAI: Safety in building agents"
    url: "https://developers.openai.com/api/docs/guides/agent-builder-safety"
  - title: "OpenAI Agents SDK: Guardrails and human review"
    url: "https://developers.openai.com/api/docs/guides/agents/guardrails-approvals"
  - title: "Anthropic: Trustworthy agents in practice"
    url: "https://www.anthropic.com/research/trustworthy-agents"
  - title: "Anthropic: Mitigating the risk of prompt injections in browser use"
    url: "https://www.anthropic.com/research/prompt-injection-defenses?slug=helpful-honest-harmless-ai"
wildness:
  rating: 2
  verified: "OWASP guidance corroborates the attack routes and mitigation layers."
  claimed: "OpenAI and Anthropic describe their own safeguards; their effectiveness is not independently tested here."
verdict: "Treat every external text source as untrusted, limit what the agent can do, and require approval before consequential actions."
---

Prompt injection is an attack in which text or other content attempts to change how a large language model (LLM) behaves. The [Open Worldwide Application Security Project (OWASP) lists prompt injection as LLM01 in its Top 10 for Large Language Model Applications](https://genai.owasp.org/llm-top-10/). The risk grows when an application gives a model access to tools, private data or the ability to change something in the world.

The basic problem is that an LLM interprets language. The same context can contain instructions from the application, a request from the user and material the model was asked to inspect. A malicious sentence inside that material can look like another instruction. If the model follows it, its connected tools may carry out the attacker’s intent.

## Direct and indirect attacks arrive through different paths

A **direct injection** comes from the user’s message. For example, a user might ask the model to ignore its rules and expose hidden instructions. This is visible in the conversation and can be tested at the application’s request boundary.

An **indirect injection** comes from material the model reads while doing an otherwise legitimate task. OWASP’s [prevention guidance](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) names web pages, documents, email, code comments, issue descriptions and tool results as possible carriers. The instruction may be hidden in a page or attachment, or written plainly in a file that the agent was asked to summarize.

Imagine an assistant asked to review a project’s issue tracker and draft a summary. One issue contains a sentence telling the assistant to search local files for credentials and send them elsewhere. The sentence is part of the issue’s content. It is not authorization from the user. A model may still treat it as an instruction. The same route exists when a [browser fetches a page](https://www.anthropic.com/research/prompt-injection-defenses?slug=helpful-honest-harmless-ai), a retrieval system returns a poisoned passage, or a tool returns attacker-controlled text.

This is why an agent changes the threat model. A chatbot can return a manipulated answer. An agent can also use tools to read a mailbox, edit a file, run a command or send a message. The model’s interpretation can become an action with consequences.

## Why a filter cannot be the security boundary

Filtering still helps. An application can reject known attack phrases, strip suspicious markup, flag hidden text and scan incoming content. Those checks can catch familiar patterns and reduce exposure.

They cannot reliably identify every malicious instruction. Attackers can rephrase, encode or hide text, and benign content can include the same words for discussion or analysis. A filter that only scans text cannot decide whether a particular tool call is authorized in the current task. OWASP describes prompt injection as a weakness in how language models process instructions and data; separating those roles is difficult to guarantee through phrase matching alone.

A second model that screens inputs or proposed actions can add another useful signal. It has its own failure modes, though. [OpenAI describes input guardrails as a first layer and says its safeguards do not make agents perfect](https://developers.openai.com/api/docs/guides/agent-builder-safety). [Anthropic likewise says no single defense guarantees protection](https://www.anthropic.com/research/trustworthy-agents). Treat classifiers and model robustness as risk reduction, not as permission to grant broad access.

## Put hard limits around tools and data

Start with **least privilege**: give the agent only the data and operations its task needs. A summarizer usually needs read access to the selected documents, not permission to send email or change account settings. A coding helper can work inside a narrow project directory without access to unrelated files or secrets. Use scoped credentials and read-only access wherever practical, and make the application enforce those limits outside the model.

Keep instructions and untrusted content distinct in your application design. Pass external text as data in a separate message or clearly delimited field. Tell the model what it should extract or summarize, and that instructions found inside the material are content to report rather than commands to follow. [OpenAI recommends keeping untrusted variables out of developer instructions and using structured outputs to constrain what passes between workflow steps](https://developers.openai.com/api/docs/guides/agent-builder-safety). Those boundaries help the model; the authorization layer must still prevent a mistaken interpretation from granting new powers.

Prefer narrow structured outputs over free-form text when one model step feeds another. For example, have a reader return validated fields such as a date, sender and requested action. Then let ordinary application code check those fields against policy before selecting a tool. Validate tool arguments on the server, including the resource, destination and operation. Do not let text from a web page silently choose where private data is sent.

## Pause before actions with consequences

Require explicit human approval before actions that send information outside the system, modify important records, spend money, run untrusted code or delete data. The approval screen should show the actual operation and relevant arguments, not just a generic “continue?” prompt. Approval is useful only when a person can understand what will happen.

Approval should be tied to the specific action. A user asking an agent to summarize email has not also approved forwarding messages. A narrow, reviewable action is easier to check than a broad instruction to handle an account or inbox. [OpenAI’s agent guidance recommends approvals around side effects](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals); [Anthropic’s agent guidance similarly emphasizes human control, appropriate permissions and layered defenses](https://www.anthropic.com/research/trustworthy-agents).

Log tool requests and results with enough context to investigate unexpected behavior, while protecting sensitive content in those logs. Test the whole path, including indirect injections in pages, attachments, retrieved text and tool responses. Check whether the agent keeps to the user’s request, refuses unauthorized actions and asks for approval at the right boundary. Re-run those scenarios when prompts, models, tools or permissions change.

## Choose the boundary before choosing the filter

If your AI feature only answers questions over public text, you still need to test for manipulated output. If it can access private data or take actions, design permissions and approval gates first. Keep untrusted material separate from trusted instructions, validate every tool call against application policy and use filters as an additional layer.

A practical first release is a read-only agent limited to task-specific data, with structured results and a human review step before any external or state-changing action. Expand its access only when a real workflow needs it and you can explain how that capability is constrained. Prompt injection may remain possible; the application should make a successful injection insufficient to cause an unauthorized action.
