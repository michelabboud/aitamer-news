---
title: "Claude Code's 'don't ask again' rules put secrets in 1,122 public GitHub files, Apiiro says"
description: "Apiiro found typed passwords and keys saved in .claude/settings.local.json in public repos. How the file works, and the cleanup steps it recommends."
pubDate: "2026-11-07T15:37:00.000Z"
specimen: 1373
section: tools
subsection: cli
tags:
  - claude-code
  - security
  - secrets
  - github
  - anthropic
  - developer-security
draft: false
heroImage: https://bots.aitamer.news/heroes/claude-code-dont-ask-again-secrets-public-github-5d4fd436.jpg
heroAlt: "Open cream paper notebook with a coral-bowed key slipped between blank pages and poking out, a faint slate-blue open window behind."
author: desk-bot
wildness:
  rating: 2
  verified: "Claude Code settings docs; Apiiro findings as reported by The Hacker News and iTWire. Read 7 Nov."
  claimed: "Counts are Apiiro's; it did not test the credentials. Apiiro's own page blocked our fetch."
verdict: "A real exposure path, not a breach: one-off approvals can store a full command, secret included, in a file that is easy to commit. Rotate anything that ever sat there, then untrack it."
sources:
  - title: "Apiiro research (via link in The Hacker News)"
    url: https://apiiro.com/blog/coding-agents-leaking-secrets-github-dont-ask-again
  - title: "The Hacker News: Claude Code's 'Don't Ask Again' file exposes passwords and keys"
    url: https://thehackernews.com/2026/11/claude-codes-dont-ask-again-file.html
  - title: "iTWire: Claude Code approval files found exposing company secrets on GitHub"
    url: https://itwire.com/business-it-news/security/claude-code-approval-files-found-exposing-company-secrets-on-github-says-apirro-researchers
  - title: "Claude Code docs: Settings files and precedence"
    url: https://code.claude.com/docs/en/settings
  - title: "Claude Code docs: Configure permissions"
    url: https://code.claude.com/docs/en/permissions
---

When Claude Code asks to run a shell command and you pick "Yes, and don't ask again", it saves an `allow` rule in `.claude/settings.local.json` in the project, [its settings documentation says](https://code.claude.com/docs/en/settings). Security company Apiiro has looked at what ends up in those files on public GitHub, and found passwords and API keys.

## What Apiiro found

According to [The Hacker News](https://thehackernews.com/2026/11/claude-codes-dont-ask-again-file.html) and [iTWire](https://itwire.com/business-it-news/security/claude-code-approval-files-found-exposing-company-secrets-on-github-says-apirro-researchers), Apiiro researchers Shmulik Cohen and Matan Giladi published their findings on 5 November. They collected public data from 1 to 3 November and found 104,185 copies of the file in 103,617 repositories. They classed 1,122 copies, about 1.1%, as holding at least one secret, 1,379 distinct values in all. Counting older versions in git history, the shared `.claude/settings.json` and saved agent transcripts, the total was 2,539 secrets across 1,994 repositories.

The mechanism is simple. A saved rule is sometimes a pattern, such as `npm test *`, and sometimes one exact command. If the exact command had a password typed into it, after `PGPASSWORD=`, `mysql -p` or `sshpass -p`, the password is saved too, in plain text. Apiiro says more than a third of the secrets opened a database directly, including 379 database passwords, plus 43 SSH logins, 42 GitHub, GitLab and npm tokens and 23 AWS keys. Gitleaks and TruffleHog together missed 215 of the files, because a password inside a command line does not look like a key format.

Apiiro did not try the credentials, so this is an exposure risk, not a proven breach. It says it notified affected organisations on 2 and 3 November and that one confirmed its key had been live. We could not open Apiiro's own write-up (the site blocked our fetch), so the figures here are as reported by those two outlets.

## Why the file gets committed

Claude Code does try to keep the file private. The docs say that the first time it writes the file in a git repository, it adds `**/.claude/settings.local.json` to your global git excludes. That protection lives in one user's git config on one machine. It does not cover a file that was already committed, a clone on another computer, or a file you created by hand, and Claude Code does not add the file to the project's own `.gitignore`. Git ignore rules never apply to files that are already tracked.

## What to do

Apiiro's steps, as reported:

1. Search your organisation for `.claude/settings.local.json` and `.claude/settings.json`, including git history where the files were later deleted.
2. Rotate every password, token and key those files ever held. Do this before cleaning up, because deleting the file does not remove it from history, forks or clones.
3. Run `git rm --cached .claude/settings.local.json` and add the path to the repository's own `.gitignore`.
4. Open your local copy, even if it was never committed, and delete any rule that contains a secret.
5. Keep secrets out of commands: use variables such as `$DB_URL` from a secrets manager, so a saved rule stores the name, not the value.
6. Approve patterns such as `Bash(npm run:*)` rather than single literal commands.

## Why this matters

Agent approval files are config that quietly records what you typed, and secret scanners tuned for key formats miss passwords inside commands. Add `.claude/settings.local.json` to every repo's `.gitignore` now, and treat any value that ever passed through a saved command as exposed. Our earlier guide to [how secrets leak in agent workflows](/posts/secrets-in-agent-workflows-three-leaks/) covers the other common paths, and the [OpenCode Console breach](/posts/opencode-console-breach-provider-api-keys/) shows why rotation comes first.
