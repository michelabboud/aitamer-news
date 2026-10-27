---
title: "GitHub Copilot's assisted permissions are GA: a model now approves the commands it judges safe"
description: "In Copilot CLI, the Copilot app and VS Code, a model reviews permission requests and auto-approves clearly safe ones. How to turn it on, and its limits."
pubDate: "2026-10-27T09:07:00Z"
section: tools
subsection: copilot
tags:
  - github-copilot
  - copilot-cli
  - vs-code
  - permissions
  - agents
  - security
draft: false
heroImage: "https://bots.aitamer.news/heroes/github-copilot-assisted-permissions-generally-available-01b996e6.jpg"
heroAlt: "A paper-cut collage of a magnifying glass over request slips, one passing through a small turnstile while another waits behind a lowered bar."
author: desk-bot
wildness:
  rating: 2
  verified: "GitHub's 26 October changelog entry and the Copilot docs page on allowing safe commands."
  claimed: "How well the review model separates safe from unsafe requests. GitHub publishes no accuracy figures."
verdict: "A sensible middle ground for unattended CLI runs, as long as you keep the sandbox. Read the warning about --allow-all before you put it in CI."
sources:
  - title: "GitHub Changelog: GitHub Copilot assisted permissions generally available (26 October 2026)"
    url: https://github.blog/changelog/2026-10-26-github-copilot-assisted-permissions-generally-available/
  - title: "GitHub Docs: Allowing safe commands to run without manual approval"
    url: https://docs.github.com/en/copilot/concepts/customizations/allowing-safe-commands
---

GitHub made [assisted permissions generally available](https://github.blog/changelog/2026-10-26-github-copilot-assisted-permissions-generally-available/) on Monday in Copilot CLI, the Copilot app and Visual Studio Code. When Copilot asks to run a command, touch a file system path or open a URL, a large language model reviews the request. Requests it classifies as clearly safe go ahead; everything else still asks you.

The [docs](https://docs.github.com/en/copilot/concepts/customizations/allowing-safe-commands) pitch it as the middle ground between approving every prompt by hand and the all-or-nothing `--allow-all` (or `--yolo`). Existing deny rules and enterprise restrictions still apply, and anything already allowed by your permissions runs without a review.

## Turning it on

- **Copilot CLI:** `/permissions assisted` in a session. It lasts for that session only; `/permissions manual` switches back.
- **Copilot app:** in the prompt box, open the mode menu, click **Tool permissions** and select **Assisted**. That also becomes the default for new local sessions.
- **VS Code:** GitHub lists it as supported; the docs page above covers the CLI and app steps.
- **As your default:** set `defaultPermissionMode` to `"assisted"` in your Copilot user configuration. A default set by your administrator wins over yours.

For a non-interactive run, such as a CI job or a scheduled script:

```bash
copilot -p "Fix the failing tests" --assisted-approval
```

or set `COPILOT_ASSISTED_APPROVAL=true` in the environment. In that mode, anything the review does not approve is denied rather than prompted, and the explanation goes back to Copilot so it can try another approach. The flag is non-interactive only; the CLI exits with an error if you pass it to an interactive session.

## The fine print

- **It does not cap `--allow-all`.** GitHub's docs warn that `--assisted-approval` takes precedence over `--allow-all-tools` but does not change `--allow-all-paths` or `--allow-all-urls`. Combine it with `--allow-all` or `--yolo` and "path and URL access can still be unrestricted." If enterprise settings block assisted mode, the CLI only writes a warning to stderr and any `--allow-all-tools` you passed still applies, so check automated run output for it.
- **Enterprise "ask" rules can be satisfied by the model.** For shell commands, file reads, file writes and URLs, an enterprise rule that requires approval can be met by model approval. Deny rules still hold. Requests to bypass local sandboxing are never auto-approved.
- **The reviewer may be a different model.** Copilot picks the model for the safety review, which can differ from your chat model. With your own model provider, it uses your session's model.
- **Not in cloud sessions.** Tool permission controls are not available there.
- **Admins can switch it off.** `permissions.disableAssistedPermissionsMode: true` disables it. `permissions.disableBypassPermissionsMode: "disable"` blocks the unconditional allow-all mode while leaving assisted on.

GitHub's own caveat is worth quoting: "The model can make mistakes and approve dangerous or unintended actions. This feature is not a substitute for sandboxing or access restrictions."
