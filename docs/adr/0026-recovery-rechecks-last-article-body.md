# Recovery rechecks the last admitted article body

## Context

ADR 0025 requires a failed or unacknowledged publication to redeploy the same visible set before another article is admitted. That recovery has `selected: null`, because it adds no article. The original body verifier only checked a non-null `selected` slug. A recovery could therefore receive a successful receipt without proving the story body of the article that caused the recovery. Its new successful run would become the spacing clock for the next admission.

## Decision

A recovery whose `lastPublication.slug` is non-null must compare that article's served story body with the checked build in both preview and production. The production receipt records the recovered slug and equal built and served body hashes. Receipt validation refuses a missing, differently named, or mismatched body proof. The rule is derived from the validated pre-build selection by the shared `expectedArticleBodySlug` function, so live checking and later receipt validation choose the same article.

Recovery still has `selected: null` and adds no visible slug; it is not reported as a newly published article. Recovery of a baseline bootstrap, whose last publication slug is null, has no article body to prove. The existing page, thread, state, smoke, and deployment checks continue to apply.

## Alternatives rejected

- Treat `selected: null` as sufficient for every recovery: this leaves the original unacknowledged article without body proof.
- Change `selected` to the recovered slug: this would misstate the visible-set difference and could falsely report a new publication.
- Rely only on the previous run's body proof: the recovery exists precisely because that run did not provide a trustworthy complete acknowledgment.

## Consequences

A recovery with an inaccessible or changed article body fails closed; the next article remains held. A successful recovery establishes a new verified spacing clock without claiming another article was added.

## Status

Accepted for implementation 2026-10-04 as a correction to ADR 0025's recovery body verification rule. Runtime publication remains subject to the integrated activation gate.
