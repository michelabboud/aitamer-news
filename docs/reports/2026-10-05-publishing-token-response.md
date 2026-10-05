# Publishing token response repair

## What was built
Treat installation tokens as opaque printable ASCII rather than imposing an undocumented alphanumeric format. Reject whitespace, control characters, empty values and oversized responses; validate expiry separately and escape percent bytes in GitHub masking commands. This preserves environment-file injection protection.

## Verification evidence
Seven focused RSA, repository-scope, trust-boundary, revocation and response tests passed. First live admission run 37281709766 failed before publication data writes; preserve that evidence. Live retry is pending.

## Assumptions made
The first response failure is consistent with a token format outside the earlier narrow character whitelist. Separate error messages distinguish format from expiry without exposing credentials.

## Concerns and observations
No article or numbering data changed in the failed prepare. Publication proof remains required.

## Close-out confirmation
Version 0.2.63 reserved for this focused repair. Commit, checkpoint and source PR follow independent review. No cleanup performed; active clones and logs retained.
