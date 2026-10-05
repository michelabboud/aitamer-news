# State protection API visibility repair

## What was built
Verify the administrator-confirmed namespace protection snapshot from trusted main code when GitHub omits its bypass list for limited workflow tokens. Keep active/effective rule checks, reject explicit unsafe bypass lists, and fail closed on snapshot drift. Independent state certificates remain mandatory.

## Verification evidence
Live finalizer 37282561404 stopped before merging Aviram. Administrator API inspection confirmed ruleset 24488522 active, bypass only repository admin role 5 and publishing App 5107739, and all four effective branch restrictions. Settled update marker: 2026-10-05T10:59:20.822+03:00. Seventy-eight focused controller, allocation, integrity and context tests passed; independent security review accepted the frozen delta. Live retry remains pending.

## Assumptions made
GitHub documents that bypass actors are visible only with ruleset write access. Pinning the verified server metadata in trusted code avoids administrator runtime credentials. This timestamp detects configuration drift; it is not a cryptographic revision.

## Concerns and observations
Repository variables are collaborator-writable and cannot provide owner-only attestation. Any protection change requires fresh verification and a reviewed code update. Numbered article PR 180 already passed validation and certification; it remains unmerged.

## Close-out confirmation
Version 0.2.64 reserved for this repair. Checkpoint, PR and normal merge follow source acceptance. Failed run retained; no article or ledger edited locally, no cleanup performed.
