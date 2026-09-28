---
title: "How to review code your AI assistant wrote"
description: "A practical review order for AI-generated code: check the diff, test the behavior, verify APIs and errors, then inspect security-sensitive paths."
pubDate: "2026-10-01T19:00:00Z"
specimen: 65
section: "general"
tags: ["ai-coding", "code-review", "software-testing", "security"]
draft: false
heroImage: "https://media.aitamer.news/heroes/reviewing-ai-written-code.jpg"
heroAlt: "A paper-cut collage of code sheets under a magnifying glass, with a checked test tile and a small shield."
author: "ari"
sources:
  - title: "Do Users Write More Insecure Code with AI Assistants?"
    url: "https://mlanthology.org/icmlw/2023/perry2023icmlw-users/"
  - title: "Asleep at the Keyboard? Assessing the Security of GitHub Copilot's Code Contributions"
    url: "https://arxiv.org/abs/2108.09293"
  - title: "Application card: GitHub Copilot inline suggestions"
    url: "https://docs.github.com/en/copilot/responsible-use/inline-suggestions"
  - title: "Secure Coding with AI Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Secure_Coding_with_AI_Cheat_Sheet.html"
  - title: "Small CLs"
    url: "https://google.github.io/eng-practices/review/developer/small-cls.html"
  - title: "Secure Code Review Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html"
wildness:
  rating: 2
  verified: "Studies, review guidance, and security checks are linked to primary sources"
  claimed: "Study results concern specific tools, tasks, and model generations"
verdict: "Review the behavior and boundaries yourself; use tests and a second reviewer to find gaps, not to transfer responsibility."
---

AI-generated code can appear valid and still miss the developer's intent. During review, ask whether this exact change does what the project needs, behaves safely at its boundaries, and remains understandable to the next person.

Start with the same discipline you would use for a colleague's pull request. Read the request, inspect the whole diff, run relevant checks, and follow important data paths. AI assistance changes how code arrived; it does not change what correctness means.

## Start with the request and the diff

Before reading individual lines, write down the intended behavior in one or two sentences. Then compare that intention with every changed file. Did the assistant touch only what the task requires? Does the change add dependencies, alter configuration, weaken tests, change permissions, or modify a build script along the way?

Read the diff from top to bottom. Look at deletions as carefully as additions. A removed validation branch or test can matter more than a new function. Check that names, defaults, and error behavior match the surrounding code. If a file changed without a clear connection to the task, ask why it is there before moving on.

Small changes are easier to reason about. Google's [code review guidance on small changes](https://google.github.io/eng-practices/review/developer/small-cls.html) says focused changes help authors and reviewers understand impact and identify bugs. If an assistant produces a large patch, ask it to split the work into coherent steps, or remove unrelated edits before review. Keep the full task behavior covered across those steps.

## Check that tests can catch the wrong behavior

A passing test suite answers only the question its tests ask. Read the new and modified tests. What behavior does each assertion protect? Would the test fail if the implementation returned the wrong value, skipped a permission check, or swallowed an error? A test that only checks a result exists may pass while the result is wrong.

Look for tests that mirror the implementation too closely. If the assistant wrote both a function and a test from the same mistaken interpretation, the test can confirm the mistake. Add a case from the requirement itself, especially a negative case: invalid input, missing permission, empty data, timeout, malformed response, or a boundary value that should be rejected.

Inspect test changes for deleted cases, weaker assertions, and mocks that replace the very dependency the test should exercise. The [OWASP Secure Coding with AI Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Coding_with_AI_Cheat_Sheet.html) specifically recommends reviewing AI-generated test changes and adding adversarial cases. Run the relevant tests yourself, then run the project's broader checks when the change warrants them. Passing checks provide limited evidence about the behavior tested.

## Verify APIs, dependencies, and errors

Check unfamiliar methods and options in the project's installed library version or its official documentation. Plausible names can still be invented, deprecated, or available only in a newer release. Confirm a proposed package exists in the expected registry and is the package you intended before adding or installing it. OWASP calls out hallucinated dependency names and recommends verifying suggested packages before installation.

