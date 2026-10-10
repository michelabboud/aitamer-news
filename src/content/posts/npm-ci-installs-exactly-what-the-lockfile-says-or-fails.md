---
title: npm ci installs exactly what the lockfile says, or fails
description: Use npm ci in CI so builds install the committed dependency tree, and learn why it errors when package.json and package-lock.json disagree.
pubDate: "2026-10-11T15:00:00Z"
section: tools
tags:
  - npm
  - ci
  - lockfile
  - nodejs
  - dependencies
draft: false
heroImage: https://media.aitamer.news/heroes/npm-ci-installs-exactly-what-the-lockfile-says-or-fails-6eb2b6cd.jpg
heroAlt: A layered paper stack is pressed into exact alignment while a mismatched sheet is stopped at the edge.
author: quill
wildness:
  rating: 1
  verified: "npm docs: npm ci errors on lockfile mismatch, removes node_modules, never writes lockfiles"
  claimed: Caching node_modules gains little is inferred from the docs; no measurements given
verdict: Use npm ci for every automated install. When it fails on a mismatch, fix the lockfile locally with npm install and commit both files. Match tree-shaping flags and watch NODE_ENV.
sources:
  - title: npm ci | npm Docs (CLI v11)
    url: https://docs.npmjs.com/cli/v11/commands/npm-ci
  - title: package-lock.json | npm Docs (CLI v11)
    url: https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json
---

A CI job should install the dependency tree you committed. `npm ci` is the npm command built for that job, and its most useful behavior is a refusal. When `package.json` and `package-lock.json` disagree, it stops with an error. It does not rewrite the lockfile to make them agree. That catches a manifest edited without a fresh lockfile, including an edit by a coding agent that changed `package.json` and never ran an install.

## What the npm documentation promises

The [npm ci documentation](https://docs.npmjs.com/cli/v11/commands/npm-ci) describes the command as "similar to npm install, except it's meant to be used in automated environments such as test platforms, continuous integration, and deployment." It lists five differences from `npm install`:

- The project must have an existing `package-lock.json` or `npm-shrinkwrap.json`.
- If dependencies in the lockfile do not match those in `package.json`, `npm ci` exits with an error instead of updating the lockfile.
- It installs whole projects only. You cannot add a single dependency with it.
- If `node_modules` already exists, it is removed before the install begins.
- It never writes to `package.json` or any lockfile. The docs call installs "essentially frozen."

The second and fifth points are the reason to use it in CI. A build should test the tree you reviewed. `npm ci` installs that tree or stops.

## Why the lockfile is the contract

The [package-lock.json documentation](https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json) says the file "describes the exact tree that was generated, such that subsequent installs are able to generate identical trees, regardless of intermediate dependency updates." The same page says the file is generated for any operation where npm modifies `node_modules` or `package.json`. That is the risk with `npm install` in a pipeline. It is allowed to change the lockfile, and a changed lockfile in a CI runner is a tree nobody committed.

## The failure you will meet

The common case is a hand edit. Someone adds a dependency to `package.json`, commits, and pushes. Nobody regenerated the lockfile.

```json
{
  "dependencies": {
    "express": "^4.19.0",
    "zod": "^3.23.0"
  }
}
```

If `package-lock.json` has no entry for `zod`, the two files disagree and `npm ci` exits with an error. The same happens when a version range in `package.json` changes and the locked version no longer satisfies it. This is the command doing its job. The docs do not print the exact error text, so do not script against its wording. Treat the failed step as the signal.

## How to fix it

Fix the mismatch on a developer machine, where changing the lockfile is the point:

```sh
npm install
git add package.json package-lock.json
git commit -m "Add zod to the lockfile"
```

CI then runs `npm ci` against the corrected pair. Do not switch the CI step to `npm install` to make the error go away. That brings back a pipeline that can write a lockfile nobody committed.

## A minimal CI step

The npm docs show a Travis CI configuration. The same steps in plain shell work in any CI system:

```sh
npm ci
npm test
```

The docs' example keeps `$HOME/.npm`, the npm cache, between builds "to speed up installs." Caching `node_modules` itself gains little with `npm ci`, because the command removes that folder before it installs.

## Two configuration traps

**Tree-shaping flags must match.** The docs warn that if you created the lockfile with flags that affect the shape of the dependency tree, such as `--legacy-peer-deps` or `--install-links`, "you must provide the same flags to npm ci or you are likely to encounter errors." Their suggested fix is to store the setting in project config and commit the file:

```sh
npm config set legacy-peer-deps=true --location=project
git add .npmrc
```

Local installs and CI now read the same setting.

**`NODE_ENV=production` drops dev dependencies.** The `omit` option's default is `dev` when the `NODE_ENV` environment variable is set to `production`. The docs say omitted packages are still resolved and recorded in the lockfile but are not installed on disk. If your CI sets `NODE_ENV=production` before `npm ci` and then runs a test runner from `devDependencies`, the runner will be missing. Set `NODE_ENV` after the install, or pass `--include=dev`. The docs say a type listed in `--include` is installed even if `--omit` lists it.

## Where this advice stops

- `npm ci` needs a lockfile. A project without `package-lock.json` or `npm-shrinkwrap.json` cannot use it until someone runs `npm install` and commits the result.
- It cannot add or upgrade packages. Do that locally with `npm install`.
- If both `package-lock.json` and `npm-shrinkwrap.json` sit in the project root, the lockfile docs say `npm-shrinkwrap.json` takes precedence and `package-lock.json` is ignored. Make sure you are editing the file npm reads.
- A lockfile makes installs reproducible. It says nothing about whether the pinned versions are safe to run. That needs its own review.
