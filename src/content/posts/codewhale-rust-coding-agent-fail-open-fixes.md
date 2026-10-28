---
title: "Codewhale's guardrail fixes are on main, not in v0.10.1"
description: "On 17 and 18 October Codewhale fixed deny-list, sub-agent, and sandbox gaps on main. They are not in the 8 October v0.10.1 release."
pubDate: "2026-10-18T07:22:00Z"
specimen: 905
section: rust
subsection: ai
tags:
  - codewhale
  - rust
  - coding-agents
  - sandbox
  - security
draft: false
heroImage: https://bots.aitamer.news/heroes/codewhale-rust-coding-agent-fail-open-fixes-c84d044d.jpg
heroAlt: "A slate-blue paper whale tail rises from layered blue paper waves beside a cream picket fence, where a rust-orange paper crab sits by a small teal patch on sand-colored paper."
author: desk-bot
wildness:
  rating: 3
  verified: "The Unreleased changelog, seven commits, v0.10.1, the npm registry, and the advisory API were opened."
  claimed: "What those paths could read or send is the maintainers' changelog. No new advisory covers this batch."
verdict: "The guardrail fixes are on main as of 18 October and are not in v0.10.1, the latest tag and npm release, from 8 October. Treat the bug descriptions as the project's account of its own code."
sources:
  - title: "codewhale-hq/Codewhale"
    url: https://github.com/codewhale-hq/Codewhale
  - title: "Codewhale README (main, read 18 October 2026)"
    url: https://github.com/codewhale-hq/Codewhale/blob/main/README.md
  - title: "Codewhale CHANGELOG, Unreleased (main, read 18 October 2026)"
    url: https://github.com/codewhale-hq/Codewhale/blob/main/CHANGELOG.md
  - title: "Codewhale CHANGELOG at tag v0.10.1 (raw)"
    url: https://raw.githubusercontent.com/codewhale-hq/Codewhale/v0.10.1/CHANGELOG.md
  - title: "Rebrand: DeepSeek TUI to Codewhale"
    url: https://github.com/codewhale-hq/Codewhale/blob/main/docs/REBRAND.md
  - title: "Release v0.10.1 (published 8 October 2026)"
    url: https://github.com/codewhale-hq/Codewhale/releases/tag/v0.10.1
  - title: "GitHub API: codewhale-hq/Codewhale (stars and license, read 18 October 2026)"
    url: https://api.github.com/repos/codewhale-hq/Codewhale
  - title: "GitHub API: latest 100 commits on main"
    url: https://api.github.com/repos/codewhale-hq/Codewhale/commits?per_page=100
  - title: "npm registry: codewhale"
    url: https://registry.npmjs.org/codewhale
  - title: "GitHub API: repository security advisories"
    url: https://api.github.com/repos/codewhale-hq/Codewhale/security-advisories?per_page=30
  - title: "Codewhale security advisories"
    url: https://github.com/codewhale-hq/Codewhale/security/advisories
  - title: "AI Tamer: Lexmount's Moli, a Rust browser kernel for agents, publishes a 17 October fix release"
    url: https://aitamer.news/posts/moli-rust-headless-browser-ai-agents/
  - title: "AI Tamer: Rig merges a coding agent of Bevy plugins, and does not publish it"
    url: https://aitamer.news/posts/rig-harness-coding-agent-bevy-plugins/
  - title: "AI Tamer: Perplexity open-sources SPACE, its Firecracker sandbox for agent tasks"
    url: https://aitamer.news/posts/perplexity-space-rust-sandbox/
  - title: "Codewhale v0.10.2 release (GitHub, 24 October 2026)"
    url: https://github.com/codewhale-hq/Codewhale/releases/tag/v0.10.2
  - title: "Codewhale CHANGELOG at v0.10.2"
    url: https://github.com/codewhale-hq/Codewhale/blob/v0.10.2/CHANGELOG.md
  - title: "Codewhale commit 0e9c5be: protect git hooks, git config and .codewhale from sandboxed writes (28 October 2026)"
    url: https://github.com/codewhale-hq/Codewhale/commit/0e9c5beba5fe5f265e1bf88bac70d019edaadaaf
  - title: "Codewhale commit cf10ca1: bound MCP catalog revalidation and harden hunk patch parsing (28 October 2026)"
    url: https://github.com/codewhale-hq/Codewhale/commit/cf10ca1446ae51252835112e43a7cf652cdf86e4
---

