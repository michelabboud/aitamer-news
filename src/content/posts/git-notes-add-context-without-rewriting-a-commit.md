---
title: Git Notes Add Context Without Rewriting a Commit
description: Attach review context to an existing commit while leaving the commit object unchanged. Share the notes ref when collaborators need to see it.
pubDate: "2026-10-07T19:00:00Z"
specimen: 373
section: tools
tags:
  - git
  - git-notes
  - commits
  - audit
  - workflow
draft: false
heroImage: https://media.aitamer.news/heroes/git-notes-add-context-without-rewriting-a-commit-665742b6.jpg
heroAlt: A hand adds a note beside a locked chain of commits, with copies sent to several readers.
author: ari
wildness:
  rating: 2
  verified: Git notes attach context without changing the annotated commit object.
  claimed: A review note can make later audit context easier to find.
verdict: Use a Git note when review context arrives after a commit. Keep the evidence in the note, and share the notes ref with collaborators.
sources:
  - title: Git notes documentation
    url: https://git-scm.com/docs/git-notes
  - title: Git log documentation
    url: https://git-scm.com/docs/git-log
  - title: Git push documentation
    url: https://git-scm.com/docs/git-push
  - title: Git fetch documentation
    url: https://git-scm.com/docs/git-fetch
---

A commit message captures what was known when the commit was made. A review may happen later. [Git notes](https://git-scm.com/docs/git-notes) let you attach that later context to the commit without changing the commit object or its identifier. The note appears alongside the message in a normal `git log` view.

## Where the note lives

Git stores the default notes under `refs/notes/commits`. Each change to that notes ref has its own history. The original commit stays as it was. That makes a note useful for a review outcome, a link to an audit record, or information that arrived after the commit. The note can also be edited, so treat its contents as a record to review, rather than proof of approval on its own. [Git documents both the notes ref and its history](https://git-scm.com/docs/git-notes).

## How to attach and inspect one

Choose the commit you want to annotate. Replace `<commit>` with its identifier, then write a short note that names the review and points to its evidence:

```sh
git notes add -m 'Audit: dependency review completed; evidence in team tracker' <commit>
git notes show <commit>
git log -1 --notes <commit>
```

The first command adds the note. The second prints it directly. The last shows it with the commit message. Git’s [notes manual](https://git-scm.com/docs/git-notes) describes `add` and `show`; the [log manual](https://git-scm.com/docs/git-log) describes how notes are displayed. If that commit already has a note, `git notes add` normally stops instead of replacing it. Read the existing note before choosing whether to edit or append to it.

## How to share it

Notes have their own ref. A routine branch push follows the configured push mapping, so include the notes ref explicitly when you want to share it:

```sh
git push origin refs/notes/commits:refs/notes/commits
```

A collaborator can fetch that ref into a separate local ref before merging notes:

```sh
git fetch origin refs/notes/commits:refs/notes/origin-commits
git notes merge refs/notes/origin-commits
```

The [push](https://git-scm.com/docs/git-push) and [fetch](https://git-scm.com/docs/git-fetch) manuals explain these ref mappings. Git’s [notes manual](https://git-scm.com/docs/git-notes) explains notes merging, including conflict handling.

## What to do

1. Pick the existing commit and find the review evidence.
2. Add a concise note that names the review and where its evidence lives.
3. Read it with `git notes show` and `git log -1 --notes`.
4. Share the notes ref if others need the context, and agree on how your team reviews later edits.
