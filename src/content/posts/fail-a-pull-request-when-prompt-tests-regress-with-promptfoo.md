---
title: Fail a pull request when prompt tests regress, with promptfoo
description: "Turn promptfoo assertions into a required GitHub check: deterministic tests, the action's failure rules, branch protection, and the path-filter trap that leaves checks pending."
pubDate: "2026-10-11T09:30:00Z"
section: dev
tags:
  - promptfoo
  - github-actions
  - ci
  - prompt-testing
  - llm-testing
draft: false
heroImage: https://media.aitamer.news/heroes/fail-a-pull-request-when-prompt-tests-regress-with-promptfoo-90491ac4.jpg
heroAlt: A layered paper pull request bridge is stopped by a failed prompt test gate, with a subtle branching path suggesting a check left pending.
author: quill
wildness:
  rating: 2
  verified: Exit codes, inputs and skip logic checked in promptfoo docs, action README and source.
  claimed: Docs page promises before/after comparison; the README says only the current checkout runs.
verdict: The action fails on any failed assertion by default, which makes a solid gate once the check is required. Skip the workflow path filter, or required checks hang in Pending.
sources:
  - title: "promptfoo: Testing Prompts with GitHub Actions"
    url: https://www.promptfoo.dev/docs/integrations/github-action/
  - title: promptfoo-action repository and README
    url: https://github.com/promptfoo/promptfoo-action
  - title: "promptfoo: Deterministic assertions"
    url: https://www.promptfoo.dev/docs/configuration/expected-outputs/deterministic/
  - title: "promptfoo: JavaScript assertions"
    url: https://www.promptfoo.dev/docs/configuration/expected-outputs/javascript/
  - title: "promptfoo: Command line"
    url: https://www.promptfoo.dev/docs/usage/command-line/
  - title: "GitHub Docs: About protected branches"
    url: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
  - title: "GitHub Docs: Troubleshooting required status checks"
    url: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/troubleshooting-required-status-checks
---

A prompt edit can pass code review and still change what the model returns. [promptfoo](https://www.promptfoo.dev/docs/integrations/github-action/) runs assertion-based tests against prompts, and its [GitHub Action](https://github.com/promptfoo/promptfoo-action) runs them on pull requests. A red check that actually stops a merge needs three pieces: assertions that fail on the outputs you care about, a workflow step that fails when they do, and a branch rule that requires that step.

## Write tests with deterministic assertions

Start with a prompt file that has a variable in double curly braces:

```text
Classify this support ticket. Reply with JSON only, with the keys
"severity" (low, medium or high) and "summary".

Ticket: {{ticket}}
```

Save it as `prompts/triage.txt`, then reference it from `promptfooconfig.yaml`:

```yaml
prompts:
  - file://prompts/triage.txt

providers:
  - openai:gpt-6-luna

tests:
  - vars:
      ticket: "The checkout page has returned HTTP 500 since this morning."
    assert:
      - type: is-json
      - type: javascript
        value: JSON.parse(output).severity === 'high'
  - vars:
      ticket: "Please change the font on the about page."
    assert:
      - type: is-json
      - type: javascript
        value: JSON.parse(output).severity === 'low'
```

The [deterministic assertions](https://www.promptfoo.dev/docs/configuration/expected-outputs/deterministic/) page lists checks such as `contains`, `icontains`, `equals`, `regex` and `is-json`. The [JavaScript assertion](https://www.promptfoo.dev/docs/configuration/expected-outputs/javascript/) takes an expression over `output`. Checks like these give the same verdict for the same output. Model-graded checks such as `llm-rubric` add a second source of variation, so keep them out of a blocking gate until you have seen how often they flip.

Run the suite locally first:

```bash
npx promptfoo@latest eval -c promptfooconfig.yaml
```

The [command-line reference](https://www.promptfoo.dev/docs/usage/command-line/) says `eval` exits with code `100` when at least one test fails or the pass rate is below `PROMPTFOO_PASS_RATE_THRESHOLD`, which defaults to 100%. Any other error exits with `1`. That exit code is what CI acts on.

## Add the workflow

```yaml
name: prompt-tests
on:
  pull_request:

jobs:
  prompt-tests:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
      - uses: promptfoo/promptfoo-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          config: promptfooconfig.yaml
```

Notes on each part, from the project's own pages:

- The docs page says the action needs Node.js 22.22.0 or later on the runner and recommends Node.js 24. It asks you to store `OPENAI_API_KEY` as a repository secret.
- `pull-requests: write` lets the action post a results comment. The action's [README](https://github.com/promptfoo/promptfoo-action) includes `actions/checkout` in its examples and marks it as required for the action's git usage. The example on the docs page leaves it out.
- The docs page describes a before and after comparison. The README states that the action evaluates only the current checkout and does not run separate base and head evaluations. Write assertions that define correct output on their own, because no baseline run takes part.

## Know what turns the step red

In the action's source on its main branch, a promptfoo test-failure exit fails the step unless you configured a threshold and it passed. With no threshold, one failed assertion fails the check. The README documents the threshold input, `fail-on-threshold`, as a "Required suite pass percentage from 0 to 100." The input table on the docs page does not list it. Setting it to 90 means one failure in ten tests can merge. Leave it unset if every test is a hard requirement.

## Make the check block the merge

A failing check is only advice until the branch requires it. GitHub's page on [protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) says all required status checks must pass before collaborators can merge, and that a required check passes with a successful, skipped or neutral status. Add the `prompt-tests` check as required in the protection rule for your default branch.

## Avoid the pending check trap

The docs example limits the trigger with `paths: ['prompts/**']`. GitHub's [troubleshooting page](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/troubleshooting-required-status-checks) says checks from a workflow skipped by path filtering stay "Pending" and block merging, and advises: "Avoid requiring workflows that can be skipped." A pull request that touches no prompt would wait forever.

Keep the trigger unfiltered and let the action skip work instead. In its source, when the `prompts` input is set and no prompt file, config file or config dependency changed, it logs a message and returns without failing, so the job still reports success. The README adds that matching changed files are passed to promptfoo with `--prompts`, replacing the config prompts unless you set `use-config-prompts: 'true'`. `force-run: true` makes it evaluate every time.

## Where this advice stops

- Model output varies between runs. The README offers `repeat` and `repeat-min-pass`, for example three runs with at least two passes per test. Every tolerance you add lets some regressions through.
- The docs say the cache stores LLM requests and outputs for reuse. A cache hit replays an earlier response. The `no-cache` input turns it off.
- The README warns that with `pull_request_target` you must not run untrusted pull request code with a privileged token.
- The gate only covers the cases you wrote. A prompt can break on inputs your tests never send.
