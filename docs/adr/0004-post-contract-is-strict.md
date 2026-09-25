# The post contract rejects unknown fields

## Context

The post frontmatter schema (`src/content/post-schema.ts`) is a public contract: aitamer-news-ops
(the bots), atn-mcp (the posts tool), and human editors all write against it, and `/contract/post.schema.json`
publishes it as JSON Schema for any of them to validate against before writing a post.

Zod objects strip unknown keys by default. None of the schema's nested objects (`wildness`,
`sunset`, `video`, `correction`, `withdrawal`) or the post object itself declared `.strict()`, so a
misspelled or retired field vanished silently instead of failing the build. The deep review of
batch A of the Bestiary plan (`docs/reviews/2026-09-25-batch-a-deep-review.md`, finding B5) named
two concrete failure modes:

- `sunset: { date: 2026-10-23, what: "grok-3 API", replacment: "grok-4-7" }` (a typo'd key) passes
  today. The planned Extinction Watch page would then publish "No replacement listed" — a false
  fact — with no warning anywhere that the field was ever written.
- A stray top-level key (`verdit:`, `heroalt:`) vanishes with no error at all, at any level.

POST.md §2 promises the contract "only grows: a field is never renamed or given a new meaning."
Turning on strictness *after* posts exist in the wild, or after `/contract/post.schema.json` has
shipped a lenient shape to writers, would itself be the kind of change that promise forbids. The
review flagged this as a now-or-never decision, ahead of the JSON Schema publication this batch
also adds.

## Decision

Every nested object in the contract — `wildness`, `sunset`, `video`, `correction`, `withdrawal`,
and `sources` items — is `.strict()`. The top-level post object is `.strict()` too. An unknown key
anywhere in a post's frontmatter fails the Astro content build, naming the file.

This was checked against every post in the repository (25 published posts as of this decision):
none of them uses a field outside this contract, so turning on strictness breaks nothing today —
confirmed by `npm run build` completing without a schema error before this decision was committed.

The published JSON Schema (`/contract/post.schema.json`, generated from this same zod schema) sets
`"additionalProperties": false` at every one of those levels for the same reason: a writer
validating against the contract before it ever reaches the build gets the same rejection atn-mcp
and the build itself would give.

## Alternatives rejected

- **Leave objects lenient (the status quo).** Rejected: a misspelled field is indistinguishable
  from an intentionally omitted one, and the failure surfaces later and more expensively — a wrong
  fact on a published page, or a writer who believes a field it sent was recorded when it was
  dropped on the floor.
- **Strict on the new nested objects only, lenient at the top level.** This would have caught the
  `replacment` typo but not a stray top-level key. Since both are contract violations of the same
  kind, and the top level is empty of unknown keys today for the same reason the nested objects
  are, there was no reason to leave one door open.
- **Warn instead of reject** (e.g. a build-time lint pass that reports unknown keys without
  failing). Rejected: `check:posts` and the Astro content build are the only place every post is
  guaranteed to pass through, and a warning that does not block a merge is a warning bots and
  humans alike will eventually ignore. Rule 1.2's "no swallowed exceptions" argues the same way:
  the contract's job is to be the enforcement point, not an advisory.

## Consequences

- A contract change is now always additive-and-visible: adding a field is safe (existing posts are
  unaffected), but renaming or removing one is a breaking change that fails every post still using
  the old name — which is the intended effect of "the contract only grows."
- A future breaking change to the contract needs a new version rather than a silent widening or
  narrowing of what `.strict()` accepts in place; `POST_CONTRACT_VERSION` (`src/content/post-schema.ts`)
  and the versioned route `/contract/v1/post.schema.json` exist for exactly that case.
- Every writer against the contract (aitamer-news-ops, atn-mcp, human editors copying POST.md's
  template) must spell every field exactly as documented. A typo now fails loudly, at build time,
  naming the file — which is the point, but it does mean a bot's schema drift is a hard stop
  instead of a silently dropped field.

## Status

Accepted 2026-09-25.
