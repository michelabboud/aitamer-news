---
title: Keep a changelog that humans read, grouped by type of change
description: Keep a CHANGELOG.md with an Unreleased section and Added, Changed, Deprecated, Removed, Fixed and Security groups, so users can see what changed and what will break.
pubDate: "2026-10-14T10:00:00Z"
section: general
tags:
  - changelog
  - documentation
  - releases
  - semver
  - open-source
draft: false
heroImage: https://media.aitamer.news/heroes/keep-a-changelog-types-57206d06.jpg
heroAlt: Three stacks of cream, rust, yellow and blue paper slips sit along a teal paper strip.
author: quill
wildness:
  rating: 1
  verified: Groups, principles, Unreleased, yanked and date rules quoted from keepachangelog.com 1.1.0
  claimed: The site calls itself one author's considered opinion; no formal standard exists
verdict: Worth adopting as is. Six fixed groups, an Unreleased section and ISO dates turn release notes into something users can act on. Always list deprecations and breaking changes.
sources:
  - title: Keep a Changelog 1.1.0
    url: https://keepachangelog.com/en/1.1.0/
  - title: Semantic Versioning 2.0.0
    url: https://semver.org/spec/v2.0.0.html
---

A git log tells you which commits landed. A user upgrading your library wants something else: what changed for them, and whether anything will break. [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), a convention maintained by Olivier Lacan, opens with the line "Don’t let your friends dump git logs into changelogs."

## The failure: a pasted commit log

Here is a typical release note made from `git log --oneline`:

```text
a41f2c3 Merge pull request #212 from fix/typo
9be7d10 wip
3c0e8aa address review comments
71d2f45 Bump dependencies
e09b6c1 Rename --out flag
```

The last line is a breaking change, and it is buried. Keep a Changelog says commit log diffs are "full of noise. Things like merge commits, commits with obscure titles, documentation changes, etc." It separates the two jobs: a commit documents "a step in the evolution of the source code", while a changelog entry documents "the noteworthy difference, often across multiple commits".

## What the format asks for

The site defines a changelog as "a file which contains a curated, chronologically ordered list of notable changes for each version of a project." Its guiding principles:

- Changelogs are for humans, not machines.
- There should be an entry for every single version.
- The same types of changes should be grouped.
- Versions and sections should be linkable.
- The latest version comes first.
- The release date of each version is displayed.
- Mention whether you follow Semantic Versioning.

The last principle points at the [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html) specification. Keep a Changelog only asks you to say whether you follow it.

## The six groups

Each version is split into these headings:

- **Added** for new features.
- **Changed** for changes in existing functionality.
- **Deprecated** for soon-to-be removed features.
- **Removed** for now removed features.
- **Fixed** for any bug fixes.
- **Security** in case of vulnerabilities.

## A small example

The project and dates below are invented. The header text and the link style at the bottom follow the site's own changelog.

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `--dry-run` flag for the `sync` command.

## [2.0.0] - 2026-03-02

### Changed
- `--out` is renamed to `--output`. Scripts using `--out` must be updated.

### Removed
- The `--legacy-auth` flag, deprecated in 1.4.0.

### Security
- Access tokens are no longer written to the debug log.

## [1.4.0] - 2025-11-18

### Deprecated
- The `--legacy-auth` flag. It will be removed in 2.0.0.

[unreleased]: https://github.com/example/tool/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/example/tool/compare/v1.4.0...v2.0.0
[1.4.0]: https://github.com/example/tool/releases/tag/v1.4.0
```

The link references make each version heading clickable, which covers the "linkable" principle. Leave out groups that have no entries. The site's own history records removing empty sections because they "occupy too much space and create too much noise in the file."

## Use the Unreleased section as you work

The site recommends an Unreleased section at the top, for two reasons: people can see what to expect in upcoming releases, and at release time you move those entries into a new version section. In practice that means adding the entry in the same pull request as the change. At release, rename the heading to the version and date, add a fresh empty `## [Unreleased]`, and update the compare links.

## Never skip deprecations

The strongest line on the page is this one: "If you do nothing else, list deprecations, removals, and any breaking changes in your changelog." The goal is a safe upgrade path. A user should be able to upgrade to the version that lists a deprecation, remove what is deprecated, then upgrade to the version where it becomes a removal. The 1.4.0 and 2.0.0 entries above show that path.

## Dates, yanked releases and gaps

- **Dates.** Use the ISO format, such as 2017-07-17. It runs from year to day and does not collide with regional formats that swap month and day.
- **Yanked releases.** A version pulled for a serious bug or security issue stays in the file, marked like this: `## [0.0.5] - 2014-12-13 [YANKED]`. The site says the tag "is loud for a reason."
- **Gaps.** "A changelog which only mentions some of the changes can be as dangerous as not having a changelog." Fixing a gap later is fine; the FAQ says you should update the file if you forgot a breaking change.

## Where this advice stops

- **It is a convention with no standard behind it.** The FAQ says there is no real standard changelog format and calls the GNU guidelines inadequate. The author calls the document "my carefully considered opinion."
- **Generated changelogs.** The site does not discuss tools that build changelogs from commit messages. Its argument against raw commit logs still applies to any output a person has not curated.
- **GitHub Releases.** The FAQ calls them a non-portable changelog that only displays inside GitHub. They can sit alongside `CHANGELOG.md` and do not replace it.
- **Software without versions.** The format is organized per release. A service deployed continuously with no version numbers has no natural place for those headings, and the site does not address that case.
- **Parsing.** The FAQ says automatic parsing is difficult because projects follow wildly different formats. Keeping to this one helps, and does not guarantee any tool will read it.