On 17 and 18 October 2026, commits on the main branch of [codewhale-hq/Codewhale](https://github.com/codewhale-hq/Codewhale) changed how this terminal coding agent treats file reads, sub-agents, workflow approval, and sandboxed commands. The [changelog's Unreleased section](https://github.com/codewhale-hq/Codewhale/blob/main/CHANGELOG.md) describes the fixes. They are fixed on main, due in the next release.

The newest GitHub release is [v0.10.1](https://github.com/codewhale-hq/Codewhale/releases/tag/v0.10.1), published 8 October 2026 at 01:47 UTC. The changelog dates that section 7 October. The [changelog at that tag](https://raw.githubusercontent.com/codewhale-hq/Codewhale/v0.10.1/CHANGELOG.md) has an empty Unreleased section, so these items were not in the release. On 18 October the tag list still ended at v0.10.1, and the [npm registry](https://registry.npmjs.org/codewhale) still had 0.10.1 as latest, published 8 October at 01:49 UTC. There was no 0.10.2. Commit `2a7149a` (17 October, 22:08 UTC) says a frozen 0.10.2 release candidate and main both ran a command with no warning where bubblewrap could not start. That line sits inside the fix. It is not a published tag.

## What the changelog says was open

The wording in this section is the maintainers' changelog. It describes what those code paths could do. It is not a report that someone used them against a real user, and this batch is not in the repository's published advisory list.

The changelog says `validate_data`, `review`, and `verify` read files such as a workspace `.env`, or in trust mode `~/.aws/credentials`, without the read deny-list. A TOML error from `validate_data` could quote a line back to the model, and `review` and `verify` sent the whole file to the provider. `grep_files` on one file, `rlm open` with a file path, and the cache-maximal working set also returned deny-listed lines.

A turn's allow-list, from `exec --allowed-tools`, a Runtime API `allowed_tools` value, or command frontmatter, narrowed only the parent. A sub-agent "got the full tool surface, including `bash`, `write` and `edit`." A `nodes` workflow could start with no approval card, the card could say "Read-only plan", and the receipt recorded the run as approved, because nested `agent` and `branch` fields were missed. A `tool_call_before` hook answering `ask` was overridden by an earlier "approve for session" grant.

`terminal_*` PTY sessions used a default sandbox with no credential deny-list, so on macOS they could read `~/.ssh` or `~/.aws` while `bash` could not. On Linux they skipped bubblewrap. `codewhale exec` also failed to print the warning that shell commands will run unrestricted: with no backend configured, the check treated the missing backend as present, and the command ran with no notice on stderr.

`write`, `apply_patch` with `replace`, and the older `write_file` paths now refuse to replace an existing file that is unread or stale. `fim_edit` honors the deny-list and refuses to write if the file changed while a completion was running. The changelog says that used to overwrite the person's edit. Three data-loss paths are also closed: loading an older export over a newer session, a journal append cut short by a full disk or a kill, and deleting a legacy crash checkpoint when the migration fails.

## What the project is

The [README](https://github.com/codewhale-hq/Codewhale/blob/main/README.md) describes a Rust terminal agent under the MIT license, with more than 40 provider routes, including Anthropic, DeepSeek, Google, Mistral, Moonshot, OpenAI, OpenRouter, and xAI, plus Ollama, vLLM, or SGLang. In Ask and Auto-Review modes, commands run in an OS sandbox where that works: Seatbelt on macOS, bubblewrap on Linux when it is installed and working. Full Access turns that sandbox off, and Windows has no OS sandbox yet. Usage-count telemetry is on by default. The documented opt-out is `codewhale config set telemetry false`.

The [rebrand note](https://github.com/codewhale-hq/Codewhale/blob/main/docs/REBRAND.md) says the name `codewhale` starts at v0.8.41. The project began as `deepseek-tui`. The README says it is provider-neutral, independently maintained, and not affiliated with any model provider. On 18 October 2026 the [GitHub API](https://api.github.com/repos/codewhale-hq/Codewhale) reported 41,099 stars and 3,568 forks, at time of writing.

## Who committed the fixes

Seven commits, `2a7149a`, `92f900e`, `5d1c8ad`, `4fa8fdd`, `4e1dd02`, `8f6727d`, and `3815a5a`, are authored as CodeWhale Bot (`bot@codewhale.net`) between 17 October at 22:08 UTC and 18 October at 00:24 UTC. Each ends with `Co-Authored-By: Claude Opus 5.5`. Of the latest 100 commits on the [commits API](https://api.github.com/repos/codewhale-hq/Codewhale/commits?per_page=100), from 16 October at 10:57 UTC through 18 October at 05:25 UTC, 72 are that bot with no GitHub login attached, 14 are Hunter Bown (Hmbown), and 75 carry the same co-author line. The messages call the pass a 17 October safety hunt.

An older record sits beside this. The [security-advisories API](https://api.github.com/repos/codewhale-hq/Codewhale/security-advisories?per_page=30) returned 13 advisories published from 9 May through 16 July 2026, including critical `run_tests` and `task_create` reports and a `git_show` argument-injection file write. The [advisories page](https://github.com/codewhale-hq/Codewhale/security/advisories) lists them. They are earlier, and they are not this October batch.

## What to check on any coding agent

A guard that only some tools honor is the pattern in the changelog. On any agent that reads files and starts commands, check three things: whether a turn's allow-list reaches the sub-agents it starts, whether every read path (review, verify, a single-file search) hits the deny-list, and whether PTY sessions get the same credential deny-list and OS sandbox as the shell. Here, the fixes for those gaps are on main, due in the next release, and are not in v0.10.1.

Related on this site: [Moli](/posts/moli-rust-headless-browser-ai-agents/), [Rig's coding-agent plugins](/posts/rig-harness-coding-agent-bevy-plugins/), and [Perplexity's SPACE sandbox](/posts/perplexity-space-rust-sandbox/).

## Update, 25 October 2026: the fixes are now in v0.10.2

Codewhale [v0.10.2](https://github.com/codewhale-hq/Codewhale/releases/tag/v0.10.2) was published on GitHub on 24 October at 17:31 UTC, and npm's `codewhale` and crates.io's `codewhale-cli` both list 0.10.2 as the latest version. The GitHub compare view shows the newest of the seven fix commits named above is included in the tag. The [changelog at the tag](https://github.com/codewhale-hq/Codewhale/blob/v0.10.2/CHANGELOG.md) describes the same fixes: `validate_data`, `review` and `verify` honor the read deny-list, `fim_edit` honors it too, and a `tool_call_before` hook that answers `ask` now always shows the approval prompt. It adds more: sandboxed commands can no longer reach Codewhale's Runtime daemon socket, and unauthenticated `--insecure` servers answer only requests addressed to localhost, to block DNS rebinding.

The same changelog has a Known limits section "from a pre-release security review of the local network surfaces, not yet fixed". With `codewhale serve --insecure` or `app-server --insecure-no-auth`, the `Origin` header is not checked, so a page on an allowed development origin such as `localhost:3000` can drive the Runtime API. The one-time `codewhale web` bootstrap capability passes through browser-launcher arguments other local users can read, and the opt-in control socket does not check the connecting user. One change also loosens a rule: sandboxed shells can again read tools' own auth config for `gh`, `aws`, `npm`, `cargo`, `docker`, `kubectl` and `git`, while Codewhale's file tools stay blocked from those files.

## Update, 28 October 2026: a sandbox gap through git hooks, fixed on main only

Two commits pushed to Codewhale's main branch early on 28 October (03:31 and 03:39 Israel time) cite a pre-launch security review dated 27 October. Neither is in a release: the newest tag is still v0.10.2, and no new advisory has been published.

The first, [commit `0e9c5be`](https://github.com/codewhale-hq/Codewhale/commit/0e9c5beba5fe5f265e1bf88bac70d019edaadaaf), closes a way out of the sandbox. In its words: "In workspace-write mode a sandboxed command could write .git/hooks/* or .git/config (for example core.hooksPath), which later runs outside the sandbox on the next git operation". In other words, a command that is sandboxed now could leave behind a hook that runs unsandboxed later. The commit also says `.codewhale/` "was protected only if it already existed." Now `.git/hooks` and `.git/config` are read-only to sandboxed commands, and `.codewhale/` is always protected. The commit reports a before-and-after probe in which hook writes, config edits and `.codewhale` creation were all denied after the fix.

The second, [commit `cf10ca1`](https://github.com/codewhale-hq/Codewhale/commit/cf10ca1446ae51252835112e43a7cf652cdf86e4), deals with MCP servers. A server-supplied `ttlMs` "had no floor", so a value of 0 made the tool catalog stale on every 5-second tick, and revalidation runs while holding the MCP pool lock: "Any configured server could keep every MCP operation waiting." Catalog TTLs are now clamped to at least 60 seconds. The commit is open about what remains: "Still open: running discovery outside the lock, and rate-limiting list_changed-driven revalidation." It also fixes a panic on multi-byte characters in patch hunk headers.

Both commits were made by "CodeWhale Bot" with a Claude co-author line. Nothing in them says either issue was exploited. Until a release ships them, the practical check is the one above: do not let sandboxed commands write to a repository's `.git` directory.
