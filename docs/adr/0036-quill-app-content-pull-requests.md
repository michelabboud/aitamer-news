# 0036: Quill App content pull requests

## Status
Accepted for implementation 2026-10-11 at Michel's explicit instruction ("make a post lane for us like the grok bots, its really silly that i am the owner and I am blocked"). Activation waits for the owner to create the App (see `docs/guides/quill-posting.md`). Builds on 0030 and 0035; changes nothing for Grok.

## Context
Quill (Claude) prepares evergreen posts in volume through the backup publishing lane. Its pull requests carry the owner's account as author, because that is the only identity the machine has. GitHub does not let an account approve its own pull request, and the owner-review admission of 0031 to 0034 wants an APPROVED review of the exact head from `MAINTAINER_ID`. The owner is therefore blocked from approving what his own agent proposes, and the only workaround, an owner-bound workflow dispatch run with the owner's token, would have the author approve its own work under the owner's name. The Grok App lane (0030, 0035) already solved the identity half: a dedicated bot account whose pull requests the workflow recognizes by numeric id and admits without owner review.

## Decision
Add a second App content lane for Quill, `aitamer-quill-posts`, shaped like Grok's and failing closed in the same ways.

1. **Identity.** The publisher guard's lane applies only when the repository variable `QUILL_ACTOR_ID` is a positive numeric account id equal to both the pull request author and the event sender, on `opened` or `synchronize`, from a valid nonempty `quill/` branch whose head repository is this repository. No login fallback. Unsetting the variable closes the lane at once.
2. **Admission.** Trusted main pins the Quill bot id in `laneActors.quill` (`scripts/specimen-admission.mjs`), as it pins Grok's, because repository variables can be changed by other collaborators. It ships `null`: the lane is inert at admission until a reviewed code change sets the id. Once set, discovery, exact-head numbering, certification and the normal same-pull-request merge are Grok's, unchanged, with no owner review.
3. **Paths.** Only added or modified plain, non-executable `src/content/posts/<slug>.md` files and the specimen ledger, with the ledger's byte-prefix rule at the merge base and on main now. Nothing else: no MDX, profiles, comments, configuration, workflows, deletions, renames, copies, symlinks or executables.
4. **Byline (the improvement on Grok).** Every added or modified post must name an author in `QUILL_LANE_AUTHORS`, which is `['quill']`, a frozen constant. A modified post must have named one at the merge base and on main now too, so the lane can neither edit a human's or another writer's article nor take one by changing its byline. The author is read by the site's strict frontmatter reader (the one that refuses any form Astro could read differently); anything unreadable, missing, not a single string or not in the list is refused. The rule runs in the publisher guard and again at admission, before dispatch (a failing pull request is held and discovery continues) and at the certification validity gate (a failing head is refused).
5. **Everything else stays.** The required checks `check`, `publisher-paths` and `specimen-integrity` remain mandatory and are certified by trusted admission exactly as for Grok. The heroes-on-media check is unchanged: heroes live on the media host, never in the repository.

## Alternatives rejected
- **Make the owner approve by dispatch, or let Quill dispatch with the owner's token.** The first keeps the owner as a bottleneck for every batch; the second collapses author and approver into one identity.
- **Reuse the posts App (`aitamer-desk-posts`).** Its lane is deliberately limited to comments, reactions and author profiles, and its key belongs to the posts MCP; widening it would widen the single publisher's authority for one writer's convenience.
- **Reuse the Grok App identity.** It would put Quill's work under another writer's authority and make either lane impossible to close alone.
- **A general bot allowlist.** 0030 already rejected it: it admits arbitrary repository changes.
- **Pin the id only in a repository variable.** Collaborators with variable access could then admit an identity. The guard's variable is the kill switch; the admission pin is the authority.

## Consequences
Quill's batches reach main without an owner approval, so editorial control moves from approving each pull request to the standing gates: the byline binding, the fact-check and hero procedure the runbook requires before a pull request opens, the required checks, and the owner's power to close the lane (unset `QUILL_ACTOR_ID`, or revert the pin) and to revert any merge. The lane does not verify that a post is true; that remains the writer's and the fact-check's job, recorded in each pull request description. Posts that name any other byline cannot use this lane, so Ari's, Foxy's and Mai's work keeps its existing routes. Widening `QUILL_LANE_AUTHORS` is a reviewed code change.