Trace each failure path. When an operation can fail, does the code return the error, add useful context, retry under a clear rule, or deliberately recover? Watch for empty catch blocks, broad exception handlers, fallback values that hide failure, and logs that omit the relevant context. Ask what the caller and operator will observe if the network, file, database, or parser fails.

Run the code's formatter, type checker, linter, and tests where available. Then consider a failure case that those checks do not cover. Static checks can catch known patterns. Product-specific fallback choices and intended behavior still need manual review.

## Follow data through security boundaries

Pay extra attention wherever untrusted input becomes a database query, file path, shell argument, HTML output, or external request. Follow the value from where it enters, through validation and transformation, to where it is used. Check authentication and authorization separately: identifying a user does not establish that the user may perform this action on this record.

Review secrets, cryptography, permission defaults, and dependency changes with the same care. Make sure secrets are not added to source or logs. Confirm that input is validated and output is encoded for its destination. For coding agents, inspect build and deployment files too; those can run automatically with broader privileges. OWASP's [secure code review guidance](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html) recommends tracing sources through processing to sinks such as queries, file writes, rendering, and external APIs.

Research gives a reason to keep this scrutiny. In a 2023 user study, [Perry and colleagues](https://mlanthology.org/icmlw/2023/perry2023icmlw-users/) found that participants with access to an assistant based on OpenAI's codex-davinci-002 model wrote less secure code on the study's security tasks, and were more likely to believe their code was secure. In a separate benchmark, [Pearce and colleagues](https://arxiv.org/abs/2108.09293) tested GitHub Copilot on 89 scenarios, generating 1,689 programs, and reported that approximately 40 percent were vulnerable. These results describe specific tasks and older systems, so they cannot establish the security of every current assistant or type of programming work. They illustrate why confidence and plausible syntax are poor substitutes for checking behavior.

## Ask the assistant to explain, then challenge the explanation

After you have your own reading of the diff, ask the assistant to explain the control flow, assumptions, edge cases, and any changed APIs. Point to specific files or functions. Compare its account against the code and documentation; an explanation is another generated answer that needs checking.

Then ask it to review the patch for concrete failure classes: “Find cases where this returns success after a failed operation,” or “Trace untrusted input to database and file operations. List possible issues with file and line references; do not edit anything.” A narrow prompt makes it easier to assess each finding. Verify every suggested fix against the requirement. A reviewer can also miss bugs, so treat a clean second pass as one more signal.

GitHub's [responsible-use guidance for Copilot](https://docs.github.com/en/copilot/responsible-use/inline-suggestions) likewise says generated code can be inaccurate or insecure and recommends that users review, test, and validate it. Vendor guidance is useful for setting expectations; your own checks establish whether this patch fits your codebase.

## Use a second reviewer for a different angle

For a consequential change, ask a teammate or a separate model to review the final diff independently. Give the reviewer the requirement and relevant context, and ask for findings with locations and reasons. [OWASP warns](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Coding_with_AI_Cheat_Sheet.html) that reviewers anchored on the requested change can miss unrelated modifications. Give the reviewer the full patch so they can question whether each edit belongs and what it breaks.

Do not treat agreement between two models as proof. Resolve findings by reproducing them or tracing the relevant behavior. Keep human review for decisions about product intent, access, and risk.

## Make the merge decision explicit

Before merging, summarize what the change does, which checks you ran, what risks you inspected, and any known limitation. If you cannot explain a behavior or confirm an API, resolve that uncertainty first. For a small, low-risk change, a focused diff and relevant tests may be enough. For authentication, sensitive data, payment, permissions, or deployment paths, include deeper manual review and security tests.

The practical habit is simple: read the requirement, inspect the entire diff, test the behavior the requirement names, trace errors and trust boundaries, then get an independent view when the consequences justify it. Let the assistant help you explore. Keep the merge decision yours.
